import { describe, it, expect, beforeEach } from 'vitest';
import { LinkNormalizer } from '../utils/link.utils.js';

describe('LinkNormalizer', () => {
  const baseUrl = 'https://www.example.com';
  const sourceUrl = 'https://www.example.com/news';
  let normalizer: LinkNormalizer;

  beforeEach(() => {
    normalizer = new LinkNormalizer(baseUrl, sourceUrl);
  });

  describe('normalize', () => {
    it('should return empty string for empty input', () => {
      expect(normalizer.normalize('')).toBe('');
    });

    it('should return absolute URLs unchanged', () => {
      const url = 'https://www.other.com/article';
      expect(normalizer.normalize(url)).toBe(url);
    });

    it('should handle http URLs', () => {
      const url = 'http://www.other.com/article';
      expect(normalizer.normalize(url)).toBe(url);
    });

    it('should normalize root-relative paths', () => {
      const result = normalizer.normalize('/article/123');
      expect(result).toBe('https://www.example.com/article/123');
    });

    it('should normalize relative paths', () => {
      const result = normalizer.normalize('article/123');
      // Relative paths are resolved against the origin, not the full source URL path
      expect(result).toBe('https://www.example.com/article/123');
    });

    it('should handle paths with query parameters', () => {
      const result = normalizer.normalize('/article?id=123');
      expect(result).toBe('https://www.example.com/article?id=123');
    });

    it('should handle paths with hash fragments', () => {
      const result = normalizer.normalize('/article#section');
      expect(result).toBe('https://www.example.com/article#section');
    });
  });

  describe('isValid', () => {
    it('should return false for empty string', () => {
      expect(normalizer.isValid('')).toBe(false);
    });

    it('should return true for valid HTTP URLs', () => {
      expect(normalizer.isValid('http://www.example.com')).toBe(true);
    });

    it('should return true for valid HTTPS URLs', () => {
      expect(normalizer.isValid('https://www.example.com')).toBe(true);
    });

    it('should return true for URLs with paths', () => {
      expect(normalizer.isValid('https://www.example.com/path/to/page')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(normalizer.isValid('not a url')).toBe(false);
    });

    it('should return false for relative paths', () => {
      expect(normalizer.isValid('/relative/path')).toBe(false);
    });

    it('should return true for file URLs', () => {
      expect(normalizer.isValid('file:///path/to/file')).toBe(true);
    });
  });
});
