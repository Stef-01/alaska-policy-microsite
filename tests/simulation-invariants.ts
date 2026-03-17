import assert from "node:assert/strict";

import defaultAssumptions from "../src/data/default-assumptions.json";
import dataPack from "../src/data/generated/alaska-data-pack.json";
import {
  buildComparisonScenarios,
  simulateScenario,
} from "../src/lib/simulation";
import type {
  AdoptionLevel,
  AssumptionDefinition,
  AssumptionSet,
  DeviceMode,
  InfrastructurePackage,
  InterventionScenario,
  RangeValue,
  ReferralModel,
  RegionBaseline,
  StaffingModel,
} from "../src/types/domain";

const regions = dataPack.regions as RegionBaseline[];

const assumptionSet: AssumptionSet = {
  id: "validation-default",
  slug: "validation-default",
  name: "Validation Default",
  version: "v1.0",
  description: "Validation harness using the bundled default assumptions.",
  status: "PUBLISHED",
  assumptions: defaultAssumptions as AssumptionDefinition[],
};
const assumptionLookup = Object.fromEntries(
  assumptionSet.assumptions.map((assumption) => [assumption.key, assumption])
);

const deviceModes: DeviceMode[] = [
  "fundus_only",
  "fundus_ai",
  "fundus_oct_adjunct",
  "oct_only_advanced",
];
const staffingModels: StaffingModel[] = [
  "existing_staff",
  "trained_ma_rn",
  "dedicated_coordinator",
];
const referralModels: ReferralModel[] = [
  "local_ophthalmology",
  "regional_hub",
  "tele_ophthalmology_network",
];
const infrastructurePackages: InfrastructurePackage[] = [
  "lean",
  "connected",
  "accelerated",
];
const adoptionLevels: AdoptionLevel[] = ["low", "medium", "high"];

const rangeKeys = [
  "predictedDiabetesRateReductionPctPoints",
  "additionalScreenings",
  "additionalReferableCases",
  "earlierInterventions",
  "reengagedPatients",
  "baselineSevereConsequences",
  "interventionSevereConsequences",
  "severeConsequencesAvoided",
  "blindnessAvoided",
  "surgeriesAvoided",
  "qalyGained",
  "dalysAvoided",
  "directMedicalSavings",
  "productivityProtected",
  "screeningValue",
  "yearOneProgramCost",
  "projectedThreeYearCost",
  "projectedThreeYearBenefit",
  "projectedThreeYearNetValue",
  "costPerNewPatientSeen",
  "costPerFollowUpCompleted",
  "costPerSevereConsequenceAvoided",
  "projectedRoi",
] as const;

const healthInvariantKeys = [
  "predictedDiabetesRateReductionPctPoints",
  "additionalScreenings",
  "additionalReferableCases",
  "earlierInterventions",
  "reengagedPatients",
  "baselineSevereConsequences",
  "interventionSevereConsequences",
  "severeConsequencesAvoided",
  "blindnessAvoided",
  "surgeriesAvoided",
  "qalyGained",
  "dalysAvoided",
] as const;

const errors: string[] = [];
let scenarioChecks = 0;
let monotonicChecks = 0;
let costIsolationChecks = 0;
let comparisonChecks = 0;

function uniqueInstallCounts(region: RegionBaseline) {
  return [
    1,
    Math.max(1, Math.round(region.eligiblePrimaryCareSites / 2)),
    region.eligiblePrimaryCareSites,
  ].filter((value, index, values) => values.indexOf(value) === index);
}

function assertFiniteNumber(value: number, context: string) {
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    errors.push(`${context} is not finite: ${value}`);
  }
}

function assertRange(range: RangeValue, context: string) {
  assertFiniteNumber(range.low, `${context}.low`);
  assertFiniteNumber(range.base, `${context}.base`);
  assertFiniteNumber(range.high, `${context}.high`);

  if (!(range.low <= range.base && range.base <= range.high)) {
    errors.push(
      `${context} is not ordered: low=${range.low}, base=${range.base}, high=${range.high}`
    );
  }
}

function assertApproxEqual(left: number, right: number, context: string, tolerance = 1e-9) {
  if (Math.abs(left - right) > tolerance) {
    errors.push(`${context} differs: left=${left}, right=${right}`);
  }
}

function makeScenario(
  region: RegionBaseline,
  scenario: Partial<InterventionScenario>
): InterventionScenario {
  return {
    regionSlug: region.slug,
    clinicInstalls: Math.min(3, region.eligiblePrimaryCareSites),
    deviceMode: "fundus_ai",
    staffingModel: "trained_ma_rn",
    referralModel: "regional_hub",
    infrastructurePackage: "connected",
    adoptionLevel: "medium",
    additionalAnnualProgramCost: 20000,
    ...scenario,
  };
}

