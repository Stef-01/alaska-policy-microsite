import { DetailCard } from "@/components/detail-disclosure";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";

export default function GovernancePage() {
  return (
    <>
      <PageHero
        eyebrow="Governance"
        title="The public-facing product stays stable because the model assumptions are versioned and visible."
        lede="Governance here means more than authorship. It covers how assumptions are versioned, how the public sees caveats, how teams can tune coefficients later, and how the product avoids overstating what the evidence can support."
      />

      <Reveal>
        <section className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Versioned assumptions",
              summary: "Assumption packs can change without changing the public product shell.",
              hoverNote:
                "Governance starts with separating editorial presentation from model versioning.",
              detail:
                "Each assumption set is versioned so teams can publish a revised model pack later without silently changing what the public sees.",
              tone: "paper" as const,
            },
            {
              title: "Open assumptions workspace",
              summary: "Epidemiology, follow-up, and economic coefficients remain tuneable.",
              hoverNote:
                "This avoids the common failure mode where a public prototype becomes stale because every update requires code edits.",
              detail:
                "The workspace exists so later evidence can refine low, base, and high ranges while keeping a visible record of what changed and why.",
              tone: "teal" as const,
            },
            {
              title: "Public caveats stay attached",
              summary: "The most attractive outputs keep their caveats visible.",
              hoverNote:
                "The site is strongest when it makes the limits of the model legible rather than trying to hide them.",
              detail:
                "The synthetic diabetes-rate bridge remains labeled as indicative, bounded, and assumption-driven even when the rest of the interface is polished.",
              tone: "warm" as const,
            },
          ].map((card) => (
            <DetailCard
              key={card.title}
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
    </>
  );
}
