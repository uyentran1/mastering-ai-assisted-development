import { Router } from 'express';
import { PaymentModel } from '../models/payment';

const router = Router();

router.get('/:id', async (req, res, next) => {
  try {
    const payment = await PaymentModel.findById(req.params.id);
    if (!payment) {
      res.status(404).json({ data: null, error: 'Payment not found' });
      return;
    }
    res.json({ data: payment, error: null });
  } catch (err) {
    next(err);
  }
});

router.get('/user/:userId', async (req, res, next) => {
  try {
    const payments = await PaymentModel.findByUserId(req.params.userId);
    res.json({ data: payments, error: null, meta: { count: payments.length } });
  } catch (err) {
    next(err);
  }
});

/*
 * DEMO TASK: Add a webhook handler for payment events here.
 * The AI should use verifyWebhookSignature middleware and follow the patterns above.
 */

export default router;
