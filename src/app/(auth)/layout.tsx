import type { ReactNode } from "react";

// Layout for auth routes — centered card, minimal chrome, optional redirect if already logged in.

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
