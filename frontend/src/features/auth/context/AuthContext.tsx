import type { ReactNode } from 'react';
import { createContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '../api/authApi';
import { restoreSession, syncRestoreSessionPromise } from './authProviderState';
import type { AuthState, LoginCredentials, User } from '../types/auth.types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  retryBootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    bootstrapError: null,
  });
  const wasAuthenticatedRef = useRef(false);

  const setBootstrapResolvedState = (user: User | null) => {
    syncRestoreSessionPromise(user);
    setAuthState({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      bootstrapError: null,
    });
  };

  const setBootstrapUnavailableState = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      bootstrapError: 'service-unavailable',
    });
  };

  const runBootstrap = async () => {
    setAuthState((current) => ({
      ...current,
      isLoading: true,
      bootstrapError: null,
    }));

    try {
      const user = await restoreSession();

      setBootstrapResolvedState(user);
    } catch {
      setBootstrapUnavailableState();
    }
  };

  useEffect(() => {
    wasAuthenticatedRef.current = authState.isAuthenticated;
  }, [authState.isAuthenticated]);

  useEffect(() => {
    const handleUnauthorized = () => {
      queryClient.clear();

      if (wasAuthenticatedRef.current) {
        toast.error('You have been signed out. Please log in again to continue.', {
          duration: 6000,
        });
      }

      syncRestoreSessionPromise(null);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        bootstrapError: null,
      });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized as EventListener);

    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized as EventListener);
  }, [queryClient]);

  useEffect(() => {
    let isMounted = true;

    void restoreSession()
      .then((user) => {
        if (!isMounted) {
          return;
        }

        setBootstrapResolvedState(user);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setBootstrapUnavailableState();
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
      const response = await authApi.login(credentials);

      queryClient.clear();
      syncRestoreSessionPromise(response.user);
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        bootstrapError: null,
      });

      return response.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      queryClient.clear();
      syncRestoreSessionPromise(null);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        bootstrapError: null,
      });
    }
  };

  const setUser = (user: User | null) => {
    syncRestoreSessionPromise(user);
    setAuthState((prev) => ({
      ...prev,
      user,
      isAuthenticated: !!user,
      bootstrapError: null,
    }));
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, setUser, retryBootstrap: runBootstrap }}>
      {children}
    </AuthContext.Provider>
  );
}
