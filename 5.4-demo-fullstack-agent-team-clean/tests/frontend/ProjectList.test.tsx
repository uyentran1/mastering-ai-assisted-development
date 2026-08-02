/**
 * ProjectList + ProjectCard, rendered together from the shared fixtures.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { MOCK_PROJECTS, type Project } from '../../src/shared/types';
import { ProjectCard } from '../../src/frontend/components/ProjectCard';
import { ProjectList } from '../../src/frontend/components/ProjectList';

describe('ProjectList', () => {
  it('renders one card per project with name, description and task count', () => {
    render(<ProjectList projects={MOCK_PROJECTS} onSelectProject={jest.fn()} />);

    expect(screen.getByTestId('project-list')).toBeInTheDocument();
    expect(screen.getByTestId('project-list-grid').children).toHaveLength(
      MOCK_PROJECTS.length
    );

    const first = within(screen.getByTestId('project-card-proj-1'));
    expect(first.getByTestId('project-card-name')).toHaveTextContent('Personal Website');
    expect(first.getByTestId('project-card-description')).toHaveTextContent(
      'Portfolio and blog'
    );
    expect(first.getByTestId('project-card-task-count')).toHaveTextContent('5 tasks');

    const second = within(screen.getByTestId('project-card-proj-2'));
    expect(second.getByTestId('project-card-name')).toHaveTextContent('Mobile App');
    expect(second.getByTestId('project-card-task-count')).toHaveTextContent('8 tasks');
  });

  it('bubbles the project id up from a clicked card', () => {
    const onSelectProject = jest.fn();
    render(<ProjectList projects={MOCK_PROJECTS} onSelectProject={onSelectProject} />);

    fireEvent.click(screen.getByTestId('project-card-proj-2'));

    expect(onSelectProject).toHaveBeenCalledTimes(1);
    expect(onSelectProject).toHaveBeenCalledWith('proj-2');
  });

  it('renders the empty state and no grid for an empty list', () => {
    render(<ProjectList projects={[]} onSelectProject={jest.fn()} />);

    expect(screen.getByTestId('project-list-empty')).toHaveTextContent('No projects yet.');
    expect(screen.queryByTestId('project-list-grid')).not.toBeInTheDocument();
  });

  it('defaults the heading to "Projects" and honours an override', () => {
    const { rerender } = render(
      <ProjectList projects={MOCK_PROJECTS} onSelectProject={jest.fn()} />
    );
    expect(screen.getByTestId('project-list-heading')).toHaveTextContent('Projects');

    rerender(
      <ProjectList projects={MOCK_PROJECTS} onSelectProject={jest.fn()} title="My boards" />
    );
    expect(screen.getByTestId('project-list-heading')).toHaveTextContent('My boards');
  });
});

describe('ProjectCard', () => {
  const base: Project = {
    id: 'proj-9',
    user_id: 'user-1',
    name: 'Solo',
    color: '#EF4444',
    created_at: '2024-01-01T00:00:00.000Z',
  };

  it('renders the project colour as an inline swatch style', () => {
    render(<ProjectCard project={base} onSelect={jest.fn()} />);

    expect(screen.getByTestId('project-card-color')).toHaveStyle({
      backgroundColor: '#EF4444',
    });
  });

  it('falls back to "0 tasks" when task_count is absent', () => {
    render(<ProjectCard project={base} onSelect={jest.fn()} />);

    expect(screen.getByTestId('project-card-task-count')).toHaveTextContent('0 tasks');
  });

  it('uses the singular noun for exactly one task', () => {
    render(<ProjectCard project={{ ...base, task_count: 1 }} onSelect={jest.fn()} />);

    expect(screen.getByTestId('project-card-task-count')).toHaveTextContent('1 task');
    expect(screen.getByTestId('project-card-task-count')).not.toHaveTextContent('1 tasks');
  });

  it('omits the description element when there is no description', () => {
    render(<ProjectCard project={base} onSelect={jest.fn()} />);

    expect(screen.queryByTestId('project-card-description')).not.toBeInTheDocument();
  });

  it('exposes an accessible name for the card', () => {
    render(<ProjectCard project={base} onSelect={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Open project Solo' })).toBe(
      screen.getByTestId('project-card-proj-9')
    );
  });
});
