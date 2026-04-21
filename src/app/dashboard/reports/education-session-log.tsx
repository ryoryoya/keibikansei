"use client";

import { EducationSession } from "./education-types";

type Props = { sessions: EducationSession[] };

const CAT_COLOR: Record<EducationSession["category"], string> = {
  "基本教育（法学）": "bg-blue-100 text-blue-700",
  "基本教育（実務）": "bg-indigo-100 text-indigo-700",
  "業務別教育":       "bg-purple-100 text-purple-700",
};

export function EducationSessionLog({ sessions }: Props) {
  if (sessions.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">教育記録なし</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 border-b">
          <tr>
            {["実施日","区分","時間","指導者","実施場所","備考"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sessions.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{s.date}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] ${CAT_COLOR[s.category]}`}>
                  {s.category}
                </span>
              </td>
              <td className="px-3 py-2 text-gray-700 font-medium whitespace-nowrap">{s.hours}h</td>
              <td className="px-3 py-2 text-gray-600">{s.instructor}</td>
              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{s.location}</td>
              <td className="px-3 py-2 text-gray-400">{s.notes || "—"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t bg-gray-50">
            <td colSpan={2} className="px-3 py-2 text-xs font-bold text-gray-600">合計</td>
            <td className="px-3 py-2 text-xs font-bold text-gray-800">
              {sessions.reduce((s, r) => s + r.hours, 0)}h
            </td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
