/**
 * AddTaskForm — collapsible inline form living at the foot of one Kanban
 * column. Every testid is suffixed with that column's status, so the three
 * instances on a board never collide.
 *
 * The column a task is added from is *not* part of `CreateTaskRequest` — the
 * API always creates tasks as `todo`. The status is passed to `onCreateTask`
 * alongside the request body and it is the owner's job to get the task into
 * that column (App follows the create with a status PATCH).
 *
 * The callback's promise is the contract for what happened:
 *   resolves -> the task is in this column; the form clears and collapses.
 *   rejects  -> something went wrong; the form stays open with the values
 *               intact and shows the rejection message.
 */

import React, { useState } from 'react';
import type { CreateTaskRequest, TaskPriority, TaskStatus } from '../../shared/types';

/** Matches the API default for a task created without a priority. */
export const DEFAULT_TASK_PRIORITY: TaskPriority = 'medium';

const PRIORITY_OPTIONS: readonly TaskPriority[] = ['low', 'medium', 'high'];

export interface AddTaskFormProps {
  /** The column this form adds into. Suffixes every testid and id. */
  status: TaskStatus;
  /** Human readable column name, used in the button label. */
  columnTitle: string;
  /**
   * Create the task and place it in `status`. Rejecting with an Error surfaces
   * its message on the form. Omitted, the control still renders but submitting
   * does nothing.
   */
  onCreateTask?: (status: TaskStatus, input: CreateTaskRequest) => Promise<void>;
}

function messageOf(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export const AddTaskForm: React.FC<AddTaskFormProps> = ({
  status,
  columnTitle,
  onCreateTask,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>(DEFAULT_TASK_PRIORITY);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  function reset(): void {
    setTitle('');
    setDescription('');
    setPriority(DEFAULT_TASK_PRIORITY);
    setError(null);
  }

  function handleToggle(): void {
    setError(null);
    setIsOpen((open) => !open);
  }

  function handleCancel(): void {
    reset();
    setIsOpen(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      // Same wording the API uses, so both paths read identically.
      setError('Title is required');
      return;
    }

    const input: CreateTaskRequest = { title: trimmedTitle, priority };

    const trimmedDescription = description.trim();
    if (trimmedDescription) {
      input.description = trimmedDescription;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onCreateTask?.(status, input);
      reset();
      setIsOpen(false);
    } catch (err: unknown) {
      setError(messageOf(err, 'Unable to create task'));
      // Cancel stays live during a request, so the form may have been closed
      // while this one was in flight. Reopen it rather than write the message
      // somewhere nothing renders: a failed create must never pass unseen.
      setIsOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        data-testid={`add-task-button-${status}`}
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-label={`Add task to ${columnTitle}`}
        className="w-full rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 hover:bg-white"
      >
        + Add task
      </button>

      {isOpen && (
        <form
          data-testid={`add-task-form-${status}`}
          onSubmit={handleSubmit}
          className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
        >
          <div>
            <label
              htmlFor={`add-task-title-${status}`}
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Title
            </label>
            <input
              id={`add-task-title-${status}`}
              data-testid={`add-task-title-${status}`}
              type="text"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={`add-task-description-${status}`}
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Description
            </label>
            <input
              id={`add-task-description-${status}`}
              data-testid={`add-task-description-${status}`}
              type="text"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={`add-task-priority-${status}`}
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Priority
            </label>
            <select
              id={`add-task-priority-${status}`}
              data-testid={`add-task-priority-${status}`}
              name="priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm capitalize text-slate-900 focus:border-blue-500 focus:outline-none"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p
              data-testid={`add-task-error-${status}`}
              role="alert"
              className="text-xs text-red-600"
            >
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              data-testid={`add-task-submit-${status}`}
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting ? 'Adding…' : 'Create task'}
            </button>
            <button
              data-testid={`add-task-cancel-${status}`}
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddTaskForm;
