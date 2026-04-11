'use client';

import { useCallback } from 'react';
import type { ChecklistItemState } from '@/types/note';

function sortItems(items: ChecklistItemState[]): ChecklistItemState[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export default function ChecklistEditor({
  items,
  onChange,
  disabled,
  placeholder = 'List item',
}: {
  items: ChecklistItemState[];
  onChange: (next: ChecklistItemState[]) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const sorted = sortItems(items.length ? items : [{ text: '', checked: false, order: 0 }]);

  const updateAt = useCallback(
    (index: number, patch: Partial<ChecklistItemState>) => {
      const base = sortItems(items.length ? items : [{ text: '', checked: false, order: 0 }]);
      const next = base.map((it, i) => (i === index ? { ...it, ...patch } : it));
      onChange(next.map((it, i) => ({ ...it, order: i })));
    },
    [items, onChange]
  );

  const toggle = useCallback(
    (index: number) => {
      const base = sortItems(items.length ? items : [{ text: '', checked: false, order: 0 }]);
      const next = base.map((it, i) =>
        i === index ? { ...it, checked: !it.checked } : it
      );
      onChange(next);
    },
    [items, onChange]
  );

  const addRow = useCallback(() => {
    const base = sortItems(items.length ? items : [{ text: '', checked: false, order: 0 }]);
    onChange([...base, { text: '', checked: false, order: base.length }]);
  }, [items, onChange]);

  const removeRow = useCallback(
    (index: number) => {
      const base = sortItems(items.length ? items : []);
      if (base.length <= 1) {
        onChange([{ text: '', checked: false, order: 0 }]);
        return;
      }
      const next = base.filter((_, i) => i !== index).map((it, i) => ({ ...it, order: i }));
      onChange(next);
    },
    [items, onChange]
  );

  return (
    <div className="space-y-2">
      {sorted.map((it, index) => (
        <div key={`${it.order}-${index}`} className="flex items-start gap-2 group/row">
          <button
            type="button"
            disabled={disabled}
            onClick={() => toggle(index)}
            className="mt-1.5 h-4 w-4 shrink-0 rounded border border-foreground/30 bg-background/80 disabled:opacity-50"
            aria-checked={it.checked}
            role="checkbox"
          >
            {it.checked ? (
              <span className="flex h-full w-full items-center justify-center text-[10px] text-primary">
                ✓
              </span>
            ) : null}
          </button>
          <input
            type="text"
            disabled={disabled}
            placeholder={placeholder}
            value={it.text}
            onChange={(e) => updateAt(index, { text: e.target.value })}
            className={`flex-1 min-w-0 border-0 bg-transparent px-1 py-0.5 text-sm outline-none ring-0 focus:ring-0 ${
              it.checked ? 'line-through text-muted-foreground' : ''
            }`}
          />
          {!disabled && (
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="opacity-0 group-hover/row:opacity-100 text-xs text-muted-foreground hover:text-destructive px-1"
            >
              ×
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={addRow}
          className="text-xs text-muted-foreground hover:text-foreground pl-6"
        >
          + Add item
        </button>
      )}
    </div>
  );
}
