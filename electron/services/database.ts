import { getDatabaseClient } from './get-database-client';

// Extended ConnectionDetails interface to support SSL
interface ExtendedConnectionDetails extends ConnectionDetails {
  ssl?: boolean;
  sslCertificate?: string;
}

export interface SqlResult {
  columns: string[];
  rows: Record<string, unknown>[];
  affectedRows?: number;
  error?: string;
}

// Define an interface for errors that may have a code property
interface ErrorWithCode extends Error {
  code?: string | number;
}

export async function testConnection(config: ConnectionDetails): Promise<boolean> {
  try {
    console.log('Testing connection with config:', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      hasPassword: !!config.password,
      hasSSL: !!(config as ExtendedConnectionDetails).ssl,
      hasCertificate: !!(config as ExtendedConnectionDetails).sslCertificate
    });

    // Check for Supabase connections and auto-enable SSL
    const isSupabase =
      config.host.includes('supabase.co') ||
      config.host.includes('pooler.supabase.com');

    if (isSupabase && !(config as ExtendedConnectionDetails).ssl) {
      console.log('Auto-enabling SSL for Supabase connection');
      (config as ExtendedConnectionDetails).ssl = true;
    }

    const client = getDatabaseClient(config);
    const result = await client.testConnection();

    if (result) {
      console.log('Connection successful!');
    } else {
      console.error('Connection failed without throwing an error');
    }

    return result;
  } catch (error) {
    console.error('Database connection test failed:', error);
    if (error instanceof Error) {
      // Log detailed error information for debugging
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      if ('code' in error) {
        console.error('Error code:', (error as ErrorWithCode).code);
      }
      if ('stack' in error) {
        console.error('Error stack:', error.stack);
      }
    }
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

