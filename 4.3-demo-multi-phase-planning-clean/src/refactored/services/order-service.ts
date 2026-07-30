/**
 * Order business logic.
 *
 * Owns order validation, total calculation, and the user order-count side
 * effect. Reaches storage only through repositories and never formats an HTTP
 * response.
 */

import {
  CreateOrderInput,
  IOrderRepository,
  IOrderService,
  IUserRepository,
  NotFoundError,
  Order,
  OrderItem,
  runService,
  ServiceResult,
  ValidationError,
} from '../types';

export class OrderService implements IOrderService {
  constructor(
    private readonly orders: IOrderRepository,
    private readonly users: IUserRepository
  ) {}

  async getAllOrders(): Promise<ServiceResult<Order[]>> {
    return runService(() => this.orders.findAll());
  }

  async getOrderById(id: string): Promise<ServiceResult<Order>> {
    return runService(async () => {
      const order = await this.orders.findById(id);
      if (!order) {
        throw new NotFoundError('Order', id);
      }
      return order;
    });
  }

  async createOrder(input: CreateOrderInput): Promise<ServiceResult<Order>> {
    return runService(async () => {
      const { userId, items } = input;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }
      if (!Array.isArray(items) || items.length === 0) {
        throw new ValidationError('Items are required');
      }

      const user = await this.users.findById(userId);
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      const total = calculateTotal(items);
      if (!(total > 0)) {
        throw new ValidationError('Order total must be greater than 0');
      }

      const order = await this.orders.create({
        user_id: userId,
        items,
        total,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      await this.users.update(userId, { order_count: (user.order_count ?? 0) + 1 });

      return order;
    });
  }
}

/**
 * Sums line totals. A non-numeric price or quantity yields NaN, which the
 * caller's `total > 0` check rejects as an invalid total.
 */
function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
