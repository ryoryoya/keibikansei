"use client";

import { useState } from "react";
import { DEMO_SERVICE_PLANS } from "./service-plan-types";
import { ServicePlanDetail } from "./service-plan-detail";

export function ServicePlanView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter]         = useState<"" | "1号警備" | "2号警備">("");

  const filtered = DEMO_SERVICE_PLANS.filter((p) => !filter || p.guardType === filter);
  const selected = DEMO_SERVICE_PLANS.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      {/* 法令根拠ヘッダー */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-blue-800">業務実施計画書</p>
          <p className="text-xs text-blue-600 mt-0.5">警備業法 第18条 / 施行規則 第63条 に基づく法定帳票</p>
        </div>
        <button onClick={() => alert("PDF出力（実装予定）")}
          className="px-4 py-2 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors">
          PDF出力
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 左：現場リスト */}
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["", "1号警備", "2号警備"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${filter === f ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-600 border-gray-300 hover:border-brand-300"}`}>
                {f || "すべて"}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border overflow-hidden divide-y divide-gray-100">
            {filtered.map((plan) => (
              <button key={plan.id} onClick={() => setSelectedId(plan.id)}
                className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${selectedId === plan.id ? "bg-brand-50 border-l-4 border-brand-500" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-tight">{plan.siteName}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{plan.clientName}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${plan.guardType === "1号警備" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                    {plan.guardType}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">第{plan.revisionNo}版 / 承認: {plan.approvedDate}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 右：詳細 */}
        <div className="lg:col-span-2">
          {selected ? (
            <>
              <div className="flex justify-end gap-2 mb-3">
                <button onClick={() => alert("改訂作成（実装予定）")}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  改訂版作成
                </button>
                <button onClick={() => alert("PDF出力（実装予定）")}
                  className="px-3 py-1.5 text-xs font-medium text-brand-600 border border-brand-300 rounded-lg hover:bg-brand-50 transition-colors">
                  PDF出力
                </button>
              </div>
              <ServicePlanDetail plan={selected} />
            </>
          ) : (
            <div className="bg-white rounded-xl border flex flex-col items-center justify-center py-16 text-gray-400 space-y-2">
              <span className="text-4xl">📋</span>
              <p className="text-sm">左の現場を選択して計画書を確認</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
