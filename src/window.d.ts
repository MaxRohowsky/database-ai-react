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
  error?: string;
}

interface Window {
  electronAPI: {
    sayHi: () => string;
    testConnection: (connectionDetails: ConnectionDetails) => Promise<boolean>;
    generateSQL: (aiConfig: AiModelConfig, prompt: string, dbSchema?: string) => Promise<AiResponse>;
    executeSQL: (dbConfig: ConnectionDetails, query: string) => Promise<SqlResult>;
  };
  // other properties...
}