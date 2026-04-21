"use client";

import { ChatRoom, formatTime } from "./chat-types";

type Props = {
  rooms: ChatRoom[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ChatRoomList({ rooms, selectedId, onSelect }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b bg-gray-50">
        <h2 className="text-sm font-bold text-gray-700">チャット</h2>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelect(room.id)}
            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
              selectedId === room.id ? "bg-brand-50 border-l-4 border-brand-500" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                room.type === "BROADCAST" ? "bg-orange-100" :
                room.type === "PROJECT"   ? "bg-blue-100" :
                "bg-gray-100"
              }`}>
                {room.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-semibold text-gray-900 truncate">{room.name}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{formatTime(room.lastAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <p className="text-xs text-gray-500 truncate">{room.lastMessage}</p>
                  {room.unreadCount > 0 && (
                    <span className="shrink-0 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
