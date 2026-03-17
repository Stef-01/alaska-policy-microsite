import { DisclosureRow } from "@/components/detail-disclosure";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { SeverityReadinessMatrix } from "@/components/severity-readiness-matrix";
import { regionBaselines } from "@/lib/data";
import { formatNumber, formatPercent } from "@/lib/utils";

export default function ExplorePage() {
  return (
    <>
      <PageHero
        eyebrow="Explore"
        title="Seven Alaska public health regions, plotted as a policy problem instead of a data dump."
        lede="The explorer strips away raw layer toggles and presents each region through the signals that actually matter for rollout design: adult diabetes burden, retinal screening gap, provider pressure, and implementation readiness."
      />

      <Reveal>
        <SeverityReadinessMatrix regions={regionBaselines} />
      </Reveal>

      <Reveal delay={0.08}>
        <section className="grid gap-4 lg:grid-cols-2">
          {regionBaselines.map((region) => (
            <article key={region.slug} className="surface-card rounded-[1.8rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    {region.recommendedPathway}
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-[color:var(--foreground)]">
                    {region.name}
                  </h2>
                </div>
                <div className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm text-[color:var(--foreground)]">
                  {region.population > 100000 ? "Population anchor" : "Rural deployment zone"}
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Stat label="Population" value={formatNumber(region.population)} />
                <Stat
                  label="Adult diabetes prevalence"
                  value={formatPercent(region.diabetesPrevalencePct)}
                />
                <Stat
                  label="Current eye screening rate"
                  value={formatPercent(region.currentEyeScreeningRatePct)}
                />
                <Stat
                  label="Eligible primary care sites"
                  value={formatNumber(region.eligiblePrimaryCareSites)}
                />
              </div>
              <div className="mt-5 space-y-3">
                <DisclosureRow
                  eyebrow="Pathway"
                  title={region.recommendedPathway}
                  badge={region.population > 100000 ? "Regional anchor" : "Deployment zone"}
                  hoverNote={`This region is currently positioned as ${region.recommendedPathway.toLowerCase()} based on the balance between severity and readiness.`}
                  detail={
                    <p>
                      The pathway is not just a label. It signals whether the region should move
                      quickly with deployment, build readiness first, or carry statewide coordination functions.
                    </p>
                  }
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <ContextCard
                    label="Provider context"
                    value={region.providerContext.label}
                    note={region.providerContext.note}
                    evidenceTier={region.providerContext.evidenceTier}
                  />
                  <ContextCard
                    label="Broadband context"
                    value={region.broadbandContext.label}
                    note={region.broadbandContext.note}
                    evidenceTier={region.broadbandContext.evidenceTier}
                  />
                </div>
              </div>
            </article>
          ))}
        </section>
      </Reveal>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-[color:var(--line)] bg-white/75 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-3 font-display text-3xl text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}

function ContextCard({
  label,
  value,
  note,
  evidenceTier,
}: {
  label: string;
  value: string;
  note: string;
  evidenceTier: string;
}) {
  return (
    <DisclosureRow
      eyebrow={label}
      title={value}
      badge={evidenceTier}
      hoverNote={note}
      detail={<p>{note}</p>}
      tone="teal"
    />
  );
}
