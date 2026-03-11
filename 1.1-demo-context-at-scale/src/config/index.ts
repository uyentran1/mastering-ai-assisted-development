export const config = {
  port: process.env.PORT || 3010,
  stripeSecret: process.env.STRIPE_SECRET || 'sk_test_demo',
  webhookSecret: process.env.WEBHOOK_SECRET || 'whsec_demo',
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
};
