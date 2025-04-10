import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useChatStore } from "@/store/chat-store";
import { MessageCircle } from "lucide-react";
import ChatItemDropdown from "./chat-item-dropdown";
import SidebarIcon from "./sidebar-icon";

export default function RecentChats() {
  const { chats, setCurrentChatId, currentChatId } = useChatStore();
  const recentChats = chats.filter((chat) => !chat.isFavourite);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-black">
        <SidebarIcon icon={MessageCircle} label="Recent Chats" variant="blue" />
      </SidebarGroupLabel>
      <SidebarGroupContent className="my-2">
        {recentChats.length > 0 ? (
          recentChats.map((chat) => (
            <SidebarMenuItem
              className={`ml-8 border-l border-blue-100 p-1 py-[0.5px] ${
                currentChatId === chat.id
                  ? "bg-blue-100"
                  : "hover:bg-blue-100 active:bg-blue-100"
              }`}
              key={chat.id}
            >
              <SidebarMenuButton
                className={`m-0 rounded-none p-0 ${
                  currentChatId === chat.id
                    ? "bg-blue-100 hover:bg-blue-100"
                    : "hover:bg-blue-100 active:bg-blue-100"
                }`}
                onClick={() => setCurrentChatId(chat.id)}
              >
                <span className="px-2 text-base text-gray-700">
                  {chat.title}
                </span>
              </SidebarMenuButton>
              <ChatItemDropdown chat={chat} />
            </SidebarMenuItem>
          ))
        ) : (
          <div className="text-muted-foreground px-3 py-2 text-sm">
            No recent chats
          </div>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
