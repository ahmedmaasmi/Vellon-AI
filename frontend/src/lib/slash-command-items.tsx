import { type Editor, type Range } from '@tiptap/core';
import { CheckSquare, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code2, Minus, StickyNote } from 'lucide-react';
import type { Node as ProseNode } from '@tiptap/pm/model';
import type { ReactNode } from 'react';

/**
 * After inserting a single taskList (slash To-do), place the cursor in the new task
 * item's first paragraph. Default insertContent/insertContentAt moves the selection
 * to the *end* of the inserted list, so typing starts on the line below the checkbox.
 */
function collectTaskLists(doc: ProseNode): { pos: number; node: ProseNode }[] {
  const out: { pos: number; node: ProseNode }[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === 'taskList') {
      out.push({ pos, node });
    }
  });
  return out;
}

function pickTaskListForAnchor(
  lists: { pos: number; node: ProseNode }[],
  anchor: number
): { pos: number; node: ProseNode } | null {
  if (!lists.length) return null;
  const inside = lists.find((l) => anchor >= l.pos && anchor < l.pos + l.node.nodeSize);
  if (inside) return inside;
  // Selection often maps to the first position *after* the inserted list (next line).
  const endsBeforeAnchor = lists.filter((l) => l.pos + l.node.nodeSize <= anchor);
  if (endsBeforeAnchor.length) {
    return endsBeforeAnchor.reduce((a, b) =>
      a.pos + a.node.nodeSize > b.pos + b.node.nodeSize ? a : b
    );
  }
  return lists.reduce((a, b) => (Math.abs(anchor - a.pos) <= Math.abs(anchor - b.pos) ? a : b));
}

function getTextPosInNewTaskListFirstParagraph(doc: ProseNode, anchor: number): number | null {
  const taskLists = collectTaskLists(doc);
  if (!taskLists.length) {
    return null;
  }
  const hit = pickTaskListForAnchor(taskLists, anchor);
  if (!hit) return null;
  const listEnd = hit.pos + hit.node.nodeSize;
  let p: number | null = null;
  doc.nodesBetween(hit.pos, listEnd, (node, pos) => {
    if (p != null) {
      return false;
    }
    if (node.type.name === 'paragraph') {
      const $p = doc.resolve(pos + 1);
      for (let d = 1; d <= $p.depth; d++) {
        if ($p.node(d).type.name === 'taskItem') {
          p = pos + 1;
          return false;
        }
      }
    }
    return true;
  });
  return p;
}

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
  icon: ReactNode;
  /**
   * Markdown inserted at the trigger after `/query` is removed. Matches legacy plain-text
   * slash inserts so getMarkdown() round-trips with stored notes.
   */
  insertMarkdown: string;
}

export const SLASH_COMMAND_ITEMS: SlashCommandItem[] = [
  {
    id: 'checkbox',
    label: 'To-do',
    description: 'Task with a checkbox',
    keywords: ['todo', 'task', 'checkbox', 'check', 'list'],
    insertMarkdown: '- [ ] ',
    icon: <CheckSquare className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'h1',
    label: 'Heading 1',
    description: 'Large section heading',
    keywords: ['h1', 'title', 'heading', 'big'],
    insertMarkdown: '# ',
    icon: <Heading1 className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'h2',
    label: 'Heading 2',
    description: 'Medium section heading',
    keywords: ['h2', 'subtitle', 'heading'],
    insertMarkdown: '## ',
    icon: <Heading2 className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: 'Small section heading',
    keywords: ['h3', 'heading'],
    insertMarkdown: '### ',
    icon: <Heading3 className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'bullet',
    label: 'Bullet list',
    description: 'Simple bullet',
    keywords: ['bullet', 'unordered', 'list', 'point'],
    insertMarkdown: '- ',
    icon: <List className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'numbered',
    label: 'Numbered list',
    description: 'Ordered list item',
    keywords: ['number', 'ordered', 'list'],
    insertMarkdown: '1. ',
    icon: <ListOrdered className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Blockquote',
    keywords: ['quote', 'citation'],
    insertMarkdown: '> ',
    icon: <Quote className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'code',
    label: 'Code block',
    description: 'Fenced code (```)',
    keywords: ['code', 'snippet', 'pre'],
    insertMarkdown: '```\n',
    icon: <Code2 className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Horizontal rule',
    keywords: ['divider', 'line', 'separator', 'hr', 'rule'],
    insertMarkdown: '---',
    icon: <Minus className="h-4 w-4 shrink-0 text-primary" />,
  },
  {
    id: 'callout',
    label: 'Note',
    description: 'Callout box',
    keywords: ['note', 'callout', 'info', 'aside'],
    insertMarkdown: '> **Note:** ',
    icon: <StickyNote className="h-4 w-4 shrink-0 text-primary" />,
  },
];

export function runSlashInsert(editor: Editor, range: Range, item: SlashCommandItem): void {
  if (item.id === 'checkbox') {
    // Insert a real task list node so the TipTap nodeView (checkbox + body) and Enter (splitListItem) work.
    // Markdown insert is sometimes parsed as a plain line; this matches stored `- [ ] ` via getMarkdown() anyway.
    // Use updateSelection: false; insertContentAt otherwise places the caret after the
    // whole list block (selectionToInsertionEnd), so typing would skip to the next line.
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent(
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph' }],
            },
          ],
        },
        { updateSelection: false }
      )
      .run();

    // Second transaction: map(range.from) inside one tr can miss the new list when
    // insertContentAt expands an empty text block (from/to adjust). Use live anchor + widen search.
    const anchor = editor.state.selection.anchor;
    const p = getTextPosInNewTaskListFirstParagraph(editor.state.doc, anchor);
    if (p != null) {
      editor.chain().focus().setTextSelection(p).run();
    }
    return;
  }

  editor
    .chain()
    .focus()
    .deleteRange(range)
    .insertContent(item.insertMarkdown, { contentType: 'markdown' })
    .run();
}

function matchesFilter(item: SlashCommandItem, q: string): boolean {
  if (!q.trim()) return true;
  const lower = q.toLowerCase().trim();
  const haystack = [item.label, item.description, ...item.keywords, item.id]
    .join(' ')
    .toLowerCase();
  return haystack.includes(lower) || item.keywords.some((k) => k.startsWith(lower));
}

export function filterSlashItems(query: string): SlashCommandItem[] {
  return SLASH_COMMAND_ITEMS.filter((item) => matchesFilter(item, query));
}

export function slashCommandHasMatch(query: string): boolean {
  return SLASH_COMMAND_ITEMS.some((item) => matchesFilter(item, query));
}
