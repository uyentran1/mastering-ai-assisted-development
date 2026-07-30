/**
 * Shared types for the layered architecture.
 *
 * Every layer depends on this module; this module depends on nothing.
 * That keeps the dependency graph acyclic: routes → services → repositories → types.
 */

// ============================================
// Errors
// ============================================

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} ${id} not found`, 404);
  }
}

// ============================================
// Service results
// ============================================

export interface ServiceResult<T> {
  data: T | null;
  error: AppError | null;
}

/**
 * Runs a unit of business logic and normalises the outcome into a
 * ServiceResult. Expected failures (AppError) become `error`; anything else is
 * an unexpected fault and propagates so the route layer can report a 500.
 */
export async function runService<T>(work: () => Promise<T> | T): Promise<ServiceResult<T>> {
  try {
    return { data: await work(), error: null };
  } catch (error) {
    if (error instanceof AppError) {
      return { data: null, error };
    }
    throw error;
  }
}

// ============================================
// Domain objects
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at?: string;
  order_count?: number;
}

export interface OrderItem {
  price: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'paid' | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  created_at: string;
}

// ============================================
// Repository contracts (data access)
// ============================================

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: Omit<User, 'id'>): Promise<User>;
  update(id: string, data: Partial<Omit<User, 'id'>>): Promise<User>;
  delete(id: string): Promise<void>;
}

export interface IOrderRepository {
  findAll(): Promise<Order[]>;
  findById(id: string): Promise<Order | null>;
  create(data: Omit<Order, 'id'>): Promise<Order>;
}

// ============================================
// Service contracts (business logic)
// ============================================

export interface CreateOrderInput {
  userId: string;
  items: OrderItem[];
}

export interface IUserService {
  getAllUsers(): Promise<ServiceResult<User[]>>;
  getUserById(id: string): Promise<ServiceResult<User>>;
  createUser(name: string, email: string): Promise<ServiceResult<User>>;
  updateUser(id: string, name?: string, email?: string): Promise<ServiceResult<User>>;
  deleteUser(id: string): Promise<ServiceResult<{ success: true }>>;
}

export interface IOrderService {
  getAllOrders(): Promise<ServiceResult<Order[]>>;
  getOrderById(id: string): Promise<ServiceResult<Order>>;
  createOrder(input: CreateOrderInput): Promise<ServiceResult<Order>>;
}
