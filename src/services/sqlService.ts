import { AiModelConfig } from "@/store/ai-config-store";
import { ConnectionDetails } from "@/store/db-connection-store";

// Function to generate SQL using AI
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

    console.log(
      "Generating SQL with config:",
      JSON.stringify({
        provider: aiConfig.provider,
        model: aiConfig.model,
        apiKeyLength: aiConfig.apiKey ? aiConfig.apiKey.length : 0,
        hasSchema: !!dbSchema,
      }),
    );

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

// Function to execute SQL query against the database
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

    // Make sure all required fields are present
    const requiredFields = ["host", "port", "database", "user"];
    const missingFields = requiredFields.filter(
      (field) => !dbConfig[field as keyof typeof dbConfig],
    );

    if (missingFields.length > 0) {
      throw new Error(
        `Database configuration is incomplete. Missing fields: ${missingFields.join(", ")}`,
      );
    }

    console.log("Executing SQL query:", sql);
    console.log(
      "Database config:",
      JSON.stringify({
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user,
        hasPassword: !!dbConfig.password,
      }),
    );

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

// Function to fetch database schema
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

    console.log("Fetching database schema for context...");
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
