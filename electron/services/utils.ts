import { Row } from "postgres";

export const isUpdateQuery = (query: string): boolean => {
  return /^\s*(UPDATE)/i.test(query.trim());
};

/*
 * Builds a map of tables and their columns from a list of database schema rows.
 *
 * @param rows - Array of schema metadata rows, each containing details about a column.
 *               Example row:
 *               {
 *                 table_schema: "public",
 *                 table_name: "users",
 *                 column_name: "id",
 *                 data_type: "integer",
 *                 is_nullable: "NO",
 *                 column_default: "nextval('users_id_seq'::regclass)"
 *               }
 *
 * @returns A record of tables, indexed by their "schema.table" name, with column details.
 *
 * Example output:
 * {
 *   "public.users": {
 *     schema: "public",
 *     name: "users",
 *     columns: [
 *       { name: "id", type: "integer", nullable: false, default: "nextval('users_id_seq'::regclass)" }
 *     ]
 *   }
 * }
 */
export function buildSchemaMap(rows: Row[]): Record<string, Table> {
  const tables: Record<string, Table> = {};

  for (const row of rows) {
    const tableKey = `${row.table_schema}.${row.table_name}`;
    if (!tables[tableKey]) {
      tables[tableKey] = {
        schema: row.table_schema,
        name: row.table_name,
        columns: [],
      };
    }

    tables[tableKey].columns.push({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === "YES",
      default: row.column_default,
    });
  }

  return tables;
}

/*
 * Formats a database schema map into a human-readable string representation.
 *
 * @param tables - A record of tables, indexed by their "schema.table" name, with column details.
 *                 Example input:
 *                 {
 *                   "public.users": {
 *                     schema: "public",
 *                     name: "users",
 *                     columns: [
 *                       { name: "id", type: "integer", nullable: false, default: "nextval('users_id_seq'::regclass)" },
 *                       { name: "name", type: "varchar", nullable: true, default: null }
 *                     ]
 *                   },
 *                   "public.products": {
 *                     schema: "public",
 *                     name: "products",
 *                     columns: [
 *                       { name: "id", type: "integer", nullable: false, default: "nextval('products_id_seq'::regclass)" },
 *                       { name: "name", type: "varchar", nullable: true, default: null }
 *                     ]
 *                   }
 *                 }
 *
 * @returns A formatted string representing the database schema, with table names and column details.
 *
 * Example output:
 * "Database Schema:\n\n
 * Table: public.users\n
 * Columns:\n
 *   - id (integer, nullable)\n
 *   - name (varchar, nullable)\n
 *
 * Table: public.products\n
 * Columns:\n
 *   - id (integer, nullable)\n
 *   - name (varchar, nullable)\n
 * "
 */
export function formatSchemaString(tables: Record<string, Table>): string {
  let output = "Database Schema:\n\n";

  for (const key in tables) {
    const table = tables[key];
    output += `Table: ${table.schema}.${table.name}\n`;
    output += `Columns:\n`;

    for (const column of table.columns) {
      output += `  - ${column.name} (${column.type}${column.nullable ? ", nullable" : ""})\n`;
    }

    output += `\n`;
  }

  return output;
}
