"use client";

import { useState, useMemo, useEffect } from "react";
import type { Invoice, InvoiceStatus } from "./invoices-types";
import { INVOICE_STATUS_CONFIG, DEMO_INVOICES } from "./invoices-types";
import { InvoiceModal } from "./invoice-modal";
import { updateInvoiceStatus, generateInvoices, getInvoicesForView } from "@/app/actions/invoices";

function buildMonthOptions(currentYear: number, currentMonth: number) {
  const opts: { year: number; month: number; label: string }[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    opts.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: `${d.getFullYear()}年${d.getMonth() + 1}月` });
  }
  return opts.reverse();
}

function fmt(n: number) { return n.toLocaleString("ja-JP"); }

const STATUS_FILTERS: { value: "" | InvoiceStatus; label: string }[] = [
  { value: "",         label: "すべて" },
  { value: "DRAFT",   label: "下書き" },
  { value: "ISSUED",  label: "発行済み" },
  { value: "OVERDUE", label: "期限超過" },
  { value: "PAID",    label: "入金済み" },
];

type Props = {
  initialInvoices: Invoice[];
  initialYear:     number;
  initialMonth:    number;
};

export function InvoicesView({ initialInvoices, initialYear, initialMonth }: Props) {
  const [selectedYear,   setSelectedYear]   = useState(initialYear);
  const [selectedMonth,  setSelectedMonth]  = useState(initialMonth);
  const [invoices,       setInvoices]       = useState<Invoice[]>(
    initialInvoices.length > 0 ? initialInvoices : DEMO_INVOICES
  );
  const [isDbData,       setIsDbData]       = useState(initialInvoices.length > 0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusFilter,   setStatusFilter]   = useState<"" | InvoiceStatus>("");
  const [search,         setSearch]         = useState("");
  const [generating,     setGenerating]     = useState(false);
  const [loading,        setLoading]        = useState(false);

  const MONTH_OPTIONS = buildMonthOptions(initialYear, initialMonth);

  // サーバー側データが変わったら同期
  useEffect(() => {
    if (initialInvoices.length > 0) {
      setInvoices(initialInvoices);
      setIsDbData(true);
    }
  }, [initialInvoices]);

  async function handleMonthChange(year: number, month: number) {
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedInvoice(null);
    setStatusFilter("");
    setLoading(true);
    try {
      const data = await getInvoicesForView(year, month);
      if (data.length > 0) {
        setInvoices(data);
        setIsDbData(true);
      } else {
        setInvoices(DEMO_INVOICES);
        setIsDbData(false);
      }
    } catch (e) {
      console.error("請求書取得エラー:", e);
      setInvoices(DEMO_INVOICES);
      setIsDbData(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const data = await generateInvoices(selectedYear, selectedMonth);
      if (data.length > 0) {
        setInvoices(data);
        setIsDbData(true);
      }
    } catch (e) {
      console.error("請求書生成エラー:", e);
    } finally {
      setGenerating(false);
    }
  }

  async function handleStatusChange(id: string, next: InvoiceStatus, paidAt?: string) {
    // 期限超過はフロント表示のみ（DB 書き込み不要）
    const now = new Date().toISOString().slice(0, 10);
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? { ...inv, status: next, paidAt: next === "PAID" ? (paidAt ?? now) : inv.paidAt }
          : inv
      )
    );
    if (next !== "OVERDUE" && isDbData) {
      try {
        await updateInvoiceStatus(id, next as "DRAFT" | "ISSUED" | "PAID");
      } catch (e) {
        console.error("請求書ステータス更新エラー:", e);
      }
    }
  }

  const filtered = useMemo(() => {
    const now = new Date();
    return invoices
      .map((inv) => {
        // 期限超過チェック
        const isOverdue = inv.status === "ISSUED" && inv.dueDate && new Date(inv.dueDate) < now;
        return isOverdue ? { ...inv, status: "OVERDUE" as InvoiceStatus } : inv;
      })
      .filter((inv) => {
        if (statusFilter && inv.status !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!inv.clientName.toLowerCase().includes(q) && !inv.invoiceNo.toLowerCase().includes(q)) return false;
        }
        return true;
      });
  }, [invoices, statusFilter, search]);

  const totalIssued  = invoices.filter((i) => i.status === "ISSUED" || i.status === "OVERDUE").reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid    = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.totalAmount, 0);
  const overdueCount = invoices.filter((i) => {
    return i.status === "ISSUED" && i.dueDate && new Date(i.dueDate) < new Date();
  }).length;

  return (
    <div className="min-h-full bg-gray-50 -m-6">
      {/* ページヘッダー */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">請求書管理</h1>
            <p className="text-sm text-gray-500 mt-0.5">得意先への請求書発行・入金管理</p>
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
        {/* 未生成バナー */}
        {!isDbData && !loading && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-800">
                {selectedYear}年{selectedMonth}月の請求書はまだ生成されていません
              </p>
              <p className="text-sm text-amber-600 mt-0.5">
                完了した配置実績をもとに得意先ごとの請求書を自動生成します
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`ml-4 px-5 py-2.5 text-sm font-bold rounded-xl transition-colors whitespace-nowrap ${
                generating
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-amber-500 text-white hover:bg-amber-600"
              }`}
            >
              {generating ? "生成中..." : "請求書を生成する"}
            </button>
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="text-center py-8 text-gray-400">データを読み込み中...</div>
        )}

        {/* DB生成済みバナー */}
        {isDbData && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <p className="text-sm text-blue-700">
              配置実績から生成済み（{invoices.length}社）
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-xs text-blue-600 underline hover:text-blue-800"
            >
              {generating ? "再生成中..." : "再生成する"}
            </button>
          </div>
        )}

        {/* サマリーカード */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border px-4 py-3">
            <p className="text-xs text-gray-500">請求件数</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {invoices.length}<span className="text-sm font-normal text-gray-500 ml-1">件</span>
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-600">未収金額</p>
            <p className="text-xl font-bold text-blue-700 mt-1">¥{fmt(totalIssued)}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-xs text-green-600">入金済み</p>
            <p className="text-xl font-bold text-green-700 mt-1">¥{fmt(totalPaid)}</p>
          </div>
          <div className={`rounded-xl border px-4 py-3 ${overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
            <p className={`text-xs ${overdueCount > 0 ? "text-red-600" : "text-gray-500"}`}>期限超過</p>
            <p className={`text-2xl font-bold mt-1 ${overdueCount > 0 ? "text-red-700" : "text-gray-400"}`}>
              {overdueCount}<span className="text-sm font-normal ml-1">件</span>
            </p>
          </div>
        </div>

        {/* フィルター */}
        {!loading && (
          <div className="bg-white rounded-xl border px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                    statusFilter === f.value
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-white text-gray-600 border-gray-300 hover:border-brand-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="得意先名・請求書番号で検索"
              className="input sm:w-64"
            />
          </div>
        )}

        {/* 請求書一覧 */}
        {!loading && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">請求書一覧</h2>
              <div className="flex items-center gap-2">
                {!isDbData && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">デモデータ表示中</span>
                )}
                <span className="text-xs text-gray-400">{filtered.length}件</span>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400">
                <p className="text-4xl mb-3">📑</p>
                <p>該当する請求書がありません</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500">請求書番号</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-500">得意先</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500">対象月</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500">発行日</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500">支払期限</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-500">請求金額（税込）</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500">ステータス</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((inv) => {
                      const cfg = INVOICE_STATUS_CONFIG[inv.status];
                      return (
                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">{inv.invoiceNo}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{inv.clientName}</td>
                          <td className="px-4 py-3 text-center text-gray-600 whitespace-nowrap">{inv.year}年{inv.month}月</td>
                          <td className="px-4 py-3 text-center text-gray-600 whitespace-nowrap">{inv.issueDate}</td>
                          <td className={`px-4 py-3 text-center whitespace-nowrap ${inv.status === "OVERDUE" ? "text-red-600 font-medium" : "text-gray-600"}`}>
                            {inv.dueDate}
                            {inv.status === "OVERDUE" && <span className="ml-1 text-xs">⚠</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums whitespace-nowrap">
                            ¥{fmt(inv.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="px-3 py-1.5 text-xs font-medium text-brand-600 border border-brand-300 rounded-lg hover:bg-brand-50 transition-colors whitespace-nowrap"
                            >
                              詳細
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <InvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
