"use client";

import { useState, useEffect } from "react";

export type Site = {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  guardType: "TYPE_1" | "TYPE_2" | "TYPE_3" | "TYPE_4";
  notes: string;
  isActive: boolean;
};

export type ClientOption = { id: string; name: string };

type Props = {
  site: Site | null;
  clients: ClientOption[];
  onSave: (site: Site) => void;
  onClose: () => void;
};

const GUARD_TYPE_LABELS = {
  TYPE_1: "1号警備（施設警備）",
  TYPE_2: "2号警備（交通誘導）",
  TYPE_3: "3号警備（輸送警備）",
  TYPE_4: "4号警備（身辺警備）",
};

const empty = (clientId = "", clientName = ""): Omit<Site, "id"> => ({
  clientId,
  clientName,
  name: "",
  address: "",
  latitude: null,
  longitude: null,
  guardType: "TYPE_2",
  notes: "",
  isActive: true,
});

export default function SiteModal({ site, clients, onSave, onClose }: Props) {
  const [form, setForm] = useState<Omit<Site, "id">>(empty());

  useEffect(() => {
    setForm(site ? { ...site } : empty());
  }, [site]);

  const set = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleClientChange = (clientId: string) => {
    const c = clients.find((c) => c.id === clientId);
    set("clientId", clientId);
    set("clientName", c?.name ?? "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, id: site?.id ?? crypto.randomUUID() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-base font-semibold">
            {site ? "現場を編集" : "現場を新規登録"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">得意先 *</label>
            <select required value={form.clientId} onChange={(e) => handleClientChange(e.target.value)} className="input w-full">
              <option value="">選択してください</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">現場名 *</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)}
              className="input w-full" placeholder="例）東京建設 新宿現場" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">住所</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)}
              className="input w-full" placeholder="東京都..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">警備種別 *</label>
            <select value={form.guardType} onChange={(e) => set("guardType", e.target.value as Site["guardType"])} className="input w-full">
              {Object.entries(GUARD_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">緯度（任意）</label>
              <input type="number" step="any" value={form.latitude ?? ""}
                onChange={(e) => set("latitude", e.target.value ? Number(e.target.value) : null)}
                className="input w-full" placeholder="35.6895" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">経度（任意）</label>
              <input type="number" step="any" value={form.longitude ?? ""}
                onChange={(e) => set("longitude", e.target.value ? Number(e.target.value) : null)}
                className="input w-full" placeholder="139.6917" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">備考</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
              className="input w-full resize-none" rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="siteActive" checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)} className="rounded" />
            <label htmlFor="siteActive" className="text-sm text-gray-700">有効（稼働中）</label>
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
