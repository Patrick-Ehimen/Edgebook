import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api';
import type { VerifyEmailInput } from '../schemas';

export function useVerifyEmail() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: VerifyEmailInput) => authApi.verifyEmail(data),
    onSuccess: () => {
      router.push('/sign-in?verified=1');
    },
  });
}
