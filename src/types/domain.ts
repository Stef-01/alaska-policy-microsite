export type EvidenceTier = "source-backed" | "literature-backed" | "synthetic";

export type DeviceMode =
  | "fundus_only"
  | "fundus_ai"
  | "fundus_oct_adjunct"
  | "oct_only_advanced";

export type StaffingModel =
  | "existing_staff"
  | "trained_ma_rn"
  | "dedicated_coordinator";

export type ReferralModel =
  | "local_ophthalmology"
  | "regional_hub"
  | "tele_ophthalmology_network";

export type InfrastructurePackage = "lean" | "connected" | "accelerated";

export type AdoptionLevel = "low" | "medium" | "high";

export interface SourceNote {
  id: string;
  name: string;
  year: string;
  url: string;
  scope: string;
  evidenceTier: EvidenceTier;
  lastRefreshDate: string;
  summary: string;
}

export interface RegionBaseline {
  slug: string;
  name: string;
  population: number;
  adultPopulation: number;
  diabetesPrevalencePct: number;
  estimatedAdultsWithDiabetes: number;
  accessGapPct: number;
  currentEyeScreeningRatePct: number;
  referableDrPrevalencePct: number;
  eligiblePrimaryCareSites: number;
  severityScore: number;
  readinessScore: number;
  recommendedPathway: string;
  providerContext: {
    label: string;
    note: string;
    evidenceTier: EvidenceTier;
  };
  broadbandContext: {
    label: string;
    note: string;
    evidenceTier: EvidenceTier;
  };
  evidenceMap: Record<string, EvidenceTier>;
  sourceNoteIds: string[];
}

export interface AssumptionDefinition {
  id?: string;
  key: string;
  label: string;
  category: string;
  evidenceTier: EvidenceTier;
  unit: string;
  low: number;
  base: number;
  high: number;
  min: number;
  max: number;
  note: string;
  sourceNoteIds: string[];
}

export interface AssumptionSet {
  id: string;
  slug: string;
  name: string;
  version: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  assumptions: AssumptionDefinition[];
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
}

export interface InterventionScenario {
  regionSlug: string;
  clinicInstalls: number;
  deviceMode: DeviceMode;
  staffingModel: StaffingModel;
  referralModel: ReferralModel;
  infrastructurePackage: InfrastructurePackage;
  adoptionLevel: AdoptionLevel;
  additionalAnnualProgramCost: number;
}

export interface RangeValue {
  low: number;
  base: number;
  high: number;
}

export interface ScenarioPopulationSnapshot {
  screenedPatients: number;
  missedPatients: number;
  followUpPatients: number;
  protectedPatients: number;
}

export interface SimulationResult {
  predictedDiabetesRateReductionPctPoints: RangeValue;
  additionalScreenings: RangeValue;
  additionalReferableCases: RangeValue;
  earlierInterventions: RangeValue;
  reengagedPatients: RangeValue;
  baselineSnapshot: ScenarioPopulationSnapshot;
  interventionSnapshot: ScenarioPopulationSnapshot;
  baselineSevereConsequences: RangeValue;
  interventionSevereConsequences: RangeValue;
  baselineBlindnessConsequences: RangeValue;
  interventionBlindnessConsequences: RangeValue;
  severeConsequencesAvoided: RangeValue;
  blindnessAvoided: RangeValue;
  surgeriesAvoided: RangeValue;
  qalyGained: RangeValue;
  dalysAvoided: RangeValue;
  directMedicalSavings: RangeValue;
  productivityProtected: RangeValue;
  screeningValue: RangeValue;
  yearOneProgramCost: RangeValue;
  projectedThreeYearCost: RangeValue;
  projectedThreeYearBenefit: RangeValue;
  projectedThreeYearNetValue: RangeValue;
  costPerNewPatientSeen: RangeValue;
  costPerFollowUpCompleted: RangeValue;
  costPerSevereConsequenceAvoided: RangeValue;
  projectedRoi: RangeValue;
  confidenceLabel: string;
  confidenceScore: number;
  explanation: string[];
  pathway: string[];
}
