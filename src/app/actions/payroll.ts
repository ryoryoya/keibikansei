"use server";

import prisma from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { calculatePayForAttendance, calculateWithholdingTax } from "@/lib/calculations";
import type { PayrollRun, PayrollItem, PayrollRecord } from "@/app/dashboard/payroll/payroll-types";

type PayrollStatus = "DRAFT" | "CONFIRMED" | "PAID";

// 社会保険料率（2024年度 概算 / 労働者負担分）
const HEALTH_RATE   = 0.0515;
const PENSION_RATE  = 0.0915;
const EMPLOY_RATE   = 0.006;

function calcDeductions(gross: number) {
  const health     = Math.round(gross * HEALTH_RATE);
  const pension    = Math.round(gross * PENSION_RATE);
  const employment = Math.round(gross * EMPLOY_RATE);
  const tax        = calculateWithholdingTax(gross, 0);
  return { health, pension, employment, tax, total: health + pension + employment + tax };
}

const WEEK = ["日","月","火","水","木","金","土"];

function dateLabel(d: Date): string {
  // JST に変換して表示
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const m   = jst.getUTCMonth() + 1;
  const day = jst.getUTCDate();
  const dow = jst.getUTCDay();
  return `${m}/${day}（${WEEK[dow]}）`;
}

// DBのPayrollItemリストを PayrollItem（view型）に集計する
function aggregateItems(
  dbItems: {
    id: string; userId: string; workDate: Date | null;
    baseAmount: number; overtimeAmount: number; nightAmount: number;
    holidayAmount: number; allowances: number;
    user: { id: string; name: string; guardProfile: { payType: string } | null };
    attendance: {
      clockIn: Date | null; clockOut: Date | null; breakMinutes: number;
      assignment: { project: { name: string } } | null;
    } | null;
  }[]
): PayrollItem[] {
  // userId ごとにグループ化
  const byGuard = new Map<string, typeof dbItems>();
  for (const item of dbItems) {
    const arr = byGuard.get(item.userId) ?? [];
    arr.push(item);
    byGuard.set(item.userId, arr);
  }

  const result: PayrollItem[] = [];
  for (const [, guardItems] of byGuard) {
    const guard   = guardItems[0].user;
    const payType = (guard.guardProfile?.payType ?? "DAILY") as "DAILY" | "MONTHLY" | "HOURLY";

    const totalBase    = guardItems.reduce((s, i) => s + i.baseAmount,    0);
    const totalOT      = guardItems.reduce((s, i) => s + i.overtimeAmount,0);
    const totalNight   = guardItems.reduce((s, i) => s + i.nightAmount,   0);
    const totalHoliday = guardItems.reduce((s, i) => s + i.holidayAmount, 0);
    const totalAllow   = guardItems.reduce((s, i) => s + i.allowances,    0);
    const grossPay     = totalBase + totalOT + totalNight + totalHoliday + totalAllow;
    const { health, pension, employment, tax, total } = calcDeductions(grossPay);

    const records: PayrollRecord[] = guardItems
      .filter((i) => i.workDate)
      .sort((a, b) => a.workDate!.getTime() - b.workDate!.getTime())
      .map((i): PayrollRecord => {
        const att = i.attendance;
        const workMin = att?.clockIn && att?.clockOut
          ? Math.max(0, Math.round((att.clockOut.getTime() - att.clockIn.getTime()) / 60000) - att.breakMinutes)
          : 0;
        return {
          date:           i.workDate!.toISOString().slice(0, 10),
          dateLabel:      dateLabel(i.workDate!),
          projectName:    att?.assignment?.project?.name ?? "—",
          workHours:      Math.round(workMin / 60 * 10) / 10,
          baseAmount:     i.baseAmount,
          overtimeAmount: i.overtimeAmount,
          nightAmount:    i.nightAmount,
          holidayAmount:  i.holidayAmount,
        };
      });

    result.push({
      guardId:             guard.id,
      guardName:           guard.name,
      payType,
      workDays:            guardItems.length,
      baseAmount:          totalBase,
      overtimeAmount:      totalOT,
      nightAmount:         totalNight,
      holidayAmount:       totalHoliday,
      allowances:          totalAllow,
      grossPay,
      healthInsurance:     health,
      pensionInsurance:    pension,
      employmentInsurance: employment,
      incomeTax:           tax,
      totalDeductions:     total,
      netPay:              grossPay - total,
      records,
    });
  }

  return result.sort((a, b) => a.guardName.localeCompare(b.guardName, "ja"));
}

