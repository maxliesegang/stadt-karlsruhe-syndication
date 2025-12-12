import * as cheerio from 'cheerio';
import { createHash } from 'node:crypto';
import type { ArticlePreview } from '../schemas/article.js';
import { logger } from '../lib/logger.js';
import { ParseError } from '../lib/errors.js';
import { env } from '../lib/env.js';
import { contentExtractorService } from './content-extractor.service.js';

const GERMAN_MONTHS: Record<string, number> = {
  Januar: 0,
  Februar: 1,
  März: 2,
  April: 3,
  Mai: 4,
  Juni: 5,
  Juli: 6,
  August: 7,
  September: 8,
  Oktober: 9,
  November: 10,
  Dezember: 11,
};

const ARTICLE_SELECTORS = [
  '.karlTabs__tab-pane.show.active .news-item',
  '.newsroom .news-item',
  '.newsroom__item-wrapper .news-item',
  '.article',
  '[class*="news"]',
  '[class*="meldung"]',
  '.teaser',
  '[class*="teaser"]',
  'article',
  '.content-item',
  '.list-item',
];

const TITLE_SELECTORS = [
  'h1',
  'h2',
  'h3',
  'h4',
  '.title',
  '[class*="title"]',
  '[class*="headline"]',
];
const DESCRIPTION_SELECTORS = [
  '.news-item__teaser',
  'p.mt-1',
  'p:not(.news-item__date)',
  '.description',
  '[class*="description"]',
  '.text',
  '[class*="text"]',
];
const DATE_SELECTORS = ['.date', '[class*="date"]', 'time', '.published', '[class*="published"]'];

export class ParserService {
  parseGermanDate(text: string): Date {
    const now = new Date();
    const trimmed = text.trim();

    const relativeDate = this.parseRelativeDate(trimmed, now);
    if (relativeDate) return relativeDate;

    const absoluteDate = this.parseAbsoluteDate(trimmed);
    if (absoluteDate) return absoluteDate;

    logger.warn({ dateText: trimmed }, 'Could not parse date, using current date');
    return now;
  }

  generateId(content: string, date: Date): string {
    // Generate MD5 hash of the detail page content + date
    // This ensures different dates create different IDs even for same content
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const hashInput = `${dateStr}|${content}`;
    return createHash('md5').update(hashInput).digest('hex');
  }

  parseDetailPage(html: string, url: string): string {
    try {
      return contentExtractorService.extract(html, url);
    } catch (error) {
      throw new ParseError('Failed to parse detail page', error);
    }
  }

  parseArticles(html: string): ArticlePreview[] {
    try {
      const $ = cheerio.load(html);
      const elements = this.findArticleElements($);
      const articles: ArticlePreview[] = [];

      elements.each((_, element) => {
        try {
          const $el = $(element);
          const title = this.extractText($el, TITLE_SELECTORS);
          if (!title) return;

          const link = this.normalizeLink($el.find('a').first().attr('href') || '');
          const description = this.extractDescription($el, title);
          const dateText = this.extractDateText($el);
          const date = this.parseGermanDate(dateText);

          articles.push({
            title,
            date,
            link,
            description,
          });
        } catch (error) {
          // Continue parsing other articles; individual failures should not abort the run
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          logger.warn({ error }, 'Failed to parse individual article');
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

  private parseRelativeDate(text: string, reference: Date): Date | null {
    const relativePatterns: Array<{ regex: RegExp; transform: (value: number) => number }> = [
      { regex: /vor\s+(\d+)\s+Stunden?/i, transform: (hours) => hours * 60 * 60 * 1000 },
      { regex: /vor\s+(\d+)\s+Minuten?/i, transform: (minutes) => minutes * 60 * 1000 },
      { regex: /vor\s+(\d+)\s+Tagen?/i, transform: (days) => days * 24 * 60 * 60 * 1000 },
    ];

    for (const { regex, transform } of relativePatterns) {
      const match = text.match(regex);
      if (match) {
        const value = Number.parseInt(match[1], 10);
        return new Date(reference.getTime() - transform(value));
      }
    }

    if (/gestern/i.test(text)) {
      return new Date(reference.getTime() - 24 * 60 * 60 * 1000);
    }

    if (/heute/i.test(text)) {
      return reference;
    }

    return null;
  }

  private parseAbsoluteDate(text: string): Date | null {
    const monthPattern = /(\d{1,2})\.\s+(\w+)\s+(\d{4})/;
    const numericPattern = /(\d{1,2})\.(\d{1,2})\.(\d{4})/;
    const isoPattern = /(\d{4})-(\d{2})-(\d{2})/;

    const monthMatch = text.match(monthPattern);
    if (monthMatch) {
      const [, day, monthName, year] = monthMatch;
      const month = GERMAN_MONTHS[monthName];
      if (month !== undefined) {
        return new Date(Number.parseInt(year, 10), month, Number.parseInt(day, 10));
      }
    }

    const numericMatch = text.match(numericPattern);
    if (numericMatch) {
      const [, day, month, year] = numericMatch;
      return new Date(
        Number.parseInt(year, 10),
        Number.parseInt(month, 10) - 1,
        Number.parseInt(day, 10)
      );
    }

    const isoMatch = text.match(isoPattern);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return new Date(
        Number.parseInt(year, 10),
        Number.parseInt(month, 10) - 1,
        Number.parseInt(day, 10)
      );
    }

    return null;
  }

  private extractText(
    element: cheerio.Cheerio<cheerio.AnyNode>,
    selectors: string[],
    fallback = ''
  ): string {
    for (const selector of selectors) {
      const text = element.find(selector).first().text().trim();
      if (text) return text;
    }
    return fallback.trim();
  }

  private extractDescription(element: cheerio.Cheerio<cheerio.AnyNode>, fallback: string): string {
    const description = this.extractText(element, DESCRIPTION_SELECTORS);
    if (description) return description;

    const firstParagraph = element
      .find('p')
      .filter((_, el) => !element.find(el).hasClass('news-item__date'))
      .first()
      .text()
      .trim();

    return firstParagraph || fallback;
  }

  private extractDateText(element: cheerio.Cheerio<cheerio.AnyNode>): string {
    const timeElement = element.find('time[datetime]').first();
    const dateAttr = timeElement.attr('datetime');
    if (dateAttr) {
      return dateAttr;
    }

    const dateText = this.extractText(element, DATE_SELECTORS);
    if (dateText) {
      return dateText;
    }

    return element.text();
  }

  private normalizeLink(link: string): string {
    if (!link) return env.SOURCE_URL;
    if (link.startsWith('/')) return new URL(link, env.BASE_URL).href;
    if (!link.startsWith('http')) return new URL(link, env.SOURCE_URL).href;
    return link;
  }

  private findArticleElements($: cheerio.CheerioAPI): cheerio.Cheerio<cheerio.AnyNode> {
    for (const selector of ARTICLE_SELECTORS) {
      const found = $(selector);
      if (found.length > 0) {
        logger.debug({ selector, count: found.length }, 'Found article elements');
        return found;
      }
    }

    throw new ParseError('No article elements found. HTML structure may have changed.');
  }
}

export const parserService = new ParserService();
