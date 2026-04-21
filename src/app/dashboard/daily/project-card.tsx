"use client";

import { useState } from "react";
import type { DailyGuard, DailyProject } from "./daily-types";
import { calcStatus, STATUS_CONFIG, timeToMin, nowMin } from "./daily-types";

type Props = {
  project: DailyProject;
  defaultOpen?: boolean;
  onStamp: (guard: DailyGuard, project: DailyProject) => void;
};

function TimeCell({ time, planned }: { time: string | null; planned?: string }) {
  if (!time) return <span className="text-gray-300 text-xs">—</span>;
  const isLate = planned && timeToMin(time) > timeToMin(planned) + 10;
  return (
    <span className={`text-xs font-mono font-medium ${isLate ? "text-amber-600" : "text-gray-900"}`}>
      {time}
      {isLate && <span className="text-[9px] ml-0.5">遅</span>}
    </span>
  );
}

function CheckCell({ value }: { value: string | null }) {
  return value ? (
    <svg className="w-4 h-4 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <span className="text-gray-200 text-xs mx-auto block text-center">—</span>
  );
}

export default function ProjectCard({ project, defaultOpen = false, onStamp }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const clockedIn = project.guards.filter((g) => g.clockIn).length;
  const alertGuards = project.guards.filter((g) => {
    const s = calcStatus(g);
    return s === "not_yet" || s === "late_in";
  });
  const isNightShift = timeToMin(project.startTime) >= timeToMin("17:00");
  const isActive = !isNightShift && nowMin() >= timeToMin(project.startTime) - 30;

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* アコーディオンヘッダー */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {isActive && alertGuards.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{project.name}</p>
            <p className="text-xs text-gray-500">
              {project.client}　{project.startTime}〜{project.endTime}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {alertGuards.length > 0 && isActive && (
            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              要対応 {alertGuards.length}名
            </span>
          )}
          <div className="text-right">
            <p className="text-sm font-bold">
              <span className="text-green-600">{clockedIn}</span>
              <span className="text-gray-400"> / </span>
              <span className="text-gray-700">{project.guards.length}名</span>
            </p>
            <p className="text-[10px] text-gray-400">上番済/配置</p>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 隊員テーブル */}
      {isOpen && (
        <div className="border-t overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="text-left py-2 px-4 font-medium">隊員名</th>
                <th className="text-center py-2 px-2 font-medium">起床</th>
                <th className="text-center py-2 px-2 font-medium">出発</th>
                <th className="text-center py-2 px-3 font-medium">上番</th>
                <th className="text-center py-2 px-3 font-medium">下番</th>
                <th className="text-center py-2 px-3 font-medium">ステータス</th>
                <th className="text-center py-2 px-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {project.guards.map((guard) => {
                const status = calcStatus(guard);
                const cfg = STATUS_CONFIG[status];
                const isAlert = status === "not_yet" || status === "late_in";

                return (
                  <tr key={guard.id} className={`hover:bg-gray-50 ${isAlert && isActive ? "bg-red-50/40" : ""}`}>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium ${
                          isAlert && isActive ? "bg-red-200 text-red-800" : "bg-brand-100 text-brand-700"
                        }`}>
                          {guard.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-xs">{guard.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            {guard.plannedStart}〜{guard.plannedEnd}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-2.5 px-2">
                      <CheckCell value={guard.wakeUpAt} />
                    </td>
                    <td className="text-center py-2.5 px-2">
                      <CheckCell value={guard.departureAt} />
                    </td>
                    <td className="text-center py-2.5 px-3">
                      <TimeCell time={guard.clockIn} planned={guard.plannedStart} />
                    </td>
                    <td className="text-center py-2.5 px-3">
                      <TimeCell time={guard.clockOut} />
                    </td>
                    <td className="text-center py-2.5 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bg}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="text-center py-2.5 px-3">
                      <button
                        onClick={() => onStamp(guard, project)}
                        className="text-[10px] px-2 py-0.5 text-brand-500 border border-brand-300 rounded hover:bg-brand-50 transition-colors"
                      >
                        打刻
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
