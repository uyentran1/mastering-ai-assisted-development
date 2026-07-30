/**
 * InMemoryUserRepository unit tests.
 *
 * Storage semantics only: what round-trips, what raises NotFoundError, and that
 * callers cannot mutate stored state through a returned object.
 */

import { InMemoryUserRepository } from '../../../src/refactored/repositories/user-repository';
import { NotFoundError, User } from '../../../src/refactored/types';

let repo: InMemoryUserRepository;

beforeEach(() => {
  repo = new InMemoryUserRepository();
});

const NEW_USER: Omit<User, 'id'> = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  created_at: '2020-01-01T00:00:00.000Z',
};

describe('create and read', () => {
  it('assigns an id and round-trips the user', async () => {
    const created = await repo.create(NEW_USER);

    expect(created.id).toMatch(/^user-/);
    await expect(repo.findById(created.id)).resolves.toEqual(created);
  });

  it('starts empty', async () => {
    await expect(repo.findAll()).resolves.toEqual([]);
  });

  it('assigns distinct ids to users created in the same millisecond', async () => {
    const [a, b] = await Promise.all([
      repo.create(NEW_USER),
      repo.create({ ...NEW_USER, email: 'grace@example.com' }),
    ]);

    expect(a.id).not.toBe(b.id);
  });

  it('returns null for an unknown id', async () => {
    await expect(repo.findById('user-999')).resolves.toBeNull();
  });
});

describe('findByEmail', () => {
  it('matches case-insensitively', async () => {
    const created = await repo.create(NEW_USER);

    await expect(repo.findByEmail('ADA@EXAMPLE.COM')).resolves.toEqual(created);
  });

  it('returns null for an unknown email', async () => {
    await expect(repo.findByEmail('nobody@example.com')).resolves.toBeNull();
  });
});

describe('update', () => {
  it('merges the given fields and leaves the rest alone', async () => {
    const created = await repo.create(NEW_USER);

    const updated = await repo.update(created.id, { name: 'Ada B' });

    expect(updated).toMatchObject({ name: 'Ada B', email: 'ada@example.com' });
    await expect(repo.findById(created.id)).resolves.toMatchObject({ name: 'Ada B' });
  });

  it('throws NotFoundError for an unknown id', async () => {
    await expect(repo.update('user-999', { name: 'Ada' })).rejects.toThrow(NotFoundError);
  });
});

describe('delete', () => {
  it('removes the user', async () => {
    const created = await repo.create(NEW_USER);

    await repo.delete(created.id);

    await expect(repo.findById(created.id)).resolves.toBeNull();
    await expect(repo.findAll()).resolves.toEqual([]);
  });

  it('throws NotFoundError for an unknown id', async () => {
    await expect(repo.delete('user-999')).rejects.toThrow(NotFoundError);
  });
});

describe('isolation', () => {
  it('does not let callers mutate stored users through returned objects', async () => {
    const created = await repo.create(NEW_USER);

    created.name = 'tampered';
    (await repo.findAll())[0].email = 'tampered@example.com';

    await expect(repo.findById(created.id)).resolves.toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
  });
});
