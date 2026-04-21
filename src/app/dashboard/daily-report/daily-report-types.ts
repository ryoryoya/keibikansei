// 警備報告書（日報）の型定義

export type WorkLocation = {
  timeStart: string;  // "HH:MM"
  timeEnd: string;    // "HH:MM"
  location: string;
  distance: number | "";
};

export type DailyReport = {
  id: string;
  // ヘッダー
  clientId: string;
  clientName: string;
  reportDate: string;       // "YYYY-MM-DD"
  // 勤務情報
  startTime: string;        // "HH:MM"
  endTime: string;          // "HH:MM"
  breakTime: string;        // "H:MM"
  vehicles: number | "";
  totalDistance: number | "";
  motoukeCd: string;        // 元請CD
  headcount: number | "";
  constructionName: string; // 工事名
  guardIds: string[];
  guardNames: string;       // 表示用（カンマ区切り）
  constructionCompany: string; // 施工会社
  teamName: string;         // 班名
  // 施工場所（最大4箇所）
  locations: WorkLocation[];
  // 会社記入欄（任意）
  areaSpan: number | "";    // エリア跨ぎ
  stayLocation: string;
  stayCount: number | "";
  stayPersons: string;
  correction1Label: string;
  correction1Amount: number | "";
  correction2Label: string;
  correction2Amount: number | "";
  remarks: string;
  // 自動反映
  companyName: string;      // 警備会社名
  itakuCd: string;          // 委託CD
  createdAt: string;
};

// 警備員選択肢の型（DB・デモ共通）
export type GuardOption = { id: string; name: string };

// デモ用の得意先・隊員データ
export const DEMO_CLIENTS_FOR_REPORT = [
  { id: "c1", name: "㈱つうけん" },
  { id: "c2", name: "SBビルマネジメント株式会社" },
  { id: "c3", name: "東京建設株式会社" },
];

export const DEMO_GUARDS_FOR_REPORT = [
  { id: "g1", name: "浅沼 秀元" },
  { id: "g2", name: "松葉 行裕" },
  { id: "g3", name: "川崎 貴志" },
  { id: "g4", name: "布川 順平" },
  { id: "g5", name: "沖田 親市" },
  { id: "g6", name: "池田 知哉" },
  { id: "g7", name: "小林 力" },
  { id: "g8", name: "長門 徹" },
  { id: "g9", name: "堀川 友美" },
];

export const DEMO_COMPANY = {
  name: "㈲サイナスセキュリティ",
  itakuCd: "3001",
};

export const EMPTY_LOCATIONS: WorkLocation[] = [
  { timeStart: "", timeEnd: "", location: "", distance: "" },
  { timeStart: "", timeEnd: "", location: "", distance: "" },
  { timeStart: "", timeEnd: "", location: "", distance: "" },
  { timeStart: "", timeEnd: "", location: "", distance: "" },
];

export function newReport(): DailyReport {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `r-${Date.now()}`,
    clientId: "",
    clientName: "",
    reportDate: today,
    startTime: "08:30",
    endTime: "17:00",
    breakTime: "0:00",
    vehicles: 1,
    totalDistance: "",
    motoukeCd: "",
    headcount: 2,
    constructionName: "",
    guardIds: [],
    guardNames: "",
    constructionCompany: "",
    teamName: "",
    locations: JSON.parse(JSON.stringify(EMPTY_LOCATIONS)),
    areaSpan: "",
    stayLocation: "",
    stayCount: "",
    stayPersons: "",
    correction1Label: "",
    correction1Amount: "",
    correction2Label: "",
    correction2Amount: "",
    remarks: "",
    companyName: DEMO_COMPANY.name,
    itakuCd: DEMO_COMPANY.itakuCd,
    createdAt: today,
  };
}

export const DEMO_REPORTS: DailyReport[] = [
  {
    id: "demo-1",
    clientId: "c1",
    clientName: "㈱つうけん",
    reportDate: "2025-10-01",
    startTime: "08:30",
    endTime: "17:30",
    breakTime: "0:00",
    vehicles: 1,
    totalDistance: 16,
    motoukeCd: "10100",
    headcount: 2,
    constructionName: "サ総宅内",
    guardIds: ["g1", "g2"],
    guardNames: "浅沼 秀元　松葉 行裕",
    constructionCompany: "キャリネット",
    teamName: "武藤",
    locations: [
      { timeStart: "8:30", timeEnd: "10:25", location: "東区東雁来3条17丁3-16", distance: "" },
      { timeStart: "10:35", timeEnd: "12:15", location: "伏古10条2丁目10-20", distance: 3 },
      { timeStart: "12:45", timeEnd: "14:45", location: "伏古12条5丁目6-21", distance: 3 },
      { timeStart: "15:50", timeEnd: "17:30", location: "北21条東17丁3-29", distance: 10 },
    ],
    areaSpan: "",
    stayLocation: "",
    stayCount: "",
    stayPersons: "",
    correction1Label: "駐車料金",
    correction1Amount: 550,
    correction2Label: "",
    correction2Amount: "",
    remarks: "浅沼→松葉 46km",
    companyName: "㈲サイナスセキュリティ",
    itakuCd: "3001",
    createdAt: "2025-10-01",
  },
];
