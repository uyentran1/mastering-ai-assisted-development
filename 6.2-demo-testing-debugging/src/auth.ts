/**
 * Authentication middleware
 *
 * NOTE: Contains a subtle bypass bug for the demo.
 * Students will use Claude to write tests that expose it.
 */

import { Request, Response, NextFunction } from 'express';

const API_KEYS: Record<string, { name: string; role: 'admin' | 'user' }> = {
  'sk-admin-001': { name: 'Admin User', role: 'admin' },
  'sk-user-001': { name: 'Regular User', role: 'user' },
  'sk-user-002': { name: 'Another User', role: 'user' },
};

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  // BUG: Case-sensitive replacement means "bearer " (lowercase) bypasses extraction
  // and the full "bearer sk-admin-001" string gets looked up (and fails),
  // BUT an empty string after "Bearer " with no token also passes through

  const user = API_KEYS[token];

  if (!user) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  (req as any).user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;

  // BUG: If authenticate middleware is skipped, user is undefined — this doesn't check for that
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}
