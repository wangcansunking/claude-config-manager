import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/error-handler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3399);
const HOST = process.env.HOST ?? '127.0.0.1';

// Rate limiter for /api/*.
// Default budget is generous (120 req/min) — the dashboard makes bursty
// parallel calls on page load and we don't want to throttle the single-user
// localhost case. Override via CCM_RATE_LIMIT_MAX if you need tighter control.
const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.CCM_RATE_LIMIT_MAX ?? 120),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json());
app.use('/api', apiLimiter);

// Import all route modules
import { statsRouter } from './routes/stats.js';
import { pluginsRouter } from './routes/plugins.js';
import { mcpServersRouter } from './routes/mcp-servers.js';
import { skillsRouter } from './routes/skills.js';
import { commandsRouter } from './routes/commands.js';
import { settingsRouter } from './routes/settings.js';
import { profilesRouter } from './routes/profiles.js';
import { sessionsRouter } from './routes/sessions.js';
import { metricsRouter } from './routes/metrics.js';
import { recommendationsRouter } from './routes/recommendations.js';
import { mcpRegistryRouter } from './routes/mcp-registry.js';
import { marketplacesRouter } from './routes/marketplaces.js';
import { eventsRouter } from './routes/events.js';
import { infoRouter } from './routes/info.js';

// API routes
app.use('/api/info', infoRouter);
app.use('/api/stats', statsRouter);
app.use('/api/plugins', pluginsRouter);
app.use('/api/mcp-servers', mcpServersRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/commands', commandsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/profiles', profilesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/mcp-registry', mcpRegistryRouter);
app.use('/api/marketplaces', marketplacesRouter);
app.use('/api/events', eventsRouter);

// Serve static files (Vite build output)
const clientDir = join(__dirname, '..', 'dist', 'client');
app.use(express.static(clientDir));

// SPA fallback — serve index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(join(clientDir, 'index.html'));
});

// Typed error middleware — must be registered last
app.use(errorHandler);

app.listen(PORT, HOST, () => {
  console.log(`Dashboard running at http://${HOST}:${PORT}`);
});

export { app };
