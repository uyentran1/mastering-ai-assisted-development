/**
 * KanbanBoard — three fixed status columns with drag-and-drop between them.
 *
 * The board is presentational: it never mutates tasks. Dropping a card calls
 * `onTaskMove`, and the owner (App) applies the optimistic update.
 */

import React, { useState } from 'react';
import type { CreateTaskRequest, Project, Task, TaskStatus } from '../../shared/types';
import { AddTaskForm } from './AddTaskForm';
import { TaskCard } from './TaskCard';

export interface KanbanColumn {
  status: TaskStatus;
  title: string;
}

/** The three columns, in display order. */
export const KANBAN_COLUMNS: readonly KanbanColumn[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
];

export interface KanbanBoardProps {
  /** Tasks to distribute across the columns. Already scoped to one project. */
  tasks: Task[];
  /** The project the board belongs to; used for the board heading. */
  project?: Project;
  /** Called when a card is dropped into a different column. */
  onTaskMove: (taskId: string, status: TaskStatus) => void;
  /** Seam for a future task detail view. No UI is wired behind it yet. */
  onSelectTask?: (taskId: string) => void;
  /**
   * Create a task and place it in `status` — every column has its own form.
   * The API always creates tasks as `todo`, so landing one in another column
   * is the owner's responsibility. Rejecting with an Error surfaces its
   * message on that column's form.
   */
  onCreateTask?: (status: TaskStatus, input: CreateTaskRequest) => Promise<void>;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  project,
  onTaskMove,
  onSelectTask,
  onCreateTask,
}) => {
  // Fallback for environments where drop events carry no usable dataTransfer.
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  function handleDragStart(taskId: string): void {
    setDraggingTaskId(taskId);
  }

  function handleDragEnd(): void {
    setDraggingTaskId(null);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>, status: TaskStatus): void {
    event.preventDefault();

    let transferred: string | null = null;
    try {
      transferred = event.dataTransfer?.getData('text/plain') || null;
    } catch {
      transferred = null;
    }

    const taskId = transferred ?? draggingTaskId;
    setDraggingTaskId(null);

    if (!taskId) {
      return;
    }

    const task = tasks.find((candidate) => candidate.id === taskId);
    if (!task || task.status === status) {
      return;
    }

    onTaskMove(taskId, status);
  }

  return (
    <section data-testid="kanban-board" className="px-6 py-8">
      <h2
        data-testid="kanban-board-title"
        className="mb-6 text-xl font-semibold text-slate-900"
      >
        {project ? project.name : 'Board'}
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {KANBAN_COLUMNS.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.status);

          return (
            <div
              key={column.status}
              data-testid={`kanban-column-${column.status}`}
              data-column-status={column.status}
              onDragOver={handleDragOver}
              onDrop={(event) => handleDrop(event, column.status)}
              className="flex min-h-[12rem] flex-col rounded-xl bg-slate-100 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3
                  data-testid={`kanban-column-title-${column.status}`}
                  className="text-sm font-semibold uppercase tracking-wide text-slate-600"
                >
                  {column.title}
                </h3>
                <span
                  data-testid={`kanban-column-count-${column.status}`}
                  className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600"
                >
                  {columnTasks.length}
                </span>
              </div>

              <div
                data-testid={`kanban-column-tasks-${column.status}`}
                className="flex flex-1 flex-col gap-2"
              >
                {columnTasks.length === 0 ? (
                  <p
                    data-testid={`kanban-column-empty-${column.status}`}
                    className="text-xs text-slate-400"
                  >
                    No tasks
                  </p>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onSelectTask={onSelectTask}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))
                )}
              </div>

              <AddTaskForm
                status={column.status}
                columnTitle={column.title}
                onCreateTask={onCreateTask}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default KanbanBoard;
