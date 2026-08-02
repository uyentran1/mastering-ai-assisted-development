/**
 * Response envelope helpers and validation primitives.
 *
 * EVERY response this API emits — success or failure — is an ApiResponse<T>:
 *   success: { data: <payload>, error: null }
 *   failure: { data: null, error: "<message>" }
 * There are no bare payloads anywhere. The frontend depends on that.
 */

import { Response } from 'express';
import { ApiResponse, TaskPriority, TaskStatus } from '../../shared/types';

/** Send a success envelope. */
export function ok<T>(res: Response, status: number, data: T): Response {
  const body: ApiResponse<T> = { data, error: null };
  return res.status(status).json(body);
}

/** Send an error envelope. */
export function fail(res: Response, status: number, error: string): Response {
  const body: ApiResponse<null> = { data: null, error };
  return res.status(status).json(body);
}

// ==========================================
// Validation primitives
// ==========================================

/** True for `{...}` — rejects null, arrays and every primitive. */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/** A string with at least one non-whitespace character. */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Deliberately permissive: `something@something.tld`, no whitespace. */
export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** A 6-digit hex color, e.g. `#3B82F6`. */
export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

const TASK_STATUSES: readonly TaskStatus[] = ['todo', 'in-progress', 'done'];
const TASK_PRIORITIES: readonly TaskPriority[] = ['low', 'medium', 'high'];

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && (TASK_STATUSES as readonly string[]).includes(value);
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return typeof value === 'string' && (TASK_PRIORITIES as readonly string[]).includes(value);
}

/** Human-readable list for error messages, e.g. `'todo', 'in-progress', 'done'`. */
export function quotedList(values: readonly string[]): string {
  return values.map((v) => `'${v}'`).join(', ');
}

export const TASK_STATUS_VALUES = TASK_STATUSES;
export const TASK_PRIORITY_VALUES = TASK_PRIORITIES;
