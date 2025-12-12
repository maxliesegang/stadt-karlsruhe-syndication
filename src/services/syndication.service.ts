import type { Logger } from '../lib/logger.js';
import { logger as defaultLogger } from '../lib/logger.js';
import type { Article, ArticlePreview } from '../schemas/article.js';
import { env } from '../lib/env.js';
import { parserService as defaultParserService } from './parser.service.js';
import { scraperService as defaultScraperService } from './scraper.service.js';
import {
  trackingService as defaultTrackingService,
  type TrackingService,
} from './tracking.service.js';
import { feedService as defaultFeedService, type FeedService } from './feed.service.js';

export interface FeedRunSummary {
  totalArticles: number;
  newArticles: number;
  updated: number;
  unchanged: number;
  durationMs: number;
}

interface SyndicationDependencies {
  logger: Logger;
  scraperService: typeof defaultScraperService;
  parserService: typeof defaultParserService;
  trackingService: TrackingService;
  feedService: FeedService;
}

export class SyndicationService {
  private readonly logger: Logger;
  private readonly scraperService: SyndicationDependencies['scraperService'];
  private readonly parserService: SyndicationDependencies['parserService'];
  private readonly trackingService: SyndicationDependencies['trackingService'];
  private readonly feedService: SyndicationDependencies['feedService'];

  constructor(
    deps: SyndicationDependencies = {
      logger: defaultLogger,
      scraperService: defaultScraperService,
      parserService: defaultParserService,
      trackingService: defaultTrackingService,
      feedService: defaultFeedService,
    }
  ) {
    this.logger = deps.logger;
    this.scraperService = deps.scraperService;
    this.parserService = deps.parserService;
    this.trackingService = deps.trackingService;
    this.feedService = deps.feedService;
  }

  async run(): Promise<FeedRunSummary> {
    const startTime = Date.now();
    this.logger.info('Starting Stadt Karlsruhe feed generator');
    this.logger.debug({ env }, 'Configuration loaded');

    const html = await this.scraperService.fetchHTML();
    const previews = this.parserService.parseArticles(html);

    if (previews.length === 0) {
      this.logger.warn('No articles found - HTML structure may have changed');
      return this.summarize(startTime);
    }

    this.logger.info({ count: previews.length }, 'Fetching detail pages for articles');

    const detailedArticles = (
      await Promise.all(previews.map((preview) => this.buildArticle(preview)))
    ).filter(Boolean) as Article[];

    if (detailedArticles.length === 0) {
      this.logger.warn('No valid articles after fetching detail pages');
      return this.summarize(startTime);
    }

    this.logger.info({ count: detailedArticles.length }, 'Successfully processed articles');

    const tracking = await this.trackingService.load();
    const changes = this.trackingService.detectChanges(detailedArticles, tracking);

    await this.feedService.generate(detailedArticles);
    await this.trackingService.save(tracking);

    const summary: FeedRunSummary = {
      totalArticles: detailedArticles.length,
      newArticles: changes.newArticles.length,
      updated: changes.updated.length,
      unchanged: changes.unchanged,
      durationMs: Date.now() - startTime,
    };

    this.logger.info(summary, 'Feed generation complete');
    return summary;
  }

  private async buildArticle(preview: ArticlePreview): Promise<Article | null> {
    try {
      const detailHtml = await this.scraperService.fetchHTML(preview.link);
      const content = this.parserService.parseDetailPage(detailHtml, preview.link);
      const id = this.parserService.generateId(content, preview.date);

      return { ...preview, id, content };
    } catch (error) {
      this.logger.warn(
        { error, link: preview.link, title: preview.title },
        'Failed to fetch/parse detail page'
      );
      return null;
    }
  }

  private summarize(startTime: number): FeedRunSummary {
    return {
      totalArticles: 0,
      newArticles: 0,
      updated: 0,
      unchanged: 0,
      durationMs: Date.now() - startTime,
    };
  }
}

export const syndicationService = new SyndicationService();
