import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useAuth } from './AuthContext';

// --- Color palettes ---
const lightColors = {
  background: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  card: '#FFFFFF',
  primary: '#38e07b',
  googleButton: '#FFFFFF',
  googleButtonText: '#1F2937',
  inputBackground: '#E5E7EB',
  appleButton: '#000000',
  appleButtonText: '#FFFFFF',
  danger: '#EF4444',
};

const darkColors = {
  background: '#122017',
  text: '#FFFFFF',
  textSecondary: '#a0aec0',
  card: 'rgba(255, 255, 255, 0.05)',
  primary: '#38e07b',
  googleButton: '#4285F4',
  googleButtonText: '#FFFFFF',
  inputBackground: '#2d3748',
  appleButton: '#FFFFFF',
  appleButtonText: '#000000',
  danger: '#F87171',
};

export default function AuthModalScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? darkColors : lightColors;
  const styles = useMemo(() => getStyles(themeColors), [colorScheme]);
  const { user, isLoading, signInWithGoogle, signOut, signInWithEmail, signUpWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Simple toggle between 'signin' and 'signup' modes for the email form
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const handleSignIn = async (provider: 'Google' | 'Apple') => {
    if (provider === 'Google') {
      const result = await signInWithGoogle();
      if (result) {
        // Optional: Show a success alert before closing
        Alert.alert('Success', 'You have successfully signed in!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        // Show an error alert if sign-in fails
        Alert.alert('Sign-In Failed', 'Could not sign in with Google. Please try again.');
      }
    }
    // Apple sign-in logic would go here
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }
    const action = authMode === 'signin' ? signInWithEmail : signUpWithEmail;
    const result = await action(email, password);

    if (result.success) {
      Alert.alert('Success', `You have successfully ${authMode === 'signin' ? 'signed in' : 'signed up'}!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Authentication Failed', result.error || 'An unknown error occurred. Please try again.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        {isLoading && <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color={themeColors.primary} />}
        <View style={styles.header}>
          <Text style={styles.title}>{user ? 'Account' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>
        {user ? (
          <View style={styles.content}>
            <Text style={styles.infoText}>You are signed in as {user.displayName || user.email}.</Text>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={22} color={themeColors.danger} />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.infoText}>Sign in to sync your tracked anime, watch later list, and more across devices.</Text>
            
            {/* Email/Password Form */}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={themeColors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={themeColors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity style={[styles.button, { backgroundColor: themeColors.primary }]} onPress={handleEmailAuth}>
              <Text style={[styles.buttonText, { color: '#111' }]}>{authMode === 'signin' ? 'Sign In with Email' : 'Create Account'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>
              <Text style={styles.toggleText}>{authMode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}</Text>
            </TouchableOpacity>

            {/* --- OR Separator --- */}
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>OR</Text>
              <View style={styles.separatorLine} />
            </View>

            <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={() => handleSignIn('Google')}>
              <Ionicons name="logo-google" size={22} color={themeColors.googleButtonText} />
              <Text style={[styles.buttonText, { color: themeColors.googleButtonText }]}>Sign in with Google</Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity style={[styles.button, styles.appleButton]} onPress={() => handleSignIn('Apple')}>
                <Ionicons name="logo-apple" size={22} color={themeColors.appleButtonText} />
                <Text style={[styles.buttonText, { color: themeColors.appleButtonText }]}>Sign in with Apple</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (themeColors: typeof lightColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: themeColors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  input: {
    backgroundColor: themeColors.inputBackground,
    color: themeColors.text,
    borderRadius: 12,
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  toggleText: {
    color: themeColors.primary,
    marginBottom: 20,
    marginTop: 4,
    fontWeight: '600',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: themeColors.inputBackground,
  },
  separatorText: {
    marginHorizontal: 10,
    color: themeColors.textSecondary,
    fontWeight: '500',
  },
  googleButton: {
    backgroundColor: themeColors.googleButton,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
  },
  appleButton: {
    backgroundColor: themeColors.appleButton,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: themeColors.card,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
  },
  signOutButtonText: {
    color: themeColors.danger,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});