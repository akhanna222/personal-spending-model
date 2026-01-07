import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import routes from './routes';

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
app.listen(PORT, () => {
  console.log(`SpendLens API server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OPENAI_API_KEY not set. AI enhancement features will not work.');
  }
});
