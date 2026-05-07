"use client";

// ============================================================
// 日報OCRアップロードモーダル
// 画像を選択 → Claude Vision でOCR → DailyReport 形式に変換
// ============================================================

import { useState, useRef } from "react";
import { ocrDailyReport, type OcrResponse } from "@/app/actions/ocr";
import type { DailyReport, GuardOption, WorkLocation } from "./daily-report-types";
import { newReport, EMPTY_LOCATIONS, DEMO_COMPANY } from "./daily-report-types";

type Props = {
  guards: GuardOption[];
  onConfirm: (r: DailyReport) => void;
  onCancel: () => void;
};

// base64変換（data URLプレフィックスを除去）
async function fileToBase64(file: File): Promise<{ data: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(",");
      resolve({ data: result.slice(commaIdx + 1), mime: file.type });
    };
    reader.onerror = () => reject(new Error("ファイル読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });
}

// OCR結果を DailyReport 形式にマージ
function ocrToReport(
  ocr: Extract<OcrResponse, { ok: true }>,
  guards: GuardOption[]
): DailyReport {
  const base = newReport();
  const d = ocr.data;

  // 施工場所（最大4箇所に揃える）
  const locs: WorkLocation[] = [...EMPTY_LOCATIONS.map((l) => ({ ...l }))];
  d.locations.forEach((loc, i) => {
    if (i >= 4) return;
    locs[i] = {
      timeStart: loc.timeStart ?? "",
      timeEnd: loc.timeEnd ?? "",
      location: loc.location ?? "",
      distance: loc.distance ?? "",
    };
  });

  // 警備員IDリストから表示用氏名を生成
  const matchedGuards = guards.filter((g) => ocr.matchedGuardIds.includes(g.id));
  const guardNamesDisplay = matchedGuards.map((g) => g.name).join("　");

  return {
    ...base,
    clientId: ocr.matchedClientId ?? "",
    clientName: d.clientName ?? "",
    reportDate: d.reportDate ?? base.reportDate,
    startTime: d.startTime ?? base.startTime,
    endTime: d.endTime ?? base.endTime,
    breakTime: d.breakTime ?? base.breakTime,
    vehicles: d.vehicles ?? "",
    totalDistance: d.totalDistance ?? "",
    motoukeCd: d.motoukeCd ?? "",
    headcount: d.headcount ?? "",
    constructionName: d.constructionName ?? "",
    guardIds: ocr.matchedGuardIds,
    guardNames: guardNamesDisplay || d.guardNames.join("　"),
    constructionCompany: d.constructionCompany ?? "",
    teamName: d.teamName ?? "",
    locations: locs,
    areaSpan: d.areaSpan ?? "",
    stayLocation: d.stayLocation ?? "",
    stayCount: d.stayCount ?? "",
    stayPersons: d.stayPersons ?? "",
    remarks: d.remarks ?? "",
    companyName: DEMO_COMPANY.name,
    itakuCd: DEMO_COMPANY.itakuCd,
  };
}

export default function OcrUpload({ guards, onConfirm, onCancel }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Extract<OcrResponse, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (f: File | null) => {
    setError(null);
    setResult(null);
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(f.type)) {
      setError("対応形式: JPEG / PNG / GIF / WebP");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("画像サイズは5MB以下にしてください");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleRunOcr = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const { data, mime } = await fileToBase64(file);
      const res = await ocrDailyReport({
        imageBase64: data,
        mediaType: mime as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
      });
      if (!res.ok) {
        setError(res.error);
      } else {
        setResult(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR処理に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!result) return;
    onConfirm(ocrToReport(result, guards));
  };

  const confidenceColor = (c: "high" | "medium" | "low") =>
    c === "high" ? "text-green-600" : c === "medium" ? "text-yellow-600" : "text-red-600";
  const confidenceLabel = (c: "high" | "medium" | "low") =>
    c === "high" ? "高" : c === "medium" ? "中" : "低";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">📷 日報OCR読み込み</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* ファイル選択 */}
          {!result && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日報画像を選択（JPEG / PNG / GIF / WebP、5MB以下）
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
              {previewUrl && (
                <div className="mt-3 border rounded-lg p-2 bg-gray-50">
                  <img src={previewUrl} alt="プレビュー" className="max-h-64 mx-auto" />
                </div>
              )}
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* 実行前 */}
          {!result && (
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                キャンセル
              </button>
              <button
                onClick={handleRunOcr}
                disabled={!file || loading}
                className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "🤖 OCR実行中..." : "🤖 OCRで読み取る"}
              </button>
            </div>
          )}

          {/* OCR結果プレビュー */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-brand-50 border border-brand-200 rounded-lg">
                <span className="text-sm">
                  読み取り信頼度：
                  <span className={`font-bold ${confidenceColor(result.data.confidence)}`}>
                    {confidenceLabel(result.data.confidence)}
                  </span>
                </span>
                <span className="text-xs text-gray-500">
                  （キャッシュ: {result.usage.cacheReadTokens.toLocaleString()}トークン / 新規: {result.usage.inputTokens.toLocaleString()}トークン）
                </span>
              </div>

              {/* 読み取れなかった項目 */}
              {result.data.unreadableFields.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  ⚠️ 以下は読み取れませんでした（フォームで手入力してください）：
                  <div className="mt-1 text-xs">{result.data.unreadableFields.join("、")}</div>
                </div>
              )}

              {/* 抽出結果サマリ */}
              <div className="border rounded-lg overflow-hidden text-sm">
                <div className="grid grid-cols-2 divide-x divide-y">
                  <Row label="日付" value={result.data.reportDate} />
                  <Row label="得意先" value={result.data.clientName} ok={!!result.matchedClientId} />
                  <Row label="工事名" value={result.data.constructionName} />
                  <Row label="施工会社" value={result.data.constructionCompany} />
                  <Row label="開始〜終了" value={`${result.data.startTime ?? ""} 〜 ${result.data.endTime ?? ""}`} />
                  <Row label="出動人数" value={result.data.headcount?.toString() ?? null} />
                  <Row
                    label="警備員"
                    value={result.data.guardNames.join("、")}
                    ok={result.matchedGuardIds.length === result.data.guardNames.length}
                    hint={`マスタ照合: ${result.matchedGuardIds.length}/${result.data.guardNames.length}名`}
                  />
                  <Row label="班名" value={result.data.teamName} />
                </div>
                {result.data.locations.length > 0 && (
                  <div className="p-3 border-t bg-gray-50">
                    <div className="text-xs text-gray-500 mb-1">施工場所（{result.data.locations.length}箇所）</div>
                    <ul className="space-y-1 text-xs">
                      {result.data.locations.map((loc, i) => (
                        <li key={i}>
                          {loc.timeStart ?? "?"}〜{loc.timeEnd ?? "?"} {loc.location ?? "（不明）"}
                          {loc.distance !== null && ` / ${loc.distance}km`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  やり直す
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                >
                  フォームに反映して編集
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  ok,
  hint,
}: {
  label: string;
  value: string | null;
  ok?: boolean;
  hint?: string;
}) {
  const hasValue = value !== null && value !== "" && value !== " 〜 ";
  return (
    <div className="p-3">
      <div className="text-xs text-gray-500 flex items-center justify-between">
        <span>{label}</span>
        {ok === false && hasValue && (
          <span className="text-xs text-yellow-600">⚠ マスタ未登録</span>
        )}
      </div>
      <div className={`mt-0.5 ${hasValue ? "text-gray-900" : "text-gray-400 italic"}`}>
        {hasValue ? value : "（読み取れず）"}
      </div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}
