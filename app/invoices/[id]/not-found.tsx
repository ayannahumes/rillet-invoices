import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";
import { Heading } from "@/components/ui/Heading";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <PageShell width="md" center>
      <Heading>Not found</Heading>
      <p className="mt-3 text-muted">We couldn&rsquo;t find that invoice.</p>
      <Link href="/" className={buttonClass("outline", "default", "mt-6")}>
        Back to invoices
      </Link>
    </PageShell>
  );
}
