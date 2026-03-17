import { DetailCard, DisclosureRow } from "@/components/detail-disclosure";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { getRegionPlaybooks } from "@/lib/data";

export default function PlaybooksPage() {
  const playbooks = getRegionPlaybooks();

  return (
    <>
      <PageHero
        eyebrow="Regional Playbooks"
        title="Each region gets a policy-ready playbook, not a generic technology wish list."
        lede="The recommendations below turn the framework into action: what to deploy first, what to defer, and what the year-one signal should be if the rollout is on track."
      />

      <Reveal>
        <section className="grid gap-4 lg:grid-cols-2">
          {playbooks.map((region) => (
            <DetailCard
              key={region.slug}
              eyebrow={region.recommendedPathway}
              title={region.name}
              hoverNote={region.headline}
              detail={
                <div className="space-y-3">
                  {region.interventions.map((item, index) => (
                    <DisclosureRow
                      key={item}
                      eyebrow={`Action 0${index + 1}`}
                      title={item}
                      hoverNote={item}
                      detail={<p>{item}</p>}
                    />
                  ))}
                </div>
              }
            >
              <p className="max-w-sm text-sm leading-7 text-[color:var(--muted)]">{region.headline}</p>
            </DetailCard>
          ))}
        </section>
      </Reveal>
    </>
  );
}
