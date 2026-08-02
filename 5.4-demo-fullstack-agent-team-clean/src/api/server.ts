/**
 * Express application.
 *
 * `app` is exported for tests; the server only binds a port when this file is
 * run directly, so importing it never occupies one.
 */

import express, { NextFunction, Request, Response } from 'express';
import { authRouter } from './routes/auth';
import { projectsRouter } from './routes/projects';
import { projectTasksRouter, tasksRouter } from './routes/tasks';
import { fail, ok } from './lib/http';

export const app = express();

/**
 * Hand-rolled CORS — no extra dependency for a mock API. Preflights are
 * answered here and never reach a route.
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

/** GET /api/health -> 200 { data: { status: 'ok' }, error: null } */
app.get('/api/health', (_req: Request, res: Response) => {
  ok(res, 200, { status: 'ok' });
});

app.use('/api/auth', authRouter);
// Mounted before the projects router so the nested task paths win outright.
app.use('/api/projects/:id/tasks', projectTasksRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);

/** Anything unmatched is a 404 in the same envelope as every other response. */
app.use((_req: Request, res: Response) => {
  fail(res, 404, 'Not found');
});

/**
 * Terminal error handler. A malformed JSON body surfaces as a SyntaxError from
 * express.json() and becomes a 400; everything else is a 500 with a generic
 * message so no stack trace or internal detail reaches the client.
 */
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    fail(res, 400, 'Invalid JSON body');
    return;
  }
  // eslint-disable-next-line no-console
  console.error('Unhandled API error:', err);
  fail(res, 500, 'Internal server error');
});

const PORT = Number(process.env.PORT ?? 3001);

if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

export default app;
