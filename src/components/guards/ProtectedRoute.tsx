import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store";

/**
 * Wraps routes that require authentication.
 * If the user is not logged in, redirects to /login.
 *
 * Usage in router config:
 *   { element: <ProtectedRoute />, children: [ ... ] }
 */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
