"use client";

import { useState, useMemo, useEffect } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import type { GuardShift, ShiftVal } from "./shifts-types";
import { generateGuardShifts, SHIFT_CONFIG } from "./shifts-types";
import ShiftsGrid from "./shifts-grid";
import { getShiftsForMonth, managerSetShift } from "@/app/actions/shifts";

export default function ShiftsView({ dbGuards = [] }: { dbGuards?: GuardShift[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  const initial = dbGuards.length > 0 ? dbGuards : generateGuardShifts(year, month);
  const [guards, setGuards] = useState<GuardShift[]>(initial);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "submitted" | "pending">("all");
  const [search, setSearch] = useState("");
  const [remindToast, setRemindToast] = useState("");

  // router.refresh() 後にサーバーデータと同期
  useEffect(() => {
    if (dbGuards.length > 0) setGuards(dbGuards);
  }, [dbGuards]);

  // 月変更時にDBから再取得
  const changeMonth = async (delta: 1 | -1) => {
    const next = delta === 1 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1);
    setCurrentMonth(next);
    const y = next.getFullYear();
    const m = next.getMonth() + 1;

    setLoading(true);
    try {
      const data = await getShiftsForMonth(y, m);
      setGuards(data.length > 0 ? data : generateGuardShifts(y, m));
    } catch {
      setGuards(generateGuardShifts(y, m));
    } finally {
      setLoading(false);
    }
  };

  const dateKeys = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    });
  }, [year, month]);

  const filtered = guards.filter((g) => {
    const matchSearch = !search || g.name.includes(search);
    const matchStatus =
      filterStatus === "all"       ? true :
      filterStatus === "submitted" ? g.submitted : !g.submitted;
    return matchSearch && matchStatus;
  });

  const submittedCount = guards.filter((g) => g.submitted).length;
  const pendingGuards  = guards.filter((g) => !g.submitted);

  // セル変更: ローカルstateを更新 + DBに保存
  const handleCellChange = async (guardId: string, dateKey: string, val: ShiftVal | null) => {
    setGuards((prev) =>
      prev.map((g) =>
        g.id === guardId
          ? { ...g, submitted: true, shifts: { ...g.shifts, [dateKey]: val } }
          : g
      )
    );
    try {
      await managerSetShift({
        guardId,
        targetDate:   dateKey,
        availability: val as "DAY_OK" | "NIGHT_OK" | "BOTH_OK" | "NG" | "UNDECIDED" | null,
      });
    } catch (e) {
      console.error("シフト保存エラー:", e);
    }
  };

  const handleRemind = () => {
    if (pendingGuards.length === 0) return;
    setRemindToast(`${pendingGuards.map((g) => g.name.split(" ")[0]).join("・")}さんに催促を送信しました`);
    setTimeout(() => setRemindToast(""), 5000);
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">シフト管理</h2>
          <p className="text-sm text-gray-500 mt-1">隊員のシフト希望を月単位で管理・編集できます</p>
        </div>
        <div className="hidden lg:flex items-center gap-3 text-xs text-gray-500">
          {Object.entries(SHIFT_CONFIG).map(([k, c]) => (
            <span key={k} className="flex items-center gap-1">
              <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${c.bg}`}>{c.short}</span>
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* 月ナビ + 提出状況 */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 4L6 8L10 12" /></svg>
          </button>
          <span className="text-base font-bold text-gray-900 min-w-[100px] text-center">
            {format(currentMonth, "yyyy年 M月", { locale: ja })}
            {loading && <span className="text-xs text-gray-400 ml-1">読込中...</span>}
          </span>
          <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4L10 8L6 12" /></svg>
          </button>
        </div>

        <div className="h-6 w-px bg-gray-200 hidden sm:block" />

        <div className="flex items-center gap-3 flex-1">
          <div>
            <span className="text-sm font-bold text-gray-900">{submittedCount}</span>
            <span className="text-sm text-gray-400"> / {guards.length}名提出済み</span>
          </div>
          <div className="flex-1 max-w-[200px] h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: guards.length ? `${(submittedCount / guards.length) * 100}%` : "0%" }}
            />
          </div>
          {pendingGuards.length > 0 && (
            <button
              onClick={handleRemind}
              className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shrink-0"
            >
              未提出{pendingGuards.length}名にリマインド
            </button>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="氏名で検索..."
            className="px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 w-32"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            <option value="all">全員</option>
            <option value="submitted">提出済み</option>
            <option value="pending">未提出</option>
          </select>
        </div>
      </div>

      {remindToast && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl">
          ✓ {remindToast}
        </div>
      )}

      {pendingGuards.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <span className="text-sm font-medium text-amber-700">未提出:</span>
          <div className="flex flex-wrap gap-1.5">
            {pendingGuards.map((g) => (
              <span key={g.id} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {g.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <ShiftsGrid
        dateKeys={dateKeys}
        guards={filtered}
        onCellChange={handleCellChange}
      />

      <p className="text-xs text-gray-400 text-center">
        ※ セルをクリックすると管制側から値を修正できます（隊員の提出値を上書き）
      </p>
    </div>
  );
}
