/**
 * Root layout — wraps every page with providers and the shared Navbar.
 */

import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/components/WalletContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title:       "Error404 — Trade on Robinhood Chain",
  description: "Live token dashboard and trading terminal for the Error404 ecosystem on Robinhood Chain (L2).",
  icons:       { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-brand-bg text-brand-text">
        <WalletProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
