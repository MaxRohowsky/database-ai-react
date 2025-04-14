import { useDbConnectionStore } from "@/store/db-connection-store";
import { UseFormReturn } from "react-hook-form";

export const useSaveConnection = (form: UseFormReturn<ConnectionDetails>) => {
  const { addConnection, updateConnection, setSelectedConnectionId } =
    useDbConnectionStore();

  const saveConnection = () => {
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

    return connectionDetails;
  };

  return {
    saveConnection,
  };
};
