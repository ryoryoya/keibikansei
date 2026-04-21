// 警備員名簿（警備業法 第45条）の型定義とデモデータ

export type RosterEntry = {
  id: string;
  name: string;
  nameKana: string;
  birthDate: string;        // YYYY-MM-DD
  address: string;
  phone: string;
  emergencyContact: string; // "田中 花子（妻）090-XXXX-XXXX"
  hireDate: string;
  retireDate: string | null;
  qualifications: string[];
  educationStatus: "完了" | "受講中" | "未完了";
  isActive: boolean;
};

export const DEMO_ROSTER: RosterEntry[] = [
  {
    id: "g1", name: "田中 一郎", nameKana: "たなか いちろう",
    birthDate: "1985-06-15", address: "東京都杉並区高円寺南3-1-1",
    phone: "090-1234-5678", emergencyContact: "田中 花子（妻）090-8765-4321",
    hireDate: "2018-04-01", retireDate: null,
    qualifications: ["施設警備業務2級", "交通誘導警備業務1級"],
    educationStatus: "完了", isActive: true,
  },
  {
    id: "g2", name: "高橋 二郎", nameKana: "たかはし じろう",
    birthDate: "1990-03-22", address: "東京都中野区中野5-2-3",
    phone: "090-2345-6789", emergencyContact: "高橋 洋子（母）03-3310-XXXX",
    hireDate: "2020-07-01", retireDate: null,
    qualifications: ["交通誘導警備業務2級"],
    educationStatus: "完了", isActive: true,
  },
  {
    id: "g3", name: "鈴木 三郎", nameKana: "すずき さぶろう",
    birthDate: "1978-11-08", address: "神奈川県川崎市中原区2-4-5",
    phone: "090-3456-7890", emergencyContact: "鈴木 涼子（妻）090-XXXX-0001",
    hireDate: "2015-10-01", retireDate: null,
    qualifications: ["施設警備業務1級", "警備員指導教育責任者（1号）"],
    educationStatus: "完了", isActive: true,
  },
  {
    id: "g4", name: "伊藤 四郎", nameKana: "いとう しろう",
    birthDate: "1988-09-30", address: "東京都世田谷区経堂3-5-6",
    phone: "090-4567-8901", emergencyContact: "伊藤 明美（妻）090-XXXX-0002",
    hireDate: "2019-01-15", retireDate: null,
    qualifications: ["施設警備業務2級"],
    educationStatus: "完了", isActive: true,
  },
  {
    id: "g5", name: "渡辺 五郎", nameKana: "わたなべ ごろう",
    birthDate: "1995-02-14", address: "埼玉県さいたま市浦和区6-7-8",
    phone: "090-5678-9012", emergencyContact: "渡辺 圭子（母）048-XXX-XXXX",
    hireDate: "2023-04-01", retireDate: null,
    qualifications: [],
    educationStatus: "受講中", isActive: true,
  },
  {
    id: "g6", name: "加藤 六郎", nameKana: "かとう ろくろう",
    birthDate: "1982-07-20", address: "東京都江東区木場2-8-9",
    phone: "090-6789-0123", emergencyContact: "加藤 真理（妻）090-XXXX-0003",
    hireDate: "2017-06-01", retireDate: null,
    qualifications: ["交通誘導警備業務1級"],
    educationStatus: "完了", isActive: true,
  },
  {
    id: "g7", name: "吉田 七子", nameKana: "よしだ ななこ",
    birthDate: "1992-12-03", address: "東京都豊島区池袋西口9-1-2",
    phone: "090-7890-1234", emergencyContact: "吉田 正雄（父）03-XXXX-XXXX",
    hireDate: "2021-04-01", retireDate: null,
    qualifications: ["施設警備業務2級"],
    educationStatus: "完了", isActive: true,
  },
  {
    id: "g9", name: "松本 九郎", nameKana: "まつもと くろう",
    birthDate: "1970-05-18", address: "東京都板橋区成増1-3-4",
    phone: "090-9012-3456", emergencyContact: "松本 幸子（妻）03-XXXX-YYYY",
    hireDate: "2010-04-01", retireDate: "2025-03-31",
    qualifications: ["施設警備業務1級"],
    educationStatus: "完了", isActive: false,
  },
];
