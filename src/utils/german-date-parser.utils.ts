/**
 * German date parser
 * Handles various German date formats including relative dates (vor X Stunden, gestern, heute)
 * and absolute dates (DD. Month YYYY, DD.MM.YYYY, YYYY-MM-DD)
 */

import { logger } from '../lib/logger.js';
import { GERMAN_MONTHS } from '../config/constants.js';
import {
  createDateFromNumericParts,
  subtractMilliseconds,
  calculateMilliseconds,
} from './date.utils.js';

export class GermanDateParser {
  /**
   * Parses a German date string into a Date object
   * Supports relative dates (vor X Stunden/Minuten/Tagen, gestern, heute)
   * and absolute dates (DD. Month YYYY, DD.MM.YYYY, YYYY-MM-DD)
   * @param text - The German date string to parse
   * @returns Parsed Date object, or current date if parsing fails
   */
  parse(text: string): Date {
    const now = new Date();
    const trimmed = text.trim();

    const relativeDate = this.parseRelativeDate(trimmed, now);
    if (relativeDate) return relativeDate;

    const absoluteDate = this.parseAbsoluteDate(trimmed);
    if (absoluteDate) return absoluteDate;

    logger.warn({ dateText: trimmed }, 'Could not parse date, using current date');
    return now;
  }

  /**
   * Parses relative date strings like "vor 2 Stunden", "gestern", "heute"
   * @param text - The date string to parse
   * @param reference - The reference date (usually current date)
   * @returns Parsed Date or null if not a relative date
   */
  private parseRelativeDate(text: string, reference: Date): Date | null {
    const relativePatterns: Array<{ regex: RegExp; transform: (value: number) => number }> = [
      {
        regex: /vor\s+(\d+)\s+Stunde(n)?/i,
        transform: (hours) => calculateMilliseconds({ hours }),
      },
      {
        regex: /vor\s+(\d+)\s+Minute(n)?/i,
        transform: (minutes) => calculateMilliseconds({ minutes }),
      },
      {
        regex: /vor\s+(\d+)\s+Tag(en)?/i,
        transform: (days) => calculateMilliseconds({ days }),
      },
    ];

    for (const { regex, transform } of relativePatterns) {
      const match = text.match(regex);
      if (match) {
        const value = Number.parseInt(match[1], 10);
        return subtractMilliseconds(reference, transform(value));
      }
    }

    // "gestern" = yesterday
    if (/gestern/i.test(text)) {
      return subtractMilliseconds(reference, calculateMilliseconds({ days: 1 }));
    }

    // "heute" = today
    if (/heute/i.test(text)) {
      return reference;
    }

    return null;
  }

  /**
   * Parses absolute date strings in various formats
   * Supports: DD. Month YYYY, DD.MM.YYYY, YYYY-MM-DD
   * @param text - The date string to parse
   * @returns Parsed Date or null if not an absolute date format
   */
  private parseAbsoluteDate(text: string): Date | null {
    // Format: DD. Month YYYY (e.g., "15. Januar 2024")
    // Use [a-zäöüß]+ to match German month names with umlauts
    const monthPattern = /(\d{1,2})\.\s+([a-zäöüß]+)\s+(\d{4})/i;
    // Format: DD.MM.YYYY (e.g., "15.01.2024")
    const numericPattern = /(\d{1,2})\.(\d{1,2})\.(\d{4})/;
    // Format: YYYY-MM-DD (ISO format)
    const isoPattern = /(\d{4})-(\d{2})-(\d{2})/;

    // Try month name format
    const monthMatch = text.match(monthPattern);
    if (monthMatch) {
      const [, day, monthName, year] = monthMatch;
      const month = GERMAN_MONTHS[monthName];
      if (month !== undefined) {
        return createDateFromNumericParts(
          Number.parseInt(day, 10),
          month + 1, // Convert from 0-indexed to 1-indexed for createDateFromNumericParts
          Number.parseInt(year, 10)
        );
      }
    }

    // Try numeric format (DD.MM.YYYY)
    const numericMatch = text.match(numericPattern);
    if (numericMatch) {
      const [, day, month, year] = numericMatch;
      return createDateFromNumericParts(
        Number.parseInt(day, 10),
        Number.parseInt(month, 10),
        Number.parseInt(year, 10)
      );
    }

    // Try ISO format (YYYY-MM-DD)
    const isoMatch = text.match(isoPattern);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return createDateFromNumericParts(
        Number.parseInt(day, 10),
        Number.parseInt(month, 10),
        Number.parseInt(year, 10)
      );
    }

    return null;
  }
}
