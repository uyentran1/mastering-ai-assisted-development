/**
 * Express routes for the invitations feature.
 */

import express, { Request, Response, Router } from 'express';
import { InvitationService } from './service';
import { InvitationRepository } from './repository';

const router: Router = express.Router();
const repository = new InvitationRepository();
const service = new InvitationService(repository);

// Mock user context (in production, would come from auth middleware)
const mockUserId = 'user-1';

/**
 * POST /invitations
 * Generate a new invitation
 */
router.post('/invitations', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await service.createInvitation(email, mockUserId);

    if (Array.isArray(result)) {
      // Validation errors
      return res.status(400).json({ errors: result });
    }

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /invitations/:token/redeem
 * Redeem an invitation and create a user
 */
router.post('/invitations/:token/redeem', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { name, password } = req.body;

    const result = await service.redeemInvitation(token, name, password);

    if (Array.isArray(result)) {
      // Validation errors
      return res.status(400).json({ errors: result });
    }

    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /invitations
 * List all pending invitations
 */
router.get('/invitations', async (req: Request, res: Response) => {
  try {
    const invitations = await service.listPendingInvitations();
    return res.json({ data: invitations });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /invitations/:token
 * Revoke an invitation
 */
router.delete('/invitations/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const success = await service.revokeInvitation(token);
    if (!success) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /invitations/:email/resend
 * Revoke old invitation and send new one
 */
router.post('/invitations/:email/resend', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const result = await service.resendInvitation(email, mockUserId);

    if (Array.isArray(result)) {
      // Validation errors
      return res.status(400).json({ errors: result });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
