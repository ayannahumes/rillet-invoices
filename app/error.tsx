"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

// Catches runtime errors from the invoices page (e.g. the database being
// unreachable). Kept fully grayscale and calm — the red accent stays reserved
// for risk, not chrome. unstable_retry re-fetches and re-renders the segment.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-4xl font-medium text-ink">Invoices</h1>
      <p className="mt-3 text-muted">We couldn&rsquo;t load your invoices.</p>
      <p className="mt-1 text-sm text-faint">
        {error.digest ? `Reference: ${error.digest}` : "Please try again."}
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-6 rounded border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface"
      >
        Try again
      </button>
    </main>
  );
}
