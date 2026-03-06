import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth'; // <-- Trik jalan belakang mengatasi TS Error
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

let app;
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;

// Mencegah inisialisasi ganda (terutama saat Hot Reloading)
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  
  // Inisialisasi Auth khusus React Native agar sesi login tidak hilang
  // FIX: Menggunakan (firebaseAuth as any) agar TypeScript berhenti protes
  auth = initializeAuth(app, {
    persistence: (firebaseAuth as any).getReactNativePersistence(AsyncStorage),
  });

  // INISIALISASI FIRESTORE DENGAN OFFLINE PERSISTENCE
  // Ini adalah kunci agar aplikasi bisa membaca dan menulis data tanpa internet!
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) })
  });
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
