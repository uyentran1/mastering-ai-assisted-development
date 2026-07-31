/**
 * Integration tests for the invitations route layer.
 *
 * Supertest is not installed, so we spin up a real HTTP server on an
 * ephemeral port (`app.listen(0)`) and exercise it with the global
 * `fetch` (available in Node >= 18). The router is built against a
 * fresh InvitationService backed by fresh in-memory repositories, so
 * this suite never shares state with tests/service.test.ts or
 * tests/repository.test.ts.
 */

import express, { Express } from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { createInvitationRouter } from '../src/invitations/routes';
import { InvitationService } from '../src/invitations/service';
import { InvitationRepository, UserRepository } from '../src/invitations/repository';

describe('invitations routes', () => {
  let app: Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const service = new InvitationService(new InvitationRepository(), new UserRepository());
    app = express();
    app.use(express.json());
    app.use(createInvitationRouter(service));

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  async function post(
    path: string,
    body: unknown,
    headers: Record<string, string> = {}
  ): Promise<{ status: number; json: any }> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return { status: res.status, json };
  }

  async function get(path: string): Promise<{ status: number; json: any }> {
    const res = await fetch(`${baseUrl}${path}`);
    const json = await res.json();
    return { status: res.status, json };
  }

  async function createInvitation(
    email: string,
    userId = 'creator-1'
  ): Promise<{ status: number; json: any }> {
    return post('/invitations', { email }, { 'x-user-id': userId });
  }

  describe('POST /invitations', () => {
    it('returns 201 with a token and expiresAt on success', async () => {
      const { status, json } = await createInvitation('alice@example.com');
      expect(status).toBe(201);
      expect(typeof json.token).toBe('string');
      expect(json.token.length).toBeGreaterThan(0);
      expect(typeof json.expiresAt).toBe('string');
      expect(new Date(json.expiresAt).toString()).not.toBe('Invalid Date');
    });

    it('returns 400 INVALID_EMAIL for a missing email', async () => {
      const { status, json } = await post('/invitations', {}, { 'x-user-id': 'creator-2' });
      expect(status).toBe(400);
      expect(json.error.code).toBe('INVALID_EMAIL');
    });

    it('returns 400 INVALID_EMAIL for a non-string email', async () => {
      const { status, json } = await post('/invitations', { email: 12345 }, { 'x-user-id': 'creator-2' });
      expect(status).toBe(400);
      expect(json.error.code).toBe('INVALID_EMAIL');
    });

    it('returns 400 INVALID_EMAIL for an empty string email', async () => {
      const { status, json } = await post('/invitations', { email: '   ' }, { 'x-user-id': 'creator-2' });
      expect(status).toBe(400);
      expect(json.error.code).toBe('INVALID_EMAIL');
    });

    it('returns 400 INVALID_EMAIL for a malformed email (service-level validation)', async () => {
      const { status, json } = await createInvitation('not-an-email', 'creator-3');
      expect(status).toBe(400);
      expect(json.error.code).toBe('INVALID_EMAIL');
    });

    it('returns 400 EMAIL_EXISTS when the email already has a pending invitation', async () => {
      await createInvitation('bob@example.com', 'creator-4');
      const { status, json } = await createInvitation('bob@example.com', 'creator-4');
      expect(status).toBe(400);
      expect(json.error.code).toBe('EMAIL_EXISTS');
    });

    it('returns 429 RATE_LIMITED on the 6th pending invitation from the same user', async () => {
      const userId = 'rate-limited-user';
      for (let i = 0; i < 5; i++) {
        const { status } = await createInvitation(`rate-user-${i}@example.com`, userId);
        expect(status).toBe(201);
      }
      const { status, json } = await createInvitation('rate-user-6@example.com', userId);
      expect(status).toBe(429);
      expect(json.error.code).toBe('RATE_LIMITED');
    });
  });

  describe('POST /invitations/:token/redeem', () => {
    it('returns 200 with the created user on success', async () => {
      const { json: created } = await createInvitation('redeem-happy@example.com', 'creator-5');
      const token = created.token as string;

      const { status, json } = await post(
        `/invitations/${encodeURIComponent(token)}/redeem`,
        { name: 'Redeem Person', password: 'Passw0rd1' }
      );

      expect(status).toBe(200);
      expect(json.user).toEqual({
        id: expect.any(String),
        email: 'redeem-happy@example.com',
        name: 'Redeem Person',
      });
      expect(typeof json.message).toBe('string');
    });

    it('never leaks a password hash in the response body', async () => {
      const { json: created } = await createInvitation('no-hash-leak@example.com', 'creator-5b');
      const token = created.token as string;

      const { json } = await post(
        `/invitations/${encodeURIComponent(token)}/redeem`,
        { name: 'No Leak', password: 'Passw0rd1' }
      );

      const serialized = JSON.stringify(json);
      expect(serialized).not.toMatch(/password_hash/i);
      expect(serialized).not.toMatch(/passw0rd1/i);
      expect(json.user.password_hash).toBeUndefined();
      expect(json.user.password).toBeUndefined();
    });

    it('returns 404 TOKEN_NOT_FOUND for an unknown token', async () => {
      const { status, json } = await post(
        `/invitations/${encodeURIComponent('totally-bogus-token==')}/redeem`,
        { name: 'Nobody', password: 'Passw0rd1' }
      );
      expect(status).toBe(404);
      expect(json.error.code).toBe('TOKEN_NOT_FOUND');
    });

    it('returns 400 TOKEN_REDEEMED when redeeming an already-redeemed token', async () => {
      const { json: created } = await createInvitation('redeem-twice@example.com', 'creator-6');
      const token = created.token as string;

      const first = await post(
        `/invitations/${encodeURIComponent(token)}/redeem`,
        { name: 'First Time', password: 'Passw0rd1' }
      );
      expect(first.status).toBe(200);

      const second = await post(
        `/invitations/${encodeURIComponent(token)}/redeem`,
        { name: 'Second Time', password: 'Passw0rd1' }
      );
      expect(second.status).toBe(400);
      expect(second.json.error.code).toBe('TOKEN_REDEEMED');
    });

    it('returns 400 WEAK_PASSWORD for a password missing complexity', async () => {
      const { json: created } = await createInvitation('weak-pw@example.com', 'creator-7');
      const token = created.token as string;

      const { status, json } = await post(
        `/invitations/${encodeURIComponent(token)}/redeem`,
        { name: 'Weak Password', password: 'alllowercase1' }
      );
      expect(status).toBe(400);
      expect(json.error.code).toBe('WEAK_PASSWORD');
    });

    it('returns 400 INVALID_PASSWORD for a password shorter than 8 characters', async () => {
      const { json: created } = await createInvitation('short-pw@example.com', 'creator-8');
      const token = created.token as string;

      const { status, json } = await post(
        `/invitations/${encodeURIComponent(token)}/redeem`,
        { name: 'Short Password', password: 'Ab1' }
      );
      expect(status).toBe(400);
      expect(json.error.code).toBe('INVALID_PASSWORD');
    });

    it('returns 400 INVALID_NAME for an empty name', async () => {
      const { json: created } = await createInvitation('empty-name@example.com', 'creator-9');
      const token = created.token as string;

      const { status, json } = await post(
        `/invitations/${encodeURIComponent(token)}/redeem`,
        { name: '   ', password: 'Passw0rd1' }
      );
      expect(status).toBe(400);
      expect(json.error.code).toBe('INVALID_NAME');
    });

    it('returns 400 INVALID_NAME for a missing name', async () => {
      const { json: created } = await createInvitation('missing-name@example.com', 'creator-10');
      const token = created.token as string;

      const { status, json } = await post(
        `/invitations/${encodeURIComponent(token)}/redeem`,
        { password: 'Passw0rd1' }
      );
      expect(status).toBe(400);
      expect(json.error.code).toBe('INVALID_NAME');
    });

    it('does not echo the raw token in the not-found error message', async () => {
      const bogusToken = 'super-secret-bogus-token-value';
      const { json } = await post(
        `/invitations/${encodeURIComponent(bogusToken)}/redeem`,
        { name: 'Nobody', password: 'Passw0rd1' }
      );
      expect(json.error.message).not.toContain(bogusToken);
    });
  });

  describe('GET /invitations/pending', () => {
    it('returns 200 with pending invitations and never includes a token field', async () => {
      await createInvitation('pending-list@example.com', 'creator-11');

      const { status, json } = await get('/invitations/pending');
      expect(status).toBe(200);
      expect(Array.isArray(json)).toBe(true);

      const match = json.find((inv: { email: string }) => inv.email === 'pending-list@example.com');
      expect(match).toBeDefined();
      expect(match).toEqual({
        email: 'pending-list@example.com',
        expiresAt: expect.any(String),
        createdBy: 'creator-11',
        createdAt: expect.any(String),
      });
      expect(match.token).toBeUndefined();

      const serialized = JSON.stringify(json);
      expect(serialized).not.toMatch(/"token"/);
    });
  });
});
