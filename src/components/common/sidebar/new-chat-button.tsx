import { useAddDbConnectionModal } from "@/components/dialog/add-db-connection-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useChatStore } from "@/store/chat-store";
import { useDbConnectionStore } from "@/store/db-connection-store";
import { Database, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import SidebarIcon from "./sidebar-icon";

export default function NewChatButton() {
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
          <SidebarIcon icon={Plus} label="New chat" variant="red" />
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
