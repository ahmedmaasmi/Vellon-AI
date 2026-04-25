import type { Node as PMNode } from '@tiptap/pm/model';
import type { SuggestionMatch, Trigger } from '@tiptap/suggestion';
import { getSlashCommandState } from '@/lib/editor-document-html';

/**
 * Map a character offset in the flattened text (same as `getSlashCommandState` source)
 * to a document position, using the same newlines that `getSlashCommandState` expects.
 */
function offsetToPos(doc: PMNode, charOffset: number, blockSeparator = '\n'): number {
  if (charOffset <= 0) return 0;
  if (charOffset >= doc.textBetween(0, doc.content.size, blockSeparator, blockSeparator).length) {
    return doc.content.size;
  }
  let lo = 0;
  let hi = doc.content.size;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    const len = doc.textBetween(0, mid, blockSeparator, blockSeparator).length;
    if (len <= charOffset) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo;
}

/**
 * TipTap Suggestion `findSuggestionMatch` override: keeps the same slash rules as
 * `getSlashCommandState` in editor-document-html (line-local `/query`, no second `/` in query).
 */
export function findSlashSuggestionMatch(_config: Trigger): SuggestionMatch {
  const { $position } = _config;
  const doc = $position.doc;
  const pos = $position.pos;
  const blockSeparator = '\n';
  const full = doc.textBetween(0, doc.content.size, blockSeparator, blockSeparator);
  const cursorOffset = doc.textBetween(0, pos, blockSeparator, blockSeparator).length;
  const slash = getSlashCommandState(full, cursorOffset);
  if (!slash.active) {
    return null;
  }
  const from = offsetToPos(doc, slash.slashStart, blockSeparator);
  return {
    range: { from, to: pos },
    query: slash.query,
    text: full.slice(slash.slashStart, cursorOffset),
  };
}
