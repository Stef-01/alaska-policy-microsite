import { DetailCard, DisclosureRow } from "@/components/detail-disclosure";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { dataGeneratedAt, sourceNotes } from "@/lib/data";

export default function MethodsPage() {
  return (
    <>
      <PageHero
        eyebrow="Methods"
        title="The methods page makes the evidence stack explicit."
        lede="The product separates source-backed Alaska baselines, literature-backed screening defaults, and the synthetic bridge that powers the final diabetes-rate estimate. That split is the main trust mechanism."
      />

      <Reveal>
        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Source-backed",
              summary: "Alaska geography and prevalence stay tied to public datasets.",
              hoverNote:
                "These are the least contestable inputs in the system and should remain visually separate from assumptions-driven outputs.",
              detail:
                "ACS population, CDC PLACES prevalence, and regional mapping are used directly where possible so the public baseline does not depend on synthetic modeling.",
              tone: "paper" as const,
            },
            {
              title: "Literature-backed",
              summary: "Screening throughput and follow-up defaults are anchored in implementation studies.",
              hoverNote:
                "This is the middle layer of evidence: published program performance used to bound what is plausible in deployment.",
              detail:
                "Tele-retinal screening uplift, follow-up completion, and program economics are bounded from peer-reviewed implementation literature rather than guessed ad hoc.",
              tone: "teal" as const,
            },
            {
              title: "Synthetic",
              summary: "The diabetes-rate bridge is explicit, bounded, and editable.",
              hoverNote:
                "The final rate effect is useful for planning, but it is the output most in need of visible caveat.",
              detail:
                "The bridge from better screening and follow-up to a modeled diabetes-rate reduction remains indicative rather than observed and can be tuned in the assumptions workspace.",
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
          <p className="md:col-span-3 text-sm text-[color:var(--muted)]">
            Latest generated data pack: {dataGeneratedAt}.
          </p>
        </section>
      </Reveal>

      <Reveal delay={0.08}>
        <section className="grid gap-4">
          {sourceNotes.map((note) => (
            <DisclosureRow
              key={note.id}
              eyebrow={note.scope}
              title={note.name}
              badge={note.evidenceTier}
              href={note.url}
              hoverNote={`${note.year} source. Last refreshed ${note.lastRefreshDate}.`}
              detail={
                <div className="space-y-2">
                  <p>{note.summary}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Updated {note.lastRefreshDate}
                  </p>
                </div>
              }
            />
          ))}
        </section>
      </Reveal>
    </>
  );
}
