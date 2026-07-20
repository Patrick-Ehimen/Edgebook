import { useQuery } from '@tanstack/react-query';
import { archiveApi } from '../api';

export function useArchiveList() {
  return useQuery({
    queryKey: ['archive'],
    queryFn: () => archiveApi.list(),
  });
}
