/**
 * Main App component
 */

import React, { useState, useEffect } from 'react';
import { Project, Task, MOCK_PROJECTS, MOCK_TASKS } from '../shared/types';
import ProjectList from './components/ProjectList';
import KanbanBoard from './components/KanbanBoard';

type ViewType = 'projects' | 'tasks';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('projects');
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);

  useEffect(() => {
    if (selectedProject) {
      const projectTasks = MOCK_TASKS.filter(t => t.project_id === selectedProject.id);
      setTasks(projectTasks);
      setView('tasks');
    }
  }, [selectedProject]);

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
  };

  const handleBackToProjects = () => {
    setView('projects');
    setSelectedProject(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {view === 'projects' ? (
          <ProjectList projects={projects} onSelectProject={handleSelectProject} />
        ) : selectedProject ? (
          <div>
            <button
              onClick={handleBackToProjects}
              className="mb-6 px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
            >
              ← Back to Projects
            </button>
            <h2 className="text-2xl font-bold mb-6">{selectedProject.name}</h2>
            <KanbanBoard projectId={selectedProject.id} tasks={tasks} />
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default App;
