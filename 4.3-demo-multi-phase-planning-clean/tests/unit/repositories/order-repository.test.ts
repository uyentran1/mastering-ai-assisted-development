/**
 * InMemoryOrderRepository unit tests.
 *
 * Storage semantics only — no validation lives in this layer.
 */

import { InMemoryOrderRepository } from '../../../src/refactored/repositories/order-repository';
import { Order } from '../../../src/refactored/types';

let repo: InMemoryOrderRepository;

beforeEach(() => {
  repo = new InMemoryOrderRepository();
});

const NEW_ORDER: Omit<Order, 'id'> = {
  user_id: 'user-1',
  items: [{ price: 10, quantity: 2 }],
  total: 20,
  status: 'pending',
  created_at: '2020-01-01T00:00:00.000Z',
};

it('starts empty', async () => {
  await expect(repo.findAll()).resolves.toEqual([]);
});

it('assigns an id and round-trips the order', async () => {
  const created = await repo.create(NEW_ORDER);

  expect(created.id).toMatch(/^order-/);
  await expect(repo.findById(created.id)).resolves.toEqual(created);
});

it('assigns distinct ids to orders created in the same millisecond', async () => {
  const [a, b] = await Promise.all([repo.create(NEW_ORDER), repo.create(NEW_ORDER)]);

  expect(a.id).not.toBe(b.id);
});

it('returns null for an unknown id', async () => {
  await expect(repo.findById('order-999')).resolves.toBeNull();
});

it('lists every stored order', async () => {
  await repo.create(NEW_ORDER);
  await repo.create({ ...NEW_ORDER, total: 55 });

  await expect(repo.findAll()).resolves.toHaveLength(2);
});

it('does not let callers mutate stored orders through returned objects', async () => {
  const created = await repo.create(NEW_ORDER);

  created.total = 9999;

  await expect(repo.findById(created.id)).resolves.toMatchObject({ total: 20 });
});
