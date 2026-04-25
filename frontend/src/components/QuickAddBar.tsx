'use client';

import { useState, useCallback } from 'react';
import { Plus, Mic, Palette, ListChecks, X, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import ChecklistEditor from '@/components/ChecklistEditor';
import type { ChecklistItemState } from '@/types/note';
import { NOTE_COLOR_OPTIONS, noteColorSwatchTw, type NoteColorId } from '@/lib/note-colors';

export default function QuickAddBar({
  onCreated,
  onOpenVoice,
}: {
  onCreated: (noteId: string) => void;
  onOpenVoice: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [checklistMode, setChecklistMode] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemState[]>([
    { text: '', checked: false, order: 0 },
  ]);
  const [color, setColor] = useState<NoteColorId | null>('default');
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const reset = useCallback(() => {
    setTitle('');
    setContent('');
    setChecklistMode(false);
    setChecklistItems([{ text: '', checked: false, order: 0 }]);
    setColor('default');
    setExpanded(false);
    setImageFile(null);
  }, []);

  const submit = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const items = checklistItems.filter((i) => i.text.trim());
    if (!trimmedTitle && !trimmedContent && items.length === 0 && !imageFile) {
      toast.message('Add a title, note, or checklist item');
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: trimmedTitle || null,
        content: checklistMode ? '' : trimmedContent,
        note_type: checklistMode ? 'checklist' : 'text',
        color: color && color !== 'default' ? color : null,
      };
      if (checklistMode && items.length > 0) {
        payload.checklist_items = items.map((i, order) => ({
          text: i.text.trim(),
          checked: i.checked,
          order,
        }));
      }
      const res = await api.post<{ id: string }>('/api/v1/notes', payload);
      const noteId = res.data.id;
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        await api.post(`/api/v1/notes/${noteId}/images`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onCreated(noteId);
      reset();
      toast.success('Note created');
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch {
      toast.error('Could not create note');
    } finally {
      setSubmitting(false);
    }
  };

  if (!expanded) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/80 bg-card/90 px-4 py-3 shadow-search-inset">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex-1 min-w-[12rem] text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Take a note…
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          title="New checklist"
          onClick={() => {
            setChecklistMode(true);
            setExpanded(true);
          }}
        >
          <ListChecks className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          title="Voice memo"
          onClick={onOpenVoice}
        >
          <Mic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0 gap-1"
          onClick={() => setExpanded(true)}
        >
          <Plus className="h-4 w-4" />
          Expand
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card/95 shadow-elevated overflow-hidden">
      <div className="p-4 space-y-3">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border-0 bg-transparent text-base font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-0"
        />
        {checklistMode ? (
          <ChecklistEditor items={checklistItems} onChange={setChecklistItems} />
        ) : (
          <textarea
            placeholder="Take a note…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full resize-none border-0 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0"
          />
        )}
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <ImagePlus className="h-4 w-4" />
          <span>Add image</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {imageFile && <p className="text-xs text-muted-foreground truncate">{imageFile.name}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-3 py-2 bg-muted/20">
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            variant={checklistMode ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 gap-1"
            onClick={() => setChecklistMode((v) => !v)}
          >
            <ListChecks className="h-3.5 w-3.5" />
            Checklist
          </Button>
          <span className="inline-flex items-center gap-0.5 pl-1" title="Color">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            {NOTE_COLOR_OPTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.label}
                onClick={() => setColor(c.id)}
                className={`h-5 w-5 rounded-full shrink-0 ${noteColorSwatchTw(c.id)} ${
                  color === c.id ? 'ring-2 ring-offset-2 ring-offset-card ring-primary' : ''
                }`}
              />
            ))}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={reset} className="gap-1">
            <X className="h-4 w-4" />
            Close
          </Button>
          <Button type="button" size="sm" disabled={submitting} onClick={() => void submit()}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
