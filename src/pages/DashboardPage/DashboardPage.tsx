import { Navigate } from "react-router-dom";

import { useSetupStore } from "../../store";
import { Card, Button } from "../../components/ui";
import { PageShell } from "../../components/layout";

export function DashboardPage() {
  const studio = useSetupStore((s) => s.studio);
  const adminUser = useSetupStore((s) => s.adminUser);
  const setupComplete = useSetupStore((s) => s.setupComplete);
  const reset = useSetupStore((s) => s.reset);

  if (!setupComplete || !studio || !adminUser) {
    return <Navigate to="/setup/studio" replace />;
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mb-8 text-gray-500">
          Welcome to <span className="font-semibold text-gray-700">{studio.name}</span>.
          Your studio is ready.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Studio info card */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Studio
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900">{studio.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">
                  {studio.email ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium text-gray-900">
                  {studio.phone ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Timezone</dt>
                <dd className="font-medium text-gray-900">{studio.timezone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">ID</dt>
                <dd className="font-mono text-xs text-gray-400">{studio.id}</dd>
              </div>
            </dl>
          </Card>

          {/* Admin info card */}
          <Card>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Admin User
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">{adminUser.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Role</dt>
                <dd>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {adminUser.role}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Active</dt>
                <dd className="font-medium text-gray-900">
                  {adminUser.active ? "Yes" : "No"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">ID</dt>
                <dd className="font-mono text-xs text-gray-400">{adminUser.id}</dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* Placeholder CTA */}
        <Card className="mt-8 text-center">
          <p className="mb-4 text-gray-500">
            🚧 More features are coming soon — professionals, services,
            availability, and appointments.
          </p>
          <Button variant="secondary" onClick={reset}>
            Reset Setup
          </Button>
        </Card>
      </div>
    </PageShell>
  );
}
