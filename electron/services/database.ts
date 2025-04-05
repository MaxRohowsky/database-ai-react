import postgres from 'postgres';


/**
 * Test the database connection
 * @param {Object} config - Database connection config (optional)
 * @returns {Promise<boolean>} Connection status
 */
export async function testConnection(config : ConnectionDetails) {
  try {
    console.log('Testing connection...');

    if (config) {
      const sql = postgres({
        host: config.host,
        port: parseInt(config.port),
        database: config.database,
        username: config.user,
        password: config.password
      });
      await sql`SELECT NOW()`;
      await sql.end();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

