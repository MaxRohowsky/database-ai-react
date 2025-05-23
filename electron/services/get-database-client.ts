/* Factory function to create a database client */

import { PostgresAdapter } from "./postgres-adapter";

export function getDatabaseClient(config: DbConfig): DbAdapter {
  switch (config.engine) {
    case "postgres":
      return new PostgresAdapter(config);
    /*     case "supabase":
          return null; */
    default:
      throw new Error(`Unsupported database engine: ${config.engine}`);
  }
}
