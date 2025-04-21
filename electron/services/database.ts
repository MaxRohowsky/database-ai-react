/* Public API with common database operations*/

import { getDatabaseClient } from "./get-database-client";

export async function testDbConnection(config: DbConfig): Promise<boolean> {
  try {
    const client = getDatabaseClient(config);
    const result = await client.testDbConnection();

    return result;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}

export async function executeSql(
  config: DbConfig,
  query: string,
): Promise<SqlResult> {
  try {
    const client = getDatabaseClient(config);
    return await client.executeSql(query);
  } catch (error) {
    console.error("Query execution error:", error);
    return {
      rows: [],
      columns: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function fetchDbSchema(
  config: DbConfig,
): Promise<{ schema: string | undefined; error?: string }> {
  try {
    const client = getDatabaseClient(config);
    return await client.fetchDbSchema();
  } catch (error) {
    console.error("Schema fetch error:", error);
    return {
      schema: undefined,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
