// src/app/layout.tsx  (server component)
import "@/app/globals.css";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import ClientSessionProvider from "@/components/ClientSessionProvider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function RootLayout({ children }: { children: ReactNode }) {
  // getServerSession is server-only and safe in the layout
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="min-h-dvh bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/linkedpost-logo-wordmark-512x128.svg"
                alt="LinkedPost logo"
                width={160}
                height={40}
                priority
                style={{ height: "auto" }}
              />
              <span className="font-semibold text-gray-800">LinkedIn Post Generator</span>
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              <Link href="/terms" className="hover:underline">Terms</Link>
            </nav>
          </div>
        </header>

        {/* Wrap children with client-side SessionProvider and pass server session */}
        <ClientSessionProvider session={session}>
          <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>

          <footer className="border-t bg-white">
            <div className="mx-auto max-w-4xl px-4 py-6 text-xs text-gray-500">
              © {new Date().getFullYear()} LinkedIn Post Generator
            </div>
          </footer>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
