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
import {
  ConnectionDetails,
  useDbConnectionStore,
} from "@/store/db-connection-store";
import {
  Database,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  PenSquare,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  const [connectionStatuses, setConnectionStatuses] = useState<
    Record<string, boolean>
  >({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const {
    setShowAddDbConnectionDialog,
    setConnectionToEdit,
    AddDbConnectionModal,
  } = useAddDbConnectionModal();

  const { removeConnection } = useDbConnectionStore();

  // Check connection status when dropdown is opened and every 5 seconds while open
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const checkConnections = async () => {
      const statuses: Record<string, boolean> = {};

      for (const conn of connections) {
        try {
          const isConnected = await window.electronAPI.testConnection(conn);
          statuses[conn.id] = isConnected;
        } catch (error) {
          console.error(`Error checking connection ${conn.name}:`, error);
          statuses[conn.id] = false;
        }
      }

      setConnectionStatuses(statuses);
    };

    // Only check connections when dropdown is open
    if (isDropdownOpen) {
      // Initial check when dropdown opens
      checkConnections();

      // Set up interval to check every 5 seconds
      intervalId = setInterval(checkConnections, 5000);
    }

    // Clean up interval when dropdown closes or component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isDropdownOpen, connections]);

  const handleCreateChatWithConnection = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    createNewChat();
  };

  const handleEditConnection = (connection: ConnectionDetails) => {
    console.log("Editing connection:", connection);
    // Set the connection to edit and open the modal
    setConnectionToEdit(connection);
    setShowAddDbConnectionDialog(true);
  };

  // Delete connection
  const handleDeleteConnection = (
    e: React.MouseEvent,
    connectionId: string,
  ) => {
    e.stopPropagation();
    console.log("Removing connection:", connectionId);
    removeConnection(connectionId);
  };

  return (
    <DropdownMenu onOpenChange={setIsDropdownOpen}>
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
            <Database
              className={`m-1 h-4 w-4 ${
                connectionStatuses[conn.id] !== undefined
                  ? connectionStatuses[conn.id]
                    ? "text-green-500"
                    : "text-red-500"
                  : ""
              }`}
            />
            {conn.name} <br /> ({conn.database}@{conn.host})
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleEditConnection(conn)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive h-6 w-6"
                onClick={(e) => handleDeleteConnection(e, conn.id as string)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
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
