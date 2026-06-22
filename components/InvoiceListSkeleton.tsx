// Loading placeholder for the invoices list — mirrors the stat cards + table so
// the layout doesn't shift when real data arrives. Shown immediately (no reveal
// delay) by both app/loading.tsx (on navigation) and the in-page Suspense
// fallback (on initial load / refresh).
export function InvoiceListSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading invoices…</span>
      <div aria-hidden="true">
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl bg-muted-surface px-5 py-4">
              <div className="h-3 w-24 shimmer rounded" />
              <div className="mt-2 h-7 w-28 shimmer rounded" />
            </div>
          ))}
        </div>
        <div className="mt-10 overflow-hidden rounded-lg border border-line bg-surface">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-6 border-b border-line px-5 py-4 last:border-0"
            >
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 shimmer rounded" />
                <div className="h-3 w-24 shimmer rounded" />
              </div>
              <div className="h-4 w-16 shimmer rounded" />
              <div className="h-4 w-32 shimmer rounded" />
              <div className="h-4 w-24 shimmer rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
