// 苦情処理簿（警備業法 第20条）の型定義とデモデータ

export type ComplaintStatus = "受付" | "対応中" | "解決済み";

export type ComplaintEntry = {
  id: string;
  receivedDate: string;
  receivedBy: string;
  complainantType: "依頼主" | "第三者" | "その他";
  complainantName: string;
  siteName: string;
  guardId: string | null;
  guardName: string | null;
  content: string;
  response: string;
  resolvedDate: string | null;
  resolvedBy: string | null;
  preventiveMeasure: string;
  status: ComplaintStatus;
};

export const COMPLAINT_STATUS_CONFIG: Record<ComplaintStatus, { bg: string }> = {
  受付:    { bg: "bg-amber-100 text-amber-700" },
  対応中:  { bg: "bg-blue-100 text-blue-700" },
  解決済み: { bg: "bg-green-100 text-green-700" },
};

export const DEMO_COMPLAINTS: ComplaintEntry[] = [
  {
    id: "c1",
    receivedDate: "2025-11-12", receivedBy: "鈴木 花子",
    complainantType: "依頼主", complainantName: "SBビルマネジメント 佐藤部長",
    siteName: "A現場（SBビルマネジメント本社ビル）",
    guardId: "g2", guardName: "高橋 二郎",
    content: "11/12 午後2時頃、警備員が受付カウンターで居眠りをしているのを来訪者に目撃された。",
    response: "直ちに該当隊員へ厳重注意。依頼主担当者へ謝罪訪問（11/13）。始業前ミーティングを強化。",
    resolvedDate: "2025-11-14", resolvedBy: "鈴木 花子",
    preventiveMeasure: "日勤帯の巡回頻度を1時間ごとに変更。現場責任者による抜き打ち確認を月2回実施。",
    status: "解決済み",
  },
  {
    id: "c2",
    receivedDate: "2025-08-03", receivedBy: "山田 管理者",
    complainantType: "第三者", complainantName: "通行人（氏名不明）",
    siteName: "C現場（東京建設 工事現場）",
    guardId: null, guardName: null,
    content: "工事現場付近の歩道誘導が不十分で、雨天時に歩行者が車道に出てしまう危険な状況があった。",
    response: "現場確認後、配置隊員を1名増員。雨天用バリケードを追加設置。誘導手順を見直し。",
    resolvedDate: "2025-08-10", resolvedBy: "山田 管理者",
    preventiveMeasure: "雨天・悪天候時の特別手順書を作成し全隊員へ周知。現場責任者の確認を義務付け。",
    status: "解決済み",
  },
  {
    id: "c3",
    receivedDate: "2026-02-20", receivedBy: "鈴木 花子",
    complainantType: "依頼主", complainantName: "都立第三病院 山田事務長",
    siteName: "B現場（都立第三病院）",
    guardId: "g1", guardName: "田中 一郎",
    content: "夜間巡回の記録に空白があり、複数の時間帯で巡回が行われていない可能性がある。記録の管理を徹底してほしい。",
    response: "記録確認中。当該隊員へのヒアリング実施（2/21）。巡回記録端末のログを照合中。",
    resolvedDate: null, resolvedBy: null,
    preventiveMeasure: "（対応中）",
    status: "対応中",
  },
  {
    id: "c4",
    receivedDate: "2026-03-25", receivedBy: "鈴木 花子",
    complainantType: "依頼主", complainantName: "SBビルマネジメント 佐藤部長",
    content: "3/25 午前、警備員の制服に汚れが目立つ状態で勤務していた。身だしなみの指導を要望。",
    siteName: "A現場（SBビルマネジメント本社ビル）",
    guardId: "g5", guardName: "渡辺 五郎",
    response: "受付・内容確認済み。対応検討中。",
    resolvedDate: null, resolvedBy: null,
    preventiveMeasure: "（対応予定）",
    status: "受付",
  },
];
