import { useAddDbConnectionModal } from "@/components/dialog/add-db-connection-dialog";
import { useManageConnectionsDialog } from "@/components/dialog/manage-connections-dialog";
import { useSupabaseConnectionDialog } from "@/components/dialog/supabase-connection-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDbConnectionStore } from "@/store/db-connection-store";
import { Database, Plus, ServerCog, Settings } from "lucide-react";

export default function SelectedDBConnection() {
  const { getSelectedConnection } = useDbConnectionStore();
  const { setShowAddDbConnectionDialog, AddDbConnectionModal } =
    useAddDbConnectionModal();
  const { setShowSupabaseConnectionDialog, SupabaseConnectionDialog } =
    useSupabaseConnectionDialog();
  const { setShowManageConnectionsDialog, ManageConnectionsDialog } =
    useManageConnectionsDialog();

  const selectedConnection = getSelectedConnection();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-9 items-center gap-2 px-2">
            <Database
              className={`h-4 w-4 ${selectedConnection ? "text-blue-600" : ""}`}
            />
            <span className="max-w-[150px] truncate font-medium">
              {selectedConnection ? (
                <div className="flex items-center gap-1">
                  <span className="text-blue-600">
                    {selectedConnection.name}
                  </span>
                  {selectedConnection.database && (
                    <span className="text-muted-foreground text-xs">
                      ({selectedConnection.database})
                    </span>
                  )}
                </div>
              ) : (
                "Select Database"
              )}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowAddDbConnectionDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Database Connection</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowSupabaseConnectionDialog(true)}
          >
            <ServerCog className="mr-2 h-4 w-4" />
            <span>Connect to Supabase</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowManageConnectionsDialog(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Manage Connections</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Load modals */}
      <AddDbConnectionModal />
      <SupabaseConnectionDialog />
      <ManageConnectionsDialog />
    </>
  );
}
