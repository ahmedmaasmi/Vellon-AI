'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { extractKeywords, findKeywordRanges } from '@/lib/keyword-extractor';

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function buildHighlightedHtml(text: string, keywords: string[]): string {
  if (!keywords.length) return escapeHtml(text);
  const ranges = findKeywordRanges(text, keywords);
  if (ranges.length === 0) return escapeHtml(text);
  const parts: string[] = [];
  let lastEnd = 0;
  for (const { start, end, keyword } of ranges) {
    if (start > lastEnd) {
      parts.push(escapeHtml(text.slice(lastEnd, start)));
    }
    parts.push(
      `<span data-keyword="${escapeHtml(keyword)}" class="keyword-highlight" role="button" tabindex="0">${escapeHtml(text.slice(start, end))}</span>`
    );
    lastEnd = end;
  }
  if (lastEnd < text.length) {
    parts.push(escapeHtml(text.slice(lastEnd)));
  }
  return parts.join('');
}

function getTextContent(el: HTMLElement): string {
  return el.textContent ?? '';
}

function setSelectionToOffset(container: HTMLElement, startOffset: number, endOffset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  let current = 0;
  let startNode: Node | null = null;
  let startOff = 0;
  let endNode: Node | null = null;
  let endOff = 0;

  function walk(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = (node.textContent ?? '').length;
      if (startNode === null && current + len >= startOffset) {
        startNode = node;
        startOff = startOffset - current;
      }
      if (endNode === null && current + len >= endOffset) {
        endNode = node;
        endOff = endOffset - current;
      }
      current += len;
      if (startNode !== null && endNode !== null) return true;
      return false;
    }
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).classList.contains('keyword-highlight')) {
      const len = (node.textContent ?? '').length;
      if (startNode === null && current + len >= startOffset) {
        startNode = node.firstChild ?? node;
        startOff = Math.min(startOffset - current, len);
      }
      if (endNode === null && current + len >= endOffset) {
        endNode = node.firstChild ?? node;
        endOff = Math.min(endOffset - current, len);
      }
      current += len;
      return startNode !== null && endNode !== null;
    }
    for (let i = 0; i < node.childNodes.length; i++) {
      if (walk(node.childNodes[i])) return true;
    }
    return false;
  }

  walk(container);
  if (startNode && endNode) {
    const range = document.createRange();
    range.setStart(startNode, startOff);
    range.setEnd(endNode, endOff);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

function getOffsetFromNode(container: HTMLElement, node: Node, offset: number): number {
  let result = 0;

  function walk(n: Node): boolean {
    if (n.nodeType === Node.TEXT_NODE) {
      const len = (n.textContent ?? '').length;
      if (n === node) {
        result += Math.min(offset, len);
        return true;
      }
      result += len;
      return false;
    }
    for (let i = 0; i < n.childNodes.length; i++) {
      if (walk(n.childNodes[i])) return true;
    }
    return false;
  }

  walk(container);
  return result;
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

  const applyHighlights = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    const text = getTextContent(el);
    const keywords = extractKeywords(text);
    const html = buildHighlightedHtml(text, keywords);
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

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const text = getTextContent(el);
    const valueChanged = lastValueRef.current !== value && !isInternalUpdate.current;
    const needsSync = valueChanged || (value && text !== value);
    if (needsSync) {
      lastValueRef.current = value;
      if (text !== value) {
        el.textContent = value;
      }
      applyHighlights();
    }
  }, [value, applyHighlights]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (el.textContent === '' && value === '') {
      lastValueRef.current = value;
      el.textContent = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    const text = getTextContent(el);
    isInternalUpdate.current = true;
    lastValueRef.current = text;
    onChangeText(text);
    isInternalUpdate.current = false;
    requestAnimationFrame(() => {
      applyHighlights();
    });
  }, [onChangeText, applyHighlights]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const node = e.target as Node;
      const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
      const target = el?.closest?.('[data-keyword]');
      if (target && onKeywordClick) {
        const keyword = (target as HTMLElement).getAttribute('data-keyword');
        if (keyword) {
          e.preventDefault();
          onKeywordClick(keyword);
        }
      }
    },
    [onKeywordClick]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const node = e.target as Node;
      const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
      const target = el?.closest?.('[data-keyword]');
      if (target && (e.key === 'Enter' || e.key === ' ')) {
        const keyword = (target as HTMLElement).getAttribute('data-keyword');
        if (keyword && onKeywordClick) {
          e.preventDefault();
          onKeywordClick(keyword);
        }
      }
    },
    [onKeywordClick]
  );

  return (
    <div
      ref={elRef}
      contentEditable
      suppressContentEditableWarning
      className={className}
      onInput={handleInput}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      role="textbox"
      aria-multiline="true"
      aria-label={placeholder}
      id="note-body-editor"
    />
  );
}
