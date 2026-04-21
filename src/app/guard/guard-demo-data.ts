// 隊員アプリ用デモデータ（田中 一郎 / g1 として固定）

export const GUARD_ME = {
  id: "g1",
  name: "田中 一郎",
  nameKana: "タナカ イチロウ",
  orgName: "サンプル警備株式会社",
};

export type ClockState = {
  wakeUpAt: string | null;
  departureAt: string | null;
  clockIn: string | null;
  clockOut: string | null;
};

export type TodayAssignment = {
  id: "a1";
  projectName: string;
  clientName: string;
  siteName: string;
  address: string;
  meetingPoint: string;
  startTime: string;
  endTime: string;
  notes: string;
  clockState: ClockState;
};

export const TODAY_ASSIGNMENT: TodayAssignment = {
  id: "a1",
  projectName: "[A現場] 施設警備 常駐",
  clientName: "SBビルマネジメント株式会社",
  siteName: "SBビル",
  address: "東京都港区虎ノ門1-1-1",
  meetingPoint: "正面玄関前",
  startTime: "08:00",
  endTime: "17:00",
  notes: "本日は南口の工事のため、北口から入場してください。",
  clockState: {
    wakeUpAt: "06:30",
    departureAt: "07:10",
    clockIn: null,
    clockOut: null,
  },
};

export type UpcomingAssignment = {
  date: string;      // "YYYY-MM-DD"
  dateLabel: string; // "4/16（水）"
  projectName: string;
  time: string;
  confirmed: boolean;
};

export const UPCOMING: UpcomingAssignment[] = [
  { date: "2026-03-31", dateLabel: "3/31（火）", projectName: "[A現場] 施設警備 常駐", time: "08:00〜17:00", confirmed: true },
  { date: "2026-04-01", dateLabel: "4/1（水）",  projectName: "[B現場] 交通誘導 日勤",  time: "08:00〜17:00", confirmed: false },
  { date: "2026-04-02", dateLabel: "4/2（木）",  projectName: "[A現場] 施設警備 常駐", time: "08:00〜17:00", confirmed: false },
  { date: "2026-04-03", dateLabel: "4/3（金）",  projectName: "[A現場] 施設警備 常駐", time: "08:00〜17:00", confirmed: false },
];

// ──── 警備報告書用マスターデータ（管制側設定のデモ） ────

export type ReportSite = { id: string; name: string; address: string };

export type ReportClient = {
  id: string;
  name: string;
  sites: ReportSite[];
};

export const REPORT_CLIENTS: ReportClient[] = [
  {
    id: "rc1", name: "株式会社山田建設",
    sites: [
      { id: "rs1", name: "国道20号線 舗装補修工事",  address: "東京都調布市国領町2丁目" },
      { id: "rs2", name: "多摩川橋梁補強工事",       address: "東京都多摩市関戸4丁目" },
    ],
  },
  {
    id: "rc2", name: "ABC土木工業株式会社",
    sites: [
      { id: "rs3", name: "市道中野8号線 整備工事",   address: "東京都中野区中野3丁目" },
    ],
  },
  {
    id: "rc3", name: "東京建設工業株式会社",
    sites: [
      { id: "rs4", name: "○○マンション新築工事",    address: "東京都品川区大崎1丁目" },
      { id: "rs5", name: "商業施設リノベーション工事", address: "東京都渋谷区恵比寿2丁目" },
    ],
  },
];

export type ReportGuard = {
  id: string;
  name: string;
  licenseNo: string;
};

export const REPORT_GUARDS: ReportGuard[] = [
  { id: "g1", name: "田中 一郎", licenseNo: "東京第12345号" },
  { id: "g2", name: "高橋 二郎", licenseNo: "東京第23456号" },
  { id: "g3", name: "山田 三郎", licenseNo: "東京第34567号" },
  { id: "g4", name: "伊藤 四郎", licenseNo: "東京第45678号" },
];

export const WORK_TYPES = [
  "交通誘導警備（第2号）",
  "雑踏警備（第2号）",
  "施設警備（第1号）",
  "建設工事現場警備",
];

export const PAYSLIP_DEMO = {
  year: 2026,
  month: 2,
  workDays: 22,
  basePay: 220000,
  overtimePay: 12500,
  nightPay: 8750,
  holidayPay: 10000,
  allowances: 5000,
  grossPay: 256250,
  healthInsurance: 12800,
  pensionInsurance: 23460,
  employmentInsurance: 1281,
  incomeTax: 8250,
  totalDeductions: 45791,
  netPay: 210459,
  records: [
    { date: "2/3（月）", project: "A現場", hours: 8, baseAmount: 10000, overtime: 0, night: 0 },
    { date: "2/4（火）", project: "A現場", hours: 9, baseAmount: 10000, overtime: 1250, night: 0 },
    { date: "2/5（水）", project: "B現場", hours: 8, baseAmount: 10000, overtime: 0, night: 0 },
    { date: "2/6（木）", project: "A現場", hours: 8, baseAmount: 10000, overtime: 0, night: 0 },
    { date: "2/7（金）", project: "C現場", hours: 12, baseAmount: 10000, overtime: 1250, night: 3500 },
  ],
};
