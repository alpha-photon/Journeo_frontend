const CACHE_KEY = 'iteranary_offline_itineraries';
const MAX_ENTRIES = 5;

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeCache(entries) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full — clear and retry once
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
    } catch { /* give up */ }
  }
}

/**
 * Save an itinerary document to the offline cache.
 * Keeps the most recent MAX_ENTRIES entries, newest first.
 */
export function cacheItinerary(shareId, doc) {
  if (!shareId || !doc) return;
  const entries = readCache().filter((e) => e.shareId !== shareId);
  entries.unshift({ shareId, doc, cachedAt: Date.now() });
  writeCache(entries.slice(0, MAX_ENTRIES));
}

/**
 * Retrieve a cached itinerary by shareId, or null if not cached.
 */
export function getCachedItinerary(shareId) {
  if (!shareId) return null;
  const entry = readCache().find((e) => e.shareId === shareId);
  return entry ? entry.doc : null;
}

/**
 * Return the list of all cached itinerary summaries (shareId + destination + cachedAt).
 */
export function listCachedItineraries() {
  return readCache().map(({ shareId, cachedAt, doc }) => ({
    shareId,
    cachedAt,
    destination: doc?.destination || doc?.itinerary?.destination || 'Unknown',
  }));
}

/**
 * Remove a specific shareId from cache.
 */
export function removeCachedItinerary(shareId) {
  writeCache(readCache().filter((e) => e.shareId !== shareId));
}
