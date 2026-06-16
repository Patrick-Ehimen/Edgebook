import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api';
import type { SignUpInput } from '../schemas';

export function useSignUp() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: SignUpInput) => authApi.signUp(data),
    onSuccess: (res) => {
      router.push(res.session.isOnboarded ? '/dashboard' : '/onboarding');
    },
  });
}
