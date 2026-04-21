"use client";

import { useState, useEffect } from "react";
import type { DailyGuard } from "./daily-types";
import { nowStr } from "./daily-types";

type StampField = "wakeUpAt" | "departureAt" | "clockIn" | "clockOut";

type Props = {
  guard: DailyGuard;
  projectName: string;
  onSave: (guardId: string, field: StampField, value: string | null) => void;
  onClose: () => void;
};

const STAMP_FIELDS: { key: StampField; label: string; desc: string }[] = [
  { key: "wakeUpAt",    label: "起床確認",   desc: "隊員が起床したことを確認した時刻" },
  { key: "departureAt", label: "出発確認",   desc: "現場へ向けて出発した時刻" },
  { key: "clockIn",     label: "上番",       desc: "現場到着・勤務開始時刻" },
  { key: "clockOut",    label: "下番",       desc: "勤務終了・現場離脱時刻" },
];

export default function StampModal({ guard, projectName, onSave, onClose }: Props) {
  const [values, setValues] = useState<Record<StampField, string>>({
    wakeUpAt:    guard.wakeUpAt    ?? "",
    departureAt: guard.departureAt ?? "",
    clockIn:     guard.clockIn     ?? "",
    clockOut:    guard.clockOut    ?? "",
  });
  const [activeField, setActiveField] = useState<StampField | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const fillNow = (field: StampField) => {
    setValues((prev) => ({ ...prev, [field]: nowStr() }));
    setActiveField(field);
  };

  const clearField = (field: StampField) => {
    setValues((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSave = () => {
    if (activeField) {
      onSave(guard.id, activeField, values[activeField] || null);
    } else {
      // 変更されたフィールドすべてを保存
      for (const { key } of STAMP_FIELDS) {
        const original = (guard[key] ?? "");
        if (values[key] !== original) {
          onSave(guard.id, key, values[key] || null);
        }
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-base font-semibold">手動打刻 / 時刻修正</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {guard.name}｜{projectName}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* 計画時刻 */}
        <div className="mx-6 mt-4 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-600">
          計画: <span className="font-mono font-medium">{guard.plannedStart}〜{guard.plannedEnd}</span>
        </div>

        {/* 打刻フィールド */}
        <div className="px-6 py-4 space-y-3">
          {STAMP_FIELDS.map(({ key, label, desc }) => (
            <div key={key} className={`rounded-lg border p-3 transition-colors ${activeField === key ? "border-brand-400 bg-brand-50" : "border-gray-200"}`}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-sm font-medium text-gray-800">{label}</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fillNow(key)}
                    className="text-[10px] px-2 py-1 bg-brand-500 text-white rounded hover:bg-brand-600"
                  >
                    今の時刻
                  </button>
                  {values[key] && (
                    <button
                      type="button"
                      onClick={() => clearField(key)}
                      className="text-[10px] px-2 py-1 border rounded text-gray-500 hover:bg-gray-50"
                    >
                      消去
                    </button>
                  )}
                </div>
              </div>
              <input
                type="time"
                value={values[key]}
                onChange={(e) => { setValues((prev) => ({ ...prev, [key]: e.target.value })); setActiveField(key); }}
                className="w-full px-3 py-1.5 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
          ))}
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
            キャンセル
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600">
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
