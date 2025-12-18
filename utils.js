export function makeCacheKey(userId, message) {
  return `${userId}|${String(message).trim().toLowerCase()}`;
}
