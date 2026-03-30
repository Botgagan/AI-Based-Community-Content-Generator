export const PAGINATION_DEFAULT_PAGE = 1;
export const PAGINATION_DEFAULT_LIMIT = 10;
export const PAGINATION_MAX_LIMIT = 1000;

function toFiniteNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length > 0) return Number(value);
  return Number.NaN;
}

export function resolvePage(value: unknown, fallback = PAGINATION_DEFAULT_PAGE) {
  const parsed = toFiniteNumber(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

export function resolveLimit(
  value: unknown,
  {
    fallback = PAGINATION_DEFAULT_LIMIT,
    max = PAGINATION_MAX_LIMIT,
  }: { fallback?: number; max?: number } = {}
) {
  const parsed = toFiniteNumber(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), max);
}

export function resolveOffset(page: number, limit: number) {
  return (page - 1) * limit;
}
