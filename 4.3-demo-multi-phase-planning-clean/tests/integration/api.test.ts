/**
 * End-to-end tests against the wired router exported by src/routes.ts.
 *
 * Nothing is mocked here — real routes, real services, real repositories. This
 * is the regression net for the migration: every assertion below describes
 * behaviour the monolithic version had, so a passing run means the endpoints
 * and response shapes did not change.
 *
 * Each test gets a router over its own empty store via createApiRouter().
 */

import express, { Express } from 'express';
import request from 'supertest';
import { createApiRouter } from '../../src/routes';

let app: Express;

beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use(createApiRouter());
});

async function createUser(body: object = { name: 'Ada Lovelace', email: 'ada@example.com' }) {
  return request(app).post('/users').send(body);
}

describe('users', () => {
  it('starts with an empty list', async () => {
    const res = await request(app).get('/users');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });

  it('creates a user and then lists and fetches it', async () => {
    const created = await createUser();

    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    expect(created.body.data.created_at).toEqual(expect.any(String));

    const list = await request(app).get('/users');
    expect(list.body.data).toHaveLength(1);

    const fetched = await request(app).get(`/users/${created.body.data.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.id).toBe(created.body.data.id);
  });

  it('rejects a second user with the same email', async () => {
    await createUser();

    const duplicate = await createUser({ name: 'Impostor', email: 'ADA@EXAMPLE.COM' });

    expect(duplicate.status).toBe(400);
    expect(duplicate.body).toEqual({ error: 'Email already exists' });
  });

  it.each([
    [{ email: 'ada@example.com' }, 'Name is required'],
    [{ name: 'Ada' }, 'Email is required'],
    [{ name: 'Ada', email: 'not-an-email' }, 'Invalid email format'],
  ])('rejects %j with 400', async (body, message) => {
    const res = await createUser(body);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: message });
  });

  it('404s an unknown user', async () => {
    const res = await request(app).get('/users/user-999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User user-999 not found' });
  });

  it('updates a user and stamps updated_at', async () => {
    const created = await createUser();

    const res = await request(app)
      .put(`/users/${created.body.data.id}`)
      .send({ name: 'Ada B', email: 'ada.b@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Ada B', email: 'ada.b@example.com' });
    expect(res.body.data.updated_at).toEqual(expect.any(String));
  });

  it('deletes a user', async () => {
    const created = await createUser();

    const deleted = await request(app).delete(`/users/${created.body.data.id}`);

    expect(deleted.status).toBe(200);
    expect(deleted.body).toEqual({ data: { success: true } });
    await expect(
      request(app)
        .get(`/users/${created.body.data.id}`)
        .then(r => r.status)
    ).resolves.toBe(404);
  });
});

describe('orders', () => {
  it('starts with an empty list', async () => {
    const res = await request(app).get('/orders');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });

  it('creates an order, calculates the total, and counts it against the user', async () => {
    const user = await createUser();

    const order = await request(app)
      .post('/orders')
      .send({
        userId: user.body.data.id,
        items: [
          { price: 10, quantity: 2 },
          { price: 5.5, quantity: 4 },
        ],
      });

    expect(order.status).toBe(201);
    expect(order.body.data).toMatchObject({
      user_id: user.body.data.id,
      total: 42,
      status: 'pending',
    });

    const fetchedUser = await request(app).get(`/users/${user.body.data.id}`);
    expect(fetchedUser.body.data.order_count).toBe(1);

    const fetchedOrder = await request(app).get(`/orders/${order.body.data.id}`);
    expect(fetchedOrder.status).toBe(200);
    expect(fetchedOrder.body.data.total).toBe(42);
  });

  it('404s an order for an unknown user', async () => {
    const res = await request(app)
      .post('/orders')
      .send({ userId: 'user-999', items: [{ price: 1, quantity: 1 }] });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User user-999 not found' });
  });

  it.each([
    [{ items: [{ price: 1, quantity: 1 }] }, 'User ID is required'],
    [{ userId: 'user-1' }, 'Items are required'],
    [{ userId: 'user-1', items: [] }, 'Items are required'],
  ])('rejects %j with 400', async (body, message) => {
    const res = await request(app).post('/orders').send(body);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: message });
  });

  it('rejects an order whose total is not positive', async () => {
    const user = await createUser();

    const res = await request(app)
      .post('/orders')
      .send({ userId: user.body.data.id, items: [{ price: 0, quantity: 3 }] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Order total must be greater than 0' });
  });

  it('404s an unknown order', async () => {
    const res = await request(app).get('/orders/order-999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Order order-999 not found' });
  });
});
