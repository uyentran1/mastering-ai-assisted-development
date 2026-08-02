/**
 * NewProjectForm — the collapsible create-a-project control, in isolation and
 * as ProjectList mounts it.
 *
 * Nothing here stubs the component: only `onCreateProject` is supplied, which
 * is the seam the component is written against. The promise it returns is the
 * whole contract (resolve = created, reject = not created), so every test that
 * cares about the outcome drives that promise explicitly rather than guessing
 * at timing.
 */

import { act, fireEvent, render, screen } from '@testing-library/react';
import { MOCK_PROJECTS } from '../../src/shared/types';
import {
  DEFAULT_PROJECT_COLOR,
  NewProjectForm,
} from '../../src/frontend/components/NewProjectForm';
import { ProjectList } from '../../src/frontend/components/ProjectList';

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

/** Open the form and type into it. */
function openAndFill(fields: { name?: string; description?: string; color?: string }): void {
  fireEvent.click(screen.getByTestId('new-project-button'));
  if (fields.name !== undefined) {
    fireEvent.change(screen.getByTestId('new-project-name'), {
      target: { value: fields.name },
    });
  }
  if (fields.description !== undefined) {
    fireEvent.change(screen.getByTestId('new-project-description'), {
      target: { value: fields.description },
    });
  }
  if (fields.color !== undefined) {
    fireEvent.change(screen.getByTestId('new-project-color'), {
      target: { value: fields.color },
    });
  }
}

describe('NewProjectForm — open and close', () => {
  it('renders only the toggle button until it is clicked', () => {
    render(<NewProjectForm onCreateProject={jest.fn()} />);

    expect(screen.getByTestId('new-project-button')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByTestId('new-project-form')).not.toBeInTheDocument();
  });

  it('expands on click and collapses again on a second click', () => {
    render(<NewProjectForm onCreateProject={jest.fn()} />);
    const toggle = screen.getByTestId('new-project-button');

    fireEvent.click(toggle);
    expect(screen.getByTestId('new-project-form')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggle);
    expect(screen.queryByTestId('new-project-form')).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('offers colour as a free-text field prefilled with the API default', () => {
    render(<NewProjectForm onCreateProject={jest.fn()} />);
    fireEvent.click(screen.getByTestId('new-project-button'));

    const color = screen.getByTestId('new-project-color');
    // A native colour picker cannot express "leave it alone" or a bad value,
    // and the server-side hex rule has to be reachable from the UI.
    expect(color).toHaveAttribute('type', 'text');
    expect(color).toHaveValue(DEFAULT_PROJECT_COLOR);
    expect(DEFAULT_PROJECT_COLOR).toBe('#3B82F6');
  });

  it('starts the text fields empty', () => {
    render(<NewProjectForm onCreateProject={jest.fn()} />);
    fireEvent.click(screen.getByTestId('new-project-button'));

    expect(screen.getByTestId('new-project-name')).toHaveValue('');
    expect(screen.getByTestId('new-project-description')).toHaveValue('');
  });

  it('discards the entered values when cancelled', () => {
    const onCreateProject = jest.fn();
    render(<NewProjectForm onCreateProject={onCreateProject} />);
    openAndFill({ name: 'Scratch', description: 'Notes', color: '#000000' });

    fireEvent.click(screen.getByTestId('new-project-cancel'));
    expect(screen.queryByTestId('new-project-form')).not.toBeInTheDocument();
    expect(onCreateProject).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('new-project-button'));
    expect(screen.getByTestId('new-project-name')).toHaveValue('');
    expect(screen.getByTestId('new-project-description')).toHaveValue('');
    expect(screen.getByTestId('new-project-color')).toHaveValue(DEFAULT_PROJECT_COLOR);
  });
});

describe('NewProjectForm — validation', () => {
  it('rejects an empty name with the same wording the API uses', () => {
    const onCreateProject = jest.fn();
    render(<NewProjectForm onCreateProject={onCreateProject} />);
    openAndFill({});

    fireEvent.click(screen.getByTestId('new-project-submit'));

    expect(screen.getByTestId('new-project-error')).toHaveTextContent('Name is required');
    expect(onCreateProject).not.toHaveBeenCalled();
    expect(screen.getByTestId('new-project-form')).toBeInTheDocument();
  });

  it('treats a whitespace-only name as empty', () => {
    const onCreateProject = jest.fn();
    render(<NewProjectForm onCreateProject={onCreateProject} />);
    openAndFill({ name: '   ' });

    fireEvent.click(screen.getByTestId('new-project-submit'));

    expect(screen.getByTestId('new-project-error')).toHaveTextContent('Name is required');
    expect(onCreateProject).not.toHaveBeenCalled();
  });

  it('clears a validation error once a valid submit goes through', async () => {
    const onCreateProject = jest.fn().mockResolvedValue(undefined);
    render(<NewProjectForm onCreateProject={onCreateProject} />);
    openAndFill({});
    fireEvent.click(screen.getByTestId('new-project-submit'));
    expect(screen.getByTestId('new-project-error')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('new-project-name'), {
      target: { value: 'Real name' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('new-project-submit'));
    });

    expect(screen.queryByTestId('new-project-form')).not.toBeInTheDocument();
    expect(onCreateProject).toHaveBeenCalledTimes(1);
  });
});

describe('NewProjectForm — the request it builds', () => {
  it('trims the name and sends the colour alongside it', async () => {
    const onCreateProject = jest.fn().mockResolvedValue(undefined);
    render(<NewProjectForm onCreateProject={onCreateProject} />);
    openAndFill({ name: '  Alpha  ' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('new-project-submit'));
    });

    expect(onCreateProject).toHaveBeenCalledWith({
      name: 'Alpha',
      color: DEFAULT_PROJECT_COLOR,
    });
  });

  it('includes a trimmed description when one was typed', async () => {
    const onCreateProject = jest.fn().mockResolvedValue(undefined);
    render(<NewProjectForm onCreateProject={onCreateProject} />);
    openAndFill({ name: 'Alpha', description: '  Portfolio  ', color: '#10B981' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('new-project-submit'));
    });

    expect(onCreateProject).toHaveBeenCalledWith({
      name: 'Alpha',
      description: 'Portfolio',
      color: '#10B981',
    });
  });

  it('omits colour entirely when the field is cleared', async () => {
    const onCreateProject = jest.fn().mockResolvedValue(undefined);
    render(<NewProjectForm onCreateProject={onCreateProject} />);
    openAndFill({ name: 'Alpha', color: '   ' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('new-project-submit'));
    });

    // No key at all, so the server applies its own default rather than
    // being handed a blank string it would reject.
    expect(onCreateProject).toHaveBeenCalledWith({ name: 'Alpha' });
  });

  it('omits a whitespace-only description', async () => {
    const onCreateProject = jest.fn().mockResolvedValue(undefined);
    render(<NewProjectForm onCreateProject={onCreateProject} />);
    openAndFill({ name: 'Alpha', description: '   ' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('new-project-submit'));
    });

    expect(onCreateProject).toHaveBeenCalledWith({
      name: 'Alpha',
      color: DEFAULT_PROJECT_COLOR,
    });
  });
});

