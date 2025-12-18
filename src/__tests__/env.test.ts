import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('env configuration', () => {
  const originalEnv = process.env;
  const baseEnv = { ...originalEnv };
  delete baseEnv.FEED_URL;
  delete baseEnv.GITHUB_USERNAME;
  delete baseEnv.GITHUB_REPOSITORY;
  delete baseEnv.NODE_ENV;
  delete baseEnv.VITEST;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...baseEnv,
      NODE_ENV: 'production',
      VITEST: 'false',
      BASE_URL: 'https://www.karlsruhe.de',
      SOURCE_URL: 'https://www.karlsruhe.de/aktuelles',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('generates FEED_URL from GITHUB_USERNAME', async () => {
    process.env.GITHUB_USERNAME = 'alice';

    const { env } = await import('../lib/env.js');
    expect(env.FEED_URL).toBe('https://alice.github.io/stadt-karlsruhe-syndication/feed.atom');
  });

  it('respects an explicit FEED_URL', async () => {
    process.env.FEED_URL = 'https://example.com/feed.atom';

    const { env } = await import('../lib/env.js');
    expect(env.FEED_URL).toBe('https://example.com/feed.atom');
  });

  it('throws when neither FEED_URL nor GITHUB_USERNAME is provided', async () => {
    delete process.env.GITHUB_REPOSITORY;

    await expect(import('../lib/env.js')).rejects.toThrow(
      'FEED_URL is required. Set FEED_URL explicitly or provide GITHUB_USERNAME to auto-generate it.'
    );
  });
});
