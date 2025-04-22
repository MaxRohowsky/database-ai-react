/* eslint-disable react-refresh/only-export-components */
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { SaveConnectionButton } from "./components/save-connection-button";
import { TestConnectionButton } from "./components/test-connection-button";
import ConfigForm from "./db-config-form/config-form";
import { useInitForm } from "./hooks/use-init-form";
import { useTestConnection } from "./hooks/use-test-connection";

export const emptyValues = {
  id: "",
  name: "",
  engine: "",
  host: "",
  port: "",
  database: "",
  user: "",
  password: "",
  certFile: null,
};

function AddDbConnectionModal({
  showAddDbConnectionDialog,
  setShowAddDbConnectionDialog,
  connectionToEdit,
}: {
  showAddDbConnectionDialog: boolean;
  setShowAddDbConnectionDialog: Dispatch<SetStateAction<boolean>>;
  connectionToEdit?: DbConfig;
}) {
  const form = useForm<DbConfig>({
    defaultValues: emptyValues,
  });

  // Test Connection State needs to be available to Save and Test buttons
  const { isLoading, dbConnectionStatus, isConnected, testDbConnection } =
    useTestConnection(form);

  useInitForm({
    form,
    showAddDbConnectionDialog,
    connectionToEdit,
  });

  return (
    <Dialog
      open={showAddDbConnectionDialog}
      onOpenChange={() => setShowAddDbConnectionDialog(false)}
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
            <ConnectionNameField form={form} />
            <DatabaseEngineField form={form} />
            <ConfigForm form={form} />
            {/*Hidden Id Field */}
            <input type="hidden" {...form.register("id")} />
          </form>
        </Form>

        <DialogFooter className="flex items-center justify-between">
          <TestConnectionButton
            isLoading={isLoading}
            dbConnectionStatus={dbConnectionStatus}
            testDbConnection={testDbConnection}
          />
          <SaveConnectionButton
            form={form}
            setShowAddDbConnectionDialog={setShowAddDbConnectionDialog}
            isConnected={isConnected}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useAddDbConnectionModal() {
  const [showAddDbConnectionDialog, setShowAddDbConnectionDialog] =
    useState(false);
  const [connectionToEdit, setConnectionToEdit] = useState<
    DbConfig | undefined
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

function ConnectionNameField({ form }: { form: UseFormReturn<DbConfig> }) {
  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="after:ml-0.5 after:text-xs after:text-black/70 after:content-['*']">
            Connection Name
          </FormLabel>
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
  );
}

function DatabaseEngineField({ form }: { form: UseFormReturn<DbConfig> }) {
  return (
    <FormField
      control={form.control}
      name="engine"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="after:ml-0.5 after:text-xs after:text-black/70 after:content-['*']">
            Database Engine
          </FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select database engine" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="postgres">
                <img
                  src="./db-icons/postgres.svg"
                  alt="PostgreSQL"
                  className="mr-2 h-4 w-4"
                />
                PostgreSQL
              </SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
}
