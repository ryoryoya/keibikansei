"use client";

import { useState } from "react";
import { ComplaintEntry, ComplaintStatus, COMPLAINT_STATUS_CONFIG, DEMO_COMPLAINTS } from "./complaint-types";

function ComplaintModal({ entry, onClose }: { entry: ComplaintEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <div className="bg-brand-500 px-5 py-4 rounded-t-2xl text-white flex justify-between">
          <div>
            <p className="text-xs text-brand-200">苦情処理記録 No.{entry.id}</p>
            <h3 className="font-bold mt-0.5">{entry.siteName}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><span className="text-gray-500 block">受付日</span><p className="font-medium">{entry.receivedDate}</p></div>
            <div><span className="text-gray-500 block">受付者</span><p className="font-medium">{entry.receivedBy}</p></div>
            <div><span className="text-gray-500 block">申出人</span><p className="font-medium">{entry.complainantName}（{entry.complainantType}）</p></div>
            <div><span className="text-gray-500 block">対象隊員</span><p className="font-medium">{entry.guardName ?? "特定なし"}</p></div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-500 mb-1">苦情内容</p>
            <p className="text-sm text-gray-800 leading-relaxed">{entry.content}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-700 mb-1">対応内容</p>
            <p className="text-sm text-gray-800 leading-relaxed">{entry.response}</p>
            {entry.resolvedDate && (
              <p className="text-xs text-blue-600 mt-2">解決日: {entry.resolvedDate}　担当: {entry.resolvedBy}</p>
            )}
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-xs font-bold text-green-700 mb-1">再発防止策</p>
            <p className="text-sm text-gray-800 leading-relaxed">{entry.preventiveMeasure}</p>
          </div>
        </div>
        <div className="px-5 py-3 border-t flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

export function ComplaintView() {
  const [complaints, setComplaints] = useState<ComplaintEntry[]>(DEMO_COMPLAINTS);
  const [statusFilter, setStatusFilter] = useState<"" | ComplaintStatus>("");
  const [selected, setSelected] = useState<ComplaintEntry | null>(null);

  const filtered = complaints.filter((c) => !statusFilter || c.status === statusFilter);
  const counts = { 受付: 0, 対応中: 0, 解決済み: 0 } as Record<ComplaintStatus, number>;
  complaints.forEach((c) => counts[c.status]++);

  function handleStatusChange(id: string, next: ComplaintStatus) {
    setComplaints((prev) => prev.map((c) => c.id === id
      ? { ...c, status: next, resolvedDate: next === "解決済み" ? new Date().toISOString().slice(0, 10) : c.resolvedDate, resolvedBy: next === "解決済み" ? "鈴木 花子" : c.resolvedBy }
      : c));
  }

  return (
    <div className="space-y-4">
      {/* 法令根拠ヘッダー */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-blue-800">苦情処理簿</p>
          <p className="text-xs text-blue-600 mt-0.5">警備業法 第20条 / 施行規則 第66条 に基づく法定帳票</p>
        </div>
        <button onClick={() => alert("新規受付登録（実装予定）")}
          className="px-4 py-2 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors">
          ＋ 新規受付
        </button>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-4">
        {(["受付","対応中","解決済み"] as ComplaintStatus[]).map((s) => (
          <div key={s} className={`rounded-xl border px-4 py-3 ${s === "受付" ? "bg-amber-50 border-amber-200" : s === "対応中" ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"}`}>
            <p className={`text-xs ${s === "受付" ? "text-amber-600" : s === "対応中" ? "text-blue-600" : "text-green-600"}`}>{s}</p>
            <p className={`text-2xl font-bold mt-1 ${s === "受付" ? "text-amber-700" : s === "対応中" ? "text-blue-700" : "text-green-700"}`}>{counts[s]}</p>
          </div>
        ))}
      </div>

      {/* フィルター */}
      <div className="flex gap-2 flex-wrap">
        {(["","受付","対応中","解決済み"] as const).map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${statusFilter === f ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-600 border-gray-300 hover:border-brand-300"}`}>
            {f || "すべて"}
          </button>
        ))}
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["受付日","現場名","申出人","苦情概要","ステータス","対応"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(c)}>
                <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{c.receivedDate}</td>
                <td className="px-4 py-3 text-xs font-medium text-gray-800">{c.siteName.split("（")[0]}</td>
                <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{c.complainantName}</td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">
                  <span className="line-clamp-2">{c.content}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COMPLAINT_STATUS_CONFIG[c.status].bg}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {c.status === "受付" && (
                    <button onClick={() => handleStatusChange(c.id, "対応中")}
                      className="text-xs text-blue-500 hover:text-blue-700 font-medium">対応開始</button>
                  )}
                  {c.status === "対応中" && (
                    <button onClick={() => handleStatusChange(c.id, "解決済み")}
                      className="text-xs text-green-500 hover:text-green-700 font-medium">解決済みへ</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <ComplaintModal entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
