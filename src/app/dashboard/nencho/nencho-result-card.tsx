"use client";

import { NenchoResult } from "./nencho-types";

type Props = { result: NenchoResult };

function fmt(n: number) { return n.toLocaleString("ja-JP"); }

function Row({ label, value, indent }: { label: string; value: number; indent?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0 ${indent ? "pl-4" : ""}`}>
      <span className={`text-xs ${indent ? "text-gray-500" : "text-gray-700"}`}>{label}</span>
      <span className="text-xs tabular-nums text-gray-800">¥{fmt(value)}</span>
    </div>
  );
}

export function NenchoResultCard({ result }: Props) {
  const isRefund = result.refundOrAdditional >= 0;

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <h3 className="text-sm font-bold text-gray-700">年末調整 計算結果</h3>
      </div>
      <div className="px-4 py-3 space-y-0">
        <Row label="年間総収入" value={result.annualGross} />
        <Row label="給与所得控除" value={result.employmentDeduction} indent />
        <Row label="給与所得金額" value={result.employmentIncome} />

        <div className="pt-1">
          <Row label="基礎控除" value={result.basicDeduction} indent />
          {result.spouseDeduction > 0 && <Row label="配偶者控除" value={result.spouseDeduction} indent />}
          {result.dependentDeduction > 0 && <Row label="扶養控除" value={result.dependentDeduction} indent />}
          {result.lifeInsuranceDeduction > 0 && <Row label="生命保険料控除" value={result.lifeInsuranceDeduction} indent />}
          {result.earthquakeDeduction > 0 && <Row label="地震保険料控除" value={result.earthquakeDeduction} indent />}
          <Row label="所得控除合計" value={result.totalDeductions} />
        </div>

        <Row label="課税所得金額" value={result.taxableIncome} />
        <Row label="算出税額" value={result.calculatedTax} />
        {result.housingLoanCredit > 0 && <Row label="住宅ローン控除" value={result.housingLoanCredit} indent />}
        <Row label="年税額" value={result.finalTax} />
        <Row label="源泉徴収済み税額" value={result.withheldTax} />
      </div>

      {/* 還付/追収 */}
      <div className={`mx-4 mb-4 px-4 py-3 rounded-xl flex justify-between items-center ${
        isRefund ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
      }`}>
        <span className={`font-bold text-sm ${isRefund ? "text-green-700" : "text-red-700"}`}>
          {isRefund ? "還付金額" : "追加徴収額"}
        </span>
        <span className={`text-xl font-bold tabular-nums ${isRefund ? "text-green-700" : "text-red-700"}`}>
          {isRefund ? "+" : "-"}¥{fmt(Math.abs(result.refundOrAdditional))}
        </span>
      </div>
    </div>
  );
}
