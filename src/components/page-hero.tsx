import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  lede,
  children,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[2.2rem] border border-[color:var(--line)] bg-[color:rgba(255,255,255,0.94)] shadow-[0_16px_48px_rgba(11,33,50,0.05)] backdrop-blur-md ${
        compact ? "px-6 py-8 md:px-8 md:py-9" : "px-6 py-10 md:px-10 md:py-14"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,124,134,0.1),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(196,97,42,0.08),transparent_38%)]" />
      <div className={`relative space-y-4 ${compact ? "max-w-2xl" : "max-w-3xl"}`}>
        <p className="text-[0.72rem] uppercase tracking-[0.34em] text-[color:var(--muted)]">
          {eyebrow}
        </p>
        <h1
          className={`max-w-4xl font-display leading-[1.02] text-[color:var(--foreground)] ${
            compact ? "text-4xl md:text-[3.8rem]" : "text-4xl md:text-[4.5rem]"
          }`}
        >
          {title}
        </h1>
        <p
          className={`text-base text-[color:var(--muted)] ${
            compact ? "max-w-xl leading-7 md:text-[1.02rem]" : "max-w-2xl leading-8 md:text-lg"
          }`}
        >
          {lede}
        </p>
        {children ? <div className="pt-2">{children}</div> : null}
      </div>
    </section>
  );
}
