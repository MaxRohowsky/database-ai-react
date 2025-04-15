import { Table } from "electron/types";
import { Row } from "postgres";


export const isUpdateQuery = (query: string): boolean => {
    return /^\s*(UPDATE)/i.test(query.trim());
};



export function buildSchemaMap(rows: Row[]): Record<string, Table> {
    const tables: Record<string, Table> = {};

    for (const row of rows) {
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

    return tables;
}