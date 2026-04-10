import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Analytics, getAnalytics } from "firebase/analytics";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
import type { Persistence } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import {
  // @ts-ignore 
  getReactNativePersistence
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyAOBzLCyVllH5XBkqbBgu0qQru-Z3C2HsE",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "atelier-novels.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "atelier-novels",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "atelier-novels.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "386929543777",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "1:386929543777:web:7777d0a567579782107820",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-6NLTRB03RT",
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } catch (error) {
    // initializeAuth throws if auth was already initialized; fall back to getAuth in that case.
    auth = getAuth(app);
  }
}

const db: Firestore = getFirestore(app);

let analytics: Analytics | undefined;
if (Platform.OS === "web") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    analytics = undefined;
  }
}

export { app, analytics, auth, db, firebaseConfig };

export default function() { return null; }
