/**
 * Refactored: Order Service
 *
 * Business logic for orders.
 * Follows the same pattern as UserService.
 */

import {
  Order,
  OrderItem,
  IOrderService,
  IOrderRepository,
  IUserRepository,
  ServiceResult,
  ValidationError,
  NotFoundError,
  AppError,
} from '../types';

export class OrderService implements IOrderService {
  constructor(
    private orderRepository: IOrderRepository,
    private userRepository: IUserRepository,
  ) {}

  async getAllOrders(): Promise<ServiceResult<Order[]>> {
    try {
      const orders = await this.orderRepository.findAll();
      return { data: orders, error: null };
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'Failed to fetch orders', 500);
      return { data: null, error: appError };
    }
  }

  async getOrderById(id: string): Promise<ServiceResult<Order>> {
    try {
      if (!id) {
        throw new ValidationError('Order ID is required');
      }

      const order = await this.orderRepository.findById(id);
      if (!order) {
        throw new NotFoundError('Order', id);
      }

      return { data: order, error: null };
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'Failed to fetch order', 500);
      return { data: null, error: appError };
    }
  }

  async getOrdersByUserId(userId: string): Promise<ServiceResult<Order[]>> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      const orders = await this.orderRepository.findByUserId(userId);
      return { data: orders, error: null };
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'Failed to fetch orders', 500);
      return { data: null, error: appError };
    }
  }

  async createOrder(userId: string, items: OrderItem[]): Promise<ServiceResult<Order>> {
    try {
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new ValidationError('Items are required');
      }

      // Validate user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      // Calculate total (business logic)
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      if (total <= 0) {
        throw new ValidationError('Order total must be greater than 0');
      }

      const order = await this.orderRepository.create(userId, items, total);

      // Update user order count
      await this.userRepository.incrementOrderCount(userId);

      return { data: order, error: null };
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'Failed to create order', 500);
      return { data: null, error: appError };
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<ServiceResult<Order>> {
    try {
      if (!id) {
        throw new ValidationError('Order ID is required');
      }

      const validStatuses = ['pending', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
      }

      const order = await this.orderRepository.update(id, status);
      return { data: order, error: null };
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'Failed to update order', 500);
      return { data: null, error: appError };
    }
  }

  async deleteOrder(id: string): Promise<ServiceResult<void>> {
    try {
      if (!id) {
        throw new ValidationError('Order ID is required');
      }

      await this.orderRepository.delete(id);
      return { data: undefined, error: null };
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'Failed to delete order', 500);
      return { data: null, error: appError };
    }
  }
}
