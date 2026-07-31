/**
 * Express server setup.
 *
 * `createApp` builds a fully wired app and is what tests should use, so
 * they never depend on a listening socket. Running this module directly
 * (`node dist/server.js`) starts a real server on PORT.
 */

import express, { Express, RequestHandler } from 'express';
import { createInvitationRouter } from './invitations/routes';
import { invitationService, InvitationService } from './invitations/service';
import { devHeaderAuth } from './invitations/auth';

export interface AppOptions {
  /**
   * Middleware that populates req.user. There is no default: without one,
   * every authenticated invitations route returns 401. Supplying real
   * authentication here is the last step before this service can be
   * deployed.
   */
  auth?: RequestHandler;
}

export function createApp(
  service: InvitationService = invitationService,
  options: AppOptions = {}
): Express {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  if (options.auth) {
    app.use(options.auth);
  }

  app.use('/', createInvitationRouter(service));

  return app;
}

/**
 * The standalone server trusts the `x-user-id` / `x-user-roles` headers
 * only when ALLOW_HEADER_AUTH=1 is set, so local runs work while a
 * default start never mounts spoofable authentication.
 */
const allowHeaderAuth = process.env.ALLOW_HEADER_AUTH === '1';

if (allowHeaderAuth && process.env.NODE_ENV === 'production') {
  throw new Error('ALLOW_HEADER_AUTH must not be enabled in production');
}

const app = createApp(invitationService, {
  auth: allowHeaderAuth ? devHeaderAuth() : undefined,
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Invitations service listening on port ${port}`);
  });
}

export default app;
