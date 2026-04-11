/**
 * Builds display HTML for the note editor: markdown-like blocks + keyword highlights.
 * Lines are joined with newline text nodes so plain-text round-trip matches the stored string.
 */

import { extractKeywords, findKeywordRanges } from '@/lib/keyword-extractor';

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function highlightKeywordsInSegment(
  segment: string,
  segStartInFull: number,
  fullText: string,
  keywords: string[]
): string {
  if (!segment) return '';
  const ranges = findKeywordRanges(fullText, keywords);
  const overlaps = ranges
    .map((r) => ({
      start: Math.max(0, r.start - segStartInFull),
      end: Math.min(segment.length, r.end - segStartInFull),
      keyword: r.keyword,
    }))
    .filter((o) => o.start < o.end);

  overlaps.sort((a, b) => a.start - b.start);

  if (overlaps.length === 0) return escapeHtml(segment);

  const parts: string[] = [];
  let last = 0;
  for (const o of overlaps) {
    if (o.start < last) continue;
    if (o.start > last) parts.push(escapeHtml(segment.slice(last, o.start)));
    parts.push(
      `<span data-keyword="${escapeHtml(o.keyword)}" class="keyword-highlight" role="button" tabindex="0">${escapeHtml(segment.slice(o.start, o.end))}</span>`
    );
    last = o.end;
  }
  if (last < segment.length) parts.push(escapeHtml(segment.slice(last)));
  return parts.join('');
}

function renderPlainLine(line: string, lineStart: number, fullText: string, keywords: string[]): string {
  return `<span class="md-line md-line-plain" data-line-start="${lineStart}">${highlightKeywordsInSegment(line, lineStart, fullText, keywords)}</span>`;
}

