'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import SlashCommandMenu, {
  type SlashCommandMenuHandle,
  slashMenuHasMatches,
} from '@/components/SlashCommandMenu';
import {
  buildDocumentHtml,
  getEditorPlainText,
  getSlashCommandState,
  stripEditorDisplayPlaceholders,
  taskLineToBulletLine,
  toggleTaskLineAt,
} from '@/lib/editor-document-html';

/** Text inside these nodes is in plain-text offsets but must not host the caret (off-screen or non-text UI). */
function isInsideHiddenEditorNode(node: Node): boolean {
  let el =
    node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
  while (el) {
    if (el.classList?.contains('sr-only') || el.classList?.contains('md-task-cb')) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

function setSelectionToOffset(container: HTMLElement, startOffset: number, endOffset: number) {
  const sel = window.getSelection();
  if (!sel) return;

  let current = 0;
  let startNode: Node | null = null;
  let startOff = 0;
  let endNode: Node | null = null;
  let endOff = 0;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const len = (textNode.textContent ?? '').length;
    const hidden = isInsideHiddenEditorNode(textNode);
    if (!hidden && startNode === null && current + len >= startOffset) {
      startNode = textNode;
      startOff = startOffset - current;
    }
    if (!hidden && endNode === null && current + len >= endOffset) {
      endNode = textNode;
      endOff = endOffset - current;
    }
    current += len;
    if (startNode !== null && endNode !== null) break;
  }

  if (startNode && endNode) {
    const range = document.createRange();
    range.setStart(startNode, Math.min(startOff, (startNode.textContent ?? '').length));
    range.setEnd(endNode, Math.min(endOff, (endNode.textContent ?? '').length));
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

function getOffsetFromNode(container: HTMLElement, node: Node, offset: number): number {
  if (!container.contains(node)) return 0;
  try {
    const range = document.createRange();
    range.setStart(container, 0);
    range.setEnd(node, offset);
    const div = document.createElement('div');
    div.appendChild(range.cloneContents());
    div.querySelectorAll('.md-task-cb').forEach((b) => b.remove());
    return stripEditorDisplayPlaceholders(div.textContent ?? '').length;
  } catch {
    return 0;
  }
}

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
  const elRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);
  const lastValueRef = useRef(value);
  const slashMenuRef = useRef<SlashCommandMenuHandle>(null);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashPos, setSlashPos] = useState({ x: 0, y: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const slashOpenRef = useRef(false);
  slashOpenRef.current = slashOpen;
  const slashFilterRef = useRef('');
  slashFilterRef.current = slashFilter;
  /** Skips handleInput while slash insertion rewrites innerHTML (avoids clobbering). */
  const isInsertingSlashRef = useRef(false);
  /** beforeinput handled task→bullet strip; keydown skips duplicate try. */
  const taskStripHandledByBeforeInputRef = useRef(false);

  const closeSlashMenu = useCallback(() => {
    slashOpenRef.current = false;
    slashFilterRef.current = '';
    setSlashOpen(false);
    setSlashFilter('');
  }, []);

  const updateSlashFromDom = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    const text = getEditorPlainText(el);
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) {
      if (slashOpenRef.current) closeSlashMenu();
      return;
    }
    const range = sel.getRangeAt(0);
    if (!range.collapsed) {
      if (slashOpenRef.current) closeSlashMenu();
      return;
    }
    const cursorOffset = getOffsetFromNode(el, range.startContainer, range.startOffset);
    const state = getSlashCommandState(text, cursorOffset);
    if (state.active) {
      setSlashFilter(state.query);
      setSlashOpen(true);
      try {
        const rect = range.getBoundingClientRect();
        setSlashPos({ x: rect.left, y: rect.bottom + 4 });
      } catch {
        setSlashPos({ x: 80, y: 120 });
      }
    } else if (slashOpenRef.current) {
      closeSlashMenu();
    }
  }, [closeSlashMenu]);

  const applyDocumentHtml = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    const text = getEditorPlainText(el);
    const html = buildDocumentHtml(text);
    if (el.innerHTML !== html) {
      const sel = window.getSelection();
      let startOffset = 0;
      let endOffset = 0;
      if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        startOffset = getOffsetFromNode(el, range.startContainer, range.startOffset);
        endOffset = getOffsetFromNode(el, range.endContainer, range.endOffset);
      }
      el.innerHTML = html;
      setSelectionToOffset(el, startOffset, endOffset);
    }
  }, []);

  /** Backspace at start of task body hits contenteditable=false; strip checkbox by converting to bullet. */
  const tryStripTaskCheckboxAtCaret = useCallback((): boolean => {
    const el = elRef.current;
    if (!el) return false;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return false;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.startContainer)) return false;
    const text = getEditorPlainText(el);
    const offset = getOffsetFromNode(el, range.startContainer, range.startOffset);
    const lineStart = text.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
    const lineEnd = text.indexOf('\n', offset);
    const end = lineEnd === -1 ? text.length : lineEnd;
    const line = text.slice(lineStart, end);
    const m = line.match(/^(\s*)- \[([ xX])\] ?(.*)$/);
    if (!m) return false;
    const prefixLen = line.length - m[3].length;
    if (offset !== lineStart + prefixLen) return false;
    const newLine = taskLineToBulletLine(line);
    if (newLine === null) return false;
    const newText = text.slice(0, lineStart) + newLine + text.slice(end);
    const indent = m[1];
    const caret = lineStart + indent.length + 2;
    isInternalUpdate.current = true;
    lastValueRef.current = newText;
    onChangeText(newText);
    isInternalUpdate.current = false;
    requestAnimationFrame(() => {
      el.innerHTML = buildDocumentHtml(newText);
      el.focus();
      setSelectionToOffset(el, caret, caret);
      applyDocumentHtml();
    });
    return true;
  }, [onChangeText, applyDocumentHtml]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const text = getEditorPlainText(el);
    const valueChanged = lastValueRef.current !== value && !isInternalUpdate.current;
    const needsSync = valueChanged || (value !== undefined && text !== value);
    if (needsSync) {
      lastValueRef.current = value;
      el.innerHTML = value === '' ? '' : buildDocumentHtml(value);
      applyDocumentHtml();
    }
  }, [value, applyDocumentHtml]);

  const handleInput = useCallback(() => {
    if (isInsertingSlashRef.current) return;
    const el = elRef.current;
    if (!el) return;
    const text = getEditorPlainText(el);
    isInternalUpdate.current = true;
    lastValueRef.current = text;
    onChangeText(text);
    isInternalUpdate.current = false;
    requestAnimationFrame(() => {
      applyDocumentHtml();
      updateSlashFromDom();
    });
  }, [onChangeText, applyDocumentHtml, updateSlashFromDom]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const t = e.target as HTMLElement;
      const taskBtn = t.closest?.('.md-task-cb') as HTMLElement | null;
      if (taskBtn) {
        e.preventDefault();
        const el = elRef.current;
        if (!el) return;
        const lineStart = parseInt(taskBtn.getAttribute('data-line-start') ?? '-1', 10);
        if (Number.isNaN(lineStart) || lineStart < 0) return;
        const text = getEditorPlainText(el);
        const sel = window.getSelection();
        let savedStart = 0;
        let savedEnd = 0;
        if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
          const range = sel.getRangeAt(0);
          savedStart = getOffsetFromNode(el, range.startContainer, range.startOffset);
          savedEnd = getOffsetFromNode(el, range.endContainer, range.endOffset);
        }
        const next = toggleTaskLineAt(text, lineStart);
        if (next !== text) {
          isInternalUpdate.current = true;
          lastValueRef.current = next;
          onChangeText(next);
          isInternalUpdate.current = false;
          requestAnimationFrame(() => {
            el.innerHTML = buildDocumentHtml(next);
            el.focus();
            setSelectionToOffset(el, savedStart, savedEnd);
            applyDocumentHtml();
          });
        }
        return;
      }
      const kwTarget = t.closest?.('[data-keyword]');
      if (kwTarget && onKeywordClick) {
        const keyword = kwTarget.getAttribute('data-keyword');
        if (keyword) {
          e.preventDefault();
          onKeywordClick(keyword);
        }
      }
    },
    [onKeywordClick, onChangeText, applyDocumentHtml]
  );

  const insertSlashChoice = useCallback(
    (insert: string) => {
      const el = elRef.current;
      if (!el) return;
      const text = getEditorPlainText(el);
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) {
        closeSlashMenu();
        return;
      }
      const range = sel.getRangeAt(0);
      const cursorOffset = getOffsetFromNode(el, range.startContainer, range.startOffset);
      const state = getSlashCommandState(text, cursorOffset);
      if (!state.active) {
        closeSlashMenu();
        return;
      }
      isInsertingSlashRef.current = true;
      const before = text.slice(0, state.slashStart);
      const after = text.slice(cursorOffset);
      const next = before + insert + after;
      const caret = state.slashStart + insert.length;
      isInternalUpdate.current = true;
      lastValueRef.current = next;
      onChangeText(next);
      isInternalUpdate.current = false;
      closeSlashMenu();
      requestAnimationFrame(() => {
        try {
          el.innerHTML = buildDocumentHtml(next);
          setSelectionToOffset(el, caret, caret);
          applyDocumentHtml();
        } finally {
          isInsertingSlashRef.current = false;
        }
      });
    },
    [onChangeText, closeSlashMenu, applyDocumentHtml]
  );

  const handleBeforeInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>) => {
      const ie = e.nativeEvent as InputEvent;
      if (slashOpenRef.current) {
        // Only block newlines when Enter is handled by the menu (has ≥1 match). "No matches" leaves Enter to the editor.
        if (slashMenuHasMatches(slashFilterRef.current)) {
          const inputType = ie.inputType;
          if (inputType === 'insertParagraph' || inputType === 'insertLineBreak') {
            e.preventDefault();
          }
        }
        return;
      }
      if (ie.inputType === 'deleteContentBackward' && tryStripTaskCheckboxAtCaret()) {
        e.preventDefault();
        taskStripHandledByBeforeInputRef.current = true;
      }
    },
    [tryStripTaskCheckboxAtCaret]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (slashOpen && slashMenuRef.current?.handleKeyDown(e)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (e.key === 'Escape' && slashOpen) {
        e.preventDefault();
        closeSlashMenu();
        return;
      }

      if (e.key === 'Backspace' && !e.nativeEvent.isComposing && !slashOpen) {
        if (taskStripHandledByBeforeInputRef.current) {
          taskStripHandledByBeforeInputRef.current = false;
          e.preventDefault();
          return;
        }
        if (tryStripTaskCheckboxAtCaret()) {
          e.preventDefault();
        }
      }

      const node = e.target as Node;
      const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
      const kwTarget = el?.closest?.('[data-keyword]');
      if (kwTarget && (e.key === 'Enter' || e.key === ' ')) {
        const keyword = (kwTarget as HTMLElement).getAttribute('data-keyword');
        if (keyword && onKeywordClick) {
          e.preventDefault();
          onKeywordClick(keyword);
        }
      }
    },
    [onKeywordClick, slashOpen, closeSlashMenu, tryStripTaskCheckboxAtCaret]
  );

  useEffect(() => {
    const onSelChange = () => {
      if (!slashOpenRef.current) return;
      requestAnimationFrame(updateSlashFromDom);
    };
    document.addEventListener('selectionchange', onSelChange);
    return () => document.removeEventListener('selectionchange', onSelChange);
  }, [updateSlashFromDom]);

  const editor = (
    <div
      ref={elRef}
      contentEditable
      suppressContentEditableWarning
      className={className}
      onInput={handleInput}
      onBeforeInput={handleBeforeInput}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      role="textbox"
      aria-multiline="true"
      aria-label={placeholder}
      id="note-body-editor"
    />
  );

  return (
    <>
      {editor}
      {typeof document !== 'undefined' &&
        createPortal(
          <SlashCommandMenu
            ref={slashMenuRef}
            open={slashOpen}
            x={slashPos.x}
            y={slashPos.y}
            filter={slashFilter}
            onClose={closeSlashMenu}
            onSelect={insertSlashChoice}
          />,
          document.body
        )}
    </>
  );
}
