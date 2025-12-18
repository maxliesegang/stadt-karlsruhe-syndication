import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { ParseError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

const STRIP_SELECTORS = ['script', 'style', 'nav', 'iframe', 'noscript', 'footer', 'header'];
const PREFERRED_CONTAINERS = ['article', 'main', '.news', '.content', 'body'];
const MIN_CONTENT_LENGTH = 20; // Minimum characters for valid content

export class ContentExtractorService {
  extract(html: string, url: string): string {
    if (!html?.trim()) {
      throw new ParseError('Empty HTML provided');
    }

    const readable = this.extractWithReadability(html, url);
    if (readable && this.isValidContent(readable)) {
      return readable;
    }

    logger.warn({ url }, 'Readability failed, using fallback extraction');

    const fallback = this.extractFallbackHtml(html);
    if (fallback && this.isValidContent(fallback)) {
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
      const content = this.sanitizeHtml(htmlContent);

      logger.debug(
        {
          title: article.title,
          length: content.length,
          excerpt: article.excerpt,
        },
        'Extracted article with Readability'
      );

      return content || null;
    }

    const textContent = (article.textContent || '').trim();
    const structuredContent = this.buildHtmlFromPlainText(textContent);

    if (!structuredContent) {
      return null;
    }

    const content = this.sanitizeHtml(structuredContent);

    logger.debug(
      {
        title: article.title,
        length: content.length,
        excerpt: article.excerpt,
      },
      'Extracted article with Readability text fallback'
    );

    return content || null;
  }

  private extractFallbackHtml(html: string): string | null {
    const $ = cheerio.load(html);
    STRIP_SELECTORS.forEach((selector) => $(selector).remove());

    for (const selector of PREFERRED_CONTAINERS) {
      const container = $(selector).first();
      if (container.length) {
        const fragment = container.html();
        if (fragment) {
          return this.sanitizeHtml(fragment);
        }
      }
    }

    const body = $('body').html() || $('body').text();
    if (!body) return null;

    return this.sanitizeHtml(body);
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

  private sanitizeHtml(content: string): string {
    if (!content?.trim()) return '';

    // Load with fragment mode to avoid wrapping in html/body tags
    const $ = cheerio.load(content, null, false);

    // Remove unwanted elements
    STRIP_SELECTORS.forEach((selector) => $(selector).remove());

    // Remove inline event handlers and styles
    $('*').each((_, el) => {
      if (!('attribs' in el) || !el.attribs) return;

      Object.keys(el.attribs).forEach((attr) => {
        if (attr.startsWith('on') || attr === 'style') {
          delete el.attribs[attr];
        }
      });
    });

    // Remove empty paragraphs and excessive whitespace
    $('p').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (!text) {
        $el.remove();
      }
    });

    return $.html().trim();
  }

  private isValidContent(content: string): boolean {
    if (!content) return false;

    // Strip HTML tags to get plain text for length check
    const $ = cheerio.load(content);
    const textContent = $.text().trim();

    // Must have minimum length and contain meaningful text (not just whitespace/special chars)
    return textContent.length >= MIN_CONTENT_LENGTH && /\w{3,}/.test(textContent);
  }
}

export const contentExtractorService = new ContentExtractorService();
