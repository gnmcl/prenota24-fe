import { createBrowserRouter, Navigate } from "react-router-dom";
import {
  CreateStudioPage,
  CreateAdminUserPage,
  DashboardPage,
  LoginPage,
  AgendaPage,
} from "../pages";
import { ProtectedRoute, RoleGuard } from "../components/guards";

/**
 * Application route tree.
 *
 * PUBLIC
 *   /login              → Login page
 *   /setup/studio       → Step 1: create a Studio
 *   /setup/admin        → Step 2: create the Admin user
 *
 * PROTECTED (require authentication)
 *   /dashboard          → Admin landing page
 *   /agenda             → Professional landing page (placeholder)
 *
 * REDIRECTS
 *   /                   → /login
 *   *                   → /login
 */
export const router = createBrowserRouter([
  /* ── Public routes ─────────────────────── */
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/setup/studio",
    element: <CreateStudioPage />,
  },
  {
    path: "/setup/admin",
    element: <CreateAdminUserPage />,
  },

  /* ── Protected routes ──────────────────── */
  {
    element: <ProtectedRoute />,
    children: [
      /* Admin-only */
      {
        element: <RoleGuard allowed={["ADMIN"]} />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
        ],
      },
      /* Professional-only */
      {
        element: <RoleGuard allowed={["PROFESSIONAL"]} />,
        children: [
          {
            path: "/agenda",
            element: <AgendaPage />,
          },
        ],
      },
    ],
  },

  /* ── Redirects ─────────────────────────── */
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
