import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Log in — LexPlain AI" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          LexPlain<span className="text-[var(--accent)]">AI</span>
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Sign in to continue.</p>
        <LoginForm />
      </div>
    </div>
  );
}
