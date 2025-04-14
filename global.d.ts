
interface ConnectionDetails {
  engine: string;
  id: string;
  name: string;
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  certFile?: File | string | null;
}



interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'db';
  content: string | Record<string, unknown>[];
  columns?: string[];
  error?: string;
}

interface DatabaseAdapter {
  testConnection(): Promise<boolean>;
  executeQuery(query: string): Promise<SqlResult>;
  fetchDatabaseSchema(): Promise<{ schema: string | undefined, error?: string }>;
}

interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  isFavourite: boolean;
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