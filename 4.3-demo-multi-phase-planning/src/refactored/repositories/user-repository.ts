/**
 * Refactored: User Repository
 *
 * This is the target state after Phase 2 (Extract Repository Layer).
 *
 * Responsibilities:
 * - Data access (CRUD operations)
 * - Error handling from database
 * - Returning domain objects (User)
 *
 * NOT responsible for:
 * - Validation
 * - Business logic
 * - HTTP response formatting
 */

import { User, IUserRepository, NotFoundError } from '../types';

export class UserRepository implements IUserRepository {
  private users: User[] = [];

  async findAll(): Promise<User[]> {
    return [...this.users];
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async create(name: string, email: string): Promise<User> {
    const user: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      order_count: 0,
      created_at: new Date().toISOString(),
    };
    this.users.push(user);
    return user;
  }

  async update(id: string, name?: string, email?: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }

    if (name) user.name = name;
    if (email) user.email = email;
    user.updated_at = new Date().toISOString();

    return user;
  }

  async delete(id: string): Promise<void> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new NotFoundError('User', id);
    }
    this.users.splice(index, 1);
  }

  async incrementOrderCount(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }
    user.order_count += 1;
  }
}
