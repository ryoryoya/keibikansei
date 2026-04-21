"use client";

import { useState } from "react";
import type { DailyReport, WorkLocation, GuardOption } from "./daily-report-types";
import { DEMO_CLIENTS_FOR_REPORT, DEMO_GUARDS_FOR_REPORT, DEMO_COMPANY } from "./daily-report-types";

type Props = {
  initial: DailyReport;
  guards?: GuardOption[];
  onSave: (r: DailyReport) => void;
  onCancel: () => void;
};

export default function DailyReportForm({ initial, guards: guardsProp, onSave, onCancel }: Props) {
  const guards = guardsProp && guardsProp.length > 0 ? guardsProp : DEMO_GUARDS_FOR_REPORT;
  const [form, setForm] = useState<DailyReport>({ ...initial });

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
    onSave({ ...form, companyName: DEMO_COMPANY.name, itakuCd: DEMO_COMPANY.itakuCd });
  };

  const inputCls = "w-full px-2 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300";
  const labelCls = "block text-xs text-gray-500 mb-0.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ヘッダー情報 */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 border-b pb-2">基本情報</h3>
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>開始時刻</label>
            <input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>終了時刻</label>
            <input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>休憩時間</label>
            <input type="text" placeholder="0:00" value={form.breakTime} onChange={(e) => set("breakTime", e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>車両台数</label>
            <input type="number" min={0} value={form.vehicles} onChange={(e) => set("vehicles", e.target.valueAsNumber || "")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>走行距離合計(km)</label>
            <input type="number" min={0} value={form.totalDistance} onChange={(e) => set("totalDistance", e.target.valueAsNumber || "")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>元請CD *</label>
            <input type="text" value={form.motoukeCd} onChange={(e) => set("motoukeCd", e.target.value)} className={inputCls} required placeholder="例: 10100" />
          </div>
          <div>
            <label className={labelCls}>出動人数 *</label>
            <input type="number" min={1} value={form.headcount} onChange={(e) => set("headcount", e.target.valueAsNumber || "")} className={inputCls} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>工事名 *</label>
            <input type="text" value={form.constructionName} onChange={(e) => set("constructionName", e.target.value)} className={inputCls} required placeholder="例: サ総宅内" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>施工会社</label>
              <input type="text" value={form.constructionCompany} onChange={(e) => set("constructionCompany", e.target.value)} className={inputCls} placeholder="例: キャリネット" />
            </div>
            <div>
              <label className={labelCls}>班名</label>
              <input type="text" value={form.teamName} onChange={(e) => set("teamName", e.target.value)} className={inputCls} placeholder="例: 武藤" />
            </div>
          </div>
        </div>

        {/* 警備員選択 */}
        <div>
          <label className={labelCls}>警備員名 *（複数選択可）</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {DEMO_GUARDS_FOR_REPORT.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGuard(g.id)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  form.guardIds.includes(g.id)
                    ? "bg-brand-500 text-white border-brand-500"
                    : "bg-white text-gray-600 border-gray-300 hover:border-brand-400"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
          {form.guardIds.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">選択中: {form.guardNames}</p>
          )}
        </div>
      </div>

      {/* 施工場所 */}
      <div className="bg-white rounded-xl border p-5 space-y-3">
        <h3 className="font-semibold text-gray-800 border-b pb-2">施工場所・走行距離</h3>
        <div className="space-y-2">
          {form.locations.map((loc, i) => (
            <div key={i} className="grid grid-cols-[80px_80px_1fr_80px] gap-2 items-center">
              <div className="text-xs text-gray-400 font-medium text-center">No.{i + 1}</div>
              <div className="col-span-1">
                <div className="flex items-center gap-1">
                  <input type="time" value={loc.timeStart} onChange={(e) => setLocation(i, "timeStart", e.target.value)}
                    className="w-full px-1.5 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-brand-300" />
                  <span className="text-xs text-gray-400">〜</span>
                  <input type="time" value={loc.timeEnd} onChange={(e) => setLocation(i, "timeEnd", e.target.value)}
                    className="w-full px-1.5 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-brand-300" />
                </div>
              </div>
              <input type="text" value={loc.location} onChange={(e) => setLocation(i, "location", e.target.value)}
                placeholder={`施工場所 ${i + 1}`}
                className="px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-brand-300" />
              <div className="flex items-center gap-1">
                <input type="number" min={0} value={loc.distance} onChange={(e) => setLocation(i, "distance", e.target.valueAsNumber || "")}
                  placeholder="km"
                  className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-brand-300" />
                <span className="text-xs text-gray-400">km</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 会社記入欄（任意） */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold text-gray-800 border-b pb-2">会社記入欄（任意）</h3>
        <p className="text-xs text-gray-400">以下はすべて任意項目です。入力しなくても保存できます。</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>エリア跨ぎ（人）</label>
            <input type="number" min={0} value={form.areaSpan} onChange={(e) => set("areaSpan", e.target.valueAsNumber || "")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>宿泊先</label>
            <input type="text" value={form.stayLocation} onChange={(e) => set("stayLocation", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>宿泊人数</label>
            <input type="number" min={0} value={form.stayCount} onChange={(e) => set("stayCount", e.target.valueAsNumber || "")} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>宿泊者名</label>
          <input type="text" value={form.stayPersons} onChange={(e) => set("stayPersons", e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={labelCls}>補正①名目</label>
              <input type="text" value={form.correction1Label} onChange={(e) => set("correction1Label", e.target.value)} className={inputCls} placeholder="例: 駐車料金" />
            </div>
            <div className="w-28">
              <label className={labelCls}>補正①金額</label>
              <input type="number" min={0} value={form.correction1Amount} onChange={(e) => set("correction1Amount", e.target.valueAsNumber || "")} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className={labelCls}>補正②名目</label>
              <input type="text" value={form.correction2Label} onChange={(e) => set("correction2Label", e.target.value)} className={inputCls} />
            </div>
            <div className="w-28">
              <label className={labelCls}>補正②金額</label>
              <input type="number" min={0} value={form.correction2Amount} onChange={(e) => set("correction2Amount", e.target.valueAsNumber || "")} className={inputCls} />
            </div>
          </div>
        </div>
        <div>
          <label className={labelCls}>備考</label>
          <input type="text" value={form.remarks} onChange={(e) => set("remarks", e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-3">
          <div>
            <span className={labelCls}>警備会社（自動）</span>
            <p className="text-sm font-medium text-gray-700">{DEMO_COMPANY.name}</p>
          </div>
          <div>
            <span className={labelCls}>委託CD（自動）</span>
            <p className="text-sm font-medium text-gray-700">{DEMO_COMPANY.itakuCd}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm border rounded-lg hover:bg-gray-50">キャンセル</button>
        <button type="submit" className="px-6 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600">
          保存する
        </button>
      </div>
    </form>
  );
}
