import { useChatStore } from "@/store/chat-store";
import { useState } from "react";

export function useChatManager() {
  const { getCurrentChat, favouriteChat, deleteChat, renameChat } =
    useChatStore();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [chatToRename, setChatToRename] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Handler for toggling favorite status of current chat
  const handleFavouriteCurrentChat = () => {
    const currentChat = getCurrentChat();
    if (currentChat) {
      favouriteChat(currentChat.id);
    }
  };

  // Handler for toggling favorite status of any chat
  const handleFavouriteChat = (chatId: string) => {
    favouriteChat(chatId);
  };

  // Handler for deleting the current chat with event stopping
  const handleDeleteCurrentChat = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentChat = getCurrentChat();
    if (currentChat) {
      deleteChat(currentChat.id);
    }
  };

  // Handler for deleting any chat with event stopping
  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  // Handler for renaming the current chat
  const handleRenameCurrentChat = (newTitle: string) => {
    const currentChat = getCurrentChat();
    if (currentChat) {
      renameChat(currentChat.id, newTitle);
    }
  };

  // Handler for renaming any chat
  const handleRenameChat = (chatId: string, newTitle: string) => {
    renameChat(chatId, newTitle);
  };

  // Handler for opening rename dialog for current chat
  const handleOpenRenameDialogForCurrentChat = () => {
    const currentChat = getCurrentChat();
    if (currentChat) {
      setChatToRename(currentChat);
      setRenameDialogOpen(true);
    }
  };

  // Handler for opening rename dialog for any chat
  const handleOpenRenameDialog = (
    e: React.MouseEvent,
    chat: { id: string; title: string },
  ) => {
    e.stopPropagation();
    setChatToRename(chat);
    setRenameDialogOpen(true);
  };

  // Handler for handling the rename submission from dialog
  const handleRenameSubmit = (newTitle: string) => {
    if (chatToRename) {
      renameChat(chatToRename.id, newTitle);
      setChatToRename(null);
    }
  };

  return {
    // Dialog state
    renameDialogOpen,
    setRenameDialogOpen,
    chatToRename,

    // Current chat operations
    handleFavouriteCurrentChat,
    handleDeleteCurrentChat,
    handleRenameCurrentChat,
    handleOpenRenameDialogForCurrentChat,

    // Any chat operations
    handleFavouriteChat,
    handleDeleteChat,
    handleRenameChat,
    handleOpenRenameDialog,

    // Dialog callback
    handleRenameSubmit,
  };
}
