"use client";

import { useState, useEffect } from "react";
import type { Guard } from "./guard-types";
import { PAY_TYPE_LABELS, GENDER_LABELS } from "./guard-types";
import GuardModal from "./guard-modal";
import { upsertGuard } from "@/app/actions/guards";
import { useRouter } from "next/navigation";

// Prisma の戻り値 → Guard 型に変換
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toGuard(u: any): Guard {
  const p = u.guardProfile ?? {};
  return {
    id:               u.id,
    name:             u.name,
    nameKana:         u.nameKana   ?? "",
    phone:            u.phone      ?? "",
    isActive:         u.isActive   ?? true,
    gender:           p.gender     ?? "MALE",
    birthDate:        p.birthDate  ? p.birthDate.toISOString().slice(0, 10) : "",
    hireDate:         p.hireDate   ? p.hireDate.toISOString().slice(0, 10)  : "",
    experienceYears:  p.experienceYears ?? 0,
    qualifications:   Array.isArray(p.qualifications) ? p.qualifications : [],
    skills:           Array.isArray(p.skills)          ? p.skills          : [],
    payType:          p.payType    ?? "DAILY",
    basePay:          p.basePay    ?? 0,
    bankName:         p.bankName   ?? "",
    bankBranch:       p.bankBranch ?? "",
    bankAccountType:  p.bankAccountType  ?? "",
    bankAccountNum:   p.bankAccountNum   ?? "",
    bankAccountName:  p.bankAccountName  ?? "",
    hasSmartphone:    p.hasSmartphone ?? true,
    photoUrl:         p.photoUrl   ?? "",
    emergencyContact: p.emergencyContact ?? "",
    address:          p.address    ?? "",
  };
}

const DEMO_GUARDS: Guard[] = [
  { id: "g1", name: "田中 一郎", nameKana: "タナカ イチロウ", phone: "080-1000-2000", isActive: true, gender: "MALE", birthDate: "1979-05-15", hireDate: "2020-04-01", experienceYears: 15, qualifications: ["交通誘導警備業務検定2級"], skills: ["リーダー"], payType: "DAILY", basePay: 10000, bankName: "三菱UFJ銀行", bankBranch: "新宿支店", bankAccountType: "普通", bankAccountNum: "1234567", bankAccountName: "タナカ イチロウ", hasSmartphone: true, photoUrl: "", emergencyContact: "田中 花子（妻）090-0000-0001", address: "東京都新宿区1-1-1" },
  { id: "g2", name: "高橋 二郎", nameKana: "タカハシ ジロウ", phone: "080-1001-2001", isActive: true, gender: "MALE", birthDate: "1969-08-22", hireDate: "2021-04-01", experienceYears: 20, qualifications: ["施設警備業務検定2級"], skills: [], payType: "DAILY", basePay: 10500, bankName: "みずほ銀行", bankBranch: "渋谷支店", bankAccountType: "普通", bankAccountNum: "7654321", bankAccountName: "タカハシ ジロウ", hasSmartphone: true, photoUrl: "", emergencyContact: "", address: "東京都渋谷区2-2-2" },
  { id: "g3", name: "渡辺 三郎", nameKana: "ワタナベ サブロウ", phone: "080-1002-2002", isActive: true, gender: "MALE", birthDate: "1962-02-10", hireDate: "2022-04-01", experienceYears: 25, qualifications: ["交通誘導警備業務検定2級"], skills: ["大型免許"], payType: "DAILY", basePay: 11000, bankName: "三井住友銀行", bankBranch: "池袋支店", bankAccountType: "普通", bankAccountNum: "2345678", bankAccountName: "ワタナベ サブロウ", hasSmartphone: false, photoUrl: "", emergencyContact: "渡辺 幸子（妻）090-0000-0003", address: "東京都豊島区3-3-3" },
  { id: "g4", name: "伊藤 四郎", nameKana: "イトウ シロウ", phone: "080-1003-2003", isActive: true, gender: "MALE", birthDate: "1986-11-30", hireDate: "2023-04-01", experienceYears: 8, qualifications: [], skills: ["リーダー", "夜勤可"], payType: "DAILY", basePay: 11500, bankName: "ゆうちょ銀行", bankBranch: "東京支店", bankAccountType: "普通", bankAccountNum: "3456789", bankAccountName: "イトウ シロウ", hasSmartphone: true, photoUrl: "", emergencyContact: "", address: "東京都品川区4-4-4" },
  { id: "g5", name: "小林 五郎", nameKana: "コバヤシ ゴロウ", phone: "080-1004-2004", isActive: false, gender: "MALE", birthDate: "1974-07-07", hireDate: "2019-04-01", experienceYears: 18, qualifications: ["施設警備業務検定2級"], skills: [], payType: "DAILY", basePay: 12000, bankName: "三菱UFJ銀行", bankBranch: "上野支店", bankAccountType: "普通", bankAccountNum: "4567890", bankAccountName: "コバヤシ ゴロウ", hasSmartphone: true, photoUrl: "", emergencyContact: "", address: "東京都台東区5-5-5" },
  { id: "g7", name: "吉田 七子", nameKana: "ヨシダ ナナコ", phone: "080-1006-2006", isActive: true, gender: "FEMALE", birthDate: "1991-04-20", hireDate: "2024-04-01", experienceYears: 3, qualifications: [], skills: ["英語対応可"], payType: "MONTHLY", basePay: 250000, bankName: "みずほ銀行", bankBranch: "新宿支店", bankAccountType: "普通", bankAccountNum: "5678901", bankAccountName: "ヨシダ ナナコ", hasSmartphone: true, photoUrl: "", emergencyContact: "吉田 一郎（父）090-0000-0007", address: "東京都新宿区6-6-6" },
  { id: "g8", name: "山口 八郎", nameKana: "ヤマグチ ハチロウ", phone: "080-1007-2007", isActive: true, gender: "MALE", birthDate: "1954-12-01", hireDate: "2023-10-01", experienceYears: 30, qualifications: ["交通誘導警備業務検定1級", "交通誘導警備業務検定2級"], skills: ["普通免許"], payType: "DAILY", basePay: 10000, bankName: "三井住友銀行", bankBranch: "品川支店", bankAccountType: "普通", bankAccountNum: "6789012", bankAccountName: "ヤマグチ ハチロウ", hasSmartphone: false, photoUrl: "", emergencyContact: "", address: "東京都品川区7-7-7" },
];

