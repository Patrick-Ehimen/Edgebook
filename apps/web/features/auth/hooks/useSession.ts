import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api';
import { ApiError } from '@/lib/api-client';

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: authApi.session,
    retry: (count, err) => !(err instanceof ApiError && err.status === 401),
    staleTime: 5 * 60_000,
  });
}
