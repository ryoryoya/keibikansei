"use client";

import type { Guard } from "./guard-types";
import { PAY_TYPE_LABELS, QUALIFICATION_OPTIONS, SKILL_OPTIONS } from "./guard-types";

type Props = {
  form: Omit<Guard, "id">;
  set: <K extends keyof Omit<Guard, "id">>(field: K, value: Omit<Guard, "id">[K]) => void;
};

export default function GuardModalPay({ form, set }: Props) {
  const toggleItem = (field: "qualifications" | "skills", item: string) => {
    const current = form[field];
    set(
      field,
      current.includes(item) ? current.filter((v) => v !== item) : [...current, item]
    );
  };

  return (
    <div className="space-y-5">
      {/* 給与設定 */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">給与設定</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">給与形態</label>
            <select
              value={form.payType}
              onChange={(e) => set("payType", e.target.value as Guard["payType"])}
              className="input"
            >
              {(Object.keys(PAY_TYPE_LABELS) as Guard["payType"][]).map((k) => (
                <option key={k} value={k}>{PAY_TYPE_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              基本給（円 /
              {form.payType === "DAILY" ? "日" : form.payType === "MONTHLY" ? "月" : "時間"}）
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={form.basePay}
              onChange={(e) => set("basePay", Number(e.target.value))}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* 資格 */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">保有資格</p>
        <div className="grid grid-cols-1 gap-1.5">
          {QUALIFICATION_OPTIONS.map((q) => (
            <label key={q} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
              <input
                type="checkbox"
                checked={form.qualifications.includes(q)}
                onChange={() => toggleItem("qualifications", q)}
                className="rounded shrink-0"
              />
              {q}
            </label>
          ))}
        </div>
      </div>

      {/* スキル */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">スキル・タグ</p>
        <div className="flex flex-wrap gap-2">
          {SKILL_OPTIONS.map((s) => {
            const checked = form.skills.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleItem("skills", s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  checked
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-purple-400"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
