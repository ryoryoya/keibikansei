"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format, addMonths, subMonths, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import type { AssignmentPageData } from "@/app/actions/assignments";
import { getAssignmentPageData } from "@/app/actions/assignments";
import AssignmentModal from "./assignment-modal";

const WEEKDAY_COLOR = ["text-red-500", "", "", "", "", "", "text-blue-500"];
const DOW_BG        = ["bg-red-50",    "", "", "", "", "", "bg-blue-50"];

type CellTarget = {
  projectId:   string;
  projectName: string;
  startTime:   string;
  endTime:     string;
  requiredGuards: number;
  dateKey:     string;
  dateLabel:   string;
};

export default function AssignmentsView({ initialData }: { initialData: AssignmentPageData }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [data, setData]     = useState<AssignmentPageData>(initialData);
  const [loading, setLoading] = useState(false);
  const [cellTarget, setCellTarget] = useState<CellTarget | null>(null);

  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  // router.refresh() 後の同期
  useEffect(() => { setData(initialData); }, [initialData]);

  const fetchData = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const d = await getAssignmentPageData(y, m);
      setData(d);
    } catch (e) {
      console.error("データ取得エラー:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const changeMonth = async (delta: 1 | -1) => {
    const next = delta === 1 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1);
    setCurrentMonth(next);
    await fetchData(next.getFullYear(), next.getMonth() + 1);
  };

  // 日付キー一覧
  const dateKeys = useMemo(() => {
    const days = new Date(year, month, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const d   = i + 1;
      const dow = getDay(new Date(year, month - 1, d));
      const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      return { key, d, dow };
    });
  }, [year, month]);

  // assignedMap[projectId][dateKey] = [{ assignmentId, guard }]
  const assignedMap = useMemo(() => {
    const map: Record<string, Record<string, { assignmentId: string; guard: { id: string; name: string } }[]>> = {};
    for (const a of data.assignments) {
      if (!map[a.projectId]) map[a.projectId] = {};
      if (!map[a.projectId][a.workDate]) map[a.projectId][a.workDate] = [];
      map[a.projectId][a.workDate].push({ assignmentId: a.id, guard: { id: a.userId, name: a.userName } });
    }
    return map;
  }, [data.assignments]);

  const handleCellClick = (proj: AssignmentPageData["projects"][0], dk: { key: string; d: number; dow: number }) => {
    const date = new Date(year, month - 1, dk.d);
    const dateLabel = format(date, "M月d日（E）", { locale: ja });
    setCellTarget({
      projectId: proj.id, projectName: proj.name,
      startTime: proj.startTime, endTime: proj.endTime,
      requiredGuards: proj.requiredGuards,
      dateKey: dk.key, dateLabel,
    });
  };

  // セル色: 充足=green, 不足=amber, 0=red, 対象外=gray
  const cellColor = (proj: AssignmentPageData["projects"][0], dateKey: string) => {
    const isActive = dateKey >= proj.startDate && (!proj.endDate || dateKey <= proj.endDate);
    if (!isActive) return "bg-gray-100 text-gray-300 cursor-default";
    const assigned = assignedMap[proj.id]?.[dateKey]?.length ?? 0;
    if (assigned === 0)               return "bg-red-50 text-red-400 hover:bg-red-100 cursor-pointer";
    if (assigned < proj.requiredGuards) return "bg-amber-50 text-amber-600 hover:bg-amber-100 cursor-pointer";
    return "bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer";
  };

  // モーダル用データ
  const modalAssigned = cellTarget
    ? (assignedMap[cellTarget.projectId]?.[cellTarget.dateKey] ?? [])
    : [];
  const modalShiftMap = cellTarget
    ? Object.fromEntries(data.guards.map((g) => [g.id, data.shiftMap[g.id]?.[cellTarget.dateKey] ?? ""]).filter(([, v]) => v))
    : {};

  // サマリー
  const totalAssignments = data.assignments.length;
  const fullyAssignedDays = useMemo(() => {
    let count = 0;
    for (const proj of data.projects) {
      for (const dk of dateKeys) {
        const isActive = dk.key >= proj.startDate && (!proj.endDate || dk.key <= proj.endDate);
        if (!isActive) continue;
        const assigned = assignedMap[proj.id]?.[dk.key]?.length ?? 0;
        if (assigned >= proj.requiredGuards) count++;
      }
    }
    return count;
  }, [data.projects, dateKeys, assignedMap]);

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">配置管理</h2>
          <p className="text-sm text-gray-500 mt-1">
            {data.projects.length}案件 / 総配置: {totalAssignments}件 / 充足: {fullyAssignedDays}コマ
          </p>
        </div>
        {/* 凡例 */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-green-100 rounded" /> 充足</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-amber-100 rounded" /> 不足</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-red-100 rounded" /> 未配置</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 bg-gray-100 rounded" /> 対象外</span>
        </div>
      </div>

      {/* 月ナビ */}
      <div className="bg-white rounded-xl border p-3 flex items-center gap-3">
        <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 4L6 8L10 12" /></svg>
        </button>
        <span className="text-base font-bold text-gray-900 min-w-[110px] text-center">
          {format(currentMonth, "yyyy年 M月", { locale: ja })}
          {loading && <span className="text-xs text-gray-400 ml-1">読込中...</span>}
        </span>
        <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4L10 8L6 12" /></svg>
        </button>
        <span className="text-xs text-gray-400 ml-2">※ セルをクリックして隊員を配置</span>
      </div>

      {/* グリッド */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="text-xs border-collapse min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              {/* 案件名列 */}
              <th className="text-left py-2 px-3 font-medium text-gray-500 sticky left-0 bg-gray-50 z-10 min-w-[160px] border-r">
                案件
              </th>
              {/* 日付列 */}
              {dateKeys.map(({ key, d, dow }) => (
                <th key={key} className={`text-center py-1.5 px-0.5 font-medium min-w-[32px] ${WEEKDAY_COLOR[dow]} ${DOW_BG[dow]}`}>
                  <div>{d}</div>
                  <div className="text-[9px]">{["日","月","火","水","木","金","土"][dow]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.projects.length === 0 ? (
              <tr>
                <td colSpan={dateKeys.length + 1} className="py-10 text-center text-gray-400">
                  稼働中の案件がありません
                </td>
              </tr>
            ) : (
              data.projects.map((proj) => (
                <tr key={proj.id} className="hover:bg-gray-50/50">
                  {/* 案件名 */}
                  <td className="py-2 px-3 sticky left-0 bg-white z-10 border-r">
                    <p className="font-medium text-gray-900 truncate max-w-[150px]">{proj.name}</p>
                    <p className="text-[10px] text-gray-400">{proj.startTime}〜{proj.endTime} / {proj.requiredGuards}名</p>
                  </td>
                  {/* 日付セル */}
                  {dateKeys.map((dk) => {
                    const isActive = dk.key >= proj.startDate && (!proj.endDate || dk.key <= proj.endDate);
                    const assigned = assignedMap[proj.id]?.[dk.key] ?? [];
                    return (
                      <td
                        key={dk.key}
                        onClick={() => isActive && handleCellClick(proj, dk)}
                        className={`text-center p-0.5`}
                      >
                        <div className={`rounded-lg py-1 mx-0.5 transition-colors ${cellColor(proj, dk.key)}`}>
                          {isActive ? (
                            <span className="font-bold text-[11px]">
                              {assigned.length > 0 ? assigned.length : "—"}
                            </span>
                          ) : (
                            <span className="text-[10px]">—</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* モーダル */}
      {cellTarget && (
        <AssignmentModal
          {...cellTarget}
          assignedGuards={modalAssigned}
          allGuards={data.guards}
          shiftMap={modalShiftMap}
          onClose={() => setCellTarget(null)}
          onChanged={() => fetchData(year, month)}
        />
      )}
    </div>
  );
}
