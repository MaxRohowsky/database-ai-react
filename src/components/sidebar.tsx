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
import { useAddDbConnectionModal } from "./add-db-connection-dialog";
import { useRenameChatDialog } from "./rename-chat-dialog";
import { SidebarGroupLabelWithIcon } from "./sidebar-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";

export const AppSidebar = () => {
  const { RenameChatDialog } = useRenameChatDialog();

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="my-3 ml-1 flex items-center">
            <h1 className="text-xl font-medium text-neutral-800">OtterDB</h1>
          </div>
        </SidebarHeader>
        <NewChatButton />
        <SidebarContent className="">
          <SidebarMenu>
            <FavouriteChats />
            <RecentChats />
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

function NewChatButton() {
  const { createNewChat } = useChatStore();

  const { connections, setSelectedConnectionId } = useDbConnectionStore();

  const { setShowAddDbConnectionDialog, AddDbConnectionModal } =
    useAddDbConnectionModal();

  const handleCreateChatWithConnection = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    createNewChat();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full" asChild>
        <Button
          variant="ghost"
          className="flex h-12 w-full items-center justify-start rounded-none hover:bg-red-100"
        >
          <SidebarGroupLabelWithIcon
            icon={Plus}
            label="New chat"
            variant="red"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={5}
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        <DropdownMenuLabel>Select Database:</DropdownMenuLabel>

        {connections.map((conn) => (
          <DropdownMenuItem
            key={conn.id}
            className="m-1"
            onClick={() => handleCreateChatWithConnection(conn.id)}
          >
            <Database className="m-1 h-4 w-4" />
            <span>{conn.name}</span>
          </DropdownMenuItem>
        ))}

        <Separator />

        <DropdownMenuItem
          className="m-1"
          onClick={() => setShowAddDbConnectionDialog(true)}
        >
          <Database className="m-1 h-4 w-4" />
          <span>Add new connection</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
      <AddDbConnectionModal />
    </DropdownMenu>
  );
}

function FavouriteChats() {
  const { chats, setCurrentChatId } = useChatStore();
  const favouriteChats = chats.filter((chat) => chat.isFavourite);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-black">
        <SidebarGroupLabelWithIcon
          icon={Star}
          label="Favourites"
          variant="amber"
        />
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
                <span className="text-base text-gray-700">{chat.title}</span>
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
  );
}

function RecentChats() {
  const { chats, setCurrentChatId } = useChatStore();
  const recentChats = chats.filter((chat) => !chat.isFavourite);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-black">
        <SidebarGroupLabelWithIcon
          icon={MessageCircle}
          label="Recent Chats"
          variant="blue"
        />
      </SidebarGroupLabel>
      <SidebarGroupContent>
        {recentChats.length > 0 ? (
          recentChats.map((chat) => (
            <SidebarMenuItem
              className="ml-5 border-l px-2 py-[0.5px]"
              key={chat.id}
            >
              <SidebarMenuButton onClick={() => setCurrentChatId(chat.id)}>
                <span className="text-base text-gray-700">{chat.title}</span>
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
