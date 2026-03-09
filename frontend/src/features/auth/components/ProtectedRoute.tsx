import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

/** Returns the most appropriate home path for the user's role/department. */
function getHomePath(role: string, departments: string[]): string {
  if (role === 'admin') return '/transactions';
  if (role === 'encoder') return '/tracking';
  // Legal-only roles
  if (departments.includes('legal')) return '/law-firm';
  return '/tracking';
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based access control — redirect to the user's own home page
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const home = getHomePath(user.role, user.departments ?? []);
    return <Navigate to={home} replace />;
  }

  // Forward parent context (e.g. MainLayout's { user, dateTime }) to nested pages
  return <Outlet context={parentContext} />;
}
