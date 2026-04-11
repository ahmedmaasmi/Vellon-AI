'use client';

import { useState, useRef, useEffect, type CSSProperties } from 'react';
import {
  Pin,
  Heart,
  Calendar,
  Mic,
  Archive,
  MoreHorizontal,
  Palette,
  Copy,
  Trash2,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
  getKeepCardClasses,
  NOTE_COLOR_OPTIONS,
  noteColorSwatchTw,
  resolveNoteColorKey,
  type NoteColorId,
} from '@/lib/note-colors';
import {
  getColorForTag,
  getNoteCardStylesForHex,
  getTagPillClass,
  getTagPillStyle,
} from '@/lib/tag-colors';
import { formatVoiceDuration, isVoiceMemo } from '@/lib/note-kind';
import type { NoteListItem } from '@/types/note';
import { toast } from 'sonner';
import { AuthenticatedNoteImage } from '@/components/AuthenticatedNoteImage';

const PASTEL_COLORS = [
  'bg-gradient-to-br from-[#BEE3F8] to-[#90cdf4]/40',
  'bg-gradient-to-br from-[#C6F6D5] to-[#9ae6b4]/40',
  'bg-gradient-to-br from-[#E9D8FD] to-[#d6bcfa]/40',
  'bg-gradient-to-br from-[#FEEBC8] to-[#fbd38d]/40',
  'bg-gradient-to-br from-[#FED7D7] to-[#feb2b2]/40',
  'bg-gradient-to-br from-[#E2E8F0] to-[#cbd5e0]/40',
];

const TAG_COLORS = ['bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400', 'bg-red-400', 'bg-gray-400'];
const OUTLINE_COLORS = [
  'border-blue-400',
  'border-green-400',
  'border-purple-400',
  'border-orange-400',
  'border-red-400',
  'border-gray-400',
];

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

function tagFallbackClasses(note: NoteListItem): {
  pastelClass: string;
  pastelStyle?: { background: string };
  topBarClass: string;
  topBarStyle?: { backgroundColor: string };
  outlineClass: string;
  outlineStyle?: { borderColor: string };
} {
  const firstTag = note.tags?.[0];
  const defaultIndex = PASTEL_COLORS.length - 1;
  if (!firstTag) {
    return {
      pastelClass: PASTEL_COLORS[defaultIndex],
      outlineClass: OUTLINE_COLORS[defaultIndex],
      topBarClass: TAG_COLORS[defaultIndex],
    };
  }
  const resolved = getColorForTag(firstTag.id);
  if (resolved.type === 'palette') {
    return {
      pastelClass: PASTEL_COLORS[resolved.index],
      topBarClass: TAG_COLORS[resolved.index],
      outlineClass: OUTLINE_COLORS[resolved.index],
    };
  }
  const styles = getNoteCardStylesForHex(resolved.hex);
  return {
    pastelClass: '',
    pastelStyle: styles.pastelStyle,
    topBarClass: '',
    topBarStyle: { backgroundColor: resolved.hex },
    outlineClass: '',
    outlineStyle: styles.outlineStyle,
  };
}

function cardSurface(note: NoteListItem): {
  className: string;
  style?: React.CSSProperties;
  barClass: string;
  barStyle?: React.CSSProperties;
} {
  if (note.color) {
    const { surface, bar } = getKeepCardClasses(note.color);
    return {
      className: `relative flex cursor-pointer flex-col overflow-hidden rounded-2xl p-5 pt-6 shadow-card transition-shadow duration-300 group hover:shadow-card-hover ${surface}`,
      barClass: bar,
    };
  }
  const fb = tagFallbackClasses(note);
  return {
    className: `relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-black/[0.06] dark:border-border/60 p-5 pt-6 shadow-card transition-shadow duration-300 group hover:shadow-card-hover ${fb.pastelClass}`,
    style: fb.pastelStyle,
    barClass: fb.topBarClass,
    barStyle: fb.topBarStyle,
  };
}

