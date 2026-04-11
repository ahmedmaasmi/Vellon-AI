'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  StickyNote,
} from 'lucide-react';

export type SlashBlockId =
  | 'checkbox'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bullet'
  | 'numbered'
  | 'quote'
  | 'code'
  | 'divider'
  | 'callout';

export interface SlashCommandItem {
  id: SlashBlockId;
  label: string;
  description: string;
  /** Lowercase tokens for filtering */
  keywords: string[];
  /** Text inserted when chosen (replaces /query) */
  insert: string;
  icon: React.ReactNode;
}

const ITEMS: SlashCommandItem[] = [
  {
    id: 'checkbox',
    label: 'To-do',
    description: 'Task with a checkbox',
    keywords: ['todo', 'task', 'checkbox', 'check', 'list'],
    insert: '- [ ] ',
    icon: <CheckSquare className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'h1',
    label: 'Heading 1',
    description: 'Large section heading',
    keywords: ['h1', 'title', 'heading', 'big'],
    insert: '# ',
    icon: <Heading1 className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'h2',
    label: 'Heading 2',
    description: 'Medium section heading',
    keywords: ['h2', 'subtitle', 'heading'],
    insert: '## ',
    icon: <Heading2 className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: 'Small section heading',
    keywords: ['h3', 'heading'],
    insert: '### ',
    icon: <Heading3 className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'bullet',
    label: 'Bullet list',
    description: 'Simple bullet',
    keywords: ['bullet', 'unordered', 'list', 'point'],
    insert: '- ',
    icon: <List className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'numbered',
    label: 'Numbered list',
    description: 'Ordered list item',
    keywords: ['number', 'ordered', 'list'],
    insert: '1. ',
    icon: <ListOrdered className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Blockquote',
    keywords: ['quote', 'citation'],
    insert: '> ',
    icon: <Quote className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'code',
    label: 'Code block',
    description: 'Fenced code (```)',
    keywords: ['code', 'snippet', 'pre'],
    insert: '```\n',
    icon: <Code2 className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Horizontal rule',
    keywords: ['divider', 'line', 'separator', 'hr', 'rule'],
    insert: '---',
    icon: <Minus className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'callout',
    label: 'Note',
    description: 'Callout box',
    keywords: ['note', 'callout', 'info', 'aside'],
    insert: '> **Note:** ',
    icon: <StickyNote className="h-4 w-4 shrink-0 text-primary" />,
  },
];

function matchesFilter(item: SlashCommandItem, q: string): boolean {
  if (!q.trim()) return true;
  const lower = q.toLowerCase().trim();
  const haystack = [item.label, item.description, ...item.keywords, item.id]
    .join(' ')
    .toLowerCase();
  return haystack.includes(lower) || item.keywords.some((k) => k.startsWith(lower));
}

/** True when the slash menu would show at least one selectable item (matches SlashCommandMenu filtering). */
export function slashMenuHasMatches(filter: string): boolean {
  return ITEMS.some((item) => matchesFilter(item, filter));
}

export interface SlashCommandMenuHandle {
  /** Returns true if the event was handled (caller should preventDefault). */
  handleKeyDown: (e: React.KeyboardEvent) => boolean;
  resetActiveIndex: () => void;
}

export interface SlashCommandMenuProps {
  open: boolean;
  x: number;
  y: number;
  filter: string;
  onClose: () => void;
  onSelect: (insert: string) => void;
}

const SlashCommandMenu = forwardRef<SlashCommandMenuHandle, SlashCommandMenuProps>(
  function SlashCommandMenu({ open, x, y, filter, onClose, onSelect }, ref) {
    const filtered = useMemo(
      () => ITEMS.filter((item) => matchesFilter(item, filter)),
      [filter]
    );
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
      setActiveIndex(0);
    }, [filter, open]);

    useEffect(() => {
      if (activeIndex >= filtered.length) {
        setActiveIndex(Math.max(0, filtered.length - 1));
      }
    }, [filtered.length, activeIndex]);

    const selectIndex = useCallback(
      (index: number) => {
        const item = filtered[index];
        if (item) {
          onSelect(item.insert);
        }
      },
      [filtered, onSelect]
    );

    useImperativeHandle(
      ref,
      () => ({
        resetActiveIndex: () => setActiveIndex(0),
        handleKeyDown: (e: React.KeyboardEvent) => {
          if (!open || filtered.length === 0) return false;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % filtered.length);
            return true;
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
            return true;
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            selectIndex(activeIndex);
            return true;
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
            return true;
          }
          if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
              setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
            } else {
              setActiveIndex((i) => (i + 1) % filtered.length);
            }
            return true;
          }
          return false;
        },
      }),
      [open, filtered.length, activeIndex, selectIndex, onClose]
    );

    useEffect(() => {
      if (!open || filtered.length === 0) return;
      const id = `slash-cmd-${filtered[activeIndex]?.id}`;
      if (typeof document !== 'undefined' && id) {
        document.getElementById(id)?.scrollIntoView({ block: 'nearest' });
      }
    }, [activeIndex, open, filtered]);

    const vw =
      typeof window !== 'undefined' ? window.innerWidth : 400;
    const vh =
      typeof window !== 'undefined' ? window.innerHeight : 600;
    const menuWidth = 280;
    const maxH = 320;
    const left = Math.min(Math.max(8, x), vw - menuWidth - 8);
    const top = Math.min(Math.max(8, y), vh - maxH - 8);

    return (
      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-label="Insert block"
            aria-activedescendant={
              filtered[activeIndex]
                ? `slash-cmd-${filtered[activeIndex].id}`
                : undefined
            }
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-[100] w-[min(280px,calc(100vw-16px))] max-h-[320px] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-elevated"
            style={{ left, top, maxHeight: maxH }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/60">
              Blocks
            </p>
            <div className="max-h-[260px] overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No matches
                </p>
              ) : (
                filtered.map((item, index) => {
                  const selected = index === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      id={`slash-cmd-${item.id}`}
                      aria-selected={selected}
                      className={`flex w-full items-start gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                        selected
                          ? 'bg-primary/12 text-foreground'
                          : 'text-foreground hover:bg-muted/80'
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectIndex(index)}
                    >
                      <span className="mt-0.5">{item.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="font-medium block leading-tight">{item.label}</span>
                        <span className="text-xs text-muted-foreground leading-snug block mt-0.5">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

export default SlashCommandMenu;
