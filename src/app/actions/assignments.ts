"use server";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
type AssignmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type AssignmentPageData = {
  projects: {
    id: string; name: string; startTime: string; endTime: string;
    requiredGuards: number; startDate: string; endDate: string | null;
  }[];
  guards: { id: string; name: string }[];
  assignments: {
    id: string; projectId: string; userId: string; workDate: string;
    plannedStart: string; plannedEnd: string; status: string;
    userName: string;
  }[];
  // userId → dateKey → availability
  shiftMap: Record<string, Record<string, string>>;
};

// 配置管理ページ用: 案件・隊員・配置・シフト希望をまとめて取得
export async function getAssignmentPageData(year: number, month: number): Promise<AssignmentPageData> {
  const session = await requireSession();
  if (session.isDemo) return { projects: [], guards: [], assignments: [], shiftMap: {} };

  const from = new Date(year, month - 1, 1);
  const to   = new Date(year, month,     1);

  const [projects, guards, assignments, shifts] = await Promise.all([
    // 当月に稼働中の案件
    prisma.project.findMany({
      where: {
        orgId:  session.orgId,
        status: "ACTIVE",
        startDate: { lte: to },
        OR: [{ endDate: null }, { endDate: { gte: from } }],
      },
      select: { id: true, name: true, startTime: true, endTime: true, requiredGuards: true, startDate: true, endDate: true },
      orderBy: { startTime: "asc" },
    }),
    // 全アクティブ隊員
    prisma.user.findMany({
      where:   { orgId: session.orgId, role: { in: ["GUARD", "MANAGER"] }, isActive: true },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    // 当月の配置
    prisma.assignment.findMany({
      where: { project: { orgId: session.orgId }, workDate: { gte: from, lt: to }, status: { not: "CANCELLED" } },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { workDate: "asc" },
    }),
    // 当月のシフト希望
    prisma.shiftSubmission.findMany({
      where: { user: { orgId: session.orgId }, targetDate: { gte: from, lt: to } },
    }),
  ]);

  // shiftMap 構築
  const shiftMap: Record<string, Record<string, string>> = {};
  for (const s of shifts) {
    const uid  = s.userId;
    const dkey = s.targetDate.toISOString().slice(0, 10);
    if (!shiftMap[uid]) shiftMap[uid] = {};
    shiftMap[uid][dkey] = s.availability;
  }

  return {
    projects: projects.map((p) => ({
      id:             p.id,
      name:           p.name,
      startTime:      p.startTime,
      endTime:        p.endTime,
      requiredGuards: p.requiredGuards,
      startDate:      p.startDate.toISOString().slice(0, 10),
      endDate:        p.endDate?.toISOString().slice(0, 10) ?? null,
    })),
    guards: guards.map((g) => ({ id: g.id, name: g.name })),
    assignments: assignments.map((a) => ({
      id:           a.id,
      projectId:    a.projectId,
      userId:       a.userId,
      workDate:     a.workDate.toISOString().slice(0, 10),
      plannedStart: a.plannedStart,
      plannedEnd:   a.plannedEnd,
      status:       a.status,
      userName:     a.user.name,
    })),
    shiftMap,
  };
}

// 月のカレンダー用: 案件 + 日付範囲の配置一覧
export async function getAssignmentsForMonth(year: number, month: number) {
  const session = await requireSession();
  if (session.isDemo) return [];

  const from = new Date(year, month - 1, 1);
  const to   = new Date(year, month,     1);

  return prisma.assignment.findMany({
    where: {
      project: { orgId: session.orgId },
      workDate: { gte: from, lt: to },
      status:   { not: "CANCELLED" },
    },
    include: {
      user:    { select: { id: true, name: true } },
      project: { select: { id: true, name: true, requiredGuards: true, startTime: true, endTime: true } },
    },
    orderBy: { workDate: "asc" },
  });
}

// 配置の作成・更新
export async function upsertAssignment(input: {
  projectId: string;
  userId: string;
  workDate: string;       // "YYYY-MM-DD"
  plannedStart: string;
  plannedEnd: string;
  status?: AssignmentStatus;
  notes?: string;
}) {
  const session = await requireSession();
  if (session.isDemo) return { id: "demo" };

  const workDate = new Date(input.workDate);

  const result = await prisma.assignment.upsert({
    where:  { projectId_userId_workDate: { projectId: input.projectId, userId: input.userId, workDate } },
    create: {
      projectId:    input.projectId,
      userId:       input.userId,
      workDate,
      plannedStart: input.plannedStart,
      plannedEnd:   input.plannedEnd,
      status:       input.status ?? "PENDING",
      notes:        input.notes,
    },
    update: {
      status: input.status ?? "PENDING",
      notes:  input.notes,
    },
  });

  revalidatePath("/dashboard/calendar");
  return result;
}

// 配置確定（PENDING → CONFIRMED）+ 通知日時記録
export async function confirmAssignments(assignmentIds: string[]) {
  const session = await requireSession();
  if (session.isDemo) return;

  await prisma.assignment.updateMany({
    where: { id: { in: assignmentIds }, project: { orgId: session.orgId } },
    data:  { status: "CONFIRMED", notifiedAt: new Date() },
  });

  revalidatePath("/dashboard/calendar");
}

// 配置キャンセル
export async function cancelAssignment(id: string) {
  const session = await requireSession();
  if (session.isDemo) return;

  await prisma.assignment.update({
    where: { id, project: { orgId: session.orgId } },
    data:  { status: "CANCELLED" },
  });

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/daily");
}
