/**
 * Order data access.
 *
 * Owns the storage for orders and nothing else — no validation, no HTTP.
 */

import { IOrderRepository, Order } from '../types';

export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Order[] = [];

  async findAll(): Promise<Order[]> {
    return this.orders.map(order => ({ ...order }));
  }

  async findById(id: string): Promise<Order | null> {
    const order = this.orders.find(o => o.id === id);
    return order ? { ...order } : null;
  }

  async create(data: Omit<Order, 'id'>): Promise<Order> {
    const order: Order = { id: `order-${Date.now()}-${this.orders.length}`, ...data };
    this.orders.push(order);
    return { ...order };
  }
}
