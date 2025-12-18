import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Article, TrackingData } from '../schemas/article.js';
import { trackingDataSchema } from '../schemas/article.js';
import { logger } from '../lib/logger.js';
import { FileSystemError } from '../lib/errors.js';
import { env } from '../lib/env.js';
import { TrackingEntryFactory } from '../utils/tracking-entry.factory.js';
import type { ITrackingService } from '../interfaces/services.js';

export interface ChangeDetectionResult {
  newArticles: Article[];
  updated: Article[];
  unchanged: number;
  updatedTracking: TrackingData;
}

export class TrackingService implements ITrackingService {
  private readonly entryFactory: TrackingEntryFactory;

  constructor(entryFactory?: TrackingEntryFactory) {
    this.entryFactory = entryFactory ?? new TrackingEntryFactory();
  }

  async load(filePath: string = env.TRACKING_FILE): Promise<TrackingData> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      const validated = trackingDataSchema.parse(data);

      logger.info(
        {
          filePath,
          count: Object.keys(validated).length,
        },
        'Tracking data loaded'
      );

      return validated;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.info({ filePath }, 'No tracking file found, starting fresh');
        return {};
      }

      logger.error({ error, filePath }, 'Failed to load tracking data');
      throw new FileSystemError(`Failed to load tracking data from ${filePath}`, error);
    }
  }

  async save(tracking: TrackingData, filePath: string = env.TRACKING_FILE): Promise<void> {
    try {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, JSON.stringify(tracking, null, 2), 'utf-8');

      logger.info(
        {
          filePath,
          count: Object.keys(tracking).length,
        },
        'Tracking data saved'
      );
    } catch (error) {
      logger.error({ error, filePath }, 'Failed to save tracking data');
      throw new FileSystemError(`Failed to save tracking data to ${filePath}`, error);
    }
  }

  /**
   * Detects changes in articles compared to tracking data
   * Returns a new tracking data object without mutating the input (immutable)
   * @param articles - Articles to check for changes
   * @param tracking - Existing tracking data
   * @returns Change detection results including new tracking data
   */
  detectChanges(articles: Article[], tracking: TrackingData): ChangeDetectionResult {
    const newArticles: Article[] = [];
    const updated: Article[] = [];
    let unchanged = 0;
    const now = new Date().toISOString();

    // Create a new tracking object (immutable approach)
    const updatedTracking: TrackingData = { ...tracking };

    for (const article of articles) {
      const existing = tracking[article.id];

      if (!existing) {
        // New article (ID not seen before)
        newArticles.push(article);
        updatedTracking[article.id] = this.entryFactory.create(article.id, article.link, now);
      } else if (existing.link !== article.link) {
        // Content hash (ID) is the same but link changed
        updated.push(article);
        updatedTracking[article.id] = this.entryFactory.create(article.id, article.link, now);
      } else {
        // Unchanged - update lastSeen
        unchanged++;
        updatedTracking[article.id] = {
          ...existing,
          lastSeen: now,
        };
      }
    }

    logger.info(
      {
        new: newArticles.length,
        updated: updated.length,
        unchanged,
      },
      'Change detection complete'
    );

    return { newArticles, updated, unchanged, updatedTracking };
  }
}

export const trackingService = new TrackingService();
