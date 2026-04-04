'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Plus,
  Search,
  MoreHorizontal,
  FileText,
  Mic,
  Pin,
  Heart,
  Archive,
  Trash2,
  RotateCcw,
  Eraser,
} from 'lucide-react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getTagPillClass, getTagPillStyle } from '@/lib/tag-colors';
import type { NoteListItem } from '@/types/note';
import { formatVoiceDuration, isVoiceMemo } from '@/lib/note-kind';
import { toast } from 'sonner';

const NOTES_LIST_WAVE_BARS = [10, 16, 8, 20, 12, 18, 7, 15, 11, 19, 9, 14];

function NotesListWaveform() {
  return (
    <div className="flex h-7 items-end gap-px" aria-hidden>
      {NOTES_LIST_WAVE_BARS.map((h, i) => (
        <span
          key={i}
          className="w-0.5 shrink-0 rounded-full bg-secondary/40 dark:bg-secondary/50"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

const LIST_TITLES: Record<string, string> = {
  all: 'All Notes',
  favorites: 'Favorites',
  archived: 'Archived',
  deleted: 'Recently Deleted',
};

export function NotesList() {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchForApi, setSearchForApi] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [menuNoteId, setMenuNoteId] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const activeNoteId = params.id as string | undefined;
  const filter = searchParams.get('filter') ?? 'all';
  const tagId = searchParams.get('tag_id') ?? null;

  useEffect(() => {
    const t = setTimeout(() => setSearchForApi(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const paramsApi: Record<string, string> = {};
      if (filter === 'favorites') paramsApi.favorite = 'true';
      if (filter === 'archived') paramsApi.archived = 'true';
      if (filter === 'deleted') paramsApi.deleted = 'true';
      if (tagId) paramsApi.tag_id = tagId;
      if (searchForApi) paramsApi.q = searchForApi;
      const response = await api.get<NoteListItem[]>('/api/v1/notes', { params: paramsApi });
      setNotes(response.data);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      toast.error('Could not load notes list');
    } finally {
      setIsLoading(false);
    }
  }, [filter, tagId, searchForApi]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    const onRefresh = () => fetchNotes();
    window.addEventListener('dashboard:refresh-notes', onRefresh);
    return () => window.removeEventListener('dashboard:refresh-notes', onRefresh);
  }, [fetchNotes]);

  useEffect(() => {
    if (!menuNoteId) return;
    const close = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest(`[data-note-actions="${menuNoteId}"]`)) return;
      setMenuNoteId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuNoteId]);

  const createNewNote = async () => {
    try {
      const response = await api.post('/api/v1/notes', {
        title: 'Untitled Note',
        content: '',
      });
      router.push(`/dashboard/notes/${response.data.id}`);
      fetchNotes();
      toast.success('New note created');
    } catch (error) {
      console.error('Failed to create note:', error);
      toast.error('Could not create note');
    }
  };

  const updateNoteField = async (
    noteId: string,
    patch: Partial<Pick<NoteListItem, 'is_pinned' | 'is_favorite' | 'is_archived'>>
  ) => {
    try {
      await api.put(`/api/v1/notes/${noteId}`, patch);
      setMenuNoteId(null);
      fetchNotes();
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      toast.success('Updated');
    } catch {
      toast.error('Could not update note');
    }
  };

  const softDeleteNote = async (noteId: string) => {
    try {
      await api.delete(`/api/v1/notes/${noteId}`);
      setMenuNoteId(null);
      fetchNotes();
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      toast.success('Moved to trash');
      if (activeNoteId === noteId) {
        router.push('/dashboard');
      }
    } catch {
      toast.error('Could not delete note');
    }
  };

  const restoreNote = async (noteId: string) => {
    try {
      await api.post(`/api/v1/notes/${noteId}/restore`);
      setMenuNoteId(null);
      fetchNotes();
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      toast.success('Note restored');
    } catch {
      toast.error('Could not restore note');
    }
  };

  const permanentDelete = async (noteId: string) => {
    if (!confirm('Permanently delete this note? This cannot be undone.')) return;
    try {
      await api.delete(`/api/v1/notes/${noteId}/permanent`);
      setMenuNoteId(null);
      fetchNotes();
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      toast.success('Note permanently deleted');
      if (activeNoteId === noteId) {
        router.push('/dashboard?filter=deleted');
      }
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Could not delete note');
    }
  };

  const listTitle = tagId ? 'Tag' : LIST_TITLES[filter] ?? LIST_TITLES.all;
  const showCreateButton =
    filter === 'all' || filter === 'archived' || filter === 'favorites' || !!tagId;

  const openNote = (id: string) => {
    router.push(`/dashboard/notes/${id}`);
  };

  return (
    <div className="w-80 flex h-full flex-shrink-0 flex-col border-r border-border/70 bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col gap-4 border-b border-border/50 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">{listTitle}</h2>
            <div className="mt-2 h-0.5 w-10 rounded-full bg-gradient-to-r from-secondary to-primary/35" />
          </div>
          {showCreateButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full bg-secondary text-secondary-foreground shadow-card hover:bg-secondary/90 hover:text-secondary-foreground hover:shadow-card-hover"
              onClick={createNewNote}
              title="New note"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div
          className={`relative transition-transform duration-200 ${searchFocused ? 'scale-[1.02]' : ''}`}
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search notes…"
            className="h-10 w-full rounded-xl border border-border/80 bg-card/90 pl-9 pr-3 text-sm text-foreground shadow-search-inset placeholder:text-muted-foreground/70 focus:border-secondary/40 focus:outline-none focus:ring-2 focus:ring-secondary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            aria-label="Search notes in list"
          />
        </div>
      </div>

      <div className="flex-1 space-y-0 overflow-y-auto px-2 pb-4 pt-2">
        {isLoading ? (
          <div className="flex justify-center p-6">
            <Spinner />
          </div>
        ) : notes.length === 0 ? (
          <div className="px-2 py-10 text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/45" />
            <p className="text-sm text-muted-foreground">
              {searchForApi ? 'No matching notes' : 'No notes yet'}
            </p>
          </div>
        ) : (
          notes.map((note, idx) => {
            const isActive = activeNoteId === note.id;
            const menuOpen = menuNoteId === note.id;
            const voice = isVoiceMemo(note);
            const voiceDuration = formatVoiceDuration(note.voice_duration_seconds);
            return (
              <div key={note.id}>
                <div
                  role="link"
                  tabIndex={0}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group relative cursor-pointer rounded-xl border border-transparent px-3 py-3 transition-all duration-200 ${
                    isActive
                      ? 'border-border/60 bg-card/95 shadow-card ring-1 ring-secondary/15'
                      : voice
                        ? 'hover:bg-muted/35'
                        : 'hover:bg-card/50'
                  }`}
                  onClick={() => openNote(note.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openNote(note.id);
                    }
                  }}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-secondary"
                      aria-hidden
                    />
                  )}
                  <div className="pl-2">
                    {voice && (
                      <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/40 px-2 py-1.5 dark:bg-muted/25">
                        <NotesListWaveform />
                        <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                          <Mic className="h-3 w-3 text-secondary" aria-hidden />
                          Voice
                          {voiceDuration ? (
                            <span className="font-mono tabular-nums opacity-90">{voiceDuration}</span>
                          ) : null}
                        </span>
                      </div>
                    )}
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3
                        className={`truncate pr-2 font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}
                      >
                        {note.title || 'Untitled Note'}
                      </h3>
                      <div
                        className="relative shrink-0"
                        data-note-actions={note.id}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-mr-1 -mt-0.5 h-6 w-6 text-muted-foreground opacity-70 hover:opacity-100 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuNoteId(menuOpen ? null : note.id);
                          }}
                          aria-expanded={menuOpen}
                          aria-haspopup="menu"
                          aria-label={`More actions for ${note.title || 'note'}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {menuOpen && (
                          <div
                            className="absolute right-0 top-full z-30 mt-1 min-w-[11rem] rounded-lg border border-border bg-card py-1 shadow-elevated"
                            role="menu"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {filter !== 'deleted' ? (
                              <>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() => updateNoteField(note.id, { is_pinned: !note.is_pinned })}
                                >
                                  <Pin className="h-4 w-4 shrink-0" />
                                  {note.is_pinned ? 'Unpin' : 'Pin'}
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() => updateNoteField(note.id, { is_favorite: !note.is_favorite })}
                                >
                                  <Heart className="h-4 w-4 shrink-0" />
                                  {note.is_favorite ? 'Unfavorite' : 'Favorite'}
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() => updateNoteField(note.id, { is_archived: !note.is_archived })}
                                >
                                  <Archive className="h-4 w-4 shrink-0" />
                                  {note.is_archived ? 'Unarchive' : 'Archive'}
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                                  onClick={() => softDeleteNote(note.id)}
                                >
                                  <Trash2 className="h-4 w-4 shrink-0" />
                                  Delete
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                                  onClick={() => restoreNote(note.id)}
                                >
                                  <RotateCcw className="h-4 w-4 shrink-0" />
                                  Restore
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                                  onClick={() => permanentDelete(note.id)}
                                >
                                  <Eraser className="h-4 w-4 shrink-0" />
                                  Delete forever
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {voice ? (
                      <div className="mb-2 space-y-0.5">
                        <p className="text-[10px] font-medium text-muted-foreground/90">Transcript</p>
                        <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">
                          {note.content || 'No transcript yet…'}
                        </p>
                      </div>
                    ) : (
                      <p className="mb-2 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">
                        {note.content || 'No content…'}
                      </p>
                    )}

                    {note.tags && note.tags.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {note.tags.slice(0, 2).map((t) => (
                          <span
                            key={t.id}
                            className={`max-w-[5.5rem] truncate rounded-full px-1.5 py-0.5 text-[10px] font-medium ${getTagPillClass(t.id)}`}
                            style={getTagPillStyle(t.id)}
                          >
                            {t.name}
                          </span>
                        ))}
                        {note.tags.length > 2 && (
                          <span className="rounded-full bg-muted/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            +{note.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-border/40 pt-2">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full border border-current opacity-70" />
                        {new Date(note.created_at).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {voice ? <Mic className="h-3 w-3 text-secondary" /> : <FileText className="h-3 w-3" />}
                      </span>
                    </div>
                  </div>
                </div>
                {idx < notes.length - 1 && (
                  <div className="mx-3 h-px bg-gradient-to-r from-transparent via-divider/80 to-transparent" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
