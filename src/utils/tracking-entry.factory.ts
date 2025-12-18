/**
 * Factory for creating tracking entries
 * Eliminates duplicate tracking entry creation logic
 */

import type { TrackingEntry } from '../schemas/article.js';

export class TrackingEntryFactory {
  /**
   * Creates a new tracking entry
   * @param contentHash - The content hash (MD5)
   * @param link - The article link
   * @param lastSeen - ISO date string of when the article was last seen (defaults to now)
   * @returns Tracking entry object
   */
  create(contentHash: string, link: string, lastSeen?: string): TrackingEntry {
    return {
      contentHash,
      lastSeen: lastSeen ?? new Date().toISOString(),
      link,
    };
  }
}
