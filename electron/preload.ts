import { contextBridge, ipcRenderer } from "electron";

// Chat-related types

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args),
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  // You can expose other APTs you need here.
  // ...
});

contextBridge.exposeInMainWorld("electronAPI", {
  testDbConnection: (dbConfig: DbConfig) =>
    ipcRenderer.invoke("testDbConnection", dbConfig),
  generateSql: (
    aiSelection: AiModelSelection,
    apiKey: string,
    prompt: string,
    dbSchema?: string,
  ) =>
    ipcRenderer.invoke("generateSql", {
      aiSelection,
      apiKey,
      prompt,
      dbSchema,
    }),
  executeSql: (dbConfig: DbConfig, query: string) =>
    ipcRenderer.invoke("executeSql", { dbConfig, query }),
  fetchDbSchema: (dbConfig: DbConfig) =>
    ipcRenderer.invoke("fetchDbSchema", dbConfig),
  saveChats: (chats: Chat[]) => ipcRenderer.invoke("saveChats", chats),
  loadChats: () => ipcRenderer.invoke("loadChats"),
});
