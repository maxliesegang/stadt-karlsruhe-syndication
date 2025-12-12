# AGENTS.md - Guide for AI Agents

This document provides guidance for AI agents (like Claude, GPT, etc.) working on the Stadt Karlsruhe Syndication project.

## Project Overview

This is a TypeScript-based web scraper that generates an Atom feed from the Stadt Karlsruhe news website. It runs on a schedule via GitHub Actions and auto-deploys to GitHub Pages.

**Key Features:**

- Scrapes karlsruhe.de/aktuelles for news articles
- Fetches full content from detail pages
- Generates valid Atom feed with complete article text
- Tracks article changes with MD5 hashing
- Auto-updates every 4 hours via GitHub Actions
- Stable IDs using MD5 hash of content + date
- German landing page with feed link

## Architecture

### Modern Stack

- **TypeScript** - Strict mode, ES2022 target
- **Service-oriented architecture** - Separated concerns
- **Zod** - Runtime validation
- **Pino** - Structured logging
- **Vitest** - Testing framework
- **ofetch** - HTTP client with retry logic
- **@mozilla/readability** - Clean article content extraction
- **jsdom** - DOM implementation for Readability

### Directory Structure

```
src/
├── index.ts              # Main entry point - orchestrates workflow
├── lib/                  # Shared utilities
│   ├── env.ts           # Environment config with zod validation
│   ├── logger.ts        # Pino logger instance
│   └── errors.ts        # Custom error classes
├── services/            # Business logic
│   ├── scraper.service.ts    # HTTP fetching (listing + detail pages)
│   ├── parser.service.ts     # HTML parsing, date handling, ID generation
│   ├── tracking.service.ts   # Change detection with hash-based IDs
│   └── feed.service.ts       # Atom feed generation
├── schemas/             # Zod schemas
│   └── article.ts       # Article & tracking data schemas
└── __tests__/           # Test files
    └── parser.test.ts
docs/
├── feed.atom            # Generated Atom feed
└── index.html           # German landing page with feed link
data/
└── tracking.json        # Article tracking state
```

## Key Patterns

### 1. Environment Configuration

All configuration is managed through [src/lib/env.ts](src/lib/env.ts) using Zod schemas:

```typescript
import { env } from './lib/env.js';
// env.SOURCE_URL, env.FEED_TITLE, etc.
```

**DO:**

- Add new config to the Zod schema in env.ts
- Use environment variables for deployment-specific values
- Provide sensible defaults

**DON'T:**

- Hardcode URLs or configuration values
- Use process.env directly outside env.ts

### 2. Logging

Use the Pino logger from [src/lib/logger.ts](src/lib/logger.ts):

```typescript
import { logger } from './lib/logger.js';

logger.info({ url, size }, 'HTML fetched successfully');
logger.error({ error }, 'Failed to parse article');
```

**DO:**

- Include structured context in log objects
- Use appropriate log levels (debug, info, warn, error)
- Log start/end of major operations

**DON'T:**

- Use console.log/console.error
- Log sensitive information
- Overuse debug logging in production code

### 3. Error Handling

Use custom error classes from [src/lib/errors.ts](src/lib/errors.ts):

```typescript
import { FetchError, ParseError } from './lib/errors.js';

throw new FetchError('Failed to fetch HTML', originalError);
```

**Available error types:**

- `FetchError` - HTTP request failures
- `ParseError` - HTML parsing issues
- `ValidationError` - Zod validation failures
- `FileSystemError` - File I/O problems
- `ScraperError` - Base class for custom errors

**DO:**

- Wrap external errors in custom error classes
- Include the original error as `cause`
- Log errors with context before throwing

**DON'T:**

- Silently swallow errors
- Throw generic Error objects
- Lose error stack traces

### 4. Data Validation

Use Zod schemas from [src/schemas/article.ts](src/schemas/article.ts):

```typescript
import { articleSchema } from '../schemas/article.js';

const validated = articleSchema.parse(rawData);
```

**DO:**

