/**
 * Content validation utilities
 * Validates that extracted content meets minimum quality standards
 */

import * as cheerio from 'cheerio';
import { CONTENT_VALIDATION } from '../config/constants.js';

export class ContentValidator {
  /**
   * Validates that content meets minimum quality standards
   * Checks for minimum length and presence of meaningful text
   * @param content - HTML or text content to validate
   * @param minLength - Minimum character length (defaults to CONTENT_VALIDATION.MIN_CONTENT_LENGTH)
   * @returns true if content is valid, false otherwise
   */
  isValid(content: string, minLength: number = CONTENT_VALIDATION.MIN_CONTENT_LENGTH): boolean {
    if (!content) return false;

    // Strip HTML tags to get plain text for length check
    const $ = cheerio.load(content);
    const textContent = $.text().trim();

    // Must have minimum length and contain meaningful text (not just whitespace/special chars)
    return (
      textContent.length >= minLength &&
      new RegExp(`\\w{${CONTENT_VALIDATION.MIN_WORD_LENGTH},}`).test(textContent)
    );
  }
}
