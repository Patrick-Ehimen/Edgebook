import { api } from '@/lib/api-client';
import {
  SessionSchema,
  SignInInput,
  SignInResponse,
  SignUpInput,
  SignUpResponse,
  VerifyEmailInput,
  VerifyEmailResponse,
  EnrollTotpInitResponse,
  EnrollTotpConfirmInput,
  EnrollTotpConfirmResponse,
  TwoFactorChallengeInput,
  TwoFactorChallengeResponse,
  ForgotPasswordInput,
  ForgotPasswordResponse,
  ResetPasswordInput,
  ResetPasswordResponse,
} from './schemas';
import { z } from 'zod';

export const authApi = {
  session: () => api.get('/auth/session', SessionSchema),

  signIn: (body: SignInInput) => api.post('/auth/sign-in', SignInResponse, body),

  signUp: (body: SignUpInput) => api.post('/auth/sign-up', SignUpResponse, body),

  signOut: () => api.post('/auth/sign-out', z.object({ ok: z.literal(true) }), {}),

  verifyEmail: (body: VerifyEmailInput) =>
    api.post('/auth/verify-email', VerifyEmailResponse, body),

  resendVerification: (body: { email: string }) =>
    api.post('/auth/resend-verification', z.object({ ok: z.literal(true) }), body),

  enrollTotpInit: () => api.post('/auth/2fa/enroll-init', EnrollTotpInitResponse, {}),

  enrollTotpConfirm: (body: EnrollTotpConfirmInput) =>
    api.post('/auth/2fa/enroll-confirm', EnrollTotpConfirmResponse, body),

  twoFactorChallenge: (body: TwoFactorChallengeInput) =>
    api.post('/auth/2fa/challenge', TwoFactorChallengeResponse, body),

  forgotPassword: (body: ForgotPasswordInput) =>
    api.post('/auth/forgot', ForgotPasswordResponse, body),

  resetPassword: (body: ResetPasswordInput) =>
    api.post('/auth/reset', ResetPasswordResponse, body),
};
