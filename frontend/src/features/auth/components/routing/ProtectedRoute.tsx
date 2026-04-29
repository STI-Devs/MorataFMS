import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { appRoutes } from '../../../../lib/appRoutes';
import type { AppRole } from '../../../../types/access';
import { useAuth } from '../../hooks/useAuth';
import { getHomePath } from '../../utils/access';

interface ProtectedRouteProps {
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const parentContext = useOutletContext();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={appRoutes.login} state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return <Outlet context={parentContext} />;
}
