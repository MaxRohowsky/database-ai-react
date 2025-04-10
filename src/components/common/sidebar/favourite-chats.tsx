import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useChatStore } from "@/store/chat-store";
import { Star } from "lucide-react";
import { ChatItemDropdown } from "./chat-item-dropdown";
import { SidebarIcon } from "./sidebar-icon";

export function FavouriteChats() {
  const { chats, setCurrentChatId, currentChatId } = useChatStore();
  const favouriteChats = chats.filter((chat) => chat.isFavourite);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-black">
        <SidebarIcon icon={Star} label="Favourites" variant="amber" />
      </SidebarGroupLabel>
      <SidebarGroupContent className="my-2">
        {favouriteChats.length > 0 ? (
          favouriteChats.map((chat) => (
            <SidebarMenuItem
              className={`ml-8 border-l border-amber-200 p-1 py-[0.5px] ${
                currentChatId === chat.id
                  ? "bg-amber-100"
                  : "hover:bg-amber-100 active:bg-amber-100"
              }`}
              key={chat.id}
            >
              <SidebarMenuButton
                onClick={() => setCurrentChatId(chat.id)}
                className={`m-0 rounded-none p-0 ${
                  currentChatId === chat.id
                    ? "bg-amber-100 hover:bg-amber-100"
                    : "hover:bg-amber-100 active:bg-amber-100"
                }`}
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
            No favourites yet
          </div>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
