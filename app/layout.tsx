import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "LexPlain AI — Legal Q&A and Document Summaries",
  description:
    "A GenAI-powered legal assistant: a multilingual legal Q&A chatbot and a plain-language document summary and risk-flagging tool.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Sidebar>{children}</Sidebar>
      </body>
    </html>
  );
}
