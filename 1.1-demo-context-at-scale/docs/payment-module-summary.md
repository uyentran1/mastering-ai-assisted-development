# Payment Module Summary
## 12 files, ~2400 lines

### Public API
- PaymentService.processPayment(order) — Main entry point
- PaymentService.refund(paymentId, reason) — Process refunds
- PaymentService.getHistory(userId, opts) — Get payment history

### Internal Flow
processPayment → validateOrder → chargeCard → createRecord → sendReceipt

### Key Dependencies
- Stripe SDK for card processing
- Redis for idempotency keys
- Database for payment records

### Known Edge Cases
- Partial refunds require Stripe's transfer_reversal API
- Idempotency key TTL is 24 hours
- Currency conversion happens in chargeCard, not in processPayment
