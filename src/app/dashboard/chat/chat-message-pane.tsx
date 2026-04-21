"use client";

import { useEffect, useRef, useState } from "react";
import { ChatAttachment, ChatMessage, ChatRoom, MANAGER_ID, formatTime } from "./chat-types";

type Props = {
  room: ChatRoom;
  messages: ChatMessage[];
  onSend: (body: string, attachments: ChatAttachment[]) => void;
};

function ChatBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  const hasBody = msg.body.trim() !== "";
  const hasAttachments = (msg.attachments?.length ?? 0) > 0;

  return (
    <div className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {/* アバター */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        isMe ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-600"
      }`}>
        {msg.senderName.slice(0, 1)}
      </div>
      <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
        <span className={`text-[10px] text-gray-400 px-1 ${isMe ? "text-right" : ""}`}>
          {msg.senderName} · {formatTime(msg.sentAt)}
        </span>
        {/* テキスト */}
        {hasBody && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isMe
              ? "bg-brand-500 text-white rounded-tr-sm"
              : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
          }`}>
            {msg.body}
          </div>
        )}
        {/* 添付ファイル */}
        {hasAttachments && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {msg.attachments!.map((att, i) =>
              att.type === "image" ? (
                <img
                  key={i}
                  src={att.url}
                  alt={att.name}
                  className="max-w-[200px] max-h-[200px] rounded-xl object-cover cursor-pointer border border-white/30"
                  onClick={() => window.open(att.url, "_blank")}
                />
              ) : (
                <video
                  key={i}
                  src={att.url}
                  controls
                  className="max-w-[240px] rounded-xl"
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatMessagePane({ room, messages, onSend }: Props) {
  const [text, setText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<ChatAttachment[]>([]);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const attachments: ChatAttachment[] = files.map((f) => ({
      type: f.type.startsWith("video/") ? "video" : "image",
      url: URL.createObjectURL(f),
      name: f.name,
    }));
    setPendingFiles((prev) => [...prev, ...attachments]);
    e.target.value = "";
  }

  function handleSend() {
    const body = text.trim();
    if (!body && pendingFiles.length === 0) return;
    onSend(body, pendingFiles);
    setText("");
    setPendingFiles([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl+Enter で送信
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  const canSend = text.trim() !== "" || pendingFiles.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="px-5 py-3 border-b bg-white flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${
          room.type === "BROADCAST" ? "bg-orange-100" :
          room.type === "PROJECT"   ? "bg-blue-100" :
          "bg-gray-100"
        }`}>
          {room.icon}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{room.name}</p>
          <p className="text-[10px] text-gray-400">
            {room.type === "BROADCAST" ? "全員への連絡" : room.type === "PROJECT" ? "プロジェクトグループ" : "個別メッセージ"}
          </p>
        </div>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} isMe={msg.senderId === MANAGER_ID} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className="border-t bg-white">
        {/* 添付ファイルプレビュー */}
        {pendingFiles.length > 0 && (
          <div className="px-4 pt-3 flex gap-2 flex-wrap">
            {pendingFiles.map((f, i) => (
              <div key={i} className="relative group">
                {f.type === "image" ? (
                  <img src={f.url} alt={f.name} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                ) : (
                  <video src={f.url} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                )}
                <button
                  onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 py-3 flex gap-2 items-end">
          {/* ファイル選択（hidden） */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          {/* 添付ボタン */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
            title="画像・動画を添付"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力... (Ctrl+Enterで送信)"
            rows={2}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              canSend ? "bg-brand-500 text-white hover:bg-brand-600" : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
