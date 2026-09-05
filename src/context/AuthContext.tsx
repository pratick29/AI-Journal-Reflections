import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        console.error('Auth state error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'current domain';

      if (err.code === 'auth/unauthorized-domain') {
        setError(
          `Unauthorized Domain (${currentHost}): Please add '${currentHost}' to Firebase Console → Authentication → Settings → Authorized Domains.`
        );
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled in your Firebase Project. Enable Google under Firebase Console → Authentication → Sign-in method.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled: The authentication popup was closed before completion.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked: Please allow popups for this site in your browser settings.');
      } else {
        setError(err.message || 'Failed to authenticate with Google.');
      }
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Sign-out error:', err);
      setError(err.message || 'Failed to sign out.');
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signInWithGoogle,
        signOutUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
