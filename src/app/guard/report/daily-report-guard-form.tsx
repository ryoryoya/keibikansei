"use client";

import { useState } from "react";
import type { DailyReport, WorkLocation, GuardOption } from "@/app/dashboard/daily-report/daily-report-types";
import { DEMO_CLIENTS_FOR_REPORT, DEMO_GUARDS_FOR_REPORT, DEMO_COMPANY, newReport } from "@/app/dashboard/daily-report/daily-report-types";
import LocationInput from "@/components/LocationInput";

type Props = {
  guards?: GuardOption[];
  onSubmit: (r: DailyReport) => void;
  onBack: () => void;
};

export default function DailyReportGuardForm({ guards: guardsProp, onSubmit, onBack }: Props) {
  const guards = guardsProp && guardsProp.length > 0 ? guardsProp : DEMO_GUARDS_FOR_REPORT;
  const [form, setForm] = useState<DailyReport>(newReport());

  const set = <K extends keyof DailyReport>(key: K, val: DailyReport[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const setLocation = (i: number, key: keyof WorkLocation, val: string | number | "") => {
    const locs = form.locations.map((l, idx) => idx === i ? { ...l, [key]: val } : l);
    set("locations", locs);
  };

  const toggleGuard = (id: string) => {
    const ids = form.guardIds.includes(id)
      ? form.guardIds.filter((g) => g !== id)
      : [...form.guardIds, id];
    const names = guards
      .filter((g) => ids.includes(g.id))
      .map((g) => g.name)
      .join("　");
    setForm((prev) => ({ ...prev, guardIds: ids, guardNames: names }));
  };

  const handleClientChange = (clientId: string) => {
    const c = DEMO_CLIENTS_FOR_REPORT.find((c) => c.id === clientId);
    setForm((prev) => ({ ...prev, clientId, clientName: c?.name ?? "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, companyName: DEMO_COMPANY.name, itakuCd: DEMO_COMPANY.itakuCd });
  };

  const inputCls = "w-full px-3 py-3 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";
  const sectionCls = "bg-white rounded-2xl p-4 space-y-4 shadow-sm";

  return (
    <form onSubmit={handleSubmit} className="p-4 pb-8 space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-gray-400 text-lg">←</button>
        <div>
          <h2 className="text-lg font-bold text-gray-900">警備報告書（日報）</h2>
          <p className="text-xs text-gray-500">必要事項を入力してください</p>
        </div>
      </div>

      {/* 基本情報 */}
      <div className={sectionCls}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">基本情報</p>

        <div>
          <label className={labelCls}>お客様名 *</label>
          <select value={form.clientId} onChange={(e) => handleClientChange(e.target.value)} className={inputCls} required>
            <option value="">選択してください</option>
            {DEMO_CLIENTS_FOR_REPORT.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>実施日 *</label>
          <input type="date" value={form.reportDate} onChange={(e) => set("reportDate", e.target.value)} className={inputCls} required />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={labelCls}>開始</label>
            <input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>終了</label>
            <input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>休憩</label>
            <input type="text" placeholder="0:00" value={form.breakTime} onChange={(e) => set("breakTime", e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>車両台数</label>
            <input type="number" min={0} value={form.vehicles} onChange={(e) => set("vehicles", e.target.valueAsNumber || "")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>走行距離(km)</label>
            <input type="number" min={0} value={form.totalDistance} onChange={(e) => set("totalDistance", e.target.valueAsNumber || "")} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>元請CD *</label>
            <input type="text" value={form.motoukeCd} onChange={(e) => set("motoukeCd", e.target.value)} className={inputCls} required placeholder="例: 10100" />
          </div>
          <div>
            <label className={labelCls}>出動人数 *</label>
            <input type="number" min={1} value={form.headcount} onChange={(e) => set("headcount", e.target.valueAsNumber || "")} className={inputCls} required />
          </div>
        </div>

        <div>
          <label className={labelCls}>工事名 *</label>
          <input type="text" value={form.constructionName} onChange={(e) => set("constructionName", e.target.value)} className={inputCls} required placeholder="例: サ総宅内" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>施工会社</label>
            <input type="text" value={form.constructionCompany} onChange={(e) => set("constructionCompany", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>班名</label>
            <input type="text" value={form.teamName} onChange={(e) => set("teamName", e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* 警備員選択 */}
      <div className={sectionCls}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">警備員名 *</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_GUARDS_FOR_REPORT.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => toggleGuard(g.id)}
              className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                form.guardIds.includes(g.id)
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
        {form.guardIds.length > 0 && (
          <p className="text-xs text-brand-600 font-medium">✓ {form.guardNames}</p>
        )}
      </div>

      {/* 施工場所 */}
      <div className={sectionCls}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">施工場所・走行距離</p>
        <div className="space-y-3">
          {form.locations.map((loc, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2">
              <p className="text-xs text-gray-400 font-medium">No.{i + 1}</p>
              <div className="flex items-center gap-1">
                <input type="time" value={loc.timeStart} onChange={(e) => setLocation(i, "timeStart", e.target.value)}
                  className="flex-1 px-2 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300" />
                <span className="text-gray-400 text-sm">〜</span>
                <input type="time" value={loc.timeEnd} onChange={(e) => setLocation(i, "timeEnd", e.target.value)}
                  className="flex-1 px-2 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <LocationInput
                value={loc.location}
                onChange={(v) => setLocation(i, "location", v)}
                placeholder={`施工場所 ${i + 1}（住所を入力またはGPS取得）`}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
              <div className="flex items-center gap-2">
                <input type="number" min={0} value={loc.distance} onChange={(e) => setLocation(i, "distance", e.target.valueAsNumber || "")}
                  placeholder="0"
                  className="w-24 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300" />
                <span className="text-sm text-gray-500">km</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 会社記入欄（任意） */}
      <div className={sectionCls}>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">会社記入欄（任意）</p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>エリア跨ぎ（人）</label>
            <input type="number" min={0} value={form.areaSpan} onChange={(e) => set("areaSpan", e.target.valueAsNumber || "")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>宿泊人数</label>
            <input type="number" min={0} value={form.stayCount} onChange={(e) => set("stayCount", e.target.valueAsNumber || "")} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>宿泊先</label>
          <input type="text" value={form.stayLocation} onChange={(e) => set("stayLocation", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>宿泊者名</label>
          <input type="text" value={form.stayPersons} onChange={(e) => set("stayPersons", e.target.value)} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>補正①名目</label>
            <input type="text" value={form.correction1Label} onChange={(e) => set("correction1Label", e.target.value)} className={inputCls} placeholder="駐車料金 等" />
          </div>
          <div>
            <label className={labelCls}>補正①金額（円）</label>
            <input type="number" min={0} value={form.correction1Amount} onChange={(e) => set("correction1Amount", e.target.valueAsNumber || "")} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>補正②名目</label>
            <input type="text" value={form.correction2Label} onChange={(e) => set("correction2Label", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>補正②金額（円）</label>
            <input type="number" min={0} value={form.correction2Amount} onChange={(e) => set("correction2Amount", e.target.valueAsNumber || "")} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>備考</label>
          <input type="text" value={form.remarks} onChange={(e) => set("remarks", e.target.value)} className={inputCls} />
        </div>

        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500 space-y-1">
          <p>警備会社: <span className="font-medium text-gray-700">{DEMO_COMPANY.name}</span></p>
          <p>委託CD: <span className="font-medium text-gray-700">{DEMO_COMPANY.itakuCd}</span></p>
        </div>
      </div>

      <button type="submit"
        className="w-full py-4 bg-brand-500 text-white font-bold text-base rounded-2xl hover:bg-brand-600 transition-colors shadow-sm">
        確認・提出へ →
      </button>
    </form>
  );
}
