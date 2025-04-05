import React from 'react';
import { Button } from "@/components/ui/button"

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: string;
}

interface SidebarProps {
  chatHistory: ChatHistoryItem[];
  currentChatId: string;
  onNewChat: () => void;
  onLoadChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  chatHistory,
  currentChatId,
  onNewChat,
  onLoadChat,
  onDeleteChat
}) => {
  return (
    <div className="w-64 bg-gray-800 flex flex-col h-full">
      <div className="p-4">
      
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={onNewChat}
        >
          New Chat
        </button>
      </div>
      <div className="overflow-y-auto flex-grow">
        <div className="px-4 py-2 text-gray-400 text-sm uppercase font-semibold">Chat History</div>
        {chatHistory.length === 0 ? (
          <div className="px-4 py-2 text-gray-500 italic text-sm">No chat history</div>
        ) : (
          <div>
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`px-4 py-2 hover:bg-gray-700 cursor-pointer flex justify-between items-center ${
                  chat.id === currentChatId ? 'bg-gray-700' : ''
                }`}
              >
                <div className="truncate flex-grow" onClick={() => onLoadChat(chat.id)}>
                  {chat.title}
                </div>
                <button
                  className="text-gray-400 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  title="Delete chat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 