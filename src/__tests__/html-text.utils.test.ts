import { describe, it, expect, beforeEach } from 'vitest';
import * as cheerio from 'cheerio';
import { HtmlTextExtractor } from '../utils/html-text.utils.js';

describe('HtmlTextExtractor', () => {
  let extractor: HtmlTextExtractor;

  beforeEach(() => {
    extractor = new HtmlTextExtractor();
  });

  describe('extractText', () => {
    it('should extract text from first matching selector', () => {
      const html = '<div><h1>Title</h1><h2>Subtitle</h2></div>';
      const $ = cheerio.load(html);
      const result = extractor.extractText($('div'), ['h1', 'h2']);
      expect(result).toBe('Title');
    });

    it('should try subsequent selectors if first not found', () => {
      const html = '<div><h2>Subtitle</h2></div>';
      const $ = cheerio.load(html);
      const result = extractor.extractText($('div'), ['h1', 'h2']);
      expect(result).toBe('Subtitle');
    });

    it('should return fallback if no selector matches', () => {
      const html = '<div><p>Text</p></div>';
      const $ = cheerio.load(html);
      const result = extractor.extractText($('div'), ['h1', 'h2'], 'fallback');
      expect(result).toBe('fallback');
    });

    it('should decode HTML entities', () => {
      const html = '<div><h1>Title&nbsp;with&nbsp;spaces</h1></div>';
      const $ = cheerio.load(html);
      const result = extractor.extractText($('div'), ['h1']);
      expect(result).toBe('Title with spaces');
    });

    it('should trim whitespace', () => {
      const html = '<div><h1>  Title  </h1></div>';
      const $ = cheerio.load(html);
      const result = extractor.extractText($('div'), ['h1']);
      expect(result).toBe('Title');
    });
  });

  describe('decodeHtmlEntities', () => {
    it('should replace &nbsp; with space', () => {
      const result = extractor.decodeHtmlEntities('Text&nbsp;with&nbsp;nbsp');
      expect(result).toBe('Text with nbsp');
    });

    it('should remove soft hyphens', () => {
      const result = extractor.decodeHtmlEntities('word&shy;break');
      expect(result).toBe('wordbreak');
    });

    it('should normalize multiple spaces', () => {
      const result = extractor.decodeHtmlEntities('Text   with    spaces');
      expect(result).toBe('Text with spaces');
    });

    it('should trim result', () => {
      const result = extractor.decodeHtmlEntities('  Text  ');
      expect(result).toBe('Text');
    });
  });

  describe('extractDescription', () => {
    it('should extract from matching selector', () => {
      const html = '<div><p class="desc">Description</p></div>';
      const $ = cheerio.load(html);
      const result = extractor.extractDescription($('div'), ['.desc'], 'fallback');
      expect(result).toBe('Description');
    });

    it('should find first non-date paragraph as fallback', () => {
      const html = `
        <div>
          <p class="date">2024-01-15</p>
          <p>First paragraph</p>
        </div>
      `;
      const $ = cheerio.load(html);
      const result = extractor.extractDescription($('div'), ['.nonexistent'], 'fallback');
      expect(result).toBe('First paragraph');
    });

    it('should skip paragraphs with "date" in class', () => {
      const html = `
        <div>
          <p class="article-date">2024-01-15</p>
          <p>First paragraph</p>
        </div>
      `;
      const $ = cheerio.load(html);
      const result = extractor.extractDescription($('div'), ['.nonexistent'], 'fallback');
      expect(result).toBe('First paragraph');
    });

    it('should skip paragraphs with "published" in class', () => {
      const html = `
        <div>
          <p class="published-date">2024-01-15</p>
          <p>First paragraph</p>
        </div>
      `;
      const $ = cheerio.load(html);
      const result = extractor.extractDescription($('div'), ['.nonexistent'], 'fallback');
      expect(result).toBe('First paragraph');
    });

    it('should return fallback if no valid text found', () => {
      const html = '<div><p class="date">Only dates</p></div>';
      const $ = cheerio.load(html);
      const result = extractor.extractDescription($('div'), ['.nonexistent'], 'fallback');
      expect(result).toBe('fallback');
    });
  });

  describe('extractDateText', () => {
    it('should extract datetime attribute from time element', () => {
      const html = '<div><time datetime="2024-01-15">Jan 15</time></div>';
      const $ = cheerio.load(html);
      const result = extractor.extractDateText($('div'), ['.date']);
      expect(result).toBe('2024-01-15');
    });

    it('should use selectors if no datetime attribute', () => {
      const html = '<div><span class="date">2024-01-15</span></div>';
      const $ = cheerio.load(html);
      const result = extractor.extractDateText($('div'), ['.date']);
      expect(result).toBe('2024-01-15');
    });

    it('should return all element text as fallback', () => {
      const html = '<div>Some date text</div>';
      const $ = cheerio.load(html);
      const result = extractor.extractDateText($('div'), ['.nonexistent']);
      expect(result).toBe('Some date text');
    });
  });
});
