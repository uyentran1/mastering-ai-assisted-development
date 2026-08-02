/**
 * ProjectList — responsive grid of ProjectCards.
 */

import React from 'react';
import type { CreateProjectRequest, Project } from '../../shared/types';
import { NewProjectForm } from './NewProjectForm';
import { ProjectCard } from './ProjectCard';

export interface ProjectListProps {
  /** Projects to display. An empty array renders the empty state. */
  projects: Project[];
  /** Bubbled up from the selected ProjectCard. */
  onSelectProject: (projectId: string) => void;
  /** Heading above the grid. Defaults to `'Projects'`. */
  title?: string;
  /**
   * Create a project from the inline form. Rejecting with an Error surfaces
   * its message on the form; resolving clears and collapses it.
   */
  onCreateProject?: (input: CreateProjectRequest) => Promise<void>;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onSelectProject,
  title = 'Projects',
  onCreateProject,
}) => {
  return (
    <section data-testid="project-list" className="px-6 py-8">
      <h2
        data-testid="project-list-heading"
        className="mb-6 text-xl font-semibold text-slate-900"
      >
        {title}
      </h2>

      {/* Outside the grid: the grid holds exactly one child per project. */}
      <NewProjectForm onCreateProject={onCreateProject} />

      {projects.length === 0 ? (
        <p data-testid="project-list-empty" className="text-sm text-slate-500">
          No projects yet.
        </p>
      ) : (
        <div
          data-testid="project-list-grid"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onSelect={onSelectProject} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProjectList;
