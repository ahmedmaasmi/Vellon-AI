/**
 * Classify notes for UI: voice memos vs written notes.
 * Matches API fields from NoteResponse.
 */

export function isVoiceMemo(note: {
  source?: string | null;
  voice_audio_available?: boolean | null;
}): boolean {
  return note.source === 'voice' || !!note.voice_audio_available;
}

export function formatVoiceDuration(seconds: number | null | undefined): string | null {
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) return null;
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
