"use client";

import { useState } from "react";
import { DEMO_EDUCATION_RECORDS, getCompletedHours, getStatus } from "./education-types";
import { EducationSessionLog } from "./education-session-log";

const STATUS_BADGE = {
  完了:   "bg-green-100 text-green-700",
  受講中: "bg-amber-100 text-amber-700",
  不足:   "bg-red-100 text-red-700",
};

function HoursBar({ done, required, label }: { done: number; required: number; label: string }) {
  const pct = Math.min((done / required) * 100, 100);
  const color = done >= required ? "bg-green-500" : done > 0 ? "bg-amber-400" : "bg-gray-200";
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={`text-xs font-bold ${done >= required ? "text-green-600" : "text-amber-600"}`}>
          {done}/{required}h
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function EducationView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const record = DEMO_EDUCATION_RECORDS.find((r) => r.guardId === selectedId) ?? null;

  return (
    <div className="space-y-4">
      {/* 法令根拠ヘッダー */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-blue-800">警備員教育記録簿</p>
          <p className="text-xs text-blue-600 mt-0.5">警備業法 第21条 に基づく法定帳票</p>
        </div>
        <button onClick={() => alert("PDF出力（実装予定）")}
          className="px-4 py-2 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors">
          PDF出力
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 左：隊員リスト */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <p className="text-sm font-bold text-gray-700">対象隊員</p>
          </div>
          <div className="divide-y divide-gray-100">
            {DEMO_EDUCATION_RECORDS.map((r) => {
              const done  = getCompletedHours(r);
              const total = done.legal + done.practical + done.jobSpecific;
              const req   = r.requiredHours.legal + r.requiredHours.practical + r.requiredHours.jobSpecific;
              const status = getStatus(r);
              return (
                <button key={r.guardId} onClick={() => setSelectedId(r.guardId)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedId === r.guardId ? "bg-brand-50 border-l-4 border-brand-500" : ""}`}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.guardName}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {r.isNewEmployee ? "新任教育" : "現任教育"} {total}/{req}h
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[status]}`}>
                    {status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 右：詳細 */}
        <div className="lg:col-span-2 space-y-4">
          {record ? (
            <>
              <div className="bg-white rounded-xl border px-5 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">{record.guardName}　教育記録</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[getStatus(record)]}`}>
                    {getStatus(record)}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(() => {
                    const done = getCompletedHours(record);
                    return [
                      { label: "基本教育（法学）",  done: done.legal,       req: record.requiredHours.legal },
                      { label: "基本教育（実務）",  done: done.practical,   req: record.requiredHours.practical },
                      { label: "業務別教育",        done: done.jobSpecific, req: record.requiredHours.jobSpecific },
                    ].map((item) => (
                      <HoursBar key={item.label} label={item.label} done={item.done} required={item.req} />
                    ));
                  })()}
                </div>
              </div>

              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-700">教育実施記録</p>
                  <button onClick={() => alert("記録追加（実装予定）")}
                    className="text-xs text-brand-500 hover:text-brand-700 font-medium">
                    ＋ 記録追加
                  </button>
                </div>
                <EducationSessionLog sessions={record.sessions} />
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border flex flex-col items-center justify-center py-16 text-gray-400 space-y-2">
              <span className="text-4xl">📚</span>
              <p className="text-sm">隊員を選択して教育記録を確認</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
