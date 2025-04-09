import mysql from 'mysql2/promise';

export class MySQLAdapter implements DatabaseAdapter {
    private config: ConnectionDetails;

    constructor(config: ConnectionDetails) {
        this.config = config;
    }

    private async getConnection() {
        return await mysql.createConnection({
            host: this.config.host,
            port: parseInt(this.config.port),
            database: this.config.database,
            user: this.config.user,
            password: this.config.password
        });
    }

    async testConnection(): Promise<boolean> {
        let connection;
        try {
            console.log('Testing MySQL connection...');
            connection = await this.getConnection();
            await connection.execute('SELECT 1');
            console.log('MySQL connection test successful!');
            return true;
        } catch (error) {
            console.error('MySQL connection test failed:', error);
            return false;
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }

    async executeQuery(query: string): Promise<SqlResult> {
        let connection;
        try {
            connection = await this.getConnection();
            const [rows, fields] = await connection.execute(query);

            // Check if this is a modification query
            const isModification = /^\s*(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|TRUNCATE)/i.test(query.trim());
            let affectedRows;

            if (isModification && !Array.isArray(rows)) {
                affectedRows = rows.affectedRows;
            }

            // Get column names
            const columns = fields ? fields.map(field => field.name) : [];

            return {
                rows: Array.isArray(rows) ? rows : [],
                columns,
                affectedRows,
            };
        } catch (error) {
            console.error('MySQL query execution error:', error);
            return {
                rows: [],
                columns: [],
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }

    async fetchDatabaseSchema(): Promise<{ schema: string | undefined, error?: string }> {
        let connection;
        try {
            connection = await this.getConnection();

            // Query to get tables, columns, and their types for MySQL
            const schemaQuery = `
                SELECT 
                    TABLE_SCHEMA,
                    TABLE_NAME,
                    COLUMN_NAME,
                    DATA_TYPE,
                    IS_NULLABLE,
                    COLUMN_DEFAULT
                FROM 
                    INFORMATION_SCHEMA.COLUMNS
                WHERE 
                    TABLE_SCHEMA = ?
                ORDER BY 
                    TABLE_SCHEMA,
                    TABLE_NAME,
                    ORDINAL_POSITION;
            `;

            const [result] = await connection.execute(schemaQuery, [this.config.database]);

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

            for (const row of result as any[]) {
                const tableKey = `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`;
                if (!tables[tableKey]) {
                    tables[tableKey] = {
                        schema: row.TABLE_SCHEMA,
                        name: row.TABLE_NAME,
                        columns: []
                    };
                }

                tables[tableKey].columns.push({
                    name: row.COLUMN_NAME,
                    type: row.DATA_TYPE,
                    nullable: row.IS_NULLABLE === 'YES',
                    default: row.COLUMN_DEFAULT
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
            console.error('MySQL schema fetch error:', error);
            return {
                schema: undefined,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        } finally {
            if (connection) {
                await connection.end();
            }
        }
    }
}