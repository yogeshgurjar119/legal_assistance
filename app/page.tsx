import Link from "next/link";
import { LegalDisclaimerBanner } from "@/components/LegalDisclaimerBanner";

const PILLARS = [
  {
    title: "Legal Q&A",
    desc: "Ask plain-language questions about tenant rights, contracts, consumer protection, employment, small claims, or data privacy — in five languages.",
    href: "/chat",
    cta: "Ask a question",
    icon: "M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H8l-4 3v-3H3a1 1 0 01-1-1V5a1 1 0 011-1z",
  },
  {
    title: "Analyze a Document",
    desc: "Upload a contract or lease (PDF or text), or paste a clause, and get a plain-language summary with risky-clause flags.",
    href: "/analyze",
    cta: "Analyze a document",
    icon: "M7 2h6l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V3a1 1 0 011-1zM13 2v4h4M8 11h6M8 14h6M8 8h2",
  },
];

const STATS = [
  { value: "2", label: "Core features" },
  { value: "5", label: "Languages supported" },
  { value: "18", label: "Seeded legal topics" },
  { value: "0", label: "Config required to try it" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-10">
        <svg width="96" height="96" viewBox="0 0 48 48" fill="none" className="shrink-0" aria-hidden>
          <rect width="48" height="48" rx="10" fill="var(--accent)" />
          <path
            d="M24 8v32M24 8l-11 5.5M24 8l11 5.5M9 15l3.5 9a4.3 4.3 0 008 0L24 15M39 15l-3.5 9a4.3 4.3 0 01-8 0L24 15M12 40h24"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            GenAI for Legal Access
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            LexPlain AI
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Legal information is often dense and hard to navigate. LexPlain AI makes it accessible with two
            focused tools: a multilingual legal Q&A chatbot, and a document analyzer that turns contracts and
            leases into plain-language summaries with risky-clause flags.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/chat"
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--accent)]/20 transition-colors hover:bg-[var(--accent-strong)]"
            >
              Try the Legal Q&A
            </Link>
            <Link
              href="/analyze"
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-slate-400 hover:bg-[var(--surface)]"
            >
              Analyze a document
            </Link>
          </div>
        </div>
      </section>

      <LegalDisclaimerBanner />

      <section aria-label="Key stats" className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-[var(--background)] p-5 text-center">
            <p className="text-2xl font-bold text-[var(--foreground)]">{s.value}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{s.label}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="pillars-heading">
        <h2 id="pillars-heading" className="text-lg font-semibold text-[var(--foreground)]">
          What LexPlain AI does
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <li
              key={p.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5 transition-colors hover:border-[var(--accent)]/40 hover:shadow-sm"
            >
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden className="text-[var(--accent)]">
                <path d={p.icon} fill="currentColor" />
              </svg>
              <h3 className="mt-2 font-medium text-[var(--foreground)]">{p.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{p.desc}</p>
              <Link
                href={p.href}
                className="mt-3 inline-block text-sm font-semibold text-[var(--accent)] hover:underline"
              >
                {p.cta} →
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
