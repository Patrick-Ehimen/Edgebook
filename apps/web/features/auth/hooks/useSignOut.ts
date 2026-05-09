import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api';

export function useSignOut() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.signOut,
    onSuccess: () => {
      qc.setQueryData(['session'], null);
      qc.clear();
      router.push('/sign-in');
    },
  });
}
