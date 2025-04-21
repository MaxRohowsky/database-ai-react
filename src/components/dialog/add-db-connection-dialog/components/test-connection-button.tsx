import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, RotateCcw } from "lucide-react";

export const TestConnectionButton = ({
  isLoading,
  dbConnectionStatus,
  testDbConnection,
}: {
  isLoading: boolean;
  dbConnectionStatus: DbConnectionStatus;
  testDbConnection: () => Promise<boolean>;
}) => {
  const handleTestConnection = () => {
    testDbConnection();
  };

  return (
    <Button
      type="button"
      variant={
        dbConnectionStatus === "success"
          ? "default"
          : dbConnectionStatus === "error"
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
      ) : dbConnectionStatus === "success" ? (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Success
        </>
      ) : dbConnectionStatus === "error" ? (
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
