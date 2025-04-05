import postgres from 'postgres';

export interface ConnectionDetails {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

export interface SqlResult {
  columns: string[];
  rows: Record<string, unknown>[];
  error?: string;
}

/**
 * Test the database connection
 * @param {Object} config - Database connection config (optional)
 * @returns {Promise<boolean>} Connection status
 */
export async function testConnection(config : ConnectionDetails) {
  try {
    console.log('Testing connection...');

    if (config) {
      const sql = postgres({
        host: config.host,
        port: parseInt(config.port),
        database: config.database,
        username: config.user,
        password: config.password
      });
      await sql`SELECT NOW()`;
      await sql.end();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

/**
 * Execute a SQL query against the database
 * @param {ConnectionDetails} config - Database connection config
 * @param {string} query - SQL query to execute
 * @returns {Promise<SqlResult>} Query results with columns and rows
 */
export async function executeQuery(config: ConnectionDetails, query: string): Promise<SqlResult> {
  try {
    const sql = postgres({
      host: config.host,
      port: parseInt(config.port),
      database: config.database,
      username: config.user,
      password: config.password
    });
    
    const result = await sql.unsafe(query);
    await sql.end();
    
    // Extract column names from the first result
    const columns = result.length > 0 ? Object.keys(result[0]) : [];
    
    return {
      columns,
      rows: result
    };
  } catch (error) {
    console.error('Query execution error:', error);
    return {
      columns: [],
      rows: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

