/**
 * KanbanBoard + TaskCard: column routing by status and the drag/drop path.
 *
 * jsdom supplies no `dataTransfer` on drag events, so the drop handler has to
 * fall back to the id captured on dragStart. Both halves of that are exercised
 * here for real, through fireEvent, with no handler stubbed on the components
 * themselves.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { MOCK_PROJECTS, MOCK_TASKS, type Task } from '../../src/shared/types';
import { KANBAN_COLUMNS, KanbanBoard } from '../../src/frontend/components/KanbanBoard';
import { TaskCard } from '../../src/frontend/components/TaskCard';

/** Simulate a full drag of a card onto a column. */
function dragCardTo(taskId: string, status: string): void {
  fireEvent.dragStart(screen.getByTestId(`task-card-${taskId}`));
  fireEvent.drop(screen.getByTestId(`kanban-column-${status}`));
}

describe('KANBAN_COLUMNS', () => {
  it('declares the three statuses in display order', () => {
    expect(KANBAN_COLUMNS.map((column) => column.status)).toEqual([
      'todo',
      'in-progress',
      'done',
    ]);
    expect(KANBAN_COLUMNS.map((column) => column.title)).toEqual([
      'To Do',
      'In Progress',
      'Done',
    ]);
  });
});

describe('KanbanBoard rendering', () => {
  it('routes each task into the column matching its status', () => {
    render(<KanbanBoard tasks={MOCK_TASKS} onTaskMove={jest.fn()} />);

    expect(
      within(screen.getByTestId('kanban-column-tasks-todo')).getByTestId('task-card-task-3')
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('kanban-column-tasks-in-progress')).getByTestId(
        'task-card-task-2'
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('kanban-column-tasks-done')).getByTestId('task-card-task-1')
    ).toBeInTheDocument();
  });

  it('shows a per-column count', () => {
    render(<KanbanBoard tasks={MOCK_TASKS} onTaskMove={jest.fn()} />);

    expect(screen.getByTestId('kanban-column-count-todo')).toHaveTextContent('1');
    expect(screen.getByTestId('kanban-column-count-in-progress')).toHaveTextContent('1');
    expect(screen.getByTestId('kanban-column-count-done')).toHaveTextContent('1');
  });

  it('renders the column titles', () => {
    render(<KanbanBoard tasks={MOCK_TASKS} onTaskMove={jest.fn()} />);

    expect(screen.getByTestId('kanban-column-title-todo')).toHaveTextContent('To Do');
    expect(screen.getByTestId('kanban-column-title-in-progress')).toHaveTextContent(
      'In Progress'
    );
    expect(screen.getByTestId('kanban-column-title-done')).toHaveTextContent('Done');
  });

  it('shows the empty placeholder in every column when there are no tasks', () => {
    render(<KanbanBoard tasks={[]} onTaskMove={jest.fn()} />);

    for (const column of KANBAN_COLUMNS) {
      expect(screen.getByTestId(`kanban-column-empty-${column.status}`)).toHaveTextContent(
        'No tasks'
      );
      expect(screen.getByTestId(`kanban-column-count-${column.status}`)).toHaveTextContent(
        '0'
      );
    }
  });

  it('titles the board after the project, falling back to "Board"', () => {
    const { rerender } = render(<KanbanBoard tasks={[]} onTaskMove={jest.fn()} />);
    expect(screen.getByTestId('kanban-board-title')).toHaveTextContent('Board');

    rerender(
      <KanbanBoard tasks={[]} project={MOCK_PROJECTS[0]} onTaskMove={jest.fn()} />
    );
    expect(screen.getByTestId('kanban-board-title')).toHaveTextContent('Personal Website');
  });
});

