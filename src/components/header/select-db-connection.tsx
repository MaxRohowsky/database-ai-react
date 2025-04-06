import { useAddDbConnectionModal } from "@/components/header/add-db-connection-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/store/chat-store";
import {
  ConnectionDetails,
  useDbConnectionStore,
} from "@/store/db-connection-store";
import { Bug, Database, Pencil, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { Button } from "../ui/button";

export default function DBConnectionDialog() {
  const {
    setShowAddDbConnectionDialog,
    setConnectionToEdit,
    AddDbConnectionModal,
  } = useAddDbConnectionModal();

  const { getCurrentChat } = useChatStore();

  const {
    connections,
    addConnection,
    removeConnection,
    getSelectedConnection,
    setSelectedConnectionId,
  } = useDbConnectionStore();

  const selectedConnection = getSelectedConnection();
  const currentChat = getCurrentChat();

  // Sync the selected connection with the current chat's connection
  useEffect(() => {
    if (currentChat?.dbConnectionId && connections.length > 0) {
      // Check if the current chat has a specific database connection
      const chatConnection = connections.find(
        (conn) => conn.id === currentChat.dbConnectionId,
      );
      if (chatConnection && chatConnection.id !== selectedConnection?.id) {
        // If the chat has a different connection than currently selected, switch to it
        console.log(
          `Switching to connection ${chatConnection.name} for current chat`,
        );
        setSelectedConnectionId(chatConnection.id);
      }
    }
  }, [currentChat, connections, selectedConnection, setSelectedConnectionId]);

  // Add debugging log for component mount
  useEffect(() => {
    console.log("DBConnectionDialog mounted");
    console.log("Saved connections:", connections);
    console.log("Selected connection:", selectedConnection);
  }, [connections, selectedConnection]);

  const handleSelectConnection = (connection: ConnectionDetails) => {
    console.log("Selected connection:", connection);
    setSelectedConnectionId(connection.id);
  };

  // Edit existing connection
  const handleEditConnection = (
    e: React.MouseEvent,
    connection: ConnectionDetails,
  ) => {
    e.stopPropagation();
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

  const debugCreateTestConnection = () => {
    // Create a test connection
    const testConnection: ConnectionDetails = {
      id: `test-${Date.now()}`,
      name: "Test Database",
      host: "localhost",
      port: "5432",
      database: "postgres",
      user: "postgres",
      password: "postgres",
    };

    // Add to saved connections using the addConnection method
    const connection = addConnection(testConnection);

    // Set as selected connection
    setSelectedConnectionId(connection.id);

    // Log debug info
    console.log("Created test database connection:", connection);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center">
            <Database
              className={`mr-2 h-4 w-4 ${selectedConnection ? "text-blue-600" : ""}`}
            />
            <span className="max-w-[150px] truncate">
              {selectedConnection ? (
                <>
                  {selectedConnection.name}
                  {currentChat?.dbConnectionId === selectedConnection.id && (
                    <span className="text-muted-foreground ml-1 text-xs">
                      (current chat)
                    </span>
                  )}
                </>
              ) : (
                "Select Database"
              )}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {connections.length > 0 ? (
            connections.map((conn) => (
              <DropdownMenuItem
                key={conn.id}
                className="flex cursor-pointer items-center justify-between"
                onClick={() => handleSelectConnection(conn)}
              >
                <span className="mr-2 truncate">
                  {conn.name} ({conn.database}@{conn.host})
                </span>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => handleEditConnection(e, conn)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-6 w-6"
                    onClick={(e) =>
                      handleDeleteConnection(e, conn.id as string)
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No saved connections</DropdownMenuItem>
          )}

          <DropdownMenuItem
            className="mt-2 justify-center border-t pt-2"
            onClick={() => {
              // Reset connection to edit before opening dialog for new connection
              setConnectionToEdit(undefined);
              setShowAddDbConnectionDialog(true);
            }}
          >
            Connect new database
          </DropdownMenuItem>

          <DropdownMenuItem
            className="justify-center text-red-500"
            onSelect={(e) => {
              e.preventDefault();
              debugCreateTestConnection();
            }}
          >
            <Bug className="mr-2 h-4 w-4" />
            Debug: Create Test DB
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Render the modal component */}
      <AddDbConnectionModal />
    </>
  );
}
