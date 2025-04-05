import { ipcRenderer, contextBridge } from 'electron'

// Type definitions for the database connections and queries
interface ConnectionDetails {
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
  constraint?: string | null;
}

interface Schema {
  [tableName: string]: SchemaColumn[];
}

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// Expose database and AI-related methods to the renderer process
contextBridge.exposeInMainWorld('api', {
  connectToDatabase: (connectionDetails: ConnectionDetails) => 
    ipcRenderer.invoke('connect-to-database', connectionDetails),
  testConnection: (connectionDetails: ConnectionDetails) => 
    ipcRenderer.invoke('test-connection', connectionDetails),
  getSchema: () => 
    ipcRenderer.invoke('get-schema'),
  updateModelConfig: (provider: string, config: ModelConfig) => 
    ipcRenderer.invoke('update-model-config', provider, config),
  getModelConfigs: () =>
    ipcRenderer.invoke('get-model-configs'),
  generateSql: (naturalLanguage: string, schema: Schema, provider: string) => 
    ipcRenderer.invoke('generate-sql', naturalLanguage, schema, provider),
  executeQuery: (query: string) => 
    ipcRenderer.invoke('execute-query', query),
})
