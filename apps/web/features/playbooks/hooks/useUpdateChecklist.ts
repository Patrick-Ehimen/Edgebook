import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type UpdateChecklistBody, playbooksApi } from '../api';

export function useUpdateChecklist(playbookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      checklistId,
      body,
    }: {
      checklistId: string | null;
      body: UpdateChecklistBody;
    }) =>
      checklistId
        ? playbooksApi.updateChecklist(playbookId, checklistId, body)
        : playbooksApi.createChecklist(playbookId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks', playbookId] });
      qc.invalidateQueries({ queryKey: ['playbooks'] });
    },
  });
}
