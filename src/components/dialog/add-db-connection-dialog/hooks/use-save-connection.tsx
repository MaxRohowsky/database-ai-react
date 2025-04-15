import { useDbConnectionStore } from "@/store/db-connection-store";
import { UseFormReturn } from "react-hook-form";

export const useSaveConnection = (form: UseFormReturn<ConnectionDetails>) => {
  const { addConnection, updateConnection, setSelectedConnectionId } =
    useDbConnectionStore();

  const saveConnection = async () => {
    const formData = form.getValues();

    // Add ID if it's a new connection
    const connectionId = formData.id || `conn-${Date.now()}`;

    // Create a copy of the form data for the connection details
    const connectionDetails: ConnectionDetails = {
      ...formData,
      id: connectionId,
    };

    // If there's a certificate file, read it and convert to string
    if (formData.certFile instanceof File) {
      const fileReader = new FileReader();
      const certContent = await new Promise<string>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as string);
        fileReader.onerror = () => reject(fileReader.error);
        fileReader.readAsText(formData.certFile as File);
      });

      // Replace the File object with the file content string
      connectionDetails.certFile = certContent;
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

    return connectionDetails;
  };

  return {
    saveConnection,
  };
};
