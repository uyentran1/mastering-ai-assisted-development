/**
 * ProjectList component - displays grid of project cards
 */

import React from 'react';
import { Project } from '../../shared/types';
import ProjectCard from './ProjectCard';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Your Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onSelect={() => onSelectProject(project)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectList;
