/**
 * Order HTTP endpoints.
 *
 * Thin handlers only — see user-routes.ts for the shape.
 */

import express, { Router } from 'express';
import { IOrderService } from '../types';
import { handle, respond } from './respond';

export function createOrderRoutes(orders: IOrderService): Router {
  const router = express.Router();

  router.get(
    '/orders',
    handle(async (_req, res) => {
      respond(res, await orders.getAllOrders());
    })
  );

  router.get(
    '/orders/:id',
    handle(async (req, res) => {
      respond(res, await orders.getOrderById(req.params.id));
    })
  );

  router.post(
    '/orders',
    handle(async (req, res) => {
      const { userId, items } = req.body ?? {};
      respond(res, await orders.createOrder({ userId, items }), 201);
    })
  );

  return router;
}
