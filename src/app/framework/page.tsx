import { DetailCard, DisclosureRow } from "@/components/detail-disclosure";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";

export default function FrameworkPage() {
  const phases = [
    {
      title: "Phase 1 · Assess regional need",
      summary: "Use Alaska baselines to establish where the screening gap is most structurally severe.",
      hoverNote:
        "Burden comes first. The product does not jump to technology choice before clarifying which regions have the deepest access and disease problem.",
      detail:
        "Population, adult diabetes prevalence, screening rates, and readiness context are combined into a public policy view so the first question is about need rather than device procurement.",
      tone: "paper" as const,
    },
    {
      title: "Phase 2 · Match intervention type",
      summary: "Choose the package that the region can realistically absorb, not the most advanced equipment on paper.",
      hoverNote:
        "A region with constrained staffing or referral capacity should not receive the same rollout design as a regional hub.",
      detail:
        "Fundus-first deployment is the default. AI and OCT are layered in only when staffing, image transfer, and follow-up infrastructure are strong enough to support them.",
      tone: "teal" as const,
    },
    {
      title: "Phase 3 · Demonstrate measurable value",
      summary: "Show what changes in throughput, harm avoided, and public-sector return.",
      hoverNote:
        "The value case has to be visible enough for public health teams and concrete enough for government funding discussions.",
      detail:
        "The simulator keeps the outputs legible: who is newly screened, who completes follow-up, what downstream harm is plausibly avoided, and what the cost picture looks like over time.",
      tone: "warm" as const,
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Framework"
        title="Need, readiness, and measurable results are the backbone of the product."
        lede="The framework is designed to look and read like a professional policy system, not a raw GIS portal. The logic is explicit: use burden to prioritize, readiness to sequence, and measurable outputs to justify funding."
      />

      <Reveal>
        <section className="grid gap-4 lg:grid-cols-3">
          {phases.map((phase) => (
            <DetailCard
              key={phase.title}
              title={phase.title}
              hoverNote={phase.hoverNote}
              detail={<p>{phase.detail}</p>}
              tone={phase.tone}
            >
              <p className="max-w-xs text-sm leading-7 text-[color:var(--muted)]">{phase.summary}</p>
            </DetailCard>
          ))}
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="surface-card rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.32em] text-[color:var(--muted)]">
                Public-facing logic
              </p>
              <h2 className="mt-2 font-display text-4xl text-[color:var(--foreground)]">
                Simple enough to scan, rigorous enough to defend.
              </h2>
            </div>
            <div className="space-y-3">
              <DisclosureRow
                eyebrow="Public shell"
                title="Keep the core logic visible"
                hoverNote="A stakeholder should understand the decision model without reading a methods appendix first."
                detail={
                  <p>
                    The public site states the decision rule in plain language: assess need, match the
                    intervention, and show measurable value. That structure stays consistent from page to page.
                  </p>
                }
              />
              <DisclosureRow
                eyebrow="Model layer"
                title="Keep the assumptions adjustable"
                hoverNote="The product is intended to evolve as evidence and regional operating conditions change."
                detail={
                  <p>
                    The assumptions workspace is part of the governance model. It lets teams revise
                    coefficients without turning the public site into an internal admin screen.
                  </p>
                }
                tone="teal"
              />
              <DisclosureRow
                eyebrow="Trust signal"
                title="Keep caveats attached to results"
                hoverNote="The most attractive output is also the one most likely to be overstated if the caveat disappears."
                detail={
                  <p>
                    The indicative diabetes-rate effect remains visible because the user asked for it,
                    but the framework keeps it bounded and explicitly downstream of the screening and follow-up pathway.
                  </p>
                }
                tone="warm"
              />
            </div>
          </div>
        </section>
      </Reveal>
    </>
  );
}
