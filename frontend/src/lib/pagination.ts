/**
 * App-wide rows-per-page sizes. All list screens share one scheme so the
 * page-size dropdowns stay consistent and the fetch-all helpers never
 * request more than the largest option.
 */
export const PAGE_SIZE_OPTIONS = [50, 75, 100] as const;

export const DEFAULT_PAGE_SIZE = 50;

/**
 * Coerce a (possibly URL-provided) page size into a supported option.
 * Falls back to the default when the value is missing, invalid, or a stale
 * option from an older version of the app — prevents an empty <select>.
 */
export const normalizePageSize = (value: number): number =>
    (PAGE_SIZE_OPTIONS as readonly number[]).includes(value) ? value : DEFAULT_PAGE_SIZE;
