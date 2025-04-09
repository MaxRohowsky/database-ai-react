// src/components/RenameDialog.tsx
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/store/chat-store";
import { useCallback, useMemo, useState } from "react";

interface RenameDialogProps {
  showRenameChatDialog: boolean;
  setShowRenameChatDialog: (showRenameChatDialog: boolean) => void;
  chatToRename: { id: string; title: string };
}

function RenameChatDialog({
  showRenameChatDialog,
  setShowRenameChatDialog,
  chatToRename,
}: RenameDialogProps) {
  const { renameChat } = useChatStore();
  const [name, setName] = useState(chatToRename.title);

  const handleSave = () => {
    if (name.trim()) {
      renameChat(chatToRename.id, name.trim());
      setShowRenameChatDialog(false);
    }
  };

  return (
    <Dialog open={showRenameChatDialog} onOpenChange={setShowRenameChatDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename chat</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter chat name"
            className="w-full"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSave();
              }
            }}
          />
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowRenameChatDialog(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useRenameChatDialog() {
  const [showRenameChatDialog, setShowRenameChatDialog] = useState(false);
  const [chatToRename, setChatToRename] = useState<{
    id: string;
    title: string;
  }>();

  const RenameChatDialogCallback = useCallback(() => {
    if (!chatToRename) return null;

    return (
      <RenameChatDialog
        showRenameChatDialog={showRenameChatDialog}
        setShowRenameChatDialog={setShowRenameChatDialog}
        chatToRename={chatToRename}
      />
    );
  }, [showRenameChatDialog, setShowRenameChatDialog, chatToRename]);

  return useMemo(
    () => ({
      setShowRenameChatDialog,
      setChatToRename,
      RenameChatDialog: RenameChatDialogCallback,
    }),
    [setShowRenameChatDialog, RenameChatDialogCallback],
  );
}
