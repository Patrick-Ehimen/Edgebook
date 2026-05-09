import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api';
import type { TwoFactorChallengeInput } from '../schemas';

export function useTwoFactorChallenge() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: TwoFactorChallengeInput) => authApi.twoFactorChallenge(data),
    onSuccess: (res) => {
      qc.setQueryData(['session'], res.session);
      router.push('/dashboard');
    },
  });
}
