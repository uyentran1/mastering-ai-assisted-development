/**
 * Express server setup
 */

import express from 'express';
import invitationRoutes from './invitations/routes';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/', invitationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
