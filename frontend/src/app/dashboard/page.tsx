'use client';

import { useEffect, useState, useCallback, useMemo, type DragEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Search, Plus, Pin, Heart, Calendar, Mic, RotateCcw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
  getColorForTag,
  getNoteCardStylesForHex,
  getTagPillClass,
  getTagPillStyle,
} from '@/lib/tag-colors';
import { useAuthStore } from '@/store/auth';
import VoiceMemoRecorder from '@/components/VoiceMemoRecorder';
import { formatVoiceDuration, isVoiceMemo } from '@/lib/note-kind';
import type { NoteListItem } from '@/types/note';
import { toast } from 'sonner';

type Note = NoteListItem;

interface NoteCounts {
  all: number;
  archived: number;
  pinned: number;
  favorite: number;
  deleted: number;
}

const PASTEL_COLORS = [
  'bg-gradient-to-br from-[#BEE3F8] to-[#90cdf4]/40',
  'bg-gradient-to-br from-[#C6F6D5] to-[#9ae6b4]/40',
  'bg-gradient-to-br from-[#E9D8FD] to-[#d6bcfa]/40',
  'bg-gradient-to-br from-[#FEEBC8] to-[#fbd38d]/40',
  'bg-gradient-to-br from-[#FED7D7] to-[#feb2b2]/40',
  'bg-gradient-to-br from-[#E2E8F0] to-[#cbd5e0]/40',
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 26 },
  },
};

const TAG_COLORS = [
  'bg-blue-400',
  'bg-green-400',
  'bg-purple-400',
  'bg-orange-400',
  'bg-red-400',
  'bg-gray-400',
];

const OUTLINE_COLORS = [
  'border-blue-400',
  'border-green-400',
  'border-purple-400',
  'border-orange-400',
  'border-red-400',
  'border-gray-400',
];

type NoteColorClasses = {
  pastelClass: string;
  tagColorClass: string;
  outlineClass: string;
  topBarClass: string;
  pastelStyle?: { background: string };
  tagColorStyle?: { backgroundColor: string };
  outlineStyle?: { borderColor: string };
  topBarStyle?: { backgroundColor: string };
};

/** Subtle waveform inside cards — uses app secondary/primary tokens only */
const VOICE_CARD_WAVE_BARS = [14, 22, 10, 28, 16, 24, 8, 26, 18, 30, 12, 20];

function VoiceMemoCardWaveform() {
  return (
    <div className="flex h-9 items-end gap-px opacity-90" aria-hidden>
      {VOICE_CARD_WAVE_BARS.map((h, i) => (
        <span
          key={i}
          className="w-0.5 shrink-0 rounded-full bg-secondary/45 dark:bg-secondary/55"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

function DashboardNotesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="min-h-[280px] rounded-2xl border border-border/50 bg-muted/40 animate-pulse"
          aria-hidden
        />
      ))}
    </div>
  );
}

