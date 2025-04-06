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
  PenSquare,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { RenameDialog } from "./rename-chat-dialog";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const AppSidebar = () => {
  const {
    chats,
    setCurrentChatId,
    createNewChat,
    deleteChat,
    favouriteChat,
    renameChat,
  } = useChatStore();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  const handleOpenRenameDialog = (
    e: React.MouseEvent,
    chat: { id: string; title: string },
  ) => {
    e.stopPropagation();
    setChatToRename(chat);
    setRenameDialogOpen(true);
  };

  const handleRenameChat = (newTitle: string) => {
    if (chatToRename) {
      renameChat(chatToRename.id, newTitle);
      setChatToRename(null);
    }
  };

  // Filter chats into favourite and non-favourite
  const favouriteChats = chats.filter((chat) => chat.isFavourite);
  const recentChats = chats.filter((chat) => !chat.isFavourite);

  return (
    <>
      <Sidebar>
        <SidebarContent className="">
          <Button className="w-full justify-start" onClick={createNewChat}>
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>

          <SidebarMenu>
            <SidebarGroup>
              <SidebarGroupLabel className="text-black">
                <Star className="mr-2 h-4 w-4 fill-amber-500 text-amber-500" />
                Favourites
              </SidebarGroupLabel>
              {favouriteChats.length > 0 ? (
                favouriteChats.map((chat) => (
                  <SidebarMenuItem className="py-[0.5px]" key={chat.id}>
                    <SidebarMenuButton
                      onClick={() => handleSelectChat(chat.id)}
                    >
                      <span>{chat.title}</span>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction>
                          <MoreHorizontal />
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start">
                        <DropdownMenuItem
                          onClick={() => favouriteChat(chat.id)}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          <span>Unfavourite</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleOpenRenameDialog(e, chat)}
                        >
                          <PenSquare className="mr-2 h-4 w-4" />
                          <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Remove</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="text-muted-foreground px-3 py-2 text-sm">
                  No favourites yet
                </div>
              )}
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel className="text-black">
                <MessageCircle className="mr-2 h-4 w-4" />
                Recent Chats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                {recentChats.length > 0 ? (
                  recentChats.map((chat) => (
                    <SidebarMenuItem className="py-[0.5px]" key={chat.id}>
                      <SidebarMenuButton
                        onClick={() => handleSelectChat(chat.id)}
                      >
                        <span>{chat.title}</span>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction>
                            <MoreHorizontal />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem
                            onClick={() => favouriteChat(chat.id)}
                          >
                            <Star className="mr-2 h-4 w-4 text-amber-500" />
                            <span>Favourite</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleOpenRenameDialog(e, chat)}
                          >
                            <PenSquare className="mr-2 h-4 w-4" />
                            <span>Rename</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteChat(e, chat.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Remove</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <div className="text-muted-foreground px-3 py-2 text-sm">
                    No recent chats
                  </div>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      {chatToRename && (
        <RenameDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          currentName={chatToRename.title}
          onRename={handleRenameChat}
        />
      )}
    </>
  );
};
