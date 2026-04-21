"use client";

import { getDay, isToday, parseISO } from "date-fns";
import type { GuardShift, ShiftVal } from "./shifts-types";
import { calcDaySummary, REQUIRED_DAY, REQUIRED_NIGHT } from "./shifts-types";
import ShiftCell from "./shift-cell";

type Props = {
  dateKeys: string[]; // "YYYY-MM-DD" の配列
  guards: GuardShift[];
  onCellChange: (guardId: string, dateKey: string, val: ShiftVal | null) => void;
};

function DateHeader({ dateKey }: { dateKey: string }) {
  const day = parseISO(dateKey);
  const dow = getDay(day);
  const isSat = dow === 6;
  const isSun = dow === 0;
  const today = isToday(day);
  return (
    <th className={`text-center py-2 px-0.5 font-medium min-w-[36px] ${isSun ? "text-red-500 bg-red-50/50" : isSat ? "text-blue-500 bg-blue-50/50" : "text-gray-500"}`}>
      <div className={`text-[9px] mb-0.5 ${today ? "text-brand-600 font-bold" : ""}`}>
        {dateKey.slice(5).replace("-", "/")}
      </div>
      <div className={`text-[10px] w-6 h-6 mx-auto flex items-center justify-center rounded-full ${today ? "bg-brand-500 text-white" : ""}`}>
        {["日","月","火","水","木","金","土"][dow]}
      </div>
    </th>
  );
}

function SummaryCell({ count, required, isWeekend }: { count: number; required: number; isWeekend: boolean }) {
  const ok = count >= required;
  return (
    <td className={`text-center py-1 px-0.5 text-xs font-bold ${isWeekend ? "bg-gray-50/50" : ""} ${ok ? "text-green-600" : "text-red-600"}`}>
      {count}
    </td>
  );
}

export default function ShiftsGrid({ dateKeys, guards, onCellChange }: Props) {
  return (
    <div className="bg-white rounded-xl border overflow-x-auto">
      <table className="text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-3 font-medium text-gray-500 sticky left-0 bg-white z-10 min-w-[110px]">
              隊員名
            </th>
            {dateKeys.map((dk) => <DateHeader key={dk} dateKey={dk} />)}
          </tr>
        </thead>
        <tbody className="divide-y">
          {guards.map((guard) => (
            <tr key={guard.id} className={`hover:bg-gray-50 ${!guard.submitted ? "bg-amber-50/30" : ""}`}>
              <td className="py-1.5 px-3 sticky left-0 z-10 bg-inherit">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${guard.submitted ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"}`}>
                    {guard.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">{guard.name}</p>
                    {!guard.submitted && (
                      <p className="text-[9px] text-amber-600">未提出</p>
                    )}
                  </div>
                </div>
              </td>
              {dateKeys.map((dk) => {
                const dow = getDay(parseISO(dk));
                const isWeekend = dow === 0 || dow === 6;
                return (
                  <td key={dk} className={`py-1 px-0.5 ${isWeekend ? (dow === 0 ? "bg-red-50/20" : "bg-blue-50/20") : ""}`}>
                    <ShiftCell
                      value={guard.shifts[dk] ?? null}
                      submitted={guard.submitted}
                      isWeekend={isWeekend}
                      onChange={(v) => onCellChange(guard.id, dk, v)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>

        {/* 集計フッター */}
        <tfoot className="border-t-2 border-gray-200">
          <tr className="bg-blue-50/50">
            <td className="py-1.5 px-3 sticky left-0 bg-blue-50/50 z-10">
              <p className="text-[10px] font-semibold text-blue-700">日勤可</p>
              <p className="text-[9px] text-blue-500">（必要: {REQUIRED_DAY}名）</p>
            </td>
            {dateKeys.map((dk) => {
              const { dayOk } = calcDaySummary(guards, dk);
              const dow = getDay(parseISO(dk));
              return <SummaryCell key={dk} count={dayOk} required={REQUIRED_DAY} isWeekend={dow === 0 || dow === 6} />;
            })}
          </tr>
          <tr className="bg-indigo-50/50">
            <td className="py-1.5 px-3 sticky left-0 bg-indigo-50/50 z-10">
              <p className="text-[10px] font-semibold text-indigo-700">夜勤可</p>
              <p className="text-[9px] text-indigo-500">（必要: {REQUIRED_NIGHT}名）</p>
            </td>
            {dateKeys.map((dk) => {
              const { nightOk } = calcDaySummary(guards, dk);
              const dow = getDay(parseISO(dk));
              return <SummaryCell key={dk} count={nightOk} required={REQUIRED_NIGHT} isWeekend={dow === 0 || dow === 6} />;
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
