/**
 * Build connection string from individual components or use provided URL
 * @returns {string} PostgreSQL connection string
 */
function buildConnectionString() {
  // If DATABASE_URL is provided, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Build from individual components
  const host = process.env.DATABASE_HOST || 'nodejs-backend-db';
  const port = process.env.DATABASE_PORT || 5432;
  const database = process.env.DATABASE_NAME || 'postgres';
  const user = process.env.DATABASE_USER || 'postgres';
  const password = process.env.DATABASE_PASSWORD || 'postgres';

  // URL encode password to handle special characters
  const encodedPassword = encodeURIComponent(password);

  return `postgresql://${user}:${encodedPassword}@${host}:${port}/${database}?sslmode=require`;
}

/**
 * Get connection string with validation and warnings
 * For Supabase: Automatically detects pooler and suggests direct connection
 * @returns {string} PostgreSQL connection string
 */
function getConnectionString() {
  const connectionString = buildConnectionString();
  return connectionString;
}

module.exports = {
  buildConnectionString,
  getConnectionString
};

