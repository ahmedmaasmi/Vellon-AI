/**
 * Google Keep–style per-note colors. Stored on the server as short ids or hex.
 */

export const NOTE_COLOR_IDS = [
  'default',
  'coral',
  'peach',
  'sand',
  'mint',
  'sage',
  'teal',
  'sky',
  'lavender',
  'grape',
  'pink',
  'stone',
] as const;

export type NoteColorId = (typeof NOTE_COLOR_IDS)[number];

/** Light + dark card surface classes (Tailwind must see full strings). */
const PALETTE: Record<
  NoteColorId,
  { card: string; cardDark: string; border: string; borderDark: string; bar: string }
> = {
  default: {
    card: 'bg-card/95',
    cardDark: 'dark:bg-card/90',
    border: 'border-black/[0.06]',
    borderDark: 'dark:border-border/60',
    bar: 'bg-muted-foreground/25',
  },
  coral: {
    card: 'bg-[#f28b82]/90',
    cardDark: 'dark:bg-[#c5221f]/35',
    border: 'border-[#e0675f]/30',
    borderDark: 'dark:border-[#f28b82]/25',
    bar: 'bg-[#e0675f]',
  },
  peach: {
    card: 'bg-[#fbbc04]/35',
    cardDark: 'dark:bg-[#b06000]/30',
    border: 'border-[#f9ab00]/40',
    borderDark: 'dark:border-[#fbbc04]/25',
    bar: 'bg-[#f9ab00]',
  },
  sand: {
    card: 'bg-[#fff475]/50',
    cardDark: 'dark:bg-[#9a8700]/25',
    border: 'border-[#e8d44d]/50',
    borderDark: 'dark:border-[#fff475]/20',
    bar: 'bg-[#e2c200]',
  },
  mint: {
    card: 'bg-[#ccff90]/55',
    cardDark: 'dark:bg-[#3d5c1f]/35',
    border: 'border-[#a8e063]/45',
    borderDark: 'dark:border-[#ccff90]/20',
    bar: 'bg-[#7cb342]',
  },
  sage: {
    card: 'bg-[#a7ffeb]/50',
    cardDark: 'dark:bg-[#00695c]/30',
    border: 'border-[#4db6ac]/35',
    borderDark: 'dark:border-[#a7ffeb]/20',
    bar: 'bg-[#26a69a]',
  },
  teal: {
    card: 'bg-[#cbf0f8]/90',
    cardDark: 'dark:bg-[#01579b]/30',
    border: 'border-[#81d4fa]/50',
    borderDark: 'dark:border-[#4fc3f7]/25',
    bar: 'bg-[#039be5]',
  },
  sky: {
    card: 'bg-[#aecbfa]/55',
    cardDark: 'dark:bg-[#1a237e]/35',
    border: 'border-[#8ab4f8]/45',
    borderDark: 'dark:border-[#aecbfa]/25',
    bar: 'bg-[#4285f4]',
  },
  lavender: {
    card: 'bg-[#d7aefb]/45',
    cardDark: 'dark:bg-[#4a148c]/30',
    border: 'border-[#ce93d8]/40',
    borderDark: 'dark:border-[#d7aefb]/20',
    bar: 'bg-[#ab47bc]',
  },
  grape: {
    card: 'bg-[#fdcfe8]/60',
    cardDark: 'dark:bg-[#880e4f]/28',
    border: 'border-[#f48fb1]/45',
    borderDark: 'dark:border-[#fdcfe8]/20',
    bar: 'bg-[#ec407a]',
  },
  pink: {
    card: 'bg-[#e6c9a8]/70',
    cardDark: 'dark:bg-[#5d4037]/35',
    border: 'border-[#bcaaa4]/50',
    borderDark: 'dark:border-[#d7ccc8]/25',
    bar: 'bg-[#8d6e63]',
  },
  stone: {
    card: 'bg-[#e8eaed]/95',
    cardDark: 'dark:bg-[#37474f]/45',
    border: 'border-[#bdc1c6]/60',
    borderDark: 'dark:border-[#90a4ae]/35',
    bar: 'bg-[#78909c]',
  },
};

export function isNoteColorId(v: string | null | undefined): v is NoteColorId {
  return !!v && (NOTE_COLOR_IDS as readonly string[]).includes(v);
}

export function resolveNoteColorKey(color: string | null | undefined): NoteColorId {
  if (!color || color === 'default') return 'default';
  if (isNoteColorId(color)) return color;
  return 'default';
}

export function getKeepCardClasses(color: string | null | undefined): {
  surface: string;
  bar: string;
} {
  const key = resolveNoteColorKey(color);
  const p = PALETTE[key];
  return {
    surface: `${p.card} ${p.cardDark} border ${p.border} ${p.borderDark}`,
    bar: p.bar,
  };
}

/** Swatch button background for color picker */
export function getKeepSwatchClass(color: string | null | undefined): string {
  const key = resolveNoteColorKey(color);
  return PALETTE[key].bar;
}

/** Tailwind classes for color-picker dots */
export function noteColorSwatchTw(id: NoteColorId): string {
  if (id === 'default') return 'bg-card border border-border';
  return PALETTE[id].bar;
}

export const NOTE_COLOR_OPTIONS: { id: NoteColorId; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'coral', label: 'Red' },
  { id: 'peach', label: 'Orange' },
  { id: 'sand', label: 'Yellow' },
  { id: 'mint', label: 'Green' },
  { id: 'sage', label: 'Teal' },
  { id: 'teal', label: 'Blue-green' },
  { id: 'sky', label: 'Blue' },
  { id: 'lavender', label: 'Purple' },
  { id: 'grape', label: 'Pink' },
  { id: 'pink', label: 'Brown' },
  { id: 'stone', label: 'Gray' },
];
