const PLACEHOLDER_PATTERNS = [
  /^my_/i,
  /^your_/i,
  /^placeholder/i,
  /^changeme/i,
  /^replace[_-]?me/i,
  /^<.*>$/,
];

/**
 * Returns true only when an environment variable contains a non-empty,
 * non-placeholder API key. Prevents template values copied from `.env.example`
 * from triggering failed external API requests.
 */
export function isConfiguredApiKey(value: string | undefined | null): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}
