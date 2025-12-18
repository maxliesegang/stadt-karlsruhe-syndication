/**
 * HTML text extraction utilities
 * Extracts and decodes text from HTML elements
 */

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

export class HtmlTextExtractor {
  /**
   * Extracts text from an element using a list of selectors
   * Tries each selector in order until text is found
   * @param element - The Cheerio element to search within
   * @param selectors - Array of CSS selectors to try
   * @param fallback - Default value if no text found
   * @returns Extracted and decoded text, or fallback
   */
  extractText(
    element: cheerio.Cheerio<AnyNode>,
    selectors: readonly string[],
    fallback = ''
  ): string {
    for (const selector of selectors) {
      const text = element.find(selector).first().text().trim();
      if (text) return this.decodeHtmlEntities(text);
    }
    return fallback.trim();
  }

  /**
   * Decodes HTML entities and normalizes whitespace
   * @param text - The text to decode
   * @returns Decoded and normalized text
   */
  decodeHtmlEntities(text: string): string {
    // Cheerio's .text() already decodes most entities, but handle edge cases
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&shy;/g, '') // Soft hyphen
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Extracts description from an element
   * Tries description selectors first, then falls back to first non-date paragraph
   * @param element - The element to extract description from
   * @param selectors - Description selectors to try
   * @param fallback - Fallback value if no description found
   * @returns Extracted description
   */
  extractDescription(
    element: cheerio.Cheerio<AnyNode>,
    selectors: readonly string[],
    fallback: string
  ): string {
    const description = this.extractText(element, selectors);
    if (description) return description;

    // Find first paragraph that doesn't have date-related classes
    const paragraphs = element.find('p');
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs.eq(i);
      const classList = p.attr('class') || '';
      if (!classList.includes('date') && !classList.includes('published')) {
        const text = p.text().trim();
        if (text) return text;
      }
    }

    return fallback;
  }

  /**
   * Extracts date text from an element
   * Checks datetime attribute first, then tries selectors
   * @param element - The element to extract date from
   * @param selectors - Date selectors to try
   * @returns Extracted date text
   */
  extractDateText(element: cheerio.Cheerio<AnyNode>, selectors: readonly string[]): string {
    // Try datetime attribute first
    const timeElement = element.find('time[datetime]').first();
    const dateAttr = timeElement.attr('datetime');
    if (dateAttr) {
      return dateAttr;
    }

    // Try selectors
    const dateText = this.extractText(element, selectors);
    if (dateText) {
      return dateText;
    }

    // Last resort: all text in element
    return element.text();
  }
}
