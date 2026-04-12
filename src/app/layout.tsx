import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

// Root layout: wraps every page — fonts, <html>/<body>, metadata, and future auth/theme providers.
export const metadata: Metadata = {
  title: "Micro-Portfolio Builder",
  description: "Build a small portfolio site as a student coder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
