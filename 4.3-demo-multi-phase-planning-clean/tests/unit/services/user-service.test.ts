/**
 * UserService unit tests.
 *
 * The repository is a hand-written fake rather than a jest mock: the service's
 * behaviour depends on stored state (duplicate-email checks, update merges), so
 * a fake that actually stores things reads far better than a pile of
 * mockResolvedValueOnce calls. Storage is still in the fake, not the service,
 * so this remains a unit test of the service.
 */

import { UserService } from '../../../src/refactored/services/user-service';
import { IUserRepository, User } from '../../../src/refactored/types';

class FakeUserRepository implements IUserRepository {
  users: User[] = [];
  private nextId = 1;

  async findAll(): Promise<User[]> {
    return this.users.map(u => ({ ...u }));
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.find(u => u.id === id);
    return user ? { ...user } : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user ? { ...user } : null;
  }

  async create(data: Omit<User, 'id'>): Promise<User> {
    const user: User = { id: `user-${this.nextId++}`, ...data };
    this.users.push(user);
    return { ...user };
  }

  async update(id: string, data: Partial<Omit<User, 'id'>>): Promise<User> {
    const stored = this.users.find(u => u.id === id);
    if (!stored) {
      throw new Error(`unexpected update of missing user ${id}`);
    }
    Object.assign(stored, data);
    return { ...stored };
  }

  async delete(id: string): Promise<void> {
    this.users = this.users.filter(u => u.id !== id);
  }
}

let repo: FakeUserRepository;
let service: UserService;

beforeEach(() => {
  repo = new FakeUserRepository();
  service = new UserService(repo);
});

/** Seeds a user directly through the repository, bypassing service validation. */
async function seedUser(overrides: Partial<Omit<User, 'id'>> = {}): Promise<User> {
  return repo.create({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    created_at: '2020-01-01T00:00:00.000Z',
    ...overrides,
  });
}

describe('getAllUsers', () => {
  it('returns an empty list when there are no users', async () => {
    const result = await service.getAllUsers();

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it('returns every stored user', async () => {
    await seedUser();
    await seedUser({ email: 'grace@example.com', name: 'Grace Hopper' });

    const result = await service.getAllUsers();

    expect(result.data).toHaveLength(2);
  });
});

describe('getUserById', () => {
  it('returns the requested user', async () => {
    const seeded = await seedUser();

    const result = await service.getUserById(seeded.id);

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({ id: seeded.id, email: 'ada@example.com' });
  });

  it('rejects a missing id', async () => {
    const result = await service.getUserById('');

    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({ statusCode: 400, message: 'User ID is required' });
  });

  it('reports an unknown id as not found', async () => {
    const result = await service.getUserById('user-999');

    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({
      statusCode: 404,
      message: 'User user-999 not found',
    });
  });
});

describe('createUser', () => {
  it('creates a user and stamps created_at', async () => {
    const result = await service.createUser('Ada Lovelace', 'ada@example.com');

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({ name: 'Ada Lovelace', email: 'ada@example.com' });
    expect(typeof result.data?.created_at).toBe('string');
    expect(repo.users).toHaveLength(1);
  });

  it('trims surrounding whitespace', async () => {
    const result = await service.createUser('  Ada  ', '  ada@example.com  ');

    expect(result.data).toMatchObject({ name: 'Ada', email: 'ada@example.com' });
  });

  it.each([
    ['undefined name', undefined, 'ada@example.com', 'Name is required'],
    ['blank name', '   ', 'ada@example.com', 'Name is required'],
    ['undefined email', 'Ada', undefined, 'Email is required'],
    ['blank email', 'Ada', '   ', 'Email is required'],
    ['email with no @', 'Ada', 'ada.example.com', 'Invalid email format'],
    ['email with no domain dot', 'Ada', 'ada@example', 'Invalid email format'],
    ['email with a space', 'Ada', 'a da@example.com', 'Invalid email format'],
  ])('rejects %s', async (_label, name, email, message) => {
    const result = await service.createUser(name as string, email as string);

    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({ statusCode: 400, message });
    expect(repo.users).toHaveLength(0);
  });

  it('rejects a duplicate email regardless of case', async () => {
    await seedUser({ email: 'ada@example.com' });

    const result = await service.createUser('Impostor', 'ADA@EXAMPLE.COM');

    expect(result.error).toMatchObject({ statusCode: 400, message: 'Email already exists' });
    expect(repo.users).toHaveLength(1);
  });
});

describe('updateUser', () => {
  it('updates name and email and stamps updated_at', async () => {
    const seeded = await seedUser();

    const result = await service.updateUser(seeded.id, 'Ada B', 'ada.b@example.com');

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({ name: 'Ada B', email: 'ada.b@example.com' });
    expect(typeof result.data?.updated_at).toBe('string');
  });

  it('leaves the name unchanged when it is blank', async () => {
    const seeded = await seedUser({ name: 'Ada Lovelace' });

    const result = await service.updateUser(seeded.id, '   ');

    expect(result.data).toMatchObject({ name: 'Ada Lovelace' });
  });

  it('allows a user to keep their own email', async () => {
    const seeded = await seedUser({ email: 'ada@example.com' });

    const result = await service.updateUser(seeded.id, undefined, 'ada@example.com');

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({ email: 'ada@example.com' });
  });

  it("rejects an email owned by a different user", async () => {
    const ada = await seedUser({ email: 'ada@example.com' });
    await seedUser({ email: 'grace@example.com', name: 'Grace Hopper' });

    const result = await service.updateUser(ada.id, undefined, 'GRACE@example.com');

    expect(result.error).toMatchObject({ statusCode: 400, message: 'Email already exists' });
  });

  it('rejects a malformed email', async () => {
    const seeded = await seedUser();

    const result = await service.updateUser(seeded.id, undefined, 'nope');

    expect(result.error).toMatchObject({ statusCode: 400, message: 'Invalid email format' });
  });

  it('rejects a missing id', async () => {
    const result = await service.updateUser('', 'Ada');

    expect(result.error).toMatchObject({ statusCode: 400, message: 'User ID is required' });
  });

  it('reports an unknown id as not found', async () => {
    const result = await service.updateUser('user-999', 'Ada');

    expect(result.error).toMatchObject({
      statusCode: 404,
      message: 'User user-999 not found',
    });
  });
});

describe('deleteUser', () => {
  it('deletes the user', async () => {
    const seeded = await seedUser();

    const result = await service.deleteUser(seeded.id);

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ success: true });
    expect(repo.users).toHaveLength(0);
  });

  it('rejects a missing id', async () => {
    const result = await service.deleteUser('');

    expect(result.error).toMatchObject({ statusCode: 400, message: 'User ID is required' });
  });

  it('reports an unknown id as not found', async () => {
    const result = await service.deleteUser('user-999');

    expect(result.error).toMatchObject({
      statusCode: 404,
      message: 'User user-999 not found',
    });
  });
});
