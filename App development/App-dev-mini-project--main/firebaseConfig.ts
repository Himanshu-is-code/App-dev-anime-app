import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";


let app;
let auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Try the modern approach for persistence, with fallbacks.
try {
  // Dynamically require to avoid compile-time errors if the module doesn't exist.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getReactNativePersistence } = require('firebase/auth/react-native');
  const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (err) {
  // If the react-native entry isn't present, fall back to the default web getAuth().
  // This keeps TypeScript happy while maintaining functionality.
  console.warn("Could not initialize auth with React Native persistence. Falling back to default.", err);
  auth = getAuth(app);
}

const typedAuth: Auth = auth;

export { app, typedAuth as auth };