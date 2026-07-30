/**
 * User business logic.
 *
 * Owns validation and business rules. Reaches storage only through
 * IUserRepository, and never formats an HTTP response — it throws AppError
 * subclasses and returns them in a ServiceResult for the route layer to map.
 */

import {
  IUserRepository,
  IUserService,
  NotFoundError,
  runService,
  ServiceResult,
  User,
  ValidationError,
} from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UserService implements IUserService {
  constructor(private readonly users: IUserRepository) {}

  async getAllUsers(): Promise<ServiceResult<User[]>> {
    return runService(() => this.users.findAll());
  }

  async getUserById(id: string): Promise<ServiceResult<User>> {
    return runService(async () => {
      requireId(id);
      return this.requireUser(id);
    });
  }

  async createUser(name: string, email: string): Promise<ServiceResult<User>> {
    return runService(async () => {
      if (!isPresent(name)) {
        throw new ValidationError('Name is required');
      }
      if (!isPresent(email)) {
        throw new ValidationError('Email is required');
      }
      const trimmedEmail = email.trim();
      await this.requireValidUnusedEmail(trimmedEmail);

      return this.users.create({
        name: name.trim(),
        email: trimmedEmail,
        created_at: new Date().toISOString(),
      });
    });
  }

  async updateUser(id: string, name?: string, email?: string): Promise<ServiceResult<User>> {
    return runService(async () => {
      requireId(id);
      await this.requireUser(id);

      const changes: Partial<Omit<User, 'id'>> = {};
      if (isPresent(name)) {
        changes.name = name.trim();
      }
      if (email) {
        const trimmedEmail = email.trim();
        await this.requireValidUnusedEmail(trimmedEmail, id);
        changes.email = trimmedEmail;
      }
      changes.updated_at = new Date().toISOString();

      return this.users.update(id, changes);
    });
  }

  async deleteUser(id: string): Promise<ServiceResult<{ success: true }>> {
    return runService(async () => {
      requireId(id);
      await this.requireUser(id);
      await this.users.delete(id);
      return { success: true as const };
    });
  }

  private async requireUser(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundError('User', id);
    }
    return user;
  }

  /** Rejects malformed emails and emails already taken by a *different* user. */
  private async requireValidUnusedEmail(email: string, exceptUserId?: string): Promise<void> {
    if (!EMAIL_REGEX.test(email)) {
      throw new ValidationError('Invalid email format');
    }
    const owner = await this.users.findByEmail(email);
    if (owner && owner.id !== exceptUserId) {
      throw new ValidationError('Email already exists');
    }
  }
}

// ============================================
// Shared helpers
// ============================================

function isPresent(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function requireId(id: string | undefined): void {
  if (!id) {
    throw new ValidationError('User ID is required');
  }
}
