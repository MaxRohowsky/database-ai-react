// Database service for connecting to PostgreSQL databases and executing queries

interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
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

// Connect to a specific database
export const connectToDatabase = async (config: ConnectionConfig): Promise<boolean> => {
  try {
    return await window.api.connectToDatabase(config);
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

// Test a database connection
export const testConnection = async (config: ConnectionConfig): Promise<boolean> => {
  try {
    return await window.api.testConnection(config);
  } catch (error) {
    console.error('Test connection error:', error);
    throw error;
  }
};

// Get the database schema
export const getDatabaseSchema = async (): Promise<Schema> => {
  try {
    return await window.api.getSchema();
  } catch (error) {
    console.error('Error fetching schema:', error);
    throw error;
  }
};

// Execute a SQL query
export const executeQuery = async (query: string) => {
  try {
    return await window.api.executeQuery(query);
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}; 