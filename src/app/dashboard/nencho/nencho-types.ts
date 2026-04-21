// 年末調整の型定義とデモデータ

export type NenchoStatus = "NOT_STARTED" | "COLLECTING" | "CALCULATING" | "COMPLETED";

export type NenchoDependent = {
  id: string;
  name: string;
  relationship: string;  // "配偶者" | "子" | "父" | "母" 等
  birthDate: string;     // "YYYY-MM-DD"
  income: number;
};

export type NenchoDeclarations = {
  hasSpouse: boolean;
  spouseIncome: number;
  dependents: NenchoDependent[];
  lifeInsurance: number;       // 生命保険料控除申告額
  earthquakeInsurance: number; // 地震保険料控除
  housingLoan: number;         // 住宅ローン控除
  previousEmployerPay: number; // 前職給与
  previousEmployerTax: number; // 前職源泉徴収税額
};

export type NenchoGuard = {
  guardId: string;
  guardName: string;
  status: NenchoStatus;
  submittedAt: string | null;
  annualGross: number;       // 年間総支給額（計算用）
  withheldTax: number;       // 年間源泉徴収済み税額
  declarations: NenchoDeclarations;
};

export type NenchoResult = {
  annualGross: number;
  employmentDeduction: number;   // 給与所得控除
  employmentIncome: number;      // 給与所得金額
  basicDeduction: number;        // 基礎控除
  spouseDeduction: number;       // 配偶者控除
  dependentDeduction: number;    // 扶養控除合計
  lifeInsuranceDeduction: number;
  earthquakeDeduction: number;
  totalDeductions: number;
  taxableIncome: number;
  calculatedTax: number;         // 算出税額
  housingLoanCredit: number;     // 住宅ローン控除
  finalTax: number;              // 差引税額
  withheldTax: number;
  refundOrAdditional: number;    // 還付(+) / 追収(-)
};

export const NENCHO_STATUS_CONFIG: Record<NenchoStatus, { label: string; bg: string }> = {
  NOT_STARTED: { label: "未着手",   bg: "bg-gray-100 text-gray-500" },
  COLLECTING:  { label: "収集中",   bg: "bg-amber-100 text-amber-700" },
  CALCULATING: { label: "計算中",   bg: "bg-blue-100 text-blue-700" },
  COMPLETED:   { label: "完了",     bg: "bg-green-100 text-green-700" },
};

// ── 給与所得控除の計算（2024年度）──
function calcEmploymentDeduction(gross: number): number {
  if (gross <= 1_625_000)  return 550_000;
  if (gross <= 1_800_000)  return Math.floor(gross * 0.4) - 100_000;
  if (gross <= 3_600_000)  return Math.floor(gross * 0.3) + 80_000;
  if (gross <= 6_600_000)  return Math.floor(gross * 0.2) + 440_000;
  if (gross <= 8_500_000)  return Math.floor(gross * 0.1) + 1_100_000;
  return 1_950_000;
}

// ── 所得税率（2024年度 超過累進）──
function calcIncomeTax(taxable: number): number {
  if (taxable <= 1_950_000)  return Math.floor(taxable * 0.05);
  if (taxable <= 3_300_000)  return Math.floor(taxable * 0.1)  -  97_500;
  if (taxable <= 6_950_000)  return Math.floor(taxable * 0.2)  - 427_500;
  if (taxable <= 9_000_000)  return Math.floor(taxable * 0.23) - 636_000;
  if (taxable <= 18_000_000) return Math.floor(taxable * 0.33) - 1_536_000;
  if (taxable <= 40_000_000) return Math.floor(taxable * 0.4)  - 2_796_000;
  return Math.floor(taxable * 0.45) - 4_796_000;
}

