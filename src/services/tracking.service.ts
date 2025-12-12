import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Article, TrackingData } from '../schemas/article.js';
import { trackingDataSchema } from '../schemas/article.js';
import { logger } from '../lib/logger.js';
import { FileSystemError } from '../lib/errors.js';
import { env } from '../lib/env.js';

export interface ChangeDetectionResult {
  newArticles: Article[];
  updated: Article[];
  unchanged: number;
}

export class TrackingService {
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

  detectChanges(articles: Article[], tracking: TrackingData): ChangeDetectionResult {
    const newArticles: Article[] = [];
    const updated: Article[] = [];
    let unchanged = 0;
    const now = new Date().toISOString();

    for (const article of articles) {
      const existing = tracking[article.id];

      if (!existing) {
        // New article (ID not seen before)
        newArticles.push(article);
        tracking[article.id] = {
          contentHash: article.id, // ID is already the content hash
          lastSeen: now,
          link: article.link,
        };
      } else if (existing.link !== article.link) {
        // Content hash (ID) is the same but link changed
        updated.push(article);
        tracking[article.id] = {
          contentHash: article.id,
          lastSeen: now,
          link: article.link,
        };
      } else {
        // Unchanged
        unchanged++;
        tracking[article.id].lastSeen = now;
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

    return { newArticles, updated, unchanged };
  }
}

export const trackingService = new TrackingService();
