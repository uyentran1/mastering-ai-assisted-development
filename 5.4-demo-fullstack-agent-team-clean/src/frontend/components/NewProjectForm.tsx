/**
 * NewProjectForm — collapsible inline form for creating a project.
 *
 * The form owns only its own field state, its expanded/collapsed state and the
 * message from the last failed attempt. It never touches the project list:
 * submitting hands a `CreateProjectRequest` to `onCreateProject` and the owner
 * (App) decides whether that means a POST or a purely local append.
 *
 * The callback's promise is the contract for what happened:
 *   resolves -> the project exists; the form clears and collapses.
 *   rejects  -> nothing was created; the form stays open with the values
 *               intact and shows the rejection message.
 */

import React, { useState } from 'react';
import type { CreateProjectRequest } from '../../shared/types';

/** Matches the API default, so an untouched form sends what it would anyway. */
export const DEFAULT_PROJECT_COLOR = '#3B82F6';

export interface NewProjectFormProps {
  /**
   * Create the project. Rejecting with an Error surfaces its message on the
   * form. Omitted, the control still renders but submitting does nothing.
   */
  onCreateProject?: (input: CreateProjectRequest) => Promise<void>;
}

function messageOf(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export const NewProjectForm: React.FC<NewProjectFormProps> = ({ onCreateProject }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [color, setColor] = useState<string>(DEFAULT_PROJECT_COLOR);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  function reset(): void {
    setName('');
    setDescription('');
    setColor(DEFAULT_PROJECT_COLOR);
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

    const trimmedName = name.trim();
    if (!trimmedName) {
      // Same wording the API uses, so both paths read identically.
      setError('Name is required');
      return;
    }

    const input: CreateProjectRequest = { name: trimmedName };

    const trimmedDescription = description.trim();
    if (trimmedDescription) {
      input.description = trimmedDescription;
    }

    const trimmedColor = color.trim();
    if (trimmedColor) {
      input.color = trimmedColor;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onCreateProject?.(input);
      reset();
      setIsOpen(false);
    } catch (err: unknown) {
      setError(messageOf(err, 'Unable to create project'));
      // Cancel stays live during a request, so the form may have been closed
      // while this one was in flight. Reopen it rather than write the message
      // somewhere nothing renders: a failed create must never pass unseen.
      setIsOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mb-6">
      <button
        data-testid="new-project-button"
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        + New project
      </button>

      {isOpen && (
        <form
          data-testid="new-project-form"
          onSubmit={handleSubmit}
          className="mt-4 max-w-md space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div>
            <label
              htmlFor="new-project-name"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Name
            </label>
            <input
              id="new-project-name"
              data-testid="new-project-name"
              type="text"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-project-description"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Description
            </label>
            <input
              id="new-project-description"
              data-testid="new-project-description"
              type="text"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-project-color"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Color
            </label>
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                style={{ backgroundColor: color }}
                className="h-4 w-4 shrink-0 rounded-full border border-slate-300"
              />
              <input
                id="new-project-color"
                data-testid="new-project-color"
                type="text"
                name="color"
                placeholder={DEFAULT_PROJECT_COLOR}
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="w-32 rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p
              data-testid="new-project-error"
              role="alert"
              className="text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              data-testid="new-project-submit"
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting ? 'Creating…' : 'Create project'}
            </button>
            <button
              data-testid="new-project-cancel"
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewProjectForm;
