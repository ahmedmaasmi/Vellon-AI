'use client';

import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WIKI_SUMMARY_API = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const WIKI_SEARCH_API = 'https://en.wikipedia.org/w/rest.php/v1/search/page';

interface WikiSummary {
  title?: string;
  extract?: string;
  type?: string;
  thumbnail?: { source: string; width?: number; height?: number };
  content_urls?: { desktop?: { page?: string } };
}

interface WikiSearchPage {
  key: string;
  title: string;
}

/** Normalize keyword for lookup: trim, collapse spaces, replace with underscores */
function normalizeWikiTitle(raw: string): string {
  return raw.trim().replace(/\s+/g, '_').replace(/^\W+|\W+$/g, '');
}

async function fetchSummary(titleOrKey: string): Promise<WikiSummary | null> {
  const res = await fetch(
    `${WIKI_SUMMARY_API}/${encodeURIComponent(titleOrKey)}`
  );
  if (!res.ok) return null;
  const json = (await res.json()) as WikiSummary;
  if (json.type === 'disambiguation' || !json.extract) return null;
  return json;
}

async function searchWiki(query: string): Promise<WikiSearchPage | null> {
  const res = await fetch(
    `${WIKI_SEARCH_API}?q=${encodeURIComponent(query)}&limit=5`
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { pages?: WikiSearchPage[] };
  const first = json.pages?.[0];
  return first ?? null;
}

interface WikipediaPreviewPanelProps {
  keyword: string;
  onClose: () => void;
  className?: string;
}

export default function WikipediaPreviewPanel({
  keyword,
  onClose,
  className = '',
}: WikipediaPreviewPanelProps) {
  const [state, setState] = useState<'loading' | 'found' | 'not_found' | 'error'>('loading');
  const [data, setData] = useState<WikiSummary | null>(null);
  const [attemptedQuery, setAttemptedQuery] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    setData(null);
    const normalized = normalizeWikiTitle(keyword);
    setAttemptedQuery(keyword.trim() || '(empty)');
    if (!normalized) {
      setState('not_found');
      return;
    }
    (async () => {
      let summary = await fetchSummary(normalized);
      if (cancelled) return;
      if (!summary) {
        const searchHit = await searchWiki(keyword.trim());
        if (cancelled) return;
        if (searchHit) {
          summary = await fetchSummary(searchHit.key);
        }
      }
      if (cancelled) return;
      if (summary) {
        setData(summary);
        setState('found');
      } else {
        setState('not_found');
      }
    })().catch(() => {
      if (!cancelled) setState('error');
    });
    return () => {
      cancelled = true;
    };
  }, [keyword]);

  const pageUrl = data?.content_urls?.desktop?.page;

  return (
    <div
      className={`rounded-xl border border-border bg-card text-foreground shadow-lg overflow-hidden flex flex-col ${className}`}
      role="complementary"
      aria-label={`Wikipedia preview for ${keyword}`}
    >
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
        <h3 className="font-semibold text-sm text-foreground">Wikipedia</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 min-h-[200px]">
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="text-sm">Looking up &quot;{keyword.trim() || 'term'}&quot; on Wikipedia...</p>
          </div>
        )}
        {state === 'not_found' && (
          <p className="text-sm text-muted-foreground py-4">
            No Wikipedia article found for &quot;{attemptedQuery}&quot;. Try a different term or check spelling.
          </p>
        )}
        {state === 'error' && (
          <p className="text-sm text-destructive/90 py-4">Failed to load preview. Try again later.</p>
        )}
        {state === 'found' && data && (
          <div className="space-y-3">
            {data.thumbnail?.source && (
              <div className="rounded-lg overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.thumbnail.source}
                  alt=""
                  className="w-full h-auto max-h-48 object-cover"
                  width={data.thumbnail.width}
                  height={data.thumbnail.height}
                />
              </div>
            )}
            <h4 className="font-semibold text-foreground">{data.title ?? keyword}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.extract}</p>
            {pageUrl && (
              <a
                href={pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Open full article
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
