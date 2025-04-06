import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useChatStore } from "@/store/chat-store";
import { useDbConnectionStore } from "@/store/db-connection-store";
import {
  Database,
  MessageCircle,
  MoreHorizontal,
  PenSquare,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useRenameChatDialog } from "./rename-chat-dialog";
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
    favouriteChat,
    deleteChat,
    renameChat,
  } = useChatStore();

  const { setShowRenameChatDialog, RenameChatDialog, setChatToRename } =
    useRenameChatDialog();

  const { connections, getSelectedConnection, setSelectedConnectionId } =
    useDbConnectionStore();

  const selectedConnection = getSelectedConnection();

  const handleCreateChatWithConnection = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    createNewChat();
  };

  // Filter chats into favourite and non-favourite
  const favouriteChats = chats.filter((chat) => chat.isFavourite);
  const recentChats = chats.filter((chat) => !chat.isFavourite);

  return (
    <>
      <Sidebar className="drop-shadow-sm">
        <SidebarHeader>
          <div className="mb-4 flex items-center">
            <h1 className="text-xl font-medium text-neutral-800">OtterDB</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="w-full" asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-start bg-blue-50 px-2 hover:bg-blue-100"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                  <Plus className="h-3.5 w-3.5 text-blue-500" />
                </div>
                New chat
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={5}
              className="w-[var(--radix-dropdown-menu-trigger-width)]"
            >
              <DropdownMenuItem onClick={() => createNewChat()}>
                <Database className="mr-2 h-4 w-4" />
                <span>
                  {selectedConnection
                    ? `Use ${selectedConnection.name}`
                    : "Use default connection"}
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-muted-foreground px-2 py-1 text-xs"
                disabled
              >
                Or select database:
              </DropdownMenuItem>

              {connections.map((conn) => (
                <DropdownMenuItem
                  key={conn.id}
                  onClick={() => handleCreateChatWithConnection(conn.id)}
                >
                  <Database className="mr-2 h-4 w-4" />
                  <span>{conn.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarHeader>
        <SidebarContent className="">
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
                      onClick={() => setCurrentChatId(chat.id)}
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
                          onClick={() => renameChat(chat.id, chat.title)}
                        >
                          <PenSquare className="mr-2 h-4 w-4" />
                          <span>Rename</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteChat(chat.id)}>
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
                        onClick={() => setCurrentChatId(chat.id)}
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
                            onClick={() => {
                              setChatToRename(chat);
                              setShowRenameChatDialog(true);
                            }}
                          >
                            <PenSquare className="mr-2 h-4 w-4" />
                            <span>Rename</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteChat(chat.id)}>
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

      <RenameChatDialog />
    </>
  );
};
