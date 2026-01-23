import { Pool, PoolConfig } from 'pg';

// Railway, Render, and other platforms provide DATABASE_URL
// For backward compatibility, also support individual env vars (EC2, Docker)
const getDatabaseConfig = (): PoolConfig => {
  if (process.env.DATABASE_URL) {
    console.log('📊 Using DATABASE_URL for database connection');
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }

  // Fall back to individual environment variables
  console.log('📊 Using individual DB_* environment variables');
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'spendlens',
    user: process.env.DB_USER || 'spendlens_user',
    password: process.env.DB_PASSWORD || 'spendlens_password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
};

const config = getDatabaseConfig();

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

    // Provide helpful error messages based on the error
    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
      console.error('');
      console.error('💡 SOLUTION FOR RAILWAY/RENDER:');
      console.error('   1. Add PostgreSQL plugin/service to your project');
      console.error('   2. The DATABASE_URL will be automatically set');
      console.error('   3. Redeploy your application');
      console.error('');
      console.error('💡 SOLUTION FOR DOCKER/EC2:');
      console.error('   Set these environment variables:');
      console.error('   - DB_HOST (e.g., localhost or postgres container name)');
      console.error('   - DB_PORT (default: 5432)');
      console.error('   - DB_NAME (default: spendlens)');
      console.error('   - DB_USER (default: spendlens_user)');
      console.error('   - DB_PASSWORD (required)');
      console.error('');
    }

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
