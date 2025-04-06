import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useChatStore } from "@/store/chat-store";
import {
  MessageCircle,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const AppSidebar = () => {
  const { chats, setCurrentChatId, createNewChat, deleteChat } = useChatStore();

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  return (
    <Sidebar>
      <SidebarContent className="">
        <Button className="w-full justify-start" onClick={createNewChat}>
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>

        <SidebarMenu>
          <SidebarGroup>
            <SidebarGroupLabel className="text-black">
              <Star className="mr-2 h-4 w-4 text-amber-500" />
              Favourites
            </SidebarGroupLabel>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel className="text-black">
              <MessageCircle className="mr-2 h-4 w-4" />
              Recent Chats
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {chats.map((chats) => (
                <SidebarMenuItem className="py-[0.5px]" key={chats.id}>
                  <SidebarMenuButton onClick={() => handleSelectChat(chats.id)}>
                    <span>{chats.title}</span>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction>
                        <MoreHorizontal />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem>
                        <Star className="mr-2 h-4 w-4 text-amber-500" />
                        <span>Favourite</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteChat(e, chats.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Remove</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};
