import type { ReactNode } from 'react';
import { createContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authApi } from '../api/authApi';
import type { AuthState, LoginCredentials, RegisterCredentials, User } from '../types/auth.types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export the context so it can be used in custom hooks
export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Listen for unauthorized events from axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      // Only show the toast if we actually had a user stored
      if (localStorage.getItem('user')) {
        toast.error('You have been signed out. Please log in again to continue.', {
          duration: 6000,
        });
      }
      
      localStorage.removeItem('user');
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized as EventListener);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized as EventListener);
  }, []);

  // Verify session with backend on page load
  useEffect(() => {
    const userStr = localStorage.getItem('user');

    if (userStr) {
      // Verify the session is still valid by hitting the backend
      authApi.getCurrentUser()
        .then((response) => {
          // Session is valid — use fresh user data from backend
          // Handle both wrapped { data: User } and direct User response
          const raw = response as unknown as Record<string, unknown>;
          const userData = (raw.data ? raw.data : raw) as User;
          localStorage.setItem('user', JSON.stringify(userData));
          setAuthState({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
          });
        })
        .catch(() => {
          // Session expired — clear stale localStorage
          // The 401 interceptor in axios.ts will handle the redirect
          localStorage.removeItem('user');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authApi.login(credentials);

      // Store user only - authentication is via session cookie
      localStorage.setItem('user', JSON.stringify(response.user));

      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
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
      // Clear local storage and state
      localStorage.removeItem('user');

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const setUser = (user: User | null) => {
    setAuthState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user,
    }));
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      const response = await authApi.register(credentials);

      localStorage.setItem('user', JSON.stringify(response.user));

      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

