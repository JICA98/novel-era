import { Platform } from "react-native";
import Constants from "expo-constants";
import { createStore } from "../downloads/utils";
import { auth } from "../firebase";
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";

type GoogleSigninModule = typeof import("@react-native-google-signin/google-signin");

let GoogleSigninNative: GoogleSigninModule["GoogleSignin"] | undefined;
let googleStatusCodes: GoogleSigninModule["statusCodes"] | undefined;

if (Platform.OS !== "web") {
  try {
    const googleSignInModule: GoogleSigninModule = require("@react-native-google-signin/google-signin");
    GoogleSigninNative = googleSignInModule.GoogleSignin;
    googleStatusCodes = googleSignInModule.statusCodes;
  } catch (nativeImportError) {
    console.warn("Failed to load native Google Sign-In module", nativeImportError);
  }
}

export enum AuthState {
  SIGNED_IN,
  SIGNED_OUT,
}

export interface AuthUser {
  authId?: string;
  email: string;
  state: AuthState;
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

interface GoogleExtraConfig {
  googleWebClientId?: string;
  googleIosClientId?: string;
}

const googleExtraConfig = (Constants.expoConfig?.extra ?? {}) as GoogleExtraConfig;
let googleNativeConfigured = false;

export const authStateStore = createStore({
  email: "",
  state: AuthState.SIGNED_OUT,
} as AuthUser);

authStateStore.getState().setContent({
  email: "",
  state: AuthState.SIGNED_OUT,
} as AuthUser);

type SetAuthState = (user: AuthUser) => void;

type Rejector = (reason?: any) => void;

type Resolver = (value: AuthUser | PromiseLike<AuthUser>) => void;

export function setUpAuthUser(setAuthState: SetAuthState): Promise<AuthUser> {
  let alreadyResolved = false;

  return new Promise<AuthUser>((resolve: Resolver, reject: Rejector) => {
    try {
      onAuthStateChanged(auth, (user: User | null) => {
        const authUser = user
          ? mapFirebaseUser(user)
          : ({ email: "", state: AuthState.SIGNED_OUT } as AuthUser);

        setAuthState(authUser);

        if (!alreadyResolved) {
          alreadyResolved = true;
          resolve(authUser);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (error) {
    throw new Error(extractFirebaseMessage(error, "Unable to sign in."));
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<void> {
  try {
    const credentials = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (credentials.user && !credentials.user.emailVerified) {
      try {
        await sendEmailVerification(credentials.user);
      } catch (verificationError) {
        console.warn("Failed to send verification email", verificationError);
      }
    }
  } catch (error) {
    throw new Error(extractFirebaseMessage(error, "Unable to create account."));
  }
}

export async function signInWithGoogle(): Promise<void> {
  try {
    if (Platform.OS !== "web") {
      ensureNativeGoogleConfigured();
      if (!GoogleSigninNative) {
        throw new Error("Google Sign-In native module is unavailable.");
      }

      if (Platform.OS === "android") {
        await GoogleSigninNative.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      const { idToken } = await GoogleSigninNative.signIn();
      if (!idToken) {
        throw new Error("Google sign-in did not return an ID token.");
      }
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      return;
    }

    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    const message =
      resolveGoogleNativeError(error) ?? extractFirebaseMessage(error, "Google sign-in failed.");
    throw new Error(message);
  }
}

export async function signOutUser(): Promise<void> {
  try {
    if (Platform.OS !== "web" && googleNativeConfigured && GoogleSigninNative) {
      try {
        await GoogleSigninNative.signOut();
      } catch (nativeSignOutError) {
        console.warn("Failed to sign out from Google natively", nativeSignOutError);
      }
    }
    await signOut(auth);
  } catch (error) {
    throw new Error(extractFirebaseMessage(error, "Unable to sign out."));
  }
}

function mapFirebaseUser(user: User): AuthUser {
  return {
    authId: user.uid,
    email: user.email ?? "",
    state: AuthState.SIGNED_IN,
  };
}

function extractFirebaseMessage(error: unknown, fallback: string): string {
  if (error instanceof FirebaseError) {
    const mapped = firebaseErrorCodeMap[error.code];
    if (mapped) {
      return mapped;
    }
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

const firebaseErrorCodeMap: Record<string, string> = {
  "auth/invalid-credential": "Invalid email or password.",
  "auth/user-not-found": "Account not found. Please create one before signing in.",
  "auth/wrong-password": "Invalid email or password.",
  "auth/email-already-in-use": "This email is already linked to an account.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/popup-closed-by-user": "Google sign-in was cancelled before completion.",
  "auth/cancelled-popup-request": "Cancelled Google sign-in request.",
};

function ensureNativeGoogleConfigured(): void {
  if (Platform.OS === "web" || googleNativeConfigured) {
    return;
  }

  if (!GoogleSigninNative) {
    throw new Error("Google Sign-In native module is unavailable.");
  }

  const webClientId = googleExtraConfig.googleWebClientId;
  if (!webClientId) {
    throw new Error(
      "Missing googleWebClientId in Expo config. Update app.json extra.googleWebClientId with your Web Client ID."
    );
  }

  GoogleSigninNative.configure({
    webClientId,
    iosClientId: googleExtraConfig.googleIosClientId,
    offlineAccess: false,
  });

  googleNativeConfigured = true;
}

function resolveGoogleNativeError(error: unknown): string | undefined {
  if (!error || Platform.OS === "web") {
    return undefined;
  }

  if (typeof error === "object" && "code" in error) {
    const code = (error as { code?: string }).code;
    if (typeof code === "string" && googleStatusCodes) {
      if (code === googleStatusCodes.SIGN_IN_CANCELLED || code === String(googleStatusCodes.SIGN_IN_CANCELLED)) {
        return "Google sign-in was cancelled.";
      }
      if (code === googleStatusCodes.IN_PROGRESS || code === String(googleStatusCodes.IN_PROGRESS)) {
        return "Another Google sign-in request is already in progress.";
      }
      if (
        code === googleStatusCodes.PLAY_SERVICES_NOT_AVAILABLE ||
        code === String(googleStatusCodes.PLAY_SERVICES_NOT_AVAILABLE)
      ) {
        return "Google Play Services is unavailable or needs to be updated.";
      }
    }
  }

  return undefined;
}
