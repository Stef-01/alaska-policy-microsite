import { clamp, formatPercent } from "@/lib/utils";
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
  SimulationResult,
  StaffingModel,
} from "@/types/domain";

const HORIZON_YEARS = 3;

const adoptionMultipliers: Record<AdoptionLevel, number> = {
  low: 0.78,
  medium: 1,
  high: 1.14,
};

const infrastructureMultipliers: Record<
  InfrastructurePackage,
  { throughput: number; cost: number; reengagement: number }
> = {
  lean: { throughput: 0.84, cost: 0.92, reengagement: 0.92 },
  connected: { throughput: 1, cost: 1, reengagement: 1 },
  accelerated: { throughput: 1.12, cost: 1.18, reengagement: 1.08 },
};

const staffingKeys: Record<StaffingModel, string> = {
  existing_staff: "staff_existing_modifier",
  trained_ma_rn: "staff_trained_modifier",
  dedicated_coordinator: "staff_coordinator_modifier",
};

const referralKeys: Record<ReferralModel, string> = {
  local_ophthalmology: "referral_local_followup_rate",
  regional_hub: "referral_hub_followup_rate",
  tele_ophthalmology_network: "referral_tele_followup_rate",
};

function toLookup(set: AssumptionSet) {
  return Object.fromEntries(set.assumptions.map((assumption) => [assumption.key, assumption]));
}

function getValue(
  lookup: Record<string, AssumptionDefinition>,
  key: string,
  band: keyof RangeValue
) {
  return lookup[key]?.[band] ?? 0;
}

function safeDivide(value: number, by: number) {
  if (by <= 0) {
    return 0;
  }

  return value / by;
}

function getDeviceProfile(
  lookup: Record<string, AssumptionDefinition>,
  deviceMode: DeviceMode,
  band: keyof RangeValue
) {
  const fundusCapex = getValue(lookup, "fundus_capex_per_site", band);
  const aiCost = getValue(lookup, "ai_license_per_site", band);
  const octCost = getValue(lookup, "oct_adjunct_capex_per_site", band);

  switch (deviceMode) {
    case "fundus_ai":
      return {
        capex: fundusCapex,
        recurringCost: aiCost,
        throughput: getValue(lookup, "fundus_ai_throughput_multiplier", band),
        detectionMultiplier: 1.08,
        confidencePenalty: 0,
      };
    case "fundus_oct_adjunct":
      return {
        capex: fundusCapex + octCost,
        recurringCost: 0,
        throughput: getValue(
          lookup,
          "fundus_oct_adjunct_throughput_multiplier",
          band
        ),
        detectionMultiplier: 1.14,
        confidencePenalty: 8,
      };
    case "oct_only_advanced":
      return {
        capex: octCost,
        recurringCost: 0,
        throughput: getValue(lookup, "oct_only_throughput_multiplier", band),
        detectionMultiplier: 0.94,
        confidencePenalty: 18,
      };
    default:
      return {
        capex: fundusCapex,
        recurringCost: 0,
        throughput: 1,
        detectionMultiplier: 1,
        confidencePenalty: 0,
      };
  }
}

