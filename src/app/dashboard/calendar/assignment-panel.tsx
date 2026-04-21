"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import type { AssignmentMap, CalendarDay } from "./assignment-types";
import {
  assignmentKey,
  getAssignments,
  getAssignedGuardIdsOnDate,
} from "./assignment-types";
import { DEMO_GUARDS } from "./calendar-demo-data";
import AssignmentGuardsList from "./assignment-guards-list";

type Props = {
  selectedDate: string | null;
  selectedProject: string | null;
  calendarData: CalendarDay[];
  assignmentMap: AssignmentMap;
  onProjectSelect: (id: string | null) => void;
  onAssignmentChange: (newMap: AssignmentMap) => void;
};

export function AssignmentPanel({
  selectedDate,
  selectedProject,
  calendarData,
  assignmentMap,
  onProjectSelect,
  onAssignmentChange,
}: Props) {
  const [notifyCount, setNotifyCount] = useState(0);

  if (!selectedDate) {
    return (
      <div className="w-80 bg-white rounded-xl border p-6 flex items-center justify-center shrink-0">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-sm">カレンダーの日付をクリックして</p>
          <p className="text-sm">配置管理を開始</p>
        </div>
      </div>
    );
  }

  const dayData = calendarData.find((d) => d.date === selectedDate);
  const formattedDate = format(parseISO(selectedDate), "M月d日（E）", { locale: ja });
  const selectedProjectData = dayData?.projects.find((p) => p.id === selectedProject);

  // 同日他案件配置済みの guardId
  const assignedOnDate = getAssignedGuardIdsOnDate(assignmentMap, selectedDate);

  const handleToggle = (guardId: string) => {
    if (!selectedProject) return;
    const key = assignmentKey(selectedDate, selectedProject);
    const current = getAssignments(assignmentMap, selectedDate, selectedProject);
    const exists = current.find((a) => a.guardId === guardId);
    const next = exists
      ? current.filter((a) => a.guardId !== guardId)
      : [...current, { guardId, status: "PENDING" as const }];
    onAssignmentChange({ ...assignmentMap, [key]: next });
    setNotifyCount(0);
  };

  const handleConfirmAll = () => {
    if (!selectedProject) return;
    const key = assignmentKey(selectedDate, selectedProject);
    const current = getAssignments(assignmentMap, selectedDate, selectedProject);
    const pending = current.filter((a) => a.status === "PENDING");
    if (pending.length === 0) return;
    const confirmed = current.map((a) => ({ ...a, status: "CONFIRMED" as const }));
    onAssignmentChange({ ...assignmentMap, [key]: confirmed });
    setNotifyCount(pending.length);
  };

  return (
    <div className="w-80 bg-white rounded-xl border flex flex-col shrink-0 overflow-hidden">
      {/* 日付ヘッダー */}
      <div className="p-4 border-b bg-gray-50 shrink-0">
        <h3 className="font-bold text-gray-900">{formattedDate}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{dayData?.projects.length ?? 0}件の案件</p>
      </div>

      {!selectedProject ? (
        // 案件一覧モード
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs text-gray-500 mb-2 font-medium">案件を選択して配置管理</p>
          {(!dayData || dayData.projects.length === 0) && (
            <p className="text-sm text-gray-400 text-center py-8">この日に案件はありません</p>
          )}
          <div className="space-y-2">
            {dayData?.projects.map((p) => {
              const assignments = getAssignments(assignmentMap, selectedDate, p.id);
              const confirmed = assignments.filter((a) => a.status === "CONFIRMED").length;
              return (
                <button
                  key={p.id}
                  onClick={() => onProjectSelect(p.id)}
                  className="w-full text-left p-3 rounded-lg border hover:border-brand-300 hover:bg-brand-50/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.clientName}</p>
                      <p className="text-xs text-gray-400">{p.startTime}〜{p.endTime}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className={`text-lg font-bold ${
                        p.status === "sufficient" ? "text-green-600"
                        : p.status === "shortage" ? "text-red-600"
                        : "text-gray-400"
                      }`}>
                        {p.assignedCount}/{p.requiredGuards}
                      </p>
                      {confirmed > 0 && (
                        <p className="text-[10px] text-green-600">✓{confirmed}名確定</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        // 配置管理モード
        <div className="flex-1 flex flex-col overflow-hidden">
          <AssignmentGuardsList
            guards={DEMO_GUARDS}
            assigned={getAssignments(assignmentMap, selectedDate, selectedProject)}
            assignedOnDate={assignedOnDate}
            onToggle={handleToggle}
            onConfirmAll={handleConfirmAll}
            onBack={() => { onProjectSelect(null); setNotifyCount(0); }}
            projectName={selectedProjectData?.name ?? ""}
            requiredGuards={selectedProjectData?.requiredGuards ?? 1}
            startTime={selectedProjectData?.startTime ?? ""}
            endTime={selectedProjectData?.endTime ?? ""}
            notifyCount={notifyCount}
          />
        </div>
      )}
    </div>
  );
}
