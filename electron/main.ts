import { app, BrowserWindow, ipcMain } from "electron";
/* import { createRequire } from 'node:module' */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateSql } from "./services/ai";
import {
  executeSql,
  fetchDbSchema,
  testDbConnection,
} from "./services/database";

/* const require = createRequire(import.meta.url) */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

//--------------------------------
// Create IPC Handlers
//--------------------------------

// Path to store chat history
const userDataPath = app.getPath("userData");
const chatHistoryPath = path.join(userDataPath, "chat-history.json");

function setupIPC() {
  ipcMain.handle("testDbConnection", async (_, config) => {
    try {
      return await testDbConnection(config);
    } catch (error) {
      console.error("Connection test error:", error);
      throw new Error(
        `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  });

  ipcMain.handle(
    "generateSql",
    async (_, { aiSelection, apiKey, prompt, dbSchema }) => {
      try {
        return await generateSql(aiSelection, apiKey, prompt, dbSchema);
      } catch (error) {
        console.error("SQL generation error:", error);
        throw new Error(
          `SQL generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
  );

  ipcMain.handle("executeSql", async (_, { dbConfig, query }) => {
    try {
      return await executeSql(dbConfig, query);
    } catch (error) {
      console.error("SQL execution error:", error);
      throw new Error(
        `SQL execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  });

  // Save chats to file system
  ipcMain.handle("saveChats", async (_, chats) => {
    try {
      fs.writeFileSync(
        chatHistoryPath,
        JSON.stringify(chats, null, 2),
        "utf-8",
      );
      return { success: true };
    } catch (error) {
      console.error("Error saving chats:", error);
      throw new Error(
        `Failed to save chats: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  });

  // Load chats from file system
  ipcMain.handle("loadChats", async () => {
    try {
      if (fs.existsSync(chatHistoryPath)) {
        const chatsData = fs.readFileSync(chatHistoryPath, "utf-8");
        return JSON.parse(chatsData);
      }
      return [];
    } catch (error) {
      console.error("Error loading chats:", error);
      throw new Error(
        `Failed to load chats: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  });

  ipcMain.handle("fetchDbSchema", async (_, dbConfig) => {
    try {
      return await fetchDbSchema(dbConfig);
    } catch (error) {
      console.error("Schema fetch error:", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error fetching database schema",
      };
    }
  });
}

//--------------------------------
// Create a Window
//--------------------------------

const createWindow = () => {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
};

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  setupIPC();
  createWindow();
});