// 当月の DB payrollRun を view型で返す（未計算なら null）
export async function getPayrollRunForView(year: number, month: number): Promise<PayrollRun | null> {
  const session = await requireSession();
  if (session.isDemo) return null;
  // 給与明細は経理・管理者のみ閲覧可能（GUARD に他人の給与を見せない）
  if (session.role !== "ADMIN" && session.role !== "ACCOUNTANT") {
    throw new Error("Forbidden");
  }

  const run = await prisma.payrollRun.findFirst({
    where: { orgId: session.orgId, year, month },
  });
  if (!run) return null;

  const dbItems = await prisma.payrollItem.findMany({
    where: { payrollRunId: run.id },
    include: {
      user:       { select: { id: true, name: true, guardProfile: { select: { payType: true } } } },
      attendance: {
        include: {
          assignment: { include: { project: { select: { name: true } } } },
        },
      },
    },
    orderBy: { workDate: "asc" },
  });

  return {
    year, month,
    status:      run.status as PayrollStatus,
    confirmedAt: run.confirmedAt?.toISOString() ?? null,
    paidAt:      run.paidAt?.toISOString()      ?? null,
    items:       aggregateItems(dbItems),
  };
}

// 勤怠データから給与を計算して DB に保存、view型で返す
export async function calculatePayroll(year: number, month: number): Promise<PayrollRun> {
  const session = await requireSession();
  if (session.isDemo) {
    // デモ時はデモデータを返す（インポートを避けるため空を返す）
    return { year, month, status: "DRAFT", confirmedAt: null, paidAt: null, items: [] };
  }
  // 経理・管理者のみ給与計算実行可能
  if (session.role !== "ADMIN" && session.role !== "ACCOUNTANT") {
    throw new Error("Forbidden");
  }

  const from = new Date(year, month - 1, 1);
  const to   = new Date(year, month,     1);

  // 当月の完了した勤怠（clockIn・clockOut が両方ある）
  const attendances = await prisma.attendance.findMany({
    where: {
      user:       { orgId: session.orgId },
      clockOut:   { not: null },
      assignment: { workDate: { gte: from, lt: to } },
    },
    include: {
      user: {
        select: {
          id: true, name: true,
          guardProfile: { select: { payType: true, basePay: true } },
        },
      },
      assignment: {
        include: {
          project: {
            select: { name: true, guardPay: true, overtimeRate: true, nightRate: true, holidayRate: true },
          },
        },
      },
    },
    orderBy: { clockIn: "asc" },
  });

  // PayrollRun を upsert（再計算可能にする）
  const dbRun = await prisma.payrollRun.upsert({
    where:  { orgId_year_month: { orgId: session.orgId, year, month } },
    create: { orgId: session.orgId, year, month, status: "DRAFT" },
    update: { status: "DRAFT", updatedAt: new Date() },
  });

  // 既存明細を削除して再計算
  await prisma.payrollItem.deleteMany({ where: { payrollRunId: dbRun.id } });

  // 勤怠ごとに計算して保存
  for (const att of attendances) {
    if (!att.clockIn || !att.clockOut) continue;

    const profile  = att.user.guardProfile;
    const basePay  = profile?.basePay ?? att.assignment.project.guardPay ?? 10000;
    const payType  = (profile?.payType ?? "DAILY") as "DAILY" | "MONTHLY" | "HOURLY";

    const calc = calculatePayForAttendance({
      clockIn:      att.clockIn,
      clockOut:     att.clockOut,
      breakMinutes: att.breakMinutes,
      baseDailyPay: basePay,
      payType,
      overtimeRate: att.assignment.project.overtimeRate,
      nightRate:    att.assignment.project.nightRate,
      holidayRate:  att.assignment.project.holidayRate,
    });

    await prisma.payrollItem.create({
      data: {
        payrollRunId:   dbRun.id,
        userId:         att.userId,
        attendanceId:   att.id,
        workDate:       att.assignment.workDate,
        baseAmount:     calc.baseAmount,
        overtimeAmount: calc.overtimeAmount,
        nightAmount:    calc.nightAmount,
        holidayAmount:  calc.holidayAmount,
        netPay:         calc.totalAmount,
      },
    });
  }

  revalidatePath("/dashboard/payroll");

  // 保存した明細を読み直して view型で返す
  const result = await getPayrollRunForView(year, month);
  return result ?? { year, month, status: "DRAFT", confirmedAt: null, paidAt: null, items: [] };
}

// ステータス変更（DRAFT → CONFIRMED → PAID）
export async function updatePayrollStatus(runId: string, status: PayrollStatus) {
  const session = await requireSession();
  if (session.isDemo) return;
  // 経理・管理者のみステータス変更可能
  if (session.role !== "ADMIN" && session.role !== "ACCOUNTANT") {
    throw new Error("Forbidden");
  }

  await prisma.payrollRun.update({
    where: { id: runId, orgId: session.orgId },
    data: {
      status,
      confirmedAt: status === "CONFIRMED" || status === "PAID" ? new Date() : undefined,
      paidAt:      status === "PAID" ? new Date() : undefined,
    },
  });

  revalidatePath("/dashboard/payroll");
}

// PayrollRun の DB ID を取得（ステータス更新ボタン用）
export async function getPayrollRunId(year: number, month: number): Promise<string | null> {
  const session = await requireSession();
  if (session.isDemo) return null;
  // 経理・管理者のみ
  if (session.role !== "ADMIN" && session.role !== "ACCOUNTANT") {
    throw new Error("Forbidden");
  }

  const run = await prisma.payrollRun.findFirst({
    where: { orgId: session.orgId, year, month },
    select: { id: true },
  });
  return run?.id ?? null;
}
