/**
 * Application-wide constants and configuration values
 * All magic numbers and hardcoded values centralized here
 */

/**
 * Time conversion constants
 */
export const TIME_CONSTANTS = {
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
} as const;

/**
 * Content validation thresholds
 */
export const CONTENT_VALIDATION = {
  /** Minimum number of characters for valid content */
  MIN_CONTENT_LENGTH: 20,
  /** Length of MD5 hash in hexadecimal characters */
  MD5_HASH_LENGTH: 32,
  /** Minimum word length to validate content has meaningful text */
  MIN_WORD_LENGTH: 3,
} as const;

/**
 * Scraper/HTTP client configuration
 */
export const SCRAPER_CONFIG = {
  /** Maximum number of retry attempts for failed requests */
  MAX_RETRIES: 3,
  /** Delay in milliseconds between retry attempts */
  RETRY_DELAY_MS: 1000,
  /** Request timeout in milliseconds */
  REQUEST_TIMEOUT_MS: 30000,
} as const;

/**
 * German month names mapping to JavaScript month indices (0-11)
 */
export const GERMAN_MONTHS: Record<string, number> = {
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
} as const;
