import { NoteData } from "../../lib/notes-service";

export interface TodoItem extends NoteData {
  id: string;
  isCompleted?: boolean;
  isPinned?: boolean;
}