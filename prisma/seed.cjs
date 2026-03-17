/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { PrismaClient, AssumptionSetStatus } = require("@prisma/client");

const prisma = new PrismaClient();

function readJson(relativePath) {
  const fullPath = path.join(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function toAssumptionRecord(assumption, index, setId) {
  return {
    setId,
    key: assumption.key,
    label: assumption.label,
    category: assumption.category,
    evidenceTier: assumption.evidenceTier,
    unit: assumption.unit,
    low: assumption.low,
    base: assumption.base,
    high: assumption.high,
    min: assumption.min,
    max: assumption.max,
    note: assumption.note,
    sourceNoteIds: assumption.sourceNoteIds.join(","),
    sortOrder: index,
  };
}

async function ensureSet({ slug, name, version, description, status, assumptions }) {
  const publishedAt = status === AssumptionSetStatus.PUBLISHED ? new Date() : null;
  const set = await prisma.assumptionSet.upsert({
    where: { slug },
    update: {
      name,
      version,
      description,
      status,
      publishedAt,
    },
    create: {
      slug,
      name,
      version,
      description,
      status,
      publishedAt,
    },
  });

  await prisma.$transaction(
    assumptions.map((assumption, index) =>
      prisma.assumption.upsert({
        where: {
          setId_key: {
            setId: set.id,
            key: assumption.key,
          },
        },
        update: {
          label: assumption.label,
          category: assumption.category,
          evidenceTier: assumption.evidenceTier,
          unit: assumption.unit,
          min: assumption.min,
          max: assumption.max,
          note: assumption.note,
          sourceNoteIds: assumption.sourceNoteIds.join(","),
          sortOrder: index,
        },
        create: toAssumptionRecord(assumption, index, set.id),
      })
    )
  );

  return set;
}

async function main() {
  const assumptions = readJson("src/data/default-assumptions.json");

  await ensureSet({
    slug: "initial-evidence-pack",
    name: "Initial Evidence Pack",
    version: "v1.0",
    description:
      "Seeded public assumption set balancing source-backed Alaska baselines with literature-backed diabetic eye screening coefficients.",
    status: AssumptionSetStatus.PUBLISHED,
    assumptions,
  });

  await ensureSet({
    slug: "sandbox-copy",
    name: "Sandbox Copy",
    version: "v1.0-draft",
    description:
      "Internal draft copy for tuning the synthetic bridge, screening throughput, and ROI assumptions.",
    status: AssumptionSetStatus.DRAFT,
    assumptions,
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
