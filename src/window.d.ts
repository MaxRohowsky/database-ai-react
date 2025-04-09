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

interface AiResponse {
  sqlQuery: string;
  explanation?: string;
  error?: string;
}

interface SqlResult {
  columns: string[];
  rows: Record<string, unknown>[];
  affectedRows?: number;
  error?: string;
}

interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

interface ChatMessage {
  id: string;
  type: 'user' | 'sql' | 'result';
  content: string | Record<string, unknown>[];
  columns?: string[];
  error?: string;
}

interface Window {
  electronAPI: {
    sayHi: () => string;
    testConnection: (connectionDetails: ConnectionDetails) => Promise<boolean>;
    generateSQL: (aiConfig: AiModelConfig, prompt: string, dbSchema?: string) => Promise<AiResponse>;
    executeSQL: (dbConfig: ConnectionDetails, query: string) => Promise<SqlResult>;
    fetchDbSchema: (dbConfig: ConnectionDetails) => Promise<{ schema?: string; error?: string }>;
    loadChats: () => Promise<Chat[]>;
    saveChats: (chats: Chat[]) => Promise<void>;
  };
  // other properties...
}