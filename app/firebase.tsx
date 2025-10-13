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
  apiKey: "AIzaSyDqug99SsA5fdOlUi6sfNdwkUGU6rCoZos",
  authDomain: "novel-era.firebaseapp.com",
  projectId: "novel-era",
  storageBucket: "novel-era.firebasestorage.app",
  messagingSenderId: "592249265367",
  appId: "1:592249265367:web:3a4c784a3fda6650822492",
  measurementId: "G-KXWS9BTQ9K",
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
