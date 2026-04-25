'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  ExternalLink,
  Archive,
  ArchiveRestore,
  Trash2,
  Bell,
  ImagePlus,
  Pin,
  Copy,
  MoreHorizontal,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import KeywordRichEditor from '@/components/KeywordRichEditor';
import ChecklistEditor from '@/components/ChecklistEditor';
import { AuthenticatedNoteImage } from '@/components/AuthenticatedNoteImage';
import {
  NOTE_COLOR_OPTIONS,
  noteColorSwatchTw,
  type NoteColorId,
  resolveNoteColorKey,
  getKeepCardClasses,
} from '@/lib/note-colors';
import type { ChecklistItemState, NoteImageMeta } from '@/types/note';
import { toast } from 'sonner';

interface FullNote {
  id: string;
  title: string | null;
  content: string;
  note_type: string;
  checklist_items: ChecklistItemState[] | null;
  color: string | null;
  reminder_at: string | null;
  is_archived: boolean;
  is_pinned: boolean;
  is_favorite: boolean;
  images: NoteImageMeta[] | null;
}

/** Stable JSON for autosave: only run PUT when the draft differs from the last load/save. */
function buildAutosaveSnapshot(
  n: FullNote,
  title: string,
  content: string,
  items: ChecklistItemState[]
): string {
  const t = title.trim() || null;
  if (n.note_type === 'checklist') {
    const checklist_items = items
      .filter((i) => i.text.trim())
      .map((i, order) => ({
        text: i.text.trim(),
        checked: i.checked,
        order,
      }));
    return JSON.stringify({ t, k: 'checklist' as const, checklist_items });
  }
  return JSON.stringify({ t, k: 'text' as const, c: content });
}

