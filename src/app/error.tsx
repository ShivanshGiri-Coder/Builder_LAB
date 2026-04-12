"use client";

// Error boundary for this route segment — recovery UI and error reporting.

export default function Error({
  error: _error,
  reset: _reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return null;
}
