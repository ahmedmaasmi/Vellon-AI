'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, type QuotaResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  ArrowLeft,
  Save,
  Trash2,
  Wand2,
  Sparkles,
  Pin,
  Heart,
  X,
  Mic,
  Volume2,
  Languages,
  RefreshCw,
  Radio,
  BookOpen,
  AlertCircle,
  Plus,
  CheckCircle2,
  Bell,
  ImagePlus,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import KeywordRichEditor from '@/components/KeywordRichEditor';
import WikipediaPreviewPanel from '@/components/WikipediaPreviewPanel';
import ChecklistEditor from '@/components/ChecklistEditor';
import { AuthenticatedNoteImage } from '@/components/AuthenticatedNoteImage';
import { getTagPillClass, getTagPillStyle } from '@/lib/tag-colors';
import { NOTE_COLOR_OPTIONS, noteColorSwatchTw, resolveNoteColorKey, type NoteColorId } from '@/lib/note-colors';
import { formatVoiceDuration, isVoiceMemo } from '@/lib/note-kind';
import type { ChecklistItemState, NoteImageMeta } from '@/types/note';

const DETAIL_WAVE_BARS = [16, 26, 12, 32, 18, 28, 10, 30, 20, 34, 14, 24];

function noteFetchErrorMessage(error: unknown): string {
  const err = error as { code?: string; message?: string };
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return "Couldn't connect to the server. Make sure the backend is running and that frontend/.env.local has NEXT_PUBLIC_API_URL pointing at the API port, then try again.";
  }
  return 'Something went wrong loading this note. Try again.';
}

