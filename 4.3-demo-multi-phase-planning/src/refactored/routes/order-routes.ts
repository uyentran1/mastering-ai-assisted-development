/**
 * Refactored: Order Routes
 *
 * Follows the same pattern as user routes.
 * Thin HTTP wrappers delegating to services.
 */

import express, { Request, Response } from 'express';
import { IOrderService } from '../types';

export function createOrderRoutes(orderService: IOrderService) {
  const router = express.Router();

  // GET /orders — List all orders
  router.get('/orders', async (req: Request, res: Response) => {
    const result = await orderService.getAllOrders();
    if (result.error) {
      return res.status(result.error.statusCode).json({ error: result.error.message });
    }
    res.json({ data: result.data });
  });

  // GET /orders/:id — Get a specific order
  router.get('/orders/:id', async (req: Request, res: Response) => {
    const result = await orderService.getOrderById(req.params.id);
    if (result.error) {
      return res.status(result.error.statusCode).json({ error: result.error.message });
    }
    res.json({ data: result.data });
  });

  // GET /users/:userId/orders — Get orders for a user
  router.get('/users/:userId/orders', async (req: Request, res: Response) => {
    const result = await orderService.getOrdersByUserId(req.params.userId);
    if (result.error) {
      return res.status(result.error.statusCode).json({ error: result.error.message });
    }
    res.json({ data: result.data });
  });

  // POST /orders — Create a new order
  router.post('/orders', async (req: Request, res: Response) => {
    const { userId, items } = req.body;
    const result = await orderService.createOrder(userId, items);
    if (result.error) {
      return res.status(result.error.statusCode).json({ error: result.error.message });
    }
    res.status(201).json({ data: result.data });
  });

  // PATCH /orders/:id/status — Update order status
  router.patch('/orders/:id/status', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await orderService.updateOrderStatus(id, status);
    if (result.error) {
      return res.status(result.error.statusCode).json({ error: result.error.message });
    }
    res.json({ data: result.data });
  });

  // DELETE /orders/:id — Delete an order
  router.delete('/orders/:id', async (req: Request, res: Response) => {
    const result = await orderService.deleteOrder(req.params.id);
    if (result.error) {
      return res.status(result.error.statusCode).json({ error: result.error.message });
    }
    res.json({ data: { success: true } });
  });

  return router;
}
