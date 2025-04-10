import { useDbConnectionStore } from "@/store/db-connection-store";
import { createSupabaseConnectionDetails } from "@/utils/supabase-helper";
import { CheckCircle, Loader2, Wrench, XCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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

interface SupabaseConnectionForm {
  projectRef: string;
  password: string;
  connectionType: "direct" | "session" | "transaction";
  region: string;
}

// Supabase connection regions
const SUPABASE_REGIONS = [
  { value: "eu-central-1", label: "EU Central (Frankfurt)" },
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-west-1", label: "US West (Oregon)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
  { value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
];

export function SupabaseConnectionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { addConnection, setSelectedConnectionId } = useDbConnectionStore();

  const form = useForm<SupabaseConnectionForm>({
    defaultValues: {
      projectRef: "",
      password: "",
      connectionType: "transaction",
      region: "eu-central-1",
    },
  });

  const handleTestConnection = async () => {
    const { projectRef, password, connectionType, region } = form.getValues();
    if (!projectRef) {
      setConnectionStatus("error");
      setErrorMessage("Project reference is required");
      return false;
    }

    if (!password) {
      setConnectionStatus("error");
      setErrorMessage("Password is required");
      return false;
    }

    // Clean the project reference to prevent common issues
    const cleanProjectRef = projectRef.trim().toLowerCase();

    setIsLoading(true);
    setConnectionStatus("idle");
    setErrorMessage("");

    try {
      // Create the connection details
      const connectionDetails = createSupabaseConnectionDetails(
        cleanProjectRef,
        password, // Pass raw password without modification
        connectionType !== "direct",
        connectionType === "transaction" ? "transaction" : "session",
        region,
      ) as ConnectionDetails;

      // Since createSupabaseConnectionDetails returns Partial<ConnectionDetails>,
      // we need to add the id property
      connectionDetails.id = `supabase-${cleanProjectRef}-${connectionType}`;

      console.log("Testing Supabase connection:", {
        host: connectionDetails.host,
        port: connectionDetails.port,
        user: connectionDetails.user,
        hasPassword: !!connectionDetails.password,
        passwordLength: connectionDetails.password?.length,
        type: connectionType,
      });

      const connected =
        await window.electronAPI.testConnection(connectionDetails);

      if (connected) {
        console.log("Supabase connection successful!");
        setConnectionStatus("success");
        return true;
      } else {
        console.log("Supabase connection failed");
        setConnectionStatus("error");

        // Provide more specific error messages based on the connection type
        if (connectionType === "direct") {
          setErrorMessage(
            "Direct connection failed. Supabase direct connections often have firewall restrictions. Try using Transaction Pooler instead.",
          );
        } else if (connectionType === "session") {
          setErrorMessage(
            "Session Pooler connection failed. This could be due to authentication issues or network restrictions. Try Transaction Pooler.",
          );
        } else {
          setErrorMessage(
            "Unable to connect to Supabase. Please verify your project reference and password.",
          );
        }
        return false;
      }
    } catch (error) {
      console.error("Supabase connection error:", error);
      setConnectionStatus("error");
      if (error instanceof Error) {
        if (
          error.message.includes("SASL") ||
          error.message.includes("password")
        ) {
          setErrorMessage(
            "Authentication failed. Please copy your password directly from Supabase dashboard without any modifications.",
          );
        } else if (error.message.includes("ENOTFOUND")) {
          setErrorMessage(
            "Project reference is invalid. Please check your project reference in the Supabase URL.",
          );
        } else if (
          error.message.includes("ETIMEDOUT") ||
          error.message.includes("timeout")
        ) {
          setErrorMessage(
            "Connection timed out. Please check your network and firewall settings, or try the Transaction Pooler.",
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

  const handleSaveConnection = async () => {
    try {
      // Test connection first
      const isConnected = await handleTestConnection();
      if (!isConnected) {
        return; // Don't save if connection test fails
      }

      const { projectRef, password, connectionType, region } = form.getValues();

      // Create the connection details
      const connectionDetails = createSupabaseConnectionDetails(
        projectRef,
        password,
        connectionType !== "direct",
        connectionType === "transaction" ? "transaction" : "session",
        region,
      ) as ConnectionDetails;

      // Since createSupabaseConnectionDetails returns Partial<ConnectionDetails>,
      // we need to add the id property
      connectionDetails.id = `supabase-${Date.now()}`;

      // Add the connection
      const newConnection = addConnection(connectionDetails);
      setSelectedConnectionId(newConnection.id);

      // Close the dialog
      onOpenChange(false);

      // Reset form
      form.reset();
    } catch (error) {
      console.error("Failed to save Supabase connection:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect to Supabase</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="projectRef"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Reference</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="bekowpfzavpgpymlsdgp"
                      className="placeholder:text-gray-400 placeholder:opacity-60"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    The project reference is the unique identifier in your
                    Supabase URL:
                    <strong>https://***.supabase.co</strong>
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="placeholder:text-gray-400 placeholder:opacity-60"
                      value={field.value}
                      onChange={(e) => {
                        // Store password exactly as typed without modifications
                        field.onChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <p className="text-muted-foreground text-xs">
                    Get this from Supabase Dashboard → Project Settings →
                    Database → Password
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="connectionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select connection type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="transaction">
                        Transaction Pooler (port 6543) - Recommended
                      </SelectItem>
                      <SelectItem value="session">
                        Session Pooler (port 5432)
                      </SelectItem>
                      <SelectItem value="direct">Direct Connection</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region (for Pooler)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUPABASE_REGIONS.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Add option to try with and without SSL certificate */}
            <div className="mb-2 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
              <div className="mb-1 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                <p className="font-medium">Still having trouble connecting?</p>
              </div>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <strong>Always try Transaction Pooler first</strong> - it's
                  IPv4 compatible and most reliable
                </li>
                <li>
                  Ensure your password is copied exactly from Supabase without
                  extra spaces
                </li>
                <li>
                  For authentication errors, try logging into Supabase Dashboard
                  to verify your password
                </li>
              </ul>
            </div>

            {/* Helper for Supabase users */}
            <div className="mb-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
              <p className="mb-1 font-medium">
                Quick Supabase Connection Guide:
              </p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>
                  Copy your project reference from the URL:{" "}
                  <code>
                    https://<strong>yourproject</strong>.supabase.co
                  </code>
                </li>
                <li>
                  Use the password from Supabase Dashboard → Settings → Database
                </li>
                <li>Select "Transaction Pooler" (strongly recommended)</li>
                <li>Choose your project's region</li>
              </ol>
            </div>

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
          </form>
        </Form>

        <DialogFooter className="flex items-center justify-between">
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isLoading}
              className="mr-2"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Test Connection"
              )}
            </Button>
          </div>
          <Button
            type="button"
            onClick={handleSaveConnection}
            disabled={isLoading}
          >
            Save Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useSupabaseConnectionDialog() {
  const [showSupabaseConnectionDialog, setShowSupabaseConnectionDialog] =
    useState(false);

  const SupabaseConnectionDialogCallback = useCallback(() => {
    return (
      <SupabaseConnectionDialog
        open={showSupabaseConnectionDialog}
        onOpenChange={setShowSupabaseConnectionDialog}
      />
    );
  }, [showSupabaseConnectionDialog]);

  return useMemo(
    () => ({
      setShowSupabaseConnectionDialog,
      SupabaseConnectionDialog: SupabaseConnectionDialogCallback,
    }),
    [SupabaseConnectionDialogCallback],
  );
}
