/**
 * Express server setup
 */

import express from 'express';
import { authenticate, requireAdmin } from './auth';
import { getAllTasks, getTaskById, createTask, updateTask, deleteTask, getTasksByPriority, reassignTasks } from './tasks';

const app = express();
app.use(express.json());

// Public routes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes
app.get('/api/tasks', authenticate, (req, res) => {
  const { status, assignee } = req.query;
  const tasks = getAllTasks({
    status: status as string,
    assignee: assignee as string,
  });
  res.json({ data: tasks, count: tasks.length });
});

app.get('/api/tasks/by-priority', authenticate, (req, res) => {
  const grouped = getTasksByPriority();
  res.json({ data: grouped });
});

app.get('/api/tasks/:id', authenticate, (req, res) => {
  const task = getTaskById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json({ data: task });
});

app.post('/api/tasks', authenticate, (req, res) => {
  try {
    const task = createTask(req.body);
    res.status(201).json({ data: task });
  } catch (error) {
    // BUG: Swallows error details — consumer gets no useful information
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/tasks/:id', authenticate, (req, res) => {
  const task = updateTask(req.params.id, req.body);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json({ data: task });
});

app.delete('/api/tasks/:id', authenticate, requireAdmin, (req, res) => {
  const deleted = deleteTask(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.status(204).send();
});

app.post('/api/tasks/reassign', authenticate, requireAdmin, (req, res) => {
  const { from, to } = req.body;
  if (!from || !to) {
    res.status(400).json({ error: 'Both "from" and "to" assignees are required' });
    return;
  }
  const count = reassignTasks(from, to);
  res.json({ data: { reassigned: count } });
});

export default app;
