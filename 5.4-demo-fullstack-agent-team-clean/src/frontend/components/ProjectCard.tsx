/**
 * ProjectCard — compact preview of a single project.
 *
 * `task_count` is computed by the API and may be absent; never assume a
 * particular number here.
 */

import React from 'react';
import type { Project } from '../../shared/types';

export interface ProjectCardProps {
  /** The project to render. */
  project: Project;
  /** Invoked with the project id when the card is activated. */
  onSelect: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
  const taskCount = project.task_count ?? 0;

  function handleClick(): void {
    onSelect(project.id);
  }

  return (
    <button
      type="button"
      data-testid={`project-card-${project.id}`}
      data-project-id={project.id}
      onClick={handleClick}
      aria-label={`Open project ${project.name}`}
      className="flex w-full flex-col rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <span className="mb-3 flex items-center gap-3">
        <span
          data-testid="project-card-color"
          aria-hidden="true"
          style={{ backgroundColor: project.color }}
          className="h-3 w-3 shrink-0 rounded-full"
        />
        <span
          data-testid="project-card-name"
          className="text-lg font-semibold text-slate-900"
        >
          {project.name}
        </span>
      </span>

      {project.description && (
        <span
          data-testid="project-card-description"
          className="mb-4 text-sm text-slate-600"
        >
          {project.description}
        </span>
      )}

      <span
        data-testid="project-card-task-count"
        className="mt-auto text-xs font-medium uppercase tracking-wide text-slate-500"
      >
        {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
      </span>
    </button>
  );
};

export default ProjectCard;
