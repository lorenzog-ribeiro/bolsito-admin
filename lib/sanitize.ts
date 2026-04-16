// FIX: sanitização de HTML para prevenir XSS via dangerouslySetInnerHTML
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeComment(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code'],
    ALLOWED_ATTR: ['href'],
    ALLOW_DATA_ATTR: false,
  });
}
