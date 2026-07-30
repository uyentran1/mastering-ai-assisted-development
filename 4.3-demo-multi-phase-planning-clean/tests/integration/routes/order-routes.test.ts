/**
 * Order route integration tests.
 *
 * Real Express, stubbed service — HTTP contract only.
 */

import express, { Express } from 'express';
import request from 'supertest';
import { createOrderRoutes } from '../../../src/refactored/routes/order-routes';
import {
  IOrderService,
  NotFoundError,
  Order,
  ValidationError,
} from '../../../src/refactored/types';

const ORDER: Order = {
  id: 'order-1',
  user_id: 'user-1',
  items: [{ price: 10, quantity: 2 }],
  total: 20,
  status: 'pending',
  created_at: '2020-01-01T00:00:00.000Z',
};

let service: jest.Mocked<IOrderService>;
let app: Express;

beforeEach(() => {
  service = {
    getAllOrders: jest.fn(),
    getOrderById: jest.fn(),
    createOrder: jest.fn(),
  };
  app = express();
  app.use(express.json());
  app.use(createOrderRoutes(service));
});

describe('GET /orders', () => {
  it('returns 200 with the list', async () => {
    service.getAllOrders.mockResolvedValue({ data: [ORDER], error: null });

    const res = await request(app).get('/orders');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [ORDER] });
  });
});

describe('GET /orders/:id', () => {
  it('returns 200 with the order', async () => {
    service.getOrderById.mockResolvedValue({ data: ORDER, error: null });

    const res = await request(app).get('/orders/order-1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: ORDER });
    expect(service.getOrderById).toHaveBeenCalledWith('order-1');
  });

  it('returns 404 when the service reports not found', async () => {
    service.getOrderById.mockResolvedValue({
      data: null,
      error: new NotFoundError('Order', 'order-999'),
    });

    const res = await request(app).get('/orders/order-999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Order order-999 not found' });
  });
});

describe('POST /orders', () => {
  it('returns 201 and forwards userId and items', async () => {
    service.createOrder.mockResolvedValue({ data: ORDER, error: null });

    const res = await request(app)
      .post('/orders')
      .send({ userId: 'user-1', items: [{ price: 10, quantity: 2 }] });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ data: ORDER });
    expect(service.createOrder).toHaveBeenCalledWith({
      userId: 'user-1',
      items: [{ price: 10, quantity: 2 }],
    });
  });

  it('returns 400 when the service reports a validation error', async () => {
    service.createOrder.mockResolvedValue({
      data: null,
      error: new ValidationError('Items are required'),
    });

    const res = await request(app).post('/orders').send({ userId: 'user-1' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Items are required' });
  });

  it('returns 404 when the service reports an unknown user', async () => {
    service.createOrder.mockResolvedValue({
      data: null,
      error: new NotFoundError('User', 'user-999'),
    });

    const res = await request(app)
      .post('/orders')
      .send({ userId: 'user-999', items: [{ price: 1, quantity: 1 }] });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User user-999 not found' });
  });

  it('returns 500 when the service throws unexpectedly', async () => {
    service.createOrder.mockRejectedValue(new Error('database is on fire'));

    const res = await request(app)
      .post('/orders')
      .send({ userId: 'user-1', items: [{ price: 1, quantity: 1 }] });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});