function bandMath(
  region: RegionBaseline,
  scenario: InterventionScenario,
  lookup: Record<string, AssumptionDefinition>,
  band: keyof RangeValue
) {
  const diabeticAdults = region.estimatedAdultsWithDiabetes;
  const baselineScreened =
    diabeticAdults * (region.currentEyeScreeningRatePct / 100);
  const baselineMissed = Math.max(diabeticAdults - baselineScreened, 0);

  const device = getDeviceProfile(lookup, scenario.deviceMode, band);
  const infrastructure = infrastructureMultipliers[scenario.infrastructurePackage];
  const adoption = adoptionMultipliers[scenario.adoptionLevel];
  const staffModifier = getValue(lookup, staffingKeys[scenario.staffingModel], band);
  const coverageCap = diabeticAdults * getValue(lookup, "max_coverage_share", band);
  const reachableHeadroom = Math.max(coverageCap - baselineScreened, 0);
  const annualCapacity =
    scenario.clinicInstalls *
    getValue(lookup, "annual_screening_capacity_per_site", band) *
    infrastructure.throughput *
    device.throughput *
    staffModifier *
    adoption;

  const additionalScreenings = clamp(
    Math.min(baselineMissed, annualCapacity, reachableHeadroom),
    0,
    diabeticAdults
  );

  const totalScreened = clamp(
    baselineScreened + additionalScreenings,
    0,
    diabeticAdults
  );
  const totalMissed = clamp(diabeticAdults - totalScreened, 0, diabeticAdults);

  const regionReferableShare = clamp(
    (region.referableDrPrevalencePct / 100 +
      getValue(lookup, "referable_dr_prevalence_share", band)) /
      2,
    0.08,
    0.35
  );

  const additionalReferableCases =
    additionalScreenings * regionReferableShare * device.detectionMultiplier;
  const earlierInterventions =
    additionalReferableCases *
    getValue(lookup, referralKeys[scenario.referralModel], band);

  const baselineFollowUps = clamp(
    baselineScreened *
      regionReferableShare *
      getValue(lookup, "baseline_followup_completion_share", band),
    0,
    diabeticAdults
  );
  const totalFollowUps = clamp(
    baselineFollowUps + earlierInterventions,
    0,
    diabeticAdults * regionReferableShare
  );

  const reengagedPatients =
    additionalScreenings *
    getValue(lookup, "reengagement_rate_from_screening", band) *
    infrastructure.reengagement;
  const improvedControlPatients =
    reengagedPatients *
    getValue(lookup, "glycemic_improvement_conversion", band);
  const modeledCasesReduced =
    improvedControlPatients *
    getValue(lookup, "prevalence_bridge_annual_share", band) *
    HORIZON_YEARS;
  const predictedDiabetesRateReductionPctPoints = clamp(
    (modeledCasesReduced / region.adultPopulation) * 100,
    0,
    0.35
  );

  const baselineSevereConsequences =
    baselineMissed *
    regionReferableShare *
    getValue(lookup, "vision_threatening_progression_share_3y", band);
  const severeConsequencesAvoided = clamp(
    earlierInterventions *
      getValue(lookup, "vision_threatening_progression_share_3y", band) *
      getValue(lookup, "severe_consequence_avoidance_share", band),
    0,
    baselineSevereConsequences
  );
  const interventionSevereConsequences = clamp(
    baselineSevereConsequences - severeConsequencesAvoided,
    0,
    baselineSevereConsequences
  );

  const blindnessAvoided =
    severeConsequencesAvoided *
    getValue(lookup, "blindness_share_of_severe_consequences", band);
  const baselineBlindnessConsequences =
    baselineSevereConsequences *
    getValue(lookup, "blindness_share_of_severe_consequences", band);
  const interventionBlindnessConsequences =
    interventionSevereConsequences *
    getValue(lookup, "blindness_share_of_severe_consequences", band);
  const surgeriesAvoided =
    severeConsequencesAvoided *
    getValue(lookup, "surgery_share_of_severe_consequences", band);

  const nonBlindSevereCases = Math.max(
    severeConsequencesAvoided - blindnessAvoided,
    0
  );
  const qalyGained =
    nonBlindSevereCases *
      getValue(lookup, "qaly_gain_per_severe_case_avoided_3y", band) +
    blindnessAvoided *
      getValue(lookup, "qaly_gain_per_blindness_case_avoided_3y", band);
  const dalysAvoided =
    nonBlindSevereCases *
      getValue(lookup, "daly_burden_per_severe_case_avoided_3y", band) +
    blindnessAvoided *
      getValue(lookup, "daly_burden_per_blindness_case_avoided_3y", band);

  const productivityProtected =
    severeConsequencesAvoided *
    getValue(lookup, "working_age_share_for_productivity_value", band) *
    getValue(lookup, "annual_productivity_value_per_major_case", band) *
    HORIZON_YEARS;

  const trainingCost =
    scenario.clinicInstalls * getValue(lookup, "training_cost_per_site", band);
  const connectivityCost =
    scenario.clinicInstalls *
    getValue(lookup, "connectivity_cost_per_site", band) *
    infrastructure.cost;
  const yearOneProgramCost =
    scenario.clinicInstalls * device.capex * infrastructure.cost +
    trainingCost +
    connectivityCost +
    scenario.additionalAnnualProgramCost;
  const annualOpsCost =
    scenario.clinicInstalls *
      (device.capex * getValue(lookup, "maintenance_rate", band) +
        device.recurringCost +
        getValue(lookup, "connectivity_cost_per_site", band) * 0.65) +
    scenario.additionalAnnualProgramCost;
  const projectedThreeYearCost = yearOneProgramCost + annualOpsCost * 2;

  const screeningValue =
    additionalScreenings *
    getValue(lookup, "reimbursement_per_screen", band) *
    HORIZON_YEARS;
  const directMedicalSavings =
    earlierInterventions *
      getValue(lookup, "avoided_cost_per_early_case", band) +
    improvedControlPatients *
      getValue(lookup, "reengaged_patient_savings_annual", band) *
      HORIZON_YEARS;
  const projectedThreeYearBenefit =
    screeningValue + directMedicalSavings + productivityProtected;
  const projectedThreeYearNetValue =
    projectedThreeYearBenefit - projectedThreeYearCost;
  const projectedRoi =
    projectedThreeYearCost === 0
      ? 0
      : projectedThreeYearNetValue / projectedThreeYearCost;

  const costPerNewPatientSeen = safeDivide(yearOneProgramCost, additionalScreenings);
  const costPerFollowUpCompleted = safeDivide(
    projectedThreeYearCost,
    earlierInterventions
  );
  const costPerSevereConsequenceAvoided = safeDivide(
    projectedThreeYearCost,
    severeConsequencesAvoided
  );

  return {
    predictedDiabetesRateReductionPctPoints,
    baselineScreened,
    baselineMissed,
    totalScreened,
    totalMissed,
    baselineFollowUps,
    totalFollowUps,
    additionalScreenings,
    additionalReferableCases,
    earlierInterventions,
    reengagedPatients,
    baselineSevereConsequences,
    interventionSevereConsequences,
    baselineBlindnessConsequences,
    interventionBlindnessConsequences,
    severeConsequencesAvoided,
    blindnessAvoided,
    surgeriesAvoided,
    qalyGained,
    dalysAvoided,
    directMedicalSavings,
    productivityProtected,
    screeningValue,
    yearOneProgramCost,
    projectedThreeYearCost,
    projectedThreeYearBenefit,
    projectedThreeYearNetValue,
    costPerNewPatientSeen,
    costPerFollowUpCompleted,
    costPerSevereConsequenceAvoided,
    projectedRoi,
    deviceConfidencePenalty: device.confidencePenalty,
  };
}

