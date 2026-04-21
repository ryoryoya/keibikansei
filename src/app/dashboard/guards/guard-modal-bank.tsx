"use client";

import type { Guard } from "./guard-types";

type Props = {
  form: Omit<Guard, "id">;
  set: <K extends keyof Omit<Guard, "id">>(field: K, value: Omit<Guard, "id">[K]) => void;
};

export default function GuardModalBank({ form, set }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">給与振込先の口座情報を入力してください。</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">銀行名</label>
          <input
            value={form.bankName}
            onChange={(e) => set("bankName", e.target.value)}
            className="input"
            placeholder="〇〇銀行"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">支店名</label>
          <input
            value={form.bankBranch}
            onChange={(e) => set("bankBranch", e.target.value)}
            className="input"
            placeholder="〇〇支店"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">口座種別</label>
          <select
            value={form.bankAccountType}
            onChange={(e) => set("bankAccountType", e.target.value)}
            className="input"
          >
            <option value="普通">普通</option>
            <option value="当座">当座</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">口座番号</label>
          <input
            value={form.bankAccountNum}
            onChange={(e) => set("bankAccountNum", e.target.value)}
            className="input font-mono"
            placeholder="1234567"
            maxLength={10}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">口座名義（カタカナ）</label>
        <input
          value={form.bankAccountName}
          onChange={(e) => set("bankAccountName", e.target.value)}
          className="input"
          placeholder="タナカ イチロウ"
        />
      </div>

      {/* 入力状況プレビュー */}
      {(form.bankName || form.bankAccountNum) && (
        <div className="mt-2 bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-600 space-y-1">
          <p className="font-medium text-gray-700">入力確認</p>
          <p>{form.bankName} {form.bankBranch}</p>
          <p>{form.bankAccountType} {form.bankAccountNum}</p>
          <p>{form.bankAccountName}</p>
        </div>
      )}
    </div>
  );
}
