import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ConnectionDetails {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

interface AiModelConfig {
  provider: 'openai' | 'claude';
  apiKey: string;
  model: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'sql' | 'result';
  content: string | Record<string, unknown>[];
  columns?: string[];
  error?: string;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

interface AppContextType {
  dbConfig: ConnectionDetails | null;
  setDbConfig: (config: ConnectionDetails | null) => void;
  aiConfig: AiModelConfig | null;
  setAiConfig: (config: AiModelConfig | null) => void;
  chats: Chat[];
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  createNewChat: () => void;
  deleteChat: (id: string) => void;
  getCurrentChat: () => Chat | null;
  addMessageToCurrentChat: (message: Omit<ChatMessage, 'id'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Fallback key for localStorage when file system access fails
const STORAGE_KEY = 'database-ai-chats';

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [dbConfig, setDbConfig] = useState<ConnectionDetails | null>(null);
  const [aiConfig, setAiConfig] = useState<AiModelConfig | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Load chats from the file system on mount
  useEffect(() => {
    const loadChats = async () => {
      try {
        // Try to load from Electron's file system
        if (window.electronAPI) {
          const savedChats = await window.electronAPI.loadChats();
          if (savedChats && savedChats.length > 0) {
            setChats(savedChats);
            
            // Set the most recent chat as current
            const mostRecent = savedChats.sort((a: Chat, b: Chat) => b.updatedAt - a.updatedAt)[0];
            setCurrentChatId(mostRecent.id);
            return;
          }
        }
        
        // Fallback to localStorage if the file system load fails
        const localChats = localStorage.getItem(STORAGE_KEY);
        if (localChats) {
          const parsedChats = JSON.parse(localChats);
          setChats(parsedChats);
          
          if (parsedChats.length > 0) {
            const mostRecent = parsedChats.sort((a: Chat, b: Chat) => b.updatedAt - a.updatedAt)[0];
            setCurrentChatId(mostRecent.id);
          }
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
      }
    };
    
    loadChats();
  }, []);
  
  // Save chats to both file system and localStorage whenever they change
  useEffect(() => {
    const saveChats = async () => {
      try {
        // Save to Electron's file system
        if (window.electronAPI) {
          await window.electronAPI.saveChats(chats);
        }
        
        // Always also save to localStorage as a backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
      } catch (error) {
        console.error('Failed to save chats:', error);
        // Ensure we save to localStorage even if file system save fails
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
      }
    };
    
    if (chats.length > 0) {
      saveChats();
    }
  }, [chats]);
  
  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `New Chat ${chats.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };
  
  const deleteChat = (id: string) => {
    setChats(prev => prev.filter(chat => chat.id !== id));
    
    // If the deleted chat was the current one, select another chat
    if (currentChatId === id) {
      const remainingChats = chats.filter(chat => chat.id !== id);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        setCurrentChatId(null);
      }
    }
  };
  
  const getCurrentChat = (): Chat | null => {
    if (!currentChatId) return null;
    return chats.find(chat => chat.id === currentChatId) || null;
  };
  
  const addMessageToCurrentChat = (message: Omit<ChatMessage, 'id'>) => {
    if (!currentChatId) {
      createNewChat();
    }
    
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString()
    };
    
    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        // Update chat title based on first user message if it's a default title
        let title = chat.title;
        if (message.type === 'user' && chat.messages.length === 0 && chat.title.startsWith('New Chat')) {
          const userMessage = message.content as string;
          title = userMessage.length > 30 ? userMessage.substring(0, 30) + '...' : userMessage;
        }
        
        return {
          ...chat,
          title,
          updatedAt: Date.now(),
          messages: [...chat.messages, newMessage]
        };
      }
      return chat;
    }));
  };

  return (
    <AppContext.Provider value={{ 
      dbConfig, 
      setDbConfig, 
      aiConfig, 
      setAiConfig,
      chats,
      currentChatId,
      setCurrentChatId,
      createNewChat,
      deleteChat,
      getCurrentChat,
      addMessageToCurrentChat
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
