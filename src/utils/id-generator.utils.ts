/**
 * Article ID generator
 * Generates unique MD5-based identifiers for articles
 */

import { createHash } from 'node:crypto';

export class IdGenerator {
  /**
   * Generates a unique ID for an article based on content and date
   * Uses MD5 hash of content + date to ensure uniqueness
   * @param content - The article content
   * @param date - The article date
   * @returns MD5 hash as hexadecimal string
   */
  generate(content: string, date: Date): string {
    // Generate MD5 hash of the detail page content + date
    // This ensures different dates create different IDs even for same content
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const hashInput = `${dateStr}|${content}`;
    return createHash('md5').update(hashInput).digest('hex');
  }
}
