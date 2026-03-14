/**
 * TaskCard component - individual task card
 */

import React from 'react';
import { Task, TaskPriority } from '../../shared/types';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded p-3 shadow hover:shadow-md transition-shadow">
      <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        {task.assignee && (
          <span className="text-xs text-gray-500">→ {task.assignee}</span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
