import Link from "next/link";

import {
  createDraftCloneAction,
  publishAssumptionSetAction,
  resetAssumptionSetAction,
  updateAssumptionAction,
} from "@/app/admin/actions";
import { PageHero } from "@/components/page-hero";
import {
  getAllAssumptionSets,
  getPublishedAssumptionSet,
  getRegionBySlug,
  regionBaselines,
} from "@/lib/data";
import { simulateScenario } from "@/lib/simulation";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { InterventionScenario } from "@/types/domain";

function readString(value: string | string[] | undefined, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: string | string[] | undefined, fallback: number) {
  const raw = typeof value === "string" ? Number(value) : fallback;
  return Number.isFinite(raw) ? raw : fallback;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const assumptionSets = await getAllAssumptionSets();
  const publishedSet = await getPublishedAssumptionSet();
  const selectedSet =
    assumptionSets.find((set) => set.id === readString(params.set, "")) ?? publishedSet;

  const previewRegion =
    getRegionBySlug(readString(params.region, regionBaselines[0].slug)) ?? regionBaselines[0];

  const previewScenario: InterventionScenario = {
    regionSlug: previewRegion.slug,
    clinicInstalls: readNumber(params.installs, 3),
    deviceMode: readString(params.device, "fundus_ai") as InterventionScenario["deviceMode"],
    staffingModel: readString(
      params.staffing,
      "trained_ma_rn"
    ) as InterventionScenario["staffingModel"],
    referralModel: readString(
      params.referral,
      "regional_hub"
    ) as InterventionScenario["referralModel"],
    infrastructurePackage: readString(
      params.infrastructure,
      "connected"
    ) as InterventionScenario["infrastructurePackage"],
    adoptionLevel: readString(
      params.adoption,
      "medium"
    ) as InterventionScenario["adoptionLevel"],
    additionalAnnualProgramCost: readNumber(params.programCost, 20000),
  };

  const selectedResult = simulateScenario(previewRegion, selectedSet, previewScenario);
  const publishedResult = simulateScenario(previewRegion, publishedSet, previewScenario);

  const queryBase = new URLSearchParams({
    region: previewRegion.slug,
    installs: String(previewScenario.clinicInstalls),
    device: previewScenario.deviceMode,
    staffing: previewScenario.staffingModel,
    referral: previewScenario.referralModel,
    infrastructure: previewScenario.infrastructurePackage,
    adoption: previewScenario.adoptionLevel,
    programCost: String(previewScenario.additionalAnnualProgramCost),
  });

  return (
    <>
      <PageHero
        eyebrow="Model Assumptions"
        title="Fine-tune the calculator assumptions, preview the effect, and publish the active pack."
        lede="Adjust epidemiology, screening, follow-up, and economic coefficients here, compare a draft against the active public pack, and publish when the calculator behavior looks right."
      />

      <section className="grid gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="surface-card space-y-4 rounded-[2rem] p-5">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[color:var(--muted)]">
              Assumption sets
            </p>
            <h2 className="mt-1 font-display text-2xl text-[color:var(--foreground)]">
              Versions
            </h2>
          </div>

          <div className="space-y-2">
            {assumptionSets.map((set) => {
              const paramsForLink = new URLSearchParams(queryBase);
              paramsForLink.set("set", set.id);

              return (
                <Link
                  key={set.id}
                  href={`/assumptions?${paramsForLink.toString()}`}
                  className={`block rounded-[1.3rem] border px-4 py-3 ${
                    set.id === selectedSet.id
                      ? "border-[color:var(--foreground)] bg-[color:#102235] text-white"
                      : "border-[color:var(--line)] bg-white/75 text-[color:var(--foreground)]"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.24em] opacity-70">{set.status}</p>
                  <p className="mt-2 font-medium">{set.name}</p>
                  <p className="text-sm opacity-70">{set.version}</p>
                </Link>
              );
            })}
          </div>

          <div className="space-y-3 rounded-[1.4rem] border border-[color:var(--line)] bg-white/75 p-4">
            <form action={createDraftCloneAction}>
              <input type="hidden" name="sourceId" value={selectedSet.id} />
              <button className="w-full rounded-full bg-[color:var(--foreground)] px-4 py-3 text-sm text-[color:var(--background)]">
                Create draft clone
              </button>
            </form>
            <form action={resetAssumptionSetAction}>
              <input type="hidden" name="setId" value={selectedSet.id} />
              <button className="w-full rounded-full border border-[color:var(--line)] px-4 py-3 text-sm text-[color:var(--foreground)]">
                Reset values to defaults
              </button>
            </form>
            {selectedSet.status !== "PUBLISHED" ? (
              <form action={publishAssumptionSetAction}>
                <input type="hidden" name="setId" value={selectedSet.id} />
                <button className="w-full rounded-full border border-[color:rgba(15,124,134,0.3)] bg-[color:rgba(15,124,134,0.12)] px-4 py-3 text-sm text-[color:var(--teal)]">
                  Publish this set
                </button>
              </form>
            ) : null}
          </div>
        </aside>

        <div className="space-y-6">
          <section className="surface-card rounded-[2rem] p-6">
            <form className="grid gap-4 md:grid-cols-3 xl:grid-cols-7" action="/assumptions" method="get">
              <input type="hidden" name="set" value={selectedSet.id} />
              <label className="space-y-2 text-sm">
                <span className="font-medium text-[color:var(--foreground)]">Region</span>
                <select className="field-shell" name="region" defaultValue={previewRegion.slug}>
                  {regionBaselines.map((region) => (
                    <option key={region.slug} value={region.slug}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-[color:var(--foreground)]">Installs</span>
                <input
                  className="field-shell"
                  name="installs"
                  type="number"
                  min={1}
                  defaultValue={previewScenario.clinicInstalls}
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-[color:var(--foreground)]">Device</span>
                <select className="field-shell" name="device" defaultValue={previewScenario.deviceMode}>
                  <option value="fundus_only">Fundus only</option>
                  <option value="fundus_ai">Fundus + AI</option>
                  <option value="fundus_oct_adjunct">Fundus + OCT adjunct</option>
                  <option value="oct_only_advanced">OCT only advanced</option>
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-[color:var(--foreground)]">Staffing</span>
                <select className="field-shell" name="staffing" defaultValue={previewScenario.staffingModel}>
                  <option value="existing_staff">Existing</option>
                  <option value="trained_ma_rn">Trained MA/RN</option>
                  <option value="dedicated_coordinator">Coordinator</option>
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-[color:var(--foreground)]">Referral</span>
                <select className="field-shell" name="referral" defaultValue={previewScenario.referralModel}>
                  <option value="local_ophthalmology">Local</option>
                  <option value="regional_hub">Regional hub</option>
                  <option value="tele_ophthalmology_network">Tele network</option>
                </select>
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-[color:var(--foreground)]">Infrastructure</span>
                <select
                  className="field-shell"
                  name="infrastructure"
                  defaultValue={previewScenario.infrastructurePackage}
                >
                  <option value="lean">Lean</option>
                  <option value="connected">Connected</option>
                  <option value="accelerated">Accelerated</option>
                </select>
              </label>
              <button className="self-end rounded-full bg-[color:var(--foreground)] px-4 py-3 text-sm text-[color:var(--background)]">
                Refresh preview
              </button>
            </form>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <PreviewCard
              title={`Selected set · ${selectedSet.name}`}
              rateReduction={selectedResult.predictedDiabetesRateReductionPctPoints.base}
              screens={selectedResult.additionalScreenings.base}
              cost={selectedResult.yearOneProgramCost.base}
              roi={selectedResult.projectedRoi.base}
            />
            <PreviewCard
              title={`Published set · ${publishedSet.name}`}
              rateReduction={publishedResult.predictedDiabetesRateReductionPctPoints.base}
              screens={publishedResult.additionalScreenings.base}
              cost={publishedResult.yearOneProgramCost.base}
              roi={publishedResult.projectedRoi.base}
            />
          </section>

          <section className="surface-card rounded-[2rem] p-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[color:var(--muted)]">
                  Editable assumptions
                </p>
                <h2 className="mt-1 font-display text-3xl text-[color:var(--foreground)]">
                  {selectedSet.name}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)]">
                Each row saves independently. Low, base, and high must stay ordered, and every
                value is bounded by a guardrail so the calculator cannot drift into implausible ranges.
              </p>
            </div>

            <div className="space-y-4">
              {selectedSet.assumptions.map((assumption) => (
                <form
                  key={`${selectedSet.id}-${assumption.key}`}
                  action={updateAssumptionAction}
                  className="grid gap-4 rounded-[1.4rem] border border-[color:var(--line)] bg-white/75 p-4 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr_auto]"
                >
                  <input type="hidden" name="setId" value={selectedSet.id} />
                  <input
                    type="hidden"
                    name="assumptionId"
                    value={(assumption as { id?: string }).id ?? ""}
                  />
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                      {assumption.category}
                    </p>
                    <p className="mt-1 font-medium text-[color:var(--foreground)]">
                      {assumption.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      {assumption.note}
                    </p>
                  </div>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-[color:var(--foreground)]">Low</span>
                    <input
                      className="field-shell"
                      name="low"
                      type="number"
                      step="0.01"
                      defaultValue={assumption.low}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-[color:var(--foreground)]">Base</span>
                    <input
                      className="field-shell"
                      name="base"
                      type="number"
                      step="0.01"
                      defaultValue={assumption.base}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-[color:var(--foreground)]">High</span>
                    <input
                      className="field-shell"
                      name="high"
                      type="number"
                      step="0.01"
                      defaultValue={assumption.high}
                    />
                  </label>
                  <button className="self-end rounded-full border border-[color:var(--line)] px-4 py-3 text-sm text-[color:var(--foreground)]">
                    Save
                  </button>
                </form>
              ))}
            </div>
          </section>
        </div>
      </section>
    </>
  );
}

function PreviewCard({
  title,
  rateReduction,
  screens,
  cost,
  roi,
}: {
  title: string;
  rateReduction: number;
  screens: number;
  cost: number;
  roi: number;
}) {
  return (
    <article className="surface-card rounded-[1.8rem] p-6">
      <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[color:var(--muted)]">
        Preview
      </p>
      <h2 className="mt-2 font-display text-3xl text-[color:var(--foreground)]">{title}</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <PreviewMetric label="Rate reduction" value={formatPercent(rateReduction, 2)} />
        <PreviewMetric label="Additional screens" value={formatNumber(screens)} />
        <PreviewMetric label="Year-one cost" value={formatCurrency(cost)} />
        <PreviewMetric label="ROI" value={formatPercent(roi * 100, 0)} />
      </div>
    </article>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-[color:var(--line)] bg-white/75 p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-3 font-display text-3xl text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}
