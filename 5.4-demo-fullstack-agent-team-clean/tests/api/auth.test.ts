/**
 * Auth routes: signup, signin, signout (revocation) and /me.
 */

import type { AuthResponse, User } from '../../src/shared/types';
import {
  USER_1_TOKEN,
  USER_2_TOKEN,
  call,
  db,
  expectData,
  expectError,
  startServer,
  stopServer,
} from './helpers';

beforeAll(startServer);
afterAll(stopServer);
beforeEach(() => db.reset());

describe('POST /api/auth/signup', () => {
  it('creates an account and deliberately returns no token', async () => {
    const result = await call<AuthResponse>('POST', '/api/auth/signup', {
      body: { email: 'new@example.com', password: 'password123' },
    });
    const data = expectData(result, 201);

    expect(data.user_id).toBe('user-3');
    expect(data.email).toBe('new@example.com');
    expect(data.message).toBe('Account created');
    expect(data.token).toBeUndefined();
  });

  it('rejects a duplicate email with 409', async () => {
    const result = await call('POST', '/api/auth/signup', {
      body: { email: 'demo@example.com', password: 'password123' },
    });
    expectError(result, 409, 'Email already registered');
  });

  it('rejects a duplicate email case-insensitively', async () => {
    const result = await call('POST', '/api/auth/signup', {
      body: { email: 'DEMO@example.com', password: 'password123' },
    });
    expectError(result, 409, 'Email already registered');
  });

  it('rejects an invalid email with 400', async () => {
    const result = await call('POST', '/api/auth/signup', {
      body: { email: 'not-an-email', password: 'password123' },
    });
    expectError(result, 400, 'A valid email is required');
  });

  it('rejects a password shorter than 8 characters with 400', async () => {
    const result = await call('POST', '/api/auth/signup', {
      body: { email: 'short@example.com', password: 'seven77' },
    });
    expectError(result, 400, 'Password must be at least 8 characters');
  });

  it('rejects a non-object JSON body with 400', async () => {
    const result = await call('POST', '/api/auth/signup', { body: [] });
    expectError(result, 400, 'Request body must be a JSON object');
  });
});

describe('POST /api/auth/signin', () => {
  it('returns the deterministic token for valid credentials', async () => {
    const result = await call<AuthResponse>('POST', '/api/auth/signin', {
      body: { email: 'demo@example.com', password: 'password123' },
    });
    const data = expectData(result, 200);

    expect(data.token).toBe(USER_1_TOKEN);
    expect(data.user_id).toBe('user-1');
    expect(data.email).toBe('demo@example.com');
    expect(data.message).toBe('Signed in');
  });

  it('rejects a wrong password with 401', async () => {
    const result = await call('POST', '/api/auth/signin', {
      body: { email: 'demo@example.com', password: 'wrong-password' },
    });
    expectError(result, 401, 'Invalid email or password');
  });

  it('rejects an unknown email with 401', async () => {
    const result = await call('POST', '/api/auth/signin', {
      body: { email: 'nobody@example.com', password: 'password123' },
    });
    expectError(result, 401, 'Invalid email or password');
  });

  it('rejects a missing email with 400', async () => {
    const result = await call('POST', '/api/auth/signin', {
      body: { password: 'password123' },
    });
    expectError(result, 400, 'Email is required');
  });

  it('rejects a missing password with 400', async () => {
    const result = await call('POST', '/api/auth/signin', {
      body: { email: 'demo@example.com' },
    });
    expectError(result, 400, 'Password is required');
  });

  it('signs in an account created through signup', async () => {
    await call('POST', '/api/auth/signup', {
      body: { email: 'fresh@example.com', password: 'password123' },
    });

    const signin = await call<AuthResponse>('POST', '/api/auth/signin', {
      body: { email: 'fresh@example.com', password: 'password123' },
    });
    const data = expectData(signin, 200);
    expect(data.token).toBe('mock-token-user-3');

    const me = await call<User>('GET', '/api/auth/me', { token: data.token });
    expect(expectData(me, 200).email).toBe('fresh@example.com');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the User shape whose id field is `id`, not `user_id`', async () => {
    const result = await call<User>('GET', '/api/auth/me', { token: USER_1_TOKEN });
    const user = expectData(result, 200);

    expect(user.id).toBe('user-1');
    expect(user.email).toBe('demo@example.com');
    expect(user).not.toHaveProperty('user_id');
    expect(user).not.toHaveProperty('password');
  });

  it('returns 401 Unauthorized when the header is missing', async () => {
    expectError(await call('GET', '/api/auth/me'), 401, 'Unauthorized');
  });

  it('returns 401 Unauthorized when the scheme is not Bearer', async () => {
    const result = await call('GET', '/api/auth/me', {
      headers: { Authorization: `Token ${USER_1_TOKEN}` },
    });
    expectError(result, 401, 'Unauthorized');
  });

  it('returns 401 Unauthorized when the header has no token', async () => {
    const result = await call('GET', '/api/auth/me', {
      headers: { Authorization: 'Bearer' },
    });
    expectError(result, 401, 'Unauthorized');
  });

  it('returns 401 "Invalid or expired token" for a well-formed unknown token', async () => {
    const result = await call('GET', '/api/auth/me', { token: 'mock-token-nobody' });
    expectError(result, 401, 'Invalid or expired token');
  });
});

describe('POST /api/auth/signout', () => {
  it('requires authentication', async () => {
    expectError(await call('POST', '/api/auth/signout'), 401, 'Unauthorized');
  });

  it('revokes the presented token so it stops working', async () => {
    const first = await call<{ message: string }>('POST', '/api/auth/signout', {
      token: USER_1_TOKEN,
    });
    expect(expectData(first, 200)).toEqual({ message: 'Signed out' });

    const second = await call('POST', '/api/auth/signout', { token: USER_1_TOKEN });
    expectError(second, 401, 'Invalid or expired token');

    const me = await call('GET', '/api/auth/me', { token: USER_1_TOKEN });
    expectError(me, 401, 'Invalid or expired token');
  });

  it('revokes only the presented token, not other sessions', async () => {
    await call('POST', '/api/auth/signout', { token: USER_1_TOKEN });

    const other = await call<User>('GET', '/api/auth/me', { token: USER_2_TOKEN });
    expect(expectData(other, 200).id).toBe('user-2');
  });

  it('lets a revoked user sign in again for a fresh session', async () => {
    await call('POST', '/api/auth/signout', { token: USER_1_TOKEN });

    const signin = await call<AuthResponse>('POST', '/api/auth/signin', {
      body: { email: 'demo@example.com', password: 'password123' },
    });
    expect(expectData(signin, 200).token).toBe(USER_1_TOKEN);
    expect((await call('GET', '/api/auth/me', { token: USER_1_TOKEN })).status).toBe(200);
  });
});
