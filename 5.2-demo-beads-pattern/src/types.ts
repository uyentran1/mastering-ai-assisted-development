export interface User {
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface ValidationResult {
  valid: User[];
  invalid: Array<{ user: Record<string, string>; errors: string[] }>;
}

export interface DeduplicationResult {
  unique: User[];
  duplicates: User[];
}
