/**
 * Project routes
 */

import express, { Request, Response } from 'express';
import { db } from '../db/mock';
import { CreateProjectRequest, UpdateProjectRequest } from '../../shared/types';

const router = express.Router();

// Mock user ID (in production, from auth middleware)
const mockUserId = 'user-1';

router.get('/', (req: Request, res: Response) => {
  const projects = db.getProjects(mockUserId);
  res.json({ data: projects });
});

router.post('/', (req: Request, res: Response) => {
  const { name, description, color } = req.body as CreateProjectRequest;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const project = db.createProject({
    user_id: mockUserId,
    name,
    description,
    color: color || '#3B82F6',
  });

  res.status(201).json({ data: project });
});

router.get('/:id', (req: Request, res: Response) => {
  const project = db.getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json({ data: project });
});

router.patch('/:id', (req: Request, res: Response) => {
  const project = db.getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const updates = req.body as UpdateProjectRequest;
  const updated = db.createProject({ ...project, ...updates });
  res.json({ data: updated });
});

export default router;
