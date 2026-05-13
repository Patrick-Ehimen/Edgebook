import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api';
import type { SignInInput } from '../schemas';

export function useSignIn() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: SignInInput) => authApi.signIn(data),
    onSuccess: (res) => {
      if (res.twoFactorRequired) {
        router.push(`/2fa?challengeId=${res.challengeId}`);
      } else {
        qc.setQueryData(['session'], res.session);
        router.push(res.session.isOnboarded ? '/dashboard' : '/onboarding');
      }
    },
  });
}
