"use client";

import type { DailyReport } from "./daily-report-types";

type Props = { report: DailyReport; onClose: () => void };

// 和暦変換（簡易）
function toWareki(dateStr: string) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const reiwaBase = 2018;
  const reiwa = year - reiwaBase;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const week = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `令和 ${reiwa} 年 ${month} 月 ${day} 日（${week}曜日）`;
}

export default function DailyReportPrint({ report, onClose }: Props) {
  const handlePrint = () => window.print();

  const tdBase = "border border-gray-800 px-1 py-0.5 text-xs";
  const thBase = "border border-gray-800 px-1 py-0.5 text-xs bg-gray-100 font-normal text-center";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white w-[780px] min-h-[1050px] rounded shadow-xl my-4">
        {/* 操作バー（印刷時非表示） */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 print:hidden">
          <span className="text-sm font-medium text-gray-700">印刷プレビュー</span>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-4 py-1.5 text-sm bg-brand-500 text-white rounded hover:bg-brand-600">
              印刷 / PDF保存
            </button>
            <button onClick={onClose} className="px-4 py-1.5 text-sm border rounded hover:bg-gray-100">
              閉じる
            </button>
          </div>
        </div>

        {/* 報告書本体 */}
        <div className="p-8 font-['serif'] text-sm" id="print-area">
          {/* 会社控え表示 */}
          <div className="flex justify-between text-xs mb-1">
            <span>（会 社 控）</span>
            <span>（No.　　）</span>
          </div>

          {/* タイトル */}
          <h1 className="text-center text-2xl font-bold tracking-widest mb-4">警 備 報 告 書</h1>

          {/* お客様名・サイン */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <span className="font-bold text-base">お客様名</span>
              <span className="text-lg font-bold underline underline-offset-4 min-w-[200px]">
                {report.clientName}　様
              </span>
            </div>
            <div className="border border-gray-800 w-24 h-16 flex items-center justify-center text-xs text-gray-400">
              サイン
            </div>
          </div>

          {/* 実施日 */}
          <p className="text-center mb-3">実施日　{toWareki(report.reportDate)}</p>

          {/* メイングリッド */}
          <table className="w-full border-collapse mb-3">
            <tbody>
              <tr>
                <td className={thBase}>開始時刻</td>
                <td className={`${tdBase} text-center w-20`}>{report.startTime}</td>
                <td className={thBase}>終了時刻</td>
                <td className={`${tdBase} text-center w-20`}>{report.endTime}</td>
                <td className={thBase}>休憩時間</td>
                <td className={`${tdBase} text-center w-20`}>{report.breakTime}</td>
              </tr>
              <tr>
                <td className={thBase}>車両台数</td>
                <td className={`${tdBase} text-center`}>{report.vehicles !== "" ? `${report.vehicles} 台` : ""}</td>
                <td className={thBase}>走行距離</td>
                <td className={`${tdBase} text-center`}>{report.totalDistance !== "" ? `${report.totalDistance} km` : ""}</td>
                <td className={thBase}>元請CD</td>
                <td className={`${tdBase} text-center`}>{report.motoukeCd}</td>
              </tr>
              <tr>
                <td className={thBase}>出動人数</td>
                <td className={`${tdBase} text-center`}>{report.headcount !== "" ? `${report.headcount} 人` : ""}</td>
                <td className={thBase}>工事名</td>
                <td colSpan={3} className={tdBase}>{report.constructionName}</td>
              </tr>
              <tr>
                <td className={thBase}>警備員名</td>
                <td colSpan={5} className={tdBase}>{report.guardNames}</td>
              </tr>
              <tr>
                <td className={thBase}>施工会社</td>
                <td colSpan={2} className={tdBase}>{report.constructionCompany}</td>
                <td className={thBase}>班名</td>
                <td colSpan={2} className={tdBase}>{report.teamName}　班</td>
              </tr>
            </tbody>
          </table>

          {/* 施工場所テーブル */}
          <table className="w-full border-collapse mb-3">
            <thead>
              <tr>
                <th className={`${thBase} w-8`}>No.</th>
                <th className={`${thBase} w-36`}>時間区分<br /><span className="text-[10px]">〜</span></th>
                <th className={thBase}>施工場所</th>
                <th className={`${thBase} w-16`}>走行距離</th>
              </tr>
            </thead>
            <tbody>
              {report.locations.map((loc, i) => (
                <tr key={i} className="h-8">
                  <td className={`${tdBase} text-center`}>({i + 1})</td>
                  <td className={`${tdBase} text-center`}>
                    {loc.timeStart && loc.timeEnd ? `${loc.timeStart} 〜 ${loc.timeEnd}` : ""}
                  </td>
                  <td className={tdBase}>{loc.location}</td>
                  <td className={`${tdBase} text-right`}>{loc.distance !== "" ? `${loc.distance}` : ""}　km</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 会社記入欄 */}
          <table className="w-full border-collapse mb-3">
            <thead>
              <tr>
                <th colSpan={4} className={`${thBase} text-center`}>会社記入欄</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={thBase}>工事名</td>
                <td className={tdBase}>{report.constructionName}</td>
                <td className={thBase}>エリア跨</td>
                <td className={`${tdBase} text-center w-20`}>{report.areaSpan !== "" ? `${report.areaSpan} 人` : "　　人"}</td>
              </tr>
              <tr>
                <td className={thBase}>宿泊先</td>
                <td className={tdBase}>{report.stayLocation}</td>
                <td className={thBase}>宿泊人数</td>
                <td className={`${tdBase} text-center`}>{report.stayCount !== "" ? `${report.stayCount} 人` : "　　人"}</td>
              </tr>
              <tr>
                <td className={thBase}>宿泊者名</td>
                <td colSpan={3} className={tdBase}>{report.stayPersons}</td>
              </tr>
              <tr>
                <td className={thBase}>補正①</td>
                <td className={tdBase}>
                  {report.correction1Label}
                  {report.correction1Amount !== "" ? `　${Number(report.correction1Amount).toLocaleString()} 円` : ""}
                </td>
                <td className={thBase}>補正②</td>
                <td className={tdBase}>
                  {report.correction2Label}
                  {report.correction2Amount !== "" ? `　${Number(report.correction2Amount).toLocaleString()} 円` : ""}
                </td>
              </tr>
              <tr className="h-12">
                <td className={thBase}>備考</td>
                <td colSpan={3} className={tdBase}>{report.remarks}</td>
              </tr>
              <tr>
                <td className={thBase}>警備会社</td>
                <td className={tdBase}>{report.companyName}</td>
                <td className={thBase}>委託CD</td>
                <td className={`${tdBase} text-center`}>{report.itakuCd}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
