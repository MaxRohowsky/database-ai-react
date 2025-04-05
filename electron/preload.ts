import { ipcRenderer, contextBridge } from 'electron'
import { AiModelConfig } from './services/ai'
import { ConnectionDetails } from './services/database'

// Chat-related types
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

  // You can expose other APTs you need here.
  // ...
})


contextBridge.exposeInMainWorld('electronAPI', {
  sayHi: () => {
    console.log('hi');
    return 'hi logged to console';
  },
  testConnection: (config: ConnectionDetails) => ipcRenderer.invoke('testConnection', config),
  generateSQL: (aiConfig: AiModelConfig, prompt: string, dbSchema?: string) => 
    ipcRenderer.invoke('generateSQL', { aiConfig, prompt, dbSchema }),
  executeSQL: (dbConfig: ConnectionDetails, query: string) => 
    ipcRenderer.invoke('executeSQL', { dbConfig, query }),
  saveChats: (chats: Chat[]) => 
    ipcRenderer.invoke('saveChats', chats),
  loadChats: () => 
    ipcRenderer.invoke('loadChats')
});