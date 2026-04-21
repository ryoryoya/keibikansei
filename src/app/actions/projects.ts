"use server";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
type WorkStyle     = "DAY_SHIFT" | "NIGHT_SHIFT" | "RESIDENT" | "DAY_NIGHT" | "EVENT" | "OTHER";
type ProjectStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export async function getProjects(status?: ProjectStatus) {
  const session = await requireSession();
  if (session.isDemo) return [];

  return prisma.project.findMany({
    where:   { orgId: session.orgId, ...(status ? { status } : {}) },
    include: { site: { include: { client: { select: { name: true } } } } },
    orderBy: { startDate: "desc" },
  });
}

// 当日稼働中の案件を取得（当日管理画面用）
export async function getTodayProjects() {
  const session = await requireSession();
  if (session.isDemo) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.project.findMany({
    where: {
      orgId:  session.orgId,
      status: "ACTIVE",
      startDate: { lte: tomorrow },
      OR: [{ endDate: null }, { endDate: { gte: today } }],
    },
    include: {
      site:   { include: { client: { select: { name: true } } } },
      assignments: {
        where: {
          workDate: { gte: today, lt: tomorrow },
          status: { not: "CANCELLED" },
        },
        include: {
          user:       { select: { id: true, name: true } },
          attendances: { take: 1 },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

export type ProjectInput = {
  id?: string;
  siteId: string;
  name: string;
  workStyle?: WorkStyle;
  startDate: string;
  endDate?: string;
  requiredGuards?: number;
  startTime: string;
  endTime: string;
  unitPrice?: number;
  guardPay?: number;
  overtimeRate?: number;
  nightRate?: number;
  holidayRate?: number;
  status?: ProjectStatus;
  notes?: string;
};

const isUUID = (id?: string) =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export async function upsertProject(input: ProjectInput) {
  const session = await requireSession();
  if (session.isDemo) return { id: "demo" };

  const data = {
    siteId:        input.siteId,
    name:          input.name,
    workStyle:     input.workStyle ?? "DAY_SHIFT",
    startDate:     new Date(input.startDate),
    endDate:       input.endDate ? new Date(input.endDate) : null,
    requiredGuards: input.requiredGuards ?? 1,
    startTime:     input.startTime,
    endTime:       input.endTime,
    unitPrice:     input.unitPrice ?? 0,
    guardPay:      input.guardPay  ?? 0,
    overtimeRate:  input.overtimeRate ?? 1.25,
    nightRate:     input.nightRate    ?? 1.25,
    holidayRate:   input.holidayRate  ?? 1.35,
    status:        input.status ?? "DRAFT",
    notes:         input.notes,
  };

  const result = isUUID(input.id)
    ? await prisma.project.update({ where: { id: input.id!, orgId: session.orgId }, data })
    : await prisma.project.create({ data: { ...data, orgId: session.orgId } });

  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/calendar");
  return result;
}
