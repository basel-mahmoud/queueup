import { describe, expect, it } from 'vitest';
import { sanitizeHtml, toPlainText } from '@/utils/sanitize';

describe('HTML sanitization (Section 9.2 — XSS)', () => {
  it('strips <script> tags', () => {
    const out = sanitizeHtml('<p>hi</p><script>alert("xss")</script>');
    expect(out).toContain('hi');
    expect(out.toLowerCase()).not.toContain('<script');
    expect(out).not.toContain('alert');
  });

  it('removes inline event handlers', () => {
    const out = sanitizeHtml('<a href="https://ok.com" onclick="steal()">link</a>');
    expect(out).not.toContain('onclick');
  });

  it('blocks javascript: URLs', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain('javascript:');
  });

  it('toPlainText removes all markup', () => {
    expect(toPlainText('<b>bold</b> <i>italic</i>')).toBe('bold italic');
    expect(toPlainText('<img src=x onerror=alert(1)>hello')).toBe('hello');
  });
});
