import defaultAssumptionsJson from "@/data/default-assumptions.json";
import dataPack from "@/data/generated/alaska-data-pack.json";
import { prisma } from "@/lib/prisma";
import type {
  AssumptionDefinition,
  AssumptionSet,
  RegionBaseline,
  SourceNote,
} from "@/types/domain";

const typedDataPack = dataPack as {
  generatedAt: string;
  regions: RegionBaseline[];
  sourceNotes: SourceNote[];
};

export const regionBaselines = typedDataPack.regions;
export const sourceNotes = typedDataPack.sourceNotes;
export const dataGeneratedAt = typedDataPack.generatedAt;

function mapSourceIds(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function mapAssumptionSet(record: {
  id: string;
  slug: string;
  name: string;
  version: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  assumptions: Array<{
    id: string;
    key: string;
    label: string;
    category: string;
    evidenceTier: string;
    unit: string;
    low: number;
    base: number;
    high: number;
    min: number;
    max: number;
    note: string;
    sourceNoteIds: string;
  }>;
}): AssumptionSet {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    version: record.version,
    description: record.description,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    publishedAt: record.publishedAt?.toISOString() ?? null,
    assumptions: record.assumptions.map((assumption) => ({
      ...assumption,
      evidenceTier: assumption.evidenceTier as AssumptionDefinition["evidenceTier"],
      sourceNoteIds: mapSourceIds(assumption.sourceNoteIds),
    })),
  };
}

export function getDefaultAssumptionSet(): AssumptionSet {
  const assumptions = defaultAssumptionsJson as AssumptionDefinition[];
  return {
    id: "fallback-default",
    slug: "fallback-default",
    name: "Fallback Default",
    version: "v1.0",
    description:
      "Bundled fallback assumption pack used when the local SQLite database has not been initialized.",
    status: "PUBLISHED",
    assumptions,
  };
}

export async function getPublishedAssumptionSet() {
  try {
    const assumptionSet = await prisma.assumptionSet.findFirst({
      where: { status: "PUBLISHED" },
      include: {
        assumptions: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { publishedAt: "desc" },
    });

    if (assumptionSet) {
      return mapAssumptionSet(assumptionSet);
    }
  } catch {
    return getDefaultAssumptionSet();
  }

  return getDefaultAssumptionSet();
}

export async function getAllAssumptionSets() {
  try {
    const sets = await prisma.assumptionSet.findMany({
      include: {
        assumptions: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });

    if (sets.length > 0) {
      return sets.map(mapAssumptionSet);
    }
  } catch {
    return [getDefaultAssumptionSet()];
  }

  return [getDefaultAssumptionSet()];
}

export async function getAssumptionSetById(id: string) {
  try {
    const set = await prisma.assumptionSet.findUnique({
      where: { id },
      include: {
        assumptions: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return set ? mapAssumptionSet(set) : null;
  } catch {
    return null;
  }
}

export function getSourceNotesByIds(ids: string[]) {
  return sourceNotes.filter((note) => ids.includes(note.id));
}

export function getRegionBySlug(slug: string) {
  return regionBaselines.find((region) => region.slug === slug);
}

export function getRegionPlaybooks() {
  return regionBaselines.map((region) => {
    const interventions =
      region.recommendedPathway === "Fast-start"
        ? [
            "Install fundus screening in high-volume primary care sites first.",
            "Route positive screens through a regional hub or tele-ophthalmology network.",
            "Pair screening with diabetes outreach to convert the encounter into re-engagement.",
          ]
        : region.recommendedPathway === "Build-first"
          ? [
              "Start with fewer connected sites and protected staffing rather than a thin statewide rollout.",
              "Sequence broadband, cybersecurity, and image transfer support before adding advanced equipment.",
              "Use the first year to demonstrate screening activation and referral reliability.",
            ]
          : [
              "Anchor statewide reading, scheduling, and performance reporting in this region.",
              "Prioritize referral management and specialist access rather than raw device count.",
              "Use hub capacity to support rural sites that need faster interpretation turnaround.",
            ];

    return {
      ...region,
      headline:
        region.recommendedPathway === "Fast-start"
          ? "Ready to move now with a fundus-first deployment."
          : region.recommendedPathway === "Build-first"
            ? "Needs infrastructure-first sequencing before scale."
            : "Best used as the statewide coordination and referral hub.",
      interventions,
    };
  });
}