export default function NoteEditModal({
  noteId,
  onClose,
}: {
  noteId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [note, setNote] = useState<FullNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  /** Editor seed only; do not pass live `content` or every debounced form update re-signals as external. */
  const [contentSnapshot, setContentSnapshot] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItemState[]>([
    { text: '', checked: false, order: 0 },
  ]);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [moreOpen, setMoreOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const noteRef = useRef<FullNote | null>(null);
  noteRef.current = note;
  const lastSavedSnapshotRef = useRef('');

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get<FullNote>(`/api/v1/notes/${noteId}`);
      const n = r.data;
      const listItems: ChecklistItemState[] = n.checklist_items?.length
        ? n.checklist_items.map((it, i) => ({
            text: it.text,
            checked: it.checked,
            order: it.order ?? i,
          }))
        : [{ text: '', checked: false, order: 0 }];
      setNote(n);
      setTitle(n.title ?? '');
      setContent(n.content ?? '');
      setContentSnapshot(n.content ?? '');
      setChecklistItems(listItems);
      lastSavedSnapshotRef.current = buildAutosaveSnapshot(n, n.title ?? '', n.content ?? '', listItems);
    } catch {
      toast.error('Could not load note');
      onCloseRef.current();
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || !noteRef.current) return;
    const t = window.setTimeout(async () => {
      const n = noteRef.current;
      if (!n) return;
      const current = buildAutosaveSnapshot(n, title, content, checklistItems);
      if (current === lastSavedSnapshotRef.current) {
        return;
      }
      setSaveState('saving');
      try {
        const payload: Record<string, unknown> = {
          title: title.trim() || null,
          content: n.note_type === 'checklist' ? '' : content,
        };
        if (n.note_type === 'checklist') {
          payload.checklist_items = checklistItems
            .filter((i) => i.text.trim())
            .map((i, order) => ({
              text: i.text.trim(),
              checked: i.checked,
              order,
            }));
        }
        await api.put(`/api/v1/notes/${noteId}`, payload);
        lastSavedSnapshotRef.current = current;
        setSaveState('saved');
        window.dispatchEvent(new Event('dashboard:refresh-notes'));
      } catch {
        setSaveState('idle');
        toast.error('Save failed');
      }
    }, 650);
    return () => window.clearTimeout(t);
  }, [title, content, checklistItems, loading, noteId]);

  const patchNote = async (patch: Record<string, unknown>) => {
    try {
      const r = await api.put<FullNote>(`/api/v1/notes/${noteId}`, patch);
      setNote(r.data);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch {
      toast.error('Update failed');
    }
  };

  const setColor = (c: NoteColorId) => {
    const v = c === 'default' ? null : c;
    void patchNote({ color: v });
  };

  const reminderValue = note?.reminder_at
    ? new Date(note.reminder_at).toISOString().slice(0, 16)
    : '';

  const onReminderChange = (v: string) => {
    if (!v) {
      void patchNote({ reminder_at: null });
      return;
    }
    const d = new Date(v);
    void patchNote({ reminder_at: d.toISOString() });
  };

  const copyNote = async () => {
    try {
      const r = await api.post<{ id: string }>(`/api/v1/notes/${noteId}/copy`);
      toast.success('Copy created');
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      onClose();
      router.push(`/dashboard?note=${r.data.id}`);
    } catch {
      toast.error('Could not copy');
    }
  };

  const deleteNote = async () => {
    if (!confirm('Move this note to trash?')) return;
    try {
      await api.delete(`/api/v1/notes/${noteId}`);
      toast.success('Note deleted');
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      onClose();
    } catch {
      toast.error('Could not delete');
    }
  };

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await api.post<FullNote>(`/api/v1/notes/${noteId}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNote((prev) =>
        prev
          ? {
              ...prev,
              images: r.data.images ?? prev.images,
            }
          : null
      );
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      toast.success('Image added');
    } catch {
      toast.error('Upload failed');
    }
  };

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
        role="dialog"
        aria-modal
        onClick={onClose}
      >
        <div
          className="rounded-2xl bg-card p-8 shadow-elevated"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return null;
  }

  const { surface, bar } = getKeepCardClasses(note.color);
  const isChecklist = note.note_type === 'checklist';

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/45 p-4 pt-10 sm:pt-16"
        role="dialog"
        aria-modal
        aria-labelledby="note-modal-title"
        onClick={onClose}
      >
        <div
          className={`relative w-full max-w-2xl rounded-2xl shadow-elevated border ${surface}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`absolute left-0 right-0 top-0 h-1 rounded-t-2xl ${bar}`} aria-hidden />
          <div className="flex items-start justify-between gap-2 p-4 pb-0">
            <input
              id="note-modal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="flex-1 border-0 bg-transparent text-lg font-semibold placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-0"
            />
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="px-4 py-3 min-h-[120px]">
            {isChecklist ? (
              <ChecklistEditor items={checklistItems} onChange={setChecklistItems} />
            ) : (
              <KeywordRichEditor
                value={contentSnapshot}
                onChangeText={setContent}
                placeholder="Take a note…"
                className="min-h-[140px] rounded-lg border border-transparent px-2 py-2 text-sm focus-visible:outline-none"
              />
            )}
          </div>

          {note.images && note.images.length > 0 && (
            <div className="px-4 flex flex-wrap gap-2">
              {note.images.map((im) => (
                <button
                  key={im.id}
                  type="button"
                  onClick={() => setLightbox(im.id)}
                  className="relative h-24 w-24 overflow-hidden rounded-lg border border-black/10"
                >
                  <AuthenticatedNoteImage
                    noteId={noteId}
                    imageId={im.id}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1 border-t border-black/5 px-3 py-2 dark:border-white/10">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={note.is_pinned ? 'Unpin' : 'Pin'}
              onClick={() => void patchNote({ is_pinned: !note.is_pinned })}
            >
              <Pin className={`h-4 w-4 ${note.is_pinned ? 'text-secondary fill-secondary/30' : ''}`} />
            </Button>
            <div className="flex flex-wrap gap-0.5 max-w-[200px] sm:max-w-none">
              {NOTE_COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.id)}
                  className={`h-6 w-6 rounded-full shrink-0 ${noteColorSwatchTw(c.id)} ${
                    resolveNoteColorKey(note.color) === c.id
                      ? 'ring-2 ring-offset-2 ring-offset-card ring-primary'
                      : ''
                  }`}
                />
              ))}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10">
              <Bell className="h-4 w-4" />
              <input
                type="datetime-local"
                value={reminderValue}
                onChange={(e) => onReminderChange(e.target.value)}
                className="max-w-[11rem] border-0 bg-transparent text-xs focus:outline-none"
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10">
              <ImagePlus className="h-4 w-4" />
              <span className="text-xs">Image</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadImage(f);
                  e.target.value = '';
                }}
              />
            </label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={note.is_archived ? 'Unarchive' : 'Archive'}
              onClick={() => void patchNote({ is_archived: !note.is_archived })}
            >
              {note.is_archived ? (
                <ArchiveRestore className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href={`/dashboard/notes/${noteId}`} onClick={onClose}>
                <ExternalLink className="h-3.5 w-3.5" />
                Full view
              </Link>
            </Button>
            <div className="relative ml-auto">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMoreOpen((v) => !v)}
                data-note-modal-more
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {moreOpen && (
                <div
                  className="absolute right-0 bottom-full mb-1 z-10 min-w-[10rem] rounded-lg border border-border bg-card py-1 shadow-elevated"
                  data-note-modal-more
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setMoreOpen(false);
                      void copyNote();
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Make a copy
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                    onClick={() => {
                      setMoreOpen(false);
                      void deleteNote();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="px-4 pb-3 text-[10px] text-muted-foreground">
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : ''}
          </p>
        </div>
      </div>
      {lightbox && (
        <button
          type="button"
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
          aria-label="Close image"
        >
          <div className="max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <AuthenticatedNoteImage
              noteId={noteId}
              imageId={lightbox}
              alt=""
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
            />
          </div>
        </button>
      )}
    </>
  );
}
