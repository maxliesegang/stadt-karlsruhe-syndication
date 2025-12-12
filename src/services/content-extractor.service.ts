import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { ParseError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

const STRIP_SELECTORS = ['script', 'style', 'nav', 'iframe', 'noscript'];
const PREFERRED_CONTAINERS = ['article', 'main', '.news', '.content', 'body'];

export class ContentExtractorService {
  extract(html: string, url: string): string {
    const readable = this.extractWithReadability(html, url);
    if (readable) {
      return readable;
    }

    logger.warn({ url }, 'Readability failed, using fallback extraction');

    const fallback = this.extractFallbackHtml(html);
    if (fallback) {
      return fallback;
    }

    throw new ParseError('Could not extract any content from detail page');
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
    const $ = cheerio.load(content);
    STRIP_SELECTORS.forEach((selector) => $(selector).remove());
    $('[onload],[onclick],[onerror],[style]').each((_, el) => {
      const attribs = el.attribs;
      Object.keys(attribs).forEach((attr) => {
        if (attr.startsWith('on') || attr === 'style') {
          delete attribs[attr];
        }
      });
    });

    const bodyHtml = $('body').html();
    if (bodyHtml) return bodyHtml.trim();

    return $.root().html()?.trim() || '';
  }
}

export const contentExtractorService = new ContentExtractorService();
