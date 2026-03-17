"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const onAssumptions =
    pathname.startsWith("/assumptions") || pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--line)] bg-[color:rgba(247,243,235,0.78)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[98rem] items-center justify-between gap-6 px-4 py-4 md:px-8 lg:px-12">
        <Link href="/" className="min-w-0">
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
              className="rounded-full border border-[color:var(--line)] bg-[color:var(--surface-soft)] px-4 py-2 text-sm text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--surface-strong)]"
            >
              Model Assumptions
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
