"use client";

import { useState, useEffect } from "react";

export type Client = {
  id: string;
  name: string;
  contactPerson: string;
  tel: string;
  email: string;
  address: string;
  billingCycleDay: number;
  paymentTermDays: number;
  taxType: "INCLUSIVE" | "EXCLUSIVE";
  notes: string;
  isActive: boolean;
};

type Props = {
  client: Client | null; // null = 新規
  onSave: (client: Client) => void;
  onClose: () => void;
};

const empty: Omit<Client, "id"> = {
  name: "",
  contactPerson: "",
  tel: "",
  email: "",
  address: "",
  billingCycleDay: 31,
  paymentTermDays: 30,
  taxType: "EXCLUSIVE",
  notes: "",
  isActive: true,
};

export default function ClientModal({ client, onSave, onClose }: Props) {
  const [form, setForm] = useState<Omit<Client, "id">>(empty);

  useEffect(() => {
    setForm(client ? { ...client } : empty);
  }, [client]);

  const set = (field: keyof typeof empty, value: string | number | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, id: client?.id ?? crypto.randomUUID() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-base font-semibold">
            {client ? "得意先を編集" : "得意先を新規登録"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <Field label="得意先名 *">
            <input required value={form.name} onChange={(e) => set("name", e.target.value)}
              className="input" placeholder="例）東京建設株式会社" />
          </Field>
          <Field label="担当者名">
            <input value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)}
              className="input" placeholder="例）山田 太郎" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="電話番号">
              <input value={form.tel} onChange={(e) => set("tel", e.target.value)}
                className="input" placeholder="03-0000-0000" />
            </Field>
            <Field label="メールアドレス">
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                className="input" placeholder="info@example.com" />
            </Field>
          </div>
          <Field label="住所">
            <input value={form.address} onChange={(e) => set("address", e.target.value)}
              className="input" placeholder="東京都..." />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="締め日">
              <select value={form.billingCycleDay} onChange={(e) => set("billingCycleDay", Number(e.target.value))} className="input">
                {[15, 20, 25, 31].map((d) => (
                  <option key={d} value={d}>{d === 31 ? "月末" : `${d}日`}</option>
                ))}
              </select>
            </Field>
            <Field label="支払サイト（日）">
              <input type="number" value={form.paymentTermDays} onChange={(e) => set("paymentTermDays", Number(e.target.value))}
                className="input" min={0} max={120} />
            </Field>
            <Field label="税区分">
              <select value={form.taxType} onChange={(e) => set("taxType", e.target.value as "INCLUSIVE" | "EXCLUSIVE")} className="input">
                <option value="EXCLUSIVE">外税</option>
                <option value="INCLUSIVE">内税</option>
              </select>
            </Field>
          </div>
          <Field label="備考">
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
              className="input resize-none" rows={2} />
          </Field>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)} className="rounded" />
            <label htmlFor="isActive" className="text-sm text-gray-700">有効（稼働中）</label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">
              キャンセル
            </button>
            <button type="submit"
              className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600">
              保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
