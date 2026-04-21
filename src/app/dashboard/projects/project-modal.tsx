"use client";

import { useState, useEffect } from "react";

export type Project = {
  id: string;
  siteId: string;
  siteName: string;
  clientName: string;
  name: string;
  workStyle: "DAY_SHIFT" | "NIGHT_SHIFT" | "RESIDENT" | "DAY_NIGHT" | "EVENT" | "OTHER";
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  requiredGuards: number;
  unitPrice: number;
  guardPay: number;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  notes: string;
};

export type SiteOption = { id: string; name: string; clientName: string };

type Props = {
  project: Project | null;
  sites: SiteOption[];
  onSave: (p: Project) => void;
  onClose: () => void;
};

const WORK_STYLE_LABELS = {
  DAY_SHIFT: "日勤",
  NIGHT_SHIFT: "夜勤",
  RESIDENT: "常駐",
  DAY_NIGHT: "日夜勤",
  EVENT: "イベント",
  OTHER: "その他",
};

const STATUS_LABELS = {
  DRAFT: "下書き",
  ACTIVE: "稼働中",
  COMPLETED: "完了",
  CANCELLED: "中止",
};

const empty = (): Omit<Project, "id"> => ({
  siteId: "",
  siteName: "",
  clientName: "",
  name: "",
  workStyle: "DAY_SHIFT",
  startDate: "",
  endDate: "",
  startTime: "08:00",
  endTime: "17:00",
  requiredGuards: 1,
  unitPrice: 0,
  guardPay: 0,
  status: "DRAFT",
  notes: "",
});

export default function ProjectModal({ project, sites, onSave, onClose }: Props) {
  const [form, setForm] = useState<Omit<Project, "id">>(empty());

  useEffect(() => {
    setForm(project ? { ...project } : empty());
  }, [project]);

  const set = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSiteChange = (siteId: string) => {
    const s = sites.find((s) => s.id === siteId);
    set("siteId", siteId);
    set("siteName", s?.name ?? "");
    set("clientName", s?.clientName ?? "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, id: project?.id ?? crypto.randomUUID() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-base font-semibold">
            {project ? "案件を編集" : "案件を新規登録"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">現場 *</label>
            <select required value={form.siteId} onChange={(e) => handleSiteChange(e.target.value)} className="input w-full">
              <option value="">選択してください</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}（{s.clientName}）</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">案件名 *</label>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)}
              className="input w-full" placeholder="例）新宿区 道路工事 交通誘導" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">勤務形態</label>
              <select value={form.workStyle} onChange={(e) => set("workStyle", e.target.value as Project["workStyle"])} className="input w-full">
                {Object.entries(WORK_STYLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ステータス</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value as Project["status"])} className="input w-full">
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">開始日 *</label>
              <input required type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">終了日（空欄=継続）</label>
              <input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className="input w-full" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">開始時間</label>
              <input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">終了時間</label>
              <input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">必要人数</label>
              <input type="number" min={1} value={form.requiredGuards} onChange={(e) => set("requiredGuards", Number(e.target.value))} className="input w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">請求単価（円/人日）</label>
              <input type="number" min={0} step={100} value={form.unitPrice} onChange={(e) => set("unitPrice", Number(e.target.value))} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">隊員支払単価（円/人日）</label>
              <input type="number" min={0} step={100} value={form.guardPay} onChange={(e) => set("guardPay", Number(e.target.value))} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">備考</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
              className="input w-full resize-none" rows={2} />
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
