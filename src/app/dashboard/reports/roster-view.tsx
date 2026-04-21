"use client";

import { useState } from "react";
import { DEMO_ROSTER, RosterEntry } from "./roster-types";

const EDU_BADGE: Record<RosterEntry["educationStatus"], string> = {
  完了:   "bg-green-100 text-green-700",
  受講中: "bg-amber-100 text-amber-700",
  未完了: "bg-red-100 text-red-700",
};

function calcAge(birthDate: string) {
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) age--;
  return age;
}

export function RosterView() {
  const [showRetired, setShowRetired] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = DEMO_ROSTER.filter((r) => {
    if (!showRetired && !r.isActive) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.name.includes(q) || r.nameKana.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 法令根拠ヘッダー */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-blue-800">警備員名簿</p>
          <p className="text-xs text-blue-600 mt-0.5">警備業法 第45条 / 施行規則 第64条 に基づく法定帳票</p>
        </div>
        <button onClick={() => alert("PDF出力（実装予定）")}
          className="px-4 py-2 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors">
          PDF出力
        </button>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="氏名・ふりがなで検索" className="input w-56" />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)}
            className="rounded" />
          退職者を含む
        </label>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length}名表示</span>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["No.","氏名","ふりがな","生年月日（年齢）","採用日","資格","教育","状態"].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r, i) => (
              <tr key={r.id} className={`hover:bg-gray-50 ${!r.isActive ? "opacity-60" : ""}`}>
                <td className="px-3 py-3 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{r.name}</td>
                <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{r.nameKana}</td>
                <td className="px-3 py-3 text-gray-600 whitespace-nowrap text-xs">
                  {r.birthDate}<br />
                  <span className="text-gray-400">{calcAge(r.birthDate)}歳</span>
                </td>
                <td className="px-3 py-3 text-gray-600 text-xs whitespace-nowrap">
                  {r.hireDate}
                  {r.retireDate && <><br /><span className="text-red-500">退職: {r.retireDate}</span></>}
                </td>
                <td className="px-3 py-3">
                  {r.qualifications.length === 0
                    ? <span className="text-gray-300 text-xs">なし</span>
                    : r.qualifications.map((q) => (
                        <span key={q} className="inline-block text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded mr-1 mb-1 whitespace-nowrap">{q}</span>
                      ))}
                </td>
                <td className="px-3 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EDU_BADGE[r.educationStatus]}`}>
                    {r.educationStatus}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {r.isActive ? "在職" : "退職"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
