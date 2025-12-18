import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { ParseError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { STRIP_SELECTORS, PREFERRED_CONTAINERS } from '../config/selectors.js';
import { HtmlSanitizer } from '../utils/html-sanitizer.utils.js';
import { ContentValidator } from '../utils/content-validator.utils.js';
import type { IContentExtractorService } from '../interfaces/services.js';

export class ContentExtractorService implements IContentExtractorService {
  private readonly sanitizer: HtmlSanitizer;
  private readonly validator: ContentValidator;

  constructor(sanitizer?: HtmlSanitizer, validator?: ContentValidator) {
    this.sanitizer = sanitizer ?? new HtmlSanitizer();
    this.validator = validator ?? new ContentValidator();
  }

  extract(html: string, url: string): string {
    if (!html?.trim()) {
      throw new ParseError('Empty HTML provided');
    }

    const readable = this.extractWithReadability(html, url);
    if (readable && this.validator.isValid(readable)) {
      return readable;
    }

    logger.warn({ url }, 'Readability failed, using fallback extraction');

    const fallback = this.extractFallbackHtml(html);
    if (fallback && this.validator.isValid(fallback)) {
      return fallback;
    }

    throw new ParseError('Could not extract any meaningful content from detail page');
  }

  private extractWithReadability(html: string, url: string): string | null {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || (!article.content && !article.textContent)) {
      return null;
    }

    const htmlContent = (article.content || '').trim();
    if (htmlContent) {
      const content = this.sanitizer.sanitize(htmlContent);
      this.logExtraction('Readability', article, content);
      return content || null;
    }

    const textContent = (article.textContent || '').trim();
    const structuredContent = this.buildHtmlFromPlainText(textContent);

    if (!structuredContent) {
      return null;
    }

    const content = this.sanitizer.sanitize(structuredContent);
    this.logExtraction('Readability text fallback', article, content);
    return content || null;
  }

  private extractFallbackHtml(html: string): string | null {
    const $ = cheerio.load(html);
    this.sanitizer.removeUnwantedElements($, STRIP_SELECTORS);

    for (const selector of PREFERRED_CONTAINERS) {
      const container = $(selector).first();
      if (container.length) {
        const fragment = container.html();
        if (fragment) {
          return this.sanitizer.sanitize(fragment);
        }
      }
    }

    const body = $('body').html() || $('body').text();
    if (!body) return null;

    return this.sanitizer.sanitize(body);
  }

  private buildHtmlFromPlainText(textContent: string): string | null {
    const normalized = textContent.replace(/\r\n/g, '\n').trim();
    if (!normalized) return null;

    let paragraphs = normalized.split(/\n{2,}/).map((paragraph) => paragraph.trim());
    if (paragraphs.length <= 1 && normalized.includes('\n')) {
      paragraphs = normalized.split(/\n+/).map((paragraph) => paragraph.trim());
    }

    const sanitizedParagraphs = paragraphs
      .map((paragraph) => paragraph.replace(/\s+/g, ' '))
      .filter(Boolean);

    if (sanitizedParagraphs.length === 0) {
      return null;
    }

    return sanitizedParagraphs.map((paragraph) => `<p>${paragraph}</p>`).join('');
  }

  private logExtraction(
    method: string,
    article: { title?: string | null; excerpt?: string | null },
    content: string
  ): void {
    logger.debug(
      {
        title: article.title ?? undefined,
        length: content.length,
        excerpt: article.excerpt ?? undefined,
      },
      `Extracted article with ${method}`
    );
  }
}

export const contentExtractorService = new ContentExtractorService();
