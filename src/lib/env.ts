import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';
import { ValidationError } from './errors.js';

// Load .env file if it exists
dotenvConfig();

const envSchema = z.object({
  // Source configuration
  SOURCE_URL: z.string().url().default('https://www.karlsruhe.de/aktuelles'),
  BASE_URL: z.string().url().default('https://www.karlsruhe.de'),

  // Feed configuration
  FEED_TITLE: z.string().default('Stadt Karlsruhe - Aktuelle Meldungen'),
  FEED_DESCRIPTION: z.string().default('Offizielle Nachrichten der Stadt Karlsruhe'),
  FEED_LANGUAGE: z.string().default('de'),
  FEED_URL: z
    .string()
    .url()
    .default('https://maxliesegang.github.io/stadt-karlsruhe-syndication/feed.atom'),
  GITHUB_USERNAME: z.string().optional(),

  // Output configuration
  MAX_ARTICLES: z.coerce.number().int().positive().default(100),
  TRACKING_FILE: z.string().default('data/tracking.json'),
  OUTPUT_FILE: z.string().default('docs/feed.atom'),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  // In test mode, provide defaults without validation
  const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

  if (isTest) {
    return {
      SOURCE_URL: 'https://www.karlsruhe.de/aktuelles',
      BASE_URL: 'https://www.karlsruhe.de',
      FEED_TITLE: 'Stadt Karlsruhe - Aktuelle Meldungen',
      FEED_DESCRIPTION: 'Offizielle Nachrichten der Stadt Karlsruhe',
      FEED_LANGUAGE: 'de',
      FEED_URL: 'https://test.github.io/stadt-karlsruhe-syndication/feed.atom',
      GITHUB_USERNAME: undefined,
      MAX_ARTICLES: 100,
      TRACKING_FILE: 'data/tracking.json',
      OUTPUT_FILE: 'docs/feed.atom',
      LOG_LEVEL: 'error' as const,
      NODE_ENV: 'test' as const,
    };
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new ValidationError('Invalid environment configuration', parsed.error);
  }

  const env = parsed.data;
  const repoOwner =
    env.GITHUB_USERNAME || process.env.GITHUB_REPOSITORY?.split('/')?.[0]?.trim() || '';

  if (!env.FEED_URL) {
    if (repoOwner) {
      env.FEED_URL = `https://${repoOwner}.github.io/stadt-karlsruhe-syndication/feed.atom`;
    } else {
      throw new ValidationError(
        'FEED_URL is required. Set FEED_URL explicitly or provide GITHUB_USERNAME to auto-generate it.'
      );
    }
  }

  return env;
}

export const env = validateEnv();
