import postgres from "postgres";
import { buildSchemaMap, formatSchemaString, isUpdateQuery } from "./utils";

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

export class PostgresAdapter implements DbAdapter {
  private connection: postgres.Sql;

  constructor(config: DbConfig) {
    this.connection = postgres({
      host: config.host,
      port: parseInt(config.port),
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.certFile
        ? {
            ca: config.certFile,
          }
        : false,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  async testDbConnection(): Promise<boolean> {
    try {
      await this.connection`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  async executeSql(query: string): Promise<SqlResult> {
    try {
      const result = await this.connection.unsafe(query);

      const isUpdate = isUpdateQuery(query);

      const affectedRows = isUpdate ? result.length : undefined;

      const columns = result.length > 0 ? Object.keys(result[0]) : [];

      return {
        rows: result,
        columns,
        affectedRows,
      };
    } catch (error) {
      return {
        rows: [],
        columns: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async fetchDbSchema(): Promise<{
    schema: string | undefined;
    error?: string;
  }> {
    try {
      const schemaRows = await this.connection.unsafe(schemaQuery);

      const tableStructure = buildSchemaMap(schemaRows);

      const formattedSchemaText = formatSchemaString(tableStructure);

      return {
        schema: formattedSchemaText,
      };
    } catch (error) {
      console.error("PostgreSQL schema fetch error:", error);
      return {
        schema: undefined,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
