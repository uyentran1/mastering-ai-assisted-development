/**
 * Refactored Architecture: Shared Type Definitions
 *
 * This file demonstrates the target state for the refactor.
 * All layers (routes, services, repositories) use these types.
 */

// ============================================
// Error Types
// ============================================

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} ${id} not found`, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

// ============================================
// Service Result Wrapper
// ============================================

export interface ServiceResult<T> {
  data: T | null;
  error: AppError | null;
}

// ============================================
// Domain Models
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  order_count: number;
  created_at: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

// ============================================
// Repository Interfaces
// ============================================

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(name: string, email: string): Promise<User>;
  update(id: string, name?: string, email?: string): Promise<User>;
  delete(id: string): Promise<void>;
  incrementOrderCount(id: string): Promise<void>;
}

export interface IOrderRepository {
  findAll(): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  create(userId: string, items: OrderItem[], total: number): Promise<Order>;
  update(id: string, status: string): Promise<Order>;
  delete(id: string): Promise<void>;
}

// ============================================
// Service Interfaces
// ============================================

export interface IUserService {
  getAllUsers(): Promise<ServiceResult<User[]>>;
  getUserById(id: string): Promise<ServiceResult<User>>;
  createUser(name: string, email: string): Promise<ServiceResult<User>>;
  updateUser(id: string, name?: string, email?: string): Promise<ServiceResult<User>>;
  deleteUser(id: string): Promise<ServiceResult<void>>;
}

export interface IOrderService {
  getAllOrders(): Promise<ServiceResult<Order[]>>;
  getOrderById(id: string): Promise<ServiceResult<Order>>;
  getOrdersByUserId(userId: string): Promise<ServiceResult<Order[]>>;
  createOrder(userId: string, items: OrderItem[]): Promise<ServiceResult<Order>>;
  updateOrderStatus(id: string, status: string): Promise<ServiceResult<Order>>;
  deleteOrder(id: string): Promise<ServiceResult<void>>;
}
