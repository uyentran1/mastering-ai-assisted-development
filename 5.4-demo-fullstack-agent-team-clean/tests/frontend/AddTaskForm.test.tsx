/**
 * AddTaskForm — the per-column create-a-task control, in isolation and as
 * KanbanBoard mounts it (one instance per column, testids suffixed by status).
 *
 * The form never decides where the task lands: it hands `(status, input)` to
 * `onCreateTask` and waits on the promise. Everything asserted here is about
 * that handoff and about the form's own visible state.
 */

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MOCK_TASKS, type TaskStatus } from '../../src/shared/types';
import {
  AddTaskForm,
  DEFAULT_TASK_PRIORITY,
} from '../../src/frontend/components/AddTaskForm';
import { KANBAN_COLUMNS, KanbanBoard } from '../../src/frontend/components/KanbanBoard';

/** A promise whose settlement the test controls. */
function deferred(): {
  promise: Promise<void>;
  resolve: () => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = () => res();
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Open the todo-column form and type into it. */
function openAndFill(
  status: TaskStatus,
  fields: { title?: string; description?: string; priority?: string }
): void {
  fireEvent.click(screen.getByTestId(`add-task-button-${status}`));
  if (fields.title !== undefined) {
    fireEvent.change(screen.getByTestId(`add-task-title-${status}`), {
      target: { value: fields.title },
    });
  }
  if (fields.description !== undefined) {
    fireEvent.change(screen.getByTestId(`add-task-description-${status}`), {
      target: { value: fields.description },
    });
  }
  if (fields.priority !== undefined) {
    fireEvent.change(screen.getByTestId(`add-task-priority-${status}`), {
      target: { value: fields.priority },
    });
  }
}

describe('AddTaskForm — open and close', () => {
  it('renders only the toggle button until it is clicked', () => {
    render(<AddTaskForm status="todo" columnTitle="To Do" onCreateTask={jest.fn()} />);

    const toggle = screen.getByTestId('add-task-button-todo');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAccessibleName('Add task to To Do');
    expect(screen.queryByTestId('add-task-form-todo')).not.toBeInTheDocument();
  });

  it('expands on click and collapses again on a second click', () => {
    render(<AddTaskForm status="done" columnTitle="Done" onCreateTask={jest.fn()} />);
    const toggle = screen.getByTestId('add-task-button-done');

    fireEvent.click(toggle);
    expect(screen.getByTestId('add-task-form-done')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggle);
    expect(screen.queryByTestId('add-task-form-done')).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('suffixes every field with the column status', () => {
    render(
      <AddTaskForm status="in-progress" columnTitle="In Progress" onCreateTask={jest.fn()} />
    );
    fireEvent.click(screen.getByTestId('add-task-button-in-progress'));

    for (const part of ['form', 'title', 'description', 'priority', 'submit', 'cancel']) {
      expect(screen.getByTestId(`add-task-${part}-in-progress`)).toBeInTheDocument();
    }
  });

  it('defaults the priority select to the API default and offers all three', () => {
    render(<AddTaskForm status="todo" columnTitle="To Do" onCreateTask={jest.fn()} />);
    fireEvent.click(screen.getByTestId('add-task-button-todo'));

    const select = screen.getByTestId('add-task-priority-todo');
    expect(select).toHaveValue(DEFAULT_TASK_PRIORITY);
    expect(DEFAULT_TASK_PRIORITY).toBe('medium');
    expect(
      within(select).getAllByRole('option').map((option) => option.getAttribute('value'))
    ).toEqual(['low', 'medium', 'high']);
  });

  it('discards the entered values when cancelled', () => {
    const onCreateTask = jest.fn();
    render(<AddTaskForm status="todo" columnTitle="To Do" onCreateTask={onCreateTask} />);
    openAndFill('todo', { title: 'Scratch', description: 'Notes', priority: 'high' });

    fireEvent.click(screen.getByTestId('add-task-cancel-todo'));
    expect(screen.queryByTestId('add-task-form-todo')).not.toBeInTheDocument();
    expect(onCreateTask).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('add-task-button-todo'));
    expect(screen.getByTestId('add-task-title-todo')).toHaveValue('');
    expect(screen.getByTestId('add-task-description-todo')).toHaveValue('');
    expect(screen.getByTestId('add-task-priority-todo')).toHaveValue(DEFAULT_TASK_PRIORITY);
  });
});

describe('AddTaskForm — validation', () => {
  it('rejects an empty title with the same wording the API uses', () => {
    const onCreateTask = jest.fn();
    render(<AddTaskForm status="todo" columnTitle="To Do" onCreateTask={onCreateTask} />);
    openAndFill('todo', {});

    fireEvent.click(screen.getByTestId('add-task-submit-todo'));

    expect(screen.getByTestId('add-task-error-todo')).toHaveTextContent('Title is required');
    expect(onCreateTask).not.toHaveBeenCalled();
    expect(screen.getByTestId('add-task-form-todo')).toBeInTheDocument();
  });

  it('treats a whitespace-only title as empty', () => {
    const onCreateTask = jest.fn();
    render(<AddTaskForm status="todo" columnTitle="To Do" onCreateTask={onCreateTask} />);
    openAndFill('todo', { title: '  \t ' });

    fireEvent.click(screen.getByTestId('add-task-submit-todo'));

    expect(screen.getByTestId('add-task-error-todo')).toHaveTextContent('Title is required');
    expect(onCreateTask).not.toHaveBeenCalled();
  });
});

describe('AddTaskForm — the request it builds', () => {
  it('passes the column status alongside a trimmed title and the priority', async () => {
    const onCreateTask = jest.fn().mockResolvedValue(undefined);
    render(<AddTaskForm status="done" columnTitle="Done" onCreateTask={onCreateTask} />);
    openAndFill('done', { title: '  Ship it  ' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('add-task-submit-done'));
    });

    // Status is a separate argument: `CreateTaskRequest` has no status field
    // because the API refuses to honour one.
    expect(onCreateTask).toHaveBeenCalledWith('done', {
      title: 'Ship it',
      priority: 'medium',
    });
  });

  it('includes a trimmed description and the chosen priority', async () => {
    const onCreateTask = jest.fn().mockResolvedValue(undefined);
    render(<AddTaskForm status="todo" columnTitle="To Do" onCreateTask={onCreateTask} />);
    openAndFill('todo', { title: 'Alpha', description: '  Details  ', priority: 'high' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('add-task-submit-todo'));
    });

    expect(onCreateTask).toHaveBeenCalledWith('todo', {
      title: 'Alpha',
      priority: 'high',
      description: 'Details',
    });
  });

  it('omits a whitespace-only description', async () => {
    const onCreateTask = jest.fn().mockResolvedValue(undefined);
    render(<AddTaskForm status="todo" columnTitle="To Do" onCreateTask={onCreateTask} />);
    openAndFill('todo', { title: 'Alpha', description: '   ' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('add-task-submit-todo'));
    });

    expect(onCreateTask).toHaveBeenCalledWith('todo', {
      title: 'Alpha',
      priority: 'medium',
    });
  });
});

