/**
 * Express server setup.
 *
 * `createApp` builds a fully wired app and is what tests should use, so
 * they never depend on a listening socket. Running this module directly
 * (`node dist/server.js`) starts a real server on PORT.
 */

import express, { Express } from 'express';
import { createInvitationRouter } from './invitations/routes';
import { invitationService, InvitationService } from './invitations/service';

export function createApp(service: InvitationService = invitationService): Express {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/', createInvitationRouter(service));

  return app;
}

const app = createApp();

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Invitations service listening on port ${port}`);
  });
}

export default app;
