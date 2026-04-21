"use client";

import { useState } from "react";

type GpsStatus = "idle" | "locating" | "geocoding" | "error";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

/** Nominatim レスポンスから日本語住所を組み立てる */
function buildJapaneseAddress(addr: Record<string, string>): string {
  const parts = [
    addr.state,                                            // 都道府県
    addr.city || addr.town || addr.county,                 // 市区町村
    addr.city_district || addr.suburb || addr.neighbourhood, // 区・地区
    addr.quarter,                                          // 丁目など
    addr.road,                                             // 通り・道路名
    addr.house_number,                                     // 番地
  ].filter(Boolean);
  return parts.join("");
}

/**
 * GPS ボタン付き住所入力フィールド。
 * ボタン押下で現在位置を取得し Nominatim で逆ジオコーディングして住所を自動入力する。
 * 手動入力・編集も引き続き可能。
 */
export default function LocationInput({ value, onChange, placeholder, className }: Props) {
  const [status, setStatus] = useState<GpsStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg("このブラウザは位置情報に対応していません");
      setStatus("error");
      return;
    }

    setStatus("locating");
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStatus("geocoding");
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ja`,
            {
              headers: {
                // Nominatim 利用規約で User-Agent が必要
                "User-Agent": "keibi-kansei-system/1.0 (guard-app)",
              },
            }
          );
          if (!res.ok) throw new Error("geocoding failed");
          const data = await res.json();

          const address = buildJapaneseAddress(data.address ?? {});
          onChange(address || data.display_name || "");
          setStatus("idle");
        } catch {
          setErrorMsg("住所の取得に失敗しました。手動で入力してください。");
          setStatus("error");
        }
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "位置情報の使用が許可されていません",
          2: "位置情報を取得できませんでした",
          3: "位置情報の取得がタイムアウトしました",
        };
        setErrorMsg(messages[err.code] ?? "位置情報の取得に失敗しました");
        setStatus("error");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  };

  const isLoading = status === "locating" || status === "geocoding";
  const statusLabel =
    status === "locating" ? "測位中…" : status === "geocoding" ? "住所変換中…" : "📍GPS";

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            // 手動入力したらエラーをクリア
            if (status === "error") setStatus("idle");
          }}
          placeholder={placeholder}
          className={className}
        />
        <button
          type="button"
          onClick={handleGps}
          disabled={isLoading}
          className="flex-shrink-0 px-3 py-2 text-sm font-medium bg-brand-50 text-brand-600 border border-brand-300 rounded-lg hover:bg-brand-100 active:bg-brand-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          aria-label="現在地から住所を取得"
        >
          {isLoading ? (
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              {statusLabel}
            </span>
          ) : (
            statusLabel
          )}
        </button>
      </div>

      {status === "error" && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span>
          {errorMsg}
        </p>
      )}
    </div>
  );
}
