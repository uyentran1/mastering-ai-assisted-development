import { Router } from 'express';

const router = Router();

interface Order {
  id: string;
  userId: string;
  items: Array<{ productId: string; quantity: number; priceCents: number }>;
  totalCents: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
}

const orders: Order[] = [
  {
    id: 'ord_1',
    userId: 'user_1',
    items: [{ productId: 'prod_1', quantity: 2, priceCents: 2999 }],
    totalCents: 5998,
    status: 'paid',
  },
];

router.get('/', (_req, res) => {
  res.json({ data: orders, error: null, meta: { count: orders.length } });
});

router.get('/:id', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ data: null, error: 'Order not found' });
    return;
  }
  res.json({ data: order, error: null });
});

export default router;
