"use client";

import { useState } from "react";

// ── 共有型（guard/report/report-form.tsx と同じ構造） ──
type GuardEntry = { id: string; name: string; licenseNo: string };

type ReportData = {
  reportDate: string;
  startTime: string;
  endTime: string;
  clientName: string;
  siteName: string;
  siteAddress: string;
  guards: GuardEntry[];
  workType: string;
  incidents: boolean;
  incidentDetail: string;
  remarks: string;
};

type SubmittedReport = {
  id: string;
  submittedAt: string;
  emailSentAt: string | null;
  clientEmail: string;
  clientRepName: string;
  data: ReportData;
};

// ── デモデータ ──
const DEMO_REPORTS: SubmittedReport[] = [
  {
    id: "wr1", submittedAt: "2026-04-02T17:05:00", emailSentAt: "2026-04-02T18:30:00",
    clientEmail: "yamada-kensetsu@example.com", clientRepName: "山田 太郎",
    data: {
      reportDate: "2026-04-02", startTime: "08:00", endTime: "17:00",
      clientName: "株式会社山田建設", siteName: "国道20号線 舗装補修工事", siteAddress: "東京都調布市国領町2丁目",
      guards: [{ id: "g1", name: "田中 一郎", licenseNo: "東京第12345号" }, { id: "g2", name: "高橋 二郎", licenseNo: "東京第23456号" }],
      workType: "交通誘導警備（第2号）", incidents: false, incidentDetail: "", remarks: "特に問題なし",
    },
  },
  {
    id: "wr2", submittedAt: "2026-04-03T16:45:00", emailSentAt: null,
    clientEmail: "abc-doboku@example.com", clientRepName: "鈴木 次郎",
    data: {
      reportDate: "2026-04-03", startTime: "08:00", endTime: "16:00",
      clientName: "ABC土木工業株式会社", siteName: "市道中野8号線 整備工事", siteAddress: "東京都中野区中野3丁目",
      guards: [{ id: "g3", name: "山田 三郎", licenseNo: "東京第34567号" }],
      workType: "交通誘導警備（第2号）", incidents: true,
      incidentDetail: "14:30頃、通行人が誘導区間に侵入。声がけにより安全に誘導した。", remarks: "",
    },
  },
  {
    id: "wr3", submittedAt: "2026-04-03T17:10:00", emailSentAt: null,
    clientEmail: "tokyo-kensetsu@example.com", clientRepName: "佐藤 三郎",
    data: {
      reportDate: "2026-04-03", startTime: "09:00", endTime: "18:00",
      clientName: "東京建設工業株式会社", siteName: "○○マンション新築工事", siteAddress: "東京都品川区大崎1丁目",
      guards: [{ id: "g1", name: "田中 一郎", licenseNo: "東京第12345号" }, { id: "g4", name: "伊藤 四郎", licenseNo: "東京第45678号" }],
      workType: "建設工事現場警備", incidents: false, incidentDetail: "", remarks: "",
    },
  },
];

