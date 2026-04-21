"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProjectModal, { type Project } from "./project-modal";
import { upsertProject } from "@/app/actions/projects";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProject(r: any): Project {
  return {
    id:             r.id,
    siteId:         r.siteId        ?? "",
    siteName:       r.site?.name    ?? "",
    clientName:     r.site?.client?.name ?? "",
    name:           r.name,
    workStyle:      r.workStyle     ?? "DAY_SHIFT",
    startDate:      r.startDate ? r.startDate.toISOString().slice(0, 10) : "",
    endDate:        r.endDate   ? r.endDate.toISOString().slice(0, 10)   : "",
    startTime:      r.startTime ?? "08:00",
    endTime:        r.endTime   ?? "17:00",
    requiredGuards: r.requiredGuards ?? 1,
    unitPrice:      r.unitPrice      ?? 0,
    guardPay:       r.guardPay       ?? 0,
    status:         r.status         ?? "DRAFT",
    notes:          r.notes          ?? "",
  };
}

const WORK_STYLE_LABELS: Record<string, string> = {
  DAY_SHIFT: "日勤",
  NIGHT_SHIFT: "夜勤",
  RESIDENT: "常駐",
  DAY_NIGHT: "日夜勤",
  EVENT: "イベント",
  OTHER: "その他",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "下書き",
  ACTIVE: "稼働中",
  COMPLETED: "完了",
  CANCELLED: "中止",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const DEMO_SITES = [
  { id: "s1", name: "SBビル 常駐警備", clientName: "SBビルマネジメント株式会社" },
  { id: "s2", name: "新宿区 道路工事現場", clientName: "東京建設株式会社" },
  { id: "s3", name: "渋谷区 ビル解体現場", clientName: "東京建設株式会社" },
  { id: "s4", name: "渋谷本社 施設警備", clientName: "渋谷商事株式会社" },
  { id: "s5", name: "横浜倉庫 夜間警備", clientName: "神奈川物流センター" },
];

const DEMO_PROJECTS: Project[] = [
  { id: "p1", siteId: "s1", siteName: "SBビル 常駐警備", clientName: "SBビルマネジメント株式会社", name: "[A現場] 施設警備 常駐", workStyle: "RESIDENT", startDate: "2026-01-01", endDate: "", startTime: "08:00", endTime: "17:00", requiredGuards: 3, unitPrice: 18000, guardPay: 11000, status: "ACTIVE", notes: "" },
  { id: "p2", siteId: "s2", siteName: "新宿区 道路工事現場", clientName: "東京建設株式会社", name: "[B現場] 交通誘導 日勤", workStyle: "DAY_SHIFT", startDate: "2026-03-01", endDate: "2026-05-31", startTime: "08:00", endTime: "17:00", requiredGuards: 5, unitPrice: 16000, guardPay: 10000, status: "ACTIVE", notes: "雨天中止あり" },
  { id: "p3", siteId: "s1", siteName: "SBビル 常駐警備", clientName: "SBビルマネジメント株式会社", name: "[C現場] イベント警備 夜勤", workStyle: "NIGHT_SHIFT", startDate: "2026-03-29", endDate: "2026-03-30", startTime: "18:00", endTime: "06:00", requiredGuards: 4, unitPrice: 22000, guardPay: 13000, status: "ACTIVE", notes: "" },
  { id: "p4", siteId: "s5", siteName: "横浜倉庫 夜間警備", clientName: "神奈川物流センター", name: "横浜倉庫 夜間常駐", workStyle: "NIGHT_SHIFT", startDate: "2026-02-01", endDate: "", startTime: "21:00", endTime: "06:00", requiredGuards: 2, unitPrice: 20000, guardPay: 12500, status: "ACTIVE", notes: "" },
  { id: "p5", siteId: "s3", siteName: "渋谷区 ビル解体現場", clientName: "東京建設株式会社", name: "渋谷解体 交通誘導", workStyle: "DAY_SHIFT", startDate: "2025-10-01", endDate: "2026-02-28", startTime: "08:00", endTime: "17:00", requiredGuards: 3, unitPrice: 15000, guardPay: 10000, status: "COMPLETED", notes: "" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProjectsView({ dbProjects = [] }: { dbProjects?: any[] }) {
  const router = useRouter();
  const initial = dbProjects.length > 0 ? dbProjects.map(toProject) : DEMO_PROJECTS;
  const [projects, setProjects] = useState<Project[]>(initial);

  useEffect(() => {
    if (dbProjects.length > 0) setProjects(dbProjects.map(toProject));
  }, [dbProjects]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterWorkStyle, setFilterWorkStyle] = useState("");
  const [modalProject, setModalProject] = useState<Project | null | undefined>(undefined);

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.includes(search) || p.clientName.includes(search) || p.siteName.includes(search);
    const matchStatus = !filterStatus || p.status === filterStatus;
    const matchStyle = !filterWorkStyle || p.workStyle === filterWorkStyle;
    return matchSearch && matchStatus && matchStyle;
  });

  const handleSave = async (saved: Project) => {
    setProjects((prev) =>
      prev.some((p) => p.id === saved.id)
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [...prev, saved]
    );
    setModalProject(undefined);
    try {
      await upsertProject({
        id:             saved.id || undefined,
        siteId:         saved.siteId,
        name:           saved.name,
        workStyle:      saved.workStyle as "DAY_SHIFT" | "NIGHT_SHIFT" | "RESIDENT" | "DAY_NIGHT" | "EVENT" | "OTHER",
        startDate:      saved.startDate,
        endDate:        saved.endDate || undefined,
        startTime:      saved.startTime,
        endTime:        saved.endTime,
        requiredGuards: saved.requiredGuards,
        unitPrice:      saved.unitPrice,
        guardPay:       saved.guardPay,
        status:         saved.status as "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED",
        notes:          saved.notes || undefined,
      });
      router.refresh();
    } catch (e) {
      console.error("案件保存エラー:", e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">案件管理</h2>
          <p className="text-sm text-gray-500 mt-1">
            全{projects.length}件（稼働中: {projects.filter((p) => p.status === "ACTIVE").length}件）
          </p>
        </div>
        <button
          onClick={() => setModalProject(null)}
          className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          ＋ 案件を登録
        </button>
      </div>

      {/* 検索・フィルタ */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="案件名・得意先・現場で検索..."
          className="flex-1 min-w-[200px] px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300">
          <option value="">全ステータス</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterWorkStyle} onChange={(e) => setFilterWorkStyle(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300">
          <option value="">全勤務形態</option>
          {Object.entries(WORK_STYLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-xs">
              <th className="text-left py-3 px-4 font-medium">案件名</th>
              <th className="text-left py-3 px-3 font-medium">現場 / 得意先</th>
              <th className="text-center py-3 px-3 font-medium">勤務形態</th>
              <th className="text-left py-3 px-3 font-medium">期間</th>
              <th className="text-center py-3 px-3 font-medium">時間</th>
              <th className="text-center py-3 px-3 font-medium">必要人数</th>
              <th className="text-right py-3 px-3 font-medium">請求単価</th>
              <th className="text-center py-3 px-3 font-medium">ステータス</th>
              <th className="text-center py-3 px-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{p.name}</p>
                  {p.notes && <p className="text-[10px] text-gray-400 mt-0.5">{p.notes}</p>}
                </td>
                <td className="py-3 px-3">
                  <p className="text-gray-800 text-xs font-medium">{p.siteName}</p>
                  <p className="text-[10px] text-gray-400">{p.clientName}</p>
                </td>
                <td className="text-center py-3 px-3">
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                    {WORK_STYLE_LABELS[p.workStyle]}
                  </span>
                </td>
                <td className="py-3 px-3 text-xs text-gray-600">
                  <p>{p.startDate}</p>
                  <p>{p.endDate ? `〜 ${p.endDate}` : "〜 継続"}</p>
                </td>
                <td className="text-center py-3 px-3 text-xs text-gray-600">
                  {p.startTime}〜{p.endTime}
                </td>
                <td className="text-center py-3 px-3 font-medium text-gray-900">
                  {p.requiredGuards}名
                </td>
                <td className="text-right py-3 px-3 font-mono text-xs text-gray-900">
                  ¥{p.unitPrice.toLocaleString()}
                </td>
                <td className="text-center py-3 px-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </td>
                <td className="text-center py-3 px-3">
                  <button onClick={() => setModalProject(p)} className="text-xs text-brand-500 hover:underline">
                    編集
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="py-8 text-center text-sm text-gray-400">該当する案件がありません</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalProject !== undefined && (
        <ProjectModal
          project={modalProject}
          sites={DEMO_SITES}
          onSave={handleSave}
          onClose={() => setModalProject(undefined)}
        />
      )}
    </div>
  );
}
