// 給与管理の型定義とデモデータ
import { calculateWithholdingTax } from "@/lib/calculations";

export type PayrollStatus = "DRAFT" | "CONFIRMED" | "PAID";

export type PayrollItem = {
  guardId: string;
  guardName: string;
  payType: "DAILY" | "MONTHLY" | "HOURLY";
  workDays: number;
  // 支給
  baseAmount: number;
  overtimeAmount: number;
  nightAmount: number;
  holidayAmount: number;
  allowances: number;
  grossPay: number;
  // 控除
  healthInsurance: number;
  pensionInsurance: number;
  employmentInsurance: number;
  incomeTax: number;
  totalDeductions: number;
  netPay: number;
  // 勤務明細（日別）
  records: PayrollRecord[];
};

export type PayrollRecord = {
  date: string;        // "YYYY-MM-DD"
  dateLabel: string;   // "2/3（月）"
  projectName: string;
  workHours: number;
  baseAmount: number;
  overtimeAmount: number;
  nightAmount: number;
  holidayAmount: number;
};

export type PayrollRun = {
  year: number;
  month: number;
  status: PayrollStatus;
  confirmedAt: string | null;
  paidAt: string | null;
  items: PayrollItem[];
};

// 社会保険料率（2024年度 概算）
const HEALTH_RATE   = 0.0515; // 健康保険（労使折半後）
const PENSION_RATE  = 0.0915; // 厚生年金（労使折半後）
const EMPLOY_RATE   = 0.006;  // 雇用保険（労働者負担）

function calcDeductions(gross: number) {
  const health     = Math.round(gross * HEALTH_RATE);
  const pension    = Math.round(gross * PENSION_RATE);
  const employment = Math.round(gross * EMPLOY_RATE);
  const tax        = calculateWithholdingTax(gross, 0);
  const total      = health + pension + employment + tax;
  return { health, pension, employment, tax, total };
}

function makeRecords(
  year: number, month: number,
  days: number[], projectName: string,
  basePay: number, extraByDay: (d: number) => { ot: number; night: number; holiday: number }
): PayrollRecord[] {
  const WEEK = ["日","月","火","水","木","金","土"];
  return days.map((d) => {
    const date = new Date(year, month - 1, d);
    const dow = date.getDay();
    const label = `${month}/${d}（${WEEK[dow]}）`;
    const { ot, night, holiday } = extraByDay(d);
    return {
      date: `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`,
      dateLabel: label,
      projectName,
      workHours: 8 + (ot > 0 ? 1 : 0),
      baseAmount: basePay,
      overtimeAmount: ot,
      nightAmount: night,
      holidayAmount: holiday,
    };
  });
}

