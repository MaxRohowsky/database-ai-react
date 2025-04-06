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
import { ScrollArea } from "./ui/scroll-area";
// Helper function to format date
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
};

export const AppSidebar = () => {
  const { chats, currentChatId, setCurrentChatId, createNewChat, deleteChat } =
    useChatStore();

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

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-3">
            <div className="px-4 py-2 pb-4">
              {chats.length > 0 && (
                <>
                  <h4 className="text-muted-foreground mb-2 text-sm font-medium">
                    History of previous chats
                  </h4>

                  <div className="space-y-1">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        className="group flex w-full items-center"
                      >
                        <Button
                          variant={
                            currentChatId === chat.id ? "secondary" : "ghost"
                          }
                          className="mr-1 flex-grow justify-start truncate pr-2 text-left font-normal"
                          onClick={() => handleSelectChat(chat.id)}
                        >
                          <div className="flex-1 truncate">
                            {chat.title}
                            <div className="text-muted-foreground mt-1 text-xs">
                              {formatDate(chat.updatedAt)}
                            </div>
                          </div>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                        >
                          <Trash2 className="text-muted-foreground hover:text-destructive h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {chats.length === 0 && (
                <div className="text-muted-foreground p-4 text-center">
                  <p>No chat history yet</p>
                  <p className="mt-1 text-sm">Start a new chat to begin</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};
