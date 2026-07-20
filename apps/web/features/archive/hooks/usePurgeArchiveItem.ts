import type { ArchiveItemType } from '@edgebook/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveApi } from '../api';

export function usePurgeArchiveItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id }: { type: ArchiveItemType; id: string }) => archiveApi.purge(type, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['archive'] });
    },
  });
}
