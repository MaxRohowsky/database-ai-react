import { readFileAsText } from "@/lib/utils";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";

/**
 * Hook to test the connection to the database used in the test connection button and the save connection button
 * @param form - The form to test the connection for
 * @returns
 * isLoading - Returns true if the connection test is loading, otherwise false
 * isConnected - Returns true if the connection is successful, otherwise false
 * connectionStatus - Returns the status of the connection: "idle", "success", or "error"
 * testConnection - The function to test the connection
 */
export const useTestConnection = (form: UseFormReturn<DbConfig>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dbConnectionStatus, setDbConnectionStatus] =
    useState<DbConnectionStatus>("idle");
  const [isConnected, setIsConnected] = useState(false);

  const testDbConnection = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setDbConnectionStatus("idle");

      const formData = form.getValues();

      // Create a copy of the form data
      const formDataToSend = {
        ...formData,
        certFile:
          formData.certFile instanceof File
            ? await readFileAsText(formData.certFile)
            : formData.certFile,
      };

      const connected =
        await window.electronAPI.testDbConnection(formDataToSend);

      if (connected) {
        setDbConnectionStatus("success");
        setIsConnected(true);
        return true;
      } else {
        setDbConnectionStatus("error");
        setIsConnected(false);
        return false;
      }
    } catch (error) {
      setDbConnectionStatus("error");
      setIsConnected(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, isConnected, dbConnectionStatus, testDbConnection };
};
