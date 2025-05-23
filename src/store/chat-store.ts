import { create } from "zustand";

// Storage constants
const STORAGE_KEY = "database-ai-chats";

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  chats: [],
  currentChatId: null,

  // Actions
  setCurrentChatId: (chatId) => set({ currentChatId: chatId }),

  createNewChat: (): void => {
    // Create a new chat
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `New Chat ${get().chats.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      isFavourite: false,
    };

    set((state) => ({
      // Add the new chat to the list
      chats: [newChat, ...state.chats],
      // Set the new chat as the current chat
      currentChatId: newChat.id,
    }));

    // Save to storage
    saveChatsToPersistentStorage(get().chats);
  },

  deleteChat: (chatId: string): void => {
    const { chats, currentChatId } = get();
    const updatedChats = chats.filter((chat) => chat.id !== chatId);

    let newCurrentChatId = currentChatId;

    // If we're deleting the current chat, select another one
    if (currentChatId === chatId) {
      newCurrentChatId = updatedChats.length > 0 ? updatedChats[0].id : null;
    }

    set({
      chats: updatedChats,
      currentChatId: newCurrentChatId,
    });

    // Save to storage
    saveChatsToPersistentStorage(updatedChats);
  },

  favouriteChat: (chatId: string): void => {
    const { chats } = get();
    const updatedChats = chats.map((chat) => {
      if (chat.id === chatId) {
        return { ...chat, isFavourite: !chat.isFavourite };
      }
      return chat;
    });

    set({ chats: updatedChats });

    // Save to storage
    saveChatsToPersistentStorage(updatedChats);
  },

  getCurrentChat: (): Chat | null => {
    const { chats, currentChatId } = get();
    if (!currentChatId) return null;
    return chats.find((chat) => chat.id === currentChatId) || null;
  },

  addMessageToCurrentChat: (message: Omit<Message, "id">): void => {
    const { chats, currentChatId, createNewChat } = get();

    // If no current chat, create one first
    if (!currentChatId) {
      createNewChat();
      // After createNewChat, we need to get the fresh state
      return get().addMessageToCurrentChat(message);
    }

    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
    };

    const updatedChats = chats.map((chat) => {
      if (chat.id === currentChatId) {
        // Update chat title based on first user message if it's a default title
        let title = chat.title;
        if (
          message.type === "user" &&
          chat.messages.length === 0 &&
          chat.title.startsWith("New Chat")
        ) {
          const userMessage = message.content as string; //TODO: fix this typing
          title =
            userMessage.length > 30
              ? userMessage.substring(0, 30) + "..."
              : userMessage;
        }

        return {
          ...chat,
          title,
          updatedAt: Date.now(),
          messages: [...chat.messages, newMessage],
        };
      }
      return chat;
    });

    set({ chats: updatedChats });

    // Save to storage
    saveChatsToPersistentStorage(updatedChats);
  },

  updateMessage: (messageId: string, updates: Partial<Message>): void => {
    const { chats, currentChatId } = get();
    if (!currentChatId) return;

    const updatedChats = chats.map((chat) => {
      if (chat.id === currentChatId) {
        // Find the message and update it
        const updatedMessages = chat.messages.map((msg) => {
          if (msg.id === messageId) {
            return { ...msg, ...updates };
          }
          return msg;
        });

        return {
          ...chat,
          updatedAt: Date.now(),
          messages: updatedMessages,
        };
      }
      return chat;
    });

    set({ chats: updatedChats });

    // Save to storage
    saveChatsToPersistentStorage(updatedChats);
  },

  renameChat: (chatId: string, newTitle: string): void => {
    const { chats } = get();
    const updatedChats = chats.map((chat) => {
      if (chat.id === chatId) {
        return { ...chat, title: newTitle };
      }
      return chat;
    });

    set({ chats: updatedChats });

    // Save to storage
    saveChatsToPersistentStorage(updatedChats);
  },
}));

// Helper function to save chats to persistent storage
async function saveChatsToPersistentStorage(chats: Chat[]) {
  try {
    // Save to Electron's file system
    if (window.electronAPI && "saveChats" in window.electronAPI) {
      await window.electronAPI.saveChats(chats);
    }

    // Always also save to localStorage as a backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error("Failed to save chats:", error);
    // Ensure we save to localStorage even if file system save fails
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }
}

// Initialize the store by loading existing chats
export async function initializeChatStore() {
  try {
    let savedChats: Chat[] = [];

    // Try to load from Electron's file system
    if (window.electronAPI && "loadChats" in window.electronAPI) {
      const electronChats = await window.electronAPI.loadChats();
      if (electronChats && electronChats.length > 0) {
        savedChats = electronChats;
      }
    }

    // If no chats from Electron, try localStorage
    if (savedChats.length === 0) {
      const localChats = localStorage.getItem(STORAGE_KEY);
      if (localChats) {
        savedChats = JSON.parse(localChats);
      }
    }

    if (savedChats.length > 0) {
      // Set the state
      useChatStore.setState({
        chats: savedChats,
        // Set the most recent chat as current
        currentChatId: savedChats.sort((a, b) => b.updatedAt - a.updatedAt)[0]
          .id,
      });
    }
  } catch (error) {
    console.error("Failed to load chats:", error);
  }
}
