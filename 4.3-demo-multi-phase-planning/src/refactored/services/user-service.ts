/**
 * Refactored: User Service
 *
 * This is the target state after Phase 3 (Extract Service Layer).
 *
 * Responsibilities:
 * - Business logic and validation
 * - Using repositories to access data
 * - Throwing custom errors (ValidationError, NotFoundError)
 *
 * NOT responsible for:
 * - HTTP request/response handling
 * - Database access (delegates to repository)
 * - Error formatting for HTTP
 */

import {
  User,
  IUserService,
  IUserRepository,
  ServiceResult,
  ValidationError,
  NotFoundError,
  AppError,
} from '../types';

export class UserService implements IUserService {
  constructor(private repository: IUserRepository) {}

  async getAllUsers(): Promise<ServiceResult<User[]>> {
    try {
      const users = await this.repository.findAll();
      return { data: users, error: null };
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'Failed to fetch users', 500);
      return { data: null, error: appError };
    }
  }

  async getUserById(id: string): Promise<ServiceResult<User>> {
    try {
      if (!id) {
        throw new ValidationError('User ID is required');
      }

      const user = await this.repository.findById(id);
      if (!user) {
        throw new NotFoundError('User', id);
      }

      return { data: user, error: null };
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'Failed to fetch user', 500);
      return { data: null, error: appError };
    }
  }

  async createUser(name: string, email: string): Promise<ServiceResult<User>> {
    try {
      // Validation logic (moved from route handler)
      if (!name || name.trim() === '') {
        throw new ValidationError('Name is required');
      }

      if (!email || email.trim() === '') {
        throw new ValidationError('Email is required');
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format');
      }

      // Check for duplicate email
      const existing = await this.repository.findByEmail(email);
      if (existing) {
        throw new ValidationError('Email already exists');
      }

      const user = await this.repository.create(name.trim(), email.trim());
      return { data: user, error: null };
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'Failed to create user', 500);
      return { data: null, error: appError };
    }
  }

  async updateUser(id: string, name?: string, email?: string): Promise<ServiceResult<User>> {
    try {
      if (!id) {
        throw new ValidationError('User ID is required');
      }

      if (name !== undefined && (!name || name.trim() === '')) {
        throw new ValidationError('Name cannot be empty');
      }

      if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new ValidationError('Invalid email format');
        }

        // Check for duplicate email (excluding current user)
        const existing = await this.repository.findByEmail(email);
        if (existing && existing.id !== id) {
          throw new ValidationError('Email already exists');
        }
      }

      const user = await this.repository.update(
        id,
        name ? name.trim() : undefined,
        email ? email.trim() : undefined,
      );

      return { data: user, error: null };
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'Failed to update user', 500);
      return { data: null, error: appError };
    }
  }

  async deleteUser(id: string): Promise<ServiceResult<void>> {
    try {
      if (!id) {
        throw new ValidationError('User ID is required');
      }

      await this.repository.delete(id);
      return { data: undefined, error: null };
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'Failed to delete user', 500);
      return { data: null, error: appError };
    }
  }
}
