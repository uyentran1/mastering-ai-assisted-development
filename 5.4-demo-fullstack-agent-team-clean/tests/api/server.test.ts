/**
 * App-level behaviour: health, the CORS layer, the catch-all 404 and the
 * terminal error handler.
 */

import { call, db, expectData, expectError, startServer, stopServer } from './helpers';

beforeAll(startServer);
afterAll(stopServer);
beforeEach(() => db.reset());

describe('GET /api/health', () => {
  it('returns 200 with the ok envelope', async () => {
    const result = await call<{ status: string }>('GET', '/api/health');
    expect(expectData(result, 200)).toEqual({ status: 'ok' });
  });

  it('needs no authentication', async () => {
    const result = await call('GET', '/api/health', { headers: {} });
    expect(result.status).toBe(200);
  });
});

describe('CORS', () => {
  it('answers a preflight with 204 and no body', async () => {
    const result = await call('OPTIONS', '/api/projects');
    expect(result.status).toBe(204);
    expect(result.text).toBe('');
  });

  it('sets the permissive CORS headers on a normal response', async () => {
    const result = await call('GET', '/api/health');
    expect(result.headers.get('access-control-allow-origin')).toBe('*');
    expect(result.headers.get('access-control-allow-headers')).toContain('Authorization');
  });
});

describe('fallbacks', () => {
  it('returns 404 "Not found" for an unmatched route', async () => {
    expectError(await call('GET', '/api/nope'), 404, 'Not found');
  });

  it('returns 404 "Not found" for a non-/api path', async () => {
    expectError(await call('GET', '/totally/other'), 404, 'Not found');
  });

  it('returns 400 "Invalid JSON body" for malformed JSON', async () => {
    const result = await call('POST', '/api/auth/signin', { raw: '{"email":' });
    expectError(result, 400, 'Invalid JSON body');
  });
});
