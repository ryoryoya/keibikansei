"use client";

import { useState } from "react";
import type { PayrollItem, PayrollRun, PayrollStatus } from "./payroll-types";
import { STATUS_CONFIG, generatePayrollRun } from "./payroll-types";
import { PayrollTable } from "./payroll-table";
import { PayslipModal } from "./payslip-modal";
import { updatePayrollStatus, calculatePayroll, getPayrollRunForView, getPayrollRunId } from "@/app/actions/payroll";

function buildMonthOptions(currentYear: number, currentMonth: number) {
  const opts: { year: number; month: number; label: string }[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    opts.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: `${d.getFullYear()}年${d.getMonth() + 1}月` });
  }
  return opts.reverse();
}

function fmt(n: number) { return n.toLocaleString("ja-JP"); }

type Props = {
  initialRun:   PayrollRun | null;
  initialYear:  number;
  initialMonth: number;
};

export function PayrollView({ initialRun, initialYear, initialMonth }: Props) {
  const [selectedYear,  setSelectedYear]  = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [currentRun,    setCurrentRun]    = useState<PayrollRun | null>(initialRun);
  const [dbRunId,       setDbRunId]       = useState<string | null>(null);
  const [selectedItem,  setSelectedItem]  = useState<PayrollItem | null>(null);
  const [calculating,   setCalculating]   = useState(false);
  const [loading,       setLoading]       = useState(false);

  const MONTH_OPTIONS = buildMonthOptions(initialYear, initialMonth);

  // デモデータは DB に存在しない月のフォールバック表示用
  const displayRun: PayrollRun = currentRun ?? generatePayrollRun(selectedYear, selectedMonth);
  const isDbData = currentRun !== null;

  async function handleMonthChange(year: number, month: number) {
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedItem(null);
    setLoading(true);
    try {
      const run = await getPayrollRunForView(year, month);
      setCurrentRun(run);
      setDbRunId(null);
    } catch (e) {
      console.error("給与データ取得エラー:", e);
      setCurrentRun(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleCalculate() {
    setCalculating(true);
    try {
      const run = await calculatePayroll(selectedYear, selectedMonth);
      setCurrentRun(run);
      setDbRunId(null); // 次のステータス変更時に再取得
    } catch (e) {
      console.error("給与計算エラー:", e);
    } finally {
      setCalculating(false);
    }
  }

  async function handleStatusChange(next: PayrollStatus) {
    // DB の run ID が未取得なら取得する
    let runId = dbRunId;
    if (!runId) {
      runId = await getPayrollRunId(selectedYear, selectedMonth);
      if (runId) setDbRunId(runId);
    }
    if (!runId) return;

    const now = new Date().toISOString();
    setCurrentRun((prev) =>
      prev ? {
        ...prev,
        status:      next,
        confirmedAt: next === "CONFIRMED" || next === "PAID" ? (prev.confirmedAt ?? now) : null,
        paidAt:      next === "PAID" ? now : null,
      } : null
    );
    try {
      await updatePayrollStatus(runId, next);
    } catch (e) {
      console.error("給与ステータス更新エラー:", e);
    }
  }

  const status    = displayRun.status;
  const statusCfg = STATUS_CONFIG[status];
  const totalGross  = displayRun.items.reduce((s, i) => s + i.grossPay,        0);
  const totalDeduct = displayRun.items.reduce((s, i) => s + i.totalDeductions, 0);
  const totalNet    = displayRun.items.reduce((s, i) => s + i.netPay,          0);

  return (
    <div className="min-h-full bg-gray-50 -m-6">
      {/* ページヘッダー */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">給与管理</h1>
            <p className="text-sm text-gray-500 mt-0.5">月次給与の計算・確定・振込処理</p>
          </div>
          {/* 月選択 */}
          <div className="flex gap-2">
            {MONTH_OPTIONS.map((opt) => (
              <button
                key={`${opt.year}-${opt.month}`}
                onClick={() => handleMonthChange(opt.year, opt.month)}
                className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
                  opt.year === selectedYear && opt.month === selectedMonth
                    ? "bg-brand-500 text-white border-brand-500"
                    : "bg-white text-gray-600 border-gray-300 hover:border-brand-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* 未計算バナー */}
        {!isDbData && !loading && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-800">
                {selectedYear}年{selectedMonth}月の給与はまだ計算されていません
              </p>
              <p className="text-sm text-amber-600 mt-0.5">
                打刻済みの勤怠データをもとに給与を自動計算します
              </p>
            </div>
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className={`ml-4 px-5 py-2.5 text-sm font-bold rounded-xl transition-colors whitespace-nowrap ${
                calculating
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-amber-500 text-white hover:bg-amber-600"
              }`}
            >
              {calculating ? "計算中..." : "給与を計算する"}
            </button>
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="text-center py-8 text-gray-400">データを読み込み中...</div>
        )}

        {/* DB計算済みバナー */}
        {isDbData && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <p className="text-sm text-blue-700">
              打刻データから計算済み（{displayRun.items.length}名 / {displayRun.items.reduce((s, i) => s + i.workDays, 0)}勤務日）
            </p>
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="text-xs text-blue-600 underline hover:text-blue-800"
            >
              {calculating ? "再計算中..." : "再計算する"}
            </button>
          </div>
        )}

        {/* サマリーカード */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border px-4 py-3">
            <p className="text-xs text-gray-500">対象人数</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {displayRun.items.length}<span className="text-sm font-normal text-gray-500 ml-1">名</span>
            </p>
          </div>
          <div className="bg-white rounded-xl border px-4 py-3">
            <p className="text-xs text-gray-500">支給合計</p>
            <p className="text-xl font-bold text-gray-900 mt-1">¥{fmt(totalGross)}</p>
          </div>
          <div className="bg-white rounded-xl border px-4 py-3">
            <p className="text-xs text-gray-500">控除合計</p>
            <p className="text-xl font-bold text-red-600 mt-1">-¥{fmt(totalDeduct)}</p>
          </div>
          <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3">
            <p className="text-xs text-brand-600">差引支給額（振込）</p>
            <p className="text-xl font-bold text-brand-700 mt-1">¥{fmt(totalNet)}</p>
          </div>
        </div>

        {/* ステータス・アクションバー */}
        <div className="bg-white rounded-xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-sm text-gray-500">ステータス</span>
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${statusCfg.bg}`}>
              {statusCfg.label}
            </span>
            {displayRun.confirmedAt && (
              <span className="text-xs text-gray-400">
                確定: {new Date(displayRun.confirmedAt).toLocaleDateString("ja-JP")}
              </span>
            )}
            {displayRun.paidAt && (
              <span className="text-xs text-gray-400">
                支払: {new Date(displayRun.paidAt).toLocaleDateString("ja-JP")}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {status === "DRAFT" && isDbData && (
              <button
                onClick={() => handleStatusChange("CONFIRMED")}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors"
              >
                給与を確定する
              </button>
            )}
            {status === "CONFIRMED" && (
              <>
                <button
                  onClick={() => handleStatusChange("DRAFT")}
                  className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  差し戻す
                </button>
                <button
                  onClick={() => handleStatusChange("PAID")}
                  className="px-4 py-2 text-sm font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl"
                >
                  振込完了にする
                </button>
              </>
            )}
            {status === "PAID" && (
              <button disabled className="px-4 py-2 text-sm font-medium text-gray-400 border border-gray-200 rounded-xl cursor-not-allowed">
                支払済み
              </button>
            )}
            <button
              onClick={() => alert("FBデータ出力（全銀フォーマット）（実装予定）")}
              className="px-4 py-2 text-sm font-medium text-brand-600 border border-brand-300 rounded-xl hover:bg-brand-50"
            >
              FBデータ出力
            </button>
          </div>
        </div>

        {/* テーブル */}
        {!loading && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">隊員別給与一覧</h2>
              <div className="flex items-center gap-2">
                {!isDbData && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">デモデータ表示中</span>
                )}
                <span className="text-xs text-gray-400">{displayRun.items.length}名</span>
              </div>
            </div>
            <PayrollTable items={displayRun.items} onSelect={setSelectedItem} />
          </div>
        )}

        <p className="text-xs text-gray-400 text-center pb-4">
          ※ 社会保険料率: 健保5.15% / 厚年9.15% / 雇保0.6%（2024年度概算 / 労働者負担分）
        </p>
      </div>

      <PayslipModal item={selectedItem} status={status} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
