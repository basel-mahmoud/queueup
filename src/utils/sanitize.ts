import DOMPurify from 'dompurify';

/**
 * Sanitize user-supplied HTML with a strict allow-list (Section 9.2 — prevent
 * stored XSS). QueueUp renders all user content as TEXT by default (React escapes
 * it), so this is the belt-and-suspenders path for any future rich-text field:
 * scripts, event handlers, and disallowed tags are stripped.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href'],
    ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
  });
}

/** Strip all markup, returning plain text. */
export function toPlainText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
