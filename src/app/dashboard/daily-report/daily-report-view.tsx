"use client";

import { useState } from "react";
import type { DailyReport, GuardOption } from "./daily-report-types";
import { DEMO_REPORTS, DEMO_GUARDS_FOR_REPORT, newReport } from "./daily-report-types";
import DailyReportForm from "./daily-report-form";
import DailyReportPrint from "./daily-report-print";

export default function DailyReportView({ dbGuards = [] }: { dbGuards?: GuardOption[] }) {
  const guards: GuardOption[] = dbGuards.length > 0 ? dbGuards : DEMO_GUARDS_FOR_REPORT;
  const [reports, setReports] = useState<DailyReport[]>(DEMO_REPORTS);
  const [mode, setMode] = useState<"list" | "new" | "edit">("list");
  const [editing, setEditing] = useState<DailyReport | null>(null);
  const [printing, setPrinting] = useState<DailyReport | null>(null);

  const handleSave = (r: DailyReport) => {
    setReports((prev) =>
      prev.some((p) => p.id === r.id)
        ? prev.map((p) => (p.id === r.id ? r : p))
        : [r, ...prev]
    );
    setMode("list");
    setEditing(null);
  };

  const handleEdit = (r: DailyReport) => {
    setEditing(r);
    setMode("edit");
  };

  const handleNew = () => {
    setEditing(newReport());
    setMode("new");
  };

  const handleCancel = () => {
    setMode("list");
    setEditing(null);
  };

  // 日付を見やすく整形
  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}`;
  };

  if (mode === "new" || mode === "edit") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={handleCancel} className="text-sm text-gray-500 hover:text-gray-700">
            ← 一覧に戻る
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "new" ? "新規日報作成" : "日報編集"}
          </h2>
        </div>
        <DailyReportForm
          initial={editing!}
          guards={guards}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">警備報告書（日報）</h2>
          <p className="text-sm text-gray-500 mt-1">全{reports.length}件</p>
        </div>
        <button
          onClick={handleNew}
          className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600"
        >
          ＋ 新規作成
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-xs">
              <th className="text-left py-3 px-4 font-medium">実施日</th>
              <th className="text-left py-3 px-3 font-medium">お客様名</th>
              <th className="text-left py-3 px-3 font-medium">工事名</th>
              <th className="text-center py-3 px-3 font-medium">出動人数</th>
              <th className="text-left py-3 px-3 font-medium">警備員</th>
              <th className="text-center py-3 px-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700 font-mono text-xs">{fmtDate(r.reportDate)}</td>
                <td className="py-3 px-3 font-medium text-gray-900">{r.clientName}</td>
                <td className="py-3 px-3 text-gray-600 text-xs">{r.constructionName}</td>
                <td className="py-3 px-3 text-center text-gray-700">{r.headcount !== "" ? `${r.headcount}名` : "—"}</td>
                <td className="py-3 px-3 text-gray-600 text-xs max-w-[180px] truncate">{r.guardNames || "—"}</td>
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setPrinting(r)} className="text-xs text-blue-600 hover:underline">
                      印刷
                    </button>
                    <button onClick={() => handleEdit(r)} className="text-xs text-brand-500 hover:underline">
                      編集
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                  日報がありません。「新規作成」から追加してください。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 印刷プレビュー */}
      {printing && (
        <DailyReportPrint report={printing} onClose={() => setPrinting(null)} />
      )}
    </div>
  );
}
