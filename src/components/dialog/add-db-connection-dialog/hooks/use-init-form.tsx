import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { emptyValues } from "../add-db-connection-dialog";

interface UseResetFormProps {
  form: UseFormReturn<DbConfig>;
  showAddDbConnectionDialog: boolean;
  connectionToEdit?: DbConfig;
}

export function useInitForm({
  form,
  showAddDbConnectionDialog,
  connectionToEdit,
}: UseResetFormProps) {
  useEffect(() => {
    if (showAddDbConnectionDialog) {
      if (connectionToEdit) {
        form.reset(connectionToEdit);
      } else {
        form.reset(emptyValues);
      }
    }

    return () => {
      form.reset(emptyValues);
    };
  }, [showAddDbConnectionDialog, connectionToEdit, form]);
}
