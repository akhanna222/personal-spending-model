import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import routes from './routes/index.db';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    abortOnLimit: true,
    useTempFiles: false,
  })
);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Failed to connect to database');
      console.error('   Run: ./setup-database.sh to setup PostgreSQL');
      process.exit(1);
    }

    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🏦 SpendLens API Server');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log(`✅ Server running:     http://localhost:${PORT}`);
      console.log(`✅ Health check:       http://localhost:${PORT}/health`);
      console.log(`✅ Database:           Connected to PostgreSQL`);
      console.log(`✅ OpenAI API:         ${process.env.OPENAI_API_KEY ? 'Configured' : '⚠️  NOT SET'}`);
      console.log(`✅ JWT Secret:         ${process.env.JWT_SECRET ? 'Configured' : '⚠️  NOT SET'}`);
      console.log('');
      console.log('API Endpoints:');
      console.log('  • POST   /api/auth/signup         - Register new user');
      console.log('  • POST   /api/auth/signin         - Login user');
      console.log('  • POST   /api/upload              - Upload bank statement');
      console.log('  • GET    /api/transactions        - Get transactions');
      console.log('  • GET    /api/statements          - Get statements');
      console.log('  • GET    /api/risks/patterns      - Get risk patterns');
      console.log('  • POST   /api/risks/analyze       - Analyze risks');
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️  WARNING: OPENAI_API_KEY not set in .env file');
        console.warn('   AI features (transaction extraction, risk analysis) will not work.');
        console.warn('');
      }

      if (!process.env.JWT_SECRET) {
        console.warn('⚠️  WARNING: JWT_SECRET not set in .env file');
        console.warn('   Using default secret (NOT SECURE for production)');
        console.warn('');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
