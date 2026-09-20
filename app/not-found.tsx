import Link from "next/link";

export const metadata = { title: "Page not found — LexPlain AI" };

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Page not found</h1>
      <p className="max-w-md text-[var(--muted)]">
        That page doesn&apos;t exist. Check the URL, or head back to the Legal Q&A assistant.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-strong)]"
      >
        Back home
      </Link>
    </div>
  );
}