export function generatePayrollRun(year: number, month: number): PayrollRun {
  // ── 田中 一郎（日給10,000 / 22日）──
  const tanaka = (() => {
    const records = makeRecords(year, month, [3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,3,4], "A現場",
      10000, (d) => ({ ot: d % 5 === 0 ? 1250 : 0, night: 0, holiday: d === 7 ? 3500 : 0 }));
    const base = 220000, ot = 3750, night = 0, holiday = 3500, allow = 5000;
    const gross = base + ot + night + holiday + allow;
    const { health, pension, employment, tax, total } = calcDeductions(gross);
    return { guardId:"g1", guardName:"田中 一郎", payType:"DAILY" as const, workDays:22,
      baseAmount:base, overtimeAmount:ot, nightAmount:night, holidayAmount:holiday, allowances:allow,
      grossPay:gross, healthInsurance:health, pensionInsurance:pension,
      employmentInsurance:employment, incomeTax:tax, totalDeductions:total, netPay:gross-total, records };
  })();

  // ── 高橋 二郎（日給10,500 / 20日）──
  const takahashi = (() => {
    const records = makeRecords(year, month, [3,4,5,6,7,10,11,12,13,14,17,18,19,20,24,25,26,27,28,3], "A現場",
      10500, () => ({ ot: 0, night: 0, holiday: 0 }));
    const base = 210000, ot = 0, night = 0, holiday = 0, allow = 3000;
    const gross = base + ot + night + holiday + allow;
    const { health, pension, employment, tax, total } = calcDeductions(gross);
    return { guardId:"g2", guardName:"高橋 二郎", payType:"DAILY" as const, workDays:20,
      baseAmount:base, overtimeAmount:ot, nightAmount:night, holidayAmount:holiday, allowances:allow,
      grossPay:gross, healthInsurance:health, pensionInsurance:pension,
      employmentInsurance:employment, incomeTax:tax, totalDeductions:total, netPay:gross-total, records };
  })();

  // ── 伊藤 四郎（日給11,500 / 22日・夜勤あり）──
  const ito = (() => {
    const records = makeRecords(year, month, [3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,3,4], "C現場",
      11500, (d) => ({ ot: 2500, night: d % 3 === 0 ? 3593 : 0, holiday: d === 7 || d === 14 ? 4025 : 0 }));
    const base = 253000, ot = 22500, night = 25152, holiday = 8050, allow = 5000;
    const gross = base + ot + night + holiday + allow;
    const { health, pension, employment, tax, total } = calcDeductions(gross);
    return { guardId:"g4", guardName:"伊藤 四郎", payType:"DAILY" as const, workDays:22,
      baseAmount:base, overtimeAmount:ot, nightAmount:night, holidayAmount:holiday, allowances:allow,
      grossPay:gross, healthInsurance:health, pensionInsurance:pension,
      employmentInsurance:employment, incomeTax:tax, totalDeductions:total, netPay:gross-total, records };
  })();

  // ── 加藤 六郎（日給12,000 / 15日・深夜専従）──
  const kato = (() => {
    const records = makeRecords(year, month, [3,4,5,6,7,10,11,12,13,14,17,18,19,20,21], "C現場",
      12000, () => ({ ot: 0, night: 5000, holiday: 0 }));
    const base = 180000, ot = 0, night = 75000, holiday = 0, allow = 0;
    const gross = base + ot + night + holiday + allow;
    const { health, pension, employment, tax, total } = calcDeductions(gross);
    return { guardId:"g6", guardName:"加藤 六郎", payType:"DAILY" as const, workDays:15,
      baseAmount:base, overtimeAmount:ot, nightAmount:night, holidayAmount:holiday, allowances:allow,
      grossPay:gross, healthInsurance:health, pensionInsurance:pension,
      employmentInsurance:employment, incomeTax:tax, totalDeductions:total, netPay:gross-total, records };
  })();

  // ── 吉田 七子（月給250,000 / 22日）──
  const yoshida = (() => {
    const records = makeRecords(year, month, [3,4,5,6,7,10,11,12,13,14,17,18,19,20,21,24,25,26,27,28,3,4], "A現場",
      Math.round(250000/22), () => ({ ot: 3906, night: 0, holiday: 0 }));
    const base = 250000, ot = 39060, night = 0, holiday = 0, allow = 10000;
    const gross = base + ot + night + holiday + allow;
    const { health, pension, employment, tax, total } = calcDeductions(gross);
    return { guardId:"g7", guardName:"吉田 七子", payType:"MONTHLY" as const, workDays:22,
      baseAmount:base, overtimeAmount:ot, nightAmount:night, holidayAmount:holiday, allowances:allow,
      grossPay:gross, healthInsurance:health, pensionInsurance:pension,
      employmentInsurance:employment, incomeTax:tax, totalDeductions:total, netPay:gross-total, records };
  })();

  return {
    year, month,
    status: "DRAFT",
    confirmedAt: null,
    paidAt: null,
    items: [tanaka, takahashi, ito, kato, yoshida],
  };
}

export const STATUS_CONFIG: Record<PayrollStatus, { label: string; bg: string }> = {
  DRAFT:     { label: "計算中",  bg: "bg-gray-100 text-gray-600" },
  CONFIRMED: { label: "確定済み", bg: "bg-blue-100 text-blue-700" },
  PAID:      { label: "支払済み", bg: "bg-green-100 text-green-700" },
};
