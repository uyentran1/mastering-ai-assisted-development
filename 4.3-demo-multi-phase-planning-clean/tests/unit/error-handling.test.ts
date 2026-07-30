/**
 * The two shared error paths that no single layer owns:
 * `runService` deciding what counts as an expected failure, and `handle`
 * catching what escapes a route handler.
 */

import express, { Express } from 'express';
import request from 'supertest';
import { createUserRoutes } from '../../src/refactored/routes/user-routes';
import {
  AppError,
  IUserService,
  NotFoundError,
  runService,
  ValidationError,
} from '../../src/refactored/types';

describe('runService', () => {
  it('wraps a successful result', async () => {
    await expect(runService(() => 'ok')).resolves.toEqual({ data: 'ok', error: null });
  });

  it('captures an AppError as an expected failure', async () => {
    const error = new ValidationError('nope');

    await expect(
      runService(() => {
        throw error;
      })
    ).resolves.toEqual({ data: null, error });
  });

  it('rethrows anything that is not an AppError', async () => {
    await expect(
      runService(() => {
        throw new TypeError('bug');
      })
    ).rejects.toThrow(TypeError);
  });
});

describe('error class shapes', () => {
  it('gives ValidationError a 400 and a VALIDATION_ERROR code', () => {
    const error = new ValidationError('bad input');

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      message: 'bad input',
      name: 'ValidationError',
    });
  });

  it('builds the NotFoundError message from resource and id', () => {
    const error = new NotFoundError('Order', 'order-7');

    expect(error).toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
      message: 'Order order-7 not found',
      name: 'NotFoundError',
    });
  });
});

describe('handle', () => {
  /** Builds an app whose only service method rejects with `error`. */
  function appRejectingWith(error: unknown): Express {
    const service = {
      getUserById: jest.fn().mockRejectedValue(error),
    } as unknown as IUserService;

    const app = express();
    app.use(express.json());
    app.use(createUserRoutes(service));
    return app;
  }

  it("honours a thrown AppError's status and message", async () => {
    const res = await request(appRejectingWith(new NotFoundError('User', 'user-9'))).get(
      '/users/user-9'
    );

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User user-9 not found' });
  });

  it('hides the detail of an unexpected throw behind a 500', async () => {
    const res = await request(appRejectingWith(new Error('connection string leaked'))).get(
      '/users/user-1'
    );

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('survives a rejection that is not an Error at all', async () => {
    const res = await request(appRejectingWith('just a string')).get('/users/user-1');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});
