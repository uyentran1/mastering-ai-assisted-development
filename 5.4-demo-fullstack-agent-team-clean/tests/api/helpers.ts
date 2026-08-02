/**
 * Shared harness for the API integration tests.
 *
 * The real Express app is bound to an ephemeral port and driven over real HTTP
 * with Node's global fetch. Nothing is stubbed: routes, middleware, validation
 * and the mock database are all the production code paths.
 */

import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { app } from '../../src/api/server';

export { db } from '../../src/api/db/mock';

/** Seeded tokens that exist after every `db.reset()`. */
export const USER_1_TOKEN = 'mock-token-user-1';
export const USER_2_TOKEN = 'mock-token-user-2';

export interface Envelope<T> {
  data: T | null;
  error: string | null;
}

export interface ApiResult<T> {
  status: number;
  /** Parsed `{ data, error }` envelope, or null when the body was empty. */
  body: Envelope<T> | null;
  /** Raw response text, for asserting that a body is genuinely empty. */
  text: string;
  headers: Headers;
}

export interface RequestOptions {
  /** Bearer token to send. Omit for an unauthenticated request. */
  token?: string;
  /** Value JSON-stringified into the request body. */
  body?: unknown;
  /** Raw body text, used to send deliberately malformed JSON. */
  raw?: string;
  /** Extra/overriding headers, e.g. a malformed Authorization header. */
  headers?: Record<string, string>;
}

let server: Server | null = null;
let baseUrl = '';

/** Bind the real app to a free port. Call from `beforeAll`. */
export async function startServer(): Promise<void> {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const address = server?.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
}

/** Release the port. Call from `afterAll`. */
export async function stopServer(): Promise<void> {
  const current = server;
  server = null;
  if (!current) return;
  await new Promise<void>((resolve) => current.close(() => resolve()));
}

/** Perform a real HTTP request against the bound app. */
export async function call<T = unknown>(
  method: string,
  path: string,
  options: RequestOptions = {}
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {};
  let payload: string | undefined;

  if (options.raw !== undefined) {
    payload = options.raw;
    headers['Content-Type'] = 'application/json';
  } else if (options.body !== undefined) {
    payload = JSON.stringify(options.body);
    headers['Content-Type'] = 'application/json';
  }

  if (options.token !== undefined) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  Object.assign(headers, options.headers ?? {});

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: payload,
  });

  const text = await response.text();
  return {
    status: response.status,
    body: text === '' ? null : (JSON.parse(text) as Envelope<T>),
    text,
    headers: response.headers,
  };
}

/** Assert a successful envelope and return its payload, narrowed. */
export function expectData<T>(result: ApiResult<T>, status: number): T {
  expect(result.status).toBe(status);
  expect(result.body).not.toBeNull();
  expect(result.body?.error).toBeNull();
  expect(result.body?.data).not.toBeNull();
  return result.body?.data as T;
}

/** Assert a failure envelope: correct status, exact message, `data: null`. */
export function expectError<T>(result: ApiResult<T>, status: number, error: string): void {
  expect(result.status).toBe(status);
  expect(result.body).toEqual({ data: null, error });
}