function buildRange<T extends keyof ReturnType<typeof bandMath>>(
  low: ReturnType<typeof bandMath>,
  base: ReturnType<typeof bandMath>,
  high: ReturnType<typeof bandMath>,
  key: T
): RangeValue {
  const lowValue = low[key] as number;
  const baseValue = base[key] as number;
  const highValue = high[key] as number;

  return {
    low: Math.min(lowValue, baseValue, highValue),
    base: baseValue,
    high: Math.max(lowValue, baseValue, highValue),
  };
}

export function simulateScenario(
  region: RegionBaseline,
  assumptionSet: AssumptionSet,
  scenario: InterventionScenario
): SimulationResult {
  const lookup = toLookup(assumptionSet);
  const low = bandMath(region, scenario, lookup, "low");
  const base = bandMath(region, scenario, lookup, "base");
  const high = bandMath(region, scenario, lookup, "high");

  const confidenceScore = clamp(
    72 -
      base.deviceConfidencePenalty -
      (scenario.infrastructurePackage === "lean" ? 4 : 0) +
      (scenario.referralModel === "tele_ophthalmology_network" ? 3 : 0),
    40,
    84
  );

  const confidenceLabel =
    confidenceScore >= 74
      ? "Moderate-high"
      : confidenceScore >= 64
        ? "Moderate"
        : confidenceScore >= 52
          ? "Caution"
          : "Experimental";

  return {
    predictedDiabetesRateReductionPctPoints: buildRange(
      low,
      base,
      high,
      "predictedDiabetesRateReductionPctPoints"
    ),
    additionalScreenings: buildRange(low, base, high, "additionalScreenings"),
    additionalReferableCases: buildRange(
      low,
      base,
      high,
      "additionalReferableCases"
    ),
    earlierInterventions: buildRange(low, base, high, "earlierInterventions"),
    reengagedPatients: buildRange(low, base, high, "reengagedPatients"),
    baselineSnapshot: {
      screenedPatients: Math.round(base.baselineScreened),
      missedPatients: Math.round(base.baselineMissed),
      followUpPatients: Math.round(base.baselineFollowUps),
      protectedPatients: 0,
    },
    interventionSnapshot: {
      screenedPatients: Math.round(base.totalScreened),
      missedPatients: Math.round(base.totalMissed),
      followUpPatients: Math.round(base.totalFollowUps),
      protectedPatients: Math.round(base.severeConsequencesAvoided),
    },
    baselineSevereConsequences: buildRange(
      low,
      base,
      high,
      "baselineSevereConsequences"
    ),
    interventionSevereConsequences: buildRange(
      low,
      base,
      high,
      "interventionSevereConsequences"
    ),
    baselineBlindnessConsequences: buildRange(
      low,
      base,
      high,
      "baselineBlindnessConsequences"
    ),
    interventionBlindnessConsequences: buildRange(
      low,
      base,
      high,
      "interventionBlindnessConsequences"
    ),
    severeConsequencesAvoided: buildRange(
      low,
      base,
      high,
      "severeConsequencesAvoided"
    ),
    blindnessAvoided: buildRange(low, base, high, "blindnessAvoided"),
    surgeriesAvoided: buildRange(low, base, high, "surgeriesAvoided"),
    qalyGained: buildRange(low, base, high, "qalyGained"),
    dalysAvoided: buildRange(low, base, high, "dalysAvoided"),
    directMedicalSavings: buildRange(low, base, high, "directMedicalSavings"),
    productivityProtected: buildRange(
      low,
      base,
      high,
      "productivityProtected"
    ),
    screeningValue: buildRange(low, base, high, "screeningValue"),
    yearOneProgramCost: buildRange(low, base, high, "yearOneProgramCost"),
    projectedThreeYearCost: buildRange(
      low,
      base,
      high,
      "projectedThreeYearCost"
    ),
    projectedThreeYearBenefit: buildRange(
      low,
      base,
      high,
      "projectedThreeYearBenefit"
    ),
    projectedThreeYearNetValue: buildRange(
      low,
      base,
      high,
      "projectedThreeYearNetValue"
    ),
    costPerNewPatientSeen: buildRange(low, base, high, "costPerNewPatientSeen"),
    costPerFollowUpCompleted: buildRange(
      low,
      base,
      high,
      "costPerFollowUpCompleted"
    ),
    costPerSevereConsequenceAvoided: buildRange(
      low,
      base,
      high,
      "costPerSevereConsequenceAvoided"
    ),
    projectedRoi: buildRange(low, base, high, "projectedRoi"),
    confidenceLabel,
    confidenceScore,
    explanation: [
      `The lead output remains a modeled ${formatPercent(
        base.predictedDiabetesRateReductionPctPoints,
        2
      )} reduction in adult diabetes rate over ${HORIZON_YEARS} years versus the baseline trajectory, not a directly observed prevalence change.`,
      "The calculator exposes the intermediate public-health story directly: who is still missed, who is newly seen, who completes follow-up, and how much preventable severe retinal harm is plausibly avoided.",
      "QALYs, DALYs, surgeries, and productivity are explicitly assumption-driven planning outputs. They are useful for comparing packages, but they should not be interpreted as precise forecasts.",
    ],
    pathway: [
      `${Math.round(base.baselineMissed)} adults with diabetes are currently missed each year in the baseline picture.`,
      `${Math.round(base.additionalScreenings)} additional screenings bring more people into the pathway.`,
      `${Math.round(base.earlierInterventions)} more patients complete retinal follow-up, producing an estimated ${Math.round(base.severeConsequencesAvoided)} major preventable vision consequences avoided over ${HORIZON_YEARS} years.`,
      `${base.predictedDiabetesRateReductionPctPoints.toFixed(
        2
      )} percentage-point diabetes-rate reduction is then estimated through the broader re-engagement bridge.`,
    ],
  };
}

