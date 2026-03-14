import express, { Express, Request, Response } from 'express';

const app: Express = express();
const PORT = 3000;

app.use(express.json());

/**
 * TODO: Implement health check endpoint
 * GET /health should return { status: 'ok', timestamp, uptime }
 */

/**
 * TODO: Implement features endpoint
 * GET /features should return list of feature flags
 */

/**
 * TODO: Implement task creation endpoint
 * POST /tasks should create and return a new task
 */

/**
 * TODO: Implement task retrieval endpoint
 * GET /tasks/:id should return a task by ID
 */

export default app;