function getNoteColorClasses(note: Note): NoteColorClasses {
  const firstTag = note.tags?.[0];
  const defaultIndex = PASTEL_COLORS.length - 1;
  if (!firstTag) {
    return {
      pastelClass: PASTEL_COLORS[defaultIndex],
      tagColorClass: TAG_COLORS[defaultIndex],
      outlineClass: OUTLINE_COLORS[defaultIndex],
      topBarClass: TAG_COLORS[defaultIndex],
    };
  }
  const resolved = getColorForTag(firstTag.id);
  if (resolved.type === 'palette') {
    return {
      pastelClass: PASTEL_COLORS[resolved.index],
      tagColorClass: TAG_COLORS[resolved.index],
      outlineClass: OUTLINE_COLORS[resolved.index],
      topBarClass: TAG_COLORS[resolved.index],
    };
  }
  const styles = getNoteCardStylesForHex(resolved.hex);
  return {
    pastelClass: '',
    tagColorClass: '',
    outlineClass: '',
    topBarClass: '',
    pastelStyle: styles.pastelStyle,
    tagColorStyle: styles.tagColorStyle,
    outlineStyle: styles.outlineStyle,
    topBarStyle: { backgroundColor: resolved.hex },
  };
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

export default function DashboardEmptyState() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      router.push(`/dashboard/notes/${response.data.id}`);
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

  const canReorder = filter === 'all' && !tagId && !searchForApi && notes.length > 1;
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedColorClasses, setDraggedColorClasses] = useState<ReturnType<typeof getNoteColorClasses> | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    const note = notes[index];
    setDraggedIndex(index);
    setDraggedColorClasses(getNoteColorClasses(note));
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
    setDraggedColorClasses(null);
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
            <DashboardNotesSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-transparent overflow-hidden">
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
          <div
            className={`relative max-w-2xl transition-transform duration-300 ease-out ${
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
                  <Mic className="h-4 w-4" />
                  <span>Voice Memo</span>
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
                    <Mic className="h-4 w-4" />
                    Voice memo
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr"
            >
              <AnimatePresence>
                {notes.map((note, index) => {
                  const voice = isVoiceMemo(note);
                  const voiceDuration = formatVoiceDuration(note.voice_duration_seconds);
                  const { pastelClass, pastelStyle, topBarClass, topBarStyle } = getNoteColorClasses(note);
                  const date = new Date(note.created_at).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  });
                  const isDragging = draggedIndex === index;
                  const isDragOver = dragOverIndex === index;
                  const pinnedWide = note.is_pinned;

                  return (
                    <motion.div
                      layout
                      variants={itemVariants}
                      whileHover={{ y: -6, scale: 1.02, zIndex: 10 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      key={note.id}
                      draggable={canReorder}
                      onDragStart={(e) => handleDragStart(e as unknown as DragEvent, index)}
                      onDragOver={(e) => handleDragOver(e as unknown as DragEvent, index)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e as unknown as DragEvent, index)}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open note: ${note.title || 'Untitled Note'}`}
                      onClick={() => router.push(`/dashboard/notes/${note.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/dashboard/notes/${note.id}`);
                        }
                      }}
                      className={`${pastelClass} relative flex min-h-[280px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-black/[0.06] dark:border-border/60 p-7 pt-8 shadow-card transition-shadow duration-300 group hover:shadow-card-hover ${pinnedWide ? 'sm:col-span-2' : ''} ${note.is_pinned ? 'ring-1 ring-secondary/25 shadow-elevated' : ''} ${
                        isDragging ? 'opacity-50' : ''
                      } ${isDragOver && !draggedColorClasses ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                      style={pastelStyle}
                    >
                      <div
                        className={`absolute left-0 right-0 top-0 z-[2] h-1 rounded-t-2xl ${topBarClass}`}
                        style={topBarStyle}
                        aria-hidden
                      />

                      {isDragOver && draggedColorClasses && (
                        <div
                          className={`pointer-events-none absolute inset-0 z-[3] min-h-[280px] rounded-2xl border-2 border-dashed ${draggedColorClasses.outlineClass} bg-transparent`}
                          style={draggedColorClasses.outlineStyle}
                          aria-hidden
                        />
                      )}

                      {voice && (
                        <div className="relative z-[1] mb-4 flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 px-3 py-2.5 shadow-sm dark:bg-card/40">
                          <VoiceMemoCardWaveform />
                          <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <Mic className="h-3.5 w-3.5 text-secondary" aria-hidden />
                              Voice memo
                            </span>
                            {voiceDuration ? (
                              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                                {voiceDuration}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      )}

                      <div className="relative z-[1] mb-6 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 text-[13px] font-semibold text-black/70 dark:text-white/70">
                          <Calendar className="h-4 w-4 shrink-0 opacity-80" />
                          <span>{date}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {note.is_pinned && (
                            <span
                              className="rounded-full bg-secondary/15 p-1.5 text-secondary shadow-sm ring-1 ring-secondary/20"
                              title="Pinned"
                            >
                              <Pin className="h-4 w-4" />
                            </span>
                          )}
                          {note.is_favorite && (
                            <span
                              className="rounded-full bg-rose-500/10 p-1.5 text-rose-700 shadow-sm"
                              title="Favorite"
                            >
                              <Heart className="h-4 w-4 fill-rose-600 text-rose-600 animate-favorite-pulse" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="relative z-[1] flex flex-1 flex-col space-y-3">
                        <h3 className="text-xl font-bold leading-tight text-black/90 dark:text-white/90">
                          {note.title || 'Untitled Note'}
                        </h3>
                        {voice ? (
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-medium tracking-wide text-black/45 dark:text-white/50">
                              Transcript
                            </p>
                            <p className="line-clamp-4 text-[15px] leading-relaxed text-black/75 dark:text-white/75">
                              {note.content ||
                                'No transcript yet — open the memo to record or wait for processing.'}
                            </p>
                          </div>
                        ) : (
                          <p className="line-clamp-6 text-[15px] leading-relaxed text-black/75 dark:text-white/75">
                            {note.content ||
                              'No preview yet — open the note to add your thoughts.'}
                          </p>
                        )}
                      </div>

                      {note.tags && note.tags.length > 0 && (
                        <div className="relative z-[1] mt-5 flex flex-wrap gap-1.5">
                          {note.tags.slice(0, 3).map((t) => (
                            <span
                              key={t.id}
                              className={`inline-flex max-w-[7rem] truncate rounded-full px-2 py-0.5 text-[11px] font-medium ${getTagPillClass(t.id)}`}
                              style={getTagPillStyle(t.id)}
                              title={t.name}
                            >
                              {t.name}
                            </span>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-black/50">
                              +{note.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {filter === 'deleted' && (
                        <div
                          className="relative z-[2] mt-4 flex flex-wrap gap-2"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="gap-1.5"
                            onClick={(e) => restoreNote(e, note.id)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restore
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="gap-1.5"
                            onClick={(e) => permanentDeleteNote(e, note.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete forever
                          </Button>
                        </div>
                      )}

                      <div
                        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/[0.12] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        aria-hidden
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
