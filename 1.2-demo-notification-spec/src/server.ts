import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/*
 * DEMO TASK: Feed the spec to your AI tool and ask it to implement the
 * notification system. The AI should follow all six areas of the spec.
 *
 * Example prompt:
 *   "Read specs/notification-system.md and implement the notification system
 *    exactly as specified. Follow all conventions and boundaries."
 */

const PORT = process.env.PORT || 3011;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Notification spec demo running on http://localhost:${PORT}`);
  });
}

export default app;