function renderMarkdownLine(
  line: string,
  lineStart: number,
  fullText: string,
  keywords: string[]
): string {
  if (line === '') {
    return `<span class="md-line md-line-empty" data-line-start="${lineStart}"></span>`;
  }

  if (/^---\s*$/.test(line)) {
    return `<span class="md-line md-line-divider" data-line-start="${lineStart}"><span class="sr-only">${escapeHtml(line)}</span><span class="md-divider-rule" aria-hidden="true"></span></span>`;
  }

  const task = line.match(/^(\s*)- \[([ xX])\] ?(.*)$/);
  if (task) {
    const indent = task[1];
    const checked = task[2].toLowerCase() === 'x';
    const body = task[3];
    const mdPrefix = `${indent}- [${checked ? 'x' : ' '}] `;
    const bodyStart = lineStart + line.length - body.length;
    const ariaChecked = checked ? 'true' : 'false';
    const bodyHtml =
      body === ''
        ? TASK_BODY_EMPTY_PLACEHOLDER
        : highlightKeywordsInSegment(body, bodyStart, fullText, keywords);
    return `<span class="md-line md-line-task" data-line-start="${lineStart}"><span class="sr-only" contenteditable="false">${escapeHtml(mdPrefix)}</span><button type="button" role="checkbox" aria-checked="${ariaChecked}" class="md-task-cb" data-line-start="${lineStart}" data-checked="${checked ? '1' : '0'}" contenteditable="false"></button><span class="md-task-body">${bodyHtml}</span></span>`;
  }

  const h3 = line.match(/^###\s+(.*)$/);
  if (h3) {
    const body = h3[1];
    const prefix = '### ';
    const bodyStart = lineStart + line.length - body.length;
    return `<span class="md-line md-line-h3" data-line-start="${lineStart}"><span class="md-h-prefix">${escapeHtml(prefix)}</span><span class="md-h-body">${highlightKeywordsInSegment(body, bodyStart, fullText, keywords)}</span></span>`;
  }

  const h2 = line.match(/^##(?!#)\s+(.*)$/);
  if (h2) {
    const body = h2[1];
    const prefix = '## ';
    const bodyStart = lineStart + line.length - body.length;
    return `<span class="md-line md-line-h2" data-line-start="${lineStart}"><span class="md-h-prefix">${escapeHtml(prefix)}</span><span class="md-h-body">${highlightKeywordsInSegment(body, bodyStart, fullText, keywords)}</span></span>`;
  }

  const h1 = line.match(/^#(?!#)\s+(.*)$/);
  if (h1) {
    const body = h1[1];
    const prefix = '# ';
    const bodyStart = lineStart + line.length - body.length;
    return `<span class="md-line md-line-h1" data-line-start="${lineStart}"><span class="md-h-prefix">${escapeHtml(prefix)}</span><span class="md-h-body">${highlightKeywordsInSegment(body, bodyStart, fullText, keywords)}</span></span>`;
  }

  const callout = line.match(/^>\s+\*\*Note:\*\*\s*(.*)$/);
  if (callout) {
    const body = callout[1];
    const prefix = '> **Note:** ';
    const bodyStart = lineStart + line.length - body.length;
    return `<span class="md-line md-line-callout" data-line-start="${lineStart}"><span class="md-callout-prefix">${escapeHtml(prefix)}</span><span class="md-callout-body">${highlightKeywordsInSegment(body, bodyStart, fullText, keywords)}</span></span>`;
  }

  const bq = line.match(/^>\s+(.*)$/);
  if (bq) {
    const body = bq[1];
    const prefix = '> ';
    const bodyStart = lineStart + line.length - body.length;
    return `<span class="md-line md-line-quote" data-line-start="${lineStart}"><span class="md-quote-prefix">${escapeHtml(prefix)}</span><span class="md-quote-body">${highlightKeywordsInSegment(body, bodyStart, fullText, keywords)}</span></span>`;
  }

  const ol = line.match(/^(\d+)\.\s+(.*)$/);
  if (ol) {
    const num = ol[1];
    const body = ol[2];
    const prefix = `${num}. `;
    const bodyStart = lineStart + line.length - body.length;
    return `<span class="md-line md-line-ol" data-line-start="${lineStart}"><span class="md-list-prefix">${escapeHtml(prefix)}</span><span class="md-list-body">${highlightKeywordsInSegment(body, bodyStart, fullText, keywords)}</span></span>`;
  }

  const ul = line.match(/^-\s+(.*)$/);
  if (ul) {
    const body = ul[1];
    const prefix = '- ';
    const bodyStart = lineStart + line.length - body.length;
    return `<span class="md-line md-line-ul" data-line-start="${lineStart}"><span class="md-list-prefix md-bullet">${escapeHtml(prefix)}</span><span class="md-list-body">${highlightKeywordsInSegment(body, bodyStart, fullText, keywords)}</span></span>`;
  }

  return renderPlainLine(line, lineStart, fullText, keywords);
}

/** Placeholder so empty task lines have a text node for the caret (stripped on read). */
const TASK_BODY_EMPTY_PLACEHOLDER = '\u200b';

export function stripEditorDisplayPlaceholders(text: string): string {
  return text.replace(new RegExp(TASK_BODY_EMPTY_PLACEHOLDER, 'g'), '');
}

/** Plain text from editor DOM (matches stored note string). */
export function getEditorPlainText(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.md-task-cb').forEach((n) => n.remove());
  const raw = clone.textContent ?? '';
  return stripEditorDisplayPlaceholders(raw);
}

export function buildDocumentHtml(text: string): string {
  if (text === '') return '';
  const keywords = extractKeywords(text);
  const parts: string[] = [];
  let pos = 0;
  let inFence = false;
  const fenceBuf: string[] = [];

  const flushFence = () => {
    const code = fenceBuf.join('\n');
    fenceBuf.length = 0;
    parts.push(`<pre class="md-fence" spellcheck="false">${escapeHtml(code)}</pre>`);
    inFence = false;
  };

  while (pos <= text.length) {
    const nl = text.indexOf('\n', pos);
    const end = nl === -1 ? text.length : nl;
    const line = text.slice(pos, end);
    const lineStart = pos;

    if (inFence) {
      if (/^```\s*$/.test(line)) {
        flushFence();
      } else {
        fenceBuf.push(line);
      }
    } else if (/^```[\w-]*\s*$/.test(line)) {
      inFence = true;
    } else {
      parts.push(renderMarkdownLine(line, lineStart, text, keywords));
    }

    if (nl === -1) break;
    pos = nl + 1;
  }

  if (inFence) {
    const code = fenceBuf.join('\n');
    parts.push(`<pre class="md-fence" spellcheck="false">${escapeHtml(code)}</pre>`);
  }

  return `<span class="md-doc">${parts.join('\n')}</span>`;
}

export function getSlashCommandState(
  text: string,
  cursorOffset: number
): { active: boolean; slashStart: number; query: string } {
  const lineStart = text.lastIndexOf('\n', Math.max(0, cursorOffset - 1)) + 1;
  const lineUpToCursor = text.slice(lineStart, cursorOffset);
  const m = lineUpToCursor.match(/^(\s*)(\/[^/\n]*)$/);
  if (!m) return { active: false, slashStart: 0, query: '' };
  const slashPart = m[2];
  if (!slashPart.startsWith('/')) return { active: false, slashStart: 0, query: '' };
  const slashStart = lineStart + m[1].length;
  const query = slashPart.slice(1);
  return { active: true, slashStart, query };
}

/** Convert `- [ ] body` / `- [x] body` to `- body` (bullet). Returns null if not a task line. */
export function taskLineToBulletLine(line: string): string | null {
  const m = line.match(/^(\s*)- \[([ xX])\] ?(.*)$/);
  if (!m) return null;
  return `${m[1]}- ${m[3]}`;
}

export function toggleTaskLineAt(text: string, lineStart: number): string {
  const lineEnd = text.indexOf('\n', lineStart);
  const end = lineEnd === -1 ? text.length : lineEnd;
  const line = text.slice(lineStart, end);
  let newLine = line;
  if (/^(\s*)- \[ \] ?/.test(line)) {
    newLine = line.replace(/^(\s*)- \[ \] ?/, '$1- [x] ');
  } else if (/^(\s*)- \[[xX]\] ?/.test(line)) {
    newLine = line.replace(/^(\s*)- \[[xX]\] ?/, '$1- [ ] ');
  } else {
    return text;
  }
  return text.slice(0, lineStart) + newLine + text.slice(end);
}
