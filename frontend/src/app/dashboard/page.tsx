'use client';

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type DragEvent,
  type CSSProperties,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Search, Plus, LayoutGrid, List, RotateCcw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { getColorForTag, getNoteCardStylesForHex } from '@/lib/tag-colors';
import { useAuthStore } from '@/store/auth';
import VoiceMemoRecorder from '@/components/VoiceMemoRecorder';
import QuickAddBar from '@/components/QuickAddBar';
import NoteEditModal from '@/components/NoteEditModal';
import { NoteBoardCard } from '@/components/NoteBoardCard';
import { AuthenticatedNoteImage } from '@/components/AuthenticatedNoteImage';
import type { NoteListItem } from '@/types/note';
import { toast } from 'sonner';
import { formatVoiceDuration, isVoiceMemo } from '@/lib/note-kind';
import { getKeepCardClasses } from '@/lib/note-colors';

type Note = NoteListItem;

interface NoteCounts {
  all: number;
  archived: number;
  pinned: number;
  favorite: number;
  deleted: number;
}

const TAG_COLORS = ['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400', 'bg-red-400', 'bg-gray-400'];
const OUTLINE_COLORS = [
  'border-blue-400',
  'border-green-400',
  'border-purple-400',
  'border-orange-400',
  'border-red-400',
  'border-gray-400',
];

const VIEW_STORAGE_KEY = 'vellon-notes-view';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 26 },
  },
};

function useReminderPoll() {
  const seen = useRef(new Set<string>());
  useEffect(() => {
    const tick = async () => {
      try {
        const r = await api.get<NoteListItem[]>('/api/v1/notes/reminders/due');
        for (const n of r.data) {
          if (seen.current.has(n.id)) continue;
          seen.current.add(n.id);
          toast.info(`Reminder: ${n.title?.trim() || 'Note'}`, {
            description: (n.content || '').slice(0, 120) || undefined,
          });
        }
      } catch {
        /* offline / ignore */
      }
    };
    void tick();
    const id = window.setInterval(tick, 45_000);
    return () => window.clearInterval(id);
  }, []);
}

function getDragOutlineClasses(note: Note): {
  outlineClass: string;
  outlineStyle?: CSSProperties;
} {
  const firstTag = note.tags?.[0];
  const defaultIndex = OUTLINE_COLORS.length - 1;
  if (!firstTag) {
    return { outlineClass: OUTLINE_COLORS[defaultIndex] };
  }
  const resolved = getColorForTag(firstTag.id);
  if (resolved.type === 'palette') {
    return { outlineClass: OUTLINE_COLORS[resolved.index] };
  }
  const styles = getNoteCardStylesForHex(resolved.hex);
  return { outlineClass: '', outlineStyle: styles.outlineStyle };
}

function DashboardNotesSkeleton({ masonry }: { masonry: boolean }) {
  if (masonry) {
    return (
      <div className="notes-masonry">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-2xl border border-border/50 bg-muted/40 animate-pulse"
            aria-hidden
          />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl border border-border/50 bg-muted/40 animate-pulse" aria-hidden />
      ))}
    </div>
  );
}

function DashboardEmptyIllustration() {
  return (
    <div className="relative mb-8 flex items-center justify-center">
      <div
        className="pointer-events-none absolute -inset-16 flex items-center justify-center opacity-[0.12] text-secondary"
        aria-hidden
      >
        <div
          className="h-44 w-44 rounded-full border-2 border-dashed border-current animate-geometry-slow"
          style={{ borderImage: 'none' }}
        />
        <div className="absolute h-32 w-32 rotate-45 rounded-lg border border-current" />
      </div>
      <svg
        viewBox="0 0 120 100"
        className="relative z-[1] h-28 w-36 text-primary drop-shadow-lg"
        aria-hidden
      >
        <path
          fill="rgb(var(--card))"
          stroke="currentColor"
          strokeWidth="1.5"
          d="M20 18h38c4 0 8 3 8 8v58H28c-4.4 0-8-3.6-8-8V18z"
        />
        <path
          fill="rgb(var(--muted))"
          stroke="currentColor"
          strokeWidth="1.2"
          d="M58 26h42c4 0 8 3.2 8 8v48H66c-4.4 0-8-3.6-8-8V26z"
        />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.45"
          d="M32 38h22M32 48h18M32 58h24"
        />
      </svg>
    </div>
  );
}

