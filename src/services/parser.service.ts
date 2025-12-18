import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { ArticlePreview } from '../schemas/article.js';
import { logger } from '../lib/logger.js';
import { ParseError } from '../lib/errors.js';
import { env } from '../lib/env.js';
import { contentExtractorService } from './content-extractor.service.js';
import {
  ARTICLE_SELECTORS,
  TITLE_SELECTORS,
  DESCRIPTION_SELECTORS,
  DATE_SELECTORS,
} from '../config/selectors.js';
import { GermanDateParser } from '../utils/german-date-parser.utils.js';
import { LinkNormalizer } from '../utils/link.utils.js';
import { HtmlTextExtractor } from '../utils/html-text.utils.js';
import { IdGenerator } from '../utils/id-generator.utils.js';
import { ArticleElementFinder } from '../utils/article-finder.utils.js';
import type { IParserService } from '../interfaces/services.js';

export class ParserService implements IParserService {
  private readonly dateParser: GermanDateParser;
  private readonly linkNormalizer: LinkNormalizer;
  private readonly textExtractor: HtmlTextExtractor;
  private readonly idGenerator: IdGenerator;
  private readonly elementFinder: ArticleElementFinder;

  constructor(
    dateParser?: GermanDateParser,
    linkNormalizer?: LinkNormalizer,
    textExtractor?: HtmlTextExtractor,
    idGenerator?: IdGenerator,
    elementFinder?: ArticleElementFinder
  ) {
    this.dateParser = dateParser ?? new GermanDateParser();
    this.linkNormalizer = linkNormalizer ?? new LinkNormalizer(env.BASE_URL, env.SOURCE_URL);
    this.textExtractor = textExtractor ?? new HtmlTextExtractor();
    this.idGenerator = idGenerator ?? new IdGenerator();
    this.elementFinder = elementFinder ?? new ArticleElementFinder();
  }

  parseGermanDate(text: string): Date {
    return this.dateParser.parse(text);
  }

  generateId(content: string, date: Date): string {
    return this.idGenerator.generate(content, date);
  }

  parseDetailPage(html: string, url: string): string {
    try {
      return contentExtractorService.extract(html, url);
    } catch (error) {
      throw new ParseError('Failed to parse detail page', error);
    }
  }

  parseArticles(html: string): ArticlePreview[] {
    if (!html?.trim()) {
      throw new ParseError('Empty HTML provided to parseArticles');
    }

    try {
      const $ = cheerio.load(html);
      const elements = this.elementFinder.findElements($, ARTICLE_SELECTORS);
      const articles: ArticlePreview[] = [];

      elements.each((_, element) => {
        const article = this.parseArticleElement($(element));
        if (article) {
          articles.push(article);
        }
      });

      logger.info({ count: articles.length }, 'Parsed articles from listing page');
      return articles;
    } catch (error) {
      if (error instanceof ParseError) {
        throw error;
      }
      throw new ParseError('Failed to parse HTML', error);
    }
  }

  private parseArticleElement(element: cheerio.Cheerio<AnyNode>): ArticlePreview | null {
    try {
      const title = this.textExtractor.extractText(element, TITLE_SELECTORS);
      if (!title) {
        logger.debug('Skipping article element: no title found');
        return null;
      }

      const rawLink = element.find('a').first().attr('href') || '';
      const link = this.linkNormalizer.normalize(rawLink);

      if (!this.linkNormalizer.isValid(link)) {
        logger.debug({ title }, 'Skipping article: invalid or missing link');
        return null;
      }

      const description = this.textExtractor.extractDescription(
        element,
        DESCRIPTION_SELECTORS,
        title
      );
      const dateText = this.textExtractor.extractDateText(element, DATE_SELECTORS);
      const date = this.parseGermanDate(dateText);

      return {
        title: title.trim(),
        date,
        link,
        description: description.trim(),
      };
    } catch (error) {
      // Continue parsing other articles; individual failures should not abort the run
      logger.warn({ error }, 'Failed to parse individual article');
      return null;
    }
  }
}

export const parserService = new ParserService();
