/**
 * Task routes
 */

import express, { Request, Response } from 'express';
import { db } from '../db/mock';
import { CreateTaskRequest, UpdateTaskRequest } from '../../shared/types';

const router = express.Router({ mergeParams: true });

router.get('/', (req: Request, res: Response) => {
  const { projectId } = req.params;
  const tasks = db.getTasks(projectId);
  res.json({ data: tasks });
});

router.post('/', (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { title, description, priority, assignee, due_date } = req.body as CreateTaskRequest;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const task = db.createTask({
    project_id: projectId,
    title,
    description,
    status: 'todo',
    priority: priority || 'medium',
    assignee,
    due_date,
  });

  res.status(201).json({ data: task });
});

router.patch('/:taskId', (req: Request, res: Response) => {
  const { taskId } = req.params;
  const task = db.getTask(taskId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const updates = req.body as UpdateTaskRequest;
  const updated = db.updateTask(taskId, updates);

  res.json({ data: updated });
});

router.delete('/:taskId', (req: Request, res: Response) => {
  const { taskId } = req.params;
  const success = db.deleteTask(taskId);

  if (!success) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json({ success: true });
});

export default router;
