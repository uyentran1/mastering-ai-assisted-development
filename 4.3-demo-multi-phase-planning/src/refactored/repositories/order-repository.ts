/**
 * Refactored: Order Repository
 *
 * Data access layer for orders.
 * Follows the same pattern as UserRepository.
 */

import { Order, OrderItem, IOrderRepository, NotFoundError } from '../types';

export class OrderRepository implements IOrderRepository {
  private orders: Order[] = [];

  async findAll(): Promise<Order[]> {
    return [...this.orders];
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.find(o => o.id === id) || null;
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return this.orders.filter(o => o.user_id === userId);
  }

  async create(userId: string, items: OrderItem[], total: number): Promise<Order> {
    const order: Order = {
      id: `order-${Date.now()}`,
      user_id: userId,
      items,
      total,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    this.orders.push(order);
    return order;
  }

  async update(id: string, status: string): Promise<Order> {
    const order = await this.findById(id);
    if (!order) {
      throw new NotFoundError('Order', id);
    }

    order.status = status as 'pending' | 'completed' | 'cancelled';
    order.updated_at = new Date().toISOString();

    return order;
  }

  async delete(id: string): Promise<void> {
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) {
      throw new NotFoundError('Order', id);
    }
    this.orders.splice(index, 1);
  }
}
