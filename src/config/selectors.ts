/**
 * CSS selectors for HTML parsing
 * Centralized for easy maintenance and updates when the site structure changes
 */

/**
 * Selectors for finding article elements on the listing page
 * Ordered by specificity - more specific selectors first
 */
export const ARTICLE_SELECTORS = [
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
] as const;

/**
 * Selectors for extracting article titles
 */
export const TITLE_SELECTORS = [
  'h1',
  'h2',
  'h3',
  'h4',
  '.title',
  '[class*="title"]',
  '[class*="headline"]',
] as const;

/**
 * Selectors for extracting article descriptions/teasers
 */
export const DESCRIPTION_SELECTORS = [
  '.news-item__teaser',
  'p.mt-1',
  'p:not(.news-item__date)',
  '.description',
  '[class*="description"]',
  '.text',
  '[class*="text"]',
] as const;

/**
 * Selectors for extracting publication dates
 */
export const DATE_SELECTORS = [
  '.date',
  '[class*="date"]',
  'time',
  '.published',
  '[class*="published"]',
] as const;

/**
 * Elements to strip/remove from extracted content
 * These are typically navigation, scripts, or other non-content elements
 */
export const STRIP_SELECTORS = [
  'script',
  'style',
  'nav',
  'iframe',
  'noscript',
  'footer',
  'header',
] as const;

/**
 * Preferred container elements for content extraction fallback
 * Ordered by preference - check in this order
 */
export const PREFERRED_CONTAINERS = ['article', 'main', '.news', '.content', 'body'] as const;
