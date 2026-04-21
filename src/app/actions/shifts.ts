"use server";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { GuardShift, ShiftVal } from "@/app/dashboard/shifts/shifts-types";

type Availability = "DAY_OK" | "NIGHT_OK" | "BOTH_OK" | "NG" | "UNDECIDED";

// 管制側: 指定月のシフト希望一覧を GuardShift[] 形式で返す
export async function getShiftsForMonth(year: number, month: number): Promise<GuardShift[]> {
  const session = await requireSession();
  if (session.isDemo) return [];

  const from = new Date(year, month - 1, 1);
  const to   = new Date(year, month,     1);

  // 全アクティブ隊員を取得
  const guards = await prisma.user.findMany({
    where:   { orgId: session.orgId, role: { in: ["GUARD", "MANAGER"] }, isActive: true },
    select:  { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // 当月のシフト提出一覧を取得
  const submissions = await prisma.shiftSubmission.findMany({
    where: {
      user:       { orgId: session.orgId },
      targetDate: { gte: from, lt: to },
    },
    orderBy: { targetDate: "asc" },
  });

  // 隊員ごとにシフトデータをマージ
  const daysInMonth = new Date(year, month, 0).getDate();

  return guards.map((g): GuardShift => {
    const mySubs = submissions.filter((s) => s.userId === g.id);
    const shifts: Record<string, ShiftVal | null> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const sub = mySubs.find((s) => s.targetDate.toISOString().slice(0, 10) === key);
      shifts[key] = (sub?.availability as ShiftVal | undefined) ?? null;
    }
    // 1件でも提出があれば「提出済み」
    const latestSub = mySubs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
    return {
      id:          g.id,
      name:        g.name,
      submitted:   mySubs.length > 0,
      submittedAt: latestSub ? latestSub.updatedAt.toLocaleString("ja-JP") : null,
      shifts,
    };
  });
}

// 管制側: 特定隊員のシフトを1日分上書き
export async function managerSetShift(input: {
  guardId:     string;
  targetDate:  string;
  availability: Availability | null;
}) {
  const session = await requireSession();
  if (session.isDemo) return;
  if (session.role !== "MANAGER" && session.role !== "ADMIN") throw new Error("Forbidden");

  if (input.availability === null) {
    // null の場合はレコードを削除
    await prisma.shiftSubmission.deleteMany({
      where: { userId: input.guardId, targetDate: new Date(input.targetDate) },
    });
  } else {
    await prisma.shiftSubmission.upsert({
      where:  { userId_targetDate: { userId: input.guardId, targetDate: new Date(input.targetDate) } },
      create: { userId: input.guardId, targetDate: new Date(input.targetDate), availability: input.availability },
      update: { availability: input.availability },
    });
  }

  revalidatePath("/dashboard/shifts");
}

// 隊員: 自分の指定月のシフト希望を取得
export async function getMyShiftsForMonth(year: number, month: number): Promise<Record<string, ShiftVal | null>> {
  const session = await requireSession();
  if (session.isDemo) return {};

  const from = new Date(year, month - 1, 1);
  const to   = new Date(year, month,     1);

  const subs = await prisma.shiftSubmission.findMany({
    where: { userId: session.userId, targetDate: { gte: from, lt: to } },
    orderBy: { targetDate: "asc" },
  });

  const result: Record<string, ShiftVal | null> = {};
  for (const s of subs) {
    const key = s.targetDate.toISOString().slice(0, 10);
    result[key] = s.availability as ShiftVal;
  }
  return result;
}

// 隊員: シフト希望を1日分入力・更新
export async function upsertShiftSubmission(input: {
  targetDate:   string;
  availability: Availability;
  memo?:        string;
}) {
  const session = await requireSession();
  if (session.isDemo) return { id: "demo" };

  const targetDate = new Date(input.targetDate);
  const result = await prisma.shiftSubmission.upsert({
    where:  { userId_targetDate: { userId: session.userId, targetDate } },
    create: { userId: session.userId, targetDate, availability: input.availability, memo: input.memo },
    update: { availability: input.availability, memo: input.memo },
  });

  revalidatePath("/dashboard/shifts");
  revalidatePath("/guard/schedule");
  return result;
}

// 隊員: 月一括でシフト希望を登録（提出ボタン）
export async function bulkUpsertShifts(entries: { targetDate: string; availability: Availability }[]) {
  const session = await requireSession();
  if (session.isDemo) return;

  // まず当月のデータを全削除してから一括挿入（null = 未入力を反映するため）
  if (entries.length === 0) return;
  const dates = entries.map((e) => new Date(e.targetDate));
  const minDate = dates.reduce((a, b) => (a < b ? a : b));
  const maxDate = dates.reduce((a, b) => (a > b ? a : b));

  await prisma.$transaction(async (tx) => {
    await tx.shiftSubmission.deleteMany({
      where: {
        userId:     session.userId,
        targetDate: { gte: minDate, lte: maxDate },
      },
    });
    await tx.shiftSubmission.createMany({
      data: entries.map((e) => ({
        userId:       session.userId,
        targetDate:   new Date(e.targetDate),
        availability: e.availability,
      })),
    });
  });

  revalidatePath("/dashboard/shifts");
  revalidatePath("/guard/schedule");
}
