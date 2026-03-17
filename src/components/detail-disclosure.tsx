"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ExternalLink, Info } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type Tone = "paper" | "teal" | "warm" | "navy";

const toneClasses: Record<
  Tone,
  {
    shell: string;
    hover: string;
    expanded: string;
    label: string;
    text: string;
    button: string;
  }
> = {
  paper: {
    shell: "border-[color:var(--line)] bg-white/92 shadow-[0_10px_28px_rgba(11,33,50,0.04)]",
    hover: "border-[color:var(--line)] bg-white/95 text-[color:var(--foreground)]",
    expanded: "border-[color:var(--line)] bg-white/92 text-[color:var(--foreground)]",
    label: "text-[color:var(--muted)]",
    text: "text-[color:var(--foreground)]",
    button:
      "border-[color:var(--line)] bg-white/88 text-[color:var(--muted)] hover:bg-white",
  },
  teal: {
    shell:
      "border-[color:rgba(15,124,134,0.14)] bg-[linear-gradient(180deg,rgba(15,124,134,0.05),rgba(255,255,255,0.94))] shadow-[0_10px_28px_rgba(11,33,50,0.04)]",
    hover: "border-[color:rgba(15,124,134,0.18)] bg-white/94 text-[color:var(--foreground)]",
    expanded:
      "border-[color:rgba(15,124,134,0.18)] bg-white/92 text-[color:var(--foreground)]",
    label: "text-[color:var(--muted)]",
    text: "text-[color:var(--foreground)]",
    button:
      "border-[color:rgba(15,124,134,0.14)] bg-white/82 text-[color:var(--muted)] hover:bg-white",
  },
  warm: {
    shell:
      "border-[color:rgba(196,97,42,0.14)] bg-[linear-gradient(180deg,rgba(196,97,42,0.05),rgba(255,255,255,0.94))] shadow-[0_10px_28px_rgba(11,33,50,0.04)]",
    hover: "border-[color:rgba(196,97,42,0.18)] bg-white/94 text-[color:var(--foreground)]",
    expanded:
      "border-[color:rgba(196,97,42,0.18)] bg-white/92 text-[color:var(--foreground)]",
    label: "text-[color:var(--muted)]",
    text: "text-[color:var(--foreground)]",
    button:
      "border-[color:rgba(196,97,42,0.14)] bg-white/82 text-[color:var(--muted)] hover:bg-white",
  },
  navy: {
    shell:
      "border-[color:rgba(16,34,53,0.1)] bg-[linear-gradient(180deg,rgba(16,34,53,0.97),rgba(21,46,70,0.95))] text-white shadow-[0_14px_40px_rgba(11,33,50,0.16)]",
    hover:
      "border-white/10 bg-[color:rgba(255,255,255,0.08)] text-white/80",
    expanded:
      "border-white/10 bg-[color:rgba(255,255,255,0.06)] text-white/78",
    label: "text-white/55",
    text: "text-white",
    button: "border-white/10 bg-white/6 text-white/65 hover:bg-white/10",
  },
};

function DetailButton({
  open,
  onClick,
  label,
  tone,
}: {
  open: boolean;
  onClick: () => void;
  label: string;
  tone: Tone;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={`${open ? "Hide" : "Show"} details for ${label}`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-colors",
        toneClasses[tone].button
      )}
    >
      <Info className="h-3.5 w-3.5" />
      <span>{open ? "Hide" : "More"}</span>
      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open ? "rotate-180" : "")} />
    </button>
  );
}

export function DetailCard({
  eyebrow,
  title,
  hoverNote,
  detail,
  tone = "paper",
  value,
  children,
}: {
  eyebrow?: string;
  title: string;
  hoverNote: string;
  detail: ReactNode;
  tone?: Tone;
  value?: string;
  children?: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className={cn("group relative rounded-[1.7rem] border p-5", toneClasses[tone].shell)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className={cn("text-[0.72rem] uppercase tracking-[0.28em]", toneClasses[tone].label)}>
              {eyebrow}
            </p>
          ) : null}
          <h2 className={cn("mt-2 font-display text-[1.85rem] leading-[1.04]", toneClasses[tone].text)}>
            {title}
          </h2>
        </div>
        <DetailButton open={expanded} onClick={() => setExpanded((current) => !current)} label={title} tone={tone} />
      </div>

      {value ? (
        <p className={cn("mt-5 font-display text-[2.4rem] leading-none", toneClasses[tone].text)}>{value}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}

      <div
        className={cn(
          "pointer-events-none mt-5 hidden rounded-[1rem] border p-3 text-xs leading-5 opacity-0 transition duration-200 md:block md:translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100",
          toneClasses[tone].hover
        )}
      >
        {hoverNote}
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className={cn("mt-5 rounded-[1rem] border p-4 text-sm leading-6", toneClasses[tone].expanded)}
          >
            {detail}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}

export function DisclosureRow({
  eyebrow,
  title,
  hoverNote,
  detail,
  tone = "paper",
  badge,
  href,
}: {
  eyebrow?: string;
  title: string;
  hoverNote: string;
  detail: ReactNode;
  tone?: Tone;
  badge?: string;
  href?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("group rounded-[1.35rem] border p-4", toneClasses[tone].shell)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className={cn("text-[0.7rem] uppercase tracking-[0.24em]", toneClasses[tone].label)}>
              {eyebrow}
            </p>
          ) : null}
          <h3 className={cn("mt-1 text-base font-medium leading-6", toneClasses[tone].text)}>{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {badge ? (
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em]",
                tone === "navy"
                  ? "border-white/10 bg-white/6 text-white/65"
                  : "border-[color:var(--line)] bg-white/82 text-[color:var(--muted)]"
              )}
            >
              {badge}
            </span>
          ) : null}
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-colors",
                toneClasses[tone].button
              )}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open</span>
            </a>
          ) : null}
          <DetailButton open={expanded} onClick={() => setExpanded((current) => !current)} label={title} tone={tone} />
        </div>
      </div>

      <div
        className={cn(
          "pointer-events-none mt-4 hidden rounded-[1rem] border p-3 text-xs leading-5 opacity-0 transition duration-200 md:block md:translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100",
          toneClasses[tone].hover
        )}
      >
        {hoverNote}
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className={cn("mt-4 rounded-[1rem] border p-4 text-sm leading-6", toneClasses[tone].expanded)}
          >
            {detail}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
