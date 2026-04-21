"use client";

import { useState } from "react";
import type { AssignedGuard, DemoGuard } from "./assignment-types";

type Props = {
  guards: DemoGuard[];
  assigned: AssignedGuard[];
  assignedOnDate: Set<string>; // 同日他案件で配置済みの guardId
  onToggle: (guardId: string) => void;
  onConfirmAll: () => void;
  onBack: () => void;
  projectName: string;
  requiredGuards: number;
  startTime: string;
  endTime: string;
  notifyCount: number; // 通知済み件数（確定後表示用）
};

const SHIFT_LABELS: Record<string, { bg: string; label: string }> = {
  DAY_OK:    { bg: "bg-blue-100 text-blue-700",   label: "日勤" },
  NIGHT_OK:  { bg: "bg-indigo-100 text-indigo-700", label: "夜勤" },
  BOTH_OK:   { bg: "bg-green-100 text-green-700", label: "両方" },
  NG:        { bg: "bg-red-100 text-red-600",     label: "NG" },
  UNDECIDED: { bg: "bg-gray-100 text-gray-500",   label: "未定" },
};

export default function AssignmentGuardsList({
  guards,
  assigned,
  assignedOnDate,
  onToggle,
  onConfirmAll,
  onBack,
  projectName,
  requiredGuards,
  startTime,
  endTime,
  notifyCount,
}: Props) {
  const [search, setSearch] = useState("");
  const [filterAvail, setFilterAvail] = useState(true);

  const assignedSet = new Set(assigned.map((a) => a.guardId));
  const confirmedSet = new Set(
    assigned.filter((a) => a.status === "CONFIRMED").map((a) => a.guardId)
  );
  const pendingCount = assigned.filter((a) => a.status === "PENDING").length;

  const filteredGuards = guards.filter((g) => {
    const matchSearch = !search || g.name.includes(search) || g.nameKana.includes(search);
    if (!matchSearch) return false;
    if (filterAvail) return g.shift !== "NG" || assignedSet.has(g.id);
    return true;
  });

  return (
    <>
      {/* 案件情報 */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-xs text-brand-500 hover:underline">
            ← 戻る
          </button>
          <StatusBadge count={assigned.length} required={requiredGuards} />
        </div>
        <p className="text-sm font-bold text-gray-900 mt-1 truncate">{projectName}</p>
        <p className="text-xs text-gray-500">{startTime}〜{endTime}　配置 {assigned.length}/{requiredGuards}名</p>
      </div>

      {/* 配置済み */}
      <div className="p-3 border-b">
        <p className="text-xs font-medium text-gray-500 mb-2">配置済み（{assigned.length}名）</p>
        {assigned.length === 0 ? (
          <p className="text-xs text-gray-400">まだ配置されていません</p>
        ) : (
          <div className="space-y-1">
            {guards.filter((g) => assignedSet.has(g.id)).map((g) => {
              const confirmed = confirmedSet.has(g.id);
              return (
                <div key={g.id} className="flex items-center justify-between py-1.5 px-2 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-[10px] font-medium text-green-800">
                      {g.name[0]}
                    </div>
                    <span className="text-xs font-medium text-gray-900">{g.name}</span>
                    {confirmed
                      ? <span className="text-[9px] bg-green-600 text-white px-1 rounded">確定</span>
                      : <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded">仮</span>
                    }
                  </div>
                  <button onClick={() => onToggle(g.id)} className="text-[10px] text-red-500 hover:underline">
                    解除
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 検索・フィルタ */}
      <div className="p-3 border-b space-y-2">
        <input
          type="text"
          placeholder="氏名・フリガナで検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={filterAvail} onChange={(e) => setFilterAvail(e.target.checked)} className="rounded" />
          配置可能な隊員のみ
        </label>
      </div>

      {/* 候補一覧 */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-xs font-medium text-gray-500 mb-2">候補隊員（{filteredGuards.length}名）</p>
        <div className="space-y-1">
          {filteredGuards.map((g) => {
            const isAssigned = assignedSet.has(g.id);
            const conflict = !isAssigned && assignedOnDate.has(g.id);
            return (
              <div key={g.id} className={`flex items-center justify-between py-2 px-2 rounded-lg ${isAssigned ? "bg-green-50" : "hover:bg-gray-50"}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 ${isAssigned ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                    {g.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-medium text-gray-900 truncate">{g.name}</p>
                      {conflict && <span className="text-[9px] text-orange-500" title="同日他案件配置済">⚠</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      <span className={`text-[9px] px-1 rounded ${SHIFT_LABELS[g.shift]?.bg ?? "bg-gray-100 text-gray-500"}`}>
                        {SHIFT_LABELS[g.shift]?.label ?? "未定"}
                      </span>
                      {g.skills.map((s) => (
                        <span key={s} className="text-[9px] bg-purple-100 text-purple-700 px-1 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onToggle(g.id)}
                  disabled={g.shift === "NG" && !isAssigned}
                  className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 ${
                    isAssigned ? "bg-green-500 text-white hover:bg-green-600"
                    : g.shift === "NG" ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-brand-500 text-white hover:bg-brand-600"
                  }`}
                >
                  {isAssigned ? "配置済" : "配置"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 確定・通知 */}
      <div className="p-3 border-t bg-gray-50 space-y-2">
        {notifyCount > 0 && (
          <p className="text-xs text-green-700 text-center bg-green-50 rounded-lg py-1">
            ✓ {notifyCount}名に通知を送信しました
          </p>
        )}
        <button
          onClick={onConfirmAll}
          disabled={pendingCount === 0}
          className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
            pendingCount > 0
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {pendingCount > 0
            ? `仮配置 ${pendingCount}名を確定して通知送信`
            : "確定済み（通知送信済み）"}
        </button>
      </div>
    </>
  );
}

function StatusBadge({ count, required }: { count: number; required: number }) {
  const status = count >= required ? "sufficient" : count > 0 ? "shortage" : "empty";
  const styles = { sufficient: "bg-green-100 text-green-700", shortage: "bg-red-100 text-red-700", empty: "bg-gray-100 text-gray-500" };
  const labels = { sufficient: "充足", shortage: "不足", empty: "未配置" };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
