/**
 * ProjectCard component - individual project card
 */

import React from 'react';
import { Project } from '../../shared/types';

interface ProjectCardProps {
  project: Project;
  onSelect: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start mb-4">
        <div
          className="w-4 h-4 rounded mr-3 flex-shrink-0"
          style={{ backgroundColor: project.color }}
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
          )}
        </div>
      </div>
      <div className="text-sm text-gray-500">
        {project.task_count || 0} tasks
      </div>
    </div>
  );
};

export default ProjectCard;
