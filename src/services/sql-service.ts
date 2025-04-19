/**
 * Generates SQL using AI
 * @param query - The user's query
 * @param aiConfig - The AI configuration
 * @param dbSchema - The database schema
 * @returns The generated SQL
 */
export async function generateSql(
  aiModelSelection: AiModelSelection,
  apiKey: string,
  prompt: string,
  dbSchema?: DbSchemaResponse["schema"],
): Promise<SqlGenerationResponse> {
  try {
    const response = await window.electronAPI.generateSql(
      aiModelSelection,
      apiKey,
      prompt,
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
export async function executeSql(
  sql: string,
  dbConfig: DbConfig,
): Promise<SqlExecutionResponse> {
  try {
    if (!dbConfig) {
      throw new Error("Database configuration not found");
    }

    const result = await window.electronAPI.executeSql(dbConfig, sql);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      columns: result.columns || [],
      rows: result.rows || [],
      affectedRows: result.affectedRows,
    };
  } catch (error) {
    console.error("SQL execution error:", error);
    return {
      columns: [],
      rows: [],
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
export async function fetchDbSchema(
  dbConfig: DbConfig,
): Promise<DbSchemaResponse> {
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
