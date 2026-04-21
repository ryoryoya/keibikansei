// 隊員マスタの型定義（User + GuardProfile 結合）
export type Guard = {
  id: string;
  // User
  name: string;
  nameKana: string;
  phone: string;
  isActive: boolean;
  // GuardProfile
  gender: "MALE" | "FEMALE" | "OTHER";
  birthDate: string;       // YYYY-MM-DD
  hireDate: string;        // YYYY-MM-DD
  experienceYears: number;
  qualifications: string[];
  skills: string[];
  payType: "DAILY" | "MONTHLY" | "HOURLY";
  basePay: number;
  bankName: string;
  bankBranch: string;
  bankAccountType: string; // 普通 / 当座
  bankAccountNum: string;
  bankAccountName: string;
  hasSmartphone: boolean;
  photoUrl: string;
  emergencyContact: string;
  address: string;
};

export const PAY_TYPE_LABELS: Record<Guard["payType"], string> = {
  DAILY: "日給",
  MONTHLY: "月給",
  HOURLY: "時給",
};

export const GENDER_LABELS: Record<Guard["gender"], string> = {
  MALE: "男",
  FEMALE: "女",
  OTHER: "その他",
};

export const QUALIFICATION_OPTIONS = [
  "交通誘導警備業務検定1級",
  "交通誘導警備業務検定2級",
  "施設警備業務検定1級",
  "施設警備業務検定2級",
  "空港保安警備業務検定1級",
  "空港保安警備業務検定2級",
  "核燃料物質等危険物運搬警備業務検定1級",
  "核燃料物質等危険物運搬警備業務検定2級",
  "警備員指導教育責任者（1号）",
  "警備員指導教育責任者（2号）",
];

export const SKILL_OPTIONS = [
  "リーダー",
  "夜勤可",
  "普通免許",
  "大型免許",
  "フォークリフト",
  "英語対応可",
];

export const EMPTY_GUARD: Omit<Guard, "id"> = {
  name: "",
  nameKana: "",
  phone: "",
  isActive: true,
  gender: "MALE",
  birthDate: "",
  hireDate: "",
  experienceYears: 0,
  qualifications: [],
  skills: [],
  payType: "DAILY",
  basePay: 0,
  bankName: "",
  bankBranch: "",
  bankAccountType: "普通",
  bankAccountNum: "",
  bankAccountName: "",
  hasSmartphone: true,
  photoUrl: "",
  emergencyContact: "",
  address: "",
};
