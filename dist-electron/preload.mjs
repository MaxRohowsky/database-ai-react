"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
});
electron.contextBridge.exposeInMainWorld("api", {
  connectToDatabase: (connectionDetails) => electron.ipcRenderer.invoke("connect-to-database", connectionDetails),
  testConnection: (connectionDetails) => electron.ipcRenderer.invoke("test-connection", connectionDetails),
  getSchema: () => electron.ipcRenderer.invoke("get-schema"),
  updateModelConfig: (provider, config) => electron.ipcRenderer.invoke("update-model-config", provider, config),
  getModelConfigs: () => electron.ipcRenderer.invoke("get-model-configs"),
  generateSql: (naturalLanguage, schema, provider) => electron.ipcRenderer.invoke("generate-sql", naturalLanguage, schema, provider),
  executeQuery: (query) => electron.ipcRenderer.invoke("execute-query", query)
});
