"use client";

import type { Guard } from "./guard-types";
import { GENDER_LABELS } from "./guard-types";

type Props = {
  form: Omit<Guard, "id">;
  set: <K extends keyof Omit<Guard, "id">>(field: K, value: Omit<Guard, "id">[K]) => void;
};

export default function GuardModalBasic({ form, set }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">氏名 *</label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="input"
            placeholder="田中 一郎"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">フリガナ</label>
          <input
            value={form.nameKana}
            onChange={(e) => set("nameKana", e.target.value)}
            className="input"
            placeholder="タナカ イチロウ"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">性別</label>
          <select
            value={form.gender}
            onChange={(e) => set("gender", e.target.value as Guard["gender"])}
            className="input"
          >
            {(Object.keys(GENDER_LABELS) as Guard["gender"][]).map((k) => (
              <option key={k} value={k}>{GENDER_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">生年月日</label>
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => set("birthDate", e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">電話番号</label>
          <input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="input"
            placeholder="080-0000-0000"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">住所</label>
        <input
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          className="input"
          placeholder="東京都..."
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">緊急連絡先</label>
        <input
          value={form.emergencyContact}
          onChange={(e) => set("emergencyContact", e.target.value)}
          className="input"
          placeholder="氏名・続柄・電話番号"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">入社日</label>
          <input
            type="date"
            value={form.hireDate}
            onChange={(e) => set("hireDate", e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">警備経験年数</label>
          <input
            type="number"
            min={0}
            max={60}
            value={form.experienceYears}
            onChange={(e) => set("experienceYears", Number(e.target.value))}
            className="input"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.hasSmartphone}
            onChange={(e) => set("hasSmartphone", e.target.checked)}
            className="rounded"
          />
          スマートフォン所持
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="rounded"
          />
          稼働中（有効）
        </label>
      </div>
    </div>
  );
}
