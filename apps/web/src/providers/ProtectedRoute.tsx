/**
 * ProtectedRoute — Auth guard for Command Center routes.
 * Renders <Outlet /> when authenticated.
 * Renders nothing (blank) while the initial auth check is in progress.
 * Redirects to /command/login when unauthenticated, preserving the original URL.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from './AuthProvider';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  // Blank screen during the initial session check — no flash of protected content
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/command/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
}