for (const region of regions) {
  for (const deviceMode of deviceModes) {
    for (const staffingModel of staffingModels) {
      for (const referralModel of referralModels) {
        for (const infrastructurePackage of infrastructurePackages) {
          for (const adoptionLevel of adoptionLevels) {
            for (const clinicInstalls of uniqueInstallCounts(region)) {
              for (const additionalAnnualProgramCost of [0, 20000, 1_000_000]) {
                const result = simulateScenario(
                  region,
                  assumptionSet,
                  makeScenario(region, {
                    clinicInstalls,
                    deviceMode,
                    staffingModel,
                    referralModel,
                    infrastructurePackage,
                    adoptionLevel,
                    additionalAnnualProgramCost,
                  })
                );

                scenarioChecks += 1;

                for (const key of rangeKeys) {
                  assertRange(result[key], `${region.slug}.${key}`);
                }

                assert.strictEqual(
                  Number.isInteger(result.baselineSnapshot.screenedPatients),
                  true
                );
                assert.strictEqual(
                  Number.isInteger(result.interventionSnapshot.screenedPatients),
                  true
                );

                const baselineTotal =
                  result.baselineSnapshot.screenedPatients +
                  result.baselineSnapshot.missedPatients;
                const interventionTotal =
                  result.interventionSnapshot.screenedPatients +
                  result.interventionSnapshot.missedPatients;

                if (Math.abs(baselineTotal - region.estimatedAdultsWithDiabetes) > 1) {
                  errors.push(
                    `${region.slug} baseline snapshot does not reconcile with diabetes population`
                  );
                }

                if (Math.abs(interventionTotal - region.estimatedAdultsWithDiabetes) > 1) {
                  errors.push(
                    `${region.slug} intervention snapshot does not reconcile with diabetes population`
                  );
                }

                const maxCoverageShare = assumptionLookup.max_coverage_share?.base ?? 1;
                const baselineScreened =
                  region.estimatedAdultsWithDiabetes *
                  (region.currentEyeScreeningRatePct / 100);
                const maxReachableScreened = Math.max(
                  baselineScreened,
                  region.estimatedAdultsWithDiabetes * maxCoverageShare
                );

                if (
                  result.interventionSnapshot.screenedPatients >
                  Math.ceil(maxReachableScreened) + 1
                ) {
                  errors.push(
                    `${region.slug} intervention screening volume exceeded the modeled total coverage cap`
                  );
                }

                if (
                  result.interventionSnapshot.screenedPatients <
                  result.baselineSnapshot.screenedPatients
                ) {
                  errors.push(`${region.slug} screened patients fell after intervention`);
                }

                if (
                  result.interventionSnapshot.missedPatients >
                  result.baselineSnapshot.missedPatients
                ) {
                  errors.push(`${region.slug} missed patients rose after intervention`);
                }

                if (
                  result.interventionSnapshot.followUpPatients <
                  result.baselineSnapshot.followUpPatients
                ) {
                  errors.push(`${region.slug} follow-up patients fell after intervention`);
                }

                const screenedDelta =
                  result.interventionSnapshot.screenedPatients -
                  result.baselineSnapshot.screenedPatients;
                const missedDelta =
                  result.baselineSnapshot.missedPatients -
                  result.interventionSnapshot.missedPatients;

                if (Math.abs(screenedDelta - result.additionalScreenings.base) > 1) {
                  errors.push(
                    `${region.slug} additional screenings do not reconcile with screened-patient delta`
                  );
                }

                if (Math.abs(missedDelta - result.additionalScreenings.base) > 1) {
                  errors.push(
                    `${region.slug} additional screenings do not reconcile with missed-patient delta`
                  );
                }

                if (
                  result.severeConsequencesAvoided.base >
                  result.baselineSevereConsequences.base + 1e-9
                ) {
                  errors.push(`${region.slug} severe consequences avoided exceeded baseline harm`);
                }

                if (
                  result.blindnessAvoided.base >
                  result.severeConsequencesAvoided.base + 1e-9
                ) {
                  errors.push(`${region.slug} blindness avoided exceeded severe consequences`);
                }

                const blindnessDelta =
                  result.baselineBlindnessConsequences.base -
                  result.interventionBlindnessConsequences.base;

                if (Math.abs(blindnessDelta - result.blindnessAvoided.base) > 1e-6) {
                  errors.push(
                    `${region.slug} blindness avoided does not reconcile with the blindness-risk delta`
                  );
                }

                if (
                  result.surgeriesAvoided.base >
                  result.severeConsequencesAvoided.base + 1e-9
                ) {
                  errors.push(`${region.slug} surgeries avoided exceeded severe consequences`);
                }

                if (
                  result.predictedDiabetesRateReductionPctPoints.base < 0 ||
                  result.predictedDiabetesRateReductionPctPoints.base > 0.35
                ) {
                  errors.push(`${region.slug} diabetes-rate reduction fell outside bounded range`);
                }
              }
            }
          }
        }
      }
    }
  }
}

