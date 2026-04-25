'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { Markdown } from '@tiptap/markdown';
import { Placeholder } from '@tiptap/extension-placeholder';
import SlashCommandMenu, { type SlashCommandMenuHandle } from '@/components/SlashCommandMenu';
import { KeywordHighlights } from '@/lib/tiptap-keyword-highlights';
import { SlashCommandBridge, type SlashMenuState } from '@/lib/tiptap-slash-commands';
import type { SuggestionKeyDownProps } from '@tiptap/suggestion';
import type { SlashCommandItem } from '@/lib/slash-command-items';
import { cn } from '@/lib/utils';
/* eslint-disable react-hooks/exhaustive-deps -- editor instance is created once; callbacks use refs */

export interface KeywordRichEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  onKeywordClick?: (keyword: string) => void;
  placeholder?: string;
  className?: string;
  'data-placeholder'?: string;
}

export default function KeywordRichEditor({
  value,
  onChangeText,
  onKeywordClick,
  placeholder = 'Start typing your thoughts...',
  className = '',
}: KeywordRichEditorProps) {
  const elId = useId();
  const bodyId = `note-body-${elId}`.replace(/:/g, '');
  const onChangeTextRef = useRef(onChangeText);
  onChangeTextRef.current = onChangeText;
  const onKeywordClickRef = useRef(onKeywordClick);
  onKeywordClickRef.current = onKeywordClick;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [slash, setSlash] = useState<SlashMenuState | null>(null);
  const slashRef = useRef<SlashMenuState | null>(null);
  const slashOpenRef = useRef(false);
  const slashMenuRef = useRef<SlashCommandMenuHandle | null>(null);
  const onMenuStateRef = useRef<(s: SlashMenuState | null) => void>(setSlash);
  onMenuStateRef.current = (s) => {
    setSlash(s);
    slashRef.current = s;
    slashOpenRef.current = s != null;
  };

  const onSlashKeyDown = useRef<(p: SuggestionKeyDownProps) => boolean>(() => false);
  onSlashKeyDown.current = (p: SuggestionKeyDownProps) => {
    if (!slashOpenRef.current) return false;
    return slashMenuRef.current?.handleKeyDown(p.event) ?? false;
  };

  const prevExternalValue = useRef<string | undefined>(undefined);

  const editor = useEditor(
    {
      shouldRerenderOnTransaction: false,
      immediatelyRender: false,
      content: value,
      contentType: 'markdown',
      editorProps: {
        attributes: {
          id: bodyId,
          'aria-multiline': 'true',
          'role': 'textbox',
          'aria-label': placeholder,
          'data-placeholder': placeholder,
        },
        handleDOMEvents: {
          click: (_view, e) => {
            const t = (e.target as HTMLElement).closest?.('[data-keyword]');
            if (t && onKeywordClickRef.current) {
              e.preventDefault();
              const k = t.getAttribute('data-keyword');
              if (k) onKeywordClickRef.current(k);
              return true;
            }
            return false;
          },
        },
      },
      extensions: [
        StarterKit,
        TaskList,
        TaskItem.configure({ nested: true }),
        Markdown.configure({
          markedOptions: { gfm: true },
        }),
        Placeholder.configure({
          placeholder,
          showOnlyWhenEditable: true,
        }),
        KeywordHighlights,
        SlashCommandBridge.configure({
          onMenu: (s) => onMenuStateRef.current(s),
          onKeyDown: (p) => onSlashKeyDown.current(p),
        }),
      ],
      onUpdate: ({ editor: ed }) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          onChangeTextRef.current(ed.getMarkdown());
        }, 200);
      },
    },
    []
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Apply external `value` only when the snapshot actually changes (load / new note), not on every form emit.
  useEffect(() => {
    if (!editor) return;
    if (prevExternalValue.current === value) return;
    prevExternalValue.current = value;
    editor.commands.setContent(value, { contentType: 'markdown', emitUpdate: false });
  }, [value, editor]);

  const slashPos = useMemo(() => {
    if (!slash?.clientRect) return { x: 0, y: 0 };
    try {
      const rect = slash.clientRect?.();
      if (!rect) return { x: 80, y: 120 };
      return { x: rect.left, y: rect.bottom + 4 };
    } catch {
      return { x: 80, y: 120 };
    }
  }, [slash?.clientRect, slash?.query, slash?.items]);

  const onPick = useCallback((item: SlashCommandItem) => {
    slashRef.current?.command(item);
  }, []);

  const onSlashMenuClose = useCallback(() => {
    setSlash(null);
    slashRef.current = null;
    slashOpenRef.current = false;
  }, []);

  if (!editor) {
    return (
      <div
        className={cn('keyword-editor text-muted-foreground/50', className)}
        data-placeholder={placeholder}
        id={bodyId}
        aria-label={placeholder}
        aria-hidden
      />
    );
  }

  const menu = (
    <SlashCommandMenu
      ref={slashMenuRef}
      open={!!slash}
      x={slashPos.x}
      y={slashPos.y}
      items={slash?.items ?? []}
      onClose={onSlashMenuClose}
      onPick={onPick}
    />
  );

  return (
    <>
      <div
        className={cn('keyword-editor', className)}
        data-placeholder={placeholder}
        onKeyDownCapture={(e) => {
          if (slash && slash.items.length > 0 && (e.key === 'Enter' || e.key === 'Tab')) {
            e.stopPropagation();
          }
        }}
      >
        <EditorContent editor={editor} className="tiptap-note outline-none" />
      </div>
      {typeof document !== 'undefined' && createPortal(menu, document.body)}
    </>
  );
}
