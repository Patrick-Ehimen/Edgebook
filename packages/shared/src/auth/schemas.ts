import { z } from 'zod';

/* ------------------------------- primitives ------------------------------- */

export const Email = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email('Enter a valid email address.');
export type Email = z.infer<typeof Email>;

export const Handle = z
  .string()
  .trim()
  .min(3, 'Handle must be at least 3 characters.')
  .max(20, 'Handle must be 20 characters or fewer.')
  .regex(/^[a-z0-9_]+$/i, 'Letters, numbers, and underscores only.');
export type Handle = z.infer<typeof Handle>;

export const OtpCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Code must be 6 digits.');
export type OtpCode = z.infer<typeof OtpCode>;

export const RecoveryCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Recovery code format: XXXX-XXXX');
export type RecoveryCode = z.infer<typeof RecoveryCode>;

/**
 * Password policy — single source of truth.
 * 12+ chars, mixed case, at least one digit. We deliberately don't require
 * symbols: adoption beats theoretical entropy.
 */
export const password = z
  .string()
  .min(12, 'At least 12 characters.')
  .max(128, 'Too long.')
  .refine((v) => /[a-z]/.test(v), 'Include a lowercase letter.')
  .refine((v) => /[A-Z]/.test(v), 'Include an uppercase letter.')
  .refine((v) => /\d/.test(v), 'Include a number.');

/* --------------------------------- session -------------------------------- */

export const SessionSchema = z.object({
  userId: z.string(),
  handle: Handle,
  email: Email,
  twoFactorPending: z.boolean(),
  isOnboarded: z.boolean(),
  expiresAt: z.string(), // ISO
});
export type Session = z.infer<typeof SessionSchema>;

/* ------------------------------- onboarding ------------------------------- */

export const CompleteOnboardingResponse = z.object({
  ok: z.literal(true),
});
export type CompleteOnboardingResponse = z.infer<typeof CompleteOnboardingResponse>;

/* --------------------------------- sign-in -------------------------------- */

export const SignInInput = z.object({
  email: Email,
  password: z.string().min(1, 'Enter your password.'),
  remember: z.boolean().optional(),
});
export type SignInInput = z.infer<typeof SignInInput>;

export const SignInResponse = z.discriminatedUnion('twoFactorRequired', [
  z.object({ twoFactorRequired: z.literal(false), session: SessionSchema }),
  z.object({ twoFactorRequired: z.literal(true), challengeId: z.string() }),
]);
export type SignInResponse = z.infer<typeof SignInResponse>;

/* --------------------------------- sign-up -------------------------------- */

export const SignUpInput = z.object({
  handle: Handle,
  email: Email,
  password,
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms.' }),
  }),
});
export type SignUpInput = z.infer<typeof SignUpInput>;

/** Sign-up does not return a session — caller must verify email next. */
export const SignUpResponse = z.object({
  email: Email,
});
export type SignUpResponse = z.infer<typeof SignUpResponse>;

/* ------------------------------ verify email ------------------------------ */

export const VerifyEmailInput = z.object({
  email: Email,
  code: OtpCode,
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailInput>;

export const VerifyEmailResponse = z.object({
  ok: z.literal(true),
});
export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponse>;

/* --------------------------------- 2fa ------------------------------------ */

export const EnrollTotpInitResponse = z.object({
  secret: z.string(), // base32
  otpauthUri: z.string(), // otpauth://totp/Edgebook:<email>?secret=...&issuer=Edgebook
  recoveryCodes: z.array(RecoveryCode).length(8),
});
export type EnrollTotpInitResponse = z.infer<typeof EnrollTotpInitResponse>;

export const EnrollTotpConfirmInput = z.object({
  code: OtpCode,
});
export type EnrollTotpConfirmInput = z.infer<typeof EnrollTotpConfirmInput>;

export const EnrollTotpConfirmResponse = z.object({
  enrolledAt: z.string(),
});
export type EnrollTotpConfirmResponse = z.infer<typeof EnrollTotpConfirmResponse>;

export const TwoFactorChallengeInput = z.object({
  challengeId: z.string(),
  // Either a 6-digit TOTP or an 8-char recovery code (XXXX-XXXX).
  code: z.union([OtpCode, RecoveryCode]),
});
export type TwoFactorChallengeInput = z.infer<typeof TwoFactorChallengeInput>;

export const TwoFactorChallengeResponse = z.object({
  session: SessionSchema,
});
export type TwoFactorChallengeResponse = z.infer<typeof TwoFactorChallengeResponse>;

/* ----------------------------- forgot / reset ----------------------------- */

export const ForgotPasswordInput = z.object({
  email: Email,
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInput>;

/** Always returns ok — never leaks whether the account exists. */
export const ForgotPasswordResponse = z.object({
  ok: z.literal(true),
});
export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponse>;

export const ResetPasswordInput = z.object({
  email: Email,
  code: OtpCode,
  newPassword: password,
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordInput>;

export const ResetPasswordResponse = z.object({
  ok: z.literal(true),
});
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponse>;