describe('KanbanBoard drag and drop', () => {
  it('calls onTaskMove with the dragged id and the destination status', () => {
    const onTaskMove = jest.fn();
    render(<KanbanBoard tasks={MOCK_TASKS} onTaskMove={onTaskMove} />);

    dragCardTo('task-3', 'done');

    expect(onTaskMove).toHaveBeenCalledTimes(1);
    expect(onTaskMove).toHaveBeenCalledWith('task-3', 'done');
  });

  it('ignores a drop back into the column the task already sits in', () => {
    const onTaskMove = jest.fn();
    render(<KanbanBoard tasks={MOCK_TASKS} onTaskMove={onTaskMove} />);

    dragCardTo('task-1', 'done');

    expect(onTaskMove).not.toHaveBeenCalled();
  });

  it('ignores a drop that was never preceded by a drag', () => {
    const onTaskMove = jest.fn();
    render(<KanbanBoard tasks={MOCK_TASKS} onTaskMove={onTaskMove} />);

    fireEvent.drop(screen.getByTestId('kanban-column-done'));

    expect(onTaskMove).not.toHaveBeenCalled();
  });

  it('forgets the dragged id once the drag ends, so a later drop is inert', () => {
    const onTaskMove = jest.fn();
    render(<KanbanBoard tasks={MOCK_TASKS} onTaskMove={onTaskMove} />);

    fireEvent.dragStart(screen.getByTestId('task-card-task-3'));
    fireEvent.dragEnd(screen.getByTestId('task-card-task-3'));
    fireEvent.drop(screen.getByTestId('kanban-column-done'));

    expect(onTaskMove).not.toHaveBeenCalled();
  });

  it('ignores a drop whose id is not among the board\'s tasks', () => {
    const onTaskMove = jest.fn();
    const { rerender } = render(
      <KanbanBoard tasks={MOCK_TASKS} onTaskMove={onTaskMove} />
    );

    fireEvent.dragStart(screen.getByTestId('task-card-task-3'));
    // The board is re-scoped mid-drag; the remembered id no longer resolves.
    rerender(<KanbanBoard tasks={[]} onTaskMove={onTaskMove} />);
    fireEvent.drop(screen.getByTestId('kanban-column-done'));

    expect(onTaskMove).not.toHaveBeenCalled();
  });
});

describe('TaskCard', () => {
  const task: Task = MOCK_TASKS[1];

  it('renders title, description and priority', () => {
    render(<TaskCard task={task} />);

    const card = within(screen.getByTestId(`task-card-${task.id}`));
    expect(card.getByTestId('task-card-title')).toHaveTextContent('Set up hosting');
    expect(card.getByTestId('task-card-description')).toHaveTextContent('Deploy to Vercel');
    expect(card.getByTestId('task-card-priority')).toHaveTextContent('high');
  });

  it('omits the description element when the task has none', () => {
    render(<TaskCard task={{ ...task, description: undefined }} />);

    expect(screen.queryByTestId('task-card-description')).not.toBeInTheDocument();
  });

  it('is draggable and exposes the task id and status as data attributes', () => {
    render(<TaskCard task={task} />);

    const card = screen.getByTestId(`task-card-${task.id}`);
    expect(card).toHaveAttribute('draggable', 'true');
    expect(card).toHaveAttribute('data-task-id', 'task-2');
    expect(card).toHaveAttribute('data-task-status', 'in-progress');
  });

  it('calls onSelectTask on click and on Enter', () => {
    const onSelectTask = jest.fn();
    render(<TaskCard task={task} onSelectTask={onSelectTask} />);

    const card = screen.getByTestId(`task-card-${task.id}`);
    fireEvent.click(card);
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(onSelectTask).toHaveBeenCalledTimes(2);
    expect(onSelectTask).toHaveBeenNthCalledWith(1, 'task-2');
    expect(onSelectTask).toHaveBeenNthCalledWith(2, 'task-2');
  });

  it('does not call onSelectTask for an unrelated key', () => {
    const onSelectTask = jest.fn();
    render(<TaskCard task={task} onSelectTask={onSelectTask} />);

    fireEvent.keyDown(screen.getByTestId(`task-card-${task.id}`), { key: 'Escape' });

    expect(onSelectTask).not.toHaveBeenCalled();
  });

  it('reports drag start with the task id and drag end without arguments', () => {
    const onDragStart = jest.fn();
    const onDragEnd = jest.fn();
    render(<TaskCard task={task} onDragStart={onDragStart} onDragEnd={onDragEnd} />);

    const card = screen.getByTestId(`task-card-${task.id}`);
    fireEvent.dragStart(card);
    fireEvent.dragEnd(card);

    expect(onDragStart).toHaveBeenCalledWith('task-2');
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });
});
