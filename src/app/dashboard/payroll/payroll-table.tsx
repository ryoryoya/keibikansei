"use client";

import { PayrollItem } from "./payroll-types";

type Props = {
  items: PayrollItem[];
  onSelect: (item: PayrollItem) => void;
};

function fmt(n: number) {
  return n.toLocaleString("ja-JP");
}

export function PayrollTable({ items, onSelect }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">氏名</th>
            <th className="px-4 py-3 text-center font-semibold text-gray-600 whitespace-nowrap">勤務日数</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">基本給</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">残業</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">深夜</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">休日</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">諸手当</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">支給合計</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">控除合計</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">差引支給額</th>
            <th className="px-4 py-3 text-center font-semibold text-gray-600"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr
              key={item.guardId}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="font-medium text-gray-900">{item.guardName}</div>
                <div className="text-xs text-gray-400">
                  {item.payType === "DAILY" ? "日給" : item.payType === "MONTHLY" ? "月給" : "時給"}
                </div>
              </td>
              <td className="px-4 py-3 text-center text-gray-700">{item.workDays}日</td>
              <td className="px-4 py-3 text-right text-gray-700">{fmt(item.baseAmount)}</td>
              <td className="px-4 py-3 text-right">
                {item.overtimeAmount > 0 ? (
                  <span className="text-amber-600">{fmt(item.overtimeAmount)}</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {item.nightAmount > 0 ? (
                  <span className="text-indigo-600">{fmt(item.nightAmount)}</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {item.holidayAmount > 0 ? (
                  <span className="text-red-600">{fmt(item.holidayAmount)}</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right text-gray-700">
                {item.allowances > 0 ? fmt(item.allowances) : <span className="text-gray-300">—</span>}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">
                {fmt(item.grossPay)}
              </td>
              <td className="px-4 py-3 text-right text-red-600">
                -{fmt(item.totalDeductions)}
              </td>
              <td className="px-4 py-3 text-right font-bold text-brand-700 text-base">
                {fmt(item.netPay)}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onSelect(item)}
                  className="px-3 py-1.5 text-xs font-medium text-brand-600 border border-brand-300 rounded-lg hover:bg-brand-50 transition-colors whitespace-nowrap"
                >
                  明細
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        {/* 合計行 */}
        <tfoot>
          <tr className="border-t-2 border-gray-300 bg-gray-50">
            <td className="px-4 py-3 font-bold text-gray-700">合計</td>
            <td className="px-4 py-3 text-center text-gray-600">
              {items.reduce((s, i) => s + i.workDays, 0)}日
            </td>
            <td className="px-4 py-3 text-right font-semibold text-gray-700">
              {fmt(items.reduce((s, i) => s + i.baseAmount, 0))}
            </td>
            <td className="px-4 py-3 text-right font-semibold text-amber-600">
              {fmt(items.reduce((s, i) => s + i.overtimeAmount, 0))}
            </td>
            <td className="px-4 py-3 text-right font-semibold text-indigo-600">
              {fmt(items.reduce((s, i) => s + i.nightAmount, 0))}
            </td>
            <td className="px-4 py-3 text-right font-semibold text-red-600">
              {fmt(items.reduce((s, i) => s + i.holidayAmount, 0))}
            </td>
            <td className="px-4 py-3 text-right font-semibold text-gray-700">
              {fmt(items.reduce((s, i) => s + i.allowances, 0))}
            </td>
            <td className="px-4 py-3 text-right font-bold text-gray-900">
              {fmt(items.reduce((s, i) => s + i.grossPay, 0))}
            </td>
            <td className="px-4 py-3 text-right font-bold text-red-600">
              -{fmt(items.reduce((s, i) => s + i.totalDeductions, 0))}
            </td>
            <td className="px-4 py-3 text-right font-bold text-brand-700 text-base">
              {fmt(items.reduce((s, i) => s + i.netPay, 0))}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
