import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useSaveConnection } from "../hooks/use-save-connection";

export const SaveConnectionButton = ({
  form,
  setShowAddDbConnectionDialog,
  isConnected,
}: {
  form: UseFormReturn<ConnectionDetails>;
  setShowAddDbConnectionDialog: Dispatch<SetStateAction<boolean>>;
  isConnected: boolean;
}) => {
  const { saveConnection } = useSaveConnection(form);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  const handleSaveConnection = () => {
    if (isConnected) {
      saveConnection();
      setShowAddDbConnectionDialog(false);
    } else {
      setShowWarningDialog(true);
    }
  };

  return (
    <>
      <Button onClick={handleSaveConnection}>Save Connection</Button>

      <WarningDialog
        saveConnection={saveConnection}
        showWarningDialog={showWarningDialog}
        setShowWarningDialog={setShowWarningDialog}
        setShowAddDbConnectionDialog={setShowAddDbConnectionDialog}
      />
    </>
  );
};

export const WarningDialog = ({
  saveConnection,
  showWarningDialog,
  setShowWarningDialog,
  setShowAddDbConnectionDialog,
}: {
  saveConnection: () => void;
  showWarningDialog: boolean;
  setShowWarningDialog: Dispatch<SetStateAction<boolean>>;
  setShowAddDbConnectionDialog: Dispatch<SetStateAction<boolean>>;
}) => {
  return (
    <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Connection Not Tested
          </DialogTitle>
          <DialogDescription>
            You haven't successfully tested this connection. Are you sure you
            want to save the connection?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={() => setShowWarningDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={() => {
              saveConnection();
              setShowWarningDialog(false);
              setShowAddDbConnectionDialog(false);
            }}
          >
            Save Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