- Validate all external data (HTML parsing, file I/O)
- Use `.parse()` to throw on invalid data
- Use `.safeParse()` when errors should be handled gracefully

**DON'T:**

- Skip validation for "trusted" sources
- Assume scraped data is well-formed

### 5. Service Layer

Each service is a singleton class exported as an instance:

```typescript
export class ScraperService {
  async fetchHTML(url: string): Promise<string> {
    // implementation
  }
}

export const scraperService = new ScraperService();
```

**DO:**

- Keep services focused on a single responsibility
- Make methods async when doing I/O
- Include proper error handling and logging
- Export both the class (for testing) and instance

**DON'T:**

- Mix concerns across services
- Make services stateful (prefer pure functions)
- Skip logging in service methods

## Common Tasks

### Adding a New Configuration Option

1. Update [src/lib/env.ts](src/lib/env.ts):

   ```typescript
   const envSchema = z.object({
     // ...
     NEW_OPTION: z.string().default('default-value'),
   });
   ```

2. Update [.env.example](.env.example):

   ```bash
   NEW_OPTION=default-value
   ```

3. Use in code:
   ```typescript
   import { env } from './lib/env.js';
   const value = env.NEW_OPTION;
   ```

### Improving the Parser

The parser is in [src/services/parser.service.ts](src/services/parser.service.ts).

**Common scenarios:**

1. **Website structure changed:**
   - Update selectors in `parseArticles()` method
   - Add new selector to the `selectors` array
   - Test with `npm run start`

2. **New date format:**
   - Add pattern to `parseGermanDate()` method
   - Add test case in [src/**tests**/parser.test.ts](src/__tests__/parser.test.ts)

3. **Better content extraction:**
   - Modify the description/content selection logic
   - Consider fetching full article pages if needed

### Adding Tests

Use Vitest. Example in [src/**tests**/parser.test.ts](src/__tests__/parser.test.ts):

```typescript
import { describe, it, expect } from 'vitest';
import { MyService } from '../services/my.service.js';

describe('MyService', () => {
  it('should do something', () => {
    const service = new MyService();
    const result = service.method();
    expect(result).toBe(expected);
  });
});
```

Run tests:

```bash
npm test              # Run once
npm run test:watch    # Watch mode
```

### Debugging

1. **Enable debug logging:**

   ```bash
   LOG_LEVEL=debug npm run start
   ```

2. **Check specific service:**
   - Add more logger.debug() calls
   - Examine the structured log output

3. **Test parser changes:**
   ```bash
   npm run dev  # Watch mode
   ```

## Critical Files

### Must Preserve

- **data/tracking.json** - Article tracking state (committed to git)
- **docs/feed.atom** - Generated feed (committed to git for GitHub Pages)
- **.github/workflows/update-feed.yml** - CI/CD pipeline

### Safe to Modify

- **src/services/** - Service implementations
- **src/lib/** - Utilities (but be careful with env.ts and logger.ts)
- **src/**tests**/** - Tests
- **README.md** - Documentation

### Regenerate if Deleted

