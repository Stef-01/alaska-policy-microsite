"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeftRight,
  ArrowRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  ChevronDown,
  Coins,
  Eye,
  EyeOff,
  HeartPulse,
  Info,
  Landmark,
  ShieldAlert,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

import { buildComparisonScenarios, simulateScenario } from "@/lib/simulation";
import {
  clamp,
  formatCurrency,
  formatNumber,
  formatPercent,
  titleCase,
} from "@/lib/utils";
import type {
  AssumptionSet,
  DeviceMode,
  InfrastructurePackage,
  InterventionScenario,
  RangeValue,
  ReferralModel,
  RegionBaseline,
  SimulationResult,
  SourceNote,
  StaffingModel,
} from "@/types/domain";

const deviceOptions: Array<{ value: DeviceMode; label: string; note: string }> = [
  {
    value: "fundus_only",
    label: "Fundus only",
    note: "Default public baseline. Strongest fit for broad rollout and clearest evidence base.",
  },
  {
    value: "fundus_ai",
    label: "Fundus + FDA-cleared AI",
    note: "Adds automation and triage support while staying within a fundus-first workflow.",
  },
  {
    value: "fundus_oct_adjunct",
    label: "Fundus + OCT adjunct",
    note: "Adds richer retinal detail but raises cost and slows throughput.",
  },
  {
    value: "oct_only_advanced",
    label: "OCT-only advanced",
    note: "Exploratory only. Lower confidence than fundus-first deployment for diabetic retinopathy screening.",
  },
];

type ActiveTab = "health" | "economic";
type ValueFormat = "count" | "currency" | "percent" | "decimal";
type Tone = "teal" | "navy" | "warm" | "gold";
const DISPLAY_HORIZON_YEARS = 3;

const toneClasses: Record<
  Tone,
  {
    shell: string;
    pill: string;
    bar: string;
  }
> = {
  teal: {
    shell:
      "border-[color:rgba(15,124,134,0.22)] bg-[linear-gradient(180deg,rgba(15,124,134,0.14),rgba(15,124,134,0.05))]",
    pill: "bg-[color:rgba(15,124,134,0.14)] text-[color:var(--teal)]",
    bar: "bg-[linear-gradient(90deg,#0f7c86,#6dc3c2)]",
  },
  navy: {
    shell:
      "border-[color:rgba(16,34,53,0.18)] bg-[linear-gradient(180deg,rgba(16,34,53,0.1),rgba(16,34,53,0.04))]",
    pill: "bg-[color:rgba(16,34,53,0.1)] text-[color:var(--foreground)]",
    bar: "bg-[linear-gradient(90deg,#102235,#38546f)]",
  },
  warm: {
    shell:
      "border-[color:rgba(196,97,42,0.22)] bg-[linear-gradient(180deg,rgba(196,97,42,0.14),rgba(196,97,42,0.04))]",
    pill: "bg-[color:rgba(196,97,42,0.13)] text-[color:var(--accent)]",
    bar: "bg-[linear-gradient(90deg,#c4612a,#f2a56e)]",
  },
  gold: {
    shell:
      "border-[color:rgba(180,136,23,0.22)] bg-[linear-gradient(180deg,rgba(180,136,23,0.14),rgba(180,136,23,0.05))]",
    pill: "bg-[color:rgba(180,136,23,0.12)] text-[color:#7b5b08]",
    bar: "bg-[linear-gradient(90deg,#a77a00,#f0c35d)]",
  },
};

