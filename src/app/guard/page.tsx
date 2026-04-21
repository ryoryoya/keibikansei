"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { TODAY_ASSIGNMENT, UPCOMING } from "./guard-demo-data";
import type { ClockState } from "./guard-demo-data";

const STEPS: { key: keyof ClockState; label: string; icon: string }[] = [
  { key: "wakeUpAt",    label: "起床",  icon: "🌅" },
  { key: "departureAt", label: "出発",  icon: "🚃" },
  { key: "clockIn",     label: "上番",  icon: "✅" },
  { key: "clockOut",    label: "下番",  icon: "🏁" },
];

export default function GuardHomePage() {
  const [clockState, setClockState] = useState<ClockState>(TODAY_ASSIGNMENT.clockState);
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const today = format(new Date(), "M月d日（E）", { locale: ja });

  const doneCount = STEPS.filter((s) => clockState[s.key]).length;

  const handleConfirm = (date: string) => {
    setConfirmed((prev) => ({ ...prev, [date]: true }));
  };

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* 日付 */}
      <p className="text-sm text-gray-500 font-medium">{today}</p>

      {/* 当日案件カード */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 text-xl shrink-0">🏢</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 leading-tight">{TODAY_ASSIGNMENT.projectName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{TODAY_ASSIGNMENT.clientName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <InfoBox label="勤務時間" value={`${TODAY_ASSIGNMENT.startTime} 〜 ${TODAY_ASSIGNMENT.endTime}`} />
          <InfoBox label="集合場所" value={TODAY_ASSIGNMENT.meetingPoint} />
        </div>

        <div className="bg-gray-50 rounded-xl p-3 text-sm">
          <p className="text-xs text-gray-500 mb-0.5">現場住所</p>
          <p className="font-medium text-gray-900">{TODAY_ASSIGNMENT.address}</p>
          <Link href="/guard/clock" className="mt-1.5 text-brand-500 text-xs font-medium hover:underline block">
            地図で確認する →
          </Link>
        </div>

        {TODAY_ASSIGNMENT.notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
            <p className="text-blue-800 font-semibold text-xs">📢 連絡事項</p>
            <p className="text-blue-700 mt-1 text-sm">{TODAY_ASSIGNMENT.notes}</p>
          </div>
        )}
      </div>

      {/* 打刻進捗 */}
      <div className="bg-white rounded-2xl border shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900">本日の打刻状況</h3>
          <span className="text-xs text-gray-400">{doneCount}/{STEPS.length} 完了</span>
        </div>

        <div className="flex items-center gap-1 mb-3">
          {STEPS.map((step, i) => {
            const done = !!clockState[step.key];
            const isNext = !done && STEPS.slice(0, i).every((s) => clockState[s.key]);
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex-1 flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all ${done ? "bg-green-500 text-white" : isNext ? "bg-brand-100 ring-2 ring-brand-400 text-brand-600" : "bg-gray-100 text-gray-400"}`}>
                    {done ? "✓" : step.icon}
                  </div>
                  <p className={`text-[10px] mt-1 font-medium ${done ? "text-green-600" : isNext ? "text-brand-600" : "text-gray-400"}`}>
                    {step.label}
                  </p>
                  <p className="text-[9px] text-gray-400 font-mono">{clockState[step.key] ?? "—"}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-3 shrink-0 ${done ? "bg-green-400" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        <Link
          href="/guard/clock"
          className="block w-full py-3 bg-brand-500 text-white text-center font-bold rounded-xl hover:bg-brand-600 transition-colors"
        >
          打刻画面へ →
        </Link>
      </div>

      {/* 今後の予定 */}
      <div className="bg-white rounded-2xl border shadow-sm p-4">
        <h3 className="font-bold text-gray-900 mb-3">今後の予定</h3>
        <div className="space-y-2">
          {UPCOMING.map((item) => {
            const isConfirmed = confirmed[item.date] || item.confirmed;
            return (
              <div key={item.date} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                <span className="text-xs text-gray-500 w-20 shrink-0">{item.dateLabel}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.projectName}</p>
                  <p className="text-xs text-gray-400">{item.time}</p>
                </div>
                {isConfirmed ? (
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full shrink-0">確認済</span>
                ) : (
                  <button
                    onClick={() => handleConfirm(item.date)}
                    className="text-[10px] bg-brand-500 text-white px-3 py-1 rounded-full hover:bg-brand-600 transition-colors shrink-0"
                  >
                    確認する
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900 text-sm mt-0.5">{value}</p>
    </div>
  );
}
