import { describe, it, expect } from 'vitest';
import {
  createDateFromParts,
  createDateFromNumericParts,
  subtractMilliseconds,
  calculateMilliseconds,
} from '../utils/date.utils.js';

describe('date.utils', () => {
  describe('createDateFromParts', () => {
    it('should create a date from 0-indexed month', () => {
      const date = createDateFromParts(15, 0, 2024); // January
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // January is 0
      expect(date.getDate()).toBe(15);
    });

    it('should create a date from December (month 11)', () => {
      const date = createDateFromParts(31, 11, 2023); // December
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(11);
      expect(date.getDate()).toBe(31);
    });

    it('should handle leap year February', () => {
      const date = createDateFromParts(29, 1, 2024); // Feb 29, 2024 (leap year)
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(1);
      expect(date.getDate()).toBe(29);
    });
  });

  describe('createDateFromNumericParts', () => {
    it('should create a date from 1-indexed month', () => {
      const date = createDateFromNumericParts(15, 1, 2024); // January (1)
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // Converted to 0
      expect(date.getDate()).toBe(15);
    });

    it('should create a date from December (month 12)', () => {
      const date = createDateFromNumericParts(31, 12, 2023); // December (12)
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(11); // Converted to 11
      expect(date.getDate()).toBe(31);
    });

    it('should handle month boundaries correctly', () => {
      const date = createDateFromNumericParts(1, 6, 2024); // June 1
      expect(date.getMonth()).toBe(5); // June is month 5 (0-indexed)
    });
  });

  describe('subtractMilliseconds', () => {
    it('should subtract milliseconds from a date', () => {
      const reference = new Date(2024, 0, 15, 12, 0, 0, 0);
      const result = subtractMilliseconds(reference, 1000); // Subtract 1 second
      expect(result.getSeconds()).toBe(59);
      expect(result.getMinutes()).toBe(59);
      expect(result.getHours()).toBe(11);
    });

    it('should handle subtracting hours', () => {
      const reference = new Date(2024, 0, 15, 12, 0, 0, 0);
      const result = subtractMilliseconds(reference, 2 * 60 * 60 * 1000); // Subtract 2 hours
      expect(result.getHours()).toBe(10);
      expect(result.getDate()).toBe(15);
    });

    it('should handle day boundaries', () => {
      const reference = new Date(2024, 0, 15, 1, 0, 0, 0);
      const result = subtractMilliseconds(reference, 3 * 60 * 60 * 1000); // Subtract 3 hours
      expect(result.getDate()).toBe(14);
      expect(result.getHours()).toBe(22);
    });

    it('should not mutate the original date', () => {
      const reference = new Date(2024, 0, 15, 12, 0, 0, 0);
      const originalTime = reference.getTime();
      subtractMilliseconds(reference, 1000);
      expect(reference.getTime()).toBe(originalTime);
    });
  });

  describe('calculateMilliseconds', () => {
    it('should calculate milliseconds from hours', () => {
      const result = calculateMilliseconds({ hours: 1 });
      expect(result).toBe(60 * 60 * 1000); // 1 hour = 3,600,000 ms
    });

    it('should calculate milliseconds from minutes', () => {
      const result = calculateMilliseconds({ minutes: 30 });
      expect(result).toBe(30 * 60 * 1000); // 30 minutes = 1,800,000 ms
    });

    it('should calculate milliseconds from days', () => {
      const result = calculateMilliseconds({ days: 1 });
      expect(result).toBe(24 * 60 * 60 * 1000); // 1 day = 86,400,000 ms
    });

    it('should calculate milliseconds from combined values', () => {
      const result = calculateMilliseconds({ days: 1, hours: 2, minutes: 30 });
      const expected =
        24 * 60 * 60 * 1000 + // 1 day
        2 * 60 * 60 * 1000 + // 2 hours
        30 * 60 * 1000; // 30 minutes
      expect(result).toBe(expected);
    });

    it('should return 0 for empty config', () => {
      const result = calculateMilliseconds({});
      expect(result).toBe(0);
    });

    it('should handle zero values', () => {
      const result = calculateMilliseconds({ hours: 0, minutes: 0, days: 0 });
      expect(result).toBe(0);
    });
  });
});
