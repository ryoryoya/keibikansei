"use client";

import { useState } from "react";
import { RosterView }      from "./roster-view";
import { EducationView }   from "./education-view";
import { ServicePlanView } from "./service-plan-view";
import { ComplaintView }   from "./complaint-view";
import { WorkReportView }  from "./work-report-view";

const TABS = [
  { id: "workReport",  label: "業務日報",       icon: "📄" },
  { id: "roster",      label: "警備員名簿",     icon: "👤" },
  { id: "education",   label: "教育記録簿",     icon: "📚" },
  { id: "servicePlan", label: "業務実施計画書", icon: "📋" },
  { id: "complaint",   label: "苦情処理簿",     icon: "📝" },
] as const;

type TabId = typeof TABS[number]["id"];

export function ReportsView() {
  const [activeTab, setActiveTab] = useState<TabId>("workReport");

  return (
    <div className="min-h-full bg-gray-50 -m-6">
      {/* ページヘッダー */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">法定帳票</h1>
        <p className="text-sm text-gray-500 mt-0.5">立入検査対応 — 警備業法に基づく法定帳票の管理・出力</p>
      </div>

      {/* タブバー */}
      <div className="bg-white border-b px-6 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* コンテンツ */}
      <div className="px-6 py-5">
        {activeTab === "workReport"  && <WorkReportView />}
        {activeTab === "roster"      && <RosterView />}
        {activeTab === "education"   && <EducationView />}
        {activeTab === "servicePlan" && <ServicePlanView />}
        {activeTab === "complaint"   && <ComplaintView />}
      </div>
    </div>
  );
}
