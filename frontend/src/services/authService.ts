import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import axios from 'axios';

const API_URL = import.meta.env.VITE_CASH_API_URL || 'http://localhost:3001';

export interface AuthUser {
  uid: string;
  email: string | null;
  name: string | null;
  emailVerified: boolean;
}

/**
 * Convert Firebase User to AuthUser
 */
const firebaseUserToAuthUser = (user: { uid: string; email: string | null; displayName: string | null; emailVerified: boolean }): AuthUser => {
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName || user.email?.split('@')[0] || null,
    emailVerified: user.emailVerified,
  };
};

/**
 * Sign up a new user
 */
export const signUp = async (
  email: string,
  password: string,
  name?: string
): Promise<AuthUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update display name if provided
    if (name && userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
    }

    // Save user profile to Firestore
    try {
      const { saveUserProfile } = await import('./userService');
      await saveUserProfile(userCredential.user.uid, {
        uid: userCredential.user.uid,
        email: email,
        name: name || email.split('@')[0],
        username: name || email.split('@')[0],
        showEmail: true,
      });
    } catch (error) {
      // Firestore save failed; continue without blocking signup
    }

    // Optionally create user in backend for additional metadata
    try {
      await axios.post(`${API_URL}/api/auth/signup`, {
        email,
        password,
        name,
      });
    } catch (error) {
      // Backend signup is optional; ignore backend failures during signup
    }

    return firebaseUserToAuthUser(userCredential.user);
  } catch (error: any) {
    const code = error?.code || error?.message || 'unknown';
    const msg = getAuthErrorMessage(code);
    const wrapped: any = new Error(msg);
    wrapped.code = code;
    throw wrapped;
  }
};

/**
 * Sign in an existing user
 */
export const signIn = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    return firebaseUserToAuthUser(userCredential.user);
  } catch (error: any) {
    const code = error?.code || error?.message || 'unknown';
    const msg = getAuthErrorMessage(code);
    const wrapped: any = new Error(msg);
    wrapped.code = code;
    throw wrapped;
  }
};

/**
 * Sign out the current user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    const code = error?.code || error?.message || 'unknown';
    const msg = getAuthErrorMessage(code);
    const wrapped: any = new Error(msg);
    wrapped.code = code;
    throw wrapped;
  }
};

/**
 * Send password reset email using Firebase
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    const code = error?.code || error?.message || 'unknown';
    const msg = getAuthErrorMessage(code);
    const wrapped: any = new Error(msg);
    wrapped.code = code;
    throw wrapped;
  }
};

/**
 * Get the current user's ID token
 */
export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken();
  } catch (error: any) {
    const code = error?.code || error?.message || 'unknown';
    const msg = getAuthErrorMessage(code);
    const wrapped: any = new Error(msg);
    wrapped.code = code;
    throw wrapped;
  }
};

/**
 * Verify token with backend
 */
export const verifyToken = async (token: string): Promise<AuthUser> => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/verify`, { token });
    return response.data.user;
  } catch (error: any) {
    throw new Error('Token verification failed');
  }
};

/**
 * Get current user info from backend
 */
export const getCurrentUser = async (): Promise<AuthUser> => {
  try {
    const token = await getIdToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.user;
  } catch (error: any) {
    throw new Error('Failed to get current user');
  }
};

/**
 * Convert Firebase error codes to user-friendly messages
 * Separates email errors from password errors for better UX
 */
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address. Please enter a valid email.';
    case 'auth/operation-not-allowed':
      return 'This operation is not allowed.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use a stronger password with at least 8 characters, including uppercase, lowercase, number, and symbol.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please sign up first or check your email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or use "Forgot Password" to reset it.';
    case 'auth/invalid-credential':
      // Firebase v10+ uses invalid-credential for both wrong email and password
      // We'll need to check which one it is, but for now show a generic message
      // The actual error handling in components will help differentiate
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later or reset your password.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    default:
      return 'An error occurred. Please try again.';
  }
};

