/**
 * API composition root.
 *
 * All handling now lives in the layered architecture under src/refactored/:
 *
 *   routes → services → repositories → types
 *
 * This file's only job is wiring: build the repositories, inject them into the
 * services, inject those into the routers, and mount the result. The endpoints
 * and response shapes are unchanged from the monolithic version this replaced.
 */

import express from 'express';
import { InMemoryOrderRepository } from './refactored/repositories/order-repository';
import { InMemoryUserRepository } from './refactored/repositories/user-repository';
import { createOrderRoutes } from './refactored/routes/order-routes';
import { createUserRoutes } from './refactored/routes/user-routes';
import { OrderService } from './refactored/services/order-service';
import { UserService } from './refactored/services/user-service';

/**
 * Builds a router over its own fresh repositories.
 *
 * Exported so callers that need an isolated store — tests, most obviously —
 * can get one without reaching into module state.
 */
export function createApiRouter(): express.Router {
  const userRepository = new InMemoryUserRepository();
  const orderRepository = new InMemoryOrderRepository();

  const userService = new UserService(userRepository);
  const orderService = new OrderService(orderRepository, userRepository);

  const router = express.Router();
  router.use(createUserRoutes(userService));
  router.use(createOrderRoutes(orderService));
  return router;
}

/** The application's router. */
export default createApiRouter();
