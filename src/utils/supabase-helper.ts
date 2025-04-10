/**
 * Helper utility for Supabase database connections
 */

/**
 * Validates a Supabase connection configuration
 * @param host Hostname for Supabase connection
 * @param port Port number
 * @param user Username (should be postgres or postgres.projectref)
 * @param database Database name (usually postgres)
 * @returns Object with validation result and errors if any
 */
export function validateSupabaseConnection(
    host: string,
    port: string,
    user: string,
    database: string
): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if it's a Supabase host
    const isSupabaseDirect = host.includes('supabase.co');
    const isSupabasePooler = host.includes('pooler.supabase.com');

    if (!isSupabaseDirect && !isSupabasePooler) {
        return { isValid: true, errors: [] }; // Not a Supabase connection
    }

    // Validate host
    if (isSupabaseDirect) {
        // Direct connection should be in format db.project-ref.supabase.co
        if (!host.startsWith('db.')) {
            errors.push('Direct Supabase connections should start with "db."');
        }
    } else if (isSupabasePooler) {
        // Pooler connection should be in format aws-0-region.pooler.supabase.com
        if (!host.includes('aws-')) {
            errors.push('Supabase pooler connections should include region (aws-0-region)');
        }
    }

    // Validate port
    if (isSupabasePooler) {
        if (port === '5432') {
            // Session mode
        } else if (port === '6543') {
            // Transaction mode
        } else {
            errors.push('Supabase pooler connections use port 5432 (session mode) or 6543 (transaction mode)');
        }
    } else if (isSupabaseDirect && port !== '5432') {
        errors.push('Supabase direct connections use port 5432');
    }

    // Validate username
    if (isSupabaseDirect) {
        if (user !== 'postgres') {
            errors.push('For direct connections, username should be "postgres"');
        }
    } else if (isSupabasePooler && !user.startsWith('postgres.')) {
        errors.push('For pooler connections, username should be "postgres.your-project-ref"');
    }

    // Validate database
    if (database !== 'postgres') {
        errors.push('Supabase database name should be "postgres"');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Extracts the project reference from a Supabase connection
 * @param host Hostname for connection
 * @returns The project reference or null if not found
 */
export function extractSupabaseProjectRef(host: string): string | null {
    // For direct connection (db.project-ref.supabase.co)
    if (host.includes('supabase.co')) {
        const match = host.match(/db\.([a-z0-9]+)\.supabase\.co/);
        if (match && match[1]) {
            return match[1];
        }
    }

    // For pooler connection, try to extract from username
    return null;
}

/**
 * Creates correct Supabase connection details based on the connection type
 * @param projectRef Supabase project reference
 * @param password Database password
 * @param usePooler Whether to use connection pooler
 * @param poolerMode 'session' or 'transaction'
 * @param region AWS region (default: eu-central-1)
 * @returns Connection details object
 */
export function createSupabaseConnectionDetails(
    projectRef: string,
    password: string,
    usePooler: boolean = true,
    poolerMode: 'session' | 'transaction' = 'transaction',
    region: string = 'eu-central-1'
): Partial<ConnectionDetails> {
    // Clean any special characters from the project reference
    const cleanProjectRef = projectRef.trim().toLowerCase();

    // Add SSL flag for all Supabase connections
    const extraConfig: { ssl?: boolean } = {
        ssl: true
    };

    if (usePooler) {
        // Pooler connection
        return {
            name: `Supabase-${cleanProjectRef}-${poolerMode}`,
            engine: 'postgres',
            host: `aws-0-${region}.pooler.supabase.com`,
            port: poolerMode === 'session' ? '5432' : '6543',
            database: 'postgres',
            user: `postgres.${cleanProjectRef}`,
            password,
            ...extraConfig
        };
    } else {
        // Direct connection
        return {
            name: `Supabase-${cleanProjectRef}-direct`,
            engine: 'postgres',
            host: `db.${cleanProjectRef}.supabase.co`,
            port: '5432',
            database: 'postgres',
            user: 'postgres',
            password,
            ...extraConfig
        };
    }
} 