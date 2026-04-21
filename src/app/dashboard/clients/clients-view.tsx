"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ClientModal, { type Client } from "./client-modal";
import { upsertClient } from "@/app/actions/clients";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toClient(r: any): Client {
  return {
    id:              r.id,
    name:            r.name,
    contactPerson:   r.contactPerson   ?? "",
    tel:             r.tel             ?? "",
    email:           r.email           ?? "",
    address:         r.address         ?? "",
    billingCycleDay: r.billingCycleDay ?? 31,
    paymentTermDays: r.paymentTermDays ?? 30,
    taxType:         r.taxType         ?? "EXCLUSIVE",
    notes:           r.notes           ?? "",
    isActive:        r.isActive        ?? true,
  };
}

const DEMO_CLIENTS: Client[] = [
  { id: "c1", name: "SBビルマネジメント株式会社", contactPerson: "佐藤 健一", tel: "03-1000-2000", email: "sato@sb-bm.co.jp", address: "東京都港区虎ノ門1-1-1", billingCycleDay: 31, paymentTermDays: 30, taxType: "EXCLUSIVE", notes: "", isActive: true },
  { id: "c2", name: "東京建設株式会社", contactPerson: "田中 義雄", tel: "03-2000-3000", email: "tanaka@tokyoken.co.jp", address: "東京都新宿区西新宿2-2-2", billingCycleDay: 25, paymentTermDays: 45, taxType: "EXCLUSIVE", notes: "月末近くに請求書送付", isActive: true },
  { id: "c3", name: "渋谷商事株式会社", contactPerson: "山本 美穂", tel: "03-3000-4000", email: "yamamoto@shibuya.co.jp", address: "東京都渋谷区道玄坂3-3-3", billingCycleDay: 20, paymentTermDays: 30, taxType: "INCLUSIVE", notes: "", isActive: true },
  { id: "c4", name: "神奈川物流センター", contactPerson: "中村 大輔", tel: "045-4000-5000", email: "nakamura@kana-logi.co.jp", address: "神奈川県横浜市港北区4-4-4", billingCycleDay: 31, paymentTermDays: 60, taxType: "EXCLUSIVE", notes: "", isActive: true },
  { id: "c5", name: "旧東部産業（廃業）", contactPerson: "", tel: "", email: "", address: "", billingCycleDay: 31, paymentTermDays: 30, taxType: "EXCLUSIVE", notes: "2024年廃業", isActive: false },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ClientsView({ dbClients = [] }: { dbClients?: any[] }) {
  const router = useRouter();
  const initial = dbClients.length > 0 ? dbClients.map(toClient) : DEMO_CLIENTS;
  const [clients, setClients] = useState<Client[]>(initial);

  // router.refresh() でサーバーから新しいpropsが来たらstateを同期
  useEffect(() => {
    if (dbClients.length > 0) setClients(dbClients.map(toClient));
  }, [dbClients]);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("");
  const [modalClient, setModalClient] = useState<Client | null | undefined>(undefined);
  // undefined = 閉じ, null = 新規, Client = 編集

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.includes(search) || c.contactPerson.includes(search);
    const matchActive =
      filterActive === "" ? true :
      filterActive === "true" ? c.isActive : !c.isActive;
    return matchSearch && matchActive;
  });

  const handleSave = async (saved: Client) => {
    setClients((prev) =>
      prev.some((c) => c.id === saved.id)
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [...prev, saved]
    );
    setModalClient(undefined);
    try {
      await upsertClient({
        id:              saved.id || undefined,
        name:            saved.name,
        contactPerson:   saved.contactPerson  || undefined,
        tel:             saved.tel            || undefined,
        email:           saved.email          || undefined,
        address:         saved.address        || undefined,
        billingCycleDay: saved.billingCycleDay,
        paymentTermDays: saved.paymentTermDays,
        taxType:         saved.taxType as "INCLUSIVE" | "EXCLUSIVE",
        notes:           saved.notes          || undefined,
        isActive:        saved.isActive,
      });
      router.refresh();
    } catch (e) {
      console.error("得意先保存エラー:", e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">得意先管理</h2>
          <p className="text-sm text-gray-500 mt-1">
            登録件数: {clients.length}件（有効: {clients.filter((c) => c.isActive).length}件）
          </p>
        </div>
        <button
          onClick={() => setModalClient(null)}
          className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          ＋ 得意先を登録
        </button>
      </div>

      {/* 検索・フィルタ */}
      <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="得意先名・担当者で検索..."
          className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as "" | "true" | "false")}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
        >
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
              <th className="text-left py-3 px-4 font-medium">得意先名</th>
              <th className="text-left py-3 px-3 font-medium">担当者</th>
              <th className="text-left py-3 px-3 font-medium">電話番号</th>
              <th className="text-center py-3 px-3 font-medium">締め日</th>
              <th className="text-center py-3 px-3 font-medium">支払サイト</th>
              <th className="text-center py-3 px-3 font-medium">税区分</th>
              <th className="text-center py-3 px-3 font-medium">ステータス</th>
              <th className="text-center py-3 px-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  {c.notes && <p className="text-[10px] text-gray-400 mt-0.5">{c.notes}</p>}
                </td>
                <td className="py-3 px-3 text-gray-600">{c.contactPerson || "—"}</td>
                <td className="py-3 px-3 text-gray-600 font-mono text-xs">{c.tel || "—"}</td>
                <td className="text-center py-3 px-3 text-gray-600">
                  {c.billingCycleDay === 31 ? "月末" : `${c.billingCycleDay}日`}
                </td>
                <td className="text-center py-3 px-3 text-gray-600">{c.paymentTermDays}日</td>
                <td className="text-center py-3 px-3 text-gray-600">
                  {c.taxType === "EXCLUSIVE" ? "外税" : "内税"}
                </td>
                <td className="text-center py-3 px-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.isActive ? "有効" : "無効"}
                  </span>
                </td>
                <td className="text-center py-3 px-3">
                  <button onClick={() => setModalClient(c)} className="text-xs text-brand-500 hover:underline">
                    編集
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-sm text-gray-400">該当する得意先がありません</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* モーダル */}
      {modalClient !== undefined && (
        <ClientModal
          client={modalClient}
          onSave={handleSave}
          onClose={() => setModalClient(undefined)}
        />
      )}
    </div>
  );
}
