"use client";

import { useEffect } from "react";
import { PayrollItem, PayrollStatus, STATUS_CONFIG } from "./payroll-types";

type Props = {
  item: PayrollItem | null;
  status: PayrollStatus;
  onClose: () => void;
};

function fmt(n: number) {
  return n.toLocaleString("ja-JP");
}

function Row({ label, value, accent, bold }: { label: string; value: number; accent?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm tabular-nums ${bold ? "font-bold" : ""} ${accent ?? "text-gray-900"}`}>
        ¥{fmt(value)}
      </span>
    </div>
  );
}

export function PayslipModal({ item, status, onClose }: Props) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onClose]);

  if (!item) return null;

  const statusCfg = STATUS_CONFIG[status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="bg-brand-500 px-6 py-4 rounded-t-2xl text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{item.guardName} 給与明細</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-brand-200 text-sm">
                {item.payType === "DAILY" ? "日給" : item.payType === "MONTHLY" ? "月給" : "時給"} / {item.workDays}日勤務
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.bg}`}>
                {statusCfg.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* 支給 */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">支給</h3>
            <div className="bg-gray-50 rounded-xl px-4 py-2">
              <Row label="基本給" value={item.baseAmount} />
              {item.overtimeAmount > 0 && <Row label="時間外手当" value={item.overtimeAmount} accent="text-amber-600" />}
              {item.nightAmount > 0 && <Row label="深夜手当" value={item.nightAmount} accent="text-indigo-600" />}
              {item.holidayAmount > 0 && <Row label="休日手当" value={item.holidayAmount} accent="text-red-600" />}
              {item.allowances > 0 && <Row label="諸手当" value={item.allowances} />}
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-200">
                <span className="text-sm font-bold text-gray-700">支給合計</span>
                <span className="font-bold text-gray-900 tabular-nums">¥{fmt(item.grossPay)}</span>
              </div>
            </div>
          </div>

          {/* 控除 */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">控除</h3>
            <div className="bg-gray-50 rounded-xl px-4 py-2">
              <Row label="健康保険料" value={item.healthInsurance} />
              <Row label="厚生年金保険料" value={item.pensionInsurance} />
              <Row label="雇用保険料" value={item.employmentInsurance} />
              <Row label="源泉所得税" value={item.incomeTax} />
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-200">
                <span className="text-sm font-bold text-gray-700">控除合計</span>
                <span className="font-bold text-red-600 tabular-nums">-¥{fmt(item.totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* 差引支給額 */}
          <div className="bg-brand-50 border border-brand-200 rounded-xl px-5 py-4 flex justify-between items-center">
            <span className="font-bold text-gray-700">差引支給額（振込額）</span>
            <span className="text-2xl font-bold text-brand-700 tabular-nums">¥{fmt(item.netPay)}</span>
          </div>

          {/* 勤務明細 */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">勤務明細</h3>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold">日付</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-semibold">現場</th>
                    <th className="px-3 py-2 text-center text-gray-500 font-semibold">時間</th>
                    <th className="px-3 py-2 text-right text-gray-500 font-semibold">基本</th>
                    <th className="px-3 py-2 text-right text-gray-500 font-semibold">残業</th>
                    <th className="px-3 py-2 text-right text-gray-500 font-semibold">深夜</th>
                    <th className="px-3 py-2 text-right text-gray-500 font-semibold">休日</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {item.records.map((rec) => (
                    <tr key={rec.date} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{rec.dateLabel}</td>
                      <td className="px-3 py-2 text-gray-600">{rec.projectName}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{rec.workHours}h</td>
                      <td className="px-3 py-2 text-right text-gray-700 tabular-nums">{fmt(rec.baseAmount)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {rec.overtimeAmount > 0 ? <span className="text-amber-600">{fmt(rec.overtimeAmount)}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {rec.nightAmount > 0 ? <span className="text-indigo-600">{fmt(rec.nightAmount)}</span> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {rec.holidayAmount > 0 ? <span className="text-red-600">{fmt(rec.holidayAmount)}</span> : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            閉じる
          </button>
          <button
            className="px-5 py-2 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors"
            onClick={() => alert("PDF出力（実装予定）")}
          >
            PDF出力
          </button>
        </div>
      </div>
    </div>
  );
}
