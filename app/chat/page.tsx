import type { Metadata } from "next";
import { ChatWidget } from "@/components/ChatWidget";
import { LegalDisclaimerBanner } from "@/components/LegalDisclaimerBanner";

export const metadata: Metadata = { title: "Legal Q&A — LexPlain AI" };

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Legal Q&A</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
          Ask a question about tenant rights, contracts, consumer protection, employment, small claims, or data
          privacy. Answers are general legal information, not advice for your specific situation.
        </p>
      </div>
      <LegalDisclaimerBanner />
      <ChatWidget />
    </div>
  );
}
