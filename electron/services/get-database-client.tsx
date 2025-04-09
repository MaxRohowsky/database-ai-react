import { MySQLAdapter } from "./mysql-adapter";
import { PostgresAdapter } from "./postgres-adapter";

export function getDatabaseClient(config: ConnectionDetails): DatabaseAdapter {
  switch (config.engine) {
    case "postgres":
      return new PostgresAdapter(config);
    case "mysql":
      return new MySQLAdapter(config);
    default:
      throw new Error(`Unsupported database engine: ${config.engine}`);
  }
}
