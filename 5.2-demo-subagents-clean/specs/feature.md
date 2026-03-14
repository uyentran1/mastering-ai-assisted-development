# Feature Specification: User Invitation System

## Overview

Add the ability for users to invite other users to join the platform via email. Invitations are one-time use tokens that can be redeemed to create a new user account.

## User Story

As a user, I want to invite friends to join the platform by sending them an email with a unique link. When they click the link, they can create an account without needing a traditional sign-up form.

## Acceptance Criteria

- [ ] Users can generate invitation tokens
- [ ] Each token is unique and one-time use only
- [ ] Tokens include an expiration date (7 days default)
- [ ] Expired tokens are rejected
- [ ] Already-redeemed tokens are rejected
- [ ] New users can redeem invitations to create accounts
- [ ] Email addresses are validated before sending invites

## API Endpoints

### Generate Invitation
```
POST /invitations
Request: { email: string }
Response: { token: string, expiresAt: string }
```

Validates:
- Email format is valid
- Email is not already registered
- User has permission to send invites (optional: limit per user)

### Redeem Invitation
```
POST /invitations/:token/redeem
Request: { name: string, password: string }
Response: { user: { id, email, name }, message: string }
```

Validates:
- Token exists and is not expired
- Token has not been previously redeemed
- Name is non-empty
- Password meets complexity requirements
- Email from token is not already registered (double-check)

### List Pending Invitations (Optional)
```
GET /invitations/pending
Response: [{ email, expiresAt, createdBy, createdAt }]
```

Auth: Requires admin role

## Data Model

### Invitations Table
```sql
CREATE TABLE invitations (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  redeemed_at TIMESTAMP NULL,
  redeemed_by_user_id TEXT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL
);
```

Key fields:
- `token`: Random, cryptographically secure string (e.g., 32 bytes base64)
- `redeemed_at`: NULL if not yet redeemed, timestamp if redeemed
- `redeemed_by_user_id`: NULL if not yet redeemed, user ID if redeemed
- `expires_at`: Always set at creation time

## Validation Rules

### Email Validation
- Must match standard email regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Must not be already registered
- Must not have a pending invitation

### Token Generation
- 32 bytes of random data, base64 encoded
- Uniqueness guaranteed by database constraint
- Expiration: 7 days from creation (configurable)

### Password Validation (on redemption)
- Minimum 8 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one digit

## Error Cases

| Scenario | HTTP Status | Error Code | Message |
|----------|------------|-----------|---------|
| Invalid email format | 400 | INVALID_EMAIL | Email format is invalid |
| Email already registered | 400 | EMAIL_EXISTS | Email is already registered |
| Too many pending invitations for user | 429 | RATE_LIMITED | Too many invitations sent |
| Token not found | 404 | TOKEN_NOT_FOUND | Invitation token not found |
| Token expired | 400 | TOKEN_EXPIRED | Invitation has expired |
| Token already redeemed | 400 | TOKEN_REDEEMED | Invitation has already been redeemed |
| Invalid password | 400 | INVALID_PASSWORD | Password does not meet requirements |
| Weak password | 400 | WEAK_PASSWORD | Password must contain uppercase, lowercase, and digits |

## Implementation Notes

1. **Security Considerations**:
   - Tokens should be cryptographically random (use `crypto.randomBytes`)
   - Tokens should NOT be logged or exposed in error messages
   - Always compare tokens in constant time (prevent timing attacks)
   - Hash passwords before storing

2. **Database Design**:
   - Create index on `token` for fast lookups
   - Create index on `email` for duplicate checking
   - Create index on `expires_at` for cleanup queries

3. **Testing Requirements**:
   - Happy path: generate, send, redeem
   - Token expiration: expired tokens rejected
   - Token reuse: redeemed tokens rejected
   - Invalid emails: rejected before sending
   - Password validation: weak passwords rejected
   - Race conditions: simultaneously redeeming same token

4. **Optional Enhancements**:
   - Email templates for invitation messages
   - Rate limiting per user (max 5 invites per day)
   - Admin panel to view/manage invitations
   - Automatic cleanup of expired invitations

## Definition of Done

- [ ] All endpoints implemented
- [ ] All validation rules enforced
- [ ] All error cases handled
- [ ] Comprehensive tests (80%+ coverage)
- [ ] No security vulnerabilities
- [ ] Code follows project patterns
- [ ] API documentation updated
