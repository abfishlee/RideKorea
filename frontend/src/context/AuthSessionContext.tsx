import { getCurrentUser } from '@/services/api';
import type { UserProfile } from '@/types/ridekorea';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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
      const storedToken = await SecureStore.getItemAsync('auth_token');
      setToken(storedToken);

      if (storedToken) {
        await loadProfile(storedToken);
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.log('SecureStore read error', err);
      setToken(null);
      setUserProfile(null);
    } finally {
      setIsAuthChecked(true);
    }
  }, [loadProfile]);

  const signIn = useCallback(async (accessToken: string) => {
    await SecureStore.setItemAsync('auth_token', accessToken);
    setToken(accessToken);
    await loadProfile(accessToken);
    setIsAuthChecked(true);
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync('auth_token');
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
