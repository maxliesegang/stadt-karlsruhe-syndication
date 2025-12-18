import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GermanDateParser } from '../utils/german-date-parser.utils.js';

describe('GermanDateParser', () => {
  let parser: GermanDateParser;
  let mockNow: Date;

  beforeEach(() => {
    parser = new GermanDateParser();
    // Set a fixed "now" for testing relative dates
    mockNow = new Date(2024, 0, 15, 12, 0, 0, 0); // Jan 15, 2024, 12:00:00
    vi.setSystemTime(mockNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('parse - relative dates', () => {
    it('should parse "vor 2 Stunden" (2 hours ago)', () => {
      const result = parser.parse('vor 2 Stunden');
      expect(result.getHours()).toBe(10); // 12 - 2 = 10
      expect(result.getDate()).toBe(15);
    });

    it('should parse "vor 1 Stunde" (1 hour ago)', () => {
      const result = parser.parse('vor 1 Stunde');
      expect(result.getHours()).toBe(11);
    });

    it('should parse "vor 30 Minuten" (30 minutes ago)', () => {
      const result = parser.parse('vor 30 Minuten');
      expect(result.getHours()).toBe(11);
      expect(result.getMinutes()).toBe(30);
    });

    it('should parse "vor 1 Minute" (1 minute ago)', () => {
      const result = parser.parse('vor 1 Minute');
      expect(result.getHours()).toBe(11);
      expect(result.getMinutes()).toBe(59);
    });

    it('should parse "vor 3 Tagen" (3 days ago)', () => {
      const result = parser.parse('vor 3 Tagen');
      expect(result.getDate()).toBe(12); // 15 - 3 = 12
      expect(result.getMonth()).toBe(0); // Still January
    });

    it('should parse "vor 1 Tag" (1 day ago)', () => {
      const result = parser.parse('vor 1 Tag');
      expect(result.getDate()).toBe(14);
    });

    it('should parse "gestern" (yesterday)', () => {
      const result = parser.parse('gestern');
      expect(result.getDate()).toBe(14); // 15 - 1 = 14
      expect(result.getMonth()).toBe(0);
    });

    it('should parse "heute" (today)', () => {
      const result = parser.parse('heute');
      expect(result.getDate()).toBe(15);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2024);
    });

    it('should be case-insensitive for relative dates', () => {
      const result1 = parser.parse('GESTERN');
      const result2 = parser.parse('Heute');
      const result3 = parser.parse('VOR 2 STUNDEN');

      expect(result1.getDate()).toBe(14);
      expect(result2.getDate()).toBe(15);
      expect(result3.getHours()).toBe(10);
    });
  });

  describe('parse - absolute dates with month names', () => {
    it('should parse "15. Januar 2024"', () => {
      const result = parser.parse('15. Januar 2024');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });

    it('should parse "25. Dezember 2023"', () => {
      const result = parser.parse('25. Dezember 2023');
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getDate()).toBe(25);
    });

    it('should parse "1. März 2024"', () => {
      const result = parser.parse('1. März 2024');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(2); // March
      expect(result.getDate()).toBe(1);
    });

    it('should parse all German month names', () => {
      const months = [
        'Januar',
        'Februar',
        'März',
        'April',
        'Mai',
        'Juni',
        'Juli',
        'August',
        'September',
        'Oktober',
        'November',
        'Dezember',
      ];

      months.forEach((month, index) => {
        const result = parser.parse(`15. ${month} 2024`);
        expect(result.getMonth()).toBe(index);
      });
    });
  });

  describe('parse - numeric date formats', () => {
    it('should parse DD.MM.YYYY format', () => {
      const result = parser.parse('15.01.2024');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });

    it('should parse single-digit days and months', () => {
      const result = parser.parse('5.3.2024');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(2); // March
      expect(result.getDate()).toBe(5);
    });

    it('should parse ISO format YYYY-MM-DD', () => {
      const result = parser.parse('2024-01-15');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
    });

    it('should parse ISO format with single digits', () => {
      const result = parser.parse('2024-03-05');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(2); // March
      expect(result.getDate()).toBe(5);
    });
  });

  describe('parse - edge cases and fallbacks', () => {
    it('should return current date for unparseable text', () => {
      const result = parser.parse('invalid date string');
      // Should return current date
      expect(result.getDate()).toBe(mockNow.getDate());
      expect(result.getMonth()).toBe(mockNow.getMonth());
      expect(result.getFullYear()).toBe(mockNow.getFullYear());
    });

    it('should handle empty string', () => {
      const result = parser.parse('');
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle whitespace-only string', () => {
      const result = parser.parse('   ');
      expect(result).toBeInstanceOf(Date);
    });

    it('should trim input', () => {
      const result = parser.parse('  15. Januar 2024  ');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
    });
  });

  describe('parse - priority order', () => {
    it('should prioritize relative dates over absolute when both patterns exist', () => {
      // This string contains both patterns - "vor 2 Stunden" should be matched first
      const result = parser.parse('vor 2 Stunden am 15. Januar 2024');
      // Should parse as relative date (2 hours ago), not the absolute date
      expect(result.getHours()).toBe(10); // Relative time
    });
  });
});
