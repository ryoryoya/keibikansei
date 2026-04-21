"use server";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
type GuardType = "TYPE_1" | "TYPE_2" | "TYPE_3" | "TYPE_4";

const isUUID = (id?: string) =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export async function getSites(clientId?: string) {
  const session = await requireSession();
  if (session.isDemo) return [];

  return prisma.site.findMany({
    where:   { orgId: session.orgId, ...(clientId ? { clientId } : {}) },
    include: { client: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
}

export type SiteInput = {
  id?: string;
  clientId: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  guardType?: GuardType;
  notes?: string;
  isActive?: boolean;
};

export async function upsertSite(input: SiteInput) {
  const session = await requireSession();
  if (session.isDemo) return { id: "demo" };

  const data = {
    clientId:  input.clientId,
    name:      input.name,
    address:   input.address,
    latitude:  input.latitude,
    longitude: input.longitude,
    guardType: input.guardType ?? "TYPE_2",
    notes:     input.notes,
    isActive:  input.isActive ?? true,
  };

  const result = isUUID(input.id)
    ? await prisma.site.update({ where: { id: input.id!, orgId: session.orgId }, data })
    : await prisma.site.create({ data: { ...data, orgId: session.orgId } });

  revalidatePath("/dashboard/sites");
  return result;
}

export async function deleteSite(id: string) {
  const session = await requireSession();
  if (session.isDemo) return;

  await prisma.site.update({
    where: { id, orgId: session.orgId },
    data:  { isActive: false },
  });
  revalidatePath("/dashboard/sites");
}
