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
      className={`shadow-soft relative overflow-hidden rounded-[2.3rem] border border-[color:var(--line)] bg-[color:var(--surface)] backdrop-blur-xl ${
        compact ? "px-6 py-6 md:px-8 md:py-7" : "px-6 py-9 md:px-10 md:py-12"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,124,134,0.09),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(196,97,42,0.07),transparent_36%)]" />
      <div className={`relative space-y-3 ${compact ? "max-w-[42rem]" : "max-w-3xl"}`}>
        <p className="text-[0.72rem] uppercase tracking-[0.34em] text-[color:var(--muted)]">
          {eyebrow}
        </p>
        <h1
          className={`max-w-4xl font-display leading-[1.02] text-[color:var(--foreground)] ${
            compact ? "text-[2.85rem] md:text-[3.35rem]" : "text-4xl md:text-[4.25rem]"
          }`}
        >
          {title}
        </h1>
        <p
          className={`text-base text-[color:var(--muted)] ${
            compact ? "max-w-[34rem] leading-7 md:text-[1rem]" : "max-w-2xl leading-8 md:text-[1.05rem]"
          }`}
        >
          {lede}
        </p>
        {children ? <div className="pt-2">{children}</div> : null}
      </div>
    </section>
  );
}
