import { PostgresAdapter } from "./postgres-adapter";
/* import { SupabaseAdapter } from "./supabase-adapter"; */

export function getDatabaseClient(config: ConnectionDetails): DatabaseAdapter {
  switch (config.engine) {
    case "postgres":
      return new PostgresAdapter(config);
    /*     case "supabase":
          return null; */
    default:
      throw new Error(`Unsupported database engine: ${config.engine}`);
  }
}
