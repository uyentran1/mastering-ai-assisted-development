/**
 * KanbanBoard component - three-column Kanban view
 */

import React from 'react';
import { Task, TaskStatus } from '../../shared/types';
import TaskCard from './TaskCard';

interface KanbanBoardProps {
  projectId: string;
  tasks: Task[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId, tasks }) => {
  const columns: Array<{ status: TaskStatus; title: string }> = [
    { status: 'todo', title: 'To Do' },
    { status: 'in-progress', title: 'In Progress' },
    { status: 'done', title: 'Done' },
  ];

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(t => t.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => (
        <div key={column.status} className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">{column.title}</h3>
          <div className="space-y-3">
            {getTasksByStatus(column.status).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
