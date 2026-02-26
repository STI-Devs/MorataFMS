import type { ReactNode } from 'react';
import { createContext, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import type { AuthState, LoginCredentials, RegisterCredentials, User } from '../types/auth.types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<User>;
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

  // Verify session with backend on page load
  useEffect(() => {
    const userStr = localStorage.getItem('user');

    if (userStr) {
      // Verify the session is still valid by hitting the backend
      authApi.getCurrentUser()
        .then((response) => {
          // Session is valid — use fresh user data from backend
          // Depending on API resource wrapping, the user might be under .data or directly in the response
          const userData = (response as any).data ?? response;
          localStorage.setItem('user', JSON.stringify(userData));
          setAuthState({
            user: userData as User,
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

  const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
      const response = await authApi.login(credentials);

      // Store user only - authentication is via session cookie
      localStorage.setItem('user', JSON.stringify(response.user));

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

