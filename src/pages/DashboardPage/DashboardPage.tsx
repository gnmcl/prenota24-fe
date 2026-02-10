import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store";
import { Card, Button } from "../../components/ui";
import { PageShell } from "../../components/layout";

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // ProtectedRoute already guards unauthenticated access,
  // but we narrow the type here for safety.
  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-500">
              Welcome back, <span className="font-semibold text-gray-700">{user.email}</span>
            </p>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            Sign out
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* User info card */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Your Account
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">{user.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Role</dt>
                <dd>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {user.role}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Studio ID</dt>
                <dd className="font-mono text-xs text-gray-400">{user.studioId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">User ID</dt>
                <dd className="font-mono text-xs text-gray-400">{user.id}</dd>
              </div>
            </dl>
          </Card>

          {/* Placeholder card */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Quick Actions
            </h3>
            <p className="text-sm text-gray-500">
              🚧 More features coming soon — professionals, services,
              availability, and appointments.
            </p>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