function calcAge(birthDate: string): number {
  if (!birthDate) return 0;
  const today = new Date();
  const bd = new Date(birthDate);
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function GuardsView({ dbGuards = [] }: { dbGuards?: any[] }) {
  const router = useRouter();
  const initial = dbGuards.length > 0 ? dbGuards.map(toGuard) : DEMO_GUARDS;
  const [guards, setGuards] = useState<Guard[]>(initial);

  useEffect(() => {
    if (dbGuards.length > 0) setGuards(dbGuards.map(toGuard));
  }, [dbGuards]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "active" | "inactive">("");
  const [filterPayType, setFilterPayType] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [modalGuard, setModalGuard] = useState<Guard | null | undefined>(undefined);

  const filtered = guards.filter((g) => {
    const matchSearch =
      g.name.includes(search) || g.nameKana.includes(search) || g.phone.includes(search);
    const matchStatus =
      filterStatus === "" ? true : filterStatus === "active" ? g.isActive : !g.isActive;
    const matchPayType = !filterPayType || g.payType === filterPayType;
    const matchSkill = !filterSkill || g.qualifications.includes(filterSkill) || g.skills.includes(filterSkill);
    return matchSearch && matchStatus && matchPayType && matchSkill;
  });

  const handleSave = async (saved: Guard) => {
    // 楽観的UI更新
    setGuards((prev) =>
      prev.some((g) => g.id === saved.id)
        ? prev.map((g) => (g.id === saved.id ? saved : g))
        : [...prev, { ...saved, id: saved.id || `tmp-${Date.now()}` }]
    );
    setModalGuard(undefined);
    // DB保存（デモセッションの場合は no-op）
    try {
      const result = await upsertGuard({
        id:              saved.id || undefined,
        name:            saved.name,
        nameKana:        saved.nameKana,
        phone:           saved.phone,
        gender:          saved.gender as "MALE" | "FEMALE" | "OTHER",
        birthDate:       saved.birthDate  || undefined,
        hireDate:        saved.hireDate   || undefined,
        address:         saved.address    || undefined,
        emergencyContact: saved.emergencyContact || undefined,
        qualifications:  saved.qualifications,
        skills:          saved.skills,
        payType:         saved.payType as "DAILY" | "MONTHLY" | "HOURLY",
        basePay:         saved.basePay,
        hasSmartphone:   saved.hasSmartphone,
        bankName:        saved.bankName        || undefined,
        bankBranch:      saved.bankBranch      || undefined,
        bankAccountType: saved.bankAccountType || undefined,
        bankAccountNum:  saved.bankAccountNum  || undefined,
        bankAccountName: saved.bankAccountName || undefined,
      });
      // DB の本当の id で state を更新してからサーバーデータを再取得
      if (result?.id) {
        setGuards((prev) =>
          prev.map((g) => (g.id === saved.id || g.id.startsWith("tmp-") ? { ...g, id: result.id } : g))
        );
      }
      router.refresh();
    } catch (e) {
      console.error("隊員保存エラー:", e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">隊員管理</h2>
          <p className="text-sm text-gray-500 mt-1">
            登録: {guards.length}名（稼働中: {guards.filter((g) => g.isActive).length}名）
          </p>
        </div>
        <button
          onClick={() => setModalGuard(null)}
          className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          ＋ 隊員を登録
        </button>
      </div>

      {/* 検索・フィルタ */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="氏名・フリガナ・電話番号で検索..."
          className="flex-1 min-w-[200px] px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "" | "active" | "inactive")}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300">
          <option value="">全ステータス</option>
          <option value="active">稼働中</option>
          <option value="inactive">休職中</option>
        </select>
        <select value={filterPayType} onChange={(e) => setFilterPayType(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300">
          <option value="">全給与形態</option>
          {(Object.keys(PAY_TYPE_LABELS) as Guard["payType"][]).map((k) => (
            <option key={k} value={k}>{PAY_TYPE_LABELS[k]}</option>
          ))}
        </select>
        <select value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300">
          <option value="">全資格・スキル</option>
          <option value="交通誘導警備業務検定2級">交通誘導2級</option>
          <option value="施設警備業務検定2級">施設警備2級</option>
          <option value="リーダー">リーダー</option>
          <option value="夜勤可">夜勤可</option>
        </select>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-gray-500 text-xs">
              <th className="text-left py-3 px-4 font-medium">氏名</th>
              <th className="text-center py-3 px-3 font-medium">年齢 / 性別</th>
              <th className="text-left py-3 px-3 font-medium">電話番号</th>
              <th className="text-left py-3 px-3 font-medium">給与</th>
              <th className="text-left py-3 px-3 font-medium">資格・スキル</th>
              <th className="text-center py-3 px-3 font-medium">SP</th>
              <th className="text-center py-3 px-3 font-medium">ステータス</th>
              <th className="text-center py-3 px-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-700 shrink-0">
                      {g.name.replace(" ", "")[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{g.name}</p>
                      <p className="text-[10px] text-gray-400">{g.nameKana}</p>
                    </div>
                  </div>
                </td>
                <td className="text-center py-3 px-3 text-gray-600 text-xs">
                  {g.birthDate ? `${calcAge(g.birthDate)}歳` : "—"} / {GENDER_LABELS[g.gender]}
                </td>
                <td className="py-3 px-3 text-gray-600 font-mono text-xs">{g.phone || "—"}</td>
                <td className="py-3 px-3 text-xs">
                  <p className="text-gray-500">{PAY_TYPE_LABELS[g.payType]}</p>
                  <p className="font-mono text-gray-900">¥{g.basePay.toLocaleString()}</p>
                </td>
                <td className="py-3 px-3">
                  <div className="flex flex-wrap gap-1">
                    {g.qualifications.map((q) => (
                      <span key={q} className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        {q.replace("警備業務検定", "").replace("警備員指導教育責任者", "指導責")}
                      </span>
                    ))}
                    {g.skills.map((s) => (
                      <span key={s} className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="text-center py-3 px-3">
                  <span className={`text-[10px] ${g.hasSmartphone ? "text-green-600" : "text-gray-400"}`}>
                    {g.hasSmartphone ? "✓" : "✗"}
                  </span>
                </td>
                <td className="text-center py-3 px-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${g.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {g.isActive ? "稼働中" : "休職中"}
                  </span>
                </td>
                <td className="text-center py-3 px-3">
                  <button
                    onClick={() => setModalGuard(g)}
                    className="text-xs text-brand-500 hover:underline"
                  >
                    編集
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-gray-400">
                  該当する隊員がいません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalGuard !== undefined && (
        <GuardModal
          guard={modalGuard}
          onSave={handleSave}
          onClose={() => setModalGuard(undefined)}
        />
      )}
    </div>
  );
}
