// app/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, signOut as firebaseSignOut, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

WebBrowser.maybeCompleteAuthSession();

// --- Configure these two values ---
const WEB_CLIENT_ID = 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com';
// Make sure this exact redirect URI is added to your Google Console (Authorized redirect URIs)
// e.g. https://auth.expo.io/@your-username/your-app-slug
// We'll compute it below using AuthSession.makeRedirectUri with the expo proxy.

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = auth ? auth && (auth as any).onAuthStateChanged?.( (u: User | null) => { setUser(u ?? null); setIsLoading(false); }) : () => {};
    // Prefer onAuthStateChanged import if available; your original code used it already.
    // If you used onAuthStateChanged from firebase/auth, the code above isn't needed — keep your original onAuthStateChanged logic.
    return () => {
      try { unsub(); } catch { /* noop */ }
    };
  }, []);

  // Build a redirectUri that uses Expo proxy in dev. Types for makeRedirectUri may not include `useProxy`,
  // so cast the options arg to any (safe and contained).
  const redirectUri = React.useMemo(
    () => AuthSession.makeRedirectUri((({ useProxy: true } as unknown) as any)),
    []
  );
  console.log('Computed redirectUri (must be added to Google Console):', redirectUri);

  // Create the Google ID token request, passing the explicit redirectUri.
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: WEB_CLIENT_ID,
    redirectUri,
    // If you also want native flows, provide iosClientId/androidClientId/expoClientId too.
  });

  // Log the full authorization URL that will be opened.
  useEffect(() => {
    if (request) {
      console.log('Auth request.url ->', (request as any).url);
    }
  }, [request]);

  // Handle the response from Google and exchange id_token for firebase credential
  useEffect(() => {
    (async () => {
      // Log the raw response from Google for debugging.
      if (response) {
        console.log('Google response:', response);
        if ((response as any).params?.error_description) {
          console.error('Google error description:', (response as any).params.error_description);
        }
      }
      if (!response) return;
      try {
        if (response.type === 'success') {
          // id_token sometimes appears as response.params.id_token or idToken
          const resAny = response as any;
          const id_token = resAny?.params?.id_token ?? resAny?.params?.idToken;
          if (!id_token) {
            console.error('Google Sign-In: id_token missing in response.', response);
            return;
          }
          const credential = GoogleAuthProvider.credential(id_token);
          await signInWithCredential(auth, credential);
        } else if (response.type === 'error') {
          console.error('Google Sign-In Response Error:', response.error);
        }
      } catch (err) {
        console.error('Error handling Google response:', err);
      }
    })();
  }, [response]);

  // Trigger the Google prompt. We do NOT pass { useProxy: true } here (TS types reject it).
  // The redirectUri already encodes the proxy behavior.
  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await promptAsync();
      // result.type === 'success' likely handled in the response effect above.
      return result.type === 'success';
    } catch (err) {
      console.error('Google Sign-In promptAsync Error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [promptAsync]);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err: any) {
      console.error('Email Sign-In Error:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err: any) {
      console.error('Email Sign-Up Error:', err);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Sign-Out Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = { user, isLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
