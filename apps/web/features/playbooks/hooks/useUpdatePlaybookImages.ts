import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Playbook } from '../schemas';
import { playbooksApi } from '../api';

export function useUpdatePlaybookImages(playbookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (images: string[]) => playbooksApi.updateImages(playbookId, images),
    onMutate: async (images) => {
      await qc.cancelQueries({ queryKey: ['playbooks', playbookId] });
      const previous = qc.getQueryData<Playbook>(['playbooks', playbookId]);
      qc.setQueryData<Playbook>(['playbooks', playbookId], (old) =>
        old ? { ...old, images } : old,
      );
      return { previous };
    },
    onError: (_err, _images, context) => {
      if (context?.previous) {
        qc.setQueryData(['playbooks', playbookId], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['playbooks', playbookId] });
    },
  });
}