export function calculateNencho(guard: NenchoGuard): NenchoResult {
  const { annualGross, withheldTax, declarations: d } = guard;
  const totalGross = annualGross + d.previousEmployerPay;

  const employmentDeduction  = calcEmploymentDeduction(totalGross);
  const employmentIncome     = Math.max(0, totalGross - employmentDeduction);

  // 基礎控除（所得2400万以下は48万固定）
  const basicDeduction = 480_000;

  // 配偶者控除（配偶者所得48万以下かつ納税者所得900万以下: 38万）
  const spouseDeduction = d.hasSpouse && d.spouseIncome <= 480_000 && employmentIncome <= 9_000_000 ? 380_000 : 0;

  // 扶養控除（一般扶養: 38万/人）
  const dependentDeduction = d.dependents.filter((dep) => dep.income <= 480_000).length * 380_000;

  // 保険料控除
  const lifeInsuranceDeduction  = Math.min(d.lifeInsurance,       40_000);
  const earthquakeDeduction      = Math.min(d.earthquakeInsurance, 50_000);

  const totalDeductions = basicDeduction + spouseDeduction + dependentDeduction + lifeInsuranceDeduction + earthquakeDeduction;
  const taxableIncome   = Math.max(0, Math.floor((employmentIncome - totalDeductions) / 1000) * 1000);

  // 算出税額（復興特別所得税 2.1% 込み）
  const baseTax        = calcIncomeTax(taxableIncome);
  const calculatedTax  = Math.floor(baseTax * 1.021);

  // 住宅ローン控除
  const housingLoanCredit = Math.min(d.housingLoan, calculatedTax);
  const finalTax          = Math.max(0, calculatedTax - housingLoanCredit);

  // 前職源泉徴収分も含めた還付/追収
  const totalWithheld = withheldTax + d.previousEmployerTax;

  return {
    annualGross: totalGross,
    employmentDeduction,
    employmentIncome,
    basicDeduction,
    spouseDeduction,
    dependentDeduction,
    lifeInsuranceDeduction,
    earthquakeDeduction,
    totalDeductions,
    taxableIncome,
    calculatedTax,
    housingLoanCredit,
    finalTax,
    withheldTax: totalWithheld,
    refundOrAdditional: totalWithheld - finalTax,
  };
}

function emptyDecl(): NenchoDeclarations {
  return { hasSpouse: false, spouseIncome: 0, dependents: [], lifeInsurance: 0, earthquakeInsurance: 0, housingLoan: 0, previousEmployerPay: 0, previousEmployerTax: 0 };
}

export const DEMO_NENCHO_GUARDS: NenchoGuard[] = [
  {
    guardId: "g1", guardName: "田中 一郎",
    status: "COMPLETED", submittedAt: "2026-01-10T10:00:00",
    annualGross: 2_760_000, withheldTax: 75_600,
    declarations: { hasSpouse: true, spouseIncome: 0, dependents: [{ id: "d1", name: "田中 花子", relationship: "子", birthDate: "2010-04-15", income: 0 }], lifeInsurance: 80_000, earthquakeInsurance: 15_000, housingLoan: 0, previousEmployerPay: 0, previousEmployerTax: 0 },
  },
  {
    guardId: "g2", guardName: "高橋 二郎",
    status: "COLLECTING", submittedAt: "2026-01-18T09:00:00",
    annualGross: 2_556_000, withheldTax: 58_200,
    declarations: { hasSpouse: false, spouseIncome: 0, dependents: [], lifeInsurance: 30_000, earthquakeInsurance: 0, housingLoan: 80_000, previousEmployerPay: 0, previousEmployerTax: 0 },
  },
  {
    guardId: "g4", guardName: "伊藤 四郎",
    status: "CALCULATING", submittedAt: "2026-01-20T14:00:00",
    annualGross: 3_815_424, withheldTax: 162_400,
    declarations: { hasSpouse: true, spouseIncome: 900_000, dependents: [{ id: "d2", name: "伊藤 太郎", relationship: "子", birthDate: "2015-07-20", income: 0 }, { id: "d3", name: "伊藤 花子", relationship: "子", birthDate: "2018-03-10", income: 0 }], lifeInsurance: 120_000, earthquakeInsurance: 25_000, housingLoan: 150_000, previousEmployerPay: 0, previousEmployerTax: 0 },
  },
  {
    guardId: "g6", guardName: "加藤 六郎",
    status: "NOT_STARTED", submittedAt: null,
    annualGross: 3_060_000, withheldTax: 95_200,
    declarations: emptyDecl(),
  },
  {
    guardId: "g7", guardName: "吉田 七子",
    status: "COMPLETED", submittedAt: "2026-01-08T11:30:00",
    annualGross: 3_589_200, withheldTax: 145_800,
    declarations: { hasSpouse: false, spouseIncome: 0, dependents: [{ id: "d4", name: "吉田 母", relationship: "母", birthDate: "1955-09-01", income: 300_000 }], lifeInsurance: 60_000, earthquakeInsurance: 30_000, housingLoan: 0, previousEmployerPay: 0, previousEmployerTax: 0 },
  },
];
