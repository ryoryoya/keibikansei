"use client";

import { useState, useMemo } from "react";
import { format, addMonths, subMonths, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import { getMyShiftsForMonth, bulkUpsertShifts } from "@/app/actions/shifts";
import type { ShiftVal } from "@/app/dashboard/shifts/shifts-types";

const SHIFT_OPTIONS: { val: ShiftVal | null; label: string; short: string; bg: string }[] = [
  { val: null,       label: "未入力",  short: "—", bg: "bg-white text-gray-300 border border-gray-200" },
  { val: "BOTH_OK",  label: "両方OK",  short: "◎", bg: "bg-green-100 text-green-700" },
  { val: "DAY_OK",   label: "日勤OK",  short: "日", bg: "bg-blue-100 text-blue-700" },
  { val: "NIGHT_OK", label: "夜勤OK",  short: "夜", bg: "bg-indigo-100 text-indigo-700" },
  { val: "NG",       label: "勤務NG",  short: "✕", bg: "bg-red-100 text-red-700" },
];

function nextVal(cur: ShiftVal | null): ShiftVal | null {
  const idx = SHIFT_OPTIONS.findIndex((o) => o.val === cur);
  return SHIFT_OPTIONS[(idx + 1) % SHIFT_OPTIONS.length].val;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function ScheduleClient({
  initialShifts,
  initialYear,
  initialMonth,
}: {
  initialShifts: Record<string, ShiftVal | null>;
  initialYear:   number;
  initialMonth:  number;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date(initialYear, initialMonth - 1, 1));
  const [shifts, setShifts]     = useState<Record<string, ShiftVal | null>>(initialShifts);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(false);

  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed

  const dateKeys = useMemo(() => {
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const d = i + 1;
      return {
        key: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        d,
        dow: getDay(new Date(year, month, d)),
      };
    });
  }, [year, month]);

  const firstDow    = dateKeys[0].dow;
  const filledCount = dateKeys.filter((dk) => shifts[dk.key] != null).length;

  // 月変更: DBから再取得
  const changeMonth = async (delta: 1 | -1) => {
    const next = delta === 1 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1);
    setCurrentMonth(next);
    setSubmitted(false);
    setLoading(true);
    try {
      const data = await getMyShiftsForMonth(next.getFullYear(), next.getMonth() + 1);
      setShifts(data);
    } catch {
      setShifts({});
    } finally {
      setLoading(false);
    }
  };

  const handleTap = (key: string) => {
    if (submitted) return;
    setShifts((prev) => ({ ...prev, [key]: nextVal(prev[key] ?? null) }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    const entries = dateKeys
      .filter((dk) => shifts[dk.key] != null)
      .map((dk) => ({
        targetDate:   dk.key,
        availability: shifts[dk.key] as "DAY_OK" | "NIGHT_OK" | "BOTH_OK" | "NG" | "UNDECIDED",
      }));
    try {
      await bulkUpsertShifts(entries);
      setSubmitted(true);
    } catch (e) {
      console.error("シフト提出エラー:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">シフト希望提出</h2>
          <p className="text-xs text-gray-500 mt-0.5">タップして希望を入力してください</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 4L6 8L10 12" /></svg>
          </button>
          <span className="text-sm font-bold text-gray-900 min-w-[80px] text-center">
            {format(currentMonth, "yyyy年M月", { locale: ja })}
            {loading && <span className="text-[10px] text-gray-400 ml-1">...</span>}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4L10 8L6 12" /></svg>
          </button>
        </div>
      </div>

      {/* 提出済みバナー */}
      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-green-700 font-medium">✓ シフトを提出しました</p>
          <button onClick={() => setSubmitted(false)} className="text-xs text-green-600 underline">修正する</button>
        </div>
      )}

      {/* 凡例 */}
      <div className="flex flex-wrap gap-2">
        {SHIFT_OPTIONS.map((o) => (
          <span key={o.val ?? "null"} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${o.bg}`}>
            <span className="font-bold">{o.short}</span> {o.label}
          </span>
        ))}
      </div>

      {/* カレンダー */}
      <div className="bg-white rounded-2xl border p-3">
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`text-center text-[11px] font-medium py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {dateKeys.map(({ key, d, dow }) => {
            const val = shifts[key] ?? null;
            const opt = SHIFT_OPTIONS.find((o) => o.val === val) ?? SHIFT_OPTIONS[0];
            return (
              <button
                key={key}
                onClick={() => handleTap(key)}
                disabled={submitted || loading}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 ${opt.bg} ${submitted ? "cursor-default" : "cursor-pointer"}`}
              >
                <span className={`text-[10px] font-medium ${dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : ""} ${val ? "" : "text-gray-400"}`}>
                  {d}
                </span>
                <span className="text-[11px] font-bold leading-none">{opt.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 入力状況 */}
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-sm text-gray-600">
          <span className="font-bold text-gray-900">{filledCount}</span> / {dateKeys.length}日 入力済み
        </p>
      </div>

      {/* 提出ボタン */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={saving || filledCount === 0}
          className={`w-full py-4 font-bold rounded-2xl transition-colors shadow-sm ${
            saving || filledCount === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-brand-500 text-white hover:bg-brand-600"
          }`}
        >
          {saving ? "提出中..." : "シフトを提出する"}
        </button>
      )}
    </div>
  );
}
