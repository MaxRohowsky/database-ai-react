import { getDatabaseClient } from './get-database-client';



export interface SqlResult {
  columns: string[];
  rows: Record<string, unknown>[];
  affectedRows?: number;
  error?: string;
}



export async function testConnection(config: ConnectionDetails): Promise<boolean> {
  try {
    const client = getDatabaseClient(config);
    const result = await client.testConnection();

    return result;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export async function executeQuery(config: ConnectionDetails, query: string): Promise<SqlResult> {
  try {
    const client = getDatabaseClient(config);
    return await client.executeQuery(query);
  } catch (error) {
    console.error('Query execution error:', error);
    return {
      rows: [],
      columns: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function fetchDatabaseSchema(config: ConnectionDetails) {
  try {
    const client = getDatabaseClient(config);
    return await client.fetchDatabaseSchema();
  } catch (error) {
    console.error('Schema fetch error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

