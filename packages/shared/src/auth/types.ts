export type OAuthProvider = 'google' | 'github' | 'x';

export interface User {
  id: string;
  handle: string;
  email: string;
  emailVerifiedAt: string | null; // ISO timestamp
  twoFactorEnrolledAt: string | null;
  createdAt: string;
}
