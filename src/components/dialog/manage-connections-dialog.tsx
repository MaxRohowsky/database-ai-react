import { useDbConnectionStore } from "@/store/db-connection-store";
import { Database, Edit2, Plus, ServerCog, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useAddDbConnectionModal } from "./add-db-connection-dialog/add-db-connection-dialog";
import { useSupabaseConnectionDialog } from "./supabase-connection-dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

export function ManageConnectionsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { connections, removeConnection, setSelectedConnectionId } =
    useDbConnectionStore();
  const { setShowAddDbConnectionDialog, setConnectionToEdit } =
    useAddDbConnectionModal();
  const { setShowSupabaseConnectionDialog } = useSupabaseConnectionDialog();

  const handleEditConnection = (connection: ConnectionDetails) => {
    setConnectionToEdit(connection);
    setShowAddDbConnectionDialog(true);
    onOpenChange(false);
  };

  const handleDeleteConnection = (connectionId: string) => {
    if (window.confirm("Are you sure you want to delete this connection?")) {
      removeConnection(connectionId);
    }
  };

  const handleSelectConnection = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    onOpenChange(false);
  };

  const handleAddConnection = () => {
    setShowAddDbConnectionDialog(true);
    onOpenChange(false);
  };

  const handleAddSupabaseConnection = () => {
    setShowSupabaseConnectionDialog(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Manage Database Connections</DialogTitle>
        </DialogHeader>

        <div className="mb-4 flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddConnection}
            className="flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Connection
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddSupabaseConnection}
            className="flex items-center"
          >
            <ServerCog className="mr-2 h-4 w-4" />
            Connect to Supabase
          </Button>
        </div>

        {connections.length === 0 ? (
          <div className="py-8 text-center">
            <Database className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-medium">No Connections</h3>
            <p className="mb-4 text-sm text-gray-500">
              Add a database connection to get started
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Engine</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Database</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connections.map((connection) => (
                <TableRow key={connection.id}>
                  <TableCell
                    className="cursor-pointer font-medium hover:text-blue-600"
                    onClick={() => handleSelectConnection(connection.id)}
                  >
                    {connection.name}
                  </TableCell>
                  <TableCell>
                    {connection.engine === "postgres"
                      ? "PostgreSQL"
                      : connection.engine}
                  </TableCell>
                  <TableCell>
                    <span className="block max-w-[150px] truncate">
                      {connection.host}
                    </span>
                  </TableCell>
                  <TableCell>{connection.database}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditConnection(connection)}
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteConnection(connection.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function useManageConnectionsDialog() {
  const [showManageConnectionsDialog, setShowManageConnectionsDialog] =
    useState(false);

  const ManageConnectionsDialogCallback = useCallback(() => {
    return (
      <ManageConnectionsDialog
        open={showManageConnectionsDialog}
        onOpenChange={setShowManageConnectionsDialog}
      />
    );
  }, [showManageConnectionsDialog]);

  return useMemo(
    () => ({
      setShowManageConnectionsDialog,
      ManageConnectionsDialog: ManageConnectionsDialogCallback,
    }),
    [ManageConnectionsDialogCallback],
  );
}
