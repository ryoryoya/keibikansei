"use server";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
type TaxType = "INCLUSIVE" | "EXCLUSIVE";

// デモIDはUUIDでないため、DBに存在しない。UUIDでなければ新規作成扱いにする
const isUUID = (id?: string) =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export async function getClients() {
  const session = await requireSession();
  if (session.isDemo) return [];
  // 得意先一覧は ADMIN/MANAGER のみ（GUARD には隠す）
  if (session.role !== "ADMIN" && session.role !== "MANAGER") {
    throw new Error("Forbidden");
  }

  return prisma.client.findMany({
    where:   { orgId: session.orgId },
    orderBy: { name: "asc" },
  });
}

export type ClientInput = {
  id?: string;
  name: string;
  contactPerson?: string;
  tel?: string;
  email?: string;
  address?: string;
  billingCycleDay?: number;
  paymentTermDays?: number;
  taxType?: TaxType;
  notes?: string;
  isActive?: boolean;
};

export async function upsertClient(input: ClientInput) {
  const session = await requireSession();
  if (session.isDemo) return { id: "demo" };
  if (session.role !== "ADMIN" && session.role !== "MANAGER") {
    throw new Error("Forbidden");
  }

  const data = {
    name:           input.name,
    contactPerson:  input.contactPerson,
    tel:            input.tel,
    email:          input.email,
    address:        input.address,
    billingCycleDay: input.billingCycleDay ?? 31,
    paymentTermDays: input.paymentTermDays ?? 30,
    taxType:        input.taxType ?? "EXCLUSIVE",
    notes:          input.notes,
    isActive:       input.isActive ?? true,
  };

  const result = isUUID(input.id)
    ? await prisma.client.update({ where: { id: input.id!, orgId: session.orgId }, data })
    : await prisma.client.create({ data: { ...data, orgId: session.orgId } });

  revalidatePath("/dashboard/clients");
  return result;
}

export async function deleteClient(id: string) {
  const session = await requireSession();
  if (session.isDemo) return;
  if (session.role !== "ADMIN" && session.role !== "MANAGER") {
    throw new Error("Forbidden");
  }

  await prisma.client.update({
    where: { id, orgId: session.orgId },
    data:  { isActive: false },
  });
  revalidatePath("/dashboard/clients");
}
