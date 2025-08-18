// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LinkedIn Post Generator",
  description: "Draft, preview and (later) publish LinkedIn posts with AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/linkedpost-logo-wordmark-512x128.svg" alt="LinkedPost logo" className="h-8" />
              <span className="font-semibold text-gray-800">LinkedIn Post Generator</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              <Link href="/terms" className="hover:underline">Terms</Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>

        <footer className="border-t bg-white">
          <div className="mx-auto max-w-4xl px-4 py-6 text-xs text-gray-500">
            © {new Date().getFullYear()} LinkedIn Post Generator • Draft UI (no posting yet)
          </div>
        </footer>
      </body>
    </html>
  );
}
