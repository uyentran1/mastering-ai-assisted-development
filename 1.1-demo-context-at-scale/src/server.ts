/**
 * Video 1.1: Context at Scale — Large Codebases
 *
 * This is a simulated medium-sized Express API. The demo focuses on
 * the CONTEXT STRATEGIES (CLAUDE.md, selective loading, summary files)
 * rather than the code itself.
 *
 * Demo task: "I need to add a webhook handler for payment events.
 * Before writing code, read ONLY these files to understand the patterns..."
 */
import express from 'express';
import { logger } from './lib/logger';
import paymentRoutes from './routes/payments';
import orderRoutes from './routes/orders';
import { errorHandler } from './middleware/error-handler';

const app = express();
app.use(express.json());

app.use((req, _res, next) => {
  logger.info('Request', { method: req.method, path: req.path });
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '2.4.0' });
});

app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/orders', orderRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3010;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info('Server started', { port: PORT });
  });
}

export default app;
