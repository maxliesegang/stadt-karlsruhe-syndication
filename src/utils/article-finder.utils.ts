/**
 * Article element finder
 * Locates article elements in HTML using CSS selectors
 */

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { ParseError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export class ArticleElementFinder {
  /**
   * Finds article elements using a list of selectors
   * Tries each selector until elements are found
   * @param $ - The Cheerio instance
   * @param selectors - Array of CSS selectors to try
   * @returns Cheerio collection of found elements
   * @throws ParseError if no elements found with any selector
   */
  findElements($: cheerio.CheerioAPI, selectors: readonly string[]): cheerio.Cheerio<AnyNode> {
    for (const selector of selectors) {
      const found = $(selector);
      if (found.length > 0) {
        logger.debug({ selector, count: found.length }, 'Found article elements');
        return found;
      }
    }

    throw new ParseError('No article elements found. HTML structure may have changed.');
  }
}
