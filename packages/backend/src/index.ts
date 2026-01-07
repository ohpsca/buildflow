import express from 'express';
import cors from 'cors';
import { researchRouter } from './routes/research.js';
import { checkOpencodeHealth } from './services/opencode.js';
import { getActivePolls, stopAllPolling } from './services/poller.js';
import { closeDb } from './services/database.js';

const PORT = parseInt(process.env['PORT'] || '3456');
const OPENCODE_URL = process.env['OPENCODE_URL'] || 'http://localhost:4096';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  const opencodeHealthy = await checkOpencodeHealth();
  const activePolls = getActivePolls();
  
  res.json({
    status: 'ok',
    opencode: opencodeHealthy ? 'connected' : 'disconnected',
    opencodeUrl: OPENCODE_URL,
    activePolls,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/learn', researchRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const server = app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Build & Learn Backend');
  console.log('========================');
  console.log(`📡 Server:     http://localhost:${PORT}`);
  console.log(`🔗 OpenCode:   ${OPENCODE_URL}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET  /api/health          - Health check`);
  console.log(`  POST /api/learn        - Start new research`);
  console.log(`  GET  /api/learn        - List research sessions`);
  console.log(`  GET  /api/learn/:id    - Get session details`);
  console.log('');
});

function shutdown(): void {
  console.log('\n🛑 Shutting down...');
  stopAllPolling();
  closeDb();
  server.close(() => {
    console.log('👋 Goodbye!');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
