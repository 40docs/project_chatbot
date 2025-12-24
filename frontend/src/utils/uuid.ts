/**
 * Generate a UUID that works in both secure (HTTPS) and insecure (HTTP) contexts.
 * crypto.randomUUID() requires a secure context, so we provide a fallback.
 */
export function generateUUID(): string {
  // Use native crypto.randomUUID if available (secure context)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for insecure contexts (HTTP)
  // This generates a v4-like UUID using Math.random()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
