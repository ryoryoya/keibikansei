"use client";

import { useState } from "react";
import { PAYSLIP_DEMO } from "../guard-demo-data";

const MONTHS = [
  { year: 2026, month: 2, label: "2026年2月分" },
  { year: 2026, month: 1, label: "2026年1月分" },
  { year: 2025, month: 12, label: "2025年12月分" },
];

export default function PayslipPage() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showRecords, setShowRecords] = useState(false);
  const p = PAYSLIP_DEMO; // デモは1ヶ月分固定

  return (
    <div className="p-4 pb-8 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">給与明細</h2>
        <p className="text-xs text-gray-500 mt-0.5">支給済みの給与明細を確認できます</p>
      </div>

      {/* 月選択 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MONTHS.map((m, i) => (
          <button
            key={i}
            onClick={() => setSelectedIdx(i)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedIdx === i ? "bg-brand-500 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 差引支給額（ヒーロー） */}
      <div className="bg-brand-500 text-white rounded-2xl p-5 text-center">
        <p className="text-sm text-brand-200">差引支給額</p>
        <p className="text-4xl font-bold mt-1">¥{p.netPay.toLocaleString()}</p>
        <p className="text-xs text-brand-200 mt-2">{p.workDays}日勤務　{MONTHS[selectedIdx].label}</p>
      </div>

      {/* 支給内訳 */}
      <div className="bg-white rounded-2xl border p-4 space-y-3">
        <h3 className="font-bold text-gray-900">支給内訳</h3>
        <div className="space-y-2">
          <PayRow label="基本給" amount={p.basePay} />
          <PayRow label="時間外手当" amount={p.overtimePay} />
          <PayRow label="深夜割増手当" amount={p.nightPay} />
          <PayRow label="休日割増手当" amount={p.holidayPay} />
          <PayRow label="その他手当" amount={p.allowances} />
          <div className="border-t pt-2">
            <PayRow label="支給合計" amount={p.grossPay} bold />
          </div>
        </div>
      </div>

      {/* 控除内訳 */}
      <div className="bg-white rounded-2xl border p-4 space-y-3">
        <h3 className="font-bold text-gray-900">控除内訳</h3>
        <div className="space-y-2">
          <PayRow label="健康保険料" amount={p.healthInsurance} minus />
          <PayRow label="厚生年金保険料" amount={p.pensionInsurance} minus />
          <PayRow label="雇用保険料" amount={p.employmentInsurance} minus />
          <PayRow label="所得税（源泉徴収）" amount={p.incomeTax} minus />
          <div className="border-t pt-2">
            <PayRow label="控除合計" amount={p.totalDeductions} bold minus />
          </div>
        </div>
      </div>

      {/* 勤務実績 */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <button
          onClick={() => setShowRecords((v) => !v)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <span className="font-bold text-gray-900">勤務実績（抜粋）</span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${showRecords ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showRecords && (
          <div className="border-t">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500">
                  <th className="text-left py-2 px-4 font-medium">日付</th>
                  <th className="text-left py-2 px-3 font-medium">現場</th>
                  <th className="text-right py-2 px-3 font-medium">基本</th>
                  <th className="text-right py-2 px-3 font-medium">割増</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {p.records.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4 text-gray-700">{r.date}</td>
                    <td className="py-2.5 px-3 text-gray-600 text-xs">{r.project}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs text-gray-900">¥{r.baseAmount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs text-gray-600">
                      {r.overtime + r.night > 0 ? `¥${(r.overtime + r.night).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-gray-400 text-center py-2">表示は直近5件です</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PayRow({ label, amount, bold, minus }: { label: string; amount: number; bold?: boolean; minus?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${bold ? "font-bold" : ""}`}>
      <span className={`text-sm ${bold ? "text-gray-900" : "text-gray-600"}`}>{label}</span>
      <span className={`font-mono text-sm ${minus ? "text-red-600" : "text-gray-900"}`}>
        {minus ? "−" : ""}¥{amount.toLocaleString()}
      </span>
    </div>
  );
}
