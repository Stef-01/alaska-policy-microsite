"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/", label: "Overview" },
  { href: "/framework", label: "Framework" },
  { href: "/explore", label: "Explore" },
  { href: "/calculator", label: "Calculator" },
  { href: "/playbooks", label: "Playbooks" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/methods", label: "Methods" },
  { href: "/governance", label: "Governance" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const onAssumptions =
    pathname.startsWith("/assumptions") || pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--line)] bg-[color:rgba(247,243,235,0.78)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[98rem] items-center justify-between gap-4 px-4 py-4 md:px-8 lg:px-12">
        <Link
          href="/"
          className="min-w-0"
          onClick={() => setMenuOpen(false)}
        >
          <p className="text-[0.72rem] uppercase tracking-[0.34em] text-[color:var(--muted)]">
            Rural Health Transformation
          </p>
          <p className="font-display text-xl font-semibold leading-none text-[color:var(--foreground)] md:text-2xl">
            Alaska Navigator
          </p>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 lg:flex lg:flex-nowrap">
          {navigationItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "bg-[color:var(--foreground)] text-[color:#ffffff] shadow-[0_10px_24px_rgba(16,34,53,0.11)]"
                    : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                )}
                style={active ? { color: "#ffffff" } : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {!onAssumptions ? (
            <Link
              href="/assumptions"
              className="hidden rounded-full border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-2 text-sm text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-strong)] lg:inline-flex"
            >
              Model Assumptions
            </Link>
          ) : null}
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-site-menu"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-soft)] text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-strong)] lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {menuOpen ? (
          <motion.div
            id="mobile-site-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="border-t border-[color:var(--line)] bg-[color:rgba(247,243,235,0.94)] px-4 pb-5 pt-4 backdrop-blur-2xl md:px-8 lg:hidden"
          >
            <nav className="grid gap-2" aria-label="Mobile">
              {navigationItems.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "rounded-[1.05rem] border px-4 py-3 text-sm transition-colors",
                      active
                        ? "border-[color:var(--foreground)] bg-[color:var(--foreground)] text-white"
                        : "border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] hover:bg-white"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {!onAssumptions ? (
                <Link
                  href="/assumptions"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 rounded-[1.05rem] border border-[color:rgba(15,124,134,0.18)] bg-[linear-gradient(180deg,rgba(15,124,134,0.07),rgba(255,255,255,0.94))] px-4 py-3 text-sm font-medium text-[color:var(--foreground)]"
                >
                  Model Assumptions
                </Link>
              ) : null}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