export function NoteBoardCard({
  note,
  filter,
  canReorder,
  isDragging,
  isDragOver,
  draggedOutlineClass,
  draggedOutlineStyle,
  onOpen,
  onRefresh,
  onRestore,
  onPermanentDelete,
  dragHandlers,
}: {
  note: NoteListItem;
  filter: string;
  canReorder: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  draggedOutlineClass?: string;
  draggedOutlineStyle?: CSSProperties;
  onOpen: () => void;
  onRefresh: () => void;
  onRestore?: (e: React.MouseEvent, noteId: string) => void;
  onPermanentDelete?: (e: React.MouseEvent, noteId: string) => void;
  dragHandlers: {
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDragEnd: () => void;
    onDrop: (e: React.DragEvent) => void;
  };
}) {
  const [colorOpen, setColorOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!colorOpen && !moreOpen) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (colorRef.current?.contains(t) || moreRef.current?.contains(t)) return;
      setColorOpen(false);
      setMoreOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [colorOpen, moreOpen]);

  const voice = isVoiceMemo(note);
  const voiceDuration = formatVoiceDuration(note.voice_duration_seconds);
  const date = new Date(note.created_at).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const surface = cardSurface(note);
  const isChecklist = note.note_type === 'checklist';
  const previewText = isChecklist
    ? (note.checklist_items || [])
        .filter((i) => i.text.trim())
        .slice(0, 4)
        .map((i) => `${i.checked ? '☑' : '☐'} ${i.text}`)
        .join(' · ') || 'Checklist'
    : note.content || 'No preview yet — open the note to add your thoughts.';

  const patch = async (body: Record<string, unknown>) => {
    try {
      await api.put(`/api/v1/notes/${note.id}`, body);
      onRefresh();
    } catch {
      toast.error('Could not update note');
    }
  };

  const copyNote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/api/v1/notes/${note.id}/copy`);
      toast.success('Copy created');
      onRefresh();
    } catch {
      toast.error('Could not copy');
    }
    setMoreOpen(false);
  };

  const deleteNote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Move to trash?')) return;
    try {
      await api.delete(`/api/v1/notes/${note.id}`);
      toast.success('Note deleted');
      onRefresh();
    } catch {
      toast.error('Could not delete');
    }
    setMoreOpen(false);
  };

  const setNoteColor = (c: NoteColorId) => {
    void patch({ color: c === 'default' ? null : c });
    setColorOpen(false);
  };

  const firstImage = note.images?.[0];

  return (
    <div
      draggable={canReorder}
      {...dragHandlers}
      role="button"
      tabIndex={0}
      aria-label={`Open note: ${note.title || 'Untitled Note'}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`${surface.className} ${isDragging ? 'opacity-50' : ''} ${
        isDragOver && !draggedOutlineClass ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      } ${note.is_pinned ? 'ring-1 ring-secondary/25 shadow-elevated' : ''}`}
      style={surface.style}
    >
      <div
        className={`absolute left-0 right-0 top-0 z-[2] h-1 rounded-t-2xl ${surface.barClass}`}
        style={surface.barStyle}
        aria-hidden
      />
      {isDragOver && draggedOutlineClass && (
        <div
          className={`pointer-events-none absolute inset-0 z-[3] rounded-2xl border-2 border-dashed ${draggedOutlineClass} bg-transparent`}
          style={draggedOutlineStyle}
          aria-hidden
        />
      )}

      {firstImage && (
        <div className="relative z-[1] -mx-1 mb-3 h-32 w-[calc(100%+0.5rem)] overflow-hidden rounded-xl border border-black/10">
          <AuthenticatedNoteImage
            noteId={note.id}
            imageId={firstImage.id}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {voice && (
        <div className="relative z-[1] mb-3 flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 px-3 py-2.5 shadow-sm dark:bg-card/40">
          <VoiceMemoCardWaveform />
          <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Mic className="h-3.5 w-3.5 text-secondary" aria-hidden />
              Voice memo
            </span>
            {voiceDuration ? (
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{voiceDuration}</span>
            ) : null}
          </div>
        </div>
      )}

      <div className="relative z-[1] mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-black/70 dark:text-white/70">
          <Calendar className="h-3.5 w-3.5 shrink-0 opacity-80" />
          <span>{date}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {note.reminder_at && (
            <span className="rounded-full bg-amber-500/15 p-1 text-amber-800 dark:text-amber-200" title="Reminder set">
              <Bell className="h-3.5 w-3.5" />
            </span>
          )}
          {note.is_pinned && (
            <span className="rounded-full bg-secondary/15 p-1.5 text-secondary shadow-sm ring-1 ring-secondary/20" title="Pinned">
              <Pin className="h-3.5 w-3.5" />
            </span>
          )}
          {note.is_favorite && (
            <span className="rounded-full bg-rose-500/10 p-1.5 text-rose-700 shadow-sm" title="Favorite">
              <Heart className="h-3.5 w-3.5 fill-rose-600 text-rose-600" />
            </span>
          )}
        </div>
      </div>

      <div className="relative z-[1] flex flex-1 flex-col space-y-2">
        <h3 className="text-lg font-bold leading-tight text-black/90 dark:text-white/90">
          {note.title || 'Untitled Note'}
        </h3>
        {voice ? (
          <div className="space-y-1">
            <p className="text-[10px] font-medium tracking-wide text-black/45 dark:text-white/50">Transcript</p>
            <p className="line-clamp-4 text-sm leading-relaxed text-black/75 dark:text-white/75">
              {note.content || 'No transcript yet — open the memo to record or wait for processing.'}
            </p>
          </div>
        ) : (
          <p className="line-clamp-6 text-sm leading-relaxed text-black/75 dark:text-white/75">{previewText}</p>
        )}
      </div>

      {note.tags && note.tags.length > 0 && (
        <div className="relative z-[1] mt-3 flex flex-wrap gap-1.5">
          {note.tags.slice(0, 3).map((t) => (
            <span
              key={t.id}
              className={`inline-flex max-w-[7rem] truncate rounded-full px-2 py-0.5 text-[10px] font-medium ${getTagPillClass(t.id)}`}
              style={getTagPillStyle(t.id)}
              title={t.name}
            >
              {t.name}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-black/50">+{note.tags.length - 3}</span>
          )}
        </div>
      )}

      {filter === 'deleted' && onRestore && onPermanentDelete && (
        <div
          className="relative z-[2] mt-3 flex flex-wrap gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-1.5"
            onClick={(e) => onRestore(e, note.id)}
          >
            Restore
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="gap-1.5"
            onClick={(e) => onPermanentDelete(e, note.id)}
          >
            Delete forever
          </Button>
        </div>
      )}

      {filter !== 'deleted' && (
        <div
          className="absolute bottom-0 left-0 right-0 z-[4] flex items-center justify-end gap-0.5 border-t border-black/5 bg-black/[0.03] px-1 py-1 opacity-0 transition-opacity group-hover:opacity-100 dark:border-white/10 dark:bg-white/[0.04]"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={note.is_pinned ? 'Unpin' : 'Pin'}
            onClick={(e) => {
              e.stopPropagation();
              void patch({ is_pinned: !note.is_pinned });
            }}
          >
            <Pin className={`h-3.5 w-3.5 ${note.is_pinned ? 'text-secondary' : ''}`} />
          </Button>
          <div className="relative" ref={colorRef}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Background color"
              onClick={(e) => {
                e.stopPropagation();
                setColorOpen((v) => !v);
              }}
            >
              <Palette className="h-3.5 w-3.5" />
            </Button>
            {colorOpen && (
              <div className="absolute bottom-full right-0 mb-1 flex max-w-[200px] flex-wrap gap-1 rounded-lg border border-border bg-card p-2 shadow-elevated">
                {NOTE_COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    onClick={(e) => {
                      e.stopPropagation();
                      setNoteColor(c.id);
                    }}
                    className={`h-6 w-6 rounded-full ${noteColorSwatchTw(c.id)} ${
                      resolveNoteColorKey(note.color ?? null) === c.id
                        ? 'ring-2 ring-offset-1 ring-primary'
                        : ''
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={note.is_archived ? 'Unarchive' : 'Archive'}
            onClick={(e) => {
              e.stopPropagation();
              void patch({ is_archived: !note.is_archived });
            }}
          >
            <Archive className="h-3.5 w-3.5" />
          </Button>
          <div className="relative" ref={moreRef}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setMoreOpen((v) => !v);
              }}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
            {moreOpen && (
              <div className="absolute bottom-full right-0 mb-1 min-w-[9rem] rounded-lg border border-border bg-card py-1 shadow-elevated">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={copyNote}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                  onClick={deleteNote}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/[0.12] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
    </div>
  );
}
