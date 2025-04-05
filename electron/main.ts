import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { Client } from 'pg'
import { Configuration, OpenAIApi } from 'openai'
import { update } from './update'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Global variables

let pgClient: Client | null = null;
const aiConfigs = {
  openai: {
    apiKey: null,
    model: 'gpt-3.5-turbo',
  },
  claude: {
    apiKey: null,
    model: 'claude-3-opus-20240229',
  },
};

// AI Functions
async function generateSqlWithOpenAI(naturalLanguage: string, schemaText: string): Promise<string> {
  try {
    if (!aiConfigs.openai.apiKey) {
      throw new Error("OpenAI API key not configured");
    }
    
    const configuration = new Configuration({
      apiKey: aiConfigs.openai.apiKey as string,
    });
    const openai = new OpenAIApi(configuration);
    
    const response = await openai.createChatCompletion({
      model: aiConfigs.openai.model,
      messages: [
        { role: "system", content: "You are a SQL expert. Your job is to convert natural language queries into SQL queries based on the database schema provided. Output ONLY the SQL code without any explanations." },
        { role: "user", content: `Database Schema:\n${schemaText}\n\nGenerate SQL for: ${naturalLanguage}` }
      ],
      temperature: 0,
    });
    
    return response.data.choices[0]?.message?.content?.trim() || "-- Failed to generate SQL query";
  } catch (error) {
    console.error('OpenAI SQL generation error:', error);
    throw error;
  }
}

async function generateSqlWithClaude(naturalLanguage: string, schemaText: string): Promise<string> {
  try {
    if (!aiConfigs.claude.apiKey) {
      throw new Error("Claude API key not configured");
    }
    
    console.log(`Generating SQL with Claude using schema: ${schemaText.substring(0, 50)}...`);
    console.log(`Natural language query: ${naturalLanguage}`);
    
    // Implementation depends on which Claude API client is being used
    // This is a placeholder implementation
    throw new Error("Claude API integration not yet implemented");
    
    // Example implementation would look something like:
    /*
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': aiConfigs.claude.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: aiConfigs.claude.model,
        messages: [
          { role: "user", content: `Database Schema:\n${schemaText}\n\nGenerate SQL for: ${naturalLanguage}` }
        ],
        system: "You are a SQL expert. Your job is to convert natural language queries into SQL queries based on the database schema provided. Output ONLY the SQL code without any explanations.",
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    return data.content[0].text.trim() || "-- Failed to generate SQL query";
    */
  } catch (error) {
    console.error('Claude SQL generation error:', error);
    throw error;
  }
}

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

// Register all IPC handlers early
function setupIpcHandlers() {
  console.log('Setting up IPC handlers...');

  // Connect to PostgreSQL database
  ipcMain.handle('connect-to-database', async (event, connectionDetails) => {
    console.log('Handling connect-to-database request', { ...connectionDetails, password: '***' });
    try {
      // Close existing connection if any
      if (pgClient) {
        await pgClient.end();
      }

      // Create a new client
      pgClient = new Client(connectionDetails);
      await pgClient.connect();
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error('Database connection error:', error);
      return false;
    }
  });

  // Test database connection
  ipcMain.handle('test-connection', async (event, connectionDetails) => {
    console.log('Handling test-connection request', { ...connectionDetails, password: '***' });
    try {
      const testClient = new Client(connectionDetails);
      await testClient.connect();
      await testClient.end();
      console.log('Test connection successful');
      return true;
    } catch (error) {
      console.error('Test connection error:', error);
      return false;
    }
  });

  // Get database schema
  ipcMain.handle('get-schema', async () => {
    console.log('Handling get-schema request');
    try {
      if (!pgClient) {
        throw new Error('Not connected to database');
      }

      // Define types for schema
      interface SchemaColumn {
        name: string;
        type: string;
        nullable: boolean;
        default?: string | null;
        constraint: string | null;
      }
      
      type Schema = Record<string, SchemaColumn[]>;

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
      console.log(`Schema query returned data for ${Object.keys(result.rows).length} rows`);

      // Transform the result into a schema object
      const schema: Schema = {};
      
      interface SchemaRow {
        table_name: string;
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
        constraint_type: string | null;
      }
      
      result.rows.forEach((row: SchemaRow) => {
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
    console.log(`Handling update-model-config request for ${provider}`);
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
    console.log(`Handling generate-sql request using ${provider}`);
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
    console.log('Handling get-model-configs request');
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
    console.log('Handling execute-query request');
    try {
      if (!pgClient) {
        throw new Error('Not connected to database');
      }

      const result = await pgClient.query(query);
      console.log(`Query executed successfully with ${result.rowCount} rows returned`);
      return result;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  });

  console.log('All IPC handlers have been setup');
}

// Register all IPC handlers early
setupIpcHandlers();

// Create the browser window after setup
async function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Database AI Assistant',
    icon: path.join(process.env.VITE_PUBLIC || '', 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // win.loadFile(path.join(process.env.DIST, 'index.html'))
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Make all links open with the browser, not with the application
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Apply electron-updater
  update(mainWindow)
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  mainWindow = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (mainWindow) {
    // Focus on the main window if the user tried to open another
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

app.whenReady().then(createWindow)