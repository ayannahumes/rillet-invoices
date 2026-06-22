import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-4xl font-medium text-ink">Not found</h1>
      <p className="mt-3 text-muted">
        We couldn&rsquo;t find that invoice.
      </p>
      <Link
        href="/"
        className="mt-6 rounded border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface"
      >
        Back to invoices
      </Link>
    </main>
  );
}
