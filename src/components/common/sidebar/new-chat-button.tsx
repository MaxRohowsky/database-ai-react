import { useAddDbConnectionModal } from "@/components/dialog/add-db-connection-dialog/add-db-connection-dialog";
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
import Marquee from "react-fast-marquee";
import SidebarIcon from "./sidebar-icon";
export default function NewChatButton() {
  const { createNewChat } = useChatStore();
  const { dbConfigs, setSelectedDbConfigId } = useDbConnectionStore();
  const [dbConnectionStatuses, setDbConnectionStatuses] = useState<
    Record<string, boolean>
  >({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(
    null,
  );

  const {
    setShowAddDbConnectionDialog,
    setConnectionToEdit,
    AddDbConnectionModal,
  } = useAddDbConnectionModal();

  const { removeDbConfig } = useDbConnectionStore();

  // Check connection status when dropdown is opened and every 5 seconds while open
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const checkConnections = async () => {
      const statuses: Record<string, boolean> = {};

      for (const dbConfig of dbConfigs) {
        try {
          const isConnected =
            await window.electronAPI.testDbConnection(dbConfig);
          statuses[dbConfig.id] = isConnected;
        } catch (error) {
          console.error(`Error checking connection ${dbConfig.name}:`, error);
          statuses[dbConfig.id] = false;
        }
      }

      setDbConnectionStatuses(statuses);
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
  }, [isDropdownOpen, dbConfigs]);

  const handleCreateChatWithConnection = (dbConfigId: string) => {
    setSelectedDbConfigId(dbConfigId);
    createNewChat();
  };

  const handleEditConnection = (dbConfig: DbConfig) => {
    console.log("Editing connection:", dbConfig);
    // Set the connection to edit and open the modal
    setConnectionToEdit(dbConfig);
    setShowAddDbConnectionDialog(true);
  };

  // Delete connection
  const handleDeleteConnection = (e: React.MouseEvent, dbConfigId: string) => {
    e.stopPropagation();
    console.log("Removing connection:", dbConfigId);
    removeDbConfig(dbConfigId);
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

        {dbConfigs.map((dbConfig) => (
          <DropdownMenuItem
            key={dbConfig.id}
            className="relative m-1"
            onClick={() => handleCreateChatWithConnection(dbConfig.id)}
            onMouseEnter={() => setHoveredConnection(dbConfig.id)}
            onMouseLeave={() => setHoveredConnection(null)}
          >
            <Database
              className={`m-1 h-4 w-4 ${
                dbConnectionStatuses[dbConfig.id] !== undefined
                  ? dbConnectionStatuses[dbConfig.id]
                    ? "text-green-500"
                    : "text-red-500"
                  : ""
              }`}
            />
            <div className="flex flex-col">
              <span>{dbConfig.name}</span>
              <span className="text-muted-foreground w-36 overflow-hidden text-sm">
                <Marquee play={hoveredConnection === dbConfig.id}>
                  {dbConfig.database}@{dbConfig.host}
                </Marquee>
              </span>
            </div>
            <div className="absolute right-0 flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleEditConnection(dbConfig)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive h-6 w-6"
                onClick={(e) => handleDeleteConnection(e, dbConfig.id)}
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
