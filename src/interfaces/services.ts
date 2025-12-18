/**
 * Explicit interfaces for all services
 *
 * These interfaces improve testability by enabling proper mocking
 * and make service contracts explicit and self-documenting
 */

import type { Article, ArticlePreview, TrackingData } from '../schemas/article.js';
import type { ChangeDetectionResult } from '../services/tracking.service.js';

/**
 * Service for fetching HTML content from URLs
 */
export interface IScraperService {
  /**
   * Fetches HTML content from a URL
   * @param url - The URL to fetch (defaults to SOURCE_URL from env)
   * @returns Promise resolving to the HTML string
   * @throws {FetchError} If the fetch operation fails
   */
  fetchHTML(url?: string): Promise<string>;
}

/**
 * Service for parsing HTML content into structured data
 */
export interface IParserService {
  /**
   * Parses a German date string into a Date object
   * @param text - German date string (e.g., "vor 2 Stunden", "15. März 2024")
   * @returns Parsed Date object
   */
  parseGermanDate(text: string): Date;

  /**
   * Generates a unique MD5 hash ID for an article
   * @param content - Article content to hash
   * @param date - Article date
   * @returns MD5 hash string (32 characters)
   */
  generateId(content: string, date: Date): string;

  /**
   * Extracts and cleans content from an article detail page
   * @param html - HTML content of the detail page
   * @param url - URL of the page (for Readability)
   * @returns Cleaned HTML content
   * @throws {ParseError} If content extraction fails
   */
  parseDetailPage(html: string, url: string): string;

  /**
   * Parses article previews from a listing page
   * @param html - HTML content of the listing page
   * @returns Array of article previews
   * @throws {ParseError} If parsing fails or HTML is empty
   */
  parseArticles(html: string): ArticlePreview[];
}

/**
 * Service for extracting readable content from HTML
 */
export interface IContentExtractorService {
  /**
   * Extracts clean, readable content from HTML
   * Uses Mozilla Readability with fallback strategies
   * @param html - Raw HTML to extract content from
   * @param url - URL of the page (for Readability context)
   * @returns Sanitized HTML content
   * @throws {ParseError} If no meaningful content can be extracted
   */
  extract(html: string, url: string): string;
}

/**
 * Service for tracking article changes over time
 */
export interface ITrackingService {
  /**
   * Loads tracking data from a JSON file
   * @param filePath - Path to the tracking file (defaults to TRACKING_FILE from env)
   * @returns Promise resolving to tracking data (empty object if file doesn't exist)
   * @throws {FileSystemError} If file read fails for reasons other than ENOENT
   */
  load(filePath?: string): Promise<TrackingData>;

  /**
   * Saves tracking data to a JSON file
   * @param tracking - Tracking data to save
   * @param filePath - Path to the tracking file (defaults to TRACKING_FILE from env)
   * @returns Promise that resolves when save is complete
   * @throws {FileSystemError} If file write fails
   */
  save(tracking: TrackingData, filePath?: string): Promise<void>;

  /**
   * Detects changes in articles compared to tracking data
   * This is a pure function - it does not mutate the input tracking data
   * @param articles - Current articles to check
   * @param tracking - Existing tracking data
   * @returns Object containing new/updated/unchanged articles and updated tracking data
   */
  detectChanges(articles: Article[], tracking: TrackingData): ChangeDetectionResult;
}

/**
 * Service for generating Atom feed files
 */
export interface IFeedService {
  /**
   * Generates an Atom feed XML file from articles
   * @param articles - Articles to include in the feed
   * @param outputPath - Path to write the feed file (defaults to OUTPUT_FILE from env)
   * @returns Promise that resolves when feed is written
   * @throws {FileSystemError} If file write fails
   */
  generate(articles: Article[], outputPath?: string): Promise<void>;
}

/**
 * Summary of a feed generation run
 */
export interface FeedRunSummary {
  /** Total number of articles processed */
  totalArticles: number;
  /** Number of new articles (not seen before) */
  newArticles: number;
  /** Number of updated articles (ID same, link changed) */
  updated: number;
  /** Number of unchanged articles */
  unchanged: number;
  /** Total duration of the run in milliseconds */
  durationMs: number;
}

/**
 * Main orchestration service that coordinates the feed generation process
 */
export interface ISyndicationService {
  /**
   * Runs the complete feed generation process
   * - Fetches listing page
   * - Parses article previews
   * - Fetches detail pages
   * - Detects changes
   * - Generates feed
   * - Saves tracking data
   * @returns Promise resolving to a summary of the run
   */
  run(): Promise<FeedRunSummary>;
}