describe('AddTaskForm — outcome contract', () => {
  it('clears and collapses when the create resolves', async () => {
    const onCreateTask = jest.fn().mockResolvedValue(undefined);
    render(<AddTaskForm status="todo" columnTitle="To Do" onCreateTask={onCreateTask} />);
    openAndFill('todo', { title: 'Alpha', description: 'Notes', priority: 'low' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('add-task-submit-todo'));
    });

    expect(screen.queryByTestId('add-task-form-todo')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('add-task-button-todo'));
    expect(screen.getByTestId('add-task-title-todo')).toHaveValue('');
    expect(screen.getByTestId('add-task-description-todo')).toHaveValue('');
    expect(screen.getByTestId('add-task-priority-todo')).toHaveValue(DEFAULT_TASK_PRIORITY);
  });

  it('keeps the form open with its values when the create rejects', async () => {
    const onCreateTask = jest.fn().mockRejectedValue(new Error('Title is required'));
    render(<AddTaskForm status="done" columnTitle="Done" onCreateTask={onCreateTask} />);
    openAndFill('done', { title: 'Alpha', description: 'Notes', priority: 'high' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('add-task-submit-done'));
    });

    expect(screen.getByTestId('add-task-error-done')).toHaveTextContent('Title is required');
    expect(screen.getByTestId('add-task-form-done')).toBeInTheDocument();
    expect(screen.getByTestId('add-task-title-done')).toHaveValue('Alpha');
    expect(screen.getByTestId('add-task-description-done')).toHaveValue('Notes');
    expect(screen.getByTestId('add-task-priority-done')).toHaveValue('high');
  });

  it('falls back to a generic message when the rejection carries none', async () => {
    const onCreateTask = jest.fn().mockRejectedValue('not an Error');
    render(<AddTaskForm status="todo" columnTitle="To Do" onCreateTask={onCreateTask} />);
    openAndFill('todo', { title: 'Alpha' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('add-task-submit-todo'));
    });

    expect(screen.getByTestId('add-task-error-todo')).toHaveTextContent(
      'Unable to create task'
    );
  });
});

