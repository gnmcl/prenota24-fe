import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-6">
          <h1 className="text-lg font-bold tracking-tight text-indigo-600">
            Prenota24
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
