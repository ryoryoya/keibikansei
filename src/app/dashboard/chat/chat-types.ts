// チャット機能の型定義とデモデータ

export type RoomType = "BROADCAST" | "DIRECT" | "PROJECT";

export type ChatRoom = {
  id: string;
  name: string;
  type: RoomType;
  lastMessage: string;
  lastAt: string;       // ISO文字列
  unreadCount: number;
  icon: string;
};

export type SenderRole = "MANAGER" | "GUARD";

export type ChatAttachment = {
  type: "image" | "video";
  url: string;   // デモ: ObjectURL / 本番: Supabase Storage URL
  name: string;
};

export type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: SenderRole;
  body: string;
  sentAt: string;       // ISO文字列
  attachments?: ChatAttachment[];
};

// 管制担当者ID（サイドバーの表示名と一致）
export const MANAGER_ID   = "manager1";
export const MANAGER_NAME = "鈴木 花子";

// ──── デモルーム ────
export const DEMO_ROOMS: ChatRoom[] = [
  {
    id: "room-broadcast",
    name: "一斉連絡",
    type: "BROADCAST",
    lastMessage: "本日のA現場の集合時間は7:30です。よろしくお願いします。",
    lastAt: "2026-03-30T07:00:00",
    unreadCount: 0,
    icon: "📢",
  },
  {
    id: "room-g1",
    name: "田中 一郎",
    type: "DIRECT",
    lastMessage: "了解しました。定刻に参ります。",
    lastAt: "2026-03-30T07:12:00",
    unreadCount: 1,
    icon: "👤",
  },
  {
    id: "room-g4",
    name: "伊藤 四郎",
    type: "DIRECT",
    lastMessage: "体調が少し優れないのですが…",
    lastAt: "2026-03-29T23:45:00",
    unreadCount: 2,
    icon: "👤",
  },
  {
    id: "room-project-a",
    name: "A現場グループ",
    type: "PROJECT",
    lastMessage: "駐車場の南ゲート、鍵の場所を確認してください。",
    lastAt: "2026-03-30T08:30:00",
    unreadCount: 0,
    icon: "🏢",
  },
];

// ──── デモメッセージ ────
function msg(
  id: string, roomId: string,
  senderId: string, senderName: string, senderRole: SenderRole,
  body: string, sentAt: string
): ChatMessage {
  return { id, roomId, senderId, senderName, senderRole, body, sentAt };
}

export const DEMO_MESSAGES: Record<string, ChatMessage[]> = {
  "room-broadcast": [
    msg("m1","room-broadcast", MANAGER_ID, MANAGER_NAME, "MANAGER",
      "【連絡】本日3/30のA現場の集合時間は7:30です。遅刻しないようお願いします。", "2026-03-30T07:00:00"),
    msg("m2","room-broadcast", MANAGER_ID, MANAGER_NAME, "MANAGER",
      "C現場夜勤メンバーへ: 引き継ぎ資料を更新しました。ロッカーに保管しています。", "2026-03-29T17:30:00"),
    msg("m3","room-broadcast", MANAGER_ID, MANAGER_NAME, "MANAGER",
      "【重要】4月のシフト希望締め切りは3/31（火）です。アプリから入力をお願いします。", "2026-03-28T10:00:00"),
  ],
  "room-g1": [
    msg("m4","room-g1", MANAGER_ID, MANAGER_NAME, "MANAGER",
      "田中さん、本日のA現場の集合時間は7:30になります。よろしくお願いします。", "2026-03-30T07:00:00"),
    msg("m5","room-g1", "g1", "田中 一郎", "GUARD",
      "了解しました。定刻に参ります。", "2026-03-30T07:12:00"),
    msg("m6","room-g1", MANAGER_ID, MANAGER_NAME, "MANAGER",
      "ありがとうございます。南ゲートの鍵は守衛室にあります。", "2026-03-30T07:15:00"),
  ],
  "room-g4": [
    msg("m7","room-g4", "g4", "伊藤 四郎", "GUARD",
      "鈴木さん、少し体調が優れないのですが…今日は出勤できそうです。", "2026-03-29T23:40:00"),
    msg("m8","room-g4", "g4", "伊藤 四郎", "GUARD",
      "体調が少し優れないのですが…", "2026-03-29T23:45:00"),
    msg("m9","room-g4", MANAGER_ID, MANAGER_NAME, "MANAGER",
      "伊藤さん、無理しないでください。体調が悪い場合は早めに連絡をください。", "2026-03-29T23:50:00"),
  ],
  "room-project-a": [
    msg("m10","room-project-a", MANAGER_ID, MANAGER_NAME, "MANAGER",
      "A現場メンバーの皆さん、本日もよろしくお願いします。", "2026-03-30T07:00:00"),
    msg("m11","room-project-a", "g1", "田中 一郎", "GUARD",
      "よろしくお願いします！", "2026-03-30T07:05:00"),
    msg("m12","room-project-a", "g2", "高橋 二郎", "GUARD",
      "駐車場の南ゲート、鍵の場所を確認してください。", "2026-03-30T08:30:00"),
    msg("m13","room-project-a", MANAGER_ID, MANAGER_NAME, "MANAGER",
      "守衛室の右引き出しに保管しています。", "2026-03-30T08:35:00"),
  ],
};

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = now.toDateString();
  if (d.toDateString() === today) {
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}
