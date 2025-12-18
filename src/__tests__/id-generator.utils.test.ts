import { describe, it, expect, beforeEach } from 'vitest';
import { IdGenerator } from '../utils/id-generator.utils.js';

describe('IdGenerator', () => {
  let generator: IdGenerator;

  beforeEach(() => {
    generator = new IdGenerator();
  });

  it('should generate consistent IDs for same content and date', () => {
    const content = 'Article content';
    const date = new Date('2024-01-15T12:00:00Z');

    const id1 = generator.generate(content, date);
    const id2 = generator.generate(content, date);

    expect(id1).toBe(id2);
  });

  it('should generate different IDs for different content', () => {
    const date = new Date('2024-01-15T12:00:00Z');

    const id1 = generator.generate('Content 1', date);
    const id2 = generator.generate('Content 2', date);

    expect(id1).not.toBe(id2);
  });

  it('should generate different IDs for different dates', () => {
    const content = 'Same content';

    const id1 = generator.generate(content, new Date('2024-01-15T12:00:00Z'));
    const id2 = generator.generate(content, new Date('2024-01-16T12:00:00Z'));

    expect(id1).not.toBe(id2);
  });

  it('should generate same ID for same date regardless of time', () => {
    const content = 'Article content';

    // Different times, same date
    const id1 = generator.generate(content, new Date('2024-01-15T08:00:00Z'));
    const id2 = generator.generate(content, new Date('2024-01-15T20:00:00Z'));

    expect(id1).toBe(id2);
  });

  it('should generate MD5 hash (32 hex characters)', () => {
    const id = generator.generate('content', new Date('2024-01-15'));
    expect(id).toMatch(/^[a-f0-9]{32}$/);
  });

  it('should handle empty content', () => {
    const id = generator.generate('', new Date('2024-01-15'));
    expect(id).toMatch(/^[a-f0-9]{32}$/);
  });

  it('should handle special characters in content', () => {
    const content = 'Content with special chars: äöü @#$%';
    const id = generator.generate(content, new Date('2024-01-15'));
    expect(id).toMatch(/^[a-f0-9]{32}$/);
  });
});
