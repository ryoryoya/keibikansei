"use client";

import { ServicePlan } from "./service-plan-types";

type Props = { plan: ServicePlan };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-1 mb-3">{title}</h4>
      {children}
    </div>
  );
}

export function ServicePlanDetail({ plan }: Props) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* ドキュメントヘッダー */}
      <div className="bg-brand-500 px-5 py-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-brand-200">業務実施計画書　第{plan.revisionNo}版</p>
            <h3 className="font-bold text-base mt-0.5">{plan.siteName}</h3>
            <p className="text-brand-200 text-xs mt-1">{plan.clientName}　｜　{plan.address}</p>
          </div>
          <div className="text-right text-xs text-brand-200 shrink-0">
            <p>承認日: {plan.approvedDate}</p>
            <p className="mt-0.5">{plan.guardType}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-6 text-sm">
        {/* 基本情報 */}
        <Section title="契約・勤務情報">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div><span className="text-gray-500">契約期間</span><p className="font-medium">{plan.contractStart} 〜 {plan.contractEnd ?? "継続中"}</p></div>
            <div><span className="text-gray-500">勤務時間</span><p className="font-medium">{plan.serviceHours}</p></div>
            <div><span className="text-gray-500">配置人数</span><p className="font-medium">{plan.requiredGuards}名</p></div>
            <div><span className="text-gray-500">必要資格</span><p className="font-medium">{plan.requiredQualifications.join("・") || "なし"}</p></div>
            <div><span className="text-gray-500">依頼主担当</span><p className="font-medium">{plan.clientContactName}</p></div>
            <div><span className="text-gray-500">連絡先</span><p className="font-medium">{plan.clientContactPhone}</p></div>
            <div className="col-span-2"><span className="text-gray-500">警備責任者</span><p className="font-medium">{plan.supervisorName}</p></div>
          </div>
        </Section>

        {/* 業務内容 */}
        <Section title="警備業務内容">
          <ul className="space-y-1">
            {plan.duties.map((d, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-brand-400 font-bold shrink-0">•</span>{d}
              </li>
            ))}
          </ul>
        </Section>

        {/* 巡回経路 */}
        <Section title="巡回経路・業務分担">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {["順番","場所","実施事項","頻度"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-gray-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plan.patrolRoutes.map((r) => (
                  <tr key={r.order} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-center text-gray-400 font-medium">{r.order}</td>
                    <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{r.location}</td>
                    <td className="px-3 py-2 text-gray-600">{r.action}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px]">{r.frequency}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 緊急時対応 */}
        <Section title="緊急時対応手順">
          <div className="space-y-3">
            {plan.emergencyProcedures.map((p, i) => (
              <div key={i} className="bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-xs font-bold text-red-700 mb-1">■ {p.situation}</p>
                <p className="text-xs text-gray-700 leading-relaxed">{p.action}</p>
                <p className="text-[10px] text-red-500 mt-1">連絡先: {p.contact}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 使用機材 */}
        <Section title="使用機材・装備品">
          <div className="flex flex-wrap gap-2">
            {plan.equipment.map((eq) => (
              <span key={eq} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-lg">{eq}</span>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
