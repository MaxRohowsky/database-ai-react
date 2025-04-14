import postgres from 'postgres';
import { SqlResult } from './database';



export class PostgresAdapter implements DatabaseAdapter {
    private connection: postgres.Sql;

    constructor(config: ConnectionDetails) {
        this.connection = postgres({
            host: config.host,
            port: parseInt(config.port),
            database: config.database,
            user: config.user,
            password: config.password,
            ssl: config.certFile ? {
                ca: config.certFile,
            } : false,
            idle_timeout: 20,
            connect_timeout: 10,
        });
    }

    async testConnection(): Promise<boolean> {
        try {
            console.log('Testing PostgreSQL connection...');
            await this.connection`SELECT 1`;
            console.log('PostgreSQL connection test successful!');
            return true;
        } catch (error) {
            console.error('PostgreSQL connection test failed:', error);
            return false;
        }
    }

    async executeQuery(query: string): Promise<SqlResult> {
        try {
            const result = await this.connection.unsafe(query);

            // Check if this is a modification query
            const isModification = /^\s*(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|TRUNCATE)/i.test(query.trim());
            let affectedRows;

            // For modification queries, rowCount may represent affected rows
            if (isModification && Array.isArray(result) && result.length === 0) {
                // Try to get the count of affected rows from the result
                if (result.count !== undefined) {
                    affectedRows = result.count;
                } else if (result.command && /\d+/.test(result.command)) {
                    const match = result.command.match(/\d+/);
                    if (match) {
                        affectedRows = parseInt(match[0], 10);
                    }
                }
            }

            // Get column names from the first result
            const columns = result.length > 0 ? Object.keys(result[0]) : [];

            return {
                rows: result,
                columns,
                affectedRows,
            };
        } catch (error) {
            console.error('PostgreSQL query execution error:', error);
            return {
                rows: [],
                columns: [],
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async fetchDatabaseSchema(): Promise<{ schema: string | undefined, error?: string }> {
        try {
            // Query to get tables, columns, and their types for PostgreSQL
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

            const result = await this.connection.unsafe(schemaQuery);

            // Define types for our schema data structure
            interface Column {
                name: string;
                type: string;
                nullable: boolean;
                default: string | null;
            }

            interface Table {
                schema: string;
                name: string;
                columns: Column[];
            }

            // Format schema information
            const tables: Record<string, Table> = {};

            for (const row of result) {
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

            // Format as string for the AI model
            let schemaString = "Database Schema:\n\n";

            for (const tableKey in tables) {
                const table = tables[tableKey];
                schemaString += `Table: ${table.schema}.${table.name}\n`;
                schemaString += `Columns:\n`;

                for (const column of table.columns) {
                    schemaString += `  - ${column.name} (${column.type}${column.nullable ? ', nullable' : ''})\n`;
                }

                schemaString += `\n`;
            }

            return {
                schema: schemaString
            };
        } catch (error) {
            console.error('PostgreSQL schema fetch error:', error);
            return {
                schema: undefined,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

}