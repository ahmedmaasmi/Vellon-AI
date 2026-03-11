/**
 * Client-side keyword extraction for note text.
 * Uses tokenization, stopwords filtering, and frequency weighting.
 * Deterministic output for stable UI highlights.
 */

const MIN_TOKEN_LENGTH = 3;
const MAX_KEYWORDS = 20;
const MIN_OCCURRENCES = 1;

/** Common English stopwords to exclude from keywords */
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will',
  'with', 'this', 'but', 'they', 'have', 'had', 'what', 'when', 'where', 'who',
  'which', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'just', 'can', 'should', 'now', 'or', 'if', 'because',
  'until', 'while', 'about', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once',
  'here', 'there', 'any', 'your', 'our', 'their', 'my', 'you', 'i', 'we', 'me',
  'him', 'her', 'them', 'us', 'do', 'does', 'did', 'would', 'could', 'may',
  'might', 'must', 'shall', 'being', 'been', 'get', 'got', 'getting',
]);

/**
 * Normalize a token: lowercase and strip leading/trailing non-word chars.
 */
function normalizeToken(raw: string): string {
  return raw.toLowerCase().replace(/^\W+|\W+$/g, '');
}

/**
 * Tokenize text into words (split on whitespace and punctuation).
 */
function tokenize(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/\s+/)
    .flatMap((s) => s.split(/\b/).filter((t) => /[a-zA-Z0-9]/.test(t)))
    .map(normalizeToken)
    .filter((t) => t.length >= MIN_TOKEN_LENGTH && !STOPWORDS.has(t));
}

/**
 * Extract keywords from text: frequent, non-stopword tokens, deterministic order.
 */
export function extractKeywords(text: string): string[] {
  const tokens = tokenize(text);
  const counts = new Map<string, number>();
  for (const t of tokens) {
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const entries = Array.from(counts.entries())
    .filter(([, count]) => count >= MIN_OCCURRENCES)
    .sort((a, b) => {
      const byCount = b[1] - a[1];
      if (byCount !== 0) return byCount;
      return a[0].localeCompare(b[0]);
    })
    .slice(0, MAX_KEYWORDS);
  return entries.map(([word]) => word);
}

/**
 * Find all keyword match ranges in text (case-insensitive, whole-word).
 * Returns non-overlapping [start, end] pairs for each keyword occurrence.
 */
export function findKeywordRanges(
  text: string,
  keywords: string[]
): Array<{ start: number; end: number; keyword: string }> {
  if (!text || keywords.length === 0) return [];
  const keywordSet = new Set(keywords.map((k) => k.toLowerCase()));
  const ranges: Array<{ start: number; end: number; keyword: string }> = [];
  const re = new RegExp(
    `\\b(${keywords.map((k) => escapeRegex(k)).join('|')})\\b`,
    'gi'
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const keyword = m[1].toLowerCase();
    if (keywordSet.has(keyword)) {
      ranges.push({ start: m.index, end: m.index + m[0].length, keyword });
    }
  }
  return ranges;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
