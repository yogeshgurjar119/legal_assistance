import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Log in — LexPlain AI" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[var(--accent)]">
            <path
              d="M12 3v18M12 3l-6 3M12 3l6 3M4 8l2 5a2.5 2.5 0 004.6 0L12.6 8M20.6 8l-2-5.8M14.6 8l2 5a2.5 2.5 0 004.6 0l2-5M4 8l2-5.8M6 21h12"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-[var(--foreground)]">
            LexPlain<span className="text-[var(--accent)]">AI</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Sign in to continue.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
