/**
 * User data access.
 *
 * Owns the storage for users and nothing else — no validation, no HTTP.
 * The in-memory array stands in for a database table; swapping it for a real
 * one only touches this file.
 */

import { IUserRepository, NotFoundError, User } from '../types';

export class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];

  async findAll(): Promise<User[]> {
    return this.users.map(user => ({ ...user }));
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.find(u => u.id === id);
    return user ? { ...user } : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const needle = email.toLowerCase();
    const user = this.users.find(u => u.email.toLowerCase() === needle);
    return user ? { ...user } : null;
  }

  async create(data: Omit<User, 'id'>): Promise<User> {
    const user: User = { id: `user-${Date.now()}-${this.users.length}`, ...data };
    this.users.push(user);
    return { ...user };
  }

  async update(id: string, data: Partial<Omit<User, 'id'>>): Promise<User> {
    const stored = this.users.find(u => u.id === id);
    if (!stored) {
      throw new NotFoundError('User', id);
    }
    Object.assign(stored, data);
    return { ...stored };
  }

  async delete(id: string): Promise<void> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new NotFoundError('User', id);
    }
    this.users.splice(index, 1);
  }
}
