import type { ReactNode } from 'react';
import { createContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { isAxiosError } from '../../../lib/apiErrors';
import { authApi, InvalidCurrentUserPayloadError } from '../api/authApi';
import type { AuthState, LoginCredentials, User } from '../types/auth.types';
import { clearAuthToken, getAuthToken, setAuthToken } from '../utils/tokenStorage';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let restoreSessionPromise: Promise<User | null> | null = null;
let restoreSessionToken: string | null = null;

function syncRestoreSessionPromise(user: User | null, token: string | null): void {
  restoreSessionToken = token;
  restoreSessionPromise = Promise.resolve(user);
}

function restoreSession(): Promise<User | null> {
  const token = getAuthToken();

  if (!token) {
    syncRestoreSessionPromise(null, null);
    return restoreSessionPromise ?? Promise.resolve(null);
  }

  if (!restoreSessionPromise || restoreSessionToken !== token) {
    restoreSessionToken = token;
    restoreSessionPromise = authApi.getCurrentUser()
      .then((user) => {
        syncRestoreSessionPromise(user, token);
        return user;
      })
      .catch((error: unknown) => {
        if (
          error instanceof InvalidCurrentUserPayloadError
          || (error instanceof Error && error.name === 'InvalidCurrentUserPayloadError')
          || (isAxiosError(error) && error.response?.status === 401)
        ) {
          clearAuthToken();
          syncRestoreSessionPromise(null, null);
          return null;
        }

        restoreSessionPromise = null;
        restoreSessionToken = null;
        throw error;
      });
  }

  return restoreSessionPromise;
}

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

      clearAuthToken();
      syncRestoreSessionPromise(null, null);
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

      setAuthToken(response.token);
      syncRestoreSessionPromise(response.user, response.token);
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
      clearAuthToken();
      syncRestoreSessionPromise(null, null);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const setUser = (user: User | null) => {
    syncRestoreSessionPromise(user, getAuthToken());
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
