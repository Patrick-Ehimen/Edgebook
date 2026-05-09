import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api';
import type { EnrollTotpConfirmInput } from '../schemas';

export function useEnrollTotpInit() {
  return useQuery({
    queryKey: ['totp-init'],
    queryFn: authApi.enrollTotpInit,
    staleTime: Infinity,
    retry: false,
  });
}

export function useEnrollTotpConfirm() {
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: EnrollTotpConfirmInput) => authApi.enrollTotpConfirm(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session'] });
      router.push('/dashboard');
    },
  });
}
