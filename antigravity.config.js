module.exports = {
  name: 'spendlens',
  description: 'AI-powered bank statement analyzer and spending insights platform',

  // Environment variables required
  env: {
    ANTHROPIC_API_KEY: {
      description: 'Your Anthropic API key for Claude AI',
      required: true,
      link: 'https://console.anthropic.com/'
    },
    PORT: {
      description: 'Backend server port',
      default: 3001
    },
    NODE_ENV: {
      description: 'Node environment',
      default: 'development'
    }
  },

  // Services to run
  services: [
    {
      name: 'backend',
      directory: './backend',
      command: 'npm run dev',
      port: 3001,
      healthCheck: 'http://localhost:3001/health',
      env: {
        PORT: '${PORT}',
        ANTHROPIC_API_KEY: '${ANTHROPIC_API_KEY}',
        NODE_ENV: '${NODE_ENV}'
      }
    },
    {
      name: 'frontend',
      directory: './frontend',
      command: 'npm run dev',
      port: 3000,
      healthCheck: 'http://localhost:3000'
    }
  ],

  // Installation steps
  install: [
    {
      description: 'Installing root dependencies',
      command: 'npm install'
    },
    {
      description: 'Installing backend dependencies',
      command: 'npm install',
      directory: './backend'
    },
    {
      description: 'Installing frontend dependencies',
      command: 'npm install',
      directory: './frontend'
    }
  ],

  // Getting started guide
  gettingStarted: `
🎉 SpendLens is ready to use!

1. Upload bank statements (PDF or CSV) at http://localhost:3000
2. Try the sample: upload sample-statement.csv from the project root
3. Click "Enhance All with AI" to process transactions with Claude
4. Review categorization and view spending insights

Key Features:
- 📊 AI-powered transaction categorization
- 💰 Behavioral spending analysis
- 📈 Interactive charts and forecasts
- 🔄 Recurring payment detection
- 📥 CSV export

Need help? Check the README.md or API docs at http://localhost:3001/health
  `,

  // Documentation
  docs: {
    'API Documentation': 'http://localhost:3001/health',
    'Frontend': 'http://localhost:3000',
    'GitHub': 'https://github.com/akhanna222/personal-spending-model',
    'README': './README.md'
  }
};
