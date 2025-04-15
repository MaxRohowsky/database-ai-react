import { readFileAsText } from "@/lib/utils";
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
    const formDataToSave: ConnectionDetails = {
      ...formData,
      certFile:
        formData.certFile instanceof File
          ? await readFileAsText(formData.certFile)
          : formData.certFile,
      id: connectionId,
    };

    // Check if it's an edit or new connection
    if (connectionId && formData.id) {
      // Update existing connection
      const updatedConnection = updateConnection(formDataToSave);
      setSelectedConnectionId(updatedConnection.id);
    } else {
      // Add new connection
      const newConnection = addConnection(formDataToSave);
      setSelectedConnectionId(newConnection.id);
    }

    return formDataToSave;
  };

  return {
    saveConnection,
  };
};
