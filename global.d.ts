export {};

// -----------------------------
// AI Model Types
// -----------------------------

declare global {
  type AiModelSelection =
    | { selectedProvider: "openai"; selectedModel: OpenAiModel }
    | {
        selectedProvider: "anthropic";
        selectedModel: AnthropicModel;
      }
    | { selectedProvider: null; selectedModel: string };

  type AiModelProvider = "openai" | "anthropic";

  type OpenAiModel = "gpt-4" | "gpt-4-turbo" | "gpt-3.5-turbo";

  type AnthropicModel =
    | "claude-3-opus"
    | "claude-3-sonnet"
    | "claude-3-haiku"
    | "claude-3.5-sonnet";

  interface AiModelConfig {
    openai?: { apiKey: string };
    anthropic?: { apiKey: string };
  }

  // -----------------------------
  // Database Types
  // -----------------------------

  type DbConnectionStatus = "idle" | "success" | "error";

  interface DbConfig {
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

  interface DbAdapter {
    testDbConnection(): Promise<boolean>;
    executeSql(query: string): Promise<SqlResult>;
    fetchDbSchema(): Promise<{
      schema: string | undefined;
      error?: string;
    }>;
  }

  // -----------------------------
  // Chat Types
  // -----------------------------

  interface Chat {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: Message[];
    isFavourite: boolean;
  }

  interface Message {
    id: string;
    type: "user" | "ai" | "db";
    content: SqlGenerationResponse | SqlExecutionResponse | string;
    error?: string;
  }

  interface SqlGenerationResponse {
    sqlQuery: string;
    error?: string;
  }

  interface SqlExecutionResponse {
    columns: string[];
    rows: Record<string, unknown>[];
    affectedRows?: number;
    sqlQuery?: string;
    error?: string;
  }

  interface DbSchemaResponse {
    schema?: string;
    error?: string;
  }

  interface Window {
    electronAPI: {
      testDbConnection: (config: DbConnectionConfig) => Promise<boolean>;
      generateSql: (
        aiSelection: AiModelSelection,
        apiKey: string,
        prompt: string,
        dbSchema?: string,
      ) => Promise<SqlGenerationResponse>;
      executeSql: (
        dbConfig: DbConfig,
        query: string,
      ) => Promise<SqlExecutionResponse>;
      fetchDbSchema: (dbConfig: DbConfig) => Promise<DbSchemaResponse>;
      saveChats: (chats: Chat[]) => Promise<{ success: boolean }>;
      loadChats: () => Promise<Chat[]>;
    };
  }

  // -----------------------------
  // Store Types
  // -----------------------------

  interface AiModelStore {
    // State
    aiModelSelection: AiModelSelection | null;
    aiModelConfig: AiModelConfig | null;

    // Actions
    setAiModelConfig: (config: Partial<AiModelConfig>) => void;
    setAiModelSelection: (selection: Partial<AiModelSelection>) => void;
    resetConfig: () => void;
  }

  interface DbConfigStore {
    // State
    dbConfigs: DbConfig[];
    selectedDbConfigId: string | null;
    isLoaded: boolean;

    // Actions
    setDbConfigs: (dbConfigs: DbConfig[]) => void;
    setSelectedDbConfigId: (dbConfigId: string | null) => void;
    getSelectedDbConfig: () => DbConfig | null;
    addDbConfig: (dbConfig: DbConfig) => DbConfig;
    updateDbConfig: (dbConfig: DbConfig) => DbConfig;
    removeDbConfig: (dbConfigId: string) => void;
    setIsLoaded: (isLoaded: boolean) => void;
  }

  interface ChatStore {
    // State
    chats: Chat[];
    currentChatId: string | null;

    // Actions
    setCurrentChatId: (chatId: string | null) => void;
    createNewChat: () => void;
    deleteChat: (chatId: string) => void;
    favouriteChat: (chatId: string) => void;
    getCurrentChat: () => Chat | null;
    addMessageToCurrentChat: (message: Omit<Message, "id">) => void;
    updateMessage: (messageId: string, updates: Partial<Message>) => void;
    renameChat: (chatId: string, newTitle: string) => void;
  }

  // -----------------------------
  // ???
  // -----------------------------

  interface SqlResult {
    columns: string[];
    rows: Record<string, unknown>[];
    affectedRows?: number;
    error?: string;
  }

  interface Column {
    name: string;
    type: string;
    nullable: boolean;
    default: string | null;
  }

  interface Table {
    schema: string;
    name: string;
    columns: Column[];
  }
}
