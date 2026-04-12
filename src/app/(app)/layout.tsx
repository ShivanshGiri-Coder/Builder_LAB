import type { ReactNode } from "react";

// Layout for logged-in builder area — sidebar, nav, or shell around portfolio editor routes.

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
