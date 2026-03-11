const TAG_COLOR_STORAGE_KEY = 'tag_color_index';
const TAG_RECENT_COLORS_KEY = 'tag_recent_colors';
const TAG_CUSTOM_COLORS_KEY = 'tag_custom_colors';
const MAX_RECENT = 6;
const MAX_CUSTOM = 12;

/** Stable index from tag id (or name) so the same tag always gets the same color. */
export function tagToPaletteIndex(tagIdOrName: string): number {
  let h = 0;
  for (let i = 0; i < tagIdOrName.length; i++) {
    h = (h * 31 + tagIdOrName.charCodeAt(i)) >>> 0;
  }
  return h % TAG_PILL_CLASSES.length;
}

export type TagColorValue = number | string; // 0-5 or hex "#rrggbb"

function getStoredColorRaw(tagId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(`${TAG_COLOR_STORAGE_KEY}_${tagId}`);
  } catch {
    return null;
  }
}

export type ResolvedTagColor =
  | { type: 'palette'; index: number }
  | { type: 'custom'; hex: string };

/** Resolve stored value to palette index or custom hex. Safe for SSR. */
export function getColorForTag(tagId: string): ResolvedTagColor {
  const raw = getStoredColorRaw(tagId);
  if (raw === null) return { type: 'palette', index: tagToPaletteIndex(tagId) };
  const idx = parseInt(raw, 10);
  if (Number.isInteger(idx) && idx >= 0 && idx < TAG_PILL_CLASSES.length) {
    return { type: 'palette', index: idx };
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return { type: 'custom', hex: raw };
  return { type: 'palette', index: tagToPaletteIndex(tagId) };
}

/** Get color index for a tag (palette only; custom returns 0 for class fallback). */
function getColorIndexForTag(tagId: string): number {
  const resolved = getColorForTag(tagId);
  return resolved.type === 'palette' ? resolved.index : 0;
}

/** Persist chosen color for a tag (palette index 0-5 or hex). Client-only. */
export function setTagColor(tagId: string, value: TagColorValue): void {
  if (typeof window === 'undefined') return;
  try {
    const str = typeof value === 'number'
      ? String(Math.max(0, Math.min(value, TAG_PILL_CLASSES.length - 1)))
      : (value.startsWith('#') ? value : `#${value}`);
    if (str.startsWith('#')) addCustomColor(str);
    localStorage.setItem(`${TAG_COLOR_STORAGE_KEY}_${tagId}`, str);
  } catch {
    // ignore
  }
}

/** @deprecated Use setTagColor(tagId, index) instead. */
export function setTagColorIndex(tagId: string, index: number): void {
  setTagColor(tagId, index);
}

/** Recent colors (palette indices as string or hex). Most recent first. */
export function getRecentColors(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TAG_RECENT_COLORS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function addRecentColor(value: string): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized = value.startsWith('#') ? value : String(value);
    const prev = getRecentColors().filter((v) => v !== normalized);
    const next = [normalized, ...prev].slice(0, MAX_RECENT);
    localStorage.setItem(TAG_RECENT_COLORS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

/** Custom hex colors (user-created). */
export function getCustomColors(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TAG_CUSTOM_COLORS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is string => typeof c === 'string' && /^#[0-9A-Fa-f]{6}$/.test(c)).slice(0, MAX_CUSTOM);
  } catch {
    return [];
  }
}

export function addCustomColor(hex: string): void {
  if (typeof window === 'undefined') return;
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  if (!/^#[0-9A-Fa-f]{6}$/.test(normalized)) return;
  try {
    const prev = getCustomColors().filter((c) => c.toLowerCase() !== normalized.toLowerCase());
    const next = [normalized, ...prev].slice(0, MAX_CUSTOM);
    localStorage.setItem(TAG_CUSTOM_COLORS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

/** Luminance (0–1); used to pick contrasting text color. */
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const [sr, sg, sb] = [r, g, b].map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * sr + 0.7152 * sg + 0.0722 * sb;
}

/**
 * Tailwind classes for tag pills: background + text for contrast.
 * Same tag id always maps to the same color across the app.
 */
export const TAG_PILL_CLASSES = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
  'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200',
] as const;

/** Dot/marker background for sidebar (solid, smaller palette). */
export const TAG_DOT_CLASSES = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-slate-500',
] as const;

export function getTagPillClass(tagId: string): string {
  const resolved = getColorForTag(tagId);
  if (resolved.type === 'palette') return TAG_PILL_CLASSES[resolved.index];
  return ''; // use with getTagPillStyle
}

/** Inline style for tag pill when using custom color. */
export function getTagPillStyle(tagId: string): { backgroundColor?: string; color?: string } {
  const resolved = getColorForTag(tagId);
  if (resolved.type !== 'custom') return {};
  const textColor = luminance(resolved.hex) < 0.4 ? '#fff' : '#1f2937';
  return { backgroundColor: resolved.hex, color: textColor };
}

export function getTagDotClass(tagId: string): string {
  const resolved = getColorForTag(tagId);
  return resolved.type === 'palette' ? TAG_DOT_CLASSES[resolved.index] : '';
}

/** Inline style for tag dot when using custom color. */
export function getTagDotStyle(tagId: string): { backgroundColor?: string } {
  const resolved = getColorForTag(tagId);
  return resolved.type === 'custom' ? { backgroundColor: resolved.hex } : {};
}

/** Number of default palette options. */
export const TAG_COLOR_COUNT = TAG_DOT_CLASSES.length;

/** Inline styles for a note card when using a custom hex (pastel gradient, corner accent, outline). */
export function getNoteCardStylesForHex(hex: string): {
  pastelStyle: { background: string };
  tagColorStyle: { backgroundColor: string };
  outlineStyle: { borderColor: string };
} {
  const h = hex.startsWith('#') ? hex : `#${hex}`;
  if (!/^#[0-9A-Fa-f]{6}$/.test(h)) {
    return {
      pastelStyle: { background: 'linear-gradient(135deg, #E2E8F0 0%, #cbd5e0 100%)' },
      tagColorStyle: { backgroundColor: '#94a3b8' },
      outlineStyle: { borderColor: '#94a3b8' },
    };
  }
  return {
    pastelStyle: { background: `linear-gradient(135deg, ${h}22 0%, ${h}44 100%)` },
    tagColorStyle: { backgroundColor: h },
    outlineStyle: { borderColor: h },
  };
}
