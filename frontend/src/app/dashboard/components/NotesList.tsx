'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Plus, Search, MoreHorizontal, FileText } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const activeNoteId = params.id as string | undefined;

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await api.get('/api/v1/notes');
      setNotes(response.data);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewNote = async () => {
    try {
      const response = await api.post('/api/v1/notes', {
        title: 'Untitled Note',
        content: '',
      });
      router.push(`/dashboard/notes/${response.data.id}`);
      // Refresh notes list
      fetchNotes();
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  return (
    <div className="w-80 border-r border-border bg-[#faf5f3] flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">All Notes</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-[#935b52] text-white hover:bg-[#935b52]/90 hover:text-white" onClick={createNewNote}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search" 
            className="pl-9 bg-white border-none rounded-xl h-10 shadow-sm"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Spinner />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No notes yet</p>
          </div>
        ) : (
          notes.map((note) => {
            const isActive = activeNoteId === note.id;
            return (
              <Link key={note.id} href={`/dashboard/notes/${note.id}`}>
                <div 
                  className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                    isActive 
                      ? 'bg-white border-[#f0dcd8] shadow-sm' 
                      : 'bg-transparent border-transparent hover:bg-white/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-semibold truncate pr-2 ${isActive ? 'text-[#935b52]' : 'text-foreground'}`}>
                      {note.title || 'Untitled Note'}
                    </h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1 text-muted-foreground opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3 h-8">
                    {note.content || 'No content...'}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full border border-current"></span>
                      {new Date(note.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <div className="flex gap-1">
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
