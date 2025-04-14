import postgres from 'postgres';
import { SqlResult } from './database';
/* import { Client, Pool, ClientConfig } from 'pg'; */

// Supabase known hostnames
const SUPABASE_DOMAINS = ['supabase.co', 'pooler.supabase.com'];

// Interface to extend Error with code property for Postgres errors
interface PostgresError extends Error {
    code?: string;
    errno?: string;
    address?: string;
    port?: number;
}

// Extended connection details interface to include SSL and pool options
interface ExtendedConnectionDetails extends ConnectionDetails {
    ssl?: boolean | { sslCertificate?: string; rejectUnauthorized?: boolean };
    usePool?: boolean;
}

export class PostgresAdapter implements DatabaseAdapter {
    private connection: postgres.Sql;
    private host: string;
    private port: string;
    private user: string;
    private password: string;
    private database: string;
    private ssl: boolean | { sslCertificate?: string; rejectUnauthorized?: boolean };
    private usePool: boolean;

    constructor(config: ExtendedConnectionDetails) {
        this.host = config.host;
        this.port = config.port;
        this.user = config.user;
        this.password = config.password;
        this.database = config.database;
        this.ssl = config.ssl || false;
        this.usePool = config.usePool || false;

        // Check if the host is a Supabase domain
        const isSupabase = SUPABASE_DOMAINS.some(domain => this.host.includes(domain));

        // Check if using transaction pooler (port 6543)
        const isTransactionPooler = this.port === '6543';

        // Increase timeouts for potentially slow connections
        const timeout = 30; // 30 seconds

        // For Supabase, we may need to handle the password differently
        // Strip any special characters or encoding that might interfere with authentication
        let password = this.password;
        if (isSupabase && password) {
            // Remove any leading/trailing whitespace that might have been accidentally copied
            password = password.trim();

            // Handle potential URL encoding issues
            try {
                if (password.includes('%')) {
                    const decoded = decodeURIComponent(password);
                    console.log('Password appears to be URL encoded, decoding it');
                    password = decoded;
                }
            } catch (error) {
                console.warn('Failed to decode password, using as-is');
            }

            console.log(`Using Supabase password (length: ${password.length})`);
        }

        // Connection string approach for more reliable authentication
        let connectionString = '';
        if (isSupabase) {
            // For Supabase, build connection string manually to avoid encoding issues
            connectionString = `postgres://${this.user}:${encodeURIComponent(password)}@${this.host}:${this.port}/${this.database}`;
            console.log(`Using connection string format for Supabase: postgres://${this.user}:***@${this.host}:${this.port}/${this.database}`);

            try {
                this.connection = postgres(connectionString, {
                    ssl: { rejectUnauthorized: false },
                    idle_timeout: timeout,
                    connect_timeout: timeout,
                    keep_alive: 60,
                    max_lifetime: 0,
                    prepare: isTransactionPooler ? false : undefined,
                    // Add debug info for transaction mode
                    transform: isTransactionPooler ? { undefined: null } : undefined
                });
                return;
            } catch (error) {
                console.error('Failed to connect using connection string, falling back to options', error);
                // Fall through to the standard connection approach
            }
        }

        // Define connection options compatible with postgres library
        const connectionOptions: postgres.Options<Record<string, postgres.PostgresType<unknown>>> = {
            host: this.host,
            port: parseInt(this.port),
            database: this.database,
            user: this.user,
            password,
            idle_timeout: timeout,
            connect_timeout: timeout,
            keep_alive: 60, // Keep alive interval in seconds

            // Disable statement cache for more stability with Supabase
            max_lifetime: isSupabase ? 0 : undefined,

            // Disable prepared statements for transaction pooler
            prepare: isTransactionPooler ? false : undefined
        };

        // Add onnotice handler to log database notices
        connectionOptions.onnotice = (notice) => {
            console.log('PostgreSQL notice:', notice);
        };

        // Add debug handler in development
        if (process.env.NODE_ENV === 'development') {
            connectionOptions.debug = (connection, query, params) => {
                console.log('Postgres debug - connection:', connection ? 'active' : 'none');
                console.log('Postgres debug - query:', query);
                console.log('Postgres debug - params:', params);
            };
        }

        // Handle SSL configuration
        if (isSupabase) {
            console.log('Configuring Supabase connection - SSL required');
            // For Supabase, always use SSL with rejectUnauthorized: false
            // This is more reliable than trying to verify certificates
            connectionOptions.ssl = { rejectUnauthorized: false };

            // For transaction pooler, add special configuration
            if (isTransactionPooler) {
                console.log('Using transaction pooler mode');
                // Fix undefined handling for transaction pooler
                connectionOptions.transform = {
                    undefined: null
                };
            }
            // Handle other SSL connections
        } else if (typeof this.ssl === 'object' && this.ssl) {
            // If a certificate was provided
            if (typeof this.ssl === 'object' && 'sslCertificate' in this.ssl && this.ssl.sslCertificate) {
                connectionOptions.ssl = {
                    ca: this.ssl.sslCertificate as string,
                    rejectUnauthorized: true
                };
            } else {
                // For other connections with SSL enabled
                connectionOptions.ssl = true;
            }
        }

        console.log('Creating PostgreSQL connection with options:', {
            host: connectionOptions.host,
            port: connectionOptions.port,
            database: connectionOptions.database,
            user: connectionOptions.user,
            ssl: connectionOptions.ssl ? 'enabled' : 'disabled',
            keep_alive: `${connectionOptions.keep_alive}s`,
            prepare: connectionOptions.prepare
        });

        try {
            this.connection = postgres(connectionOptions);
        } catch (error) {
            console.error('Error creating PostgreSQL connection:', error);
            throw error;
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            console.log('Testing PostgreSQL connection...');
            await this.connection`SELECT 1`;
            // Use a simple query with a short timeout
            console.log('PostgreSQL connection test successful!');
            return true;
        } catch (error) {
            console.error('PostgreSQL connection test failed:', error);

            // Enhance error logging for specific errors
            if (error instanceof Error) {
                const pgError = error as PostgresError;
                if (pgError.code === 'CONNECT_TIMEOUT') {
                    console.error('Connection timeout - check your network/firewall settings');
                } else if (pgError.code === 'SASL_SIGNATURE_MISMATCH') {
                    console.error('Authentication failed - password might be incorrect or database unavailable');
                    console.error('For Supabase, try using the raw password string without any special encoding');
                } else if (pgError.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
                    console.error('SSL certificate validation failed - try disabling certificate validation');
                }
            }

            return false;
        }
    }

