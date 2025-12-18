/**
 * HTML sanitization utilities
 * Removes unwanted elements, scripts, and cleans up HTML content
 */

import * as cheerio from 'cheerio';
import { STRIP_SELECTORS } from '../config/selectors.js';

export class HtmlSanitizer {
  /**
   * Removes unwanted HTML elements
   * @param $ - Cheerio instance
   * @param selectors - Elements to remove (defaults to STRIP_SELECTORS)
   */
  removeUnwantedElements(
    $: cheerio.CheerioAPI,
    selectors: readonly string[] = STRIP_SELECTORS
  ): void {
    selectors.forEach((selector) => $(selector).remove());
  }

  /**
   * Removes inline event handlers and style attributes
   * Security measure to prevent XSS attacks
   * @param $ - Cheerio instance
   */
  removeInlineScripts($: cheerio.CheerioAPI): void {
    $('*').each((_, el) => {
      if (!('attribs' in el) || !el.attribs) return;

      Object.keys(el.attribs).forEach((attr) => {
        // Remove onclick, onload, etc. and inline styles
        if (attr.startsWith('on') || attr === 'style') {
          delete el.attribs[attr];
        }
      });
    });
  }

  /**
   * Removes empty paragraphs and elements with no text content
   * @param $ - Cheerio instance
   */
  removeEmptyParagraphs($: cheerio.CheerioAPI): void {
    $('p').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (!text) {
        $el.remove();
      }
    });
  }

  /**
   * Full HTML sanitization pipeline
   * Removes unwanted elements, inline scripts, and empty paragraphs
   * @param content - HTML content to sanitize
   * @returns Sanitized HTML
   */
  sanitize(content: string): string {
    if (!content?.trim()) return '';

    // Load with fragment mode to avoid wrapping in html/body tags
    const $ = cheerio.load(content, null, false);

    this.removeUnwantedElements($);
    this.removeInlineScripts($);
    this.removeEmptyParagraphs($);

    return $.html().trim();
  }
}
