import { api } from "@/lib/api-client";
import { z } from "zod";
import { NoteListResponse, NoteSchema } from "./schemas";

export interface CreateNoteBody {
  folderId: string;
  name: string;
  iconId: string;
}

export interface UpdateNoteBody {
  name?: string;
  bodyMd?: string;
  iconId?: string;
  tags?: string[];
  playbookId?: string | null;
}

const DeleteResponse = z.object({ deleted: z.literal(true) });

export const notesApi = {
  list: () => api.get("/notes", NoteListResponse),
  create: (body: CreateNoteBody) => api.post("/notes", NoteSchema, body),
  move: (id: string, folderId: string) =>
    api.patch(`/notes/${id}/move`, NoteSchema, { folderId }),
  pin: (id: string, pinned: boolean) =>
    api.patch(`/notes/${id}/pin`, NoteSchema, { pinned }),
  update: (id: string, body: UpdateNoteBody) => api.patch(`/notes/${id}`, NoteSchema, body),
  remove: (id: string) => api.delete(`/notes/${id}`, DeleteResponse),
};
