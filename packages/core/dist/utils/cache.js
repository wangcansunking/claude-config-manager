const cache = new Map();
const DEFAULT_TTL = 5000; // 5 seconds
export function getCached(key, ttl = DEFAULT_TTL) {
    const entry = cache.get(key);
    if (!entry)
        return null;
    if (Date.now() - entry.timestamp > ttl) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}
export function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}
export function invalidateCache(pattern) {
    if (!pattern) {
        cache.clear();
        return;
    }
    for (const key of cache.keys()) {
        if (key.includes(pattern))
            cache.delete(key);
    }
}
//# sourceMappingURL=cache.js.map