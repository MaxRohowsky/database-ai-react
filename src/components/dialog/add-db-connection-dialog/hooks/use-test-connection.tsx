import { useState } from "react";
import { UseFormReturn } from "react-hook-form";

export type ConnectionStatus = "idle" | "success" | "error";
/**
 * Hook to test the connection to the database used in the test connection button and the save connection button
 * @param form - The form to test the connection for
 * @returns
 * isLoading - Returns true if the connection test is loading, otherwise false
 * isConnected - Returns true if the connection is successful, otherwise false
 * connectionStatus - Returns the status of the connection: "idle", "success", or "error"
 * testConnection - The function to test the connection
 */
export const useTestConnection = (form: UseFormReturn<ConnectionDetails>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("idle");
  const [isConnected, setIsConnected] = useState(false);

  const testConnection = async (): Promise<boolean> => {
    const formData = form.getValues();
    try {
      setIsLoading(true);
      setConnectionStatus("idle");

      // Create a copy of the form data
      const formDataToSend = { ...formData };

      // If there's a certificate file, read it and convert to string
      if (formData.certFile instanceof File) {
        const fileReader = new FileReader();
        const certContent = await new Promise<string>((resolve, reject) => {
          fileReader.onload = () => resolve(fileReader.result as string);
          fileReader.onerror = () => reject(fileReader.error);
          fileReader.readAsText(formData.certFile as File);
        });

        // Replace the File object with the file content string
        formDataToSend.certFile = certContent;
      }

      const connected = await window.electronAPI.testConnection(formDataToSend);

      if (connected) {
        setConnectionStatus("success");
        setIsConnected(true);
        return true;
      } else {
        setConnectionStatus("error");
        setIsConnected(false);
        return false;
      }
    } catch (error) {
      setConnectionStatus("error");
      setIsConnected(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, isConnected, connectionStatus, testConnection };
};
