import { PageShell } from "../../components/layout";
import { Card } from "../../components/ui";

/**
 * Placeholder page for PROFESSIONAL users.
 * Will be replaced with a real agenda view in a future phase.
 */
export function AgendaPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Agenda</h2>
        <Card className="text-center">
          <p className="text-gray-500">
            🚧 The professional agenda is coming soon.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
