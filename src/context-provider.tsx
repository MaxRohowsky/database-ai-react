import { createContext, useContext, useState, ReactNode } from 'react';

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

interface AppContextType {
  dbConfig: ConnectionDetails | null;
  setDbConfig: (config: ConnectionDetails | null) => void;
  aiConfig: AiModelConfig | null;
  setAiConfig: (config: AiModelConfig | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [dbConfig, setDbConfig] = useState<ConnectionDetails | null>(null);
  const [aiConfig, setAiConfig] = useState<AiModelConfig | null>(null);

  return (
    <AppContext.Provider value={{ 
      dbConfig, 
      setDbConfig, 
      aiConfig, 
      setAiConfig 
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