describe('AddTaskForm — in flight', () => {
  it('disables only the submit button while the create is pending', async () => {
    const gate = deferred();
    const onCreateTask = jest.fn().mockReturnValue(gate.promise);
    render(<AddTaskForm status="todo" columnTitle="To Do" onCreateTask={onCreateTask} />);
    openAndFill('todo', { title: 'Alpha' });

    fireEvent.click(screen.getByTestId('add-task-submit-todo'));

    const submit = screen.getByTestId('add-task-submit-todo');
    expect(submit).toBeDisabled();
    expect(submit).toHaveTextContent('Adding…');
    expect(screen.getByTestId('add-task-cancel-todo')).toBeEnabled();
    expect(screen.getByTestId('add-task-button-todo')).toBeEnabled();

    await act(async () => {
      gate.resolve();
    });

    expect(screen.queryByTestId('add-task-form-todo')).not.toBeInTheDocument();
  });

  it('re-enables submit after a rejection so the user can try again', async () => {
    const gate = deferred();
    const onCreateTask = jest.fn().mockReturnValue(gate.promise);
    render(<AddTaskForm status="todo" columnTitle="To Do" onCreateTask={onCreateTask} />);
    openAndFill('todo', { title: 'Alpha' });

    fireEvent.click(screen.getByTestId('add-task-submit-todo'));

    await act(async () => {
      gate.reject(new Error('Server said no'));
    });

    expect(screen.getByTestId('add-task-submit-todo')).toBeEnabled();
    expect(screen.getByTestId('add-task-submit-todo')).toHaveTextContent('Create task');
    expect(screen.getByTestId('add-task-error-todo')).toHaveTextContent('Server said no');
  });
});

describe('AddTaskForm — without a callback', () => {
  it('still renders the control and validates locally', () => {
    render(<AddTaskForm status="todo" columnTitle="To Do" />);

    fireEvent.click(screen.getByTestId('add-task-button-todo'));
    fireEvent.click(screen.getByTestId('add-task-submit-todo'));

    expect(screen.getByTestId('add-task-error-todo')).toHaveTextContent('Title is required');
  });

  it('collapses on submit without raising', async () => {
    render(<AddTaskForm status="todo" columnTitle="To Do" />);
    openAndFill('todo', { title: 'Alpha' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('add-task-submit-todo'));
    });

    expect(screen.queryByTestId('add-task-form-todo')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-task-error-todo')).not.toBeInTheDocument();
  });
});

describe('KanbanBoard hosts one form per column', () => {
  it('renders an add control in every column, inside that column', () => {
    render(<KanbanBoard tasks={MOCK_TASKS} onTaskMove={jest.fn()} onCreateTask={jest.fn()} />);

    for (const column of KANBAN_COLUMNS) {
      const control = screen.getByTestId(`add-task-button-${column.status}`);
      expect(control).toHaveAccessibleName(`Add task to ${column.title}`);
      expect(screen.getByTestId(`kanban-column-${column.status}`)).toContainElement(control);
    }
  });

  it('keeps the add control out of the task container, so counts stay honest', () => {
    render(<KanbanBoard tasks={MOCK_TASKS} onTaskMove={jest.fn()} onCreateTask={jest.fn()} />);
    fireEvent.click(screen.getByTestId('add-task-button-todo'));

    const taskContainer = screen.getByTestId('kanban-column-tasks-todo');
    expect(taskContainer).not.toContainElement(screen.getByTestId('add-task-form-todo'));
    expect(taskContainer.children).toHaveLength(1);
    expect(screen.getByTestId('kanban-column-count-todo')).toHaveTextContent('1');
  });

  it('opens only the column whose control was clicked', () => {
    render(<KanbanBoard tasks={MOCK_TASKS} onTaskMove={jest.fn()} onCreateTask={jest.fn()} />);

    fireEvent.click(screen.getByTestId('add-task-button-done'));

    expect(screen.getByTestId('add-task-form-done')).toBeInTheDocument();
    expect(screen.queryByTestId('add-task-form-todo')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-task-form-in-progress')).not.toBeInTheDocument();
  });

  it('reports the originating column status to the board\'s handler', async () => {
    const onCreateTask = jest.fn().mockResolvedValue(undefined);
    render(
      <KanbanBoard tasks={MOCK_TASKS} onTaskMove={jest.fn()} onCreateTask={onCreateTask} />
    );
    openAndFill('in-progress', { title: 'Mid-flight' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('add-task-submit-in-progress'));
    });

    expect(onCreateTask).toHaveBeenCalledWith('in-progress', {
      title: 'Mid-flight',
      priority: 'medium',
    });
  });

  it('surfaces a rejection only on the column it came from', async () => {
    const onCreateTask = jest.fn().mockRejectedValue(new Error('Nope'));
    render(
      <KanbanBoard tasks={MOCK_TASKS} onTaskMove={jest.fn()} onCreateTask={onCreateTask} />
    );
    openAndFill('done', { title: 'Alpha' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('add-task-submit-done'));
    });

    expect(screen.getByTestId('add-task-error-done')).toHaveTextContent('Nope');
    expect(screen.queryByTestId('add-task-error-todo')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-task-error-in-progress')).not.toBeInTheDocument();
  });

  it('renders the add controls when the board has no create handler', () => {
    render(<KanbanBoard tasks={MOCK_TASKS} onTaskMove={jest.fn()} />);

    for (const column of KANBAN_COLUMNS) {
      expect(screen.getByTestId(`add-task-button-${column.status}`)).toBeInTheDocument();
    }
  });
});
