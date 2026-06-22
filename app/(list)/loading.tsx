// Shimmer skeleton for the invoices list — shown on initial load / refresh of
// the main page (and slow loads). Scoped to the (list) group so it does NOT
// affect detail-page navigation, which keeps the previous page on screen.
// The `skeleton` class delays the reveal ~400ms so fast loads never flash it.
export default function Loading() {
  return (
    <main className="skeleton mx-auto max-w-5xl px-6 py-10 md:px-8">
      {/* heading */}
      <div className="h-9 w-44 shimmer rounded" />

      {/* summary bar */}
      <div className="mt-8 flex flex-wrap gap-x-16 gap-y-6">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 shimmer rounded" />
            <div className="h-6 w-36 shimmer rounded" />
          </div>
        ))}
      </div>

      {/* table */}
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
    </main>
  );
}
