import { useAddDbConnectionModal } from "@/components/dialog/add-db-connection-dialog";
import { useRenameChatDialog } from "@/components/dialog/rename-chat-dialog";
import { SidebarGroupLabelWithIcon } from "@/components/sidebar-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
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
  const { setShowRenameChatDialog, setChatToRename, RenameChatDialog } =
    useRenameChatDialog();

  const { favouriteChat, deleteChat } = useChatStore();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction>
            <MoreHorizontal />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem onClick={() => favouriteChat(chat.id)}>
            <Star
              className={`mr-2 h-4 w-4 ${
                chat.isFavourite
                  ? "fill-none text-amber-500"
                  : "fill-amber-500 text-amber-500"
              }`}
            />
            {chat.isFavourite ? "Unfavourite" : "Favourite"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              console.log("Renaming chat:", chat);
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
      <RenameChatDialog />
    </>
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
                onClick={(e) => handleDeleteConnection(e, conn.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </DropdownMenuItem>
        ))}

        <Separator />

        <DropdownMenuItem
          className="m-1"
          onClick={() => {
            // Reset connection to edit before opening dialog for new connection
            setConnectionToEdit(undefined);
            setShowAddDbConnectionDialog(true);
          }}
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
  const { chats, setCurrentChatId, currentChatId } = useChatStore();
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

function RecentChats() {
  const { chats, setCurrentChatId, currentChatId } = useChatStore();
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