export function SimulatorClient({
  regions,
  activeAssumptionSet,
  sourceNotes,
}: {
  regions: RegionBaseline[];
  activeAssumptionSet: AssumptionSet;
  sourceNotes: SourceNote[];
}) {
  const [scenario, setScenario] = useState<InterventionScenario>({
    regionSlug: regions[0]?.slug ?? "anchorage",
    clinicInstalls: 3,
    deviceMode: "fundus_ai",
    staffingModel: "trained_ma_rn",
    referralModel: "regional_hub",
    infrastructurePackage: "connected",
    adoptionLevel: "medium",
    additionalAnnualProgramCost: 20000,
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>("health");
  const [revealPercent, setRevealPercent] = useState(100);

  const region = regions.find((item) => item.slug === scenario.regionSlug) ?? regions[0];
  const assumptionLookup = Object.fromEntries(
    activeAssumptionSet.assumptions.map((assumption) => [assumption.key, assumption])
  );
  const sanitizedScenario = {
    ...scenario,
    clinicInstalls: clamp(scenario.clinicInstalls, 1, region.eligiblePrimaryCareSites),
  };
  const result = simulateScenario(region, activeAssumptionSet, sanitizedScenario);
  const comparisonScenarios = buildComparisonScenarios(region);
  const comparisonResults = comparisonScenarios.map((item) => ({
    scenario: item,
    result: simulateScenario(region, activeAssumptionSet, item),
  }));
  const baselineBlindness = result.baselineBlindnessConsequences.base;
  const interventionBlindness = result.interventionBlindnessConsequences.base;
  const blindnessReductionShare =
    baselineBlindness > 0 ? (result.blindnessAvoided.base / baselineBlindness) * 100 : 0;
  const missedPopulationShare =
    result.baselineSnapshot.missedPatients > 0
      ? result.additionalScreenings.base / result.baselineSnapshot.missedPatients
      : 0;
  const followUpLiftShare =
    result.baselineSnapshot.followUpPatients > 0
      ? result.earlierInterventions.base / result.baselineSnapshot.followUpPatients
      : 0;
  const modeledCoverageCeiling = Math.round(
    region.estimatedAdultsWithDiabetes *
      (assumptionLookup.max_coverage_share?.base ?? 1)
  );
  const coverageSaturated =
    result.interventionSnapshot.screenedPatients >=
    Math.max(result.baselineSnapshot.screenedPatients, modeledCoverageCeiling) - 1;

  const healthEvidenceNotes = sourceNotes.filter((note) =>
    [
      "ada_retinopathy_2026",
      "blindness_prevention_screening",
      "laser_photocoagulation_review",
      "retinopathy_quality_of_life",
      "who_vision_fact_sheet",
    ].includes(note.id)
  );
  const economicEvidenceNotes = sourceNotes.filter((note) =>
    [
      "tele_economics",
      "cost_analysis",
      "primary_care_payback",
      "economic_burden_vision_loss_us",
      "broader_economic_value_dme",
    ].includes(note.id)
  );

  return (
    <div className="grid gap-6 md:grid-cols-[26.5rem_minmax(0,1fr)] md:items-start xl:grid-cols-[28rem_minmax(0,1fr)]">
      <section
        data-testid="calculator-sidebar"
        className="relative z-10 rounded-[2.1rem] border border-[color:rgba(16,34,53,0.14)] bg-[color:#f7f3eb] p-8 shadow-[0_24px_80px_rgba(11,33,50,0.08)] md:sticky md:top-24 md:flex md:max-h-[calc(100vh-7rem)] md:flex-col md:self-start md:isolate md:overflow-hidden"
      >
        <div className="shrink-0">
          <p className="text-[0.72rem] uppercase tracking-[0.32em] text-[color:var(--muted)]">
            Scenario inputs
          </p>
          <h2 className="mt-2 max-w-[14rem] font-display text-[2.75rem] leading-[0.95] text-[color:var(--foreground)]">
            Build a regional deployment
          </h2>
        </div>

        <div className="mt-6 grid shrink-0 grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              document.getElementById("calculator-results")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
            className="rounded-full bg-[color:var(--foreground)] px-4 py-3 text-[0.92rem] font-medium text-white transition-colors hover:bg-[color:#1b3551]"
          >
            Jump to outcomes
          </button>
          <Link
            href="/assumptions"
            className="rounded-full border border-[color:var(--line)] bg-white px-4 py-3 text-center text-[0.92rem] font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:#f6f1e6]"
          >
            Fine-tune assumptions
          </Link>
        </div>

        <div
          data-testid="calculator-sidebar-scroll"
          className="quiet-scrollbar relative mt-7 space-y-5 md:min-h-0 md:flex-1 md:overflow-y-auto md:pr-4 md:[scrollbar-gutter:stable]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden h-7 bg-[linear-gradient(180deg,#f7f3eb,rgba(247,243,235,0))] md:block" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden h-12 bg-[linear-gradient(0deg,#f7f3eb,rgba(247,243,235,0))] md:block" />

          <label className="block space-y-2 text-[0.92rem]">
            <span className="font-medium text-[color:var(--foreground)]">Region</span>
            <select
              data-testid="region-select"
              className="field-shell min-h-[3.9rem] px-5 py-3 text-[1.05rem]"
              value={scenario.regionSlug}
              onChange={(event) =>
                setScenario((current) => ({
                  ...current,
                  regionSlug: event.target.value,
                }))
              }
            >
              {regions.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-[0.92rem]">
            <span className="flex items-center justify-between font-medium text-[color:var(--foreground)]">
              <span>Clinic installs</span>
              <span className="text-[color:var(--muted)]">
                {sanitizedScenario.clinicInstalls} / {region.eligiblePrimaryCareSites}
              </span>
            </span>
            <input
              data-testid="clinic-installs-input"
              className="w-full accent-[color:var(--accent)]"
              type="range"
              min={1}
              max={region.eligiblePrimaryCareSites}
              value={sanitizedScenario.clinicInstalls}
              onChange={(event) =>
                setScenario((current) => ({
                  ...current,
                  clinicInstalls: Number(event.target.value),
                }))
              }
            />
          </label>

          <div className="grid gap-4 xl:grid-cols-2">
            <label className="block space-y-2 text-[0.92rem]">
              <span className="font-medium text-[color:var(--foreground)]">Device mode</span>
              <select
                data-testid="device-select"
                className="field-shell min-h-[3.6rem] px-4 py-3 text-[1rem]"
                value={scenario.deviceMode}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...current,
                    deviceMode: event.target.value as DeviceMode,
                  }))
                }
              >
                {deviceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-[0.78rem] leading-5 text-[color:var(--muted)]">
                {deviceOptions.find((option) => option.value === scenario.deviceMode)?.note}
              </p>
            </label>

            <label className="block space-y-2 text-[0.92rem]">
              <span className="font-medium text-[color:var(--foreground)]">Staffing model</span>
              <select
                data-testid="staffing-select"
                className="field-shell min-h-[3.6rem] px-4 py-3 text-[1rem]"
                value={scenario.staffingModel}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...current,
                    staffingModel: event.target.value as StaffingModel,
                  }))
                }
              >
                <option value="existing_staff">Existing staff</option>
                <option value="trained_ma_rn">Trained MA/RN</option>
                <option value="dedicated_coordinator">Dedicated coordinator</option>
              </select>
            </label>

            <label className="block space-y-2 text-[0.92rem]">
              <span className="font-medium text-[color:var(--foreground)]">Referral model</span>
              <select
                data-testid="referral-select"
                className="field-shell min-h-[3.6rem] px-4 py-3 text-[1rem]"
                value={scenario.referralModel}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...current,
                    referralModel: event.target.value as ReferralModel,
                  }))
                }
              >
                <option value="local_ophthalmology">Local ophthalmology</option>
                <option value="regional_hub">Regional hub</option>
                <option value="tele_ophthalmology_network">Tele-ophthalmology network</option>
              </select>
            </label>

            <label className="block space-y-2 text-[0.92rem]">
              <span className="font-medium text-[color:var(--foreground)]">
                Infrastructure package
              </span>
              <select
                data-testid="infrastructure-select"
                className="field-shell min-h-[3.6rem] px-4 py-3 text-[1rem]"
                value={scenario.infrastructurePackage}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...current,
                    infrastructurePackage: event.target.value as InfrastructurePackage,
                  }))
                }
              >
                <option value="lean">Lean</option>
                <option value="connected">Connected</option>
                <option value="accelerated">Accelerated</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <label className="block space-y-2 text-[0.92rem]">
              <span className="font-medium text-[color:var(--foreground)]">Adoption level</span>
              <select
                data-testid="adoption-select"
                className="field-shell min-h-[3.6rem] px-4 py-3 text-[1rem]"
                value={scenario.adoptionLevel}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...current,
                    adoptionLevel: event.target.value as InterventionScenario["adoptionLevel"],
                  }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="block space-y-2 text-[0.92rem]">
              <span className="font-medium text-[color:var(--foreground)]">
                Additional annual program cost
              </span>
              <input
                data-testid="program-cost-input"
                className="field-shell min-h-[3.6rem] px-4 py-3 text-[1rem]"
                type="number"
                min={0}
                step={5000}
                value={scenario.additionalAnnualProgramCost}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...current,
                    additionalAnnualProgramCost: Number(event.target.value) || 0,
                  }))
                }
              />
            </label>
          </div>

          <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-[color:rgba(15,124,134,0.08)] p-5 text-[0.88rem] leading-6 text-[color:var(--foreground)]">
            <p className="font-medium">Current baseline for {region.name}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <BaselineMiniStat
                label="Adult diabetes prevalence"
                value={formatPercent(region.diabetesPrevalencePct)}
              />
              <BaselineMiniStat
                label="Current eye screening rate"
                value={formatPercent(region.currentEyeScreeningRatePct)}
              />
              <BaselineMiniStat
                label="Adults currently missed"
                value={formatSmartCount(result.baselineSnapshot.missedPatients)}
              />
              <BaselineMiniStat
                label="Severe retinal harm expected"
                value={formatSmartCount(result.baselineSevereConsequences.base)}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="min-w-0 space-y-6">
        <section
          id="calculator-results"
          data-testid="calculator-results"
          className="surface-card relative overflow-hidden rounded-[2.2rem] p-6 md:p-8"
        >
          <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_right,rgba(15,124,134,0.18),transparent_55%),radial-gradient(circle_at_left,rgba(196,97,42,0.14),transparent_45%)]" />
          <div className="relative space-y-6">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] uppercase tracking-[0.32em] text-[color:var(--muted)]">
                Calculator results
              </p>
              <h2 className="mt-3 max-w-3xl font-display text-4xl leading-[0.98] text-[color:var(--foreground)] md:text-[3.7rem]">
                See the care gap, the vision risk, and the modeled shift.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
                Start with the short-read cards, then open only the pieces that need explanation.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
              <div className="grid gap-4 sm:grid-cols-2">
                <InsightChip
                  icon={TrendingUp}
                  label="Indicative diabetes-rate reduction"
                  value={formatPercent(result.predictedDiabetesRateReductionPctPoints.base, 2)}
                  tone="navy"
                  quickFact={`${formatSmartCount(result.reengagedPatients.base)} people are modeled to re-enter broader diabetes care, which is the bridge used to estimate this prevalence movement.`}
                  detail="This is a synthetic bridge estimate, not a directly observed prevalence change. The model converts newly re-engaged patients into improved diabetes control and then into a bounded percentage-point movement in diabetes prevalence over three years."
                />
                <InsightChip
                  icon={Eye}
                  label="Newly seen each year"
                  value={formatSmartCount(result.additionalScreenings.base)}
                  tone="teal"
                  quickFact={`${formatPercent(missedPopulationShare * 100)} of the currently missed population is brought into screening each year in this scenario.`}
                  detail="This card shows the annual lift in people entering the retinal screening pathway. It is the clearest first signal of access improvement because it moves patients from being invisible to being reachable by the care pathway."
                />
                <InsightChip
                  icon={Stethoscope}
                  label="More completing follow-up"
                  value={formatSmartCount(result.earlierInterventions.base)}
                  tone="gold"
                  quickFact={`${formatPercent(followUpLiftShare * 100)} more confirmed follow-up than the current baseline follow-up volume.`}
                  detail="Screening only matters if suspicious findings convert into confirmed eye-care follow-up. This card isolates that handoff step, which is where earlier detection starts to turn into actual clinical protection."
                />
                <InsightChip
                  icon={EyeOff}
                  label="Blindness cases avoided"
                  value={formatSmartCount(result.blindnessAvoided.base)}
                  tone="warm"
                  quickFact={baselineBlindness > 0
                    ? `${formatPercent(blindnessReductionShare)} fewer cases likely ending in blindness or profound permanent vision loss over ${DISPLAY_HORIZON_YEARS} years.`
                    : "The model does not generate enough baseline blindness-risk volume to show a stable reduction share in this scenario."}
                  detail="This is the most tangible long-run vision-protection signal in the model. It estimates how many cases that might otherwise progress into blindness or profound permanent loss of sight are plausibly diverted by earlier screening and follow-up."
                />
              </div>

              <BlindnessReductionSpotlight
                baselineBlindness={baselineBlindness}
                interventionBlindness={interventionBlindness}
                blindnessAvoided={result.blindnessAvoided.base}
                blindnessReductionShare={blindnessReductionShare}
                severeConsequencesAvoided={result.severeConsequencesAvoided.base}
                confidenceLabel={result.confidenceLabel}
              />
            </div>

            <PathwaySummaryPanel
              confidenceLabel={result.confidenceLabel}
              pathway={result.pathway}
            />
          </div>
        </section>

        <section className="surface-card rounded-[2.2rem] p-6 md:p-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] xl:items-end">
            <div className="min-w-0">
              <p className="text-[0.72rem] uppercase tracking-[0.32em] text-[color:var(--muted)]">
                Before and after compare
              </p>
              <h2 className="mt-3 max-w-2xl font-display text-4xl leading-[0.98] text-[color:var(--foreground)] md:text-[3.2rem]">
                Give the baseline and the modeled future their own stage.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                Read today first, then slide into the modeled after-state.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <CompareHighlightStat
                label="Blindness cases avoided"
                value={formatSmartCount(result.blindnessAvoided.base)}
                note={baselineBlindness > 0
                  ? `${formatPercent(blindnessReductionShare)} lower than the modeled baseline blindness risk over ${DISPLAY_HORIZON_YEARS} years.`
                  : "Indicative count only because the modeled baseline blindness volume is extremely small."}
                tone="teal"
              />
              <CompareHighlightStat
                label="Severe harm avoided"
                value={formatSmartCount(result.severeConsequencesAvoided.base)}
                note="Major preventable retinal harm diverted through earlier detection and routing."
                tone="gold"
              />
              <CompareHighlightStat
                label="More confirmed follow-up"
                value={formatSmartCount(result.earlierInterventions.base)}
                note="Patients who move from screening into confirmed eye-care follow-up."
                tone="navy"
              />
            </div>
          </div>

          <ImpactCompareSlider
            diabeticAdults={region.estimatedAdultsWithDiabetes}
            result={result}
            revealPercent={revealPercent}
            onRevealChange={setRevealPercent}
          />
        </section>

        <section className="surface-card rounded-[2rem] p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.32em] text-[color:var(--muted)]">
                Output views
              </p>
              <h2 className="mt-2 font-display text-3xl text-[color:var(--foreground)]">
                Separate the public-health story from the government economics.
              </h2>
            </div>
            <div className="inline-flex rounded-full border border-[color:var(--line)] bg-white/80 p-1">
              <TabButton
                active={activeTab === "health"}
                onClick={() => setActiveTab("health")}
              >
                Health effects
              </TabButton>
              <TabButton
                active={activeTab === "economic"}
                onClick={() => setActiveTab("economic")}
              >
                Economic cost
              </TabButton>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "health" ? (
              <motion.div
                data-testid="health-panel"
                key="health"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="mt-6"
              >
                <HealthEffectsPanel
                  region={region}
                  result={result}
                  modeledCoverageCeiling={modeledCoverageCeiling}
                  coverageSaturated={coverageSaturated}
                  sourceNotes={healthEvidenceNotes}
                />
              </motion.div>
            ) : (
              <motion.div
                data-testid="economic-panel"
                key="economic"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
                className="mt-6"
              >
                <EconomicPanel result={result} sourceNotes={economicEvidenceNotes} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          {comparisonResults.map(({ scenario: comparisonScenario, result: comparisonResult }) => (
            <ComparisonPackageCard
              key={`${comparisonScenario.deviceMode}-${comparisonScenario.clinicInstalls}`}
              scenario={comparisonScenario}
              result={comparisonResult}
            />
          ))}
        </section>

        <section className="surface-card rounded-[2rem] p-6">
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.32em] text-[color:var(--muted)]">
                Assumptions in force
              </p>
              <h2 className="mt-2 font-display text-3xl text-[color:var(--foreground)]">
                {activeAssumptionSet.name}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                {activeAssumptionSet.description}
              </p>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-[color:var(--foreground)]">
                {result.explanation.map((item) => (
                  <li
                    key={item}
                    className="rounded-2xl border border-[color:var(--line)] bg-white/70 px-4 py-3"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-[0.72rem] uppercase tracking-[0.32em] text-[color:var(--muted)]">
                Evidence anchors
              </p>
              {[...healthEvidenceNotes, ...economicEvidenceNotes]
                .filter((note, index, array) => array.findIndex((item) => item.id === note.id) === index)
                .map((note) => (
                  <a
                    key={note.id}
                    href={note.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-[1.4rem] border border-[color:var(--line)] bg-white/70 p-4 transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-[color:var(--foreground)]">{note.name}</p>
                      <span className="rounded-full bg-[color:rgba(15,124,134,0.12)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--teal)]">
                        {note.evidenceTier}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      {note.summary}
                    </p>
                  </a>
                ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ImpactCompareSlider({
  diabeticAdults,
  result,
  revealPercent,
  onRevealChange,
}: {
  diabeticAdults: number;
  result: SimulationResult;
  revealPercent: number;
  onRevealChange: (value: number) => void;
}) {
  const baselineScreeningRate = diabeticAdults > 0
    ? (result.baselineSnapshot.screenedPatients / diabeticAdults) * 100
    : 0;
  const afterScreeningRate = diabeticAdults > 0
    ? (result.interventionSnapshot.screenedPatients / diabeticAdults) * 100
    : 0;
  const baselineMissedRate = diabeticAdults > 0
    ? (result.baselineSnapshot.missedPatients / diabeticAdults) * 100
    : 0;
  const afterMissedRate = diabeticAdults > 0
    ? (result.interventionSnapshot.missedPatients / diabeticAdults) * 100
    : 0;
  const dividerPercent = clamp(revealPercent, 4, 96);

  const compareRows = [
    {
      label: "Seen through annual screening",
      note: "Adults entering annual retinal screening.",
      baseline: result.baselineSnapshot.screenedPatients,
      after: result.interventionSnapshot.screenedPatients,
      tone: "teal" as Tone,
      icon: Eye,
    },
    {
      label: "Still missed",
      note: "Adults with diabetes still outside screening.",
      baseline: result.baselineSnapshot.missedPatients,
      after: result.interventionSnapshot.missedPatients,
      tone: "warm" as Tone,
      icon: EyeOff,
    },
    {
      label: "Completing retinal follow-up",
      note: "Patients reaching confirmed eye-care follow-up.",
      baseline: result.baselineSnapshot.followUpPatients,
      after: result.interventionSnapshot.followUpPatients,
      tone: "navy" as Tone,
      icon: Stethoscope,
    },
    {
      label: "Blindness or profound vision loss",
      note: `Modeled ${DISPLAY_HORIZON_YEARS}-year cases likely ending in blindness or profound permanent loss of sight.`,
      baseline: result.baselineBlindnessConsequences.base,
      after: result.interventionBlindnessConsequences.base,
      tone: "gold" as Tone,
      icon: EyeOff,
    },
  ];

  return (
    <article
      data-testid="compare-view"
      className="relative mt-6 min-w-0 self-start overflow-hidden rounded-[2rem] border border-[color:var(--line)] bg-[color:rgba(255,255,255,0.92)] backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(196,97,42,0.16),rgba(244,240,234,0.8)_45%,rgba(15,124,134,0.12))]" />
      <div className="relative min-h-[36rem] md:min-h-[40rem]">
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - revealPercent}% 0 0)` }}
        >
          <CompareScene
            title="Current baseline"
            subtitle="Current annual picture"
            diabeticAdults={diabeticAdults}
            screeningRate={baselineScreeningRate}
            missedRate={baselineMissedRate}
            rows={compareRows}
            mode="baseline"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 0 0 ${revealPercent}%)` }}
        >
          <CompareScene
            title="After investment"
            subtitle="Annual picture after deployment"
            diabeticAdults={diabeticAdults}
            screeningRate={afterScreeningRate}
            missedRate={afterMissedRate}
            rows={compareRows}
            mode="after"
          />
        </div>
        <div
          className="absolute inset-y-4 z-20 w-px bg-white/95 shadow-[0_0_0_1px_rgba(16,34,53,0.08)]"
          style={{ left: `calc(${dividerPercent}% - 1px)` }}
        >
          <div className="absolute left-1/2 top-1/2 flex h-14 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-[color:#102235] text-white shadow-xl">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="relative z-20 border-t border-[color:var(--line)] bg-[color:#faf7f0]/90 px-5 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
          <span>Current baseline</span>
          <span>Side-scroll to reveal the modeled investment effect</span>
          <span>After investment</span>
        </div>
        <input
          data-testid="compare-slider"
          className="w-full accent-[color:var(--teal)]"
          type="range"
          min={0}
          max={100}
          value={revealPercent}
          onChange={(event) => onRevealChange(Number(event.target.value))}
        />
      </div>
    </article>
  );
}

function CompareScene({
  title,
  subtitle,
  diabeticAdults,
  screeningRate,
  missedRate,
  rows,
  mode,
}: {
  title: string;
  subtitle: string;
  diabeticAdults: number;
  screeningRate: number;
  missedRate: number;
  rows: Array<{
    label: string;
    note: string;
    baseline: number;
    after: number;
    tone: Tone;
    icon: LucideIcon;
  }>;
  mode: "baseline" | "after";
}) {
  const isAfter = mode === "after";

  return (
    <div
      className={`absolute inset-0 p-6 ${
        isAfter
          ? "bg-[linear-gradient(180deg,rgba(16,34,53,0.96),rgba(16,34,53,0.9))] text-white"
          : "text-[color:var(--foreground)]"
      }`}
    >
      <div
        className={`flex flex-wrap items-center gap-3 ${
          isAfter ? "justify-end text-right" : "justify-between"
        }`}
      >
        <div className={isAfter ? "order-2 text-right" : ""}>
          <p
            className={`text-[0.72rem] uppercase tracking-[0.28em] ${
              isAfter ? "text-white/55" : "text-[color:var(--muted)]"
            }`}
          >
            {subtitle}
          </p>
          <h3 className="mt-2 font-display text-[2.4rem] leading-[0.96]">{title}</h3>
        </div>
        <div className={`flex flex-wrap gap-2 ${isAfter ? "justify-end" : ""}`}>
          <div
            className={`rounded-full border px-4 py-2 text-sm ${
              isAfter
                ? "border-white/10 bg-white/5 text-white/80"
                : "border-[color:var(--line)] bg-white/80 text-[color:var(--foreground)]"
            }`}
          >
            {formatSmartCount(diabeticAdults)} adults with diabetes
          </div>
          <div
            className={`rounded-full border px-4 py-2 text-sm ${
              isAfter
                ? "border-white/10 bg-white/5 text-white/80"
                : "border-[color:var(--line)] bg-white/80 text-[color:var(--foreground)]"
            }`}
          >
            {formatPercent(screeningRate)} screened annually
          </div>
          <div
            className={`rounded-full border px-4 py-2 text-sm ${
              isAfter
                ? "border-white/10 bg-white/5 text-white/80"
                : "border-[color:var(--line)] bg-white/80 text-[color:var(--foreground)]"
            }`}
          >
            {formatPercent(missedRate)} still missed
          </div>
        </div>
      </div>

      <div className={`mt-6 space-y-4 ${isAfter ? "ml-auto max-w-[92%]" : "max-w-[94%]"}`}>
        {rows.map((row) => {
          const value = isAfter ? row.after : row.baseline;
          const maxValue = Math.max(row.baseline, row.after, 1);

          return (
            <CompareMetricCard
              key={`${mode}-${row.label}`}
              icon={row.icon}
              label={row.label}
              note={row.note}
              value={value}
              maxValue={maxValue}
              tone={row.tone}
              dark={isAfter}
            />
          );
        })}
      </div>
    </div>
  );
}

function HealthEffectsPanel({
  region,
  result,
  modeledCoverageCeiling,
  coverageSaturated,
  sourceNotes,
}: {
  region: RegionBaseline;
  result: SimulationResult;
  modeledCoverageCeiling: number;
  coverageSaturated: boolean;
  sourceNotes: SourceNote[];
}) {
  return (
    <div className="grid gap-4 2xl:grid-cols-[1.08fr_0.92fr]">
      <article className="rounded-[1.8rem] border border-[color:var(--line)] bg-white/85 p-5">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[color:var(--muted)]">
          Public-health view
        </p>
        <h3 className="mt-2 font-display text-3xl text-[color:var(--foreground)]">
          Read the care-pathway shift in four steps.
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
          Missed today. Screened after deployment. Follow-up completed. Severe harm avoided.
        </p>
        {coverageSaturated ? (
          <div className="mt-4 rounded-[1.2rem] border border-[color:rgba(15,124,134,0.16)] bg-[color:rgba(15,124,134,0.08)] px-4 py-3 text-sm leading-6 text-[color:var(--foreground)]">
            Modeled annual reach ceiling in view: under the active assumptions, this pathway tops
            out around {formatSmartCount(modeledCoverageCeiling)} adults screened each year in{" "}
            {region.name}. More installs may still change cost and resilience even when annual
            reach is flat.
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          <TransitionMetricCard
            label="Still missed each year"
            before={result.baselineSnapshot.missedPatients}
            after={result.interventionSnapshot.missedPatients}
            tone="warm"
            format="count"
            direction="down"
            shareOf={region.estimatedAdultsWithDiabetes}
            shareLabel="adults with diabetes"
            caption={`Annual adults with diabetes in ${region.name} still outside retinal screening.`}
          />
          <TransitionMetricCard
            label="Screened each year"
            before={result.baselineSnapshot.screenedPatients}
            after={result.interventionSnapshot.screenedPatients}
            tone="teal"
            format="count"
            direction="up"
            shareOf={region.estimatedAdultsWithDiabetes}
            shareLabel="adults with diabetes"
            caption="Annual adults entering the screening pathway."
          />
          <TransitionMetricCard
            label="Confirmed follow-up each year"
            before={result.baselineSnapshot.followUpPatients}
            after={result.interventionSnapshot.followUpPatients}
            tone="navy"
            format="count"
            direction="up"
            caption="Patients who make it from screening into confirmed retinal follow-up."
          />
          <TransitionMetricCard
            label="Severe harm avoided over 3 years"
            before={0}
            after={result.severeConsequencesAvoided.base}
            tone="gold"
            format="count"
            direction="up"
            shareOf={result.baselineSevereConsequences.base}
            shareLabel="modeled baseline severe-harm cases"
            caption="Three-year preventable severe retinal consequences avoided through earlier management."
          />
        </div>
      </article>

      <article className="rounded-[1.8rem] border border-[color:rgba(16,34,53,0.08)] bg-[linear-gradient(180deg,#102235,#17314a)] p-5 text-white">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/55">
          Downstream health effects
        </p>
        <h3 className="mt-2 font-display text-3xl">What the model says gets prevented later.</h3>

        <div className="mt-5 space-y-3">
          <HealthOutcomeRow
            icon={ShieldAlert}
            label="Severe consequences avoided"
            value={result.severeConsequencesAvoided}
            format="count"
            tone="gold"
            caption="Three-year major preventable vision-threatening events diverted through earlier detection and routing."
          />
          <HealthOutcomeRow
            icon={Eye}
            label="Blindness or profound vision loss avoided"
            value={result.blindnessAvoided}
            format="count"
            tone="teal"
            caption="Subset of major preventable harm that would likely have ended in blindness or profound permanent loss of sight."
          />
          <HealthOutcomeRow
            icon={HeartPulse}
            label="Late-stage surgeries avoided"
            value={result.surgeriesAvoided}
            format="count"
            tone="warm"
            caption="Proxy for vitrectomy-scale surgery or other invasive rescue interventions avoided."
          />
          <HealthOutcomeRow
            icon={Users}
            label="People re-engaged in diabetes care"
            value={result.reengagedPatients}
            format="count"
            tone="navy"
            caption="Patients pulled back into broader diabetes management because the screening event creates a new touchpoint."
          />
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
          <p className="text-sm font-medium text-white">Why this is the most useful public-health lens</p>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-white/72">
            <li>It puts the currently missed population on the screen instead of hiding them behind ROI math.</li>
            <li>It shows the screening pathway as a patient story: seen, followed up, protected from late harm.</li>
            <li>It frames blindness and surgery as downstream consequences of delayed detection, not isolated events.</li>
            <li>It keeps the model honest by treating severe harm, blindness, and surgeries as indicative planning outputs rather than exact forecasts.</li>
          </ul>
        </div>

        <div className="mt-5 grid gap-3">
          {sourceNotes.map((note) => (
            <a
              key={note.id}
              href={note.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4 transition-transform hover:-translate-y-0.5"
            >
              <p className="font-medium text-white">{note.name}</p>
              <p className="mt-1 text-sm leading-6 text-white/65">{note.summary}</p>
            </a>
          ))}
        </div>
      </article>
    </div>
  );
}

function EconomicPanel({
  result,
  sourceNotes,
}: {
  result: SimulationResult;
  sourceNotes: SourceNote[];
}) {
  const valueRows = [
    {
      label: "Year-one program cost",
      value: result.yearOneProgramCost.base * -1,
      tone: "warm" as Tone,
      note: "Capex, training, connectivity, and annual program support in year one.",
    },
    {
      label: "Screening value captured",
      value: result.screeningValue.base,
      tone: "teal" as Tone,
      note: "Modeled funded value or reimbursement captured from the expanded screening volume.",
    },
    {
      label: "Direct medical savings",
      value: result.directMedicalSavings.base,
      tone: "navy" as Tone,
      note: "Earlier case routing plus broader diabetes re-engagement savings.",
    },
    {
      label: "Productivity protected",
      value: result.productivityProtected.base,
      tone: "gold" as Tone,
      note: "Conservative labor-force and productivity value protected by avoiding major vision loss.",
    },
    {
      label: "Three-year net public value",
      value: result.projectedThreeYearNetValue.base,
      tone: result.projectedThreeYearNetValue.base >= 0 ? ("teal" as Tone) : ("warm" as Tone),
      note: "Three-year modeled benefit minus three-year modeled cost.",
    },
  ];
  const maxAbs = Math.max(...valueRows.map((row) => Math.abs(row.value)), 1);

  return (
    <div className="grid gap-4 2xl:grid-cols-[1.05fr_0.95fr]">
      <article className="min-w-0 rounded-[1.8rem] border border-[color:var(--line)] bg-white/85 p-5">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[color:var(--muted)]">
          Government view
        </p>
        <h3 className="mt-2 font-display text-3xl text-[color:var(--foreground)]">
          Make the public value legible for budget and policy decisions.
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
          This screen is designed for agencies and executive teams. It distinguishes program spend
          from direct medical savings, broader productivity protection, and non-monetized burden
          metrics like QALYs and DALYs.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
          <OutcomeCard
            icon={Coins}
            label="Three-year benefit"
            value={result.projectedThreeYearBenefit}
            format="currency"
            tone="teal"
            caption="Combined screening value, direct medical savings, and productivity protected."
          />
          <OutcomeCard
            icon={TrendingUp}
            label="Three-year ROI"
            value={{
              low: result.projectedRoi.low * 100,
              base: result.projectedRoi.base * 100,
              high: result.projectedRoi.high * 100,
            }}
            format="percent"
            tone="navy"
            caption="Modeled return including productivity, but excluding any monetized QALY or DALY valuation."
          />
          <OutcomeCard
            icon={BadgeDollarSign}
            label="Cost per newly seen patient"
            value={result.costPerNewPatientSeen}
            format="currency"
            tone="gold"
            caption="Year-one program spend per additional patient brought into annual screening."
          />
          <OutcomeCard
            icon={Landmark}
            label="Cost per severe consequence avoided"
            value={result.costPerSevereConsequenceAvoided}
            format="currency"
            tone="warm"
            caption="Three-year modeled cost divided by severe preventable retinal harm avoided."
          />
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:#faf7f0] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Value stack
              </p>
              <h4 className="mt-1 font-display text-2xl text-[color:var(--foreground)]">
                What is doing the work economically
              </h4>
            </div>
            <div className="rounded-full bg-[color:#102235] px-4 py-2 text-sm text-white">
              Net {formatSignedCurrency(result.projectedThreeYearNetValue.base)}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {valueRows.map((row) => (
              <div key={row.label} className="rounded-[1.2rem] border border-[color:var(--line)] bg-white/85 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[color:var(--foreground)]">{row.label}</p>
                    <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">{row.note}</p>
                  </div>
                  <p className="font-display text-2xl text-[color:var(--foreground)]">
                    {formatSignedCurrency(row.value)}
                  </p>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-[color:#efe8db]">
                  <div
                    className={`h-full rounded-full ${toneClasses[row.tone].bar}`}
                    style={{
                      width: `${Math.max((Math.abs(row.value) / maxAbs) * 100, Math.abs(row.value) > 0 ? 8 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>

      <article className="min-w-0 rounded-[1.8rem] border border-[color:rgba(16,34,53,0.08)] bg-[linear-gradient(180deg,#102235,#17314a)] p-5 text-white">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/55">
          Population-value metrics
        </p>
        <h3 className="mt-2 font-display text-3xl">Show what the cash line does not capture.</h3>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
          <OutcomeCard
            icon={HeartPulse}
            label="QALYs gained"
            value={result.qalyGained}
            format="decimal"
            tone="teal"
            caption="Indicative quality-adjusted life years protected by avoiding severe vision loss and blindness."
            dark
          />
          <OutcomeCard
            icon={Activity}
            label="DALYs avoided"
            value={result.dalysAvoided}
            format="decimal"
            tone="gold"
            caption="Indicative disability-adjusted life years not lost to preventable major retinal harm."
            dark
          />
          <OutcomeCard
            icon={BriefcaseBusiness}
            label="Productivity protected"
            value={result.productivityProtected}
            format="currency"
            tone="navy"
            caption="Conservative three-year labor-force and productivity value preserved."
            dark
          />
          <OutcomeCard
            icon={Coins}
            label="Direct medical savings"
            value={result.directMedicalSavings}
            format="currency"
            tone="warm"
            caption="Health-system savings from earlier intervention and broader diabetes re-engagement."
            dark
          />
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
          <p className="text-sm font-medium text-white">Why this is the right government-facing frame</p>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-white/72">
            <li>Budget holders get the near-term cost, benefit, and unit-cost story in one panel.</li>
            <li>Productivity is separated from direct medical savings instead of hiding inside ROI.</li>
            <li>QALYs and DALYs stay visible as public value, but are not monetized into the ROI line.</li>
            <li>The model keeps the burden metrics indicative, bounded, and adjustable in the model assumptions workspace.</li>
          </ul>
        </div>

        <div className="mt-5 grid gap-3">
          {sourceNotes.map((note) => (
            <a
              key={note.id}
              href={note.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4 transition-transform hover:-translate-y-0.5"
            >
              <p className="font-medium text-white">{note.name}</p>
              <p className="mt-1 text-sm leading-6 text-white/65">{note.summary}</p>
            </a>
          ))}
        </div>
      </article>
    </div>
  );
}

function ComparisonPackageCard({
  scenario,
  result,
}: {
  scenario: InterventionScenario;
  result: SimulationResult;
}) {
  const accentTone =
    scenario.infrastructurePackage === "lean"
      ? "warm"
      : scenario.infrastructurePackage === "connected"
        ? "teal"
        : "navy";

  return (
    <article
      className={`surface-card rounded-[1.8rem] border p-5 ${toneClasses[accentTone].shell}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.32em] text-[color:var(--muted)]">
            Comparison package
          </p>
          <h3 className="mt-2 font-display text-2xl text-[color:var(--foreground)]">
            {titleCase(scenario.infrastructurePackage)} · {titleCase(scenario.deviceMode)}
          </h3>
          <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
            {scenario.clinicInstalls} installs · {titleCase(scenario.staffingModel)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${toneClasses[accentTone].pill}`}>
          {scenario.referralModel === "tele_ophthalmology_network"
            ? "network-led"
            : scenario.referralModel === "regional_hub"
              ? "hub-routed"
              : "local-routed"}
        </span>
      </div>

      <div className="mt-5 space-y-3 rounded-[1.4rem] border border-[color:var(--line)] bg-white/75 p-4 text-sm">
        <ComparisonRow
          label="Newly seen each year"
          value={formatSmartCount(result.additionalScreenings.base)}
        />
        <ComparisonRow
          label="Severe consequences avoided"
          value={formatSmartCount(result.severeConsequencesAvoided.base)}
        />
        <ComparisonRow
          label="Three-year net value"
          value={formatSignedCurrency(result.projectedThreeYearNetValue.base)}
        />
      </div>
    </article>
  );
}

function ComparisonRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[color:var(--muted)]">{label}</span>
      <strong className="text-[color:var(--foreground)]">{value}</strong>
    </div>
  );
}

function BlindnessReductionSpotlight({
  baselineBlindness,
  interventionBlindness,
  blindnessAvoided,
  blindnessReductionShare,
  severeConsequencesAvoided,
  confidenceLabel,
}: {
  baselineBlindness: number;
  interventionBlindness: number;
  blindnessAvoided: number;
  blindnessReductionShare: number;
  severeConsequencesAvoided: number;
  confidenceLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="group relative overflow-hidden rounded-[1.8rem] border border-[color:rgba(16,34,53,0.1)] bg-[linear-gradient(180deg,#102235,#17314a)] p-5 text-white">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/55">
            Vision-protection signal
          </p>
          <h3 className="mt-2 max-w-lg font-display text-3xl leading-[1.02]">
            Make the reduction in blindness risk explicit.
          </h3>
        </div>
        <CardInfoButton
          dark
          open={expanded}
          onClick={() => setExpanded((current) => !current)}
          label="blindness spotlight"
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
        <div className="rounded-[1.3rem] border border-white/10 bg-white/6 px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">Baseline risk</p>
          <p className="mt-3 font-display text-[2.6rem] leading-none">{formatSmartCount(baselineBlindness)}</p>
          <p className="mt-3 text-sm leading-6 text-white/70">
            Modeled {DISPLAY_HORIZON_YEARS}-year cases likely ending in blindness or profound
            permanent vision loss without the added investment.
          </p>
        </div>

        <div className="hidden items-center justify-center sm:flex">
          <div className="rounded-full border border-white/10 bg-white/5 p-3 text-white/70">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">With investment</p>
              <p className="mt-3 font-display text-[2.6rem] leading-none">
                {formatSmartCount(interventionBlindness)}
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-[color:rgba(15,124,134,0.16)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#8fe2dd]">
              {formatSmartCount(blindnessAvoided)} avoided
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-white/70">
            {baselineBlindness > 0
              ? `${formatPercent(blindnessReductionShare)} lower than the modeled baseline blindness risk over ${DISPLAY_HORIZON_YEARS} years.`
              : "Blindness-avoidance count remains indicative because the modeled baseline blindness-risk volume is very small."}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-5 bottom-5 hidden rounded-[1.2rem] border border-white/10 bg-[color:rgba(255,255,255,0.08)] p-4 text-sm leading-6 text-white/78 opacity-0 transition duration-200 md:block md:translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100">
        Severe vision harm avoided and blindness avoided are separated on purpose. In this scenario,
        {` ${formatSmartCount(blindnessAvoided)} `}
        cases plausibly move out of the blindness pathway while
        {` ${formatSmartCount(severeConsequencesAvoided)} `}
        major retinal harms are avoided overall.
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/6 p-4 text-sm leading-7 text-white/72"
          >
            <p>
              This blindness spotlight is designed for stakeholder conversations because it converts
              the model into a concrete risk story. Instead of only saying that severe harm falls,
              it shows how many modeled cases likely ending in blindness or profound permanent loss
              of sight could be diverted by earlier screening and confirmed follow-up.
            </p>
            <p className="mt-3">
              Confidence is currently rated {confidenceLabel.toLowerCase()}. That means the card is
              useful for planning direction and comparative scenario review, but it should still be
              read as an indicative estimate rather than an exact clinical forecast.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}

function CompareHighlightStat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: Tone;
}) {
  return (
    <div className={`group relative rounded-[1.35rem] border p-4 ${toneClasses[tone].shell}`}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-3 font-display text-3xl text-[color:var(--foreground)]">{value}</p>
      <div className="pointer-events-none absolute inset-x-4 bottom-4 hidden rounded-[1rem] border border-[color:var(--line)] bg-white/92 p-3 text-xs leading-5 text-[color:var(--foreground)] opacity-0 transition duration-200 md:block md:translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100">
        {note}
      </div>
    </div>
  );
}

function InsightChip({
  icon: Icon,
  label,
  value,
  tone,
  quickFact,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: Tone;
  quickFact: string;
  detail: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`group relative rounded-[1.4rem] border p-4 ${toneClasses[tone].shell}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2 ${toneClasses[tone].pill}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <CardInfoButton
          open={expanded}
          onClick={() => setExpanded((current) => !current)}
          label={label}
        />
      </div>
      <p className="mt-4 max-w-[14rem] text-sm font-medium leading-5 text-[color:var(--foreground)]">
        {label}
      </p>
      <p className="mt-3 font-display text-3xl text-[color:var(--foreground)]">{value}</p>

      <div className="pointer-events-none absolute inset-x-4 bottom-4 hidden rounded-[1rem] border border-[color:var(--line)] bg-white/92 p-3 text-xs leading-5 text-[color:var(--foreground)] opacity-0 transition duration-200 md:block md:translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100">
        {quickFact}
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="mt-4 rounded-[1rem] border border-[color:var(--line)] bg-white/80 p-4 text-sm leading-6 text-[color:var(--foreground)]"
          >
            {detail}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PathwaySummaryPanel({
  confidenceLabel,
  pathway,
}: {
  confidenceLabel: string;
  pathway: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="group rounded-[1.6rem] border border-[color:var(--line)] bg-[color:#102235] p-5 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/65">
              Confidence {confidenceLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/65">
              Pathway summary
            </span>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-white/74">
            The model chain stays available, but it no longer takes over the results page by default.
          </p>
        </div>
        <CardInfoButton
          dark
          open={expanded}
          onClick={() => setExpanded((current) => !current)}
          label="pathway summary"
        />
      </div>

      <div className="pointer-events-none mt-4 hidden rounded-[1.1rem] border border-white/10 bg-white/5 p-3 text-xs leading-5 text-white/74 opacity-0 transition duration-200 md:block md:translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100">
        Open the pathway when you want the causal chain behind the headline outputs.
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.ol
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="mt-4 grid gap-3 lg:grid-cols-2 text-sm leading-7 text-white/78"
          >
            {pathway.map((item) => (
              <li
                key={item}
                className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3"
              >
                {item}
              </li>
            ))}
          </motion.ol>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function BaselineMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-[color:var(--line)] bg-white/82 px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 font-display text-[1.7rem] leading-none text-[color:var(--foreground)]">{value}</p>
    </div>
  );
}

function TransitionMetricCard({
  label,
  before,
  after,
  tone,
  format,
  direction,
  shareOf,
  shareLabel,
  caption,
}: {
  label: string;
  before: number;
  after: number;
  tone: Tone;
  format: ValueFormat;
  direction: "up" | "down";
  shareOf?: number;
  shareLabel?: string;
  caption: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const rawDelta = after - before;
  const delta = direction === "down" ? before - after : rawDelta;
  const maxValue = Math.max(before, after, 1);
  const beforeWidth = Math.max((before / maxValue) * 100, before > 0 ? 8 : 0);
  const afterWidth = Math.max((after / maxValue) * 100, after > 0 ? 8 : 0);
  const beforeShare =
    shareOf && shareOf > 0 ? `${formatPercent((before / shareOf) * 100)} of ${shareLabel}` : null;
  const afterShare =
    shareOf && shareOf > 0 ? `${formatPercent((after / shareOf) * 100)} of ${shareLabel}` : null;

  return (
    <div className={`group relative overflow-hidden rounded-[1.45rem] border p-4 ${toneClasses[tone].shell}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[color:var(--foreground)]">{label}</p>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${toneClasses[tone].pill}`}>
            {direction === "down" ? "\u2193 " : "\u2191 "}
            {formatDelta(delta, format)}
          </span>
          <CardInfoButton
            compact
            open={expanded}
            onClick={() => setExpanded((current) => !current)}
            label={label}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-end">
        <div className="min-w-0 rounded-[1.15rem] border border-white/45 bg-white/55 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Today</p>
          <p className="mt-2 font-display text-[2.35rem] leading-none text-[color:var(--foreground)]">
            {formatByType(before, format)}
          </p>
          {beforeShare ? (
            <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">{beforeShare}</p>
          ) : null}
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-[color:rgba(16,34,53,0.18)]"
              style={{ width: `${beforeWidth}%` }}
            />
          </div>
        </div>

        <div className="hidden justify-center md:flex">
          <div className="rounded-full border border-white/60 bg-white/70 p-2 text-[color:var(--muted)]">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        <div className="min-w-0 rounded-[1.15rem] border border-white/45 bg-white/78 px-4 py-3 md:text-right">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
            With investment
          </p>
          <p className="mt-2 font-display text-[2.35rem] leading-none text-[color:var(--foreground)]">
            {formatByType(after, format)}
          </p>
          {afterShare ? (
            <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">{afterShare}</p>
          ) : null}
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[color:#efe8db]">
            <div
              className={`h-full rounded-full ${toneClasses[tone].bar}`}
              style={{ width: `${afterWidth}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none mt-3 hidden rounded-[1rem] border border-[color:var(--line)] bg-white/92 p-3 text-xs leading-5 text-[color:var(--foreground)] opacity-0 transition duration-200 md:block md:translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100">
        {caption}
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="mt-4 rounded-[1rem] border border-[color:var(--line)] bg-white/80 p-4 text-sm leading-6 text-[color:var(--foreground)]"
          >
            {caption}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function HealthOutcomeRow({
  icon: Icon,
  label,
  value,
  format,
  tone,
  caption,
}: {
  icon: LucideIcon;
  label: string;
  value: RangeValue;
  format: ValueFormat;
  tone: Tone;
  caption: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`rounded-full p-2 ${toneClasses[tone].pill}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-medium text-white">{label}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="shrink-0 sm:text-right">
            <p className="font-display text-[2.35rem] leading-none text-white">
              {formatByType(value.base, format)}
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/50">
              Range {formatRange(value, format)}
            </p>
          </div>
          <CardInfoButton
            dark
            compact
            open={expanded}
            onClick={() => setExpanded((current) => !current)}
            label={label}
          />
        </div>
      </div>

      <div className="pointer-events-none mt-4 hidden rounded-[1rem] border border-white/10 bg-[color:rgba(255,255,255,0.08)] p-3 text-xs leading-5 text-white/78 opacity-0 transition duration-200 md:block md:translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100">
        {caption}
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="mt-4 rounded-[1rem] border border-white/10 bg-[color:rgba(255,255,255,0.06)] p-4 text-sm leading-6 text-white/74"
          >
            {caption}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function OutcomeCard({
  icon: Icon,
  label,
  value,
  format,
  tone,
  caption,
  dark = false,
}: {
  icon: LucideIcon;
  label: string;
  value: RangeValue;
  format: ValueFormat;
  tone: Tone;
  caption: string;
  dark?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`group rounded-[1.4rem] border p-4 ${
        dark
          ? "border-white/10 bg-white/5"
          : toneClasses[tone].shell
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`rounded-full p-2 ${dark ? "bg-white/8 text-white" : toneClasses[tone].pill}`}>
            <Icon className="h-4 w-4" />
          </div>
          <p className={`text-sm font-medium ${dark ? "text-white" : "text-[color:var(--foreground)]"}`}>
            {label}
          </p>
        </div>
        <CardInfoButton
          dark={dark}
          compact
          open={expanded}
          onClick={() => setExpanded((current) => !current)}
          label={label}
        />
      </div>
      <p className={`mt-4 font-display text-4xl ${dark ? "text-white" : "text-[color:var(--foreground)]"}`}>
        {formatByType(value.base, format)}
      </p>

      <div
        className={`pointer-events-none mt-4 hidden rounded-[1rem] border p-3 text-xs leading-5 opacity-0 transition duration-200 md:block md:translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100 ${
          dark
            ? "border-white/10 bg-[color:rgba(255,255,255,0.08)] text-white/76"
            : "border-[color:var(--line)] bg-white/92 text-[color:var(--foreground)]"
        }`}
      >
        <p>{caption}</p>
        <p className={`${dark ? "text-white/52" : "text-[color:var(--muted)]"} mt-2`}>
          Range: {formatRange(value, format)}
        </p>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className={`mt-4 rounded-[1rem] border p-4 text-sm leading-6 ${
              dark
                ? "border-white/10 bg-[color:rgba(255,255,255,0.06)] text-white/74"
                : "border-[color:var(--line)] bg-white/80 text-[color:var(--foreground)]"
            }`}
          >
            <p>{caption}</p>
            <p className={`${dark ? "text-white/52" : "text-[color:var(--muted)]"} mt-2`}>
              Range: {formatRange(value, format)}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CompareMetricCard({
  icon: Icon,
  label,
  note,
  value,
  maxValue,
  tone,
  dark,
}: {
  icon: LucideIcon;
  label: string;
  note: string;
  value: number;
  maxValue: number;
  tone: Tone;
  dark: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`group relative rounded-[1.45rem] border px-4 py-4 ${
        dark ? "border-white/10 bg-white/5" : "border-[color:var(--line)] bg-white/78"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`rounded-full p-2 ${
              dark ? "bg-white/8 text-white" : toneClasses[tone].pill
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <p
            className={`min-w-0 text-base font-medium leading-6 ${
              dark ? "text-white" : "text-[color:var(--foreground)]"
            }`}
          >
            {label}
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="text-right">
            <p className="font-display text-[2.35rem] leading-none">
              {formatSmartCount(value)}
            </p>
          </div>
          <CardInfoButton
            dark={dark}
            compact
            open={expanded}
            onClick={() => setExpanded((current) => !current)}
            label={label}
          />
        </div>
      </div>

      <div
        className={`mt-4 h-3 overflow-hidden rounded-full ${
          dark ? "bg-white/10" : "bg-[color:#efe8db]"
        }`}
      >
        <div
          className={`h-full rounded-full ${toneClasses[tone].bar}`}
          style={{ width: `${Math.max((value / maxValue) * 100, value > 0 ? 8 : 0)}%` }}
        />
      </div>

      <div
        className={`pointer-events-none absolute right-4 top-16 z-20 hidden max-w-[18rem] rounded-[1rem] border p-3 text-xs leading-5 opacity-0 transition duration-200 md:block md:translate-y-2 md:group-hover:translate-y-0 md:group-hover:opacity-100 ${
          dark
            ? "border-white/10 bg-[color:rgba(255,255,255,0.08)] text-white/78"
            : "border-[color:var(--line)] bg-white/92 text-[color:var(--foreground)]"
        }`}
      >
        {note}
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className={`mt-4 rounded-[1rem] border p-3 text-sm leading-6 ${
              dark
                ? "border-white/10 bg-[color:rgba(255,255,255,0.06)] text-white/76"
                : "border-[color:var(--line)] bg-white/78 text-[color:var(--foreground)]"
            }`}
          >
            {note}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function CardInfoButton({
  open,
  onClick,
  label,
  dark = false,
  compact = false,
}: {
  open: boolean;
  onClick: () => void;
  label: string;
  dark?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={`${open ? "Hide" : "Show"} explanation for ${label}`}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-colors ${
        dark
          ? "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
          : "border-[color:var(--line)] bg-white/80 text-[color:var(--muted)] hover:bg-white"
      } ${compact ? "px-2 py-1.5" : ""}`}
    >
      <Info className="h-3.5 w-3.5" />
      {!compact ? <span>{open ? "Hide" : "Explain"}</span> : null}
      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm transition-colors ${
        active
          ? "bg-[color:#102235] text-white"
          : "text-[color:var(--foreground)] hover:bg-[color:#f7f1e6]"
      }`}
    >
      {children}
    </button>
  );
}

function formatSmartCount(value: number) {
  return formatNumber(value, value > 0 && value < 10 ? 1 : 0);
}

function formatSignedCurrency(value: number) {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}${formatCurrency(Math.abs(value))}`;
}

function formatDelta(value: number, format: ValueFormat) {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}${formatByType(Math.abs(value), format)}`;
}

function formatByType(value: number, format: ValueFormat) {
  if (format === "currency") {
    return formatCurrency(value);
  }

  if (format === "percent") {
    return formatPercent(value, 0);
  }

  if (format === "decimal") {
    return formatNumber(value, value < 10 ? 1 : 0);
  }

  return formatSmartCount(value);
}

function formatRange(value: RangeValue, format: ValueFormat) {
  return `${formatByType(value.low, format)} to ${formatByType(value.high, format)}`;
}
