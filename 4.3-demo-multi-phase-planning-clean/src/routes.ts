/**
 * Before State: Monolithic Routes with Mixed Concerns
 *
 * This file contains all route handlers mixed with:
 * - Business logic
 * - Validation
 * - Database access
 *
 * This is the starting point for the multi-phase refactor demo.
 * The agent will break this apart into:
 * - src/refactored/routes/ (thin HTTP handlers)
 * - src/refactored/services/ (business logic)
 * - src/refactored/repositories/ (data access)
 */

import express, { Request, Response } from 'express';

const router = express.Router();

// Fake in-memory database
const users: any[] = [];
const orders: any[] = [];

// ============================================
// User Routes
// ============================================

/**
 * GET /users — List all users
 *
 * This handler does:
 * - Direct database access
 * - Response formatting
 * - Error handling
 */
router.get('/users', (req: Request, res: Response) => {
  try {
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /users/:id — Get a specific user
 *
 * This handler mixes:
 * - Validation (checking if id exists)
 * - Database lookup
 * - HTTP response formatting
 * - Error handling
 */
router.get('/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const user = users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: `User ${id} not found` });
    }
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /users — Create a new user
 *
 * This handler contains:
 * - Request parsing
 * - Validation logic (email format, name required)
 * - Database insertion
 * - Error handling (validation vs DB vs network errors all mixed)
 *
 * Problem: Validation logic is inline and hard to test
 */
router.post('/users', (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    // Validation scattered in handler
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || email.trim() === '') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Simple email regex (should be in a validator)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check for duplicate email
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Create user (direct DB access)
    const newUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      created_at: new Date().toISOString(),
    };
    users.push(newUser);

    res.status(201).json({ data: newUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * PUT /users/:id — Update a user
 */
router.put('/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = users.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: `User ${id} not found` });
    }

    if (name && name.trim() !== '') {
      user.name = name.trim();
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      if (users.some(u => u.id !== id && u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      user.email = email.trim();
    }

    user.updated_at = new Date().toISOString();
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /users/:id — Delete a user
 */
router.delete('/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return res.status(404).json({ error: `User ${id} not found` });
    }

    users.splice(index, 1);
    res.json({ data: { success: true } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============================================
// Order Routes
// ============================================

/**
 * GET /orders — List all orders
 */
router.get('/orders', (req: Request, res: Response) => {
  try {
    res.json({ data: orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * POST /orders — Create a new order
 *
 * Problem: This handler does:
 * - Validation (user must exist)
 * - Business logic (calculating order total)
 * - Database access (creating order, updating user)
 * - All mixed together in one function
 */
router.post('/orders', (req: Request, res: Response) => {
  try {
    const { userId, items } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: `User ${userId} not found` });
    }

    // Calculate total (business logic mixed in route handler)
    const total = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    if (total <= 0) {
      return res.status(400).json({ error: 'Order total must be greater than 0' });
    }

    const newOrder = {
      id: `order-${Date.now()}`,
      user_id: userId,
      items,
      total,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    orders.push(newOrder);

    // Update user (side effect, hard to test)
    user.order_count = (user.order_count || 0) + 1;

    res.status(201).json({ data: newOrder });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * GET /orders/:id — Get a specific order
 */
router.get('/orders/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = orders.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ error: `Order ${id} not found` });
    }
    res.json({ data: order });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
