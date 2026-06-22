"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { PageShell } from "@/components/ui/PageShell";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";

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
    <PageShell width="lg" center>
      <Heading>Invoices</Heading>
      <p className="mt-3 text-muted">We couldn&rsquo;t load your invoices.</p>
      <p className="mt-1 text-sm text-faint">
        {error.digest ? `Reference: ${error.digest}` : "Please try again."}
      </p>
      <Button type="button" onClick={() => unstable_retry()} className="mt-6">
        Try again
      </Button>
    </PageShell>
  );
}
