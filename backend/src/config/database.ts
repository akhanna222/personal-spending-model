import { Pool, PoolConfig } from 'pg';

const config: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'spendlens',
  user: process.env.DB_USER || 'spendlens_user',
  password: process.env.DB_PASSWORD || 'spendlens_password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create a connection pool
export const pool = new Pool(config);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

// Helper function to test connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

// Helper function to run migrations
export async function runMigrations(): Promise<void> {
  // This would be called during setup to ensure schema is created
  console.log('📋 Migrations would run here (use schema.sql)');
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('🔌 Database pool closed');
}

export default pool;
