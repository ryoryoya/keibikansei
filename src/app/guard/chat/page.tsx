"use client";

import { useEffect, useRef, useState } from "react";

type Attachment = {
  type: "image" | "video";
  url: string;
  name: string;
};

type Msg = {
  id: string;
  from: "me" | "manager";
  body: string;
  sentAt: string;
  attachments?: Attachment[];
};

const INITIAL_BROADCAST: Msg[] = [
  { id: "b1", from: "manager", body: "本日のA現場の集合時間は7:30です。よろしくお願いします。", sentAt: "07:00" },
  { id: "b2", from: "manager", body: "【重要】4月のシフト希望締め切りは3/31（火）です。アプリから入力をお願いします。", sentAt: "07:05" },
];

const INITIAL_DIRECT: Msg[] = [
  { id: "d1", from: "manager", body: "田中さん、本日もよろしくお願いします。", sentAt: "06:55" },
  { id: "d2", from: "me",      body: "よろしくお願いします！", sentAt: "07:10" },
  { id: "d3", from: "manager", body: "南ゲートの鍵は守衛室の右引き出しにあります。", sentAt: "07:12" },
];

type Tab = "broadcast" | "direct";

function formatNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

export default function GuardChatPage() {
  const [tab, setTab]               = useState<Tab>("direct");
  const [broadcast, setBroadcast]   = useState<Msg[]>(INITIAL_BROADCAST);
  const [direct, setDirect]         = useState<Msg[]>(INITIAL_DIRECT);
  const [text, setText]             = useState("");
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const fileInputRef                = useRef<HTMLInputElement>(null);

  const messages = tab === "broadcast" ? broadcast : direct;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const attachments: Attachment[] = files.map((f) => ({
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
    const msg: Msg = {
      id: `m-${Date.now()}`,
      from: "me",
      body,
      sentAt: formatNow(),
      attachments: pendingFiles.length > 0 ? pendingFiles : undefined,
    };
    if (tab === "broadcast") {
      setBroadcast((prev) => [...prev, msg]);
    } else {
      setDirect((prev) => [...prev, msg]);
    }
    setText("");
    setPendingFiles([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const canSend = text.trim() !== "" || pendingFiles.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* タブ */}
      <div className="flex border-b bg-white shrink-0">
        <button
          onClick={() => setTab("broadcast")}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === "broadcast" ? "border-brand-500 text-brand-600" : "border-transparent text-gray-400"
          }`}
        >
          一斉連絡
        </button>
        <button
          onClick={() => setTab("direct")}
          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === "direct" ? "border-brand-500 text-brand-600" : "border-transparent text-gray-400"
          }`}
        >
          管制室
        </button>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.from === "me" ? "flex-row-reverse" : "flex-row"}`}>
            {msg.from === "manager" && (
              <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                鈴
              </div>
            )}
            <div className={`max-w-[80%] flex flex-col gap-0.5 ${msg.from === "me" ? "items-end" : "items-start"}`}>
              <span className="text-[10px] text-gray-400 px-1">{msg.from === "manager" ? "鈴木 花子" : "自分"} · {msg.sentAt}</span>
              {msg.body.trim() !== "" && (
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.from === "me"
                    ? "bg-brand-500 text-white rounded-tr-sm"
                    : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                }`}>
                  {msg.body}
                </div>
              )}
              {/* 添付ファイル */}
              {(msg.attachments?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {msg.attachments!.map((att, i) =>
                    att.type === "image" ? (
                      <img
                        key={i}
                        src={att.url}
                        alt={att.name}
                        className="max-w-[180px] max-h-[180px] rounded-xl object-cover cursor-pointer border border-white/30"
                        onClick={() => window.open(att.url, "_blank")}
                      />
                    ) : (
                      <video key={i} src={att.url} controls className="max-w-[220px] rounded-xl" />
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      {tab === "broadcast" ? (
        <div className="px-4 py-3 border-t bg-white text-xs text-gray-400 text-center shrink-0">
          一斉連絡は管制室からの連絡のみです
        </div>
      ) : (
        <div className="border-t bg-white shrink-0">
          {/* 添付ファイルプレビュー */}
          {pendingFiles.length > 0 && (
            <div className="px-4 pt-3 flex gap-2 flex-wrap">
              {pendingFiles.map((f, i) => (
                <div key={i} className="relative group">
                  {f.type === "image" ? (
                    <img src={f.url} alt={f.name} className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
                  ) : (
                    <video src={f.url} className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
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
              placeholder="管制室へメッセージ..."
              rows={2}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
            />
            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                canSend ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              送信
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
