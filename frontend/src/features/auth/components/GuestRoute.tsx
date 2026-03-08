import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function GuestRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to correct dashboard based on role
    const redirectTo = user?.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
