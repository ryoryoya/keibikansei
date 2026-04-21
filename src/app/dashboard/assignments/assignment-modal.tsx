"use client";

import { useState } from "react";
import { upsertAssignment, cancelAssignment } from "@/app/actions/assignments";

type Guard = { id: string; name: string };

type Props = {
  projectId:      string;
  projectName:    string;
  startTime:      string;
  endTime:        string;
  requiredGuards: number;
  dateKey:        string;        // "YYYY-MM-DD"
  dateLabel:      string;        // "4月10日（木）"
  assignedGuards: { assignmentId: string; guard: Guard }[];
  allGuards:      Guard[];
  shiftMap:       Record<string, string>; // guardId → availability for this date
  onClose:        () => void;
  onChanged:      () => void;
};

const SHIFT_BADGE: Record<string, string> = {
  BOTH_OK:  "bg-green-100 text-green-700",
  DAY_OK:   "bg-blue-100 text-blue-700",
  NIGHT_OK: "bg-indigo-100 text-indigo-700",
  NG:       "bg-red-100 text-red-600",
  UNDECIDED:"bg-gray-100 text-gray-500",
};
const SHIFT_LABEL: Record<string, string> = {
  BOTH_OK: "◎両方", DAY_OK: "日OK", NIGHT_OK: "夜OK", NG: "NG", UNDECIDED: "未定",
};

export default function AssignmentModal({
  projectId, projectName, startTime, endTime, requiredGuards,
  dateKey, dateLabel, assignedGuards, allGuards, shiftMap, onClose, onChanged,
}: Props) {
  const [saving, setSaving] = useState<string | null>(null);

  const assignedIds = new Set(assignedGuards.map((a) => a.guard.id));

  // 未配置の隊員をシフト希望順に並べる
  const unassigned = allGuards
    .filter((g) => !assignedIds.has(g.id))
    .sort((a, b) => {
      const order: Record<string, number> = { BOTH_OK: 0, DAY_OK: 1, NIGHT_OK: 2, UNDECIDED: 3, NG: 4 };
      return (order[shiftMap[a.id]] ?? 3) - (order[shiftMap[b.id]] ?? 3);
    });

  const handleAdd = async (guard: Guard) => {
    setSaving(guard.id);
    try {
      await upsertAssignment({
        projectId,
        userId:      guard.id,
        workDate:    dateKey,
        plannedStart: startTime,
        plannedEnd:   endTime,
        status: "CONFIRMED",
      });
      onChanged();
    } catch (e) {
      console.error("配置追加エラー:", e);
    } finally {
      setSaving(null);
    }
  };

  const handleRemove = async (assignmentId: string, guardId: string) => {
    setSaving(guardId);
    try {
      await cancelAssignment(assignmentId);
      onChanged();
    } catch (e) {
      console.error("配置削除エラー:", e);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
        {/* ヘッダー */}
        <div className="px-5 py-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500">{dateLabel}</p>
              <h3 className="font-bold text-gray-900 mt-0.5">{projectName}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{startTime}〜{endTime}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
          {/* 充足状況バー */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">配置:</span>
            <span className={`text-sm font-bold ${assignedGuards.length >= requiredGuards ? "text-green-600" : "text-amber-600"}`}>
              {assignedGuards.length}
            </span>
            <span className="text-xs text-gray-400">/ {requiredGuards}名</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${assignedGuards.length >= requiredGuards ? "bg-green-500" : "bg-amber-400"}`}
                style={{ width: `${Math.min((assignedGuards.length / requiredGuards) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* 配置済み */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">配置済み ({assignedGuards.length}名)</p>
            {assignedGuards.length === 0 ? (
              <p className="text-xs text-gray-400 py-2 text-center">未配置</p>
            ) : (
              <div className="space-y-1.5">
                {assignedGuards.map(({ assignmentId, guard }) => (
                  <div key={guard.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 text-sm">✓</span>
                      <span className="text-sm font-medium text-gray-900">{guard.name}</span>
                      {shiftMap[guard.id] && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SHIFT_BADGE[shiftMap[guard.id]]}`}>
                          {SHIFT_LABEL[shiftMap[guard.id]]}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(assignmentId, guard.id)}
                      disabled={saving === guard.id}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                    >
                      {saving === guard.id ? "..." : "外す"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 追加できる隊員 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">追加できる隊員 ({unassigned.length}名)</p>
            {unassigned.length === 0 ? (
              <p className="text-xs text-gray-400 py-2 text-center">全員配置済み</p>
            ) : (
              <div className="space-y-1.5">
                {unassigned.map((guard) => {
                  const avail = shiftMap[guard.id];
                  const isNG  = avail === "NG";
                  return (
                    <div
                      key={guard.id}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 border ${isNG ? "bg-gray-50 border-gray-100" : "bg-white border-gray-200"}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{guard.name}</span>
                        {avail ? (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SHIFT_BADGE[avail]}`}>
                            {SHIFT_LABEL[avail]}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-300">提出なし</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAdd(guard)}
                        disabled={saving === guard.id || isNG}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                          isNG
                            ? "text-gray-300 cursor-not-allowed"
                            : saving === guard.id
                            ? "bg-gray-100 text-gray-400"
                            : "bg-brand-500 text-white hover:bg-brand-600"
                        }`}
                      >
                        {saving === guard.id ? "..." : isNG ? "NG" : "追加"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
