'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Search, Plus, Pin, Heart, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { getColorForTag, getNoteCardStylesForHex } from '@/lib/tag-colors';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  is_favorite: boolean;
  is_pinned: boolean;
  tags?: { id: string; name: string }[];
}

const PASTEL_COLORS = [
  'bg-gradient-to-br from-[#BEE3F8] to-[#90cdf4]/40', // blue
  'bg-gradient-to-br from-[#C6F6D5] to-[#9ae6b4]/40', // green
  'bg-gradient-to-br from-[#E9D8FD] to-[#d6bcfa]/40', // purple
  'bg-gradient-to-br from-[#FEEBC8] to-[#fbd38d]/40', // yellow
  'bg-gradient-to-br from-[#FED7D7] to-[#feb2b2]/40', // red
  'bg-gradient-to-br from-[#E2E8F0] to-[#cbd5e0]/40', // gray
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
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
  pastelStyle?: { background: string };
  tagColorStyle?: { backgroundColor: string };
  outlineStyle?: { borderColor: string };
};

function getNoteColorClasses(note: Note): NoteColorClasses {
  const firstTag = note.tags?.[0];
  const defaultIndex = PASTEL_COLORS.length - 1;
  if (!firstTag) {
    return {
      pastelClass: PASTEL_COLORS[defaultIndex],
      tagColorClass: TAG_COLORS[defaultIndex],
      outlineClass: OUTLINE_COLORS[defaultIndex],
    };
  }
  const resolved = getColorForTag(firstTag.id);
  if (resolved.type === 'palette') {
    return {
      pastelClass: PASTEL_COLORS[resolved.index],
      tagColorClass: TAG_COLORS[resolved.index],
      outlineClass: OUTLINE_COLORS[resolved.index],
    };
  }
  const styles = getNoteCardStylesForHex(resolved.hex);
  return {
    pastelClass: '',
    tagColorClass: '',
    outlineClass: '',
    pastelStyle: styles.pastelStyle,
    tagColorStyle: styles.tagColorStyle,
    outlineStyle: styles.outlineStyle,
  };
}

export default function DashboardEmptyState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') ?? 'all';
  const tagId = searchParams.get('tag_id') ?? null;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchForApi, setSearchForApi] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchForApi(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

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
          ? 'Couldn\'t connect to the server. Make sure the backend is running, then try again.'
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
    const onRefresh = () => fetchNotes();
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
    } catch (error) {
      console.error('Failed to create note:', error);
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
      fetchNotes();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-background overflow-hidden">
      {/* Full-width search bar and title */}
      <header className="p-4 border-b border-border flex items-center gap-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-foreground whitespace-nowrap">Vellon AI</h1>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search notes..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 pt-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-foreground">
            {tagId ? 'Tag' : filter === 'all' ? 'All Notes' : filter === 'favorites' ? 'Favorites' : filter === 'archived' ? 'Archived' : 'Recently Deleted'}
          </h2>
          {filter !== 'deleted' && (
            <Button
              className="h-9 gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={createNewNote}
            >
              <Plus className="h-4 w-4" />
              <span>New Note</span>
            </Button>
          )}
        </div>

        {fetchError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-destructive/10 p-6 rounded-full mb-6">
              <FileText className="h-12 w-12 text-destructive/70" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Couldn&apos;t load notes</h3>
            <p className="text-muted-foreground max-w-sm mb-8">{fetchError}</p>
            <Button onClick={() => fetchNotes()} className="bg-primary text-primary-foreground">
              Try again
            </Button>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-muted p-6 rounded-full mb-6">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              {filter === 'deleted' ? 'No deleted notes' : 'Your digital desk is empty'}
            </h3>
            <p className="text-muted-foreground max-w-sm mb-8">
              {filter === 'deleted'
                ? 'Notes you delete will appear here.'
                : 'Start by creating your first note or use AI to brainstorm some ideas.'}
            </p>
            {filter !== 'deleted' && (
              <Button onClick={createNewNote} className="bg-primary text-primary-foreground">
                Create First Note
              </Button>
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
              const { pastelClass, tagColorClass, pastelStyle, tagColorStyle } = getNoteColorClasses(note);
              const date = new Date(note.created_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <motion.div
                  layout
                  variants={itemVariants}
                  whileHover={{ scale: 1.03, rotate: index % 2 === 0 ? 1 : -1, zIndex: 10 }}
                  key={note.id}
                  draggable={canReorder}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={() => router.push(`/dashboard/notes/${note.id}`)}
                  className={`${pastelClass} p-8 rounded-[2.5rem] relative cursor-pointer hover:shadow-xl transition-all duration-300 group min-h-[300px] flex flex-col overflow-hidden border border-black/5 shadow-sm ${isDragging ? 'opacity-50' : ''} ${isDragOver && !draggedColorClasses ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  style={pastelStyle}
                >
                  {/* Outline placeholder at drop target using dragged note color */}
                  {isDragOver && draggedColorClasses && (
                    <div
                      className={`absolute inset-0 rounded-[2.5rem] border-2 border-dashed ${draggedColorClasses.outlineClass} bg-transparent pointer-events-none min-h-[300px]`}
                      style={draggedColorClasses.outlineStyle}
                      aria-hidden
                    />
                  )}
                  {/* Top Indicators: date + pin and heart when favorite */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-black/60">
                      <Calendar className="h-4 w-4" />
                      <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {note.is_pinned && (
                        <span className="p-1.5 rounded-full bg-white/40 text-black" title="Pinned">
                          <Pin className="h-4 w-4" />
                        </span>
                      )}
                      {note.is_favorite && (
                        <span className="p-1.5 rounded-full bg-white/40 text-red-600" title="Favorite">
                          <Heart className="h-4 w-4 fill-current" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Content */}
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-bold text-black/90 leading-tight">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <p className="text-[15px] text-black/60 leading-relaxed line-clamp-6">
                      {note.content || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...'}
                    </p>
                  </div>

                  {/* Bottom Left Corner Detail from the image */}
                  <div className={`absolute top-0 left-0 w-8 h-8 ${tagColorClass} rounded-br-[1.5rem] opacity-80 shadow-sm`} style={tagColorStyle}></div>
                  
                  {/* Hover effect highlight */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
