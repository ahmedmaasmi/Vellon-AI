/** Shared note shape for dashboard list APIs */

export interface NoteTagRef {
  id: string;
  name: string;
}

export interface NoteImageMeta {
  id: string;
  rel_path: string;
}

export interface ChecklistItemState {
  text: string;
  checked: boolean;
  order: number;
}

export interface NoteListItem {
  id: string;
  title: string;
  content: string;
  source?: string | null;
  voice_audio_available?: boolean;
  voice_duration_seconds?: number | null;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  is_favorite: boolean;
  is_pinned: boolean;
  tags?: NoteTagRef[];
  color?: string | null;
  note_type?: string;
  checklist_items?: ChecklistItemState[] | null;
  reminder_at?: string | null;
  images?: NoteImageMeta[] | null;
}
