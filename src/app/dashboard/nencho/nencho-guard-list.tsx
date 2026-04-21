"use client";

import { NenchoGuard, NENCHO_STATUS_CONFIG } from "./nencho-types";

type Props = {
  guards: NenchoGuard[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function NenchoGuardList({ guards, selectedId, onSelect }: Props) {
  const counts = {
    NOT_STARTED: guards.filter((g) => g.status === "NOT_STARTED").length,
    COLLECTING:  guards.filter((g) => g.status === "COLLECTING").length,
    CALCULATING: guards.filter((g) => g.status === "CALCULATING").length,
    COMPLETED:   guards.filter((g) => g.status === "COMPLETED").length,
  };

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* 進捗サマリー */}
      <div className="px-4 py-3 border-b bg-gray-50 grid grid-cols-4 gap-2 text-center">
        {(["NOT_STARTED", "COLLECTING", "CALCULATING", "COMPLETED"] as const).map((s) => (
          <div key={s}>
            <p className="text-lg font-bold text-gray-800">{counts[s]}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${NENCHO_STATUS_CONFIG[s].bg}`}>
              {NENCHO_STATUS_CONFIG[s].label}
            </span>
          </div>
        ))}
      </div>

      {/* 隊員一覧 */}
      <div className="divide-y divide-gray-100">
        {guards.map((guard) => {
          const cfg = NENCHO_STATUS_CONFIG[guard.status];
          return (
            <button
              key={guard.guardId}
              onClick={() => onSelect(guard.guardId)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                selectedId === guard.guardId ? "bg-brand-50 border-l-4 border-brand-500" : ""
              }`}
            >
              <div>
                <p className="font-medium text-gray-900 text-sm">{guard.guardName}</p>
                {guard.submittedAt && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    提出: {new Date(guard.submittedAt).toLocaleDateString("ja-JP")}
                  </p>
                )}
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg}`}>
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