- **node_modules/** - `npm install`
- **dist/** - `npm run build`

## HTML Parsing Strategy

The website structure may change. The parser uses a two-stage approach:

### Stage 1: Listing Page (Homepage)

1. Try multiple selectors (`.article`, `[class*="news"]`, etc.)
2. First matching selector is used
3. Within each article, extract:
   - Title (h1, h2, h3, .title, etc.)
   - Link (first `a` tag) - **important for detail page fetch**
   - Description (p, .description, etc.) - **used as feed summary**
   - Date (.date, time, etc.)

### Stage 2: Detail Page (Individual Article)

1. Fetch each article's detail page using the link
2. Use **Mozilla Readability** for intelligent content extraction:
   - Automatically identifies main article content
   - Removes navigation, ads, footers, and boilerplate
   - Extracts clean, reader-friendly plain text
   - Fallback to manual extraction if Readability fails
3. Extract full text content - **used for:**
   - Feed content (complete article text)
   - ID generation (hash of content + date)

**When the parser breaks:**

1. **Listing page issues:**
   - Inspect the live website HTML
   - Update selectors in `parseArticles()` method
   - Test locally: `npm run start`

2. **Detail page issues:**
   - Mozilla Readability usually handles structure changes automatically
   - If extraction fails, check the fallback logic in `parseDetailPage()`
   - Readability works best with semantic HTML (article, main, etc.)
   - Add logging to see what's being extracted

3. **Testing:**
   - Run `LOG_LEVEL=debug npm run start` to see extraction details
   - Check Readability output in logs (title, excerpt, length)

## Date Parsing

Supports both absolute and relative German dates:

- **Relative:** "vor 12 Stunden", "Gestern", "Heute"
- **Absolute:** "9. Dezember 2025", "09.12.2025", "2025-12-09"

Add new patterns in `parseGermanDate()` method.

## ID Generation

Article IDs are MD5 hashes of: `date|content`

Example: `714e15f1b446cb950c1089311b8c30c7`

**Hash Format:**

```typescript
const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
const hashInput = `${dateStr}|${content}`;
const id = createHash('md5').update(hashInput).digest('hex');
```

**Why hash-based IDs:**

- Stable: Same content + date always produces same ID
- Content-aware: Any change to article content creates new ID
- Date-aware: Same content on different dates has different ID
- Prevents duplicate entries in feed readers
- Enables reliable change detection

## Change Detection

Uses MD5 hashing of content + date for article IDs:

1. New ID (content hash) → New article added to feed
2. Same ID, different link → Entry updated
3. Same ID, same link → lastSeen timestamp updated

Since the ID includes the content hash, any content change creates a new ID and appears as a new article.

Tracking data in `data/tracking.json` must be committed to git.

**Tracking Entry Format:**

```json
{
  "714e15f1b446cb950c1089311b8c30c7": {
    "contentHash": "714e15f1b446cb950c1089311b8c30c7",
    "lastSeen": "2025-12-12T05:35:29.047Z",
    "link": "https://www.karlsruhe.de/stadt-rathaus/aktuelles/..."
  }
}
```

## Deployment

**GitHub Actions** ([.github/workflows/update-feed.yml](.github/workflows/update-feed.yml)):

- Runs every 4 hours
- Generates new feed
- Commits changes to git
- GitHub Pages serves `docs/feed.atom`

**Manual trigger:**

- Actions tab → Update Feed → Run workflow

## Best Practices for AI Agents

1. **Read before modifying** - Always read existing files to understand context
2. **Preserve structure** - Don't reorganize without good reason
3. **Test locally** - Run `npm run start` after changes
4. **Update tests** - Add tests for new functionality
5. **Maintain logging** - Keep structured logging consistent
6. **Document changes** - Update README.md if adding features
7. **Keep it simple** - Don't over-engineer solutions
8. **Use TypeScript** - Leverage the type system, don't use `any`

## Troubleshooting

### No articles found

Check:

1. Website is accessible: `curl https://www.karlsruhe.de/aktuelles`
2. HTML structure changed: Inspect selectors in parser
3. Enable debug logging: `LOG_LEVEL=debug`

### Date parsing fails

1. Check console warnings
2. Add new pattern to `parseGermanDate()`
3. Add test case

### Feed not updating

1. Check GitHub Actions logs
2. Verify tracking.json is committed
3. Confirm GitHub Pages is enabled

## Quick Reference

```bash
# Development
npm run dev           # Watch mode
npm run start         # Run once
npm run build         # Compile TypeScript

# Testing
npm test              # Run tests
npm run test:watch    # Watch mode
npm run typecheck     # Type checking only

# Environment
cp .env.example .env  # Create local env file
```

## Contact & Resources

- **Repository:** https://github.com/YOUR_USERNAME/stadt-karlsruhe-syndication
- **Website:** https://www.karlsruhe.de/aktuelles
- **Feed URL:** https://YOUR_USERNAME.github.io/stadt-karlsruhe-syndication/feed.atom

---

**Remember:** This codebase values simplicity, maintainability, and reliability over cleverness. Keep changes focused and well-tested.
