/**
 * Webhook signature verification middleware.
 * This is the existing pattern the AI should follow when building the new webhook handler.
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';
import { logger } from '../lib/logger';

export function verifyWebhookSignature(secret: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const signature = req.headers['x-webhook-signature'] as string;

    if (!signature) {
      logger.warn('Missing webhook signature', { path: req.path });
      return next(new AppError(401, 'Missing webhook signature', 'WEBHOOK_AUTH'));
    }

    // Simplified verification for demo
    if (signature !== `sha256=${secret}`) {
      logger.warn('Invalid webhook signature', { path: req.path });
      return next(new AppError(401, 'Invalid webhook signature', 'WEBHOOK_AUTH'));
    }

    logger.info('Webhook verified', { path: req.path });
    next();
  };
}