function NoteListRow({
  note,
  onOpen,
}: {
  note: NoteListItem;
  onOpen: () => void;
}) {
  const voice = isVoiceMemo(note);
  const { surface, bar } = note.color
    ? getKeepCardClasses(note.color)
    : { surface: 'bg-card/90 border border-border/70', bar: 'bg-muted-foreground/30' };
  const firstImg = note.images?.[0];
  const snippet =
    note.note_type === 'checklist'
      ? (note.checklist_items || []).filter((i) => i.text.trim()).length + ' items'
      : (note.content || '').slice(0, 80);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-4 rounded-xl border p-3 text-left shadow-card transition hover:shadow-card-hover ${surface}`}
    >
      <div className={`h-1 w-1 shrink-0 rounded-full ${bar}`} aria-hidden />
      {firstImg ? (
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border/50">
          <AuthenticatedNoteImage noteId={note.id} imageId={firstImg.id} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
          {voice ? '🎙' : '📝'}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{note.title || 'Untitled Note'}</p>
        <p className="truncate text-sm text-muted-foreground">{snippet}</p>
      </div>
      {note.is_pinned && <span className="text-xs text-secondary">Pinned</span>}
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modalNoteId = searchParams.get('note');
  const { user } = useAuthStore();
  const filter = searchParams.get('filter') ?? 'all';
  const tagId = searchParams.get('tag_id') ?? null;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchForApi, setSearchForApi] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [voiceMemoOpen, setVoiceMemoOpen] = useState(false);
  const [stats, setStats] = useState({ all: 0, favorite: 0 });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useReminderPoll();

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_STORAGE_KEY);
      if (v === 'list' || v === 'grid') setViewMode(v);
    } catch {
      /* ignore */
    }
  }, []);

  const setView = (v: 'grid' | 'list') => {
    setViewMode(v);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
  };

  const setModalNote = useCallback(
    (id: string | null) => {
      const p = new URLSearchParams(searchParams.toString());
      if (id) p.set('note', id);
      else p.delete('note');
      const q = p.toString();
      router.replace(q ? `/dashboard?${q}` : '/dashboard');
    },
    [router, searchParams]
  );

  const closeNoteModal = useCallback(() => {
    setModalNote(null);
  }, [setModalNote]);

  const firstName = useMemo(() => {
    const n = (user?.display_name ?? '').trim();
    if (n) return n.split(/\s+/)[0] ?? n;
    const email = user?.email ?? '';
    return email.split('@')[0] || 'there';
  }, [user?.display_name, user?.email]);

  useEffect(() => {
    const t = setTimeout(() => setSearchForApi(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    api
      .get<NoteCounts>('/api/v1/notes/counts')
      .then((r) => setStats({ all: r.data.all, favorite: r.data.favorite }))
      .catch(() => {});
  }, []);

  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const params: Record<string, string> = {};
      if (filter === 'favorites') params.favorite = 'true';
      if (filter === 'archived') params.archived = 'true';
      if (filter === 'deleted') params.deleted = 'true';
      if (tagId) params.tag_id = tagId;
      if (searchForApi) params.q = searchForApi;
      const response = await api.get<Note[]>('/api/v1/notes', { params });
      setNotes(response.data);
    } catch (error: unknown) {
      console.error('Failed to fetch notes:', error);
      const isNetworkError =
        (error as { code?: string; message?: string }).code === 'ERR_NETWORK' ||
        (error as { message?: string }).message === 'Network Error';
      setFetchError(
        isNetworkError
          ? "Couldn't connect to the server. Make sure the backend is running, then try again."
          : 'Something went wrong loading your notes. Try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filter, tagId, searchForApi]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    const onRefresh = () => {
      fetchNotes();
      api
        .get<NoteCounts>('/api/v1/notes/counts')
        .then((r) => setStats({ all: r.data.all, favorite: r.data.favorite }))
        .catch(() => {});
    };
    window.addEventListener('dashboard:refresh-notes', onRefresh);
    return () => window.removeEventListener('dashboard:refresh-notes', onRefresh);
  }, [fetchNotes]);

  const createNewNote = async () => {
    try {
      const response = await api.post('/api/v1/notes', {
        title: 'Untitled Note',
        content: '',
      });
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      setModalNote(response.data.id);
      toast.success('New note created');
    } catch (error) {
      console.error('Failed to create note:', error);
      toast.error('Could not create note');
    }
  };

  const restoreNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    try {
      await api.post(`/api/v1/notes/${noteId}/restore`);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      fetchNotes();
      toast.success('Note restored');
    } catch {
      toast.error('Could not restore note');
    }
  };

  const permanentDeleteNote = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    if (!confirm('Permanently delete this note? This cannot be undone.')) return;
    try {
      await api.delete(`/api/v1/notes/${noteId}/permanent`);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      fetchNotes();
      toast.success('Note permanently deleted');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Could not delete note');
    }
  };

  const canReorder = filter === 'all' && !tagId && !searchForApi && notes.length > 1 && viewMode === 'grid';
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedOutline, setDraggedOutline] = useState<ReturnType<typeof getDragOutlineClasses> | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    const note = notes[index];
    setDraggedIndex(index);
    setDraggedOutline(getDragOutlineClasses(note));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };
  const handleDragLeave = () => setDragOverIndex(null);
  const clearDragState = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDraggedOutline(null);
  };
  const handleDragEnd = () => clearDragState();
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const from = draggedIndex;
    if (from === null || from === dropIndex) {
      clearDragState();
      return;
    }
    const reordered = [...notes];
    const [removed] = reordered.splice(from, 1);
    reordered.splice(dropIndex, 0, removed);
    setNotes(reordered);
    clearDragState();
    try {
      await api.post('/api/v1/notes/reorder', { note_ids: reordered.map((n) => n.id) });
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch {
      toast.error('Could not save new order');
      fetchNotes();
    }
  };

  const listTitle =
    tagId ? 'Tag' : filter === 'all' ? 'All Notes' : filter === 'favorites' ? 'Favorites' : filter === 'archived' ? 'Archived' : 'Recently Deleted';

  const masonry = viewMode === 'grid';

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full w-full bg-transparent overflow-hidden">
        <header className="flex-shrink-0 border-b border-border/70 bg-card/35 backdrop-blur-md px-6 py-8 md:px-10 md:py-10 shadow-card">
          <div className="max-w-5xl mx-auto w-full space-y-6">
            <div className="h-10 w-64 max-w-full rounded-lg bg-muted/50 animate-pulse" />
            <div className="h-12 max-w-2xl rounded-xl bg-muted/50 animate-pulse" />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10">
          <div className="max-w-5xl mx-auto w-full">
            <div className="h-8 w-40 rounded-md bg-muted/50 animate-pulse mb-8" />
            <DashboardNotesSkeleton masonry={masonry} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-transparent overflow-hidden">
      {modalNoteId && (
        <NoteEditModal noteId={modalNoteId} onClose={closeNoteModal} />
      )}
      <header className="flex-shrink-0 border-b border-border/70 bg-card/35 backdrop-blur-md px-6 py-8 md:px-10 md:py-10 shadow-card">
        <div className="max-w-5xl mx-auto w-full space-y-6">
          <div className="space-y-1">
            <p className="font-handwriting text-3xl sm:text-4xl text-primary leading-tight">
              Assalamu Alaikum, {firstName}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground">
              {stats.all === 0 ? (
                'Your notes live here — calm, organized, and ready when you are.'
              ) : (
                <>
                  You have <span className="font-medium text-foreground">{stats.all}</span> note
                  {stats.all === 1 ? '' : 's'}
                  {stats.favorite > 0 && (
                    <>
                      , <span className="font-medium text-foreground">{stats.favorite}</span> favorited
                    </>
                  )}
                  .
                </>
              )}
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div
              className={`relative flex-1 max-w-2xl transition-transform duration-300 ease-out ${
                searchFocused ? 'scale-[1.01] sm:scale-[1.02]' : ''
              }`}
            >
              <Search className="pointer-events-none absolute left-4 top-1/2 z-[1] h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search notes..."
                className="h-12 w-full rounded-xl border border-border/80 bg-card/90 pl-12 pr-4 text-foreground shadow-search-inset placeholder:text-muted-foreground/70 transition-shadow duration-200 focus:border-secondary/40 focus:outline-none focus:ring-2 focus:ring-secondary/25"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/20 p-1">
              <Button
                type="button"
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                title="Grid"
                onClick={() => setView('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-9 w-9"
                title="List"
                onClick={() => setView('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <QuickAddBar
            onCreated={(id) => setModalNote(id)}
            onOpenVoice={() => setVoiceMemoOpen(true)}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10 md:py-10">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{listTitle}</h2>
              <div className="mt-2 h-0.5 w-12 rounded-full bg-gradient-to-r from-secondary to-primary/40" />
            </div>
            {filter !== 'deleted' && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="h-10 gap-2 border-primary/35 bg-card/60 text-foreground shadow-card hover:bg-primary/8 hover:shadow-card-hover"
                  onClick={() => setVoiceMemoOpen(true)}
                >
                  Voice Memo
                </Button>
                <Button
                  className="h-10 gap-2 bg-secondary text-secondary-foreground shadow-card hover:shadow-glow-secondary hover:brightness-[1.03]"
                  onClick={createNewNote}
                >
                  <Plus className="h-4 w-4" />
                  <span>New Note</span>
                </Button>
              </div>
            )}
          </div>

          {fetchError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 shadow-card mb-6">
                <FileText className="h-12 w-12 text-destructive/70 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Couldn&apos;t load notes</h3>
              <p className="text-muted-foreground max-w-sm mb-8">{fetchError}</p>
              <Button onClick={() => fetchNotes()} className="bg-primary text-primary-foreground shadow-card hover:shadow-card-hover">
                Try again
              </Button>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center px-4">
              <DashboardEmptyIllustration />
              <h3 className="font-handwriting text-3xl sm:text-4xl text-primary mb-2">
                {filter === 'deleted' ? 'No deleted notes' : 'Your digital desk awaits…'}
              </h3>
              <p className="text-muted-foreground max-w-md mb-10 leading-relaxed">
                {filter === 'deleted'
                  ? 'Notes you delete will appear here.'
                  : 'Begin with a thought, a verse, or a voice memo — we will keep it safe and easy to find.'}
              </p>
              {filter !== 'deleted' && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    onClick={createNewNote}
                    className="bg-primary text-primary-foreground shadow-card hover:shadow-card-hover px-6"
                  >
                    Create first note
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setVoiceMemoOpen(true)}
                    className="gap-2 border-primary/35 bg-card/70 shadow-card hover:shadow-glow-secondary hover:border-secondary/40"
                  >
                    Voice memo
                  </Button>
                </div>
              )}
            </div>
          ) : viewMode === 'list' ? (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
              {notes.map((note) => (
                <motion.div key={note.id} variants={itemVariants}>
                  <NoteListRow note={note} onOpen={() => setModalNote(note.id)} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="notes-masonry"
            >
              <AnimatePresence>
                {notes.map((note, index) => {
                  const isDragging = draggedIndex === index;
                  const isDragOver = dragOverIndex === index;
                  return (
                    <motion.div key={note.id} variants={itemVariants} layout>
                      <NoteBoardCard
                        note={note}
                        filter={filter}
                        canReorder={canReorder}
                        isDragging={isDragging}
                        isDragOver={isDragOver}
                        draggedOutlineClass={draggedOutline?.outlineClass}
                        draggedOutlineStyle={draggedOutline?.outlineStyle}
                        onOpen={() => setModalNote(note.id)}
                        onRefresh={fetchNotes}
                        onRestore={filter === 'deleted' ? restoreNote : undefined}
                        onPermanentDelete={filter === 'deleted' ? permanentDeleteNote : undefined}
                        dragHandlers={{
                          onDragStart: (e) => handleDragStart(e as unknown as DragEvent, index),
                          onDragOver: (e) => handleDragOver(e as unknown as DragEvent, index),
                          onDragLeave: handleDragLeave,
                          onDragEnd: handleDragEnd,
                          onDrop: (e) => handleDrop(e as unknown as DragEvent, index),
                        }}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {voiceMemoOpen && (
          <VoiceMemoRecorder key="voice-memo" onClose={() => setVoiceMemoOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
