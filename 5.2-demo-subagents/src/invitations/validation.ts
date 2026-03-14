/**
 * Input validation for the invitations feature.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate invitation creation request
 */
export function validateInvitationRequest(email: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!email || email.trim() === '') {
    errors.push({ field: 'email', message: 'Email is required' });
    return errors;
  }

  if (!EMAIL_REGEX.test(email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  return errors;
}

/**
 * Validate redemption request
 */
export function validateRedemptionRequest(
  name: string,
  password: string,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!name || name.trim() === '') {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
    return errors;
  }

  if (password.length < 8) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters',
    });
  }

  if (!PASSWORD_REGEX.test(password)) {
    errors.push({
      field: 'password',
      message:
        'Password must contain uppercase, lowercase letters, and digits',
    });
  }

  return errors;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresAt: string): boolean {
  return new Date() > new Date(expiresAt);
}
