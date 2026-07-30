/**
 * User route integration tests.
 *
 * Real Express, real JSON parsing, stubbed service — so these assert the HTTP
 * contract (status codes, body shape, what gets forwarded to the service) and
 * nothing about business rules.
 */

import express, { Express } from 'express';
import request from 'supertest';
import { createUserRoutes } from '../../../src/refactored/routes/user-routes';
import {
  IUserService,
  NotFoundError,
  User,
  ValidationError,
} from '../../../src/refactored/types';

const USER: User = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  created_at: '2020-01-01T00:00:00.000Z',
};

let service: jest.Mocked<IUserService>;
let app: Express;

beforeEach(() => {
  service = {
    getAllUsers: jest.fn(),
    getUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  };
  app = express();
  app.use(express.json());
  app.use(createUserRoutes(service));
});

describe('GET /users', () => {
  it('returns 200 with the list', async () => {
    service.getAllUsers.mockResolvedValue({ data: [USER], error: null });

    const res = await request(app).get('/users');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [USER] });
  });
});

describe('GET /users/:id', () => {
  it('returns 200 with the user and forwards the id', async () => {
    service.getUserById.mockResolvedValue({ data: USER, error: null });

    const res = await request(app).get('/users/user-1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: USER });
    expect(service.getUserById).toHaveBeenCalledWith('user-1');
  });

  it('returns 404 when the service reports not found', async () => {
    service.getUserById.mockResolvedValue({
      data: null,
      error: new NotFoundError('User', 'user-999'),
    });

    const res = await request(app).get('/users/user-999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User user-999 not found' });
  });

  it('returns 500 when the service throws unexpectedly', async () => {
    service.getUserById.mockRejectedValue(new Error('database is on fire'));

    const res = await request(app).get('/users/user-1');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});

describe('POST /users', () => {
  it('returns 201 and forwards name and email', async () => {
    service.createUser.mockResolvedValue({ data: USER, error: null });

    const res = await request(app)
      .post('/users')
      .send({ name: 'Ada Lovelace', email: 'ada@example.com' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ data: USER });
    expect(service.createUser).toHaveBeenCalledWith('Ada Lovelace', 'ada@example.com');
  });

  it('returns 400 when the service reports a validation error', async () => {
    service.createUser.mockResolvedValue({
      data: null,
      error: new ValidationError('Name is required'),
    });

    const res = await request(app).post('/users').send({ email: 'ada@example.com' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Name is required' });
  });

  it('forwards undefined fields rather than failing on an empty body', async () => {
    service.createUser.mockResolvedValue({
      data: null,
      error: new ValidationError('Name is required'),
    });

    const res = await request(app).post('/users');

    expect(res.status).toBe(400);
    expect(service.createUser).toHaveBeenCalledWith(undefined, undefined);
  });
});

describe('PUT /users/:id', () => {
  it('returns 200 and forwards id, name and email', async () => {
    service.updateUser.mockResolvedValue({ data: USER, error: null });

    const res = await request(app)
      .put('/users/user-1')
      .send({ name: 'Ada B', email: 'ada.b@example.com' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: USER });
    expect(service.updateUser).toHaveBeenCalledWith('user-1', 'Ada B', 'ada.b@example.com');
  });

  it('returns 404 when the service reports not found', async () => {
    service.updateUser.mockResolvedValue({
      data: null,
      error: new NotFoundError('User', 'user-999'),
    });

    const res = await request(app).put('/users/user-999').send({ name: 'Ada' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /users/:id', () => {
  it('returns 200 with the success payload', async () => {
    service.deleteUser.mockResolvedValue({ data: { success: true }, error: null });

    const res = await request(app).delete('/users/user-1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { success: true } });
    expect(service.deleteUser).toHaveBeenCalledWith('user-1');
  });

  it('returns 404 when the service reports not found', async () => {
    service.deleteUser.mockResolvedValue({
      data: null,
      error: new NotFoundError('User', 'user-999'),
    });

    const res = await request(app).delete('/users/user-999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User user-999 not found' });
  });
});
