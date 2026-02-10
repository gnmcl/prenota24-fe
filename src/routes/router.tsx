import { createBrowserRouter, Navigate } from "react-router-dom";
import { CreateStudioPage, CreateAdminUserPage, DashboardPage } from "../pages";

/**
 * Application route tree.
 *
 * /                    → redirects into the setup wizard
 * /setup/studio        → Step 1: create a Studio
 * /setup/admin         → Step 2: create the Admin user
 * /dashboard           → post-setup landing page
 * *                    → catch-all redirect
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/setup/studio" replace />,
  },
  {
    path: "/setup/studio",
    element: <CreateStudioPage />,
  },
  {
    path: "/setup/admin",
    element: <CreateAdminUserPage />,
  },
  {
    path: "/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "*",
    element: <Navigate to="/setup/studio" replace />,
  },
]);
