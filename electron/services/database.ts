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
 * Tests connection to database
 */
export async function testConnection(config: ConnectionDetails): Promise<boolean> {
  let connection;
  try {
    // Log the connection details to debug
    console.log('Testing connection with config:', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      hasPassword: !!config.password
    });

    connection = postgres({
      host: config.host,
      port: parseInt(config.port),
      database: config.database,
      user: config.user,
      password: config.password,
      idle_timeout: 5,
      connect_timeout: 10,
    });

    // Test the connection by executing a simple query
    console.log('Executing test query...');
    await connection`SELECT 1`;
    console.log('Connection test successful!');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Execute a SQL query against the database
 * @param {ConnectionDetails} config - Database connection config
 * @param {string} query - SQL query to execute
 * @returns {Promise<SqlResult>} Query results with columns and rows
 */
export async function executeQuery(config: ConnectionDetails, query: string): Promise<SqlResult> {
  let connection;
  try {
    // Log the connection details to debug
    console.log('Executing query with connection config:', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user
    });

    connection = postgres({
      host: config.host,
      port: parseInt(config.port),
      database: config.database,
      user: config.user,
      password: config.password,
      idle_timeout: 20,
    });

    const result = await connection.unsafe(query);

    // Get column names from the first result
    const columns = result.length > 0 ? Object.keys(result[0]) : [];

    return {
      rows: result,
      columns,
    };
  } catch (error) {
    console.error('Query execution error:', error);
    return {
      rows: [],
      columns: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Fetches database schema information
 */
export async function fetchDatabaseSchema(config: ConnectionDetails) {
  let connection;
  try {
    connection = postgres({
      host: config.host,
      port: parseInt(config.port),
      database: config.database,
      user: config.user,
      password: config.password,
      idle_timeout: 20,
    });

    // Query to get tables, columns, and their types
    const schemaQuery = `
      SELECT 
        table_schema, 
        table_name, 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM 
        information_schema.columns
      WHERE 
        table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY 
        table_schema, 
        table_name, 
        ordinal_position;
    `;

    const result = await connection.unsafe(schemaQuery);

    // Define types for our schema data structure
    interface Column {
      name: string;
      type: string;
      nullable: boolean;
      default: string | null;
    }

    interface Table {
      schema: string;
      name: string;
      columns: Column[];
    }

    // Format schema information
    const tables: Record<string, Table> = {};

    for (const row of result) {
      const tableKey = `${row.table_schema}.${row.table_name}`;
      if (!tables[tableKey]) {
        tables[tableKey] = {
          schema: row.table_schema,
          name: row.table_name,
          columns: []
        };
      }

      tables[tableKey].columns.push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default
      });
    }

    // Format as string for the AI model
    let schemaString = "Database Schema:\n\n";

    for (const tableKey in tables) {
      const table = tables[tableKey];
      schemaString += `Table: ${table.schema}.${table.name}\n`;
      schemaString += `Columns:\n`;

      for (const column of table.columns) {
        schemaString += `  - ${column.name} (${column.type}${column.nullable ? ', nullable' : ''})\n`;
      }

      schemaString += `\n`;
    }

    return {
      schema: schemaString
    };
  } catch (error) {
    console.error('Schema fetch error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

