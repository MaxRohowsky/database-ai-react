import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/store/chat-store";
import { MoreHorizontal, PenSquare, Star, Trash2 } from "lucide-react";

import { useRenameChatDialog } from "@/components/dialog/rename-chat-dialog";
import AiConfigDialog from "@/components/header/select-ai-model";
import SelectedDBConnection from "@/components/header/selected-db-connection";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Header() {
  const { getCurrentChat } = useChatStore();
  const currentChat = getCurrentChat();

  const { favouriteChat, deleteChat } = useChatStore();
  const { setShowRenameChatDialog, RenameChatDialog, setChatToRename } =
    useRenameChatDialog();

  return (
    <div className="flex w-full flex-shrink-0 items-center justify-between border-b">
      <SidebarTrigger className="bg-secondary m-4 h-8 w-8" />
      <div className="flex w-full items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {currentChat && (
              <>
                <span className="text-xl font-semibold">
                  {currentChat?.title || "New Chat"}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger className="rounded-md p-1 hover:bg-gray-100">
                    <MoreHorizontal className="h-5 w-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align="end">
                    <DropdownMenuItem
                      onClick={() => favouriteChat(currentChat.id)}
                    >
                      <Star className="mr-2 h-4 w-4 text-amber-500" />
                      <span>
                        {currentChat.isFavourite ? "Unfavourite" : "Favourite"}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setChatToRename(currentChat);
                        setShowRenameChatDialog(true);
                      }}
                    >
                      <PenSquare className="mr-2 h-4 w-4" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteChat(currentChat.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Remove</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        <SelectedDBConnection />
        <AiConfigDialog />
        <RenameChatDialog />
      </div>
    </div>
  );
}
