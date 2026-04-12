import type { ReactNode } from "react";

// Builder shell: top bar, sidebar, or mobile nav for authenticated (app) routes.

export function AppShell({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
