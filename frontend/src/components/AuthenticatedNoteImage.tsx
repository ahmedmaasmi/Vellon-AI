'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function AuthenticatedNoteImage({
  noteId,
  imageId,
  alt,
  className,
}: {
  noteId: string;
  imageId: string;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      try {
        const res = await api.get<Blob>(`/api/v1/notes/${noteId}/images/${imageId}`, {
          responseType: 'blob',
        });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setUrl(objectUrl);
      } catch {
        if (!cancelled) setUrl(null);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [noteId, imageId]);

  if (!url) {
    return <div className={`animate-pulse bg-muted/50 ${className ?? ''}`} aria-hidden />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} />;
}
