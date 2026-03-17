"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import defaultAssumptions from "@/data/default-assumptions.json";
import { prisma } from "@/lib/prisma";

const updateSchema = z
  .object({
    assumptionId: z.string().min(1),
    setId: z.string().min(1),
    low: z.coerce.number(),
    base: z.coerce.number(),
    high: z.coerce.number(),
  })
  .refine((value) => value.low <= value.base && value.base <= value.high, {
    message: "Low, base, and high must remain ordered.",
  });

export async function updateAssumptionAction(formData: FormData) {
  const parsed = updateSchema.parse({
    assumptionId: formData.get("assumptionId"),
    setId: formData.get("setId"),
    low: formData.get("low"),
    base: formData.get("base"),
    high: formData.get("high"),
  });

  const assumption = await prisma.assumption.findUnique({
    where: { id: parsed.assumptionId },
  });

  if (!assumption) {
    throw new Error("Assumption not found.");
  }

  const low = Math.max(parsed.low, assumption.min);
  const base = Math.min(Math.max(parsed.base, low), assumption.max);
  const high = Math.min(Math.max(parsed.high, base), assumption.max);

  await prisma.assumption.update({
    where: { id: parsed.assumptionId },
    data: { low, base, high },
  });

  revalidatePath("/admin");
  revalidatePath("/assumptions");
  revalidatePath("/calculator");
  revalidatePath("/simulator");
  redirect(`/assumptions?set=${parsed.setId}`);
}

export async function publishAssumptionSetAction(formData: FormData) {
  const setId = String(formData.get("setId") ?? "");

  await prisma.$transaction([
    prisma.assumptionSet.updateMany({
      where: {
        status: "PUBLISHED",
        id: { not: setId },
      },
      data: { status: "ARCHIVED" },
    }),
    prisma.assumptionSet.update({
      where: { id: setId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/assumptions");
  revalidatePath("/calculator");
  revalidatePath("/simulator");
  redirect(`/assumptions?set=${setId}`);
}

export async function createDraftCloneAction(formData: FormData) {
  const sourceId = String(formData.get("sourceId") ?? "");

  const source = await prisma.assumptionSet.findUnique({
    where: { id: sourceId },
    include: {
      assumptions: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!source) {
    throw new Error("Source assumption set not found.");
  }

  const timestamp = Date.now().toString().slice(-6);
  const clone = await prisma.assumptionSet.create({
    data: {
      slug: `${source.slug}-draft-${timestamp}`,
      name: `${source.name} Draft`,
      version: `${source.version}-draft-${timestamp}`,
      description: `Draft clone created from ${source.name}.`,
      status: "DRAFT",
      assumptions: {
        create: source.assumptions.map((assumption) => ({
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
          sourceNoteIds: assumption.sourceNoteIds,
          sortOrder: assumption.sortOrder,
        })),
      },
    },
  });

  revalidatePath("/admin");
  revalidatePath("/assumptions");
  redirect(`/assumptions?set=${clone.id}`);
}

export async function resetAssumptionSetAction(formData: FormData) {
  const setId = String(formData.get("setId") ?? "");

  const defaultLookup = new Map(
    (defaultAssumptions as Array<{
      key: string;
      low: number;
      base: number;
      high: number;
    }>).map((assumption) => [assumption.key, assumption])
  );

  const set = await prisma.assumptionSet.findUnique({
    where: { id: setId },
    include: {
      assumptions: true,
    },
  });

  if (!set) {
    throw new Error("Assumption set not found.");
  }

  await prisma.$transaction(
    set.assumptions.map((assumption) => {
      const defaults = defaultLookup.get(assumption.key);
      if (!defaults) {
        return prisma.assumption.update({
          where: { id: assumption.id },
          data: {
            low: assumption.low,
            base: assumption.base,
            high: assumption.high,
          },
        });
      }

      return prisma.assumption.update({
        where: { id: assumption.id },
        data: {
          low: defaults.low,
          base: defaults.base,
          high: defaults.high,
        },
      });
    })
  );

  revalidatePath("/admin");
  revalidatePath("/assumptions");
  revalidatePath("/calculator");
  revalidatePath("/simulator");
  redirect(`/assumptions?set=${setId}`);
}
