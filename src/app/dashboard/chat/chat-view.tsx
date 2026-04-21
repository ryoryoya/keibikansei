"use client";

import { useState } from "react";
import { ChatAttachment, ChatMessage, ChatRoom, DEMO_MESSAGES, DEMO_ROOMS, MANAGER_ID, MANAGER_NAME } from "./chat-types";
import { ChatRoomList } from "./chat-room-list";
import { ChatMessagePane } from "./chat-message-pane";
import { sendMessage } from "@/app/actions/chat";

export function ChatView() {
  const [rooms, setRooms] = useState<ChatRoom[]>(DEMO_ROOMS);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(DEMO_MESSAGES);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;
  const currentMessages = selectedRoomId ? (messages[selectedRoomId] ?? []) : [];

  function handleSelectRoom(id: string) {
    setSelectedRoomId(id);
    // 選択したルームの未読をクリア
    setRooms((prev) => prev.map((r) => r.id === id ? { ...r, unreadCount: 0 } : r));
  }

  async function handleSend(body: string, attachments: ChatAttachment[]) {
    if (!selectedRoomId) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      roomId: selectedRoomId,
      senderId: MANAGER_ID,
      senderName: MANAGER_NAME,
      senderRole: "MANAGER",
      body,
      sentAt: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    setMessages((prev) => ({
      ...prev,
      [selectedRoomId]: [...(prev[selectedRoomId] ?? []), newMsg],
    }));
    const preview = body || (attachments.length > 0 ? `📎 ${attachments[0].name}` : "");
    setRooms((prev) =>
      prev.map((r) => r.id === selectedRoomId ? { ...r, lastMessage: preview, lastAt: newMsg.sentAt } : r)
    );
    try {
      await sendMessage(selectedRoomId, body);
    } catch (e) {
      console.error("メッセージ送信エラー:", e);
    }
  }

  const totalUnread = rooms.reduce((s, r) => s + r.unreadCount, 0);

  return (
    <div className="min-h-full bg-white -m-6 flex" style={{ height: "calc(100vh - 0px)" }}>
      {/* ルーム一覧（左パネル） */}
      <div className="w-72 border-r flex flex-col shrink-0">
        {totalUnread > 0 && (
          <div className="mx-3 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
            未読メッセージ {totalUnread}件
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <ChatRoomList rooms={rooms} selectedId={selectedRoomId} onSelect={handleSelectRoom} />
        </div>
      </div>

      {/* メッセージエリア（右パネル） */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedRoom ? (
          <ChatMessagePane room={selectedRoom} messages={currentMessages} onSend={handleSend} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-3">
            <span className="text-5xl">💬</span>
            <p className="text-sm">チャットルームを選択してください</p>
          </div>
        )}
      </div>
    </div>
  );
}
