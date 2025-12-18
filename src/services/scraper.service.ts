import { ofetch } from 'ofetch';
import { logger } from '../lib/logger.js';
import { FetchError } from '../lib/errors.js';
import { env } from '../lib/env.js';
import { SCRAPER_CONFIG } from '../config/constants.js';
import type { IScraperService } from '../interfaces/services.js';

export class ScraperService implements IScraperService {
  async fetchHTML(url: string = env.SOURCE_URL): Promise<string> {
    try {
      logger.info({ url }, 'Fetching HTML');

      const html = await ofetch<string>(url, {
        retry: SCRAPER_CONFIG.MAX_RETRIES,
        retryDelay: SCRAPER_CONFIG.RETRY_DELAY_MS,
        timeout: SCRAPER_CONFIG.REQUEST_TIMEOUT_MS,
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
