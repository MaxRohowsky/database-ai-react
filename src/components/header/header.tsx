import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/store/chat-store";
import { MoreHorizontal, PenSquare, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { RenameDialog } from "../rename-chat-dialog";
import AiConfigDialog from "./select-ai-model";
import DBConnectionDialog from "./select-db-connection";

export default function Header() {
  const { getCurrentChat, favouriteChat, deleteChat, renameChat } =
    useChatStore();
  const currentChat = getCurrentChat();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  const handleFavouriteChat = () => {
    if (currentChat) {
      favouriteChat(currentChat.id);
    }
  };

  const handleDeleteChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentChat) {
      deleteChat(currentChat.id);
    }
  };

  const handleRenameChat = (newTitle: string) => {
    if (currentChat) {
      renameChat(currentChat.id, newTitle);
    }
  };

  return (
    <div className="border-border flex w-full items-center justify-between p-4">
      <h1 className="text-xl font-semibold">
        {currentChat?.title || "New Chat"}
      </h1>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {currentChat && (
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-md p-1 hover:bg-gray-100">
                <MoreHorizontal className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end">
                <DropdownMenuItem onClick={handleFavouriteChat}>
                  <Star className="mr-2 h-4 w-4 text-amber-500" />
                  <span>
                    {currentChat.isFavourite ? "Unfavourite" : "Favourite"}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
                  <PenSquare className="mr-2 h-4 w-4" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteChat}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Remove</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DBConnectionDialog />
          <AiConfigDialog />
        </div>
      </div>

      {currentChat && (
        <RenameDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          currentName={currentChat.title}
          onRename={handleRenameChat}
        />
      )}
    </div>
  );
}
