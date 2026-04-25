'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { slashCommandHasMatch, type SlashCommandItem } from '@/lib/slash-command-items';

export function slashMenuHasMatches(filter: string): boolean {
  return slashCommandHasMatch(filter);
}

export interface SlashCommandMenuHandle {
  /** Returns true if the event was handled (caller should preventDefault). */
  handleKeyDown: (e: KeyboardEvent) => boolean;
  resetActiveIndex: () => void;
}

export interface SlashCommandMenuProps {
  open: boolean;
  x: number;
  y: number;
  /** Pre-filtered items (e.g. from TipTap Suggestion) */
  items: SlashCommandItem[];
  onClose: () => void;
  onPick: (item: SlashCommandItem) => void;
}

const SlashCommandMenu = forwardRef<SlashCommandMenuHandle, SlashCommandMenuProps>(
  function SlashCommandMenu({ open, x, y, items: filtered, onClose, onPick }, ref) {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
      setActiveIndex(0);
    }, [filtered, open]);

    useEffect(() => {
      if (activeIndex >= filtered.length) {
        setActiveIndex(Math.max(0, filtered.length - 1));
      }
    }, [filtered.length, activeIndex]);

    const selectIndex = useCallback(
      (index: number) => {
        const item = filtered[index];
        if (item) onPick(item);
      },
      [filtered, onPick]
    );

    useImperativeHandle(
      ref,
      () => ({
        resetActiveIndex: () => setActiveIndex(0),
        handleKeyDown: (e: KeyboardEvent) => {
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
      [open, filtered, activeIndex, selectIndex, onClose]
    );

    useEffect(() => {
      if (!open || filtered.length === 0) return;
      const id = `slash-cmd-${filtered[activeIndex]?.id}`;
      if (typeof document !== 'undefined' && id) {
        document.getElementById(id)?.scrollIntoView({ block: 'nearest' });
      }
    }, [activeIndex, open, filtered]);

    const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 600;
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
              filtered[activeIndex] ? `slash-cmd-${filtered[activeIndex].id}` : undefined
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
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">No matches</p>
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
