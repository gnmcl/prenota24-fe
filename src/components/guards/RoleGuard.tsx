import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store";
import type { AppUserRole } from "../../types";

interface RoleGuardProps {
  /** Roles allowed to access the child routes */
  allowed: AppUserRole[];
}

/**
 * Restricts access based on the authenticated user's role.
 * Must be nested inside a ProtectedRoute (user is guaranteed authenticated).
 *
 * If the role is not in `allowed`, redirects:
 *   ADMIN        → /dashboard
 *   PROFESSIONAL → /agenda
 *   fallback     → /login
 *
 * Usage:
 *   { element: <RoleGuard allowed={["ADMIN"]} />, children: [...] }
 */
export function RoleGuard({ allowed }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed.includes(user.role)) {
    // Send the user to their "home" page
    const fallback = user.role === "ADMIN" ? "/dashboard" : "/agenda";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
