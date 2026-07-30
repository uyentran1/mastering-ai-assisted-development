/**
 * OrderService unit tests.
 *
 * Both repositories are jest mocks here — unlike UserService, the order rules
 * do not depend on accumulated state, so stubbed return values are enough and
 * they let us assert exactly what was written.
 */

import { OrderService } from '../../../src/refactored/services/order-service';
import {
  IOrderRepository,
  IUserRepository,
  Order,
  User,
} from '../../../src/refactored/types';

const EXISTING_USER: User = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  created_at: '2020-01-01T00:00:00.000Z',
};

let orderRepo: jest.Mocked<IOrderRepository>;
let userRepo: jest.Mocked<IUserRepository>;
let service: OrderService;

beforeEach(() => {
  orderRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(async data => ({ id: 'order-1', ...data }) as Order),
  };
  userRepo = {
    findAll: jest.fn(),
    findById: jest.fn(async (_id: string) => EXISTING_USER as User | null),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(async (id, data) => ({ ...EXISTING_USER, ...data, id })),
    delete: jest.fn(),
  };
  service = new OrderService(orderRepo, userRepo);
});

describe('getAllOrders', () => {
  it('returns an empty list when there are no orders', async () => {
    orderRepo.findAll.mockResolvedValue([]);

    const result = await service.getAllOrders();

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });
});

describe('getOrderById', () => {
  it('returns the requested order', async () => {
    const order = { id: 'order-1' } as Order;
    orderRepo.findById.mockResolvedValue(order);

    const result = await service.getOrderById('order-1');

    expect(result.error).toBeNull();
    expect(result.data).toBe(order);
  });

  it('reports an unknown id as not found', async () => {
    orderRepo.findById.mockResolvedValue(null);

    const result = await service.getOrderById('order-999');

    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({
      statusCode: 404,
      message: 'Order order-999 not found',
    });
  });
});

describe('createOrder', () => {
  const items = [
    { price: 10, quantity: 2 },
    { price: 5.5, quantity: 4 },
  ];

  it('creates a pending order with the calculated total', async () => {
    const result = await service.createOrder({ userId: 'user-1', items });

    expect(result.error).toBeNull();
    expect(orderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', items, total: 42, status: 'pending' })
    );
    expect(result.data).toMatchObject({ id: 'order-1', total: 42 });
  });

  it('increments the order count on the owning user', async () => {
    userRepo.findById.mockResolvedValue({ ...EXISTING_USER, order_count: 3 });

    await service.createOrder({ userId: 'user-1', items });

    expect(userRepo.update).toHaveBeenCalledWith('user-1', { order_count: 4 });
  });

  it('starts the order count at 1 for a first-time buyer', async () => {
    await service.createOrder({ userId: 'user-1', items });

    expect(userRepo.update).toHaveBeenCalledWith('user-1', { order_count: 1 });
  });

  it('rejects a missing userId', async () => {
    const result = await service.createOrder({ userId: '', items });

    expect(result.error).toMatchObject({ statusCode: 400, message: 'User ID is required' });
    expect(orderRepo.create).not.toHaveBeenCalled();
  });

  it.each([
    ['an empty array', []],
    ['undefined', undefined],
    ['a non-array', 'nope'],
  ])('rejects items given %s', async (_label, badItems) => {
    const result = await service.createOrder({
      userId: 'user-1',
      items: badItems as never,
    });

    expect(result.error).toMatchObject({ statusCode: 400, message: 'Items are required' });
    expect(orderRepo.create).not.toHaveBeenCalled();
  });

  it('reports an unknown user as not found', async () => {
    userRepo.findById.mockResolvedValue(null);

    const result = await service.createOrder({ userId: 'user-999', items });

    expect(result.error).toMatchObject({
      statusCode: 404,
      message: 'User user-999 not found',
    });
    expect(orderRepo.create).not.toHaveBeenCalled();
  });

  it.each([
    ['a zero total', [{ price: 0, quantity: 5 }]],
    ['a negative total', [{ price: -10, quantity: 1 }]],
    ['a non-numeric price', [{ price: 'free' as unknown as number, quantity: 1 }]],
  ])('rejects %s', async (_label, badItems) => {
    const result = await service.createOrder({ userId: 'user-1', items: badItems });

    expect(result.error).toMatchObject({
      statusCode: 400,
      message: 'Order total must be greater than 0',
    });
    expect(orderRepo.create).not.toHaveBeenCalled();
    expect(userRepo.update).not.toHaveBeenCalled();
  });
});
