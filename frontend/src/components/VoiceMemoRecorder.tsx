'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, X, Loader2, Square, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { LiveWaveform } from '@/components/ui/live-waveform';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface VoiceMemoRecorderProps {
  onClose: () => void;
}

const SUPPORTED_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm'] as const;

function getMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  for (const type of SUPPORTED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'audio/webm';
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((ev: Event) => void) | null;
  onend: (() => void) | null;
};

/** Minimal shape for Web Speech API result events (DOM lib varies by TS version). */
type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function VoiceMemoRecorder({ onClose }: VoiceMemoRecorderProps) {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechWarning, setSpeechWarning] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const transcriptRef = useRef('');
  const latestInterimRef = useRef('');
  const acceptMicStreamRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const mimeTypeRef = useRef(getMimeType());
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const revokeAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioUrl(null);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (mediaRecorderRef.current?.state !== 'inactive') {
        try {
          mediaRecorderRef.current?.stop();
        } catch {
          /* ignore */
        }
      }
      revokeAudioUrl();
    };
  }, [revokeAudioUrl]);

  const startSpeechRecognition = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setSpeechWarning(
        'Speech-to-text is not available in this browser. Your memo will be saved without a transcript for AI.'
      );
      return;
    }
    setSpeechWarning(null);
    transcriptRef.current = '';
    latestInterimRef.current = '';
    try {
      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang =
        typeof navigator !== 'undefined' && navigator.language
          ? navigator.language
          : 'en-US';

      recognition.onresult = (event: SpeechRecognitionResultEvent) => {
        let interim = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const piece = result[0]?.transcript ?? '';
          if (result.isFinal) {
            finalText += piece;
          } else {
            interim += piece;
          }
        }
        if (finalText) {
          transcriptRef.current = `${transcriptRef.current} ${finalText}`.trim();
          latestInterimRef.current = '';
        } else if (interim) {
          latestInterimRef.current = interim;
        }
      };

      recognition.onerror = () => {
        // Non-fatal: user can still save audio
      };

      recognition.onend = () => {
        // If user is still "recording" and browser ended session, could restart — skip for simplicity
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setSpeechWarning(
        'Could not start speech recognition. Your memo can still be recorded.'
      );
    }
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    if (latestInterimRef.current.trim()) {
      transcriptRef.current = `${transcriptRef.current} ${latestInterimRef.current}`.trim();
      latestInterimRef.current = '';
    }
    const r = recognitionRef.current;
    recognitionRef.current = null;
    if (r) {
      try {
        r.stop();
      } catch {
        try {
          r.abort();
        } catch {
          /* ignore */
        }
      }
    }
  }, []);

  const handleStreamReady = useCallback(
    (stream: MediaStream) => {
      if (!acceptMicStreamRef.current) return;
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        return;
      }

      audioChunksRef.current = [];
      mimeTypeRef.current = getMimeType();

      try {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeTypeRef.current,
        });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e: BlobEvent) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, {
            type: mimeTypeRef.current,
          });
          recordedBlobRef.current = blob;
          audioChunksRef.current = [];
          mediaRecorderRef.current = null;

          revokeAudioUrl();
          const url = URL.createObjectURL(blob);
          audioUrlRef.current = url;
          setAudioUrl(url);
          setHasPreview(true);
          acceptMicStreamRef.current = false;
          setIsRecording(false);
        };

        mediaRecorder.start(250);
        startSpeechRecognition();
      } catch (e) {
        console.error(e);
        setError('Could not start audio recording.');
        acceptMicStreamRef.current = false;
        setIsRecording(false);
      }
    },
    [revokeAudioUrl, startSpeechRecognition]
  );

  const handleStart = useCallback(() => {
    setError(null);
    setSpeechWarning(null);
    transcriptRef.current = '';
    latestInterimRef.current = '';
    acceptMicStreamRef.current = true;
    revokeAudioUrl();
    setHasPreview(false);
    setIsRecording(true);
  }, [revokeAudioUrl]);

  const handleStopRecording = useCallback(() => {
    stopSpeechRecognition();

    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.stop();
    } else {
      acceptMicStreamRef.current = false;
      setIsRecording(false);
      setError('Recording did not start. Check microphone permissions.');
    }
  }, [stopSpeechRecognition]);

  const handleCancelRecording = useCallback(() => {
    acceptMicStreamRef.current = false;
    stopSpeechRecognition();
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.onstop = () => {
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
        setIsRecording(false);
      };
      mr.stop();
    } else {
      setIsRecording(false);
    }
    transcriptRef.current = '';
    latestInterimRef.current = '';
    revokeAudioUrl();
    setHasPreview(false);
    setError(null);
    setSpeechWarning(null);
  }, [stopSpeechRecognition, revokeAudioUrl]);

  const handleDiscardPreview = useCallback(() => {
    revokeAudioUrl();
    recordedBlobRef.current = null;
    setHasPreview(false);
    transcriptRef.current = '';
    setSpeechWarning(null);
    setError(null);
  }, [revokeAudioUrl]);

  const handleSave = useCallback(async () => {
    const blob = recordedBlobRef.current;
    if (!blob || blob.size === 0) {
      setError('No recording to save.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const now = new Date();
      const title = `Voice Memo - ${now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`;

      const filename = 'recording.webm';
      const formData = new FormData();
      formData.append('audio', blob, filename);
      formData.append('title', title);

      const response = await api.post('/api/v1/notes/voice', formData);

      window.dispatchEvent(new Event('dashboard:refresh-notes'));
      toast.success('Voice memo saved');
      setIsSaving(false);
      router.push(`/dashboard/notes/${response.data.id}`);
      recordedBlobRef.current = null;
      revokeAudioUrl();
      onClose();
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number; data?: { detail?: string } } })
        .response?.status;
      const detail = (e as { response?: { data?: { detail?: string } } }).response?.data
        ?.detail;
      if (status === 503) {
        const msg =
          typeof detail === 'string'
            ? detail
            : 'Voice transcription is not configured on the server (ElevenLabs).';
        setError(msg);
        toast.error(msg);
      } else if (status === 413) {
        setError('Recording is too large to upload.');
        toast.error('Recording is too large to upload.');
      } else if (status === 429) {
        setError('AI usage limit reached for this month.');
        toast.error('AI usage limit reached for this month.');
      } else {
        setError('Failed to save voice memo. Please try again.');
        toast.error(typeof detail === 'string' ? detail : 'Failed to save voice memo.');
      }
      setIsSaving(false);
    }
  }, [router, onClose, revokeAudioUrl]);

  const handleWaveformError = useCallback((err: Error) => {
    console.error(err);
    setIsRecording(false);
    setError('Microphone error. Please check permissions.');
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (
          e.target === e.currentTarget &&
          !isRecording &&
          !isSaving &&
          !hasPreview
        ) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-lg mx-4 rounded-3xl bg-card border border-border p-8 shadow-2xl"
      >
        <button
          onClick={() =>
            !isRecording && !isSaving && !hasPreview && onClose()
          }
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
          disabled={isRecording || isSaving || hasPreview}
          aria-label="Close"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Mic className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Voice Memo</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isRecording
              ? 'Recording… speak now'
              : isSaving
                ? 'Saving your voice memo…'
                : hasPreview
                  ? 'Review your recording, then save'
                  : 'Press record to start'}
          </p>
        </div>

        <div className="mb-6 h-16">
          <LiveWaveform
            active={isRecording}
            processing={isSaving}
            barWidth={4}
            barGap={2}
            barRadius={4}
            barColor="#71717a"
            fadeEdges
            fadeWidth={32}
            sensitivity={0.9}
            smoothingTimeConstant={0.85}
            className="w-full"
            height={64}
            onStreamReady={handleStreamReady}
            onError={handleWaveformError}
          />
        </div>

        {hasPreview && audioUrl && !isRecording && (
          <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground mb-2 text-center">
              Playback
            </p>
            <audio
              src={audioUrl}
              controls
              className="w-full h-10"
              aria-label="Recorded voice memo playback"
            />
          </div>
        )}

        {speechWarning && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-700 dark:text-amber-400 text-center">
            {speechWarning}
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive text-center">
            {error}
          </div>
        )}

        {isSaving ? (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Creating note…</span>
            </div>
          </div>
        ) : hasPreview ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full gap-2"
              onClick={handleDiscardPreview}
            >
              Record again
            </Button>
            <Button
              size="lg"
              className="rounded-full gap-2"
              onClick={handleSave}
            >
              <Save className="h-5 w-5" />
              Save memo
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            {!isRecording ? (
              <Button
                size="lg"
                className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg p-0"
                onClick={handleStart}
                aria-label="Start recording"
              >
                <Mic className="h-7 w-7" />
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 w-12 rounded-full p-0"
                  onClick={handleCancelRecording}
                  aria-label="Cancel recording"
                >
                  <X className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="h-16 w-16 rounded-full p-0 shadow-lg"
                  onClick={handleStopRecording}
                  aria-label="Stop recording"
                >
                  <Square className="h-6 w-6 fill-current" />
                </Button>
              </>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
