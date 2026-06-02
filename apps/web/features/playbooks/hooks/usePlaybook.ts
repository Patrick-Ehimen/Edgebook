import { useQuery } from '@tanstack/react-query';
import { playbooksApi } from '../api';

export function usePlaybook(id: string | null) {
  return useQuery({
    queryKey: ['playbooks', id],
    queryFn: () => playbooksApi.get(id!),
    enabled: !!id,
  });
}
