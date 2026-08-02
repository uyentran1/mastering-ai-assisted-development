/**
 * TaskCard — compact, draggable task display.
 *
 * Drag payload is the task id, written to `dataTransfer` as `text/plain`.
 * KanbanBoard also tracks the id in state because jsdom-driven drag events
 * frequently arrive without a usable `dataTransfer`.
 */

import React from 'react';
import type { Task, TaskPriority } from '../../shared/types';

const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

export interface TaskCardProps {
  /** The task to render. */
  task: Task;
  /** Invoked with the task id when the card is clicked or activated by keyboard. */
  onSelectTask?: (taskId: string) => void;
  /** Called when a drag begins, so the board can remember the dragged id. */
  onDragStart?: (taskId: string) => void;
  /** Called when the drag ends, regardless of whether it was dropped. */
  onDragEnd?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onSelectTask,
  onDragStart,
  onDragEnd,
}) => {
  function handleDragStart(event: React.DragEvent<HTMLDivElement>): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', task.id);
      event.dataTransfer.effectAllowed = 'move';
    }
    onDragStart?.(task.id);
  }

  function handleDragEnd(): void {
    onDragEnd?.();
  }

  function handleClick(): void {
    onSelectTask?.(task.id);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectTask?.(task.id);
    }
  }

  return (
    <div
      data-testid={`task-card-${task.id}`}
      data-task-id={task.id}
      data-task-status={task.status}
      draggable
      role="button"
      tabIndex={0}
      aria-label={task.title}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 active:cursor-grabbing"
    >
      <p data-testid="task-card-title" className="text-sm font-medium text-slate-900">
        {task.title}
      </p>

      {task.description && (
        <p data-testid="task-card-description" className="mt-1 text-xs text-slate-500">
          {task.description}
        </p>
      )}

      <span
        data-testid="task-card-priority"
        className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_CLASSES[task.priority]}`}
      >
        {task.priority}
      </span>
    </div>
  );
};

export default TaskCard;
