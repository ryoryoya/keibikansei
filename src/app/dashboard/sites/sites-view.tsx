"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SiteModal, { type Site } from "./site-modal";
import { upsertSite } from "@/app/actions/sites";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSite(r: any): Site {
  return {
    id:        r.id,
    clientId:  r.clientId  ?? "",
    clientName: r.client?.name ?? "",
    name:      r.name,
    address:   r.address   ?? "",
    latitude:  r.latitude  ?? null,
    longitude: r.longitude ?? null,
    guardType: r.guardType ?? "TYPE_1",
    notes:     r.notes     ?? "",
    isActive:  r.isActive  ?? true,
  };
}

const GUARD_TYPE_LABELS: Record<string, string> = {
  TYPE_1: "1号（施設）",
  TYPE_2: "2号（交通）",
  TYPE_3: "3号（輸送）",
  TYPE_4: "4号（身辺）",
};

const DEMO_CLIENTS = [
  { id: "c1", name: "SBビルマネジメント株式会社" },
  { id: "c2", name: "東京建設株式会社" },
  { id: "c3", name: "渋谷商事株式会社" },
  { id: "c4", name: "神奈川物流センター" },
];

const DEMO_SITES: Site[] = [
  { id: "s1", clientId: "c1", clientName: "SBビルマネジメント株式会社", name: "SBビル 常駐警備", address: "東京都港区虎ノ門1-1-1", latitude: 35.6688, longitude: 139.7497, guardType: "TYPE_1", notes: "", isActive: true },
  { id: "s2", clientId: "c2", clientName: "東京建設株式会社", name: "新宿区 道路工事現場", address: "東京都新宿区西新宿2-2-2", latitude: 35.6897, longitude: 139.6922, guardType: "TYPE_2", notes: "週末は別担当", isActive: true },
  { id: "s3", clientId: "c2", clientName: "東京建設株式会社", name: "渋谷区 ビル解体現場", address: "東京都渋谷区道玄坂1-1-1", latitude: 35.6580, longitude: 139.7016, guardType: "TYPE_2", notes: "", isActive: true },
  { id: "s4", clientId: "c3", clientName: "渋谷商事株式会社", name: "渋谷本社 施設警備", address: "東京都渋谷区道玄坂3-3-3", latitude: null, longitude: null, guardType: "TYPE_1", notes: "", isActive: true },
  { id: "s5", clientId: "c4", clientName: "神奈川物流センター", name: "横浜倉庫 夜間警備", address: "神奈川県横浜市港北区4-4-4", latitude: 35.5308, longitude: 139.6356, guardType: "TYPE_1", notes: "", isActive: true },
  { id: "s6", clientId: "c1", clientName: "SBビルマネジメント株式会社", name: "旧青山ビル（閉鎖）", address: "東京都港区南青山5-5-5", latitude: null, longitude: null, guardType: "TYPE_1", notes: "2024年閉鎖", isActive: false },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SitesView({ dbSites = [] }: { dbSites?: any[] }) {
  const router = useRouter();
  const initial = dbSites.length > 0 ? dbSites.map(toSite) : DEMO_SITES;
  const [sites, setSites] = useState<Site[]>(initial);

  useEffect(() => {
    if (dbSites.length > 0) setSites(dbSites.map(toSite));
  }, [dbSites]);
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterGuardType, setFilterGuardType] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("");
  const [modalSite, setModalSite] = useState<Site | null | undefined>(undefined);

  const filtered = sites.filter((s) => {
    const matchSearch = s.name.includes(search) || s.clientName.includes(search) || s.address.includes(search);
    const matchClient = !filterClient || s.clientId === filterClient;
    const matchType = !filterGuardType || s.guardType === filterGuardType;
    const matchActive = filterActive === "" ? true : filterActive === "true" ? s.isActive : !s.isActive;
    return matchSearch && matchClient && matchType && matchActive;
  });

  const handleSave = async (saved: Site) => {
    setSites((prev) =>
      prev.some((s) => s.id === saved.id)
        ? prev.map((s) => (s.id === saved.id ? saved : s))
        : [...prev, saved]
    );
    setModalSite(undefined);
    try {
      await upsertSite({
        id:        saved.id || undefined,
        clientId:  saved.clientId,
        name:      saved.name,
        address:   saved.address  || undefined,
        latitude:  saved.latitude  ?? undefined,
        longitude: saved.longitude ?? undefined,
        guardType: saved.guardType as "TYPE_1" | "TYPE_2" | "TYPE_3" | "TYPE_4",
        notes:     saved.notes    || undefined,
        isActive:  saved.isActive,
      });
      router.refresh();
    } catch (e) {
      console.error("現場保存エラー:", e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">現場管理</h2>
          <p className="text-sm text-gray-500 mt-1">
            登録件数: {sites.length}件（有効: {sites.filter((s) => s.isActive).length}件）
          </p>
        </div>
        <button
          onClick={() => setModalSite(null)}
          className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          ＋ 現場を登録
        </button>
      </div>

      {/* 検索・フィルタ */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="現場名・得意先・住所で検索..."
          className="flex-1 min-w-[180px] px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300">
          <option value="">全得意先</option>
          {DEMO_CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterGuardType} onChange={(e) => setFilterGuardType(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300">
          <option value="">全警備種別</option>
          {Object.entries(GUARD_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterActive} onChange={(e) => setFilterActive(e.target.value as "" | "true" | "false")}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300">
          <option value="">全ステータス</option>
          <option value="true">有効のみ</option>
          <option value="false">無効のみ</option>
        </select>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-xs">
              <th className="text-left py-3 px-4 font-medium">現場名</th>
              <th className="text-left py-3 px-3 font-medium">得意先</th>
              <th className="text-left py-3 px-3 font-medium">住所</th>
              <th className="text-center py-3 px-3 font-medium">警備種別</th>
              <th className="text-center py-3 px-3 font-medium">地図</th>
              <th className="text-center py-3 px-3 font-medium">ステータス</th>
              <th className="text-center py-3 px-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{s.name}</p>
                  {s.notes && <p className="text-[10px] text-gray-400 mt-0.5">{s.notes}</p>}
                </td>
                <td className="py-3 px-3 text-gray-600 text-xs">{s.clientName}</td>
                <td className="py-3 px-3 text-gray-600 text-xs">{s.address || "—"}</td>
                <td className="text-center py-3 px-3">
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {GUARD_TYPE_LABELS[s.guardType]}
                  </span>
                </td>
                <td className="text-center py-3 px-3">
                  {s.latitude && s.longitude ? (
                    <span className="text-[10px] text-green-600">📍 設定済</span>
                  ) : (
                    <span className="text-[10px] text-gray-400">未設定</span>
                  )}
                </td>
                <td className="text-center py-3 px-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.isActive ? "有効" : "無効"}
                  </span>
                </td>
                <td className="text-center py-3 px-3">
                  <button onClick={() => setModalSite(s)} className="text-xs text-brand-500 hover:underline">
                    編集
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-sm text-gray-400">該当する現場がありません</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalSite !== undefined && (
        <SiteModal
          site={modalSite}
          clients={DEMO_CLIENTS}
          onSave={handleSave}
          onClose={() => setModalSite(undefined)}
        />
      )}
    </div>
  );
}
