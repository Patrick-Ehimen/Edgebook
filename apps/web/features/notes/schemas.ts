import { z } from 'zod';

export const NoteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  folderId: z.string(),
  name: z.string(),
  iconId: z.string(),
  bodyMd: z.string(),
  pinned: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LibraryNote = z.infer<typeof NoteSchema>;

export const NoteListResponse = z.array(NoteSchema);
