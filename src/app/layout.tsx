import "./globals.css";
import Link from "next/link";
import { Providers } from "@/components/Providers";
import { AuthButton } from "@/components/AuthButton";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-gray-50 text-gray-900">
        <Providers>
          <header className="border-b bg-white">
            <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <img
                  src="/linkedpost-logo-wordmark-512x128.svg"
                  alt="LinkedPost logo"
                  className="h-8"
                />
                <span className="font-semibold text-gray-800">
                  LinkedIn Post Generator
                </span>
              </Link>
              <nav className="flex items-center gap-5 text-sm">
                {/* <Link href="/privacy" className="text-gray-800 hover:underline">
                  Privacy
                </Link>
                <Link href="/terms" className="text-gray-800 hover:underline">
                  Terms
                </Link> */}
                <AuthButton /> {/* 👈 add login/logout button */}
              </nav>
            </div>
          </header>

          <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>

          <footer className="border-t bg-white">
            <div className="flex items-center justify-between mx-auto max-w-4xl px-4 py-6 text-xs text-gray-500">
              © {new Date().getFullYear()} LinkedIn Post Generator
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="text-gray-800 hover:underline">
                    Privacy
                  </Link>
                  <Link href="/terms" className="text-gray-800 hover:underline">
                    Terms
                  </Link>
                </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
