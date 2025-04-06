import {
  ConnectionDetails,
  useDbConnectionStore,
} from "@/store/db-connection-store";
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

  const { addConnection, updateConnection, setSelectedConnectionId } =
    useDbConnectionStore();

  const form = useForm<ConnectionDetails>({
    defaultValues: {
      id: "",
      name: "",
      host: "localhost",
      port: "5432",
      database: "",
      user: "postgres",
      password: "",
    },
  });

  // Reset form when connectionToEdit changes or dialog opens
  useEffect(() => {
    if (showAddDbConnectionDialog) {
      if (connectionToEdit) {
        // If editing an existing connection
        form.reset(connectionToEdit);
      } else {
        // If creating a new connection
        form.reset({
          id: "",
          name: "",
          host: "localhost",
          port: "5432",
          database: "",
          user: "postgres",
          password: "",
        });
      }
    }
  }, [showAddDbConnectionDialog, connectionToEdit, form]);

  const handleTestConnection = async () => {
    const formData = form.getValues();
    try {
      setIsLoading(true);
      setConnectionStatus("idle");
      console.log("Testing connection with config:", formData);

      const connected = await window.electronAPI.testConnection(formData);

      if (connected) {
        console.log("Connection successful!");
        setConnectionStatus("success");
        return true;
      } else {
        console.log("Connection failed");
        setConnectionStatus("error");
        return false;
      }
    } catch (error) {
      console.error("Test connection error:", error);
      setConnectionStatus("error");
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
      form.reset({
        id: "",
        name: "",
        host: "localhost",
        port: "5432",
        database: "",
        user: "postgres",
        password: "",
      });
    } catch (error) {
      console.error("Failed to save connection:", error);
    }
  };

  return (
    <Dialog
      open={showAddDbConnectionDialog}
      onOpenChange={setShowAddDbConnectionDialog}
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
                    <Input placeholder="My Database" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host</FormLabel>
                  <FormControl>
                    <Input placeholder="localhost" {...field} />
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
                    <Input placeholder="5432" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="database"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database</FormLabel>
                  <FormControl>
                    <Input placeholder="postgres" {...field} />
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
                    <Input placeholder="postgres" {...field} />
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
                    <Input type="password" {...field} />
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
                <span className="text-xs">Connection failed</span>
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
