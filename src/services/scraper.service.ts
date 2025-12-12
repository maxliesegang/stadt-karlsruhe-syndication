import { ofetch } from 'ofetch';
import { logger } from '../lib/logger.js';
import { FetchError } from '../lib/errors.js';
import { env } from '../lib/env.js';

export class ScraperService {
  async fetchHTML(url: string = env.SOURCE_URL): Promise<string> {
    try {
      logger.info({ url }, 'Fetching HTML');

      const html = await ofetch<string>(url, {
        retry: 3,
        retryDelay: 1000,
        timeout: 30000,
      });

      logger.info(
        {
          url,
          size: html.length,
          sizeKB: Math.round(html.length / 1024),
        },
        'HTML fetched successfully'
      );

      return html;
    } catch (error) {
      logger.error({ error, url }, 'Failed to fetch HTML');
      throw new FetchError(`Failed to fetch HTML from ${url}`, error);
    }
  }
}

export const scraperService = new ScraperService();