describe('NewProjectForm — outcome contract', () => {
  it('clears and collapses when the create resolves', async () => {
    const onCreateProject = jest.fn().mockResolvedValue(undefined);
    render(<NewProjectForm onCreateProject={onCreateProject} />);
    openAndFill({ name: 'Alpha', description: 'Notes', color: '#10B981' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('new-project-submit'));
    });

    expect(screen.queryByTestId('new-project-form')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('new-project-button'));
    expect(screen.getByTestId('new-project-name')).toHaveValue('');
    expect(screen.getByTestId('new-project-description')).toHaveValue('');
    expect(screen.getByTestId('new-project-color')).toHaveValue(DEFAULT_PROJECT_COLOR);
  });

  it('keeps the form open with its values when the create rejects', async () => {
    const onCreateProject = jest
      .fn()
      .mockRejectedValue(new Error('Color must be a hex color like #3B82F6'));
    render(<NewProjectForm onCreateProject={onCreateProject} />);
    openAndFill({ name: 'Alpha', description: 'Notes', color: '#GGG' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('new-project-submit'));
    });

    expect(screen.getByTestId('new-project-error')).toHaveTextContent(
      'Color must be a hex color like #3B82F6'
    );
    expect(screen.getByTestId('new-project-form')).toBeInTheDocument();
    expect(screen.getByTestId('new-project-name')).toHaveValue('Alpha');
    expect(screen.getByTestId('new-project-description')).toHaveValue('Notes');
    expect(screen.getByTestId('new-project-color')).toHaveValue('#GGG');
  });

  it('falls back to a generic message when the rejection carries none', async () => {
    const onCreateProject = jest.fn().mockRejectedValue('not an Error');
    render(<NewProjectForm onCreateProject={onCreateProject} />);
    openAndFill({ name: 'Alpha' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('new-project-submit'));
    });

    expect(screen.getByTestId('new-project-error')).toHaveTextContent(
      'Unable to create project'
    );
  });

  it('lets a failed attempt be retried successfully', async () => {
    const onCreateProject = jest
      .fn()
      .mockRejectedValueOnce(new Error('Name is required'))
      .mockResolvedValueOnce(undefined);
    render(<NewProjectForm onCreateProject={onCreateProject} />);
    openAndFill({ name: 'Alpha' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('new-project-submit'));
    });
    expect(screen.getByTestId('new-project-error')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('new-project-submit'));
    });

    expect(screen.queryByTestId('new-project-form')).not.toBeInTheDocument();
    expect(onCreateProject).toHaveBeenNthCalledWith(2, {
      name: 'Alpha',
      color: DEFAULT_PROJECT_COLOR,
    });
  });
});

