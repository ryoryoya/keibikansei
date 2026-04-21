"use client";

import { useEffect } from "react";
import { Invoice, InvoiceStatus, INVOICE_STATUS_CONFIG } from "./invoices-types";

type Props = {
  invoice: Invoice | null;
  onClose: () => void;
  onStatusChange: (id: string, next: InvoiceStatus, paidAt?: string) => void;
};

function fmt(n: number) {
  return n.toLocaleString("ja-JP");
}

export function InvoiceModal({ invoice, onClose, onStatusChange }: Props) {
  useEffect(() => {
    if (!invoice) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [invoice, onClose]);

  if (!invoice) return null;

  const cfg = INVOICE_STATUS_CONFIG[invoice.status];
  const isOverdue = invoice.status === "OVERDUE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className={`px-6 py-4 rounded-t-2xl text-white flex items-start justify-between ${isOverdue ? "bg-red-500" : "bg-brand-500"}`}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{invoice.invoiceNo}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg}`}>{cfg.label}</span>
            </div>
            <p className="text-white/80 text-sm mt-0.5">{invoice.clientName}</p>
            <p className="text-white/60 text-xs mt-0.5">
              {invoice.year}年{invoice.month}月分 / 発行日: {invoice.issueDate} / 支払期限: {invoice.dueDate}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* 勤務実績明細 */}
          {invoice.workRecords.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                勤務実績明細
                <span className="ml-2 text-gray-400 font-normal normal-case">全 {invoice.workRecords.length} 件</span>
              </h3>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500 font-semibold">日付</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-semibold">現場</th>
                      <th className="px-3 py-2 text-center text-gray-500 font-semibold">人数</th>
                      <th className="px-3 py-2 text-right text-gray-500 font-semibold">単価</th>
                      <th className="px-3 py-2 text-right text-gray-500 font-semibold">金額</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoice.workRecords.map((rec, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap tabular-nums">{rec.dateLabel}</td>
                        <td className="px-3 py-2 text-gray-800">{rec.projectName}</td>
                        <td className="px-3 py-2 text-center font-medium text-gray-800">{rec.guardCount}名</td>
                        <td className="px-3 py-2 text-right text-gray-500 tabular-nums">¥{fmt(rec.unitPrice)}</td>
                        <td className="px-3 py-2 text-right text-gray-800 tabular-nums">¥{fmt(rec.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 請求明細 */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">請求明細</h3>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-gray-500 font-semibold">項目</th>
                    <th className="px-4 py-2.5 text-center text-gray-500 font-semibold">数量</th>
                    <th className="px-4 py-2.5 text-right text-gray-500 font-semibold">単価</th>
                    <th className="px-4 py-2.5 text-right text-gray-500 font-semibold">金額</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.lineItems.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800">{item.description}</td>
                      <td className="px-4 py-3 text-center text-gray-600 tabular-nums">
                        {item.quantity}{item.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 tabular-nums">¥{fmt(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800 tabular-nums">¥{fmt(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 金額サマリー */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">小計（税抜）</span>
              <span className="tabular-nums text-gray-800">¥{fmt(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">消費税（10%）</span>
              <span className="tabular-nums text-gray-800">¥{fmt(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-800">請求金額合計（税込）</span>
              <span className="text-xl font-bold text-brand-700 tabular-nums">¥{fmt(invoice.totalAmount)}</span>
            </div>
          </div>

          {/* 備考 */}
          {invoice.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <span className="font-semibold">備考: </span>{invoice.notes}
            </div>
          )}

          {/* 入金情報 */}
          {invoice.paidAt && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
              入金確認日: {new Date(invoice.paidAt).toLocaleDateString("ja-JP")}
            </div>
          )}
        </div>

        {/* アクションフッター */}
        <div className="px-6 py-4 border-t flex flex-wrap items-center gap-2 justify-between">
          <div className="flex gap-2">
            {invoice.status === "DRAFT" && (
              <button
                onClick={() => { onStatusChange(invoice.id, "ISSUED"); onClose(); }}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors"
              >
                請求書を発行する
              </button>
            )}
            {(invoice.status === "ISSUED" || invoice.status === "OVERDUE") && (
              <button
                onClick={() => { onStatusChange(invoice.id, "PAID", new Date().toISOString()); onClose(); }}
                className="px-4 py-2 text-sm font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors"
              >
                入金済みにする
              </button>
            )}
            {invoice.status === "ISSUED" && (
              <button
                onClick={() => { onStatusChange(invoice.id, "DRAFT"); onClose(); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                下書きに戻す
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => alert("PDF出力（実装予定）")}
              className="px-4 py-2 text-sm font-medium text-brand-600 border border-brand-300 rounded-xl hover:bg-brand-50 transition-colors"
            >
              PDF出力
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
