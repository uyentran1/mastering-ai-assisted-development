/**
 * Network bridge for the App-level tests.
 *
 * jsdom ships no `fetch`, and the frontend client calls relative URLs
 * (`/api/...`). Rather than stub the API — which would mean asserting against
 * invented responses — this installs a `fetch` implementation that resolves
 * those relative URLs against the REAL Express app bound to an ephemeral port
 * and speaks to it over real HTTP via node:http.
 *
 * Nothing belonging to the frontend is replaced: the components, the hook and
 * `src/frontend/api.ts` all run untouched. Only the transport jsdom is missing
 * is supplied, and every call made through it is recorded so tests can assert
 * that a render performed no network I/O at all.
 */

import http from 'http';
import type { AddressInfo } from 'net';
import { app } from '../../src/api/server';

export { db } from '../../src/api/db/mock';

/** Every request the frontend made through the bridge, in order. */
export const networkCalls: Array<{ method: string; path: string }> = [];

interface BridgeInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface BridgeResponse {
  status: number;
  ok: boolean;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

let server: http.Server | null = null;
let baseUrl = '';
let originalFetch: unknown;

/** Path whose response is currently being withheld from the client. */
let heldPath: string | null = null;
/**
 * Method the hold is narrowed to, or null for "any method". One path can serve
 * more than one verb (`/api/projects/:id/tasks` is both the board load and the
 * task create), and a race is only reproducible when exactly one of them is
 * delayed.
 */
let heldMethod: string | null = null;
/** Resolvers parked while `heldPath` is set. */
const parked: Array<() => void> = [];

/**
 * Simulate a slow response for the next request to `path`: the request is sent
 * and the server answers immediately, but the client only sees the answer once
 * the returned release function is called. Nothing about the request or the
 * response is altered — only its arrival time.
 *
 * Pass `method` to delay only that verb; omit it to delay every request to the
 * path, which is the original behaviour.
 */
export function holdResponse(path: string, method?: string): () => void {
  heldPath = path;
  heldMethod = method ? method.toUpperCase() : null;
  return () => {
    heldPath = null;
    heldMethod = null;
    parked.splice(0).forEach((release) => release());
  };
}

function bridgeFetch(input: unknown, init: BridgeInit = {}): Promise<BridgeResponse> {
  const url = new URL(String(input), baseUrl);
  const method = (init.method ?? 'GET').toUpperCase();
  const path = `${url.pathname}${url.search}`;
  networkCalls.push({ method, path });

  return new Promise<BridgeResponse>((resolve, reject) => {
    const request = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path,
        method,
        headers: init.headers ?? {},
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          const status = response.statusCode ?? 0;
          const deliver = (): void =>
            resolve({
              status,
              ok: status >= 200 && status < 300,
              text: () => Promise.resolve(text),
              json: () => Promise.resolve(JSON.parse(text) as unknown),
            });

          if (heldPath === path && (heldMethod === null || heldMethod === method)) {
            parked.push(deliver);
            return;
          }
          deliver();
        });
      }
    );

    request.on('error', reject);
    if (init.body !== undefined) {
      request.write(init.body);
    }
    request.end();
  });
}

/** Bind the real API and route the frontend's fetch calls to it. */
export async function startBridge(): Promise<void> {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const address = server?.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;

  const globals = globalThis as unknown as Record<string, unknown>;
  originalFetch = globals.fetch;
  globals.fetch = bridgeFetch;
}

/** Restore the environment and release the port. */
export async function stopBridge(): Promise<void> {
  heldPath = null;
  heldMethod = null;
  parked.splice(0).forEach((release) => release());

  const globals = globalThis as unknown as Record<string, unknown>;
  globals.fetch = originalFetch;

  const current = server;
  server = null;
  if (!current) return;
  await new Promise<void>((resolve) => current.close(() => resolve()));
}
