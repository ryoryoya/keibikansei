"use client";

import { useState, useEffect } from "react";
import { TODAY_ASSIGNMENT } from "../guard-demo-data";
import type { ClockState } from "../guard-demo-data";
import { upsertAttendance } from "@/app/actions/attendance";

type StepKey = keyof ClockState;

type AssignmentData = {
  id: string;
  projectName: string;
  siteName: string;
  address: string;
  startTime: string;
  endTime: string;
  clockState: ClockState;
} | null;

const STEPS: { key: StepKey; label: string; sublabel: string; activeColor: string }[] = [
  { key: "wakeUpAt",    label: "起床確認", sublabel: "起きたら最初にタップ",  activeColor: "bg-sky-500 hover:bg-sky-600" },
  { key: "departureAt", label: "出発確認", sublabel: "現場へ向けて出発したら", activeColor: "bg-blue-500 hover:bg-blue-600" },
  { key: "clockIn",     label: "上　番",   sublabel: "現場到着・勤務開始",     activeColor: "bg-green-500 hover:bg-green-600" },
  { key: "clockOut",    label: "下　番",   sublabel: "勤務終了・現場離脱",     activeColor: "bg-gray-500 hover:bg-gray-600" },
];

function nowStr(): string {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

export default function ClockClient({
  assignment,
  userId,
}: {
  assignment: AssignmentData;
  userId: string;
}) {
  // DBデータがあればそれを使い、なければデモデータにフォールバック
  const source = assignment ?? {
    id:          "demo",
    projectName: TODAY_ASSIGNMENT.projectName,
    siteName:    TODAY_ASSIGNMENT.siteName,
    address:     TODAY_ASSIGNMENT.address,
    startTime:   TODAY_ASSIGNMENT.startTime,
    endTime:     TODAY_ASSIGNMENT.endTime,
    clockState:  TODAY_ASSIGNMENT.clockState,
  };

  const [clock, setClock] = useState<ClockState>(source.clockState);
  const [currentTime, setCurrentTime] = useState(nowStr());
  const [confirm, setConfirm] = useState<{ key: StepKey; time: string } | null>(null);
  const [toast, setToast] = useState<{ key: StepKey; time: string } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "getting" | "ok">("idle");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(nowStr()), 1000);
    return () => clearInterval(id);
  }, []);

  const nextStep = STEPS.find((s) => !clock[s.key]);
  const doneCount = STEPS.filter((s) => clock[s.key]).length;

  const handleTap = (step: (typeof STEPS)[0]) => {
    if (clock[step.key]) return;
    setGpsStatus("getting");
    // GPS取得
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("ok");
        setConfirm({ key: step.key, time: nowStr() });
      },
      () => {
        // GPS失敗でも打刻は続行
        setGpsStatus("ok");
        setConfirm({ key: step.key, time: nowStr() });
      },
      { timeout: 5000 }
    );
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    const newClock = { ...clock, [confirm.key]: confirm.time };
    setClock(newClock);
    setToast(confirm);
    setConfirm(null);
    setGpsStatus("idle");
    setTimeout(() => setToast(null), 3500);

    // DBに保存（assignmentがある場合のみ）
    if (assignment?.id && assignment.id !== "demo") {
      setSaving(true);
      const now = new Date();
      // "HH:mm" を今日のISO文字列に変換
      const toISO = (hhmm: string | null) => {
        if (!hhmm) return null;
        const [h, m] = hhmm.split(":").map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d.toISOString();
      };
      try {
        await upsertAttendance({
          assignmentId: assignment.id,
          userId,
          wakeUpAt:    toISO(newClock.wakeUpAt),
          departureAt: toISO(newClock.departureAt),
          clockIn:     toISO(newClock.clockIn),
          clockOut:    toISO(newClock.clockOut),
          clockInLat:  confirm.key === "clockIn" ? gpsCoords?.lat ?? null : null,
          clockInLng:  confirm.key === "clockIn" ? gpsCoords?.lng ?? null : null,
        });
      } catch (e) {
        console.error("打刻保存エラー:", e);
      } finally {
        setSaving(false);
      }
    }
  };

  const allDone = doneCount === STEPS.length;

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* 現在時刻 */}
      <div className="bg-brand-500 rounded-2xl p-5 text-white text-center">
        <p className="text-xs text-brand-200 mb-1">現在時刻</p>
        <p className="text-5xl font-bold font-mono tracking-wider">{currentTime}</p>
        <p className="text-xs text-brand-200 mt-2">
          {source.projectName}　{source.startTime}〜{source.endTime}
        </p>
        {!assignment && (
          <p className="text-xs text-brand-300 mt-1">※ デモ表示（配置データなし）</p>
        )}
      </div>

      {/* GPS状態 */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${
        gpsStatus === "ok"      ? "bg-green-50 text-green-700" :
        gpsStatus === "getting" ? "bg-blue-50 text-blue-600" :
        "bg-gray-50 text-gray-500"
      }`}>
        <span>{gpsStatus === "getting" ? "🔄" : "📍"}</span>
        {gpsStatus === "ok"      && (gpsCoords ? `GPS取得済み　${source.address} 付近` : "GPS取得済み")}
        {gpsStatus === "getting" && "GPS位置情報を取得中..."}
        {gpsStatus === "idle"    && "打刻時にGPS位置情報を自動記録します"}
      </div>

      {/* 保存中インジケーター */}
      {saving && (
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm text-center">
          保存中...
        </div>
      )}

      {/* トースト */}
      {toast && (
        <div className="bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium text-center shadow-md">
          ✓ {STEPS.find((s) => s.key === toast.key)?.label} {toast.time} を記録しました
        </div>
      )}

      {/* 打刻ボタン群 */}
      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const done = !!clock[step.key];
          const isNext = step.key === nextStep?.key;
          const prevDone = i === 0 || !!clock[STEPS[i - 1].key];

          return (
            <button
              key={step.key}
              onClick={() => isNext && handleTap(step)}
              disabled={done || !prevDone}
              className={`
                w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-left transition-all shadow-sm
                ${done
                  ? "bg-gray-100 text-gray-400 cursor-default"
                  : isNext
                  ? `${step.activeColor} text-white shadow-md active:scale-95`
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
                }
              `}
            >
              <div>
                <p className="text-lg">{step.label}</p>
                <p className={`text-xs mt-0.5 ${done ? "text-gray-400" : isNext ? "text-white/80" : "text-gray-300"}`}>
                  {done ? `${clock[step.key]} 記録済み` : step.sublabel}
                </p>
              </div>
              <div className="text-3xl">
                {done    ? <span className="text-green-500">✓</span>
                : isNext ? <span className="text-white text-2xl">→</span>
                :          <span className="text-gray-300">🔒</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* 完了 */}
      {allDone && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <p className="text-4xl mb-2">🎉</p>
          <p className="text-green-700 font-bold">本日の勤務お疲れさまでした</p>
          <p className="text-green-600 text-sm mt-1">
            上番 {clock.clockIn}　→　下番 {clock.clockOut}
          </p>
        </div>
      )}

      {/* 確認モーダル */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-xl">
            <div className="text-center">
              <p className="text-4xl mb-2">
                {STEPS.find((s) => s.key === confirm.key)?.label === "上　番" ? "✅" : "🕐"}
              </p>
              <p className="text-lg font-bold text-gray-900">
                {STEPS.find((s) => s.key === confirm.key)?.label}
              </p>
              <p className="text-3xl font-mono font-bold text-brand-600 mt-1">{confirm.time}</p>
              <p className="text-sm text-gray-500 mt-1">この時刻で記録しますか？</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setConfirm(null); setGpsStatus("idle"); }}
                className="py-3 rounded-xl border text-gray-600 font-medium hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirm}
                className="py-3 rounded-xl bg-brand-500 text-white font-bold hover:bg-brand-600"
              >
                記録する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
