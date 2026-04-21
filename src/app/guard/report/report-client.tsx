"use client";

import { useState } from "react";
import { ReportForm, ReportFormData } from "./report-form";
import { SignaturePad } from "./signature-pad";
import { ReportPDF } from "./report-pdf";
import DailyReportGuardForm from "./daily-report-guard-form";
import type { DailyReport, GuardOption } from "@/app/dashboard/daily-report/daily-report-types";

type ReportType = "select" | "standard" | "daily";
type SigningState = "form" | "guard-signing" | "client-signing" | "submitted";
type DailyState  = "form" | "preview" | "client-signing" | "submitted";

function fmtDate(s: string) {
  const d = new Date(s);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// ─── 書式選択画面 ───────────────────────────────────────
function ReportTypeSelect({ onSelect }: { onSelect: (t: "standard" | "daily") => void }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">報告書の作成</h2>
        <p className="text-sm text-gray-500 mt-1">使用する書式を選択してください</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => onSelect("standard")}
          className="w-full text-left bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-brand-400 hover:shadow-md transition-all active:scale-[0.98]"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-2xl shrink-0">
              📋
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">警備業務報告書</p>
              <p className="text-sm text-gray-500 mt-1">
                現場・取引先・配置隊員・特異事項を記録し、隊員と発注者のサインを取得します
              </p>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">電子署名あり</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">従来の書式</span>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelect("daily")}
          className="w-full text-left bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-brand-400 hover:shadow-md transition-all active:scale-[0.98]"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl shrink-0">
              🗒️
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">警備報告書（日報）</p>
              <p className="text-sm text-gray-500 mt-1">
                元請CD・施工場所・走行距離・補正などを記録する日報形式の書式です
              </p>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">施工場所4箇所</span>
                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">新書式</span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── メインコンポーネント ────────────────────────────────
