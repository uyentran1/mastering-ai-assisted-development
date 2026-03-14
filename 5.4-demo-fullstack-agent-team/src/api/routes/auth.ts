/**
 * Auth routes
 */

import express, { Request, Response } from 'express';
import { db } from '../db/mock';
import { SignUpRequest, SignInRequest } from '../../shared/types';

const router = express.Router();

router.post('/signup', (req: Request, res: Response) => {
  const { email, password } = req.body as SignUpRequest;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const existing = db.findUser(email);
  if (existing) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const user = db.createUser(email);
  res.status(201).json({
    user_id: user.id,
    email: user.email,
    token: `token-${Date.now()}`,
    message: 'Account created',
  });
});

router.post('/signin', (req: Request, res: Response) => {
  const { email, password } = req.body as SignInRequest;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const user = db.findUser(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email' });
  }

  res.json({
    user_id: user.id,
    email: user.email,
    token: `token-${Date.now()}`,
    message: 'Logged in',
  });
});

export default router;
