import { AiModelConfig } from "@/store/ai-config-store";
import { ConnectionDetails } from "@/store/db-connection-store";

/**
 * Generates SQL using AI
 * @param query - The user's query
 * @param aiConfig - The AI configuration
 * @param dbSchema - The database schema
 * @returns The generated SQL
 */
export async function generateSql(
  query: string,
  aiConfig: AiModelConfig,
  dbSchema?: string,
): Promise<{
  sqlQuery: string;
  error?: string;
}> {
  try {
    if (!aiConfig) {
      throw new Error("AI configuration not found");
    }

    const response = await window.electronAPI.generateSQL(
      aiConfig,
      query,
      dbSchema,
    );

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.sqlQuery) {
      throw new Error("No SQL was generated. Please try again.");
    }

    return { sqlQuery: response.sqlQuery };
  } catch (error) {
    console.error("SQL generation error:", error);
    return {
      sqlQuery: "",
      error:
        error instanceof Error
          ? error.message
          : "An error occurred generating SQL",
    };
  }
}

/**
 * Executes a SQL query against the database
 * @param sql - The SQL query to execute
 * @param dbConfig - The database configuration
 * @returns The result of the SQL query
 */
export async function executeSqlQuery(
  sql: string,
  dbConfig: ConnectionDetails,
): Promise<{
  rows?: Record<string, unknown>[];
  columns?: string[];
  affectedRows?: number;
  error?: string;
}> {
  try {
    if (!dbConfig) {
      throw new Error("Database configuration not found");
    }

    const result = await window.electronAPI.executeSQL(dbConfig, sql);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      rows: result.rows || [],
      columns: result.columns || [],
      affectedRows: result.affectedRows,
    };
  } catch (error) {
    console.error("SQL execution error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "An error occurred executing SQL",
    };
  }
}

/**
 * Fetches the database schema
 * @param dbConfig - The database configuration
 * @returns The database schema
 */
export async function fetchDatabaseSchema(
  dbConfig: ConnectionDetails,
): Promise<{
  schema?: string;
  error?: string;
}> {
  try {
    if (!dbConfig) {
      throw new Error("Database configuration not found");
    }

    const result = await window.electronAPI.fetchDbSchema(dbConfig);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      schema: result.schema,
    };
  } catch (error) {
    console.error("Schema fetch error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "An error occurred fetching schema",
    };
  }
}
