/**
 * Navbar.tsx — Top navigation bar, shared across all pages.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletButton from "./WalletButton";

const NAV_LINKS = [
  { href: "/",     label: "Home"  },
  { href: "/trade", label: "Trade" },
  { href: "/bot",   label: "Bot"   },
  { href: "/docs",  label: "Docs"  },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-brand-bg/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="font-mono font-bold text-brand-green text-lg tracking-tight">
          Error<span className="text-brand-text">404</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-display font-medium transition-colors ${
                pathname === href
                  ? "text-brand-green"
                  : "text-brand-dim hover:text-brand-text"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Wallet */}
        <WalletButton />
      </div>
    </header>
  );
}
