import { PageHero } from "@/components/page-hero";
import { SimulatorClient } from "@/components/simulator-client";
import { getPublishedAssumptionSet, regionBaselines, sourceNotes } from "@/lib/data";

export default async function SimulatorPage() {
  const assumptionSet = await getPublishedAssumptionSet();

  return (
    <>
      <PageHero
        eyebrow="Calculator"
        title="Model one deployment scenario against today’s baseline."
        lede="Adjust the inputs and read the health and cost effects beside you."
        compact
      />
      <SimulatorClient
        regions={regionBaselines}
        activeAssumptionSet={assumptionSet}
        sourceNotes={sourceNotes}
      />
    </>
  );
}
