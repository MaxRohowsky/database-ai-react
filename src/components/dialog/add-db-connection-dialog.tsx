/* eslint-disable react-refresh/only-export-components */
import { useDbConnectionStore } from "@/store/db-connection-store";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const emptyValues = {
  id: "",
  name: "",
  engine: "",
  host: "",
  port: "",
  database: "",
  user: "",
  password: "",
};

function AddDbConnectionModal({
  showAddDbConnectionDialog,
  setShowAddDbConnectionDialog,
  connectionToEdit,
}: {
  showAddDbConnectionDialog: boolean;
  setShowAddDbConnectionDialog: Dispatch<SetStateAction<boolean>>;
  connectionToEdit?: ConnectionDetails;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { addConnection, updateConnection, setSelectedConnectionId } =
    useDbConnectionStore();

  // Initialize with completely empty values

  const form = useForm<ConnectionDetails>({
    defaultValues: emptyValues,
  });

  // Reset form when connectionToEdit changes or dialog opens
  useEffect(() => {
    if (showAddDbConnectionDialog) {
      if (connectionToEdit) {
        // If editing an existing connection
        form.reset(connectionToEdit);
      } else {
        // If creating a new connection, use completely empty values
        console.log("Resetting form with empty values");
        form.reset(emptyValues);
      }
    }

    // Cleanup function to reset form when unmounting
    return () => {
      form.reset(emptyValues);
    };
  }, [showAddDbConnectionDialog, connectionToEdit, form]);

  const handleTestConnection = async () => {
    const formData = form.getValues();
    try {
      setIsLoading(true);
      setConnectionStatus("idle");
      setErrorMessage("");
      console.log("Testing connection with config:", formData);

      const connected = await window.electronAPI.testConnection(formData);

      if (connected) {
        console.log("Connection successful!");
        setConnectionStatus("success");
        return true;
      } else {
        console.log("Connection failed");
        setConnectionStatus("error");
        setErrorMessage("Unable to connect to database");
        return false;
      }
    } catch (error) {
      console.error("Test connection error:", error);
      setConnectionStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Connection failed",
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectionSave = async () => {
    try {
      // Test connection first
      const isConnected = await handleTestConnection();
      if (!isConnected) {
        return; // Don't save if connection test fails
      }

      const formData = form.getValues();

      // Add ID if it's a new connection
      const connectionId = formData.id || `conn-${Date.now()}`;

      // Create the connection details object
      const connectionDetails: ConnectionDetails = {
        ...formData,
        id: connectionId,
      };

      // Check if it's an edit or new connection
      if (connectionId && formData.id) {
        // Update existing connection
        const updatedConnection = updateConnection(connectionDetails);
        setSelectedConnectionId(updatedConnection.id);
      } else {
        // Add new connection
        const newConnection = addConnection(connectionDetails);
        setSelectedConnectionId(newConnection.id);
      }

      // Close dialog
      setShowAddDbConnectionDialog(false);

      // Reset form
      form.reset(emptyValues);
    } catch (error) {
      console.error("Failed to save connection:", error);
    }
  };

  // Handle dialog close event
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing the dialog
      form.reset(emptyValues);
      setConnectionStatus("idle");
      setErrorMessage("");

      // Even though this is managed by the parent component,
      // ensure we completely clear the dialog state
      if (!open && !connectionToEdit) {
        // When closing the dialog, make sure there's no stale data
        form.reset(emptyValues);
      }
    }
    setShowAddDbConnectionDialog(open);
  };

  return (
    <Dialog
      open={showAddDbConnectionDialog}
      onOpenChange={handleDialogOpenChange}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {form.getValues().id
              ? "Edit Database Connection"
              : "Connect to Database"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="postgres"
                      className="placeholder:text-gray-400 placeholder:opacity-60"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="engine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database Engine</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select database engine" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="postgres">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="localhost"
                        className="placeholder:text-gray-400 placeholder:opacity-60"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="5432"
                        className="placeholder:text-gray-400 placeholder:opacity-60"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="database"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="my_database"
                      className="placeholder:text-gray-400 placeholder:opacity-60"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="postgres"
                      className="placeholder:text-gray-400 placeholder:opacity-60"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="placeholder:text-gray-400 placeholder:opacity-60"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <input type="hidden" {...form.register("id")} />
          </form>
        </Form>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isLoading}
              className="mr-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Test Connection"
              )}
            </Button>

            {connectionStatus === "success" && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="mr-1 h-4 w-4" />
                <span className="text-xs">Connection successful</span>
              </div>
            )}

            {connectionStatus === "error" && (
              <div className="flex items-center text-red-600">
                <XCircle className="mr-1 h-4 w-4" />
                <span className="text-xs">
                  {errorMessage || "Connection failed"}
                </span>
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={handleConnectionSave}
            disabled={isLoading}
          >
            Save Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useAddDbConnectionModal() {
  const [showAddDbConnectionDialog, setShowAddDbConnectionDialog] =
    useState(false);
  const [connectionToEdit, setConnectionToEdit] = useState<
    ConnectionDetails | undefined
  >();

  // Reset connectionToEdit when dialog closes
  useEffect(() => {
    if (!showAddDbConnectionDialog) {
      setConnectionToEdit(undefined);
    }
  }, [showAddDbConnectionDialog]);

  const AddDbConnectionModalCallback = useCallback(() => {
    return (
      <AddDbConnectionModal
        showAddDbConnectionDialog={showAddDbConnectionDialog}
        setShowAddDbConnectionDialog={setShowAddDbConnectionDialog}
        connectionToEdit={connectionToEdit}
      />
    );
  }, [
    showAddDbConnectionDialog,
    setShowAddDbConnectionDialog,
    connectionToEdit,
  ]);

  return useMemo(
    () => ({
      setShowAddDbConnectionDialog,
      setConnectionToEdit,
      AddDbConnectionModal: AddDbConnectionModalCallback,
    }),
    [setShowAddDbConnectionDialog, AddDbConnectionModalCallback],
  );
}
