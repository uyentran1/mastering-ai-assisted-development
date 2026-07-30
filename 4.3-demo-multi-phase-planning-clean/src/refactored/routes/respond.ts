/**
 * The one place HTTP shape is decided.
 *
 * Handlers hand a ServiceResult here and it becomes a status code plus a body.
 * Keeping the mapping in a single function is what lets every handler stay a
 * few lines long and keeps error responses consistent across endpoints.
 */

import { Request, Response } from 'express';
import { AppError, ServiceResult } from '../types';

export function respond<T>(res: Response, result: ServiceResult<T>, successStatus = 200): void {
  if (result.error) {
    res.status(result.error.statusCode).json({ error: result.error.message });
    return;
  }
  res.status(successStatus).json({ data: result.data });
}

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

/**
 * Adapts an async handler to Express, which does not await handler promises:
 * without this, a rejected promise would hang the request instead of replying.
 * Expected failures already arrive as ServiceResult errors, so anything caught
 * here is an unexpected fault and reports a generic 500.
 */
export function handle(fn: AsyncHandler): (req: Request, res: Response) => void {
  return (req, res) => {
    fn(req, res).catch((error: unknown) => {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    });
  };
}