for (const region of regions) {
  for (const deviceMode of deviceModes) {
    for (const staffingModel of staffingModels) {
      for (const referralModel of referralModels) {
        for (const infrastructurePackage of infrastructurePackages) {
          for (const adoptionLevel of adoptionLevels) {
            const installs = uniqueInstallCounts(region).sort((left, right) => left - right);
            const results = installs.map((clinicInstalls) =>
              simulateScenario(
                region,
                assumptionSet,
                makeScenario(region, {
                  clinicInstalls,
                  deviceMode,
                  staffingModel,
                  referralModel,
                  infrastructurePackage,
                  adoptionLevel,
                  additionalAnnualProgramCost: 20000,
                })
              )
            );

            for (let index = 1; index < results.length; index += 1) {
              const previous = results[index - 1];
              const current = results[index];
              monotonicChecks += 1;

              if (current.additionalScreenings.base < previous.additionalScreenings.base) {
                errors.push(`${region.slug} additional screenings decreased as installs increased`);
              }

              if (current.earlierInterventions.base < previous.earlierInterventions.base) {
                errors.push(`${region.slug} earlier interventions decreased as installs increased`);
              }

              if (
                current.severeConsequencesAvoided.base <
                previous.severeConsequencesAvoided.base
              ) {
                errors.push(
                  `${region.slug} severe consequences avoided decreased as installs increased`
                );
              }

              if (current.yearOneProgramCost.base < previous.yearOneProgramCost.base) {
                errors.push(`${region.slug} year-one cost decreased as installs increased`);
              }
            }
          }
        }
      }
    }
  }
}

for (const region of regions) {
  for (const deviceMode of deviceModes) {
    const lowCost = simulateScenario(
      region,
      assumptionSet,
      makeScenario(region, {
        deviceMode,
        additionalAnnualProgramCost: 0,
      })
    );
    const highCost = simulateScenario(
      region,
      assumptionSet,
      makeScenario(region, {
        deviceMode,
        additionalAnnualProgramCost: 1_000_000,
      })
    );

    costIsolationChecks += 1;

    for (const key of healthInvariantKeys) {
      assertApproxEqual(
        lowCost[key].low,
        highCost[key].low,
        `${region.slug}.${deviceMode}.${key}.low`
      );
      assertApproxEqual(
        lowCost[key].base,
        highCost[key].base,
        `${region.slug}.${deviceMode}.${key}.base`
      );
      assertApproxEqual(
        lowCost[key].high,
        highCost[key].high,
        `${region.slug}.${deviceMode}.${key}.high`
      );
    }
  }
}

for (const region of regions) {
  const scenarios = buildComparisonScenarios(region);

  if (scenarios.length !== 3) {
    errors.push(`${region.slug} comparison scenarios should produce exactly three presets`);
  }

  for (const scenario of scenarios) {
    comparisonChecks += 1;

    if (scenario.clinicInstalls < 1) {
      errors.push(`${region.slug} comparison scenario generated fewer than one install`);
    }

    if (scenario.clinicInstalls > region.eligiblePrimaryCareSites) {
      errors.push(`${region.slug} comparison scenario exceeded eligible primary care sites`);
    }

    const result = simulateScenario(region, assumptionSet, scenario);
    for (const key of rangeKeys) {
      assertRange(result[key], `${region.slug}.comparison.${key}`);
    }
  }
}

if (errors.length > 0) {
  throw new Error(
    [
      `Simulation validation failed with ${errors.length} issue(s).`,
      ...errors.slice(0, 25),
    ].join("\n")
  );
}

console.log(
  [
    `Validated ${scenarioChecks.toLocaleString()} scenario combinations.`,
    `Checked ${monotonicChecks.toLocaleString()} install monotonicity transitions.`,
    `Checked ${costIsolationChecks.toLocaleString()} cost-isolation comparisons.`,
    `Checked ${comparisonChecks.toLocaleString()} comparison preset outputs.`,
  ].join(" ")
);
