import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, RotateCcw } from "lucide-react";
import type { ConnectionStatus } from "../hooks/use-test-connection";
export const TestConnectionButton = ({
  isLoading,
  connectionStatus,
  testConnection,
}: {
  isLoading: boolean;
  connectionStatus: ConnectionStatus;
  testConnection: () => Promise<boolean>;
}) => {
  const handleTestConnection = () => {
    testConnection();
    console.log("testConnection");
  };

  return (
    <Button
      type="button"
      variant={
        connectionStatus === "success"
          ? "default"
          : connectionStatus === "error"
            ? "destructive"
            : "outline"
      }
      onClick={handleTestConnection}
      disabled={isLoading}
      className="mr-2 flex w-32 items-center justify-center"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Testing
        </>
      ) : connectionStatus === "success" ? (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Success
        </>
      ) : connectionStatus === "error" ? (
        <>
          <RotateCcw className="mr-2 h-4 w-4" />
          Retry
        </>
      ) : (
        "Test Connection"
      )}
    </Button>
  );
};
