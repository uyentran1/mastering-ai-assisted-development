/**
 * Mock in-memory database
 */

import { Project, Task, User } from '../../shared/types';

export class MockDatabase {
  private users: User[] = [
    {
      id: 'user-1',
      email: 'demo@example.com',
      created_at: new Date().toISOString(),
    },
  ];

  private projects: Project[] = [
    {
      id: 'proj-1',
      user_id: 'user-1',
      name: 'Personal Website',
      description: 'Portfolio and blog',
      color: '#3B82F6',
      created_at: new Date().toISOString(),
    },
    {
      id: 'proj-2',
      user_id: 'user-1',
      name: 'Mobile App',
      description: 'React Native app',
      color: '#10B981',
      created_at: new Date().toISOString(),
    },
  ];

  private tasks: Task[] = [
    {
      id: 'task-1',
      project_id: 'proj-1',
      title: 'Design homepage',
      status: 'done',
      priority: 'high',
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-2',
      project_id: 'proj-1',
      title: 'Set up hosting',
      status: 'in-progress',
      priority: 'high',
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-3',
      project_id: 'proj-1',
      title: 'Write blog posts',
      status: 'todo',
      priority: 'medium',
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-4',
      project_id: 'proj-2',
      title: 'Setup project',
      status: 'done',
      priority: 'high',
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-5',
      project_id: 'proj-2',
      title: 'Build auth',
      status: 'in-progress',
      priority: 'high',
      created_at: new Date().toISOString(),
    },
  ];

  // Users
  findUser(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }

  createUser(email: string): User {
    const user: User = {
      id: `user-${Date.now()}`,
      email,
      created_at: new Date().toISOString(),
    };
    this.users.push(user);
    return user;
  }

  // Projects
  getProjects(userId: string): Project[] {
    return this.projects
      .filter(p => p.user_id === userId)
      .map(p => ({
        ...p,
        task_count: this.tasks.filter(t => t.project_id === p.id).length,
      }));
  }

  getProject(id: string): Project | undefined {
    return this.projects.find(p => p.id === id);
  }

  createProject(project: Omit<Project, 'id' | 'created_at'>): Project {
    const newProject: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.projects.push(newProject);
    return newProject;
  }

  // Tasks
  getTasks(projectId: string): Task[] {
    return this.tasks.filter(t => t.project_id === projectId);
  }

  getTask(id: string): Task | undefined {
    return this.tasks.find(t => t.id === id);
  }

  createTask(task: Omit<Task, 'id' | 'created_at'>): Task {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>): Task | undefined {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      Object.assign(task, updates, { updated_at: new Date().toISOString() });
    }
    return task;
  }

  deleteTask(id: string): boolean {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const db = new MockDatabase();
