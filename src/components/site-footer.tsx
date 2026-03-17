import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--line)] bg-[color:#102235] text-white">
      <div className="mx-auto grid max-w-[100rem] gap-8 px-4 py-10 md:grid-cols-[1.3fr_1fr_1fr] md:px-8 lg:px-12">
        <div className="space-y-3">
          <p className="text-[0.72rem] uppercase tracking-[0.34em] text-white/50">
            Planning Product
          </p>
          <h2 className="font-display text-2xl">Alaska Rural Health Transformation Navigator</h2>
          <p className="max-w-xl text-sm leading-7 text-white/70">
            A public-facing policy framework and investment calculator for sequencing diabetic eye
            screening deployment across Alaska&apos;s seven public health regions.
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-white/50">Trust Signals</p>
          <ul className="space-y-2 text-sm text-white/75">
            <li>Evidence tiers stay attached to major outputs.</li>
            <li>Source-backed baselines are separated from synthetic bridge logic.</li>
            <li>Assumptions can be tuned without breaking the public shell.</li>
          </ul>
        </div>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-white/50">Routes</p>
          <div className="flex flex-wrap gap-2 text-sm text-white/80">
            <Link href="/calculator" className="rounded-full border border-white/15 px-3 py-1 hover:bg-white/10">
              Calculator
            </Link>
            <Link href="/assumptions" className="rounded-full border border-white/15 px-3 py-1 hover:bg-white/10">
              Assumptions
            </Link>
            <Link href="/methods" className="rounded-full border border-white/15 px-3 py-1 hover:bg-white/10">
              Methods
            </Link>
            <Link href="/governance" className="rounded-full border border-white/15 px-3 py-1 hover:bg-white/10">
              Governance
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
