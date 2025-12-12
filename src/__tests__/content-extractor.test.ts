import { describe, it, expect, vi, afterEach } from 'vitest';
import { ContentExtractorService } from '../services/content-extractor.service.js';
import { Readability } from '@mozilla/readability';

describe('ContentExtractorService', () => {
  const extractor = new ContentExtractorService();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves structural HTML from Readability output', () => {
    const html = `
      <html>
        <body>
          <article>
            <h1>Heading</h1>
            <p>First paragraph</p>
            <p>Second paragraph</p>
          </article>
        </body>
      </html>
    `;

    const result = extractor.extract(html, 'https://example.com/article');

    expect(result).toContain('<p>First paragraph</p>');
    expect(result).toContain('<p>Second paragraph</p>');
    expect(result).toContain('Heading');
  });

  it('wraps plain text from Readability into paragraphs when no HTML is returned', () => {
    vi.spyOn(Readability.prototype, 'parse').mockReturnValue({
      title: 'Only text content',
      content: '',
      textContent: 'First block\n\nSecond block',
      length: 0,
      excerpt: 'First block',
      byline: null,
      dir: null,
      siteName: null,
    });

    const result = extractor.extract('<html><body>fallback</body></html>', 'https://example.com');

    expect(result).toBe('<p>First block</p><p>Second block</p>');
  });
});