function fmtDate(s: string) {
  const d = new Date(s);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
function fmtDateTime(s: string) {
  const d = new Date(s);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function calcHours(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const m = (eh * 60 + em) - (sh * 60 + sm);
  if (m <= 0) return "—";
  return m % 60 > 0 ? `${Math.floor(m/60)}時間${m%60}分` : `${Math.floor(m/60)}時間`;
}

// ── PDF プレビューモーダル ──
function PreviewModal({ report, onClose }: { report: SubmittedReport; onClose: () => void }) {
  const d = report.data;
  const TD_L = "bg-gray-100 px-3 py-2 font-bold text-sm w-1/3 border-r border-gray-300 align-top";
  const TD_V = "px-3 py-2 text-sm";
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="print:hidden sticky top-0 z-10 bg-gray-100 border-b px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">警備業務実施報告書 プレビュー</span>
        <div className="flex gap-2">
          <button onClick={() => window.print()}
            className="px-4 py-2 bg-brand-500 text-white text-sm font-bold rounded-xl hover:bg-brand-600 transition-colors">
            🖨 PDF・印刷
          </button>
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">閉じる</button>
        </div>
      </div>
      <div className="max-w-[720px] mx-auto px-8 py-8">
        <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
          <h1 className="text-2xl font-bold tracking-[0.2em]">警備業務実施報告書</h1>
          <p className="text-xs text-gray-500 mt-1">（土木・建築工事現場用）</p>
        </div>
        <p className="text-right text-sm text-gray-600 mb-4">報告日：{fmtDate(d.reportDate)}</p>
        <table className="w-full border-collapse mb-4">
          <tbody>
            {([
              ["発注者（取引先）", d.clientName],
              ["現場名", d.siteName],
              ["現場所在地", d.siteAddress],
              ["勤務日", fmtDate(d.reportDate)],
              ["勤務時間", `${d.startTime} 〜 ${d.endTime}（実働 ${calcHours(d.startTime, d.endTime)}）`],
              ["業務種別", d.workType],
              ["配置人数", `${d.guards.length} 名`],
            ] as [string, string][]).map(([label, value]) => (
              <tr key={label} className="border border-gray-300">
                <td className={TD_L}>{label}</td>
                <td className={TD_V}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="bg-gray-100 border border-gray-300">
              <th className="px-3 py-2 text-sm text-left font-bold w-8 border-r border-gray-300">#</th>
              <th className="px-3 py-2 text-sm text-left font-bold border-r border-gray-300">氏名</th>
              <th className="px-3 py-2 text-sm text-left font-bold">検定証明書番号</th>
            </tr>
          </thead>
          <tbody>
            {d.guards.map((g, i) => (
              <tr key={g.id} className="border border-gray-300">
                <td className="px-3 py-2 text-sm text-center text-gray-400 border-r border-gray-300">{i + 1}</td>
                <td className="px-3 py-2 text-sm border-r border-gray-300">
                  {g.name}{i === 0 && <span className="ml-2 text-[10px] text-brand-600 bg-brand-50 border border-brand-200 px-1 py-0.5 rounded">代表</span>}
                </td>
                <td className="px-3 py-2 text-sm text-gray-500">{g.licenseNo}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="w-full border-collapse mb-6">
          <tbody>
            <tr className="border border-gray-300">
              <td className={TD_L}>特異事項</td>
              <td className={`${TD_V} font-semibold ${d.incidents ? "text-red-600" : "text-green-600"}`}>{d.incidents ? "あり" : "なし"}</td>
            </tr>
            {d.incidents && <tr className="border border-gray-300"><td className={TD_L}>詳細</td><td className={`${TD_V} whitespace-pre-wrap`}>{d.incidentDetail}</td></tr>}
            {d.remarks && <tr className="border border-gray-300"><td className={TD_L}>備考</td><td className={`${TD_V} whitespace-pre-wrap`}>{d.remarks}</td></tr>}
            <tr className="border border-gray-300">
              <td className={TD_L}>発注者確認者</td>
              <td className={TD_V}>{report.clientRepName || "—"}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">本報告書は警備業法第18条に基づき作成されました。</p>
      </div>
    </div>
  );
}

// ── メール送信モーダル ──
function EmailModal({ report, onSent, onClose }: { report: SubmittedReport; onSent: () => void; onClose: () => void }) {
  const d = report.data;
  const [to, setTo]           = useState(report.clientEmail);
  const [subject, setSubject] = useState(`警備業務実施報告書 ${d.reportDate.replace(/-/g,"/")}（${d.clientName}・${d.siteName}）`);
  const [body, setBody]       = useState(
    `${report.clientRepName} 様\n\nお世話になっております。\n${d.reportDate.replace(/-/g,"/")} の警備業務実施報告書をお送りします。\n\n【現場】${d.siteName}\n【勤務時間】${d.startTime}〜${d.endTime}\n【業務種別】${d.workType}\n【配置人数】${d.guards.length}名\n【担当隊員】${d.guards.map((g) => g.name).join("、")}\n【特異事項】${d.incidents ? "あり" : "なし"}\n\nご確認のほどよろしくお願いいたします。\n\n━━━━━━━━━━━━━━━\nサンプル警備株式会社 管制センター`
  );
  const [sent, setSent] = useState(false);

  if (sent) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h3 className="text-lg font-bold">送信しました</h3>
        <p className="text-sm text-gray-500">{to} へPDF報告書を送信しました</p>
        <button onClick={() => { onSent(); onClose(); }} className="w-full py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600">閉じる</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="bg-brand-500 px-5 py-4 rounded-t-2xl flex items-center justify-between">
          <h3 className="text-white font-bold">📧 報告書メール送信</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl">×</button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">宛先</label>
            <input value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">件名</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">本文</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
            <span>📎</span><span>警備業務実施報告書.pdf が添付されます</span>
          </div>
        </div>
        <div className="px-5 py-4 border-t flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">キャンセル</button>
          <button onClick={() => setSent(true)} disabled={!to.trim()}
            className="px-5 py-2 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl disabled:bg-gray-200 disabled:text-gray-400 transition-colors">
            送信する
          </button>
        </div>
      </div>
    </div>
  );
}

// ── メインビュー ──
export function WorkReportView() {
  const [reports, setReports]   = useState<SubmittedReport[]>(DEMO_REPORTS);
  const [preview, setPreview]   = useState<SubmittedReport | null>(null);
  const [emailing, setEmailing] = useState<SubmittedReport | null>(null);

  const pending = reports.filter((r) => !r.emailSentAt).length;

  return (
    <div className="space-y-4">
      {pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium">
          メール未送信の報告書が {pending} 件あります
        </div>
      )}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-gray-500 font-semibold">提出日時</th>
              <th className="px-4 py-3 text-left text-gray-500 font-semibold">取引先 / 現場</th>
              <th className="px-4 py-3 text-left text-gray-500 font-semibold">隊員</th>
              <th className="px-4 py-3 text-center text-gray-500 font-semibold">特異</th>
              <th className="px-4 py-3 text-center text-gray-500 font-semibold">メール</th>
              <th className="px-4 py-3 text-right text-gray-500 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap tabular-nums">{fmtDateTime(r.submittedAt)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{r.data.clientName}</p>
                  <p className="text-xs text-gray-400">{r.data.siteName}</p>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {r.data.guards.map((g) => g.name).join("、")}
                  <span className="text-xs text-gray-400 ml-1">（{r.data.guards.length}名）</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {r.data.incidents
                    ? <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">あり</span>
                    : <span className="text-xs text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  {r.emailSentAt
                    ? <span className="text-xs text-green-600 font-medium">✓ {fmtDateTime(r.emailSentAt)}</span>
                    : <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">未送信</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={() => setPreview(r)}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      プレビュー
                    </button>
                    <button onClick={() => setEmailing(r)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">
                      📧 メール送信
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview && <PreviewModal report={preview} onClose={() => setPreview(null)} />}
      {emailing && (
        <EmailModal
          report={emailing}
          onSent={() => setReports((prev) =>
            prev.map((r) => r.id === emailing.id ? { ...r, emailSentAt: new Date().toISOString() } : r)
          )}
          onClose={() => setEmailing(null)}
        />
      )}
    </div>
  );
}
