// Detail-shaped skeleton (mirrors app/invoices/[id]/page.tsx) so navigating to
// an invoice shows the right layout while it loads — not the list skeleton.
export default function Loading() {
  return (
    <main className="skeleton mx-auto max-w-3xl px-6 py-10 md:px-8">
      {/* back link */}
      <div className="h-4 w-24 shimmer rounded" />

      {/* header: title + invoice number */}
      <div className="mt-4">
        <div className="h-9 w-72 shimmer rounded" />
        <div className="mt-2 h-4 w-32 shimmer rounded" />
      </div>

      {/* meta grid: 6 labeled fields */}
      <div className="mt-8 grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 shimmer rounded" />
            <div className="h-5 w-40 shimmer rounded" />
          </div>
        ))}
      </div>

      {/* line items */}
      <div className="mt-10">
        <div className="h-3 w-24 shimmer rounded" />
        <div className="mt-3 overflow-hidden rounded-lg border border-line bg-surface">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-6 border-b border-line px-5 py-4 last:border-0"
            >
              <div className="h-4 flex-1 shimmer rounded" />
              <div className="h-4 w-16 shimmer rounded" />
              <div className="h-4 w-12 shimmer rounded" />
              <div className="h-4 w-20 shimmer rounded" />
              <div className="h-4 w-24 shimmer rounded" />
            </div>
          ))}
        </div>

        {/* totals breakdown */}
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-3">
            <div className="ml-auto h-4 w-40 shimmer rounded" />
            <div className="ml-auto h-4 w-32 shimmer rounded" />
            <div className="ml-auto h-5 w-44 shimmer rounded" />
          </div>
        </div>
      </div>

      {/* memo */}
      <div className="mt-10">
        <div className="h-3 w-16 shimmer rounded" />
        <div className="mt-2 h-4 w-2/3 shimmer rounded" />
      </div>

      {/* dates */}
      <div className="mt-10 grid grid-cols-2 gap-x-12 gap-y-6 border-t border-line pt-8 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-16 shimmer rounded" />
            <div className="h-4 w-24 shimmer rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
