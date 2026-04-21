"use client";

import { useState, useMemo, useCallback } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ja } from "date-fns/locale";
import type { AssignmentMap } from "./assignment-types";
import {
  generateBaseCalendarDays,
  buildCalendarData,
  generateInitialAssignments,
} from "./calendar-demo-data";
import CalendarGrid from "./calendar-grid";
import { AssignmentPanel } from "./assignment-panel";

export function CalendarView({ orgId: _orgId }: { orgId: string }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // 配置state（全月分を一元管理）
  const [assignmentMap, setAssignmentMap] = useState<AssignmentMap>(() => {
    const now = new Date();
    return generateInitialAssignments(now.getFullYear(), now.getMonth() + 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  // 月のベースデータ（案件の稼働スケジュール）
  const baseDays = useMemo(() => generateBaseCalendarDays(year, month), [year, month]);

  // 配置stateを反映したカレンダーデータ
  const calendarData = useMemo(
    () => buildCalendarData(baseDays, assignmentMap),
    [baseDays, assignmentMap]
  );

  // カレンダーグリッド用の日付配列（月曜始まり）
  const calDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    });
  }, [currentMonth]);

  // 今月の不足案件数（サマリー表示用）
  const shortageCount = calendarData.filter((d) =>
    d.projects.some((p) => p.status === "shortage")
  ).length;

  const prevMonth = useCallback(() => setCurrentMonth((m) => subMonths(m, 1)), []);
  const nextMonth = useCallback(() => setCurrentMonth((m) => addMonths(m, 1)), []);
  const goToday = useCallback(() => {
    setCurrentMonth(new Date());
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    setSelectedProject(null);
  }, []);

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setSelectedProject(null);
  };

  const handleProjectClick = (date: string, projectId: string) => {
    setSelectedDate(date);
    setSelectedProject(projectId);
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-160px)]">
      {/* カレンダー本体 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-900">
              {format(currentMonth, "yyyy年 M月", { locale: ja })}
            </h3>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <ChevronIcon dir="left" />
              </button>
              <button onClick={goToday} className="px-3 py-1 text-xs font-medium rounded-lg border hover:bg-gray-50 text-gray-600">
                今日
              </button>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <ChevronIcon dir="right" />
              </button>
            </div>
          </div>

          {/* サマリー + 凡例 */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {shortageCount > 0 && (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                人員不足: {shortageCount}日
              </span>
            )}
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />充足</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />不足</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-300" />未配置</span>
          </div>
        </div>

        {/* グリッド */}
        <div className="flex-1 bg-white rounded-xl border overflow-hidden flex flex-col">
          <CalendarGrid
            calDays={calDays}
            calendarData={calendarData}
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            selectedProject={selectedProject}
            onDayClick={handleDayClick}
            onProjectClick={handleProjectClick}
          />
        </div>
      </div>

      {/* 右パネル */}
      <AssignmentPanel
        selectedDate={selectedDate}
        selectedProject={selectedProject}
        calendarData={calendarData}
        assignmentMap={assignmentMap}
        onProjectSelect={setSelectedProject}
        onAssignmentChange={setAssignmentMap}
      />
    </div>
  );
}

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {dir === "left" ? <path d="M10 4L6 8L10 12" /> : <path d="M6 4L10 8L6 12" />}
    </svg>
  );
}
