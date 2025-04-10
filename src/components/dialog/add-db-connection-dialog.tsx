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
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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
  const [sslEnabled, setSslEnabled] = useState(false);
  const [certFile, setCertFile] = useState<File | null>(null);

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
        // Enable SSL if this is a Supabase connection
        setSslEnabled(
          connectionToEdit.host.includes("supabase.co") ||
            connectionToEdit.host.includes("pooler.supabase.com"),
        );
      } else {
        // If creating a new connection, use completely empty values
        console.log("Resetting form with empty values");
        form.reset(emptyValues);
        setSslEnabled(false);
        setCertFile(null);
      }
    }

    // Cleanup function to reset form when unmounting
    return () => {
      form.reset(emptyValues);
      setSslEnabled(false);
      setCertFile(null);
    };
  }, [showAddDbConnectionDialog, connectionToEdit, form]);

  // Watch host field to auto-enable SSL for Supabase connections
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "host") {
        const host = value.host as string;
        if (
          host &&
          (host.includes("supabase.co") || host.includes("pooler.supabase.com"))
        ) {
          setSslEnabled(true);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCertFile(e.target.files[0]);
    } else {
      setCertFile(null);
    }
  };

  const handleTestConnection = async () => {
    const formData = form.getValues();
    try {
      setIsLoading(true);
      setConnectionStatus("idle");
      setErrorMessage("");
      console.log("Testing connection with config:", formData);

      // Validate required fields
      if (!formData.engine) {
        setConnectionStatus("error");
        setErrorMessage("Please select a database engine");
        return false;
      }

      if (!formData.host) {
        setConnectionStatus("error");
        setErrorMessage("Host is required");
        return false;
      }

      // For Supabase connections, ensure SSL is enabled
      const isSupabase =
        formData.host.includes("supabase.co") ||
        formData.host.includes("pooler.supabase.com");

      if (isSupabase && !sslEnabled) {
        console.log("Detected Supabase connection - SSL should be enabled");
        setSslEnabled(true);
      }

      // Add SSL configuration to the form data if enabled
      const connectionConfig = { ...formData };
      if (sslEnabled) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (connectionConfig as any).ssl = true;

        // If certificate file was selected, add it to the connection config
        if (certFile) {
          try {
            const fileReader = new FileReader();
            const certContent = await new Promise<string>((resolve, reject) => {
              fileReader.onload = (e) => resolve(e.target?.result as string);
              fileReader.onerror = reject;
              fileReader.readAsText(certFile);
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (connectionConfig as any).sslCertificate = certContent;
          } catch (error) {
            console.error("Failed to read SSL certificate:", error);
            setConnectionStatus("error");
            setErrorMessage("Failed to read SSL certificate file");
            setIsLoading(false);
            return false;
          }
        }
      }

      const connected =
        await window.electronAPI.testConnection(connectionConfig);

      if (connected) {
        console.log("Connection successful!");
        setConnectionStatus("success");
        return true;
      } else {
        console.log("Connection failed");
        setConnectionStatus("error");

        // More helpful message for Supabase connections
        if (isSupabase) {
          setErrorMessage(
            "Unable to connect to Supabase database. Please verify host, port, username and password. " +
              "For pooler connections, username should include your project reference.",
          );
        } else {
          setErrorMessage("Unable to connect to database");
        }
        return false;
      }
    } catch (error) {
      console.error("Test connection error:", error);
      setConnectionStatus("error");

      // Provide more specific error messages
      if (error instanceof Error) {
        if (
          error.message.includes("SASL") ||
          error.message.includes("password")
        ) {
          setErrorMessage(
            "Authentication failed. Please check your username and password.",
          );
        } else if (error.message.includes("ENOTFOUND")) {
          setErrorMessage(
            "Hostname could not be resolved. Please check your host name.",
          );
        } else if (
          error.message.includes("ETIMEDOUT") ||
          error.message.includes("timeout")
        ) {
          setErrorMessage(
            "Connection timed out. Please check your network and firewall settings.",
          );
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage("Connection failed");
      }
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

      // Add SSL configuration if enabled
      if (sslEnabled) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (connectionDetails as any).ssl = true;

        // If certificate file was selected, add it to the connection details
        if (certFile) {
          try {
            const fileReader = new FileReader();
            const certContent = await new Promise<string>((resolve, reject) => {
              fileReader.onload = (e) => resolve(e.target?.result as string);
              fileReader.onerror = reject;
              fileReader.readAsText(certFile);
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (connectionDetails as any).sslCertificate = certContent;
          } catch (error) {
            console.error("Failed to read SSL certificate:", error);
          }
        }
      }

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
      setSslEnabled(false);
      setCertFile(null);
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

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem className="flex-1">
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
                  <FormItem className="w-30">
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

            {/* Add SSL configuration section */}
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ssl-enabled"
                  checked={sslEnabled}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setSslEnabled(checked === true)
                  }
                />
                <label
                  htmlFor="ssl-enabled"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Enable SSL/TLS
                </label>
              </div>

              {sslEnabled && (
                <div className="mt-3 space-y-3">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="ssl-certificate" className="text-sm">
                      SSL Certificate (optional)
                    </Label>
                    <Input
                      id="ssl-certificate"
                      type="file"
                      accept=".crt,.pem"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    {certFile && (
                      <p className="text-muted-foreground text-xs">
                        Certificate: {certFile.name}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      For Supabase, download the certificate from your dashboard
                      under Settings → Database → SSL Configuration
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Information for Supabase users */}
            {form.watch("host")?.includes("supabase") && (
              <div className="mb-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                <p className="mb-1 font-medium">Supabase Connection Tips:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    For direct connections use: db.yourproject.supabase.co
                  </li>
                  <li>
                    For pooler connections use: aws-0-region.pooler.supabase.com
                  </li>
                  <li>Session pooler uses port 5432</li>
                  <li>Transaction pooler uses port 6543</li>
                  <li>Username format: postgres.yourproject</li>
                  <li>
                    <strong>
                      SSL/TLS is required for Supabase connections
                    </strong>
                  </li>
                </ul>
              </div>
            )}

            {/* Display connection test status */}
            {connectionStatus !== "idle" && (
              <div
                className={`mt-2 flex items-center rounded-md p-3 ${
                  connectionStatus === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {connectionStatus === "success" ? (
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="mr-2 h-5 w-5 text-red-600" />
                )}
                <div>
                  {connectionStatus === "success"
                    ? "Connection successful!"
                    : errorMessage}
                </div>
              </div>
            )}

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