describe('NewProjectForm — in flight', () => {
  it('disables only the submit button while the create is pending', async () => {
    const gate = deferred();
    const onCreateProject = jest.fn().mockReturnValue(gate.promise);
    render(<NewProjectForm onCreateProject={onCreateProject} />);
    openAndFill({ name: 'Alpha' });

    fireEvent.click(screen.getByTestId('new-project-submit'));

    const submit = screen.getByTestId('new-project-submit');
    expect(submit).toBeDisabled();
    expect(submit).toHaveTextContent('Creating…');
    expect(screen.getByTestId('new-project-cancel')).toBeEnabled();
    expect(screen.getByTestId('new-project-button')).toBeEnabled();

    await act(async () => {
      gate.resolve();
    });

    expect(screen.queryByTestId('new-project-form')).not.toBeInTheDocument();
  });

  it('re-enables submit after a rejection so the user can try again', async () => {
    const gate = deferred();
    const onCreateProject = jest.fn().mockReturnValue(gate.promise);
    render(<NewProjectForm onCreateProject={onCreateProject} />);
    openAndFill({ name: 'Alpha' });

    fireEvent.click(screen.getByTestId('new-project-submit'));
    expect(screen.getByTestId('new-project-submit')).toBeDisabled();

    await act(async () => {
      gate.reject(new Error('Server said no'));
    });

    expect(screen.getByTestId('new-project-submit')).toBeEnabled();
    expect(screen.getByTestId('new-project-submit')).toHaveTextContent('Create project');
    expect(screen.getByTestId('new-project-error')).toHaveTextContent('Server said no');
  });
});

describe('NewProjectForm — without a callback', () => {
  it('still renders the control', () => {
    render(<NewProjectForm />);

    expect(screen.getByTestId('new-project-button')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('new-project-button'));
    expect(screen.getByTestId('new-project-form')).toBeInTheDocument();
  });

  it('validates locally even with nothing to submit to', () => {
    render(<NewProjectForm />);
    fireEvent.click(screen.getByTestId('new-project-button'));

    fireEvent.click(screen.getByTestId('new-project-submit'));

    expect(screen.getByTestId('new-project-error')).toHaveTextContent('Name is required');
  });

  it('collapses on submit without raising', async () => {
    render(<NewProjectForm />);
    openAndFill({ name: 'Alpha' });

    await act(async () => {
      fireEvent.click(screen.getByTestId('new-project-submit'));
    });

    // `await undefined` resolves, so the optional-call path takes the success
    // branch: the form clears and closes even though nothing was created.
    expect(screen.queryByTestId('new-project-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('new-project-error')).not.toBeInTheDocument();
  });
});

describe('ProjectList hosts the form outside the grid', () => {
  it('renders the create control and keeps the grid one-child-per-project', () => {
    render(
      <ProjectList
        projects={MOCK_PROJECTS}
        onSelectProject={jest.fn()}
        onCreateProject={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('new-project-button'));

    const grid = screen.getByTestId('project-list-grid');
    expect(grid.children).toHaveLength(MOCK_PROJECTS.length);
    expect(grid).not.toContainElement(screen.getByTestId('new-project-form'));
    expect(grid).not.toContainElement(screen.getByTestId('new-project-button'));
  });

  it('shows the create control even when there are no projects to grid', () => {
    render(
      <ProjectList projects={[]} onSelectProject={jest.fn()} onCreateProject={jest.fn()} />
    );

    expect(screen.getByTestId('new-project-button')).toBeInTheDocument();
    expect(screen.getByTestId('project-list-empty')).toBeInTheDocument();
  });

  it('forwards the list\'s onCreateProject to the form', async () => {
    const onCreateProject = jest.fn().mockResolvedValue(undefined);
    render(
      <ProjectList
        projects={MOCK_PROJECTS}
        onSelectProject={jest.fn()}
        onCreateProject={onCreateProject}
      />
    );

    openAndFill({ name: 'Forwarded' });
    await act(async () => {
      fireEvent.click(screen.getByTestId('new-project-submit'));
    });

    expect(onCreateProject).toHaveBeenCalledWith({
      name: 'Forwarded',
      color: DEFAULT_PROJECT_COLOR,
    });
  });

  it('renders the control when the list has no create handler', () => {
    render(<ProjectList projects={MOCK_PROJECTS} onSelectProject={jest.fn()} />);

    expect(screen.getByTestId('new-project-button')).toBeInTheDocument();
  });
});
