"use client";

import { useState } from "react";
import { REPORT_CLIENTS, REPORT_GUARDS, WORK_TYPES } from "../guard-demo-data";

export type ReportGuardEntry = {
  id: string;
  name: string;
  licenseNo: string;
};

export type ReportFormData = {
  reportDate: string;
  startTime: string;
  endTime: string;
  clientId: string;
  clientName: string;
  siteId: string;
  siteName: string;
  siteAddress: string;
  guards: ReportGuardEntry[];   // 1人目が代表（報告書作成者）
  workType: string;
  incidents: boolean;
  incidentDetail: string;
  remarks: string;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const INPUT_CLS = "w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white";

type Props = { onSubmit: (data: ReportFormData) => void };

export function ReportForm({ onSubmit }: Props) {
  const [date, setDate]           = useState(todayStr());
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime]     = useState("17:00");
  const [clientId, setClientId]   = useState("");
  const [siteId, setSiteId]       = useState("");
  const [guards, setGuards]       = useState<ReportGuardEntry[]>([]);
  const [addingId, setAddingId]   = useState("");
  const [workType, setWorkType]   = useState(WORK_TYPES[0]);
  const [incidents, setIncidents] = useState(false);
  const [incidentDetail, setIncidentDetail] = useState("");
  const [remarks, setRemarks]     = useState("");

  const selectedClient = REPORT_CLIENTS.find((c) => c.id === clientId);
  const selectedSite   = selectedClient?.sites.find((s) => s.id === siteId);
  const unaddedGuards  = REPORT_GUARDS.filter((g) => !guards.find((sg) => sg.id === g.id));

  function addGuard() {
    const g = REPORT_GUARDS.find((g) => g.id === addingId);
    if (!g) return;
    setGuards((prev) => [...prev, { id: g.id, name: g.name, licenseNo: g.licenseNo }]);
    setAddingId("");
  }

  function removeGuard(id: string) {
    setGuards((prev) => prev.filter((g) => g.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClient || !selectedSite || guards.length === 0) return;
    onSubmit({
      reportDate: date, startTime, endTime,
      clientId, clientName: selectedClient.name,
      siteId,   siteName: selectedSite.name, siteAddress: selectedSite.address,
      guards, workType, incidents, incidentDetail, remarks,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 pb-8 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">警備業務報告書</h2>
        <p className="text-xs text-gray-500 mt-0.5">土木・建築現場 業務日報</p>
      </div>

      {/* 日時 */}
      <section className="space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">日時</p>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">勤務日 <span className="text-red-500">*</span></label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={INPUT_CLS} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">開始時刻 <span className="text-red-500">*</span></label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">終了時刻 <span className="text-red-500">*</span></label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className={INPUT_CLS} />
          </div>
        </div>
      </section>

      {/* 取引先・現場 */}
      <section className="space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">取引先・現場</p>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">取引先名 <span className="text-red-500">*</span></label>
          <select value={clientId} onChange={(e) => { setClientId(e.target.value); setSiteId(""); }} required className={INPUT_CLS}>
            <option value="">選択してください</option>
            {REPORT_CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">現場名 <span className="text-red-500">*</span></label>
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)} required disabled={!clientId}
            className={INPUT_CLS + " disabled:bg-gray-50 disabled:text-gray-400"}>
            <option value="">{clientId ? "選択してください" : "取引先を先に選択"}</option>
            {selectedClient?.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {selectedSite && <p className="text-xs text-gray-400 mt-1">📍 {selectedSite.address}</p>}
        </div>
      </section>

      {/* 配置隊員 */}
      <section className="space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          配置隊員 <span className="text-red-500">*</span>
          {guards.length > 0 && <span className="ml-2 text-gray-400 font-normal normal-case">{guards.length}名</span>}
        </p>

        {/* 選択済みリスト */}
        {guards.length > 0 && (
          <div className="space-y-2">
            {guards.map((g, i) => (
              <div key={g.id} className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-xl px-3 py-2.5">
                <div>
                  {i === 0 && (
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-100 px-1.5 py-0.5 rounded mr-2">代表</span>
                  )}
                  <span className="text-sm font-semibold text-gray-800">{g.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{g.licenseNo}</span>
                </div>
                <button type="button" onClick={() => removeGuard(g.id)}
                  className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-xs transition-colors shrink-0">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 追加ドロップダウン */}
        {unaddedGuards.length > 0 && (
          <div className="flex gap-2">
            <select value={addingId} onChange={(e) => setAddingId(e.target.value)} className={INPUT_CLS}>
              <option value="">隊員を追加...</option>
              {unaddedGuards.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button type="button" onClick={addGuard} disabled={!addingId}
              className="px-4 py-2.5 bg-brand-500 text-white text-sm font-bold rounded-xl disabled:bg-gray-200 disabled:text-gray-400 shrink-0 transition-colors">
              追加
            </button>
          </div>
        )}
        {guards.length === 0 && <p className="text-xs text-red-400">1名以上選択してください</p>}
        {guards.length > 0 && <p className="text-xs text-gray-400">1人目が代表隊員として報告書に記載されます</p>}
      </section>

      {/* 業務種別 */}
      <section className="space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">業務内容</p>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">業務種別 <span className="text-red-500">*</span></label>
          <select value={workType} onChange={(e) => setWorkType(e.target.value)} className={INPUT_CLS}>
            {WORK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </section>

      {/* 特異事項 */}
      <section className="space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">特異事項</p>
        <div className="flex gap-3">
          {([false, true] as const).map((val) => (
            <button key={String(val)} type="button" onClick={() => setIncidents(val)}
              className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                incidents === val
                  ? val ? "border-red-400 bg-red-50 text-red-600" : "border-green-400 bg-green-50 text-green-600"
                  : "border-gray-200 text-gray-400"
              }`}>{val ? "あり" : "なし"}</button>
          ))}
        </div>
        {incidents && (
          <textarea value={incidentDetail} onChange={(e) => setIncidentDetail(e.target.value)}
            placeholder="特異事項の内容を詳しく記入してください..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
            rows={3} />
        )}
      </section>

      {/* 備考 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">備考・引き継ぎ事項</label>
        <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)}
          placeholder="次の担当者への引き継ぎ事項など..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
          rows={3} />
      </div>

      <button type="submit" disabled={guards.length === 0}
        className="w-full py-4 bg-brand-500 text-white font-bold text-base rounded-2xl hover:bg-brand-600 transition-colors shadow-sm disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">
        次へ（署名）→
      </button>
    </form>
  );
}
