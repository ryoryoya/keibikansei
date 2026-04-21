"use client";

import { useState, useRef, useEffect } from "react";
import type { ShiftVal } from "./shifts-types";
import { SHIFT_CONFIG, SHIFT_ORDER } from "./shifts-types";

type Props = {
  value: ShiftVal | null;
  submitted: boolean;
  isWeekend: boolean;
  onChange: (val: ShiftVal | null) => void;
};

export default function ShiftCell({ value, submitted, isWeekend, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const conf = value ? SHIFT_CONFIG[value] : null;

  // 外側クリックで閉じる
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center justify-center">
      <button
        onClick={() => setOpen((v) => !v)}
        title={conf?.label ?? (submitted ? "空欄" : "未提出")}
        className={`
          w-8 h-8 rounded text-[11px] font-bold transition-all hover:ring-2 hover:ring-brand-400
          ${conf ? conf.bg : submitted ? "bg-white text-gray-300 hover:bg-gray-50" : "bg-gray-50 text-gray-200"}
          ${isWeekend ? "opacity-90" : ""}
        `}
      >
        {conf ? conf.short : "—"}
      </button>

      {/* ポップオーバー */}
      {open && (
        <div className="absolute top-9 left-1/2 -translate-x-1/2 z-20 bg-white border rounded-lg shadow-lg p-1.5 flex flex-col gap-0.5 min-w-[80px]">
          {SHIFT_ORDER.map((v) => {
            const c = v ? SHIFT_CONFIG[v] : null;
            return (
              <button
                key={v ?? "null"}
                onClick={() => { onChange(v); setOpen(false); }}
                className={`
                  flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-gray-100 text-left
                  ${value === v ? "ring-1 ring-brand-400" : ""}
                `}
              >
                <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${c ? c.bg : "bg-white text-gray-300 border"}`}>
                  {c ? c.short : "—"}
                </span>
                <span className="text-gray-700">{c ? c.label : "空欄"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