export default function ReportClient({ guards }: { guards: GuardOption[] }) {
  const [reportType, setReportType] = useState<ReportType>("select");

  const [standardState, setStandardState] = useState<SigningState>("form");
  const [dailyState,    setDailyState]    = useState<DailyState>("form");
  const [dailyClientSig, setDailyClientSig] = useState<string | null>(null);
  const [dailyClientRepName, setDailyClientRepName] = useState("");
  const [formData, setFormData]           = useState<ReportFormData | null>(null);
  const [guardSig, setGuardSig]           = useState<string | null>(null);
  const [clientRepName, setClientRepName] = useState("");
  const [clientSig, setClientSig]         = useState<string | null>(null);
  const [showPDF, setShowPDF]             = useState(false);
  const [dailyReport, setDailyReport]     = useState<DailyReport | null>(null);

  const resetAll = () => {
    setReportType("select");
    setStandardState("form");
    setFormData(null); setGuardSig(null); setClientSig(null); setClientRepName("");
    setDailyReport(null);
    setDailyState("form");
    setDailyClientSig(null); setDailyClientRepName("");
  };

  if (reportType === "select") {
    return <ReportTypeSelect onSelect={setReportType} />;
  }

  // ────────── 日報書式 ──────────
  if (reportType === "daily") {
    if (dailyState === "form") {
      return (
        <DailyReportGuardForm
          guards={guards}
          onSubmit={(r) => { setDailyReport(r); setDailyState("preview"); }}
          onBack={() => setReportType("select")}
        />
      );
    }

    if (dailyState === "preview" && dailyReport) {
      const r = dailyReport;
      return (
        <div className="p-4 pb-8 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">報告書プレビュー</h2>
            <p className="text-xs text-gray-500 mt-0.5">現場担当者に内容をご確認いただいてください</p>
          </div>
          <div className="bg-white border-2 border-gray-300 rounded-2xl overflow-hidden text-sm">
            <div className="bg-gray-800 text-white text-center py-2 font-bold tracking-widest text-base">
              警 備 報 告 書
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500">お客様名</span>
                  <p className="font-bold text-gray-900">{r.clientName}　様</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">実施日</span>
                  <p className="font-medium text-gray-700 text-xs">{fmtDate(r.reportDate)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-3 text-xs">
                <div><span className="text-gray-400">開始</span><p className="font-medium">{r.startTime}</p></div>
                <div><span className="text-gray-400">終了</span><p className="font-medium">{r.endTime}</p></div>
                <div><span className="text-gray-400">休憩</span><p className="font-medium">{r.breakTime}</p></div>
                <div><span className="text-gray-400">車両</span><p className="font-medium">{r.vehicles}台</p></div>
                <div><span className="text-gray-400">走行</span><p className="font-medium">{r.totalDistance}km</p></div>
                <div><span className="text-gray-400">元請CD</span><p className="font-medium">{r.motoukeCd}</p></div>
                <div><span className="text-gray-400">出動</span><p className="font-medium">{r.headcount}名</p></div>
                <div className="col-span-2"><span className="text-gray-400">工事名</span><p className="font-medium">{r.constructionName}</p></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-xs">
                <span className="text-gray-400">警備員名</span>
                <p className="font-medium mt-0.5">{r.guardNames}</p>
              </div>
              {r.constructionCompany && (
                <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-3 text-xs">
                  <div><span className="text-gray-400">施工会社</span><p className="font-medium">{r.constructionCompany}</p></div>
                  <div><span className="text-gray-400">班名</span><p className="font-medium">{r.teamName}</p></div>
                </div>
              )}
              <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-gray-100 px-3 py-1.5 font-medium text-gray-600">施工場所・走行距離</div>
                {r.locations.filter((l) => l.location).map((loc, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 border-t border-gray-100">
                    <span className="text-gray-400 w-4">({i + 1})</span>
                    <span className="text-gray-500 w-24 shrink-0">{loc.timeStart}{loc.timeEnd ? `〜${loc.timeEnd}` : ""}</span>
                    <span className="flex-1 text-gray-800">{loc.location}</span>
                    <span className="text-gray-500 shrink-0">{loc.distance !== "" ? `${loc.distance}km` : ""}</span>
                  </div>
                ))}
              </div>
              {(r.correction1Label || r.correction2Label || r.remarks) && (
                <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
                  {r.correction1Label && <p><span className="text-gray-400">補正①</span> {r.correction1Label} {r.correction1Amount !== "" ? `${Number(r.correction1Amount).toLocaleString()}円` : ""}</p>}
                  {r.correction2Label && <p><span className="text-gray-400">補正②</span> {r.correction2Label} {r.correction2Amount !== "" ? `${Number(r.correction2Amount).toLocaleString()}円` : ""}</p>}
                  {r.remarks && <p><span className="text-gray-400">備考</span> {r.remarks}</p>}
                </div>
              )}
              <div className="flex justify-between text-xs bg-gray-50 rounded-xl p-3">
                <span><span className="text-gray-400">警備会社</span> {r.companyName}</span>
                <span><span className="text-gray-400">委託CD</span> {r.itakuCd}</span>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            上記の内容をご確認のうえ、署名をお願いします
          </div>
          <button onClick={() => setDailyState("client-signing")}
            className="w-full py-4 bg-brand-500 text-white font-bold text-base rounded-2xl hover:bg-brand-600 transition-colors">
            現場担当者に署名してもらう →
          </button>
          <button onClick={() => setDailyState("form")} className="w-full py-2 text-sm text-gray-500">
            ← 入力内容を修正する
          </button>
        </div>
      );
    }

    if (dailyState === "client-signing" && dailyReport) {
      return (
        <div className="p-4 pb-8 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">現場担当者 確認署名</h2>
            <p className="text-xs text-gray-500 mt-0.5">担当者の方にご署名をお願いします</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm space-y-1">
            <p><span className="text-gray-500">お客様:</span> <span className="font-medium">{dailyReport.clientName}</span></p>
            <p><span className="text-gray-500">工事名:</span> <span className="font-medium">{dailyReport.constructionName}</span></p>
            <p><span className="text-gray-500">日付:</span> <span className="font-medium">{fmtDate(dailyReport.reportDate)}　{dailyReport.startTime}〜{dailyReport.endTime}</span></p>
            <p><span className="text-gray-500">警備員:</span> <span className="font-medium">{dailyReport.guardNames}</span></p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">担当者名</label>
            <input type="text" value={dailyClientRepName} onChange={(e) => setDailyClientRepName(e.target.value)}
              placeholder="確認担当者のお名前"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">署名 <span className="text-red-500">*</span></label>
            <SignaturePad onSign={setDailyClientSig} onClear={() => setDailyClientSig(null)} />
          </div>
          <button onClick={() => { if (dailyClientSig) setDailyState("submitted"); }} disabled={!dailyClientSig}
            className={`w-full py-4 font-bold text-base rounded-2xl transition-colors ${dailyClientSig ? "bg-brand-500 text-white hover:bg-brand-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
            日報を提出する
          </button>
          <button onClick={() => { setDailyState("preview"); setDailyClientSig(null); }} className="w-full py-2 text-sm text-gray-500">
            ← プレビューに戻る
          </button>
        </div>
      );
    }

    if (dailyState === "submitted" && dailyReport && dailyClientSig) {
      return (
        <div className="p-6 space-y-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-4xl">✅</div>
            <h2 className="text-xl font-bold text-gray-900">日報を提出しました</h2>
            <p className="text-sm text-gray-500">管制担当者が確認します</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 text-sm space-y-1.5">
            <p><span className="text-gray-500">日付:</span> <span className="font-medium">{fmtDate(dailyReport.reportDate)}</span></p>
            <p><span className="text-gray-500">お客様:</span> <span className="font-medium">{dailyReport.clientName}</span></p>
            <p><span className="text-gray-500">工事名:</span> <span className="font-medium">{dailyReport.constructionName}</span></p>
            <p><span className="text-gray-500">元請CD:</span> <span className="font-medium">{dailyReport.motoukeCd}</span></p>
            <p><span className="text-gray-500">出動人数:</span> <span className="font-medium">{dailyReport.headcount}名</span></p>
            <p><span className="text-gray-500">警備員:</span> <span className="font-medium">{dailyReport.guardNames}</span></p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">現場担当者署名{dailyClientRepName && `（${dailyClientRepName}）`}</p>
            <img src={dailyClientSig} alt="現場担当者署名" className="h-14 border border-gray-200 rounded-xl bg-white w-full object-contain" />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
            管制担当者が内容を確認後、発注者へ送付します。
          </div>
          <button onClick={resetAll} className="w-full py-3 text-sm text-brand-500 underline">
            別の報告書を作成
          </button>
        </div>
      );
    }
  }

  // ────────── 従来書式 ──────────
  if (showPDF && formData && guardSig && clientSig) {
    return (
      <ReportPDF data={formData} guardSig={guardSig} clientSig={clientSig}
        clientRepName={clientRepName} onClose={() => setShowPDF(false)} printable={false} />
    );
  }

  if (standardState === "form") {
    return (
      <div>
        <div className="flex items-center gap-2 px-4 pt-4">
          <button onClick={() => setReportType("select")} className="text-gray-400 text-lg">←</button>
          <p className="text-sm text-gray-500">警備業務報告書</p>
        </div>
        <ReportForm onSubmit={(data) => { setFormData(data); setStandardState("guard-signing"); }} />
      </div>
    );
  }

  if (standardState === "guard-signing" && formData) {
    return (
      <div className="p-4 pb-8 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">隊員署名</h2>
          <p className="text-xs text-gray-500 mt-0.5">報告内容を確認し、署名してください</p>
        </div>
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm space-y-1">
          <p><span className="text-gray-500">日付:</span> <span className="font-medium">{fmtDate(formData.reportDate)}</span></p>
          <p><span className="text-gray-500">時間:</span> <span className="font-medium">{formData.startTime}〜{formData.endTime}</span></p>
          <p><span className="text-gray-500">取引先:</span> <span className="font-medium">{formData.clientName}</span></p>
          <p><span className="text-gray-500">現場:</span> <span className="font-medium">{formData.siteName}</span></p>
          <p><span className="text-gray-500">配置隊員:</span> <span className="font-medium">{formData.guards.map((g) => g.name).join("、")}（{formData.guards.length}名）</span></p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">署名 <span className="text-red-500">*</span></label>
          <SignaturePad onSign={setGuardSig} onClear={() => setGuardSig(null)} />
        </div>
        <button onClick={() => { if (guardSig) setStandardState("client-signing"); }} disabled={!guardSig}
          className={`w-full py-4 font-bold text-base rounded-2xl transition-colors ${guardSig ? "bg-brand-500 text-white hover:bg-brand-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
          次へ（発注者サイン）→
        </button>
        <button onClick={() => { setStandardState("form"); setGuardSig(null); }} className="w-full py-2 text-sm text-gray-500">
          ← 入力に戻る
        </button>
      </div>
    );
  }

  if (standardState === "client-signing" && formData) {
    return (
      <div className="p-4 pb-8 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">発注者確認署名</h2>
          <p className="text-xs text-gray-500 mt-0.5">発注者担当者の方にご確認・署名をお願いします</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm space-y-1">
          <p><span className="text-gray-500">取引先:</span> <span className="font-medium">{formData.clientName}</span></p>
          <p><span className="text-gray-500">現場:</span> <span className="font-medium">{formData.siteName}</span></p>
          <p><span className="text-gray-500">日時:</span> <span className="font-medium">{fmtDate(formData.reportDate)} {formData.startTime}〜{formData.endTime}</span></p>
          <p><span className="text-gray-500">配置隊員:</span> <span className="font-medium">{formData.guards.map((g) => g.name).join("、")}（{formData.guards.length}名）</span></p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">担当者名</label>
          <input type="text" value={clientRepName} onChange={(e) => setClientRepName(e.target.value)}
            placeholder="確認担当者のお名前"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">発注者署名 <span className="text-red-500">*</span></label>
          <SignaturePad onSign={setClientSig} onClear={() => setClientSig(null)} />
        </div>
        <button onClick={() => { if (clientSig) setStandardState("submitted"); }} disabled={!clientSig}
          className={`w-full py-4 font-bold text-base rounded-2xl transition-colors ${clientSig ? "bg-brand-500 text-white hover:bg-brand-600" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
          報告書を提出する
        </button>
        <button onClick={() => { setStandardState("guard-signing"); setClientSig(null); }} className="w-full py-2 text-sm text-gray-500">
          ← 戻る
        </button>
      </div>
    );
  }

  if (standardState === "submitted" && formData && guardSig && clientSig) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-4xl">✅</div>
          <h2 className="text-xl font-bold text-gray-900">報告書を提出しました</h2>
          <p className="text-sm text-gray-500">管制担当者が確認します</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
          <p><span className="text-gray-500">日付:</span> <span className="font-medium">{fmtDate(formData.reportDate)}</span></p>
          <p><span className="text-gray-500">取引先:</span> <span className="font-medium">{formData.clientName}</span></p>
          <p><span className="text-gray-500">現場:</span> <span className="font-medium">{formData.siteName}</span></p>
          <p><span className="text-gray-500">配置隊員:</span> <span className="font-medium">{formData.guards.map((g) => g.name).join("、")}（{formData.guards.length}名）</span></p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">隊員署名</p>
            <img src={guardSig} alt="隊員署名" className="h-12 border border-gray-200 rounded-lg bg-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">発注者署名</p>
            <img src={clientSig} alt="発注者署名" className="h-12 border border-gray-200 rounded-lg bg-white" />
          </div>
        </div>
        <button onClick={() => setShowPDF(true)}
          className="w-full py-3 bg-gray-700 text-white font-bold rounded-2xl hover:bg-gray-800 transition-colors">
          発注者確認プレビューを表示
        </button>
        <button onClick={resetAll} className="w-full py-2 text-sm text-brand-500 underline">
          別の報告書を作成
        </button>
      </div>
    );
  }

  return null;
}
