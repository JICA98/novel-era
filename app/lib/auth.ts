import { Platform } from "react-native";
import { createStore } from "../downloads/utils";
import { auth } from "../firebase";
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";

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
      throw new Error(
        "Google sign-in for native platforms is not configured yet. Please add native Google Sign-In support."
      );
    }

    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    throw new Error(extractFirebaseMessage(error, "Google sign-in failed."));
  }
}

export async function signOutUser(): Promise<void> {
  try {
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
