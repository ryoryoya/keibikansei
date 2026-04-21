"use server";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { DailyProject, DailyGuard } from "@/app/dashboard/daily/daily-types";

// DateTime → "HH:mm" 変換
function toHHMM(d: Date | null | undefined): string | null {
  if (!d) return null;
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return `${String(jst.getUTCHours()).padStart(2, "0")}:${String(jst.getUTCMinutes()).padStart(2, "0")}`;
}

// 管制当日管理用: 今日の案件＋配置＋打刻データを取得
export async function getDailyViewData(): Promise<DailyProject[]> {
  const session = await requireSession();
  if (session.isDemo) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const projects = await prisma.project.findMany({
    where: {
      orgId: session.orgId,
      status: "ACTIVE",
      startDate: { lte: tomorrow },
      OR: [{ endDate: null }, { endDate: { gte: today } }],
    },
    include: {
      site: { include: { client: { select: { name: true } } } },
      assignments: {
        where: {
          workDate: { gte: today, lt: tomorrow },
          status: { not: "CANCELLED" },
        },
        include: {
          user:        { select: { id: true, name: true } },
          attendances: { take: 1 },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return projects.map((p): DailyProject => ({
    id:        p.id,
    name:      p.name,
    client:    p.site.client.name,
    startTime: p.startTime,
    endTime:   p.endTime,
    guards: p.assignments.map((a): DailyGuard => {
      const att = a.attendances[0] ?? null;
      return {
        id:           a.user.id,
        assignmentId: a.id,
        name:         a.user.name,
        plannedStart: a.plannedStart,
        plannedEnd:   a.plannedEnd,
        wakeUpAt:    toHHMM(att?.wakeUpAt),
        departureAt: toHHMM(att?.departureAt),
        clockIn:     toHHMM(att?.clockIn),
        clockOut:    toHHMM(att?.clockOut),
      };
    }),
  }));
}

// 隊員アプリ用: 自分の今日の配置を取得
export async function getMyTodayAssignment() {
  const session = await requireSession();
  if (session.isDemo) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const assignment = await prisma.assignment.findFirst({
    where: {
      userId:   session.userId,
      workDate: { gte: today, lt: tomorrow },
      status:   { not: "CANCELLED" },
    },
    include: {
      project: {
        include: { site: { select: { name: true, address: true } } },
      },
      attendances: { take: 1 },
    },
  });

  if (!assignment) return null;

  const att = assignment.attendances[0] ?? null;
  return {
    id:          assignment.id,
    projectName: assignment.project.name,
    siteName:    assignment.project.site.name,
    address:     assignment.project.site.address ?? "",
    startTime:   assignment.plannedStart,
    endTime:     assignment.plannedEnd,
    clockState: {
      wakeUpAt:    toHHMM(att?.wakeUpAt),
      departureAt: toHHMM(att?.departureAt),
      clockIn:     toHHMM(att?.clockIn),
      clockOut:    toHHMM(att?.clockOut),
    },
  };
}

// 当日の勤怠取得（当日管理画面用）
export async function getTodayAttendance() {
  const session = await requireSession();
  if (session.isDemo) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.attendance.findMany({
    where: {
      user: { orgId: session.orgId },
      assignment: { workDate: { gte: today, lt: tomorrow } },
    },
    include: {
      user:       { select: { id: true, name: true } },
      assignment: { include: { project: { select: { id: true, name: true, startTime: true, endTime: true } } } },
    },
  });
}

// 打刻の作成・更新（隊員アプリ・管制両方から呼ばれる）
export async function upsertAttendance(input: {
  assignmentId: string;
  userId: string;
  wakeUpAt?:    string | null;   // ISO文字列
  departureAt?: string | null;
  clockIn?:     string | null;
  clockOut?:    string | null;
  clockInLat?:  number | null;
  clockInLng?:  number | null;
  notes?:       string;
}) {
  const session = await requireSession();
  if (session.isDemo) return { id: "demo" };

  const toDate = (s?: string | null) => (s ? new Date(s) : null);

  const result = await prisma.attendance.upsert({
    where:  { assignmentId: input.assignmentId },
    create: {
      assignmentId: input.assignmentId,
      userId:       input.userId,
      wakeUpAt:     toDate(input.wakeUpAt),
      departureAt:  toDate(input.departureAt),
      clockIn:      toDate(input.clockIn),
      clockOut:     toDate(input.clockOut),
      clockInLat:   input.clockInLat,
      clockInLng:   input.clockInLng,
      notes:        input.notes,
    },
    update: {
      wakeUpAt:    toDate(input.wakeUpAt),
      departureAt: toDate(input.departureAt),
      clockIn:     toDate(input.clockIn),
      clockOut:    toDate(input.clockOut),
      clockInLat:  input.clockInLat,
      clockInLng:  input.clockInLng,
      notes:       input.notes,
    },
  });

  revalidatePath("/dashboard/daily");
  revalidatePath("/guard/clock");
  return result;
}

// 管制からの打刻修正（手動上書き）
export async function manualStamp(input: {
  assignmentId: string;
  wakeUpAt?:    string | null;
  departureAt?: string | null;
  clockIn?:     string | null;
  clockOut?:    string | null;
}) {
  const session = await requireSession();
  if (session.isDemo) return;
  if (session.role !== "MANAGER" && session.role !== "ADMIN") throw new Error("Forbidden");

  const toDate = (s?: string | null) => (s ? new Date(s) : undefined);

  await prisma.attendance.update({
    where: { assignmentId: input.assignmentId },
    data: {
      wakeUpAt:    toDate(input.wakeUpAt),
      departureAt: toDate(input.departureAt),
      clockIn:     toDate(input.clockIn),
      clockOut:    toDate(input.clockOut),
    },
  });

  revalidatePath("/dashboard/daily");
}
