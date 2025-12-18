import { describe, it, expect, beforeEach } from 'vitest';
import * as cheerio from 'cheerio';
import { ArticleElementFinder } from '../utils/article-finder.utils.js';
import { ParseError } from '../lib/errors.js';

describe('ArticleElementFinder', () => {
  let finder: ArticleElementFinder;

  beforeEach(() => {
    finder = new ArticleElementFinder();
  });

  it('should find elements with first matching selector', () => {
    const html = '<div class="article">Article 1</div><div class="article">Article 2</div>';
    const $ = cheerio.load(html);

    const elements = finder.findElements($, ['.article', '.post']);

    expect(elements.length).toBe(2);
  });

  it('should try subsequent selectors if first not found', () => {
    const html = '<div class="post">Post 1</div><div class="post">Post 2</div>';
    const $ = cheerio.load(html);

    const elements = finder.findElements($, ['.article', '.post']);

    expect(elements.length).toBe(2);
  });

  it('should return first matching selector even if later ones also match', () => {
    const html = `
      <div class="article">Article 1</div>
      <div class="post">Post 1</div>
    `;
    const $ = cheerio.load(html);

    const elements = finder.findElements($, ['.article', '.post']);

    // Should only find .article elements
    expect(elements.length).toBe(1);
    expect(elements.first().hasClass('article')).toBe(true);
  });

  it('should throw ParseError if no elements found', () => {
    const html = '<div>No matching elements</div>';
    const $ = cheerio.load(html);

    expect(() => {
      finder.findElements($, ['.article', '.post']);
    }).toThrow(ParseError);
  });

  it('should throw ParseError with descriptive message', () => {
    const html = '<div>No matching elements</div>';
    const $ = cheerio.load(html);

    expect(() => {
      finder.findElements($, ['.article', '.post']);
    }).toThrow('No article elements found. HTML structure may have changed.');
  });

  it('should handle complex selectors', () => {
    const html = `
      <div class="container">
        <article class="news-item">Article 1</article>
        <article class="news-item">Article 2</article>
      </div>
    `;
    const $ = cheerio.load(html);

    const elements = finder.findElements($, ['.container .news-item', 'article']);

    expect(elements.length).toBe(2);
  });

  it('should handle attribute selectors', () => {
    const html = `
      <div data-type="article">Article 1</div>
      <div data-type="article">Article 2</div>
    `;
    const $ = cheerio.load(html);

    const elements = finder.findElements($, ['[data-type="article"]']);

    expect(elements.length).toBe(2);
  });
});
