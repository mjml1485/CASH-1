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

const firebaseUserToAuthUser = (user: { uid: string; email: string | null; displayName: string | null; emailVerified: boolean }): AuthUser => {
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName || user.email?.split('@')[0] || null,
    emailVerified: user.emailVerified,
  };
};

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

    if (name && userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
    }

    try {
      const defaultUsername = name || email.split('@')[0];
      const token = await userCredential.user.getIdToken();
      await axios.post(`${API_URL}/api/users`, { name: name || email.split('@')[0], username: defaultUsername }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn('Backend profile create failed', err);
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

export const verifyToken = async (token: string): Promise<AuthUser> => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/verify`, { token });
    return response.data.user;
  } catch (error: any) {
    throw new Error('Token verification failed');
  }
};

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
      return 'No account found with this email address. Please sign up first or check your email.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later or reset your password.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    default:
      return 'An error occurred. Please try again.';
  }
};

