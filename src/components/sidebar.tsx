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
  const { chats, setCurrentChatId, createNewChat } = useChatStore();

  const { RenameChatDialog } = useRenameChatDialog();

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
      <Sidebar>
        <SidebarHeader>
          <div className="my-3 ml-1 flex items-center">
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
                <div className="mr-2 flex h-7 w-7 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 shadow-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                </div>
                <span className="text-sm font-medium">Favourites</span>
              </SidebarGroupLabel>
              {favouriteChats.length > 0 ? (
                favouriteChats.map((chat) => (
                  <SidebarMenuItem className="py-[0.5px]" key={chat.id}>
                    <SidebarMenuButton
                      onClick={() => setCurrentChatId(chat.id)}
                      className="rounded-md transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <div className="mr-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                          <MessageCircle className="h-3 w-3 text-blue-500" />
                        </div>
                        <span className="truncate font-medium text-gray-700">
                          {chat.title}
                        </span>
                      </div>
                    </SidebarMenuButton>
                    <ChatItemDropdown chat={chat} />
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
                <div className="mr-2 flex h-7 w-7 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 shadow-sm">
                  <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <span className="text-sm font-medium">Recent Chats</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                {recentChats.length > 0 ? (
                  recentChats.map((chat) => (
                    <SidebarMenuItem
                      className="ml-5 border-l px-2 py-[0.5px]"
                      key={chat.id}
                    >
                      <SidebarMenuButton
                        onClick={() => setCurrentChatId(chat.id)}
                      >
                        <span>{chat.title}</span>
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
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <RenameChatDialog />
    </>
  );
};

function ChatItemDropdown({ chat }: { chat: Chat }) {
  const { setShowRenameChatDialog, setChatToRename } = useRenameChatDialog();

  const { favouriteChat, deleteChat } = useChatStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction>
          <MoreHorizontal />
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start">
        <DropdownMenuItem onClick={() => favouriteChat(chat.id)}>
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
  );
}
