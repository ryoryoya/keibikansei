"use client";

import { useState, useMemo } from "react";
import { NenchoGuard, NenchoDeclarations, NenchoStatus, NENCHO_STATUS_CONFIG, DEMO_NENCHO_GUARDS, calculateNencho } from "./nencho-types";
import { NenchoGuardList } from "./nencho-guard-list";
import { NenchoForm } from "./nencho-form";
import { NenchoResultCard } from "./nencho-result-card";

const NOW = new Date();
const YEARS = [NOW.getFullYear() - 1, NOW.getFullYear()];

export function NenchoView() {
  const [year,      setYear]      = useState(NOW.getFullYear());
  const [guards,    setGuards]    = useState<NenchoGuard[]>(DEMO_NENCHO_GUARDS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedGuard = guards.find((g) => g.guardId === selectedId) ?? null;
  const result = useMemo(
    () => selectedGuard ? calculateNencho(selectedGuard) : null,
    [selectedGuard]
  );

  function handleSave(decl: NenchoDeclarations) {
    if (!selectedId) return;
    setGuards((prev) =>
      prev.map((g) =>
        g.guardId === selectedId
          ? { ...g, declarations: decl, status: g.status === "NOT_STARTED" ? "COLLECTING" : g.status }
          : g
      )
    );
  }

  function handleSetStatus(status: NenchoStatus) {
    if (!selectedId) return;
    setGuards((prev) =>
      prev.map((g) =>
        g.guardId === selectedId
          ? { ...g, status, submittedAt: status === "COMPLETED" ? new Date().toISOString() : g.submittedAt }
          : g
      )
    );
  }

  const completedCount = guards.filter((g) => g.status === "COMPLETED").length;

  return (
    <div className="min-h-full bg-gray-50 -m-6">
      {/* ページヘッダー */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">年末調整</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {year}年分 — {completedCount}/{guards.length}名完了
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {YEARS.map((y) => (
                <button key={y} onClick={() => setYear(y)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                    year === y ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-600 border-gray-300 hover:border-brand-300"
                  }`}>
                  {y}年分
                </button>
              ))}
            </div>
            <button
              onClick={() => alert("源泉徴収票一括出力（実装予定）")}
              className="px-4 py-2 text-sm font-medium text-brand-600 border border-brand-300 rounded-xl hover:bg-brand-50 transition-colors"
            >
              一括PDF出力
            </button>
          </div>
        </div>

        {/* 進捗バー */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(completedCount / guards.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">{completedCount}/{guards.length}名</span>
        </div>
      </div>

      <div className="px-6 py-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 左: 隊員一覧 */}
        <div>
          <NenchoGuardList guards={guards} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        {/* 右: 詳細 */}
        <div className="lg:col-span-2 space-y-4">
          {selectedGuard ? (
            <>
              {/* ステータス操作バー */}
              <div className="bg-white rounded-xl border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">ステータス</span>
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${NENCHO_STATUS_CONFIG[selectedGuard.status].bg}`}>
                    {NENCHO_STATUS_CONFIG[selectedGuard.status].label}
                  </span>
                </div>
                <div className="flex gap-2">
                  {selectedGuard.status !== "COMPLETED" && (
                    <button
                      onClick={() => handleSetStatus("COMPLETED")}
                      className="px-4 py-2 text-sm font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors"
                    >
                      完了にする
                    </button>
                  )}
                  {selectedGuard.status === "COMPLETED" && (
                    <button
                      onClick={() => handleSetStatus("CALCULATING")}
                      className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      修正する
                    </button>
                  )}
                  <button
                    onClick={() => alert("源泉徴収票PDF出力（実装予定）")}
                    className="px-4 py-2 text-sm font-medium text-brand-600 border border-brand-300 rounded-xl hover:bg-brand-50 transition-colors"
                  >
                    PDF出力
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* 申告フォーム */}
                <NenchoForm
                  declarations={selectedGuard.declarations}
                  readOnly={selectedGuard.status === "COMPLETED"}
                  onSave={handleSave}
                />
                {/* 計算結果 */}
                {result && <NenchoResultCard result={result} />}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border flex flex-col items-center justify-center py-20 text-gray-400 space-y-3">
              <span className="text-5xl">📝</span>
              <p className="text-sm">左のリストから隊員を選択してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
