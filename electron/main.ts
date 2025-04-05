import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Client from 'pg'
import { Configuration, OpenAIApi } from 'openai'
import dotenv from 'dotenv'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))


// Global variables

let pgClient: Client | null = null;
let aiConfigs = {
  openai: {
    apiKey: null,
    model: 'gpt-3.5-turbo',
  },
  claude: {
    apiKey: null,
    model: 'claude-3-opus-20240229',
  },
};


// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let mainWindow: BrowserWindow | null

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Test active push message to Renderer-process.
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    mainWindow = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)


// ----------------------------------------------------------------------------------------







/* // Create the main window
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In development mode, load from the Vite dev server
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:5173/');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from the build files
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// Initialize the app
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); */

// Connect to database
ipcMain.handle('connect-to-database', async (event, connectionDetails) => {
  try {
    // Close existing connection if any
    if (pgClient) {
      await pgClient.end();
    }

    // Create a new client
    pgClient = new Client(connectionDetails);
    await pgClient.connect();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
});

// Test database connection
ipcMain.handle('test-connection', async (event, connectionDetails) => {
  try {
    const testClient = new Client(connectionDetails);
    await testClient.connect();
    await testClient.end();
    return true;
  } catch (error) {
    console.error('Test connection error:', error);
    return false;
  }
});

// Get database schema
ipcMain.handle('get-schema', async () => {
  try {
    if (!pgClient) {
      throw new Error('Not connected to database');
    }

    // Query to get all tables and their columns
    const query = `
      SELECT 
        t.table_name, 
        c.column_name, 
        c.data_type,
        c.is_nullable,
        c.column_default,
        tc.constraint_type
      FROM 
        information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        LEFT JOIN information_schema.key_column_usage kcu ON c.column_name = kcu.column_name AND c.table_name = kcu.table_name
        LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
      WHERE 
        t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY 
        t.table_name, 
        c.ordinal_position;
    `;

    const result = await pgClient.query(query);

    // Transform the result into a schema object
    const schema = {};
    result.rows.forEach((row) => {
      if (!schema[row.table_name]) {
        schema[row.table_name] = [];
      }

      schema[row.table_name].push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default,
        constraint: row.constraint_type || null,
      });
    });

    return schema;
  } catch (error) {
    console.error('Error getting schema:', error);
    throw error;
  }
});

// Update AI model configuration
ipcMain.handle('update-model-config', async (event, provider, config) => {
  try {
    aiConfigs[provider] = config;
    return true;
  } catch (error) {
    console.error(`Error updating ${provider} config:`, error);
    return false;
  }
});

// Generate SQL from natural language
ipcMain.handle('generate-sql', async (event, naturalLanguage, schema, provider) => {
  try {
    // Check if provider is configured
    if (!aiConfigs[provider] || !aiConfigs[provider].apiKey) {
      throw new Error(`${provider} API key not configured`);
    }

    // Format schema as a string for the AI
    let schemaText = '';
    Object.keys(schema).forEach((tableName) => {
      schemaText += `Table: ${tableName}\nColumns:\n`;
      schema[tableName].forEach((column) => {
        schemaText += `- ${column.name} (${column.type})${
          column.constraint ? ` ${column.constraint}` : ''
        }\n`;
      });
      schemaText += '\n';
    });

    // Generate SQL based on provider
    let sqlQuery;
    if (provider === 'openai') {
      sqlQuery = await generateSqlWithOpenAI(naturalLanguage, schemaText);
    } else if (provider === 'claude') {
      sqlQuery = await generateSqlWithClaude(naturalLanguage, schemaText);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    return sqlQuery;
  } catch (error) {
    console.error('SQL generation error:', error);
    throw error;
  }
});

// Get model configurations (hiding API keys)
ipcMain.handle('get-model-configs', async () => {
  try {
    return {
      openai: {
        model: aiConfigs.openai.model,
        hasApiKey: !!aiConfigs.openai.apiKey
      },
      claude: {
        model: aiConfigs.claude.model,
        hasApiKey: !!aiConfigs.claude.apiKey
      }
    };
  } catch (error) {
    console.error('Error getting model configs:', error);
    throw error;
  }
});

// Execute SQL query
ipcMain.handle('execute-query', async (event, query) => {
  try {
    if (!pgClient) {
      throw new Error('Not connected to database');
    }

    const result = await pgClient.query(query);
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
});

// Generate SQL with OpenAI
async function generateSqlWithOpenAI(naturalLanguage, schemaText) {
  try {
    const configuration = new Configuration({
      apiKey: aiConfigs.openai.apiKey,
    });
    const openai = new OpenAIApi(configuration);

    const completion = await openai.createChatCompletion({
      model: aiConfigs.openai.model,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that translates natural language into SQL queries. Given the schema information and a natural language question, write a valid SQL query that would answer the question. Only return the SQL query, no explanations.',
        },
        {
          role: 'user',
          content: `Database Schema:\n${schemaText}\n\nQuestion: ${naturalLanguage}\n\nSQL Query:`,
        },
      ],
    });

    return completion.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// Generate SQL with Claude
async function generateSqlWithClaude(naturalLanguage, schemaText) {
  try {
    // Implementation for Claude API
    // This is a placeholder and needs to be implemented with Anthropic's Claude API
    throw new Error('Claude API integration not implemented yet');
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}