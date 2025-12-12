import { describe, it, expect } from 'vitest';
import { ParserService } from '../services/parser.service.js';

describe('ParserService', () => {
  const parser = new ParserService();

  describe('parseGermanDate', () => {
    it('should parse relative time - hours ago', () => {
      const result = parser.parseGermanDate('vor 12 Stunden');
      const now = new Date();
      const expected = new Date(now.getTime() - 12 * 60 * 60 * 1000);

      expect(result.getTime()).toBeCloseTo(expected.getTime(), -4);
    });

    it('should parse relative time - yesterday', () => {
      const result = parser.parseGermanDate('Gestern');
      const now = new Date();
      const expected = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(result.getTime()).toBeCloseTo(expected.getTime(), -4);
    });

    it('should parse absolute date with month name', () => {
      const result = parser.parseGermanDate('9. Dezember 2025');
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(9);
    });

    it('should parse DD.MM.YYYY format', () => {
      const result = parser.parseGermanDate('09.12.2025');
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(9);
    });

    it('should fallback to current date for unparseable input', () => {
      const result = parser.parseGermanDate('invalid date');
      const now = new Date();
      expect(result.getTime()).toBeCloseTo(now.getTime(), -4);
    });
  });

  describe('parseArticles', () => {
    it('should preserve page order and use datetime attributes', () => {
      const html = `
        <div class="karlTabs__tab-pane show active">
          <div class="news-item">
            <a href="/erstes">
              <time datetime="2025-12-11">11.12.2025</time>
              <h3 class="h4-style news-item__headline"><span>Erste Meldung</span></h3>
              <p class="mt-1">Beschreibung eins</p>
            </a>
          </div>
          <div class="news-item">
            <a href="/zweites">
              <time datetime="2025-12-10">10.12.2025</time>
              <h3 class="h4-style news-item__headline"><span>Zweite Meldung</span></h3>
              <p class="mt-1">Beschreibung zwei</p>
            </a>
          </div>
        </div>
      `;

      const articles = parser.parseArticles(html);

      expect(articles).toHaveLength(2);
      expect(articles.map((a) => a.title)).toEqual(['Erste Meldung', 'Zweite Meldung']);
      expect(articles.map((a) => a.description)).toEqual([
        'Beschreibung eins',
        'Beschreibung zwei',
      ]);
      expect(articles[0].link).toBe('https://www.karlsruhe.de/erstes');
      expect(articles[1].link).toBe('https://www.karlsruhe.de/zweites');
      expect(articles[0].date.getFullYear()).toBe(2025);
      expect(articles[0].date.getMonth()).toBe(11);
      expect(articles[0].date.getDate()).toBe(11);
      expect(articles[1].date.getDate()).toBe(10);
    });
  });

  describe('generateId', () => {
    it('should generate MD5 hash from content and date', () => {
      const content = 'Test article content about Karlsruhe';
      const date = new Date('2025-12-09');
      const id = parser.generateId(content, date);

      // MD5 hash should be 32 characters
      expect(id).toHaveLength(32);
      expect(id).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should generate same ID for same content and date', () => {
      const content = 'Test article content';
      const date = new Date('2025-12-09');
      const id1 = parser.generateId(content, date);
      const id2 = parser.generateId(content, date);

      expect(id1).toBe(id2);
    });

    it('should generate different IDs for different content', () => {
      const content1 = 'Test article content 1';
      const content2 = 'Test article content 2';
      const date = new Date('2025-12-09');

      const id1 = parser.generateId(content1, date);
      const id2 = parser.generateId(content2, date);

      expect(id1).not.toBe(id2);
    });

    it('should generate different IDs for same content but different dates', () => {
      const content = 'Test article content';
      const date1 = new Date('2025-12-09');
      const date2 = new Date('2025-12-10');

      const id1 = parser.generateId(content, date1);
      const id2 = parser.generateId(content, date2);

      expect(id1).not.toBe(id2);
    });
  });
});
