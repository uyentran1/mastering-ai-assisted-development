import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    logger.warn('App error', { statusCode: err.statusCode, code: err.code, path: req.path });
    res.status(err.statusCode).json({ data: null, error: err.message, code: err.code });
    return;
  }

  logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ data: null, error: 'Internal server error' });
}
