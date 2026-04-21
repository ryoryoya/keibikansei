"use client";

import { ReportFormData } from "./report-form";

type Props = {
  data: ReportFormData;
  guardSig: string;
  clientSig: string;
  clientRepName: string;
  onClose: () => void;
  printable?: boolean;  // false = 隊員側プレビュー（印刷ボタン非表示）
};

function fmtDate(s: string) {
  const d = new Date(s);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function calcHours(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}時間${m}分` : `${h}時間`;
}

const TD_LABEL = "bg-gray-100 px-3 py-2 font-bold text-sm w-1/4 border-r border-gray-400 align-top";
const TD_VALUE = "px-3 py-2 text-sm";

export function ReportPDF({ data, guardSig, clientSig, clientRepName, onClose, printable = true }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* 操作バー（印刷時非表示） */}
      <div className="print:hidden sticky top-0 z-10 bg-gray-100 border-b px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">
          {printable ? "警備業務実施報告書 プレビュー" : "発注者確認用プレビュー"}
        </span>
        <div className="flex gap-2">
          {printable && (
            <button onClick={() => window.print()}
              className="px-4 py-2 bg-brand-500 text-white text-sm font-bold rounded-xl hover:bg-brand-600 transition-colors">
              🖨 PDF・印刷
            </button>
          )}
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            {printable ? "閉じる" : "確認完了"}
          </button>
        </div>
      </div>

      {/* 報告書本体 */}
      <div className="max-w-[720px] mx-auto px-8 py-8 print:px-6 print:py-4">
        <style dangerouslySetInnerHTML={{ __html: `@media print { .print\\:hidden { display: none !important; } }` }} />

        {/* タイトル */}
        <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
          <h1 className="text-2xl font-bold tracking-[0.2em]">警備業務実施報告書</h1>
          <p className="text-xs text-gray-500 mt-1">（土木・建築工事現場用）</p>
        </div>
        <p className="text-right text-sm text-gray-600 mb-4">報告日：{fmtDate(data.reportDate)}</p>

        {/* 現場情報 */}
        <table className="w-full border-collapse mb-4">
          <tbody>
            {[
              ["発注者（取引先）", data.clientName],
              ["現場名",          data.siteName],
              ["現場所在地",      data.siteAddress],
              ["勤務日",          fmtDate(data.reportDate)],
              ["勤務時間",        `${data.startTime} 〜 ${data.endTime}　（実働 ${calcHours(data.startTime, data.endTime)}）`],
              ["業務種別",        data.workType],
              ["配置人数",        `${data.guards.length} 名`],
            ].map(([label, value]) => (
              <tr key={label} className="border border-gray-400">
                <td className={TD_LABEL}>{label}</td>
                <td className={TD_VALUE}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 配置隊員一覧 */}
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="border border-gray-400 bg-gray-100">
              <th className="px-3 py-2 text-sm text-left font-bold border-r border-gray-400 w-8">#</th>
              <th className="px-3 py-2 text-sm text-left font-bold border-r border-gray-400">氏名</th>
              <th className="px-3 py-2 text-sm text-left font-bold">検定証明書番号</th>
            </tr>
          </thead>
          <tbody>
            {data.guards.map((g, i) => (
              <tr key={g.id} className="border border-gray-400">
                <td className="px-3 py-2 text-sm text-center text-gray-400 border-r border-gray-400">{i + 1}</td>
                <td className="px-3 py-2 text-sm border-r border-gray-400">
                  {g.name}
                  {i === 0 && <span className="ml-2 text-[10px] text-brand-600 bg-brand-50 border border-brand-200 px-1 py-0.5 rounded">代表</span>}
                </td>
                <td className="px-3 py-2 text-sm text-gray-600">{g.licenseNo}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 特異事項・備考 */}
        <table className="w-full border-collapse mb-6">
          <tbody>
            <tr className="border border-gray-400">
              <td className={TD_LABEL}>特異事項</td>
              <td className={`${TD_VALUE} font-semibold ${data.incidents ? "text-red-600" : "text-green-600"}`}>
                {data.incidents ? "あり" : "なし"}
              </td>
            </tr>
            {data.incidents && (
              <tr className="border border-gray-400">
                <td className={TD_LABEL}>詳細</td>
                <td className={`${TD_VALUE} whitespace-pre-wrap`}>{data.incidentDetail}</td>
              </tr>
            )}
            {data.remarks && (
              <tr className="border border-gray-400">
                <td className={TD_LABEL}>備考</td>
                <td className={`${TD_VALUE} whitespace-pre-wrap`}>{data.remarks}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 署名欄 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-400 rounded p-3">
            <p className="text-xs font-bold text-gray-500 mb-1">警備員署名</p>
            <p className="text-sm font-medium mb-2">{data.guards[0]?.name ?? ""}</p>
            <img src={guardSig} alt="警備員署名" className="h-14 border border-gray-200 rounded bg-white" />
          </div>
          <div className="border border-gray-400 rounded p-3">
            <p className="text-xs font-bold text-gray-500 mb-1">発注者確認署名</p>
            <p className="text-sm font-medium mb-2">{clientRepName || "—"}</p>
            <img src={clientSig} alt="発注者署名" className="h-14 border border-gray-200 rounded bg-white" />
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
          本報告書は警備業法第18条に基づき作成されました。
        </p>
      </div>
    </div>
  );
}