    async executeQuery(query: string): Promise<SqlResult> {
        try {


            // Using postgres library
            const result = await this.connection.unsafe(query);

            // Check if this is a modification query
            const isModification = /^\s*(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|TRUNCATE)/i.test(query.trim());
            let affectedRows;

            // For modification queries, try to determine affected rows
            if (isModification && Array.isArray(result) && result.length === 0) {
                if ('count' in result && typeof result.count === 'number') {
                    affectedRows = result.count;
                } else if ('command' in result && typeof result.command === 'string' && /\d+/.test(result.command)) {
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

            let result;

            if (this.connection instanceof Client || this.connection instanceof Pool) {
                const queryResult = await this.connection.query(schemaQuery);
                result = queryResult.rows;
            } else {
                result = await this.connection.unsafe(schemaQuery);
            }

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

    protected async _connect(): Promise<Client | Pool> {
        let connectionOptions: ClientConfig;
        let isSupabase = false;

        try {
            // Check if this is a Supabase connection
            isSupabase = this.host.includes('supabase') ||
                this.host.includes('pooler.supabase.com') ||
                (this.user && this.user.includes('postgres.'));

            // Prepare connection options
            connectionOptions = {
                host: this.host,
                port: parseInt(this.port, 10),
                user: this.user,
                password: this.password,
                database: this.database,
                // Force the SSL option to be a simple boolean or object to satisfy the type system
                ssl: isSupabase ? { rejectUnauthorized: false } : !!this.ssl as boolean,
                statement_timeout: 30000, // 30s timeout for queries
                query_timeout: 30000,
                connectionTimeoutMillis: 10000, // 10s connection timeout
                // Disable statement caching for Supabase to prevent issues
                ...(isSupabase && {
                    max: 5, // Limit max connections for Supabase
                    max_lifetime: 60, // 60s max lifetime for connections
                    idle_timeout: 20, // 20s idle timeout
                }),
            };

            // For Supabase connections, ensure SSL is configured correctly
            if (isSupabase) {
                console.log(`[PostgresAdapter] Detected Supabase connection: ${this.host}`);

                // Make sure the password is clean (no whitespace, URL decoding)
                if (this.password) {
                    // Clean password - trim whitespace and try decoding if it contains URL encoded chars
                    const cleanPassword = this.password.trim();
                    this.password = cleanPassword.includes('%')
                        ? decodeURIComponent(cleanPassword)
                        : cleanPassword;

                    console.log(`[PostgresAdapter] Cleaned password for Supabase: ${this.password.slice(0, 2)}****`);
                }

                // Override SSL settings for Supabase
                connectionOptions.ssl = { rejectUnauthorized: false };

                // Using a connection string can help avoid encoding issues with special characters
                const connectionString = `postgres://${this.user}:${encodeURIComponent(this.password)}@${this.host}:${this.port}/${this.database}?sslmode=require`;

                console.log(`[PostgresAdapter] Using connection string for Supabase (user: ${this.user})`);

                // Create client with connection string instead of separate parameters
                if (this.usePool) {
                    console.log('[PostgresAdapter] Creating connection pool for Supabase');
                    this.connection = new Pool({
                        connectionString,
                        ssl: { rejectUnauthorized: false },
                        max: 5, // Limit max connections for pooler
                        idleTimeoutMillis: 20000, // 20s idle timeout
                        connectionTimeoutMillis: 10000, // 10s connection timeout
                    });
                } else {
                    console.log('[PostgresAdapter] Creating direct client for Supabase');
                    this.connection = new Client({
                        connectionString,
                        ssl: { rejectUnauthorized: false },
                        connectionTimeoutMillis: 10000, // 10s connection timeout
                    });
                }
            } else {
                // For non-Supabase connections, use the original configuration
                if (this.usePool) {
                    this.connection = new Pool(connectionOptions);
                } else {
                    this.connection = new Client(connectionOptions);
                }
            }

            // Connect to database
            if (this.connection instanceof Client) {
                await this.connection.connect();
            } else {
                // For pools, we just need to test connection by querying
                const client = await this.connection.connect();
                client.release();
            }

            return this.connection;
        } catch (error) {
            // Handle specific error types
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[PostgresAdapter] Connection error: ${errorMessage}`);

            if (isSupabase && errorMessage.includes('SASL')) {
                console.error('[PostgresAdapter] SASL authentication error with Supabase. This is likely due to incorrect password encoding.');
                throw new Error(`Authentication failed with Supabase: ${errorMessage}. Please ensure your password is copied directly from the Supabase dashboard.`);
            }

            throw error;
        }
    }

    private createConnectionObject(): Client | Pool {
        // Flag to check if this is likely a Supabase connection
        const isSupabase = SUPABASE_DOMAINS.some(domain =>
            this.host.includes(domain) || (this.user && this.user.includes('supabase'))
        );

        console.log(`Detected database type: ${isSupabase ? 'Supabase' : 'Standard PostgreSQL'}`);

        // If this is a Supabase connection, use specific configuration
        if (isSupabase) {
            console.log('Using Supabase-specific connection settings');

            // For Supabase, we'll use the node-postgres driver for better compatibility
            const connectionString = `postgresql://${this.user}:${encodeURIComponent(this.password)}@${this.host}:${this.port}/${this.database}`;

            const sslConfig = typeof this.ssl === 'boolean' ?
                this.ssl :
                { rejectUnauthorized: this.ssl?.rejectUnauthorized ?? false };

            const config: ClientConfig = {
                connectionString,
                ssl: sslConfig,
                // Use a 10-second connection timeout
                connectionTimeoutMillis: 10000,
            };

            const portNum = parseInt(this.port, 10);
            console.log(`Connection details: ${this.host}:${portNum} (SSL: ${!!this.ssl})`);

            return this.usePool ? new Pool(config) : new Client(config);
        }

        // Default connection for non-Supabase databases
        const config: ClientConfig = {
            host: this.host,
            port: parseInt(this.port, 10),
            user: this.user,
            password: this.password,
            database: this.database,
            ssl: typeof this.ssl === 'boolean' ?
                this.ssl :
                { rejectUnauthorized: this.ssl?.rejectUnauthorized ?? false },
            connectionTimeoutMillis: 10000,
        };

        return this.usePool ? new Pool(config) : new Client(config);
    }
}
