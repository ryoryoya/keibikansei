// 業務実施計画書（警備業法 第18条）の型定義とデモデータ

export type PatrolRoute = {
  order: number;
  location: string;
  action: string;
  frequency: string;
};

export type EmergencyProcedure = {
  situation: string;
  action: string;
  contact: string;
};

export type ServicePlan = {
  id: string;
  siteId: string;
  siteName: string;
  clientName: string;
  address: string;
  guardType: "1号警備" | "2号警備";
  contractStart: string;
  contractEnd: string | null;
  serviceHours: string;
  requiredGuards: number;
  requiredQualifications: string[];
  duties: string[];
  equipment: string[];
  patrolRoutes: PatrolRoute[];
  emergencyProcedures: EmergencyProcedure[];
  clientContactName: string;
  clientContactPhone: string;
  supervisorName: string;
  approvedDate: string;
  revisionNo: number;
};

export const DEMO_SERVICE_PLANS: ServicePlan[] = [
  {
    id: "sp1", siteId: "s1",
    siteName: "A現場（SBビルマネジメント本社ビル）", clientName: "SBビルマネジメント株式会社",
    address: "東京都港区虎ノ門1-1-1 SBビル",
    guardType: "1号警備", contractStart: "2024-04-01", contractEnd: null,
    serviceHours: "08:00〜20:00（実働12時間） / 夜間常駐 20:00〜翌08:00",
    requiredGuards: 3, requiredQualifications: ["施設警備業務2級以上"],
    duties: ["入退館者確認・受付対応", "施設内巡回警備（2時間ごと）", "駐車場管理", "防犯カメラ監視", "緊急時の初動対応・110番・119番通報"],
    equipment: ["警備員証", "制服・制帽", "無線機（IP無線）", "防犯カメラ監視端末", "緊急通報ボタン（各フロア）", "巡回記録端末"],
    patrolRoutes: [
      { order: 1, location: "1F エントランス・ロビー", action: "入退館者確認、不審者チェック、受付台帳記録", frequency: "常時" },
      { order: 2, location: "地下1F 駐車場",           action: "入出庫確認、不審車両・不審者チェック",      frequency: "1時間ごと" },
      { order: 3, location: "2F〜10F 各執務室前廊下",  action: "施錠確認、不審物チェック、消灯確認",       frequency: "2時間ごと（夜間）" },
      { order: 4, location: "屋上・機械室",            action: "施錠確認、異常の有無確認",                 frequency: "1日2回（開始・終了時）" },
    ],
    emergencyProcedures: [
      { situation: "不審者発見時",     action: "声掛け・身分確認後、110番通報。依頼主担当者へ連絡。現場保全。",                          contact: "警察110番 / 依頼主緊急連絡先" },
      { situation: "火災発生時",       action: "119番通報、館内非常放送、避難誘導。依頼主緊急連絡先へ連絡後、会社へ報告。",              contact: "消防119番 / 依頼主緊急連絡先" },
      { situation: "負傷者・急病人",   action: "119番通報、AED使用、応急手当実施。依頼主担当者・会社緊急連絡先へ連絡。",               contact: "救急119番 / 会社緊急連絡先" },
      { situation: "設備異常（停電等）", action: "設備管理会社へ連絡後、依頼主担当者へ報告。安全確認後、巡回強化。",                    contact: "設備管理会社 / 依頼主担当者" },
    ],
    clientContactName: "佐藤 健一 施設管理部長", clientContactPhone: "03-1000-2000（内線205）",
    supervisorName: "鈴木 三郎（警備員指導教育責任者）", approvedDate: "2024-03-15", revisionNo: 3,
  },
  {
    id: "sp2", siteId: "s2",
    siteName: "B現場（都立第三病院）", clientName: "都立第三病院",
    address: "東京都新宿区西新宿5-3-2",
    guardType: "1号警備", contractStart: "2023-10-01", contractEnd: null,
    serviceHours: "08:00〜17:00（日勤） / 21:00〜翌06:00（夜間巡回）",
    requiredGuards: 2, requiredQualifications: ["施設警備業務2級以上", "AED使用資格"],
    duties: ["病院入口・受付警備", "夜間巡回（病棟・駐車場）", "迷惑行為者対応", "救急搬送誘導補助", "防犯カメラ監視"],
    equipment: ["警備員証", "制服・制帽", "無線機", "AED（各フロア設置済み）", "巡回記録端末"],
    patrolRoutes: [
      { order: 1, location: "正面玄関・受付",       action: "入場者確認、時間外入場管理",       frequency: "常時（日勤時）" },
      { order: 2, location: "外来棟1F〜3F",         action: "不審者チェック、施錠確認",         frequency: "1時間ごと" },
      { order: 3, location: "病棟4F〜8F",           action: "不審者チェック、静粛確認",         frequency: "2時間ごと（夜間）" },
      { order: 4, location: "駐車場（地下1F・屋上）", action: "不審車両・無断駐車確認、施錠確認", frequency: "1時間ごと" },
    ],
    emergencyProcedures: [
      { situation: "迷惑行為者対応",   action: "口頭注意後、退場要請。応じない場合は110番通報。事務長へ連絡。", contact: "警察110番 / 事務長直通" },
      { situation: "急患・急変時",     action: "ナースコール・当直医へ即報。必要に応じ救急車誘導。AED使用補助。", contact: "当直ナースステーション / 救急119番" },
    ],
    clientContactName: "山田 事務長", clientContactPhone: "03-2000-3000（内線101）",
    supervisorName: "鈴木 三郎（警備員指導教育責任者）", approvedDate: "2023-09-20", revisionNo: 2,
  },
  {
    id: "sp3", siteId: "s3",
    siteName: "C現場（東京建設 工事現場）", clientName: "東京建設株式会社",
    address: "東京都港区芝浦4-11-1（工事現場）",
    guardType: "2号警備", contractStart: "2025-01-15", contractEnd: "2025-12-31",
    serviceHours: "07:30〜17:30（実働9時間）",
    requiredGuards: 4, requiredQualifications: ["交通誘導警備業務2級以上"],
    duties: ["工事車両の誘導・整理", "歩行者安全誘導", "工事区域立入禁止管理", "近隣住民・通行人への対応"],
    equipment: ["警備員証", "制服・制帽・蛍光ベスト", "誘導棒（点滅式）", "カラーコーン・バリケード", "トランシーバー"],
    patrolRoutes: [
      { order: 1, location: "北側出入口",   action: "工事車両誘導、歩行者分離",       frequency: "常時（2名配置）" },
      { order: 2, location: "南側歩道",     action: "歩行者誘導、迂回路案内",         frequency: "常時（1名配置）" },
      { order: 3, location: "東側交差点",   action: "工事車両出入り時の交通誘導",     frequency: "車両通行時（1名配置）" },
    ],
    emergencyProcedures: [
      { situation: "交通事故発生時",   action: "119番・110番通報。二次事故防止のための交通規制。現場保全。工事責任者へ連絡。", contact: "警察110番 / 救急119番" },
      { situation: "工事中事故",       action: "119番通報、応急手当。工事現場責任者・会社緊急連絡先へ連絡。", contact: "救急119番 / 工事責任者" },
    ],
    clientContactName: "田中 現場監督", clientContactPhone: "090-0000-1111",
    supervisorName: "鈴木 三郎（警備員指導教育責任者）", approvedDate: "2025-01-10", revisionNo: 1,
  },
];
