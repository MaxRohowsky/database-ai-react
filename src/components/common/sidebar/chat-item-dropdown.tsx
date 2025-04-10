import { useRenameChatDialog } from "@/components/dialog/rename-chat-dialog";
import { useChatStore } from "@/store/chat-store";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuAction } from "@/components/ui/sidebar";
import { MoreHorizontal, PenSquare, Star, Trash2 } from "lucide-react";

export function ChatItemDropdown({ chat }: { chat: Chat }) {
  const { setShowRenameChatDialog, setChatToRename, RenameChatDialog } =
    useRenameChatDialog();

  const { favouriteChat, deleteChat } = useChatStore();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction>
            <MoreHorizontal />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem onClick={() => favouriteChat(chat.id)}>
            <Star
              className={`mr-2 h-4 w-4 ${
                chat.isFavourite
                  ? "fill-none text-amber-500"
                  : "fill-amber-500 text-amber-500"
              }`}
            />
            {chat.isFavourite ? "Unfavourite" : "Favourite"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              console.log("Renaming chat:", chat);
              setChatToRename(chat);
              setShowRenameChatDialog(true);
            }}
          >
            <PenSquare className="mr-2 h-4 w-4" />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => deleteChat(chat.id)}>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Remove</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RenameChatDialog />
    </>
  );
}
