import { Navigate } from 'react-router-dom';
import { appRoutes } from '../../../../lib/appRoutes';
import { useAuth } from '../../hooks/useAuth';
import { getHomePath } from '../../utils/access';

/**
 * Smart redirect component for the root path ("/").
 * Redirects authenticated users to their correct dashboard based on role.
 * Unauthenticated users go to login.
 */
export function RoleRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={appRoutes.login} replace />;
  }

  return <Navigate to={getHomePath(user)} replace />;
}
