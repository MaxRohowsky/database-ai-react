interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

interface ModelConfig {
  apiKey: string;
  model: string;
}

interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

interface Schema {
  [tableName: string]: SchemaColumn[];
}

interface IpcApi {
  connectToDatabase: (config: ConnectionConfig) => Promise<boolean>;
  testConnection: (config: ConnectionConfig) => Promise<boolean>;
  getSchema: () => Promise<Schema>;
  updateModelConfig: (provider: string, config: ModelConfig) => Promise<boolean>;
  getModelConfigs: () => Promise<{
    openai: { model: string; hasApiKey: boolean };
    claude: { model: string; hasApiKey: boolean };
  }>;
  generateSql: (naturalLanguage: string, schema: Schema, provider: string) => Promise<string>;
  executeQuery: (query: string) => Promise<any>;
}

declare global {
  interface Window {
    api: IpcApi;
  }
} 