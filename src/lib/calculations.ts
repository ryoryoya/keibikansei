// ============================================================
// 勤怠・給与計算ユーティリティ
// 警備業特有の計算ロジック
// ============================================================

import {
  differenceInMinutes,
  setHours,
  setMinutes,
  isWeekend,
  getDay,
} from "date-fns";

// --- 定数 ---
const NIGHT_START_HOUR = 22; // 深夜開始 22:00
const NIGHT_END_HOUR = 5; // 深夜終了 5:00
const STANDARD_WORK_MINUTES = 480; // 所定労働時間 8時間
const OVERTIME_RATE = 1.25; // 残業割増率
const NIGHT_RATE = 1.25; // 深夜割増率（0.25上乗せ）
const HOLIDAY_RATE = 1.35; // 休日割増率

// --- 日本の祝日判定（簡易版 - 実運用ではAPIまたはマスタ管理推奨） ---
const HOLIDAYS_2025 = [
  "2025-01-01", "2025-01-13", "2025-02-11", "2025-02-23", "2025-02-24",
  "2025-03-20", "2025-04-29", "2025-05-03", "2025-05-04", "2025-05-05",
  "2025-05-06", "2025-07-21", "2025-08-11", "2025-09-15", "2025-09-23",
  "2025-10-13", "2025-11-03", "2025-11-23", "2025-11-24",
];

export function isJapaneseHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return HOLIDAYS_2025.includes(dateStr);
}

export function isHolidayOrSunday(date: Date): boolean {
  return getDay(date) === 0 || isJapaneseHoliday(date);
}

// --- 深夜時間の計算 ---
export function calculateNightMinutes(
  clockIn: Date,
  clockOut: Date
): number {
  let nightMinutes = 0;
  const current = new Date(clockIn);

  while (current < clockOut) {
    const hour = current.getHours();
    const isNight = hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;

    if (isNight) {
      nightMinutes++;
    }

    current.setMinutes(current.getMinutes() + 1);
  }

  return nightMinutes;
}

// --- 残業時間の計算 ---
export function calculateOvertimeMinutes(
  totalMinutes: number,
  breakMinutes: number = 0
): number {
  const actualWork = totalMinutes - breakMinutes;
  return Math.max(0, actualWork - STANDARD_WORK_MINUTES);
}

// --- 給与計算 ---
export function calculatePayForAttendance(params: {
  clockIn: Date;
  clockOut: Date;
  breakMinutes?: number;
  baseDailyPay: number; // 日給
  payType: "DAILY" | "MONTHLY" | "HOURLY";
  baseHourlyPay?: number; // 時給（時給制の場合）
  overtimeRate?: number;
  nightRate?: number;
  holidayRate?: number;
}) {
  const {
    clockIn,
    clockOut,
    breakMinutes = 0,
    baseDailyPay,
    payType,
    baseHourlyPay,
    overtimeRate = OVERTIME_RATE,
    nightRate = NIGHT_RATE,
    holidayRate = HOLIDAY_RATE,
  } = params;

  const totalMinutes = differenceInMinutes(clockOut, clockIn);
  const actualWorkMinutes = totalMinutes - breakMinutes;
  const overtimeMinutes = calculateOvertimeMinutes(totalMinutes, breakMinutes);
  const nightMinutes = calculateNightMinutes(clockIn, clockOut);
  const isHoliday = isHolidayOrSunday(clockIn);

  // 時給を算出（日給制の場合は日給÷8時間）
  const hourlyRate =
    payType === "HOURLY" && baseHourlyPay
      ? baseHourlyPay
      : baseDailyPay / 8;

  // 基本給
  let baseAmount: number;
  if (payType === "DAILY") {
    baseAmount = baseDailyPay;
  } else if (payType === "HOURLY") {
    baseAmount = Math.round((actualWorkMinutes / 60) * hourlyRate);
  } else {
    // 月給制: 日割り計算は月次処理で行う
    baseAmount = baseDailyPay;
  }

  // 残業手当
  const overtimeAmount = Math.round(
    (overtimeMinutes / 60) * hourlyRate * (overtimeRate - 1)
  );

  // 深夜手当（残業と重複する部分も含む）
  const nightAmount = Math.round(
    (nightMinutes / 60) * hourlyRate * (nightRate - 1)
  );

  // 休日手当
  const holidayAmount = isHoliday
    ? Math.round(baseAmount * (holidayRate - 1))
    : 0;

  return {
    totalMinutes,
    actualWorkMinutes,
    overtimeMinutes,
    nightMinutes,
    isHoliday,
    baseAmount,
    overtimeAmount,
    nightAmount,
    holidayAmount,
    totalAmount: baseAmount + overtimeAmount + nightAmount + holidayAmount,
  };
}

// --- 源泉徴収額の計算（甲欄・月額の簡易版） ---
// 実運用では国税庁の源泉徴収税額表を参照
export function calculateWithholdingTax(
  monthlyGross: number,
  dependents: number = 0
): number {
  // 簡易計算：実運用では月額表ルックアップに差し替え
  const taxableAmount = monthlyGross;

  if (taxableAmount <= 88000) return 0;
  if (taxableAmount <= 89000) return dependents === 0 ? 130 : 0;

  // 簡易税率テーブル（甲欄・扶養0人の概算）
  if (dependents === 0) {
    if (taxableAmount <= 162500) return Math.round(taxableAmount * 0.03063);
    if (taxableAmount <= 275000) return Math.round(taxableAmount * 0.05210);
    if (taxableAmount <= 579167) return Math.round(taxableAmount * 0.06530);
    return Math.round(taxableAmount * 0.0773);
  }

  // 扶養ありの場合は控除後に再計算
  const deduction = dependents * 31667;
  return calculateWithholdingTax(
    Math.max(0, monthlyGross - deduction),
    0
  );
}

// --- 有給付与日数の計算（労基法39条） ---
export function calculatePaidLeaveDays(
  continuousYears: number,
  weeklyWorkDays: number = 5
): number {
  if (weeklyWorkDays >= 5) {
    // フルタイム
    const table = [10, 11, 12, 14, 16, 18, 20];
    const index = Math.min(continuousYears, 6);
    return continuousYears >= 0.5 ? table[Math.floor(index)] ?? 20 : 0;
  }

  // 比例付与テーブル（週4日以下）
  const proportionalTable: Record<number, number[]> = {
    4: [7, 8, 9, 10, 12, 13, 15],
    3: [5, 6, 6, 8, 9, 10, 11],
    2: [3, 4, 4, 5, 6, 6, 7],
    1: [1, 2, 2, 2, 3, 3, 3],
  };

  const days = Math.max(1, Math.min(weeklyWorkDays, 4));
  const table = proportionalTable[days] ?? proportionalTable[1];
  const index = Math.min(Math.floor(continuousYears), 6);
  return continuousYears >= 0.5 ? table[index] ?? table[6] : 0;
}
