"use client";

import { useState, useEffect } from "react";
import type { Guard } from "./guard-types";
import { EMPTY_GUARD } from "./guard-types";
import GuardModalBasic from "./guard-modal-basic";
import GuardModalPay from "./guard-modal-pay";
import GuardModalBank from "./guard-modal-bank";

type Tab = "basic" | "pay" | "bank";

type Props = {
  guard: Guard | null; // null = 新規
  onSave: (guard: Guard) => void;
  onClose: () => void;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "basic", label: "基本情報" },
  { id: "pay", label: "資格・給与" },
  { id: "bank", label: "銀行口座" },
];

export default function GuardModal({ guard, onSave, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("basic");
  const [form, setForm] = useState<Omit<Guard, "id">>(EMPTY_GUARD);

  useEffect(() => {
    setForm(guard ? { ...guard } : EMPTY_GUARD);
    setTab("basic");
  }, [guard]);

  const set = <K extends keyof Omit<Guard, "id">>(
    field: K,
    value: Omit<Guard, "id">[K]
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, id: guard?.id ?? crypto.randomUUID() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[92vh]">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h3 className="text-base font-semibold">
            {guard ? `${guard.name} を編集` : "隊員を新規登録"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b shrink-0 px-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* フォーム本体 */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {tab === "basic" && <GuardModalBasic form={form} set={set} />}
            {tab === "pay" && <GuardModalPay form={form} set={set} />}
            {tab === "bank" && <GuardModalBank form={form} set={set} />}
          </div>

          {/* フッター */}
          <div className="flex items-center justify-between px-6 py-4 border-t shrink-0 bg-gray-50 rounded-b-xl">
            <div className="flex gap-1">
              {TABS.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    tab === t.id ? "bg-brand-500" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`${i + 1}ページ目: ${t.label}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              {tab !== "bank" ? (
                <button
                  type="button"
                  onClick={() => {
                    const idx = TABS.findIndex((t) => t.id === tab);
                    setTab(TABS[idx + 1].id);
                  }}
                  className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                >
                  次へ →
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                >
                  保存する
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
