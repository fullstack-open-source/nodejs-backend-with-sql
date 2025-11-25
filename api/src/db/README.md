# PostgreSQL Database Connector

A simplified PostgreSQL database connector for Node.js backend.

## Schema Management with Prisma

This project uses **Prisma** for schema management instead of traditional migrations. Prisma allows you to:
- **Pull schema** from remote/production database
- **Push schema** to local/development database  
- **Auto-generate** type-safe Prisma Client

### Quick Start

```bash
# Pull schema from remote database
npm run db:pull

# Push schema to local database
npm run db:push

# Sync (pull + push)
npm run db:sync

# Generate Prisma Client
npm run prisma:generate

# Open Prisma Studio (visual DB browser)
npm run prisma:studio
```

For detailed Prisma documentation, see [prisma/README.md](../../prisma/README.md).

## Configuration

Set the PostgreSQL connection string in your `.env` file:

```env
# Option 1: Use connection string
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Option 2: Use individual components
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=dbname
DATABASE_USER=user
DATABASE_PASSWORD=password

# IMPORTANT: For Supabase or connection poolers, use DIRECT connection in DATABASE_URL
# Pooler connections (port 6543) don't support prepared statements required by Prisma migrations
# Use direct connection (port 5432) instead

# Optional PostgreSQL settings
DATABASE_SSL=false
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=10000
```

## Supabase & Connection Pooler Configuration

### Issue: Prepared Statement Error with Poolers

If you're using **Supabase** or other connection poolers (like PgBouncer), you may encounter this error when running migrations:

```
ERROR: prepared statement "s1" already exists
```

This happens because:
- Connection poolers don't support prepared statements
- Prisma migrations require prepared statements
- Pooler connections reuse statement names causing conflicts

### Solution: Use Direct Connection in DATABASE_URL

**For Supabase:**

1. **Get your direct connection URL** (not pooler):
   - Go to Supabase Dashboard → Project Settings → Database
   - Use the **Connection string** under "Connection pooling" → "Direct connection"
   - It should use port **5432** (not 6543 for pooler)

2. **Update your `.env` file:**
   ```env
   # Use DIRECT connection (required for Prisma migrations)
   # Port 5432 for direct connection, NOT 6543 for pooler
   DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
   ```

3. **For other poolers:**
   - Use the direct database connection URL (bypassing the pooler)
   - Update `DATABASE_URL` to point directly to your PostgreSQL instance

**Note:** 
- Use **direct connection** (port 5432) in `DATABASE_URL` for Prisma to work
- Pooler connections (port 6543) will cause migration failures
- Direct connection works for both runtime and migrations

## Usage

### Basic Usage

```javascript
const db = require('./src/db');

// Initialize connection (automatic on first use)
await db.connect();

// Query
const result = await db.query('SELECT * FROM "user" WHERE user_id = $1', [userId]);
console.log('User:', result.rows[0]);

// Insert
const result = await db.query(
  `INSERT INTO "user" (email, first_name, password) 
   VALUES ($1, $2, $3) 
   RETURNING user_id, email`,
  ['user@example.com', 'John', 'hashed_password']
);

// Update
const result = await db.query(
  `UPDATE "user" 
   SET first_name = $1, last_updated = CURRENT_TIMESTAMP 
   WHERE user_id = $2 
   RETURNING *`,
  ['Jane', userId]
);

// Delete
const result = await db.query(
  `DELETE FROM "user" WHERE user_id = $1 RETURNING *`,
  [userId]
);

// Transaction
await db.transaction(async (client) => {
  const userResult = await client.query(
    `INSERT INTO "user" (email, first_name, password) 
     VALUES ($1, $2, $3) 
     RETURNING user_id`,
    ['user@example.com', 'John', 'hashed_password']
  );
  
  const userId = userResult.rows[0].user_id;
  
  await client.query(
    `INSERT INTO wallet (user_id, balance_credits) 
     VALUES ($1, $2)`,
    [userId, 0]
  );
});
```

## Database Operations

### Query

Execute SQL queries with parameterized values:

```javascript
const result = await db.query('SELECT * FROM "user" WHERE email = $1', ['user@example.com']);
// result.rows - array of result rows
// result.rowCount - number of rows affected
// result.command - SQL command type
```

### Transaction

Execute multiple queries in a transaction:

```javascript
await db.transaction(async (client) => {
  // Use client.query() instead of db.query()
  await client.query('INSERT INTO ...');
  await client.query('UPDATE ...');
  // If any query fails, all will be rolled back
});
```

### Get Raw Connection

For advanced operations, get the raw PostgreSQL pool:

```javascript
const connection = await db.getRawConnection();
const client = await connection.getClient();
// Use client for advanced operations
client.release(); // Don't forget to release!
```

## Connection Pooling

The connector uses PostgreSQL connection pooling for optimal performance:

- **Max connections**: `DB_POOL_MAX` (default: 20)
- **Idle timeout**: `DB_POOL_IDLE_TIMEOUT` (default: 30000ms)
- **Connection timeout**: `DB_POOL_CONNECTION_TIMEOUT` (default: 2000ms)

## Error Handling

All database operations include error handling and logging:

```javascript
try {
  const result = await db.query('SELECT * FROM "user"');
} catch (error) {
  logger.error('Database query failed', { error: error.message });
  // Handle error
}
```

## Best Practices

1. **Always use parameterized queries** - Prevents SQL injection
2. **Use transactions** - For multi-step operations
3. **Handle errors** - Wrap database calls in try-catch
4. **Release connections** - When using raw clients, always release them
5. **Use connection pooling** - The pool handles connection management automatically

## Examples

See `src/db/examples.js` for more usage examples.
