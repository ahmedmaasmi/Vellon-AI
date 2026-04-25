import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, type Decoration as DecorationT, DecorationSet } from '@tiptap/pm/view';
import { extractKeywords } from '@/lib/keyword-extractor';

const keywordDecoKey = new PluginKey('keywordHighlights');

function escapeRegExp(s: string): string {
  return s.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

/**
 * Per-text-node pattern highlights; keyword list derived from the current markdown
 * (same as legacy extractKeywords on stored body).
 */
export const KeywordHighlights = Extension.create({
  name: 'keywordHighlights',
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: keywordDecoKey,
        state: {
          init: (_, { doc }) => {
            const md = editor.getMarkdown();
            return buildSet(doc, extractKeywords(md));
          },
          apply: (tr, set, _old, state) => {
            if (!tr.docChanged) {
              return set.map(tr.mapping, tr.doc);
            }
            const md = editor.getMarkdown();
            return buildSet(state.doc, extractKeywords(md));
          },
        },
        props: {
          decorations(state) {
            return this.getState(state) as DecorationSet;
          },
        },
      }),
    ];
  },
});

function buildSet(doc: import('@tiptap/pm/model').Node, kws: string[]): DecorationSet {
  if (kws.length === 0) {
    return DecorationSet.empty;
  }
  const safe = kws.filter(Boolean);
  if (safe.length === 0) return DecorationSet.empty;
  const re = new RegExp(`\\b(${safe.map((k) => escapeRegExp(k)).join('|')})\\b`, 'gi');
  const list: DecorationT[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const t = node.text;
    if (!t) return;
    let m: RegExpExecArray | null;
    const g = new RegExp(re.source, 'gi');
    while ((m = g.exec(t))) {
      if (!m[0].trim()) continue;
      const k = m[0];
      const from = pos + m.index;
      const to = from + k.length;
      list.push(
        Decoration.inline(from, to, {
          class: 'keyword-highlight',
          nodeName: 'span',
          'data-keyword': k,
        })
      );
    }
  });
  return DecorationSet.create(doc, list);
}
