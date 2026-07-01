import { getCurrentUser } from '@/services/api';
import type { UserProfile } from '@/types/ridekorea';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = 'auth_token';

async function getStoredAuthToken() {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(AUTH_TOKEN_KEY);
  }

  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

async function setStoredAuthToken(accessToken: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    }
    return;
  }

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, accessToken);
}

async function deleteStoredAuthToken() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

interface AuthSessionContextValue {
  token: string | null;
  userProfile: UserProfile | null;
  isAuthChecked: boolean;
  refreshSession: () => Promise<void>;
  signIn: (accessToken: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const loadProfile = useCallback(async (accessToken: string) => {
    const profile = await getCurrentUser(accessToken);
    setUserProfile(profile);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const storedToken = await getStoredAuthToken();
      setToken(storedToken);

      if (storedToken) {
        await loadProfile(storedToken);
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.log('Auth token restore error', err);
      setToken(null);
      setUserProfile(null);
    } finally {
      setIsAuthChecked(true);
    }
  }, [loadProfile]);

  const signIn = useCallback(async (accessToken: string) => {
    await setStoredAuthToken(accessToken);
    setToken(accessToken);
    await loadProfile(accessToken);
    setIsAuthChecked(true);
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await deleteStoredAuthToken();
    setToken(null);
    setUserProfile(null);
    setIsAuthChecked(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshSession();
    }, 0);

    return () => clearTimeout(timer);
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      token,
      userProfile,
      isAuthChecked,
      refreshSession,
      signIn,
      signOut,
    }),
    [token, userProfile, isAuthChecked, refreshSession, signIn, signOut],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider');
  }
  return context;
}
