import type { ReactNode } from 'react';
import { createContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { authApi } from '../api/authApi';
import { restoreSession, syncRestoreSessionPromise } from './authProviderState';
import type { AuthState, LoginCredentials, User } from '../types/auth.types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const wasAuthenticatedRef = useRef(false);

  useEffect(() => {
    wasAuthenticatedRef.current = authState.isAuthenticated;
  }, [authState.isAuthenticated]);

  useEffect(() => {
    const handleUnauthorized = () => {
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
      });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized as EventListener);

    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized as EventListener);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void restoreSession()
      .then((user) => {
        if (!isMounted) {
          return;
        }

        setAuthState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        });
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
      const response = await authApi.login(credentials);

      syncRestoreSessionPromise(response.user);
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
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
      syncRestoreSessionPromise(null);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const setUser = (user: User | null) => {
    syncRestoreSessionPromise(user);
    setAuthState((prev) => ({
      ...prev,
      user,
      isAuthenticated: !!user,
    }));
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
