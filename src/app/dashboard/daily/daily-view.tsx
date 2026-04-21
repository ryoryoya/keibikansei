"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { DailyGuard, DailyProject } from "./daily-types";
import { DEMO_PROJECTS, calcStatus, timeToMin, nowMin } from "./daily-types";
import ProjectCard from "./project-card";
import StampModal from "./stamp-modal";
import { manualStamp } from "@/app/actions/attendance";

type StampField = "wakeUpAt" | "departureAt" | "clockIn" | "clockOut";

export default function DailyView({ dbProjects = [] }: { dbProjects?: DailyProject[] }) {
  const initial = dbProjects.length > 0 ? dbProjects : DEMO_PROJECTS;
  const [projects, setProjects] = useState<DailyProject[]>(initial);

  useEffect(() => {
    if (dbProjects.length > 0) setProjects(dbProjects);
  }, [dbProjects]);
  const [nowDisplay, setNowDisplay] = useState("");
  const [stampTarget, setStampTarget] = useState<{ guard: DailyGuard; project: DailyProject } | null>(null);
  const [notifyToast, setNotifyToast] = useState("");

  // 現在時刻を1分ごとに更新
  useEffect(() => {
    const update = () => {
      setNowDisplay(format(new Date(), "HH:mm"));
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  // 手動打刻を保存
  const handleStamp = async (guardId: string, field: StampField, value: string | null) => {
    setProjects((prev) =>
      prev.map((p) => ({
        ...p,
        guards: p.guards.map((g) =>
          g.id === guardId ? { ...g, [field]: value } : g
        ),
      }))
    );
    // assignmentIdがあればDBにも保存
    const guard = projects.flatMap((p) => p.guards).find((g) => g.id === guardId);
    if (guard?.assignmentId) {
      try {
        await manualStamp({
          assignmentId: guard.assignmentId,
          [field]: value,
        });
      } catch (e) {
        console.error("打刻保存エラー:", e);
      }
    }
  };

  // 一斉通知（デモ）
  const handleBroadcast = () => {
    const notYetCount = projects
      .flatMap((p) => p.guards)
      .filter((g) => calcStatus(g) === "not_yet").length;
    if (notYetCount === 0) {
      setNotifyToast("未上番の隊員はいません");
    } else {
      setNotifyToast(`${notYetCount}名に未上番の催促通知を送信しました`);
    }
    setTimeout(() => setNotifyToast(""), 4000);
  };

  // サマリー集計
  const allGuards = projects.flatMap((p) => p.guards);
  const clockedIn = allGuards.filter((g) => g.clockIn).length;
  const notYet = allGuards.filter((g) => {
    const s = calcStatus(g);
    return s === "not_yet";
  }).length;
  const alerts = allGuards.filter((g) => {
    const s = calcStatus(g);
    return (s === "not_yet" || s === "late_in") && nowMin() >= timeToMin(
      projects.find((p) => p.guards.some((pg) => pg.id === g.id))?.startTime ?? "00:00"
    ) - 30;
  });

  return (
    <div className="space-y-4">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">当日管理</h2>
          <p className="text-sm text-gray-500 mt-1">
            {format(new Date(), "yyyy年M月d日（E）", { locale: ja })}
            {nowDisplay && <span className="ml-2 font-mono text-brand-600">{nowDisplay}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBroadcast}
            className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            一斉通知送信
          </button>
          <button className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 transition-colors">
            前日確認配信
          </button>
        </div>
      </div>

      {/* トースト通知 */}
      {notifyToast && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-xl">
          ✓ {notifyToast}
        </div>
      )}

      {/* アラートバナー */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1">
          <p className="text-sm font-semibold text-red-700">
            ⚠ 要対応: {alerts.length}名が未上番または遅刻です
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            {alerts.map((g) => {
              const proj = projects.find((p) => p.guards.some((pg) => pg.id === g.id));
              return (
                <button
                  key={g.id}
                  onClick={() => setStampTarget({ guard: g, project: proj! })}
                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full hover:bg-red-200 transition-colors"
                >
                  {g.name}（{proj?.name.replace(/^\[.*?\]\s*/, "")}）
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* サマリーカード */}
      <div className="grid grid-cols-4 gap-3">
        <MiniCard label="本日の案件" value={`${projects.length}件`} />
        <MiniCard label="稼働隊員数" value={`${allGuards.length}名`} />
        <MiniCard label="上番済み" value={`${clockedIn}名`} color="green" />
        <MiniCard label="未上番" value={`${notYet}名`} color={notYet > 0 ? "red" : "green"} />
      </div>

      {/* 案件別カード */}
      <div className="space-y-3">
        {projects.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            defaultOpen={i === 0}
            onStamp={(guard, proj) => setStampTarget({ guard, project: proj })}
          />
        ))}
      </div>

      {/* 手動打刻モーダル */}
      {stampTarget && (
        <StampModal
          guard={stampTarget.guard}
          projectName={stampTarget.project.name}
          onSave={handleStamp}
          onClose={() => setStampTarget(null)}
        />
      )}
    </div>
  );
}

function MiniCard({ label, value, color = "default" }: {
  label: string;
  value: string;
  color?: "default" | "green" | "red";
}) {
  const colors = { default: "text-gray-900", green: "text-green-600", red: "text-red-600" };
  return (
    <div className="bg-white rounded-xl border p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color]}`}>{value}</p>
    </div>
  );
}
