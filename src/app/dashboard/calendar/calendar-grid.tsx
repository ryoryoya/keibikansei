"use client";

import {
  format,
  isSameMonth,
  isToday,
  getDay,
} from "date-fns";
import type { CalendarDay } from "./assignment-types";

type Props = {
  calDays: Date[];
  calendarData: CalendarDay[];
  currentMonth: Date;
  selectedDate: string | null;
  selectedProject: string | null;
  onDayClick: (date: string) => void;
  onProjectClick: (date: string, projectId: string) => void;
};

const STATUS_COLORS = {
  sufficient: "bg-green-100 text-green-800 hover:bg-green-200",
  shortage: "bg-red-100 text-red-800 hover:bg-red-200",
  empty: "bg-gray-100 text-gray-600 hover:bg-gray-200",
};

export default function CalendarGrid({
  calDays,
  calendarData,
  currentMonth,
  selectedDate,
  selectedProject,
  onDayClick,
  onProjectClick,
}: Props) {
  const calMap = new Map(calendarData.map((d) => [d.date, d]));
  const WEEK_DAYS = ["月", "火", "水", "木", "金", "土", "日"];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b shrink-0">
        {WEEK_DAYS.map((d, i) => (
          <div
            key={d}
            className={`py-2 text-center text-xs font-medium ${
              i === 5 ? "text-blue-500" : i === 6 ? "text-red-500" : "text-gray-500"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* グリッド */}
      <div className="grid grid-cols-7 flex-1 border-l overflow-y-auto">
        {calDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayData = calMap.get(dateStr);
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = selectedDate === dateStr;
          const dow = getDay(day);
          const isSat = dow === 6;
          const isSun = dow === 0;
          const hasShortage = dayData?.projects.some((p) => p.status === "shortage");
          const totalAssigned = dayData?.projects.reduce((s, p) => s + p.assignedCount, 0) ?? 0;
          const totalRequired = dayData?.projects.reduce((s, p) => s + p.requiredGuards, 0) ?? 0;

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`
                border-r border-b min-h-[90px] p-1 cursor-pointer transition-colors
                ${!inMonth ? "bg-gray-50 opacity-40" : "hover:bg-blue-50/40"}
                ${selected ? "bg-blue-50 ring-2 ring-brand-500 ring-inset" : ""}
              `}
            >
              {/* 日付 + アラート */}
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className={`
                    text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                    ${today ? "bg-brand-500 text-white" : ""}
                    ${isSat && !today ? "text-blue-500" : ""}
                    ${isSun && !today ? "text-red-500" : ""}
                    ${!today && !isSat && !isSun ? "text-gray-700" : ""}
                  `}
                >
                  {format(day, "d")}
                </span>
                {inMonth && hasShortage && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" title="人員不足" />
                )}
              </div>

              {/* 人員サマリー（当月のみ） */}
              {inMonth && dayData && dayData.projects.length > 0 && (
                <p className="text-[9px] text-gray-400 mb-0.5 px-0.5">
                  {totalAssigned}/{totalRequired}名
                </p>
              )}

              {/* 案件バー */}
              {inMonth && dayData && (
                <div className="space-y-0.5">
                  {dayData.projects.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onProjectClick(dateStr, p.id);
                      }}
                      className={`
                        w-full text-left px-1.5 py-0.5 rounded text-[10px] leading-tight truncate transition-colors
                        ${STATUS_COLORS[p.status]}
                        ${selectedProject === p.id && selectedDate === dateStr ? "ring-1 ring-brand-500" : ""}
                      `}
                    >
                      {p.confirmedCount > 0 && (
                        <span className="text-[9px] mr-0.5">✓</span>
                      )}
                      <span className="font-medium">
                        {p.assignedCount}/{p.requiredGuards}
                      </span>{" "}
                      {p.name.replace(/^\[.*?\]\s*/, "")}
                    </button>
                  ))}
                  {dayData.projects.length > 3 && (
                    <p className="text-[10px] text-gray-400 px-1">
                      +{dayData.projects.length - 3}件
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
