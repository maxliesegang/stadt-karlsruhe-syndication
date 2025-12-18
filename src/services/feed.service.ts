import { Feed } from 'feed';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Article } from '../schemas/article.js';
import { logger } from '../lib/logger.js';
import { FileSystemError } from '../lib/errors.js';
import { env } from '../lib/env.js';
import type { IFeedService } from '../interfaces/services.js';

export class FeedService implements IFeedService {
  async generate(articles: Article[], outputPath: string = env.OUTPUT_FILE): Promise<void> {
    try {
      const feed = new Feed({
        title: env.FEED_TITLE,
        description: env.FEED_DESCRIPTION,
        id: env.SOURCE_URL,
        link: env.SOURCE_URL,
        language: env.FEED_LANGUAGE,
        updated: new Date(),
        feedLinks: {
          atom: env.FEED_URL,
        },
        copyright: 'Stadt Karlsruhe ' + new Date().getFullYear(),
      });

      const limitedArticles = articles.slice(0, env.MAX_ARTICLES);

      logger.debug(
        {
          total: articles.length,
          included: limitedArticles.length,
        },
        'Limiting articles and preserving source order'
      );

      for (const article of limitedArticles) {
        feed.addItem({
          id: article.id,
          title: article.title,
          link: article.link,
          description: article.description,
          content: article.content, // Full content from detail page
          date: article.date,
          published: article.date,
        });
      }

      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, feed.atom1(), 'utf-8');

      logger.info(
        {
          outputPath,
          articles: limitedArticles.length,
        },
        'Feed generated successfully'
      );
    } catch (error) {
      logger.error({ error, outputPath }, 'Failed to generate feed');
      throw new FileSystemError('Failed to generate feed at ' + outputPath, error);
    }
  }
}

export const feedService = new FeedService();
