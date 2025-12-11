import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import routes from './routes';
import { validateLLMConfig, getLLMConfig } from './services/llmService';

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
  console.log(`\n🚀 SpendLens API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health\n`);

  // Check LLM configuration
  const llmConfig = getLLMConfig();
  const validation = validateLLMConfig();

  console.log(`🤖 LLM Provider: ${llmConfig.provider.toUpperCase()}`);

  if (llmConfig.multiAgent) {
    console.log(`⚡ Multi-Agent Mode: ENABLED`);
  }

  if (!validation.valid) {
    console.warn(`\n⚠️  WARNING: ${validation.error}`);
    console.warn(`   Transaction enhancement features will not work.\n`);
  } else {
    console.log(`✅ LLM configuration valid\n`);
  }

  // Show available providers
  const available = [];
  if (llmConfig.claudeAvailable) available.push('Claude');
  if (llmConfig.openaiAvailable) available.push('OpenAI');

  if (available.length > 0) {
    console.log(`📦 Available providers: ${available.join(', ')}`);
  } else {
    console.log(`📦 No LLM providers configured`);
  }

  console.log(`\n💡 To change provider, set LLM_PROVIDER in backend/.env`);
  console.log(`   Options: "claude" or "openai"\n`);
});
