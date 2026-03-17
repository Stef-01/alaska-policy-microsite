import Link from "next/link";

import { DetailCard, DisclosureRow } from "@/components/detail-disclosure";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { SeverityReadinessMatrix } from "@/components/severity-readiness-matrix";
import { regionBaselines } from "@/lib/data";

export default function Home() {
  return (
    <>
      <PageHero
        eyebrow="Overview"
        title="A public policy framework for sequencing rural diabetes eye-care investments."
        lede="This Alaska pilot turns burden, readiness, and implementation evidence into a clear public-facing system: where to move first, where to build first, and what measurable results a retinal screening deployment could produce."
      >
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/calculator"
            className="rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm text-white transition-colors hover:bg-[color:#223a54]"
          >
            Open calculator
          </Link>
          <Link
            href="/framework"
            className="rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm text-[color:var(--foreground)] hover:bg-[color:#f9f5ee]"
          >
            See the framework
          </Link>
        </div>
      </PageHero>

      <Reveal>
        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              eyebrow: "01",
              title: "Assess need",
              summary: "Start with burden, screening gap, and regional readiness.",
              hoverNote:
                "The framework keeps the first read simple: which regions have the most unmet diabetes eye-care need, and which systems can absorb a rollout now.",
              detail:
                "Regional population, diabetes prevalence, screening gap, and implementation context are normalized into a policy view so the public can see why one region moves first and another needs infrastructure first.",
              tone: "paper" as const,
            },
            {
              eyebrow: "02",
              title: "Match the package",
              summary: "Fit the intervention to the region instead of buying one way statewide.",
              hoverNote:
                "Fundus-first remains the public default because the evidence base is stronger than OCT-only screening in primary care.",
              detail:
                "The model distinguishes fundus-only, fundus plus FDA-cleared AI, and fundus plus OCT adjunct options. Staffing, referral design, and infrastructure change the recommendation as much as device choice.",
              tone: "teal" as const,
            },
            {
              eyebrow: "03",
              title: "Show the result",
              summary: "Translate investment into screenings, follow-up, blindness risk, and return.",
              hoverNote:
                "The diabetes-rate effect is visible, but it is never shown without the care-pathway steps underneath it.",
              detail:
                "Every scenario exposes the model chain: people newly screened, people still missed, follow-up completed, major harm avoided, and the economic view used for public-sector decisions.",
              tone: "warm" as const,
            },
          ].map((card) => (
            <DetailCard
              key={card.title}
              eyebrow={card.eyebrow}
              title={card.title}
              hoverNote={card.hoverNote}
              detail={<p>{card.detail}</p>}
              tone={card.tone}
            >
              <p className="max-w-xs text-sm leading-7 text-[color:var(--muted)]">{card.summary}</p>
            </DetailCard>
          ))}
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <SeverityReadinessMatrix regions={regionBaselines} />
      </Reveal>

      <Reveal delay={0.12}>
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="surface-card rounded-[2rem] p-6 md:p-8">
            <p className="text-[0.72rem] uppercase tracking-[0.32em] text-[color:var(--muted)]">
              Product shape
            </p>
            <h2 className="mt-3 font-display text-3xl text-[color:var(--foreground)] md:text-4xl">
              A calm public shell with the deeper model one click away.
            </h2>
            <div className="mt-6 space-y-3">
              <DisclosureRow
                title="Public framework"
                eyebrow="Overview"
                hoverNote="The opening pages explain what the system is doing without forcing the user into model detail immediately."
                detail={
                  <p>
                    The public side is written like a policy product: what the framework is, what it
                    recommends, and how decisions differ by region.
                  </p>
                }
              />
              <DisclosureRow
                title="Investment calculator"
                eyebrow="Decision tool"
                hoverNote="The calculator is where the policy logic turns into scenario testing."
                detail={
                  <p>
                    Inputs are kept simple on purpose. The richer causal chain, uncertainty, and
                    evidence notes sit behind the results cards rather than taking over the full page.
                  </p>
                }
                tone="teal"
              />
              <DisclosureRow
                title="Model assumptions"
                eyebrow="Tuning layer"
                hoverNote="The assumptions workspace exists so the public shell can stay stable while the model evolves."
                detail={
                  <p>
                    Teams can adjust epidemiology, follow-up, and economic assumptions without
                    changing the public-facing layout or erasing the distinction between source-backed
                    and synthetic logic.
                  </p>
                }
                tone="warm"
              />
            </div>
          </article>
          <article className="surface-card rounded-[2rem] p-6 md:p-8">
            <p className="text-[0.72rem] uppercase tracking-[0.32em] text-[color:var(--muted)]">
              Public trust layer
            </p>
            <div className="mt-4 space-y-3">
              <DisclosureRow
                title="Evidence tier on major outputs"
                hoverNote="The site does not collapse source data, literature defaults, and synthetic bridging into a single unlabeled score."
                detail={
                  <p>
                    Each major public output is tagged so a stakeholder can see whether it comes
                    from Alaska source data, published implementation literature, or an assumption-driven bridge.
                  </p>
                }
              />
              <DisclosureRow
                title="Fundus-first default"
                hoverNote="The default public recommendation stays with the better-supported screening pathway."
                detail={
                  <p>
                    OCT remains available as an adjunct option, but the main public workflow stays
                    fundus-first because the evidence base is cleaner for diabetic retinopathy screening.
                  </p>
                }
                tone="teal"
              />
              <DisclosureRow
                title="Assumptions stay editable"
                hoverNote="The model can be tuned later without rewriting the stakeholder-facing story."
                detail={
                  <p>
                    This keeps the product credible over time. Teams can update follow-up rates,
                    adoption assumptions, or economic values while preserving the same public contract.
                  </p>
                }
                tone="warm"
              />
            </div>
          </article>
        </section>
      </Reveal>
    </>
  );
}