function VoiceMemoDetailWaveform({ className }: { className?: string }) {
  return (
    <div className={`flex h-12 max-w-[200px] items-end gap-px ${className ?? ''}`} aria-hidden>
      {DETAIL_WAVE_BARS.map((h, i) => (
        <span
          key={i}
          className="w-0.5 shrink-0 rounded-full bg-secondary/50 dark:bg-secondary/45"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

interface TagItem {
  id: string;
  name: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  source?: string;
  updated_at: string;
  is_pinned?: boolean;
  is_favorite?: boolean;
  tags?: TagItem[];
  voice_audio_available?: boolean;
  voice_status?: string | null;
  voice_error?: string | null;
  transcript_language?: string | null;
  translated_text?: string | null;
  voice_duration_seconds?: number | null;
  sts_audio_available?: boolean;
  color?: string | null;
  note_type?: string;
  checklist_items?: ChecklistItemState[] | null;
  reminder_at?: string | null;
  images?: NoteImageMeta[] | null;
}

interface NoteFormValues {
  title: string;
  content: string;
}

type SidebarTab = 'insights' | 'voice' | 'lookup';

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<'summary' | 'keywords' | 'embeddings' | 'describe' | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [voiceDescription, setVoiceDescription] = useState<string | null>(null);
  const [noteSource, setNoteSource] = useState<string>('web');
  const [keywords, setKeywords] = useState<string[] | null>(null);
  const [embeddingsResult, setEmbeddingsResult] = useState<{ dimension: number; cached: boolean } | null>(null);
  const [quota, setQuota] = useState<QuotaResponse | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [noteTags, setNoteTags] = useState<TagItem[]>([]);
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const [voiceAudioAvailable, setVoiceAudioAvailable] = useState(false);
  const [stsAudioAvailable, setStsAudioAvailable] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [transcriptLanguage, setTranscriptLanguage] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
  const [stsAudioUrl, setStsAudioUrl] = useState<string | null>(null);
  const [translateLang, setTranslateLang] = useState('Spanish');
  const [voiceBusy, setVoiceBusy] = useState<string | null>(null);
  const [voiceDurationSeconds, setVoiceDurationSeconds] = useState<number | null>(null);
  const [noteType, setNoteType] = useState<'text' | 'checklist'>('text');
  const [checklistItems, setChecklistItems] = useState<ChecklistItemState[]>([
    { text: '', checked: false, order: 0 },
  ]);
  const [noteImages, setNoteImages] = useState<NoteImageMeta[]>([]);
  const [noteColor, setNoteColor] = useState<string | null>(null);
  const [reminderInput, setReminderInput] = useState('');
  const skipChecklistSaveRef = useRef(true);

  const { register, handleSubmit, reset, watch, setValue, getValues, formState } = useForm<NoteFormValues>();
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const [wikiKeyword, setWikiKeyword] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('insights');

  const handleKeywordClick = useCallback((keyword: string) => {
    setWikiKeyword(keyword);
    setSidebarTab('lookup');
  }, []);

  useEffect(() => {
    if (wikiKeyword === null && sidebarTab === 'lookup') {
      setSidebarTab('insights');
    }
  }, [wikiKeyword, sidebarTab]);

  const watchedTitle = watch('title');
  const watchedContent = watch('content');

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formState.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [formState.isDirty]);

  useEffect(() => {
    if (!noteId || isLoading) return;
    if (noteType === 'checklist') return;
    if (!formState.isDirty) return;
    const timer = window.setTimeout(async () => {
      setAutoSaveState('saving');
      const vals = getValues();
      try {
        await api.put(`/api/v1/notes/${noteId}`, { title: vals.title, content: vals.content });
        reset(vals);
        setAutoSaveState('saved');
        window.dispatchEvent(new Event('dashboard:refresh-notes'));
        window.setTimeout(() => setAutoSaveState('idle'), 1600);
      } catch {
        setAutoSaveState('error');
        toast.error('Auto-save failed');
      }
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [watchedTitle, watchedContent, formState.isDirty, noteId, isLoading, getValues, reset, noteType]);

  useEffect(() => {
    if (!noteId || isLoading || noteType !== 'checklist') return;
    if (skipChecklistSaveRef.current) {
      skipChecklistSaveRef.current = false;
      return;
    }
    const timer = window.setTimeout(async () => {
      setAutoSaveState('saving');
      try {
        const items = checklistItems
          .filter((i) => i.text.trim())
          .map((i, order) => ({
            text: i.text.trim(),
            checked: i.checked,
            order,
          }));
        await api.put(`/api/v1/notes/${noteId}`, {
          title: getValues('title'),
          content: '',
          checklist_items: items,
        });
        setAutoSaveState('saved');
        window.dispatchEvent(new Event('dashboard:refresh-notes'));
        window.setTimeout(() => setAutoSaveState('idle'), 1600);
      } catch {
        setAutoSaveState('error');
        toast.error('Auto-save failed');
      }
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [checklistItems, noteId, isLoading, noteType, getValues]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await api.get<TagItem[]>('/api/v1/tags');
      setAllTags(res.data);
    } catch {
      setAllTags([]);
    }
  }, []);

  const applyNoteFromApi = useCallback(
    (note: Note) => {
      reset({
        title: note.title,
        content: note.content,
      });
      setIsPinned(!!note.is_pinned);
      setIsFavorite(!!note.is_favorite);
      setNoteTags(note.tags ?? []);
      setNoteSource(note.source ?? 'web');
      setVoiceAudioAvailable(!!note.voice_audio_available);
      setStsAudioAvailable(!!note.sts_audio_available);
      setVoiceStatus(note.voice_status ?? null);
      setVoiceError(note.voice_error ?? null);
      setTranscriptLanguage(note.transcript_language ?? null);
      setTranslatedText(note.translated_text ?? null);
      setVoiceDurationSeconds(
        note.voice_duration_seconds != null ? note.voice_duration_seconds : null
      );
      setNoteType(note.note_type === 'checklist' ? 'checklist' : 'text');
      setChecklistItems(
        note.checklist_items?.length
          ? note.checklist_items.map((it, i) => ({
              text: it.text,
              checked: it.checked,
              order: it.order ?? i,
            }))
          : [{ text: '', checked: false, order: 0 }]
      );
      setNoteImages(note.images ?? []);
      setNoteColor(note.color ?? null);
      setReminderInput(note.reminder_at ? new Date(note.reminder_at).toISOString().slice(0, 16) : '');
      skipChecklistSaveRef.current = true;
    },
    [reset]
  );

  const patchKeepField = async (patch: Record<string, unknown>) => {
    try {
      await api.put(`/api/v1/notes/${noteId}`, patch);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch {
      toast.error('Could not update note');
    }
  };

  const setKeepColor = (c: NoteColorId) => {
    const v = c === 'default' ? null : c;
    setNoteColor(v);
    void patchKeepField({ color: v });
  };

  const onReminderInputChange = (v: string) => {
    setReminderInput(v);
    if (!v) {
      void patchKeepField({ reminder_at: null });
      return;
    }
    void patchKeepField({ reminder_at: new Date(v).toISOString() });
  };

  const uploadDetailImage = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await api.post<Note>(`/api/v1/notes/${noteId}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNoteImages(r.data.images ?? []);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      toast.success('Image added');
    } catch {
      toast.error('Upload failed');
    }
  };

  useEffect(() => {
    if (!noteId) return;

    setIsLoading(true);
    setLoadError(null);
    let cancelled = false;

    const fetchNote = async () => {
      try {
        const response = await api.get<Note>(`/api/v1/notes/${noteId}`);
        if (!cancelled) {
          applyNoteFromApi(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch note:', error);
        if (!cancelled) {
          setLoadError(noteFetchErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    const fetchQuota = async () => {
      try {
        const res = await api.get<QuotaResponse>('/api/v1/usage/quota');
        if (!cancelled) setQuota(res.data);
      } catch {
        if (!cancelled) setQuota(null);
      }
    };

    void fetchNote();
    void fetchQuota();
    void fetchTags();

    return () => {
      cancelled = true;
    };
  }, [noteId, retryNonce, fetchTags, applyNoteFromApi]);

  useEffect(() => {
    let cancelled = false;
    let origBlobUrl: string | null = null;
    let stsBlobUrl: string | null = null;

    setOriginalAudioUrl(null);
    setStsAudioUrl(null);

    (async () => {
      try {
        if (voiceAudioAvailable) {
          const r = await api.get(`/api/v1/notes/${noteId}/audio`, { responseType: 'blob' });
          if (!cancelled) {
            origBlobUrl = URL.createObjectURL(r.data);
            setOriginalAudioUrl(origBlobUrl);
          }
        }
        if (stsAudioAvailable) {
          const r2 = await api.get(`/api/v1/notes/${noteId}/audio/sts`, { responseType: 'blob' });
          if (!cancelled) {
            stsBlobUrl = URL.createObjectURL(r2.data);
            setStsAudioUrl(stsBlobUrl);
          }
        }
      } catch {
        /* optional preview; ignore */
      }
    })();

    return () => {
      cancelled = true;
      if (origBlobUrl) URL.revokeObjectURL(origBlobUrl);
      if (stsBlobUrl) URL.revokeObjectURL(stsBlobUrl);
    };
  }, [noteId, voiceAudioAvailable, stsAudioAvailable]);

  const attachTag = async (tagId: string) => {
    try {
      await api.post(`/api/v1/notes/${noteId}/tags/${tagId}`);
      const res = await api.get<Note>(`/api/v1/notes/${noteId}`);
      applyNoteFromApi(res.data);
      setTagDropdownOpen(false);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch {
      // ignore
    }
  };

  const detachTag = async (tagId: string) => {
    try {
      await api.delete(`/api/v1/notes/${noteId}/tags/${tagId}`);
      const res = await api.get<Note>(`/api/v1/notes/${noteId}`);
      applyNoteFromApi(res.data);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch {
      // ignore
    }
  };

  const availableToAdd = allTags.filter((t) => !noteTags.some((nt) => nt.id === t.id));

  const onSubmit = async (data: NoteFormValues) => {
    setIsSaving(true);
    try {
      if (noteType === 'checklist') {
        const items = checklistItems
          .filter((i) => i.text.trim())
          .map((i, order) => ({
            text: i.text.trim(),
            checked: i.checked,
            order,
          }));
        await api.put(`/api/v1/notes/${noteId}`, {
          title: data.title,
          content: '',
          checklist_items: items,
        });
      } else {
        await api.put(`/api/v1/notes/${noteId}`, data);
      }
      reset(data);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      toast.success('Saved');
    } catch (error) {
      console.error('Failed to save note:', error);
      toast.error('Could not save note');
    } finally {
      setIsSaving(false);
    }
  };

  const noteTitle = watch('title')?.trim() || 'Untitled Note';
  const handleDelete = async () => {
    if (!confirm(`Delete "${noteTitle}"? You can restore it later from Recently Deleted.`)) return;
    try {
      await api.delete(`/api/v1/notes/${noteId}`);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      toast.success('Moved to trash');
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('Could not delete note');
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

  /** Treat as invalid if model returned a disclaimer instead of a real summary */
  const isInvalidSummary = (text: string) => {
    const lower = text.toLowerCase();
    return (
      /training data|knowledge cutoff|october 2023|my knowledge|i don't have access|i cannot access|as of my/i.test(lower) ||
      text.trim().length < 10
    );
  };

  const handleSummarize = async () => {
    setQuotaError(null);
    setSummary(null);
    setAiLoading('summary');
    try {
      await handleSubmit(onSubmit)();
      const response = await api.get<{ summary: string }>(`/api/v1/notes/${noteId}/summary`);
      const raw = response.data.summary ?? '';
      if (isInvalidSummary(raw)) {
        setSummary(null);
        setQuotaError('Summary wasn\'t useful this time. Try rephrasing your note or add more detail, then run again.');
      } else {
        setSummary(raw);
      }
      const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota');
      setQuota(quotaRes.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 429) {
        setQuotaError(detail || 'Monthly AI credits used. You can still edit manually or try again next month.');
        const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota').catch(() => null);
        if (quotaRes?.data) setQuota(quotaRes.data);
      } else {
        setQuotaError('Couldn\'t create a summary. Save your note and try again.');
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
        setQuotaError(detail || 'Monthly AI credits used. You can still edit manually or try again next month.');
        const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota').catch(() => null);
        if (quotaRes?.data) setQuota(quotaRes.data);
      } else {
        setQuotaError('Couldn\'t find topics this time. Try shortening the note or removing very broad terms, then run again.');
      }
    } finally {
      setAiLoading(null);
    }
  };

  const handleDescribeVoiceMemo = async () => {
    setQuotaError(null);
    setVoiceDescription(null);
    setAiLoading('describe');
    try {
      await handleSubmit(onSubmit)();
      const response = await api.get<{ description: string }>(
        `/api/v1/notes/${noteId}/describe`
      );
      setVoiceDescription(response.data.description ?? '');
      const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota');
      setQuota(quotaRes.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 429) {
        setQuotaError(detail || 'Monthly AI credits used. You can still edit manually or try again next month.');
        const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota').catch(() => null);
        if (quotaRes?.data) setQuota(quotaRes.data);
      } else {
        setQuotaError('Couldn\'t describe this memo. Save your note and try again.');
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
        setQuotaError(detail || 'Monthly AI credits used. You can still edit manually or try again next month.');
        const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota').catch(() => null);
        if (quotaRes?.data) setQuota(quotaRes.data);
      } else {
        setQuotaError(detail || 'Couldn\'t prepare search data. Check that OpenRouter is configured and try again.');
      }
    } finally {
      setAiLoading(null);
    }
  };

  const voicePanelDisabled =
    (quota != null && quota.remaining === 0) || !!voiceBusy || !!aiLoading;

  const handleRetranscribe = async () => {
    setQuotaError(null);
    setVoiceBusy('retranscribe');
    try {
      const res = await api.post<Note>(`/api/v1/notes/${noteId}/retranscribe`);
      applyNoteFromApi(res.data);
      const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota');
      setQuota(quotaRes.data);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response
        ?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 429) {
        setQuotaError(detail || 'Monthly AI credits used.');
      } else {
        setQuotaError(typeof detail === 'string' ? detail : 'Re-transcription failed.');
      }
    } finally {
      setVoiceBusy(null);
    }
  };

  const handleTranslateNote = async () => {
    const lang = translateLang.trim();
    if (!lang) return;
    setQuotaError(null);
    setVoiceBusy('translate');
    try {
      const res = await api.post<Note>(`/api/v1/notes/${noteId}/translate`, {
        target_language: lang,
      });
      applyNoteFromApi(res.data);
      const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota');
      setQuota(quotaRes.data);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response
        ?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 429) {
        setQuotaError(detail || 'Monthly AI credits used.');
      } else {
        setQuotaError(typeof detail === 'string' ? detail : 'Translation failed.');
      }
    } finally {
      setVoiceBusy(null);
    }
  };

  const handleSpeechToSpeech = async () => {
    setQuotaError(null);
    setVoiceBusy('sts');
    try {
      const res = await api.post<Note>(`/api/v1/notes/${noteId}/speech-to-speech`, {});
      applyNoteFromApi(res.data);
      const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota');
      setQuota(quotaRes.data);
      window.dispatchEvent(new Event('dashboard:refresh-notes'));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response
        ?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 429) {
        setQuotaError(detail || 'Monthly AI credits used.');
      } else {
        setQuotaError(typeof detail === 'string' ? detail : 'Speech-to-speech failed.');
      }
    } finally {
      setVoiceBusy(null);
    }
  };

  const playTts = async (source: 'content' | 'translated' | 'custom', text?: string | null) => {
    setQuotaError(null);
    setVoiceBusy('tts');
    try {
      const res = await api.post(`/api/v1/notes/${noteId}/tts`, { source, text: text ?? null }, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const el = ttsAudioRef.current;
      if (el) {
        if (el.src.startsWith('blob:')) {
          URL.revokeObjectURL(el.src);
        }
        el.src = url;
        await el.play();
      } else {
        URL.revokeObjectURL(url);
      }
      const quotaRes = await api.get<QuotaResponse>('/api/v1/usage/quota');
      setQuota(quotaRes.data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response
        ?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 429) {
        setQuotaError(detail || 'Monthly AI credits used.');
      } else {
        setQuotaError(typeof detail === 'string' ? detail : 'Text-to-speech failed.');
      }
    } finally {
      setVoiceBusy(null);
    }
  };

  const aiDisabled = (quota != null && quota.remaining === 0) || !!aiLoading;
  const showVoiceTab = noteSource === 'voice' || voiceAudioAvailable;
  const voiceLayout = isVoiceMemo({
    source: noteSource,
    voice_audio_available: voiceAudioAvailable,
  });
  const voiceDurationLabel = formatVoiceDuration(voiceDurationSeconds);
  const quotaTitle =
    quota?.remaining === 0 ? 'Monthly AI credits used. You can still edit manually or try again next month.' : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[16rem] flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" aria-hidden />
        <p className="max-w-md text-sm text-muted-foreground">{loadError}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" onClick={() => setRetryNonce((n) => n + 1)}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
            Retry
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Back to notes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto w-full p-6 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 -mx-2 px-2 py-3 rounded-xl bg-card/95 backdrop-blur-md border border-border/50 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 gap-y-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 hover:bg-muted"
              onClick={() => router.push('/dashboard')}
              title="Back to notes"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Input
                {...register('title')}
                className="text-2xl font-semibold border-none px-0 focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/40 text-foreground h-auto py-1 min-w-0"
                placeholder="Untitled note"
                aria-label="Note title"
              />
              {voiceLayout && (
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary"
                  title="This note has a voice memo"
                >
                  <Mic className="h-3.5 w-3.5" />
                  Voice
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePin}
                title={isPinned ? 'Unpin note' : 'Pin note'}
                aria-pressed={isPinned}
                className="text-foreground"
              >
                <Pin className={`h-4 w-4 ${isPinned ? 'fill-current text-primary' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFavorite}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                aria-pressed={isFavorite}
                className="text-foreground"
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                title="Delete note"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <span className="hidden sm:inline text-xs text-muted-foreground tabular-nums min-w-[4.5rem] text-right" aria-live="polite">
                {autoSaveState === 'saving' && 'Saving…'}
                {autoSaveState === 'saved' && 'Saved'}
                {autoSaveState === 'error' && 'Save failed'}
              </span>
              <Button onClick={handleSubmit(onSubmit)} disabled={isSaving} className="ml-1 gap-2 shadow-card">
                {isSaving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 pl-1">
          {noteTags.map((t) => (
            <span
              key={t.id}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${getTagPillClass(t.id)}`}
              style={getTagPillStyle(t.id)}
            >
              {t.name}
              <button
                type="button"
                onClick={() => detachTag(t.id)}
                className="hover:bg-black/10 dark:hover:bg-white/20 rounded-full p-0.5"
                aria-label={`Remove tag ${t.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <div className="relative">
            <button
              type="button"
              onClick={() => setTagDropdownOpen((v) => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Add tag"
              aria-expanded={tagDropdownOpen}
              aria-haspopup="listbox"
            >
              <Plus className="h-4 w-4" />
            </button>
            {tagDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setTagDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-1 z-20 min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-elevated">
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

        {/* Color, reminder, images (Keep-style) */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/50 bg-muted/15 p-3">
          <span className="text-xs font-medium text-muted-foreground shrink-0">Color</span>
          <div className="flex flex-wrap gap-1">
            {NOTE_COLOR_OPTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.label}
                onClick={() => setKeepColor(c.id)}
                className={`h-6 w-6 rounded-full shrink-0 ${noteColorSwatchTw(c.id)} ${
                  resolveNoteColorKey(noteColor) === c.id ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' : ''
                }`}
              />
            ))}
          </div>
          <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bell className="h-3.5 w-3.5 shrink-0" />
            <span className="sr-only">Reminder</span>
            <input
              type="datetime-local"
              value={reminderInput}
              onChange={(e) => onReminderInputChange(e.target.value)}
              className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs"
            />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <ImagePlus className="h-3.5 w-3.5" />
            Add image
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadDetailImage(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {noteImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {noteImages.map((im) => (
              <div
                key={im.id}
                className="h-24 w-24 overflow-hidden rounded-lg border border-border/60"
              >
                <AuthenticatedNoteImage
                  noteId={noteId}
                  imageId={im.id}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-5">
            {voiceLayout && (
              <section
                className="rounded-2xl border border-border/70 bg-muted/35 p-5 shadow-card dark:bg-muted/25"
                aria-labelledby="original-recording-heading"
              >
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2
                      id="original-recording-heading"
                      className="text-sm font-semibold text-foreground flex items-center gap-2"
                    >
                      <Radio className="h-4 w-4 shrink-0 text-secondary" />
                      Original recording
                    </h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The audio you captured. Your editable transcript is below.
                    </p>
                    {voiceDurationLabel ? (
                      <p className="pt-1 font-mono text-sm tabular-nums text-muted-foreground">
                        {voiceDurationLabel}
                      </p>
                    ) : null}
                  </div>
                  <VoiceMemoDetailWaveform className="shrink-0 opacity-90" />
                </div>
                {originalAudioUrl ? (
                  <audio
                    src={originalAudioUrl}
                    controls
                    className="mt-4 h-10 w-full max-w-lg"
                  />
                ) : voiceAudioAvailable ? (
                  <p className="mt-4 text-sm text-muted-foreground">Loading audio…</p>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Recording will appear here once the file is available.
                  </p>
                )}
              </section>
            )}

            <div
              className={`flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/40 p-6 shadow-card transition-shadow focus-within:shadow-card-hover focus-within:ring-2 focus-within:ring-ring/25 ${
                voiceLayout ? 'border-border/70 bg-card/50' : ''
              }`}
            >
              {voiceLayout ? (
                <>
                  <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
                    <h2 className="text-xs font-medium tracking-wide text-muted-foreground">
                      Transcript
                    </h2>
                    <span className="text-[10px] text-muted-foreground/85">
                      From speech-to-text — edit freely
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" aria-hidden />
              )}
              {noteType === 'checklist' && !voiceLayout ? (
                <ChecklistEditor items={checklistItems} onChange={setChecklistItems} />
              ) : (
                <KeywordRichEditor
                  value={watch('content') ?? ''}
                  onChangeText={(text) => setValue('content', text, { shouldDirty: true })}
                  onKeywordClick={handleKeywordClick}
                  placeholder={
                    voiceLayout
                      ? 'Transcript appears here — edit like any note…'
                      : 'Start typing your thoughts...'
                  }
                  className="w-full flex-1 min-h-[60vh] p-0 border-none bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-0 resize-none text-lg leading-relaxed keyword-editor"
                />
              )}
            </div>
          </div>

          {/* Sidebar panel */}
          <div className="flex flex-col min-h-0">
            <audio ref={ttsAudioRef} className="sr-only" aria-hidden title="TTS playback" />

            <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden flex flex-col max-h-[min(85vh,900px)] lg:max-h-none lg:sticky lg:top-24">
              <div
                className="flex border-b border-border/60 bg-muted/30 px-1 pt-1 gap-0.5"
                role="tablist"
                aria-label="Note assistant"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={sidebarTab === 'insights'}
                  data-active={sidebarTab === 'insights'}
                  className="note-sidebar-tab flex-1 min-w-0 px-2 py-2.5 text-xs font-medium text-muted-foreground rounded-t-md hover:bg-muted/50 hover:text-foreground"
                  onClick={() => setSidebarTab('insights')}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    Insights
                  </span>
                </button>
                {showVoiceTab && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={sidebarTab === 'voice'}
                    data-active={sidebarTab === 'voice'}
                    className="note-sidebar-tab flex-1 min-w-0 px-2 py-2.5 text-xs font-medium text-muted-foreground rounded-t-md hover:bg-muted/50 hover:text-foreground"
                    onClick={() => setSidebarTab('voice')}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 shrink-0" />
                      Voice
                    </span>
                  </button>
                )}
                {wikiKeyword !== null && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={sidebarTab === 'lookup'}
                    data-active={sidebarTab === 'lookup'}
                    className="note-sidebar-tab flex-1 min-w-0 px-2 py-2.5 text-xs font-medium text-muted-foreground rounded-t-md hover:bg-muted/50 hover:text-foreground"
                    onClick={() => setSidebarTab('lookup')}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      Lookup
                    </span>
                  </button>
                )}
              </div>

              <div className="p-4 overflow-y-auto flex-1 min-h-[280px] space-y-4">
                {quotaError && (
                  <div
                    className="flex gap-2 rounded-lg border border-amber-600/25 bg-amber-500/[0.08] px-3 py-2.5 text-sm text-amber-950 dark:text-amber-100"
                    role="alert"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-300" />
                    <p className="leading-snug">{quotaError}</p>
                  </div>
                )}

                {sidebarTab === 'insights' && (
                  <div className="space-y-4" role="tabpanel">
                    {/* Key topics */}
                    <div className="rounded-xl border border-border/70 bg-background/80 p-3 shadow-sm space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Wand2 className="h-4 w-4 text-primary shrink-0" />
                            Key topics
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Surface terms to explore in Lookup or use as tags.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="shrink-0"
                          onClick={handleExtractKeywords}
                          disabled={aiDisabled}
                          title={quotaTitle}
                        >
                          {aiLoading === 'keywords' ? <Spinner size="sm" /> : 'Run'}
                        </Button>
                      </div>
                      {keywords && (
                        <div className="animate-fade-slide-in space-y-2 pt-1 border-t border-border/50">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                            Top topics
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {keywords.map((keyword, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleKeywordClick(keyword)}
                                className="ai-topic-pill px-2.5 py-1.5 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25"
                              >
                                {keyword}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Summary */}
                    <div className="rounded-xl border border-border/70 bg-background/80 p-3 shadow-sm space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary shrink-0" />
                            Summary
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            A short recap of your note.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="shrink-0"
                          onClick={handleSummarize}
                          disabled={aiDisabled}
                          title={quotaTitle}
                        >
                          {aiLoading === 'summary' ? <Spinner size="sm" /> : 'Run'}
                        </Button>
                      </div>
                      {summary && (
                        <blockquote className="animate-fade-slide-in mt-2 border-l-[3px] border-secondary pl-3 py-1 text-sm text-foreground leading-relaxed bg-accent/30 rounded-r-md">
                          {summary}
                        </blockquote>
                      )}
                    </div>

                    {voiceLayout && (
                      <div className="rounded-xl border border-border/70 bg-background/80 p-3 shadow-sm space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <Mic className="h-4 w-4 text-primary shrink-0" />
                              What was said
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              From transcript only — not raw audio.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="shrink-0"
                            onClick={handleDescribeVoiceMemo}
                            disabled={aiDisabled}
                            title={quotaTitle}
                          >
                            {aiLoading === 'describe' ? <Spinner size="sm" /> : 'Run'}
                          </Button>
                        </div>
                        {voiceDescription && (
                          <div className="animate-fade-slide-in mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                            {voiceDescription}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Embeddings */}
                    <div className="rounded-xl border border-border/70 bg-background/80 p-3 shadow-sm space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Wand2 className="h-4 w-4 text-primary shrink-0" />
                            Semantic search
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Prepare vectors for related notes and search.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="shrink-0"
                          onClick={handleGenerateEmbeddings}
                          disabled={aiDisabled}
                          title={quotaTitle}
                        >
                          {aiLoading === 'embeddings' ? <Spinner size="sm" /> : 'Run'}
                        </Button>
                      </div>
                      {embeddingsResult && (
                        <div className="animate-fade-slide-in flex items-center gap-2 flex-wrap mt-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/12 text-foreground border border-secondary/30 px-2.5 py-1 text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 text-secondary shrink-0" />
                            Ready · {embeddingsResult.dimension}d
                            {embeddingsResult.cached ? ' · cached' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {sidebarTab === 'voice' && showVoiceTab && (
                  <div className="space-y-5 text-sm" role="tabpanel">
                    {voiceStatus && (
                      <p className="text-xs text-muted-foreground">
                        Status:{' '}
                        <span className="font-medium text-foreground">{voiceStatus}</span>
                        {transcriptLanguage ? <span className="ml-1">({transcriptLanguage})</span> : null}
                      </p>
                    )}
                    {voiceError && (
                      <div className="rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive px-2 py-2">
                        {voiceError}
                      </div>
                    )}

                    <section className="space-y-2" aria-labelledby="voice-rec-label">
                      <h3 id="voice-rec-label" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Recording
                      </h3>
                      {originalAudioUrl && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Original</p>
                          <audio src={originalAudioUrl} controls className="w-full h-9" />
                        </div>
                      )}
                      {voiceAudioAvailable && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                          onClick={handleRetranscribe}
                          disabled={voicePanelDisabled}
                        >
                          {voiceBusy === 'retranscribe' ? <Spinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
                          Re-transcribe
                        </Button>
                      )}
                    </section>

                    <section className="space-y-2 pt-2 border-t border-border/60" aria-labelledby="voice-trans-label">
                      <h3 id="voice-trans-label" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                        <Languages className="h-3.5 w-3.5" />
                        Translate
                      </h3>
                      <p className="text-[11px] text-muted-foreground">OpenRouter · transcript to another language</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={translateLang}
                          onChange={(e) => setTranslateLang(e.target.value)}
                          placeholder="e.g. Spanish, Japanese"
                          className="text-sm flex-1"
                        />
                        <Button
                          size="sm"
                          className="sm:w-auto w-full shrink-0"
                          onClick={handleTranslateNote}
                          disabled={voicePanelDisabled}
                        >
                          {voiceBusy === 'translate' ? <Spinner size="sm" /> : 'Translate'}
                        </Button>
                      </div>
                      {translatedText ? (
                        <div className="max-h-36 overflow-y-auto rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs whitespace-pre-wrap leading-relaxed">
                          {translatedText}
                        </div>
                      ) : null}
                    </section>

                    <section className="space-y-2 pt-2 border-t border-border/60" aria-labelledby="voice-tts-label">
                      <h3 id="voice-tts-label" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                        <Volume2 className="h-3.5 w-3.5" />
                        Text to speech
                      </h3>
                      <p className="text-[11px] text-muted-foreground">ElevenLabs</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 min-w-[7rem]"
                          onClick={() => playTts('content')}
                          disabled={voicePanelDisabled}
                        >
                          {voiceBusy === 'tts' ? <Spinner size="sm" className="mr-1" /> : null}
                          Note
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 min-w-[7rem]"
                          onClick={() => playTts('translated')}
                          disabled={voicePanelDisabled || !translatedText}
                        >
                          Translation
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 min-w-[7rem]"
                          onClick={() => playTts('custom', summary)}
                          disabled={voicePanelDisabled || !summary}
                        >
                          Summary
                        </Button>
                      </div>
                    </section>

                    {voiceAudioAvailable && (
                      <section className="space-y-2 pt-2 border-t border-border/60" aria-labelledby="voice-sts-label">
                        <h3 id="voice-sts-label" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Speech to speech
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Transform your recording with the default ElevenLabs voice.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                          onClick={handleSpeechToSpeech}
                          disabled={voicePanelDisabled}
                        >
                          {voiceBusy === 'sts' ? <Spinner size="sm" /> : <Mic className="h-4 w-4" />}
                          Run speech-to-speech
                        </Button>
                        {stsAudioUrl && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Transformed</p>
                            <audio src={stsAudioUrl} controls className="w-full h-9" />
                          </div>
                        )}
                      </section>
                    )}
                  </div>
                )}

                {sidebarTab === 'lookup' && wikiKeyword !== null && (
                  <div role="tabpanel" className="min-h-[200px]">
                    <WikipediaPreviewPanel
                      keyword={wikiKeyword}
                      onClose={() => setWikiKeyword(null)}
                      className="max-h-[min(55vh,420px)] border-0 shadow-none rounded-xl"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