export function buildComparisonScenarios(region: RegionBaseline): InterventionScenario[] {
  const balancedInstalls = clamp(
    Math.round(region.eligiblePrimaryCareSites * 0.25),
    2,
    8
  );
  const acceleratedInstalls = clamp(
    Math.round(region.eligiblePrimaryCareSites * 0.4),
    3,
    12
  );

  return [
    {
      regionSlug: region.slug,
      clinicInstalls: clamp(Math.round(region.eligiblePrimaryCareSites * 0.15), 1, 6),
      deviceMode: "fundus_only",
      staffingModel: "existing_staff",
      referralModel: "local_ophthalmology",
      infrastructurePackage: "lean",
      adoptionLevel: "medium",
      additionalAnnualProgramCost: 0,
    },
    {
      regionSlug: region.slug,
      clinicInstalls: balancedInstalls,
      deviceMode: "fundus_ai",
      staffingModel: "trained_ma_rn",
      referralModel: "regional_hub",
      infrastructurePackage: "connected",
      adoptionLevel: "medium",
      additionalAnnualProgramCost: 20000,
    },
    {
      regionSlug: region.slug,
      clinicInstalls: acceleratedInstalls,
      deviceMode: "fundus_oct_adjunct",
      staffingModel: "dedicated_coordinator",
      referralModel: "tele_ophthalmology_network",
      infrastructurePackage: "accelerated",
      adoptionLevel: "high",
      additionalAnnualProgramCost: 40000,
    },
  ];
}
