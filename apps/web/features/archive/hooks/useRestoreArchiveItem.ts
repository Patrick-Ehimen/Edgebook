import type { ArchiveItemType } from '@edgebook/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveApi } from '../api';

const SOURCE_QUERY_KEYS: Record<ArchiveItemType, string[]> = {
  notes: ['notes'],
  watchlist: ['watchlist'],
  playbook: ['playbooks'],
  journal: ['journal-recent', 'journal-stats', 'journal-entry'],
};

export function useRestoreArchiveItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id }: { type: ArchiveItemType; id: string }) =>
      archiveApi.restore(type, id),
    onSuccess: (_data, { type }) => {
      qc.invalidateQueries({ queryKey: ['archive'] });
      for (const key of SOURCE_QUERY_KEYS[type]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
