interface ConnectionDetails {
    name: string;
    host: string;
    port: string;
    database: string;
    user: string;
    password: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'sql' | 'result';
  content: string | Record<string, unknown>[];
  columns?: string[];
  error?: string;
}

interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

interface AiModelConfig {
  provider: 'openai' | 'claude';
  apiKey: string;
  model: string;
}

interface SQLGenerationResponse {
  sqlQuery: string;
  error?: string;
}

interface SQLExecutionResponse {
  rows: Record<string, unknown>[];
  columns: string[];
  error?: string;
}

interface DbSchemaResponse {
  schema?: string;
  error?: string;
}

interface Window {
  electronAPI: {
    sayHi: () => string;
    testConnection: (config: ConnectionDetails) => Promise<boolean>;
    generateSQL: (aiConfig: AiModelConfig, prompt: string, dbSchema?: string) => Promise<SQLGenerationResponse>;
    executeSQL: (dbConfig: ConnectionDetails, query: string) => Promise<SQLExecutionResponse>;
    fetchDbSchema: (dbConfig: ConnectionDetails) => Promise<DbSchemaResponse>;
    saveChats: (chats: Chat[]) => Promise<{ success: boolean }>;
    loadChats: () => Promise<Chat[]>;
  }
} 