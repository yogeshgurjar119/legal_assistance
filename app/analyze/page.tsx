import type { Metadata } from "next";
import { DocumentUpload } from "@/components/DocumentUpload";
import { LegalDisclaimerBanner } from "@/components/LegalDisclaimerBanner";

export const metadata: Metadata = { title: "Analyze Document — LexPlain AI" };

export default function AnalyzePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Analyze a Document</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
          Upload a contract or lease (PDF or plain text, max 5MB) or paste a clause, and get a plain-language
          summary with risky-clause flags — auto-renewal, sole-discretion termination, indemnification,
          arbitration, liquidated damages, and broad liability waivers are detected even without an AI key.
        </p>
      </div>
      <LegalDisclaimerBanner />
      <DocumentUpload />
    </div>
  );
}
