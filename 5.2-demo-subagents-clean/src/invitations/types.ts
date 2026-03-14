/**
 * Type definitions for the Invitations module.
 */

export interface Invitation {
  id: string;
  token: string;
  email: string;
  created_by_user_id: string;
  redeemed_at?: string;
  redeemed_by_user_id?: string;
  expires_at: string;
  created_at: string;
}

export interface GenerateInvitationRequest {
  email: string;
}

export interface GenerateInvitationResponse {
  token: string;
  expiresAt: string;
}

export interface RedeemInvitationRequest {
  name: string;
  password: string;
}

export interface RedeemInvitationResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  message: string;
}
