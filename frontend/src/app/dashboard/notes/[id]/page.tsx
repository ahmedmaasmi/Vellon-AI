'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, type QuotaResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, Save, Trash2, Wand2, Sparkles, Pin, Heart, Tag, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TagItem {
  id: string;
  name: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: string;
  is_pinned?: boolean;
  is_favorite?: boolean;
  tags?: TagItem[];
}

interface NoteFormValues {
  title: string;
  content: string;
}

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<'summary' | 'keywords' | 'embeddings' | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[] | null>(null);
  const [embeddingsResult, setEmbeddingsResult] = useState<{ dimension: number; cached: boolean } | null>(null);
  const [quota, setQuota] = useState<QuotaResponse | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [noteTags, setNoteTags] = useState<TagItem[]>([]);
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm<NoteFormValues>();

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const response = await api.get<Note>(`/api/v1/notes/${noteId}`);
        const note = response.data;
        reset({
          title: note.title,
          content: note.content,
        });
        setIsPinned(!!note.is_pinned);
        setIsFavorite(!!note.is_favorite);
        setNoteTags(note.tags ?? []);
      } catch (error) {
        console.error('Failed to fetch note:', error);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchQuota = async () => {
      try {
        const res = await api.get<QuotaResponse>('/api/v1/usage/quota');
        setQuota(res.data);
      } catch {
        setQuota(null);
      }
    };

    const fetchTags = useCallback(async () => {
      try {
        const res = await api.get<TagItem[]>('/api/v1/tags');
        setAllTags(res.data);
      } catch {
        setAllTags([]);
      }
    }, []);

    if (noteId) {
      fetchNote();
      fetchQuota();
      fetchTags();
    }
  }, [noteId, reset, router]);

  const attachTag = async (tagId: string) => {
    try {
      await api.post(`/api/v1/notes/${noteId}/tags/${tagId}`);
      const res = await api.get<Note>(`/api/v1/notes/${noteId}`);
      setNoteTags(res.data.tags ?? []);
      setTagDropdownOpen(false);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch {
      // ignore
    }
  };

  const detachTag = async (tagId: string) => {
    try {
      await api.delete(`/api/v1/notes/${noteId}/tags/${tagId}`);
      setNoteTags((prev) => prev.filter((t) => t.id !== tagId));
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch {
      // ignore
    }
  };

  const availableToAdd = allTags.filter((t) => !noteTags.some((nt) => nt.id === t.id));

  const onSubmit = async (data: NoteFormValues) => {
    setIsSaving(true);
    try {
      await api.put(`/api/v1/notes/${noteId}`, data);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.delete(`/api/v1/notes/${noteId}`);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const togglePin = async () => {
    try {
      await api.put(`/api/v1/notes/${noteId}`, { is_pinned: !isPinned });
      setIsPinned((v) => !v);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch {
      // ignore
    }
  };
  const toggleFavorite = async () => {
    try {
      await api.put(`/api/v1/notes/${noteId}`, { is_favorite: !isFavorite });
      setIsFavorite((v) => !v);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch {
      // ignore
    }
  };

  const handleSummarize = async () => {
    setQuotaError(null);
    setAiLoading('summary');
    try {
      await handleSubmit(onSubmit)();
      const response = await api.get(`/api/v1/notes/${noteId}/summary`);
      setSummary(response.data.summary);
      const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota');
      setQuota(quotaRes.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 429) {
        setQuotaError(detail || 'AI usage limit reached for this month. Try again next month or upgrade your plan.');
        const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota').catch(() => null);
        if (quotaRes?.data) setQuota(quotaRes.data);
      } else {
        setQuotaError('Failed to generate summary. Please try again.');
      }
    } finally {
      setAiLoading(null);
    }
  };

  const handleExtractKeywords = async () => {
    setQuotaError(null);
    setAiLoading('keywords');
    try {
      await handleSubmit(onSubmit)();
      const response = await api.get(`/api/v1/notes/${noteId}/keywords`);
      setKeywords(response.data.keywords);
      const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota');
      setQuota(quotaRes.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 429) {
        setQuotaError(detail || 'AI usage limit reached for this month. Try again next month or upgrade your plan.');
        const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota').catch(() => null);
        if (quotaRes?.data) setQuota(quotaRes.data);
      } else {
        setQuotaError('Failed to extract keywords. Please try again.');
      }
    } finally {
      setAiLoading(null);
    }
  };

  const handleGenerateEmbeddings = async () => {
    setQuotaError(null);
    setAiLoading('embeddings');
    try {
      await handleSubmit(onSubmit)();
      const response = await api.post(`/api/v1/notes/${noteId}/embeddings`);
      setEmbeddingsResult({
        dimension: response.data.dimension,
        cached: response.data.cached,
      });
      const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota');
      if (quotaRes?.data) setQuota(quotaRes.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 429) {
        setQuotaError(detail || 'AI usage limit reached for this month. Try again next month or upgrade your plan.');
        const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota').catch(() => null);
        if (quotaRes?.data) setQuota(quotaRes.data);
      } else {
        setQuotaError(detail || 'Failed to generate embeddings. Ensure OpenRouter is configured.');
      }
    } finally {
      setAiLoading(null);
    }
  };

  const aiDisabled = (quota != null && quota.remaining === 0) || !!aiLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto w-full p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between sticky top-0 bg-card/90 backdrop-blur-sm py-4 z-10 -mx-4 px-4 rounded-b-md">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hover:bg-muted" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Edit Note</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={togglePin} title={isPinned ? 'Unpin' : 'Pin'}>
            <Pin className={`h-4 w-4 mr-2 ${isPinned ? 'fill-current' : ''}`} />
            {isPinned ? 'Pinned' : 'Pin'}
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFavorite} title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
            <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
            {isFavorite ? 'Favorited' : 'Favorite'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive hover:border-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
            {isSaving ? <Spinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {noteTags.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-sm"
            >
              {t.name}
              <button
                type="button"
                onClick={() => detachTag(t.id)}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                aria-label={`Remove tag ${t.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTagDropdownOpen((v) => !v)}
              className="gap-2"
            >
              <Tag className="h-4 w-4" />
              Add tag
            </Button>
            {tagDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden
                  onClick={() => setTagDropdownOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1 z-20 min-w-[160px] rounded-lg border border-border bg-card py-1 shadow-md">
                  {availableToAdd.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">No other tags</p>
                  ) : (
                    availableToAdd.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                        onClick={() => attachTag(t.id)}
                      >
                        {t.name}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Input
            {...register('title')}
            className="text-4xl font-bold border-none px-0 focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/40 text-foreground h-auto py-2"
            placeholder="Note Title"
          />
          <textarea
            {...register('content')}
            className="w-full flex-1 min-h-[500px] p-0 border-none bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0 resize-none text-lg leading-relaxed"
            placeholder="Start typing your thoughts..."
          />
        </div>

        {/* AI Sidebar */}
        <div className="space-y-6">
          <Card className="border-border bg-background shadow-none rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quotaError && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-sm text-amber-200">
                  {quotaError}
                </div>
              )}
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={handleSummarize}
                  disabled={aiDisabled}
                  title={quota?.remaining === 0 ? 'AI quota exhausted for this month' : undefined}
                >
                  {aiLoading === 'summary' ? <Spinner size="sm" className="mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  Summarize Note
                </Button>

                {summary && (
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-md text-sm text-foreground mt-2">
                    <h4 className="font-semibold mb-1">Summary:</h4>
                    {summary}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={handleExtractKeywords}
                  disabled={aiDisabled}
                  title={quota?.remaining === 0 ? 'AI quota exhausted for this month' : undefined}
                >
                  {aiLoading === 'keywords' ? <Spinner size="sm" className="mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  Extract Keywords
                </Button>

                {keywords && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {keywords.map((keyword, i) => (
                      <span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={handleGenerateEmbeddings}
                  disabled={aiDisabled}
                  title={quota?.remaining === 0 ? 'AI quota exhausted for this month' : undefined}
                >
                  {aiLoading === 'embeddings' ? <Spinner size="sm" className="mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  Generate Embeddings
                </Button>
                {embeddingsResult && (
                  <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground mt-2">
                    Embeddings ready ({embeddingsResult.dimension} dimensions)
                    {embeddingsResult.cached && ' (cached)'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
