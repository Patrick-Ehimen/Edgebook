import { useQuery } from '@tanstack/react-query';
import { playbooksApi } from '../api';

export function usePlaybooks() {
  return useQuery({
    queryKey: ['playbooks'],
    queryFn: () => playbooksApi.list(),
  });
}
