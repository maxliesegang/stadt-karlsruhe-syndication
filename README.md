# stadt-karlsruhe-syndication

Automated Atom feed generator for [Stadt Karlsruhe news](https://www.karlsruhe.de/aktuelles).

Built with modern TypeScript, service-oriented architecture, and production-ready practices.

## Features

- 🔄 Scrapes karlsruhe.de/aktuelles for latest news
- 📰 Generates valid Atom feed with full content
- 🔍 Tracks article changes with MD5 hashing
- ⏰ Auto-updates every 4 hours via GitHub Actions
- 🚀 Deploys to GitHub Pages
- ✅ Runtime validation with Zod
- 📊 Structured logging with Pino
- 🧪 Test coverage with Vitest
- 🔧 Environment-based configuration
- 🎯 Service-oriented architecture

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set your GitHub username:

```bash
GITHUB_USERNAME=your-username
```

The feed URL will be auto-generated as:

```
https://your-username.github.io/stadt-karlsruhe-syndication/feed.atom
```

Or manually set:

```bash
FEED_URL=https://your-custom-domain.com/feed.atom
```

### 3. Test Locally

```bash
bun run start
# or
npm run start
```

This will:

- Fetch the latest articles from karlsruhe.de
- Generate `docs/feed.atom`
- Create `data/tracking.json` for change tracking

### 4. Enable GitHub Pages

1. Go to your repository Settings
2. Navigate to Pages (under "Code and automation")
3. Set Source to "Deploy from a branch"
4. Select branch: `main`, folder: `/docs`
5. Click Save

### 5. Push to GitHub

```bash
git add .
git commit -m "Initial implementation"
git push
```

GitHub Actions will automatically:

- Run every 4 hours
- Update the feed
- Commit changes back to the repository

## Usage

### Feed URL

Once deployed, your feed will be available at:

```
https://<your-username>.github.io/stadt-karlsruhe-syndication/feed.atom
```

Subscribe to this URL in any feed reader (Feedly, Inoreader, NetNewsWire, etc.)

### Manual Trigger

To manually update the feed:

1. Go to the "Actions" tab in your GitHub repository
2. Select "Update Feed" workflow
3. Click "Run workflow"

### Local Development

```bash
# Run once
npm run start

# Watch mode (auto-restart on file changes)
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Type checking
npm run typecheck
```

### Environment Variables

All configuration is managed through environment variables:

| Variable          | Default                              | Description                                     |
| ----------------- | ------------------------------------ | ----------------------------------------------- |
| `SOURCE_URL`      | `https://www.karlsruhe.de/aktuelles` | News source URL                                 |
| `GITHUB_USERNAME` | -                                    | Your GitHub username (used to build `FEED_URL`) |
| `FEED_URL`        | Derived from `GITHUB_USERNAME`       | Custom feed URL (required if username missing)  |
| `MAX_ARTICLES`    | `100`                                | Maximum articles in feed                        |
| `LOG_LEVEL`       | `info`                               | Logging level (trace, debug, info, warn, error) |
| `NODE_ENV`        | `production`                         | Environment (development, production, test)     |

See [.env.example](.env.example) for all options.

## How It Works

### ID Generation

Articles are identified using a stable ID format:

```
YYYY-MM-DD_slugified-title
```

Example: `2025-12-09_neue-stadtbahn-linie-geplant`

This ensures:

- No duplicate entries
- Articles remain stable across updates
- German characters are properly handled (ä→a, ö→o, ü→u, ß→ss)

### Change Detection

The system tracks article content using MD5 hashing:

1. New articles → Added to feed
2. Content changes → Entry updated in feed
3. No changes → Last-seen timestamp updated

Tracking data is persisted in `data/tracking.json` and committed to git.

### Feed Limits

- Maximum 100 articles in feed (configurable in `src/config.ts`)
- Articles sorted by date (newest first)

## Architecture

### Project Structure

```
stadt-karlsruhe-syndication/
├── src/
│   ├── index.ts              # Main entry point
│   ├── lib/                  # Shared utilities
│   │   ├── env.ts           # Environment config (Zod validated)
│   │   ├── logger.ts        # Pino logger instance
│   │   └── errors.ts        # Custom error classes
│   ├── services/            # Business logic (service layer)
│   │   ├── scraper.service.ts    # HTTP fetching with retry
│   │   ├── parser.service.ts     # HTML parsing & date handling
│   │   ├── tracking.service.ts   # Change detection
│   │   └── feed.service.ts       # Atom feed generation
│   ├── schemas/             # Zod validation schemas
│   │   └── article.ts       # Article & tracking data schemas
│   └── __tests__/           # Test files
│       └── parser.test.ts
├── .github/workflows/
│   └── update-feed.yml      # GitHub Actions (runs every 4 hours)
├── docs/
│   └── feed.atom            # Generated feed (GitHub Pages)
├── data/
│   └── tracking.json        # Article tracking (committed to git)
├── .env.example             # Environment template
├── vitest.config.ts         # Test configuration
├── package.json
├── tsconfig.json
├── README.md
└── AGENTS.md                # Guide for AI agents
```

### Service Layer

Each service is focused on a single responsibility:

- **ScraperService** - Fetches HTML with retry logic and timeout
- **ParserService** - Extracts articles from HTML, handles German dates
- **TrackingService** - Detects new/updated articles via MD5 hashing
- **FeedService** - Generates Atom feed from articles

### Tech Stack

**Core:**

- **TypeScript** - Strict mode, type-safe development
- **Node.js** - Runtime (ES2022 modules)

**Libraries:**

- **Zod** - Runtime schema validation
- **Pino** - High-performance structured logging
- **cheerio** - Fast HTML parsing (jQuery-like API)
- **feed** - Atom/RSS feed generation
- **ofetch** - Modern fetch wrapper with retry
- **slugify** - URL-safe ID generation
- **dotenv** - Environment variable management

**Development:**

- **Vitest** - Fast unit testing framework
- **tsx** - TypeScript execution
- **TypeScript** - Type checking

**Deployment:**

- **GitHub Actions** - Scheduled automation
- **GitHub Pages** - Static feed hosting

## Troubleshooting

### No articles found

If the scraper returns 0 articles:

1. Enable debug logging: `LOG_LEVEL=debug npm run start`
2. The website HTML structure may have changed
3. Inspect karlsruhe.de/aktuelles in browser DevTools
4. Update selectors in [src/services/parser.service.ts](src/services/parser.service.ts)

### Feed not updating

1. Check GitHub Actions status in the "Actions" tab
2. Review workflow logs for errors
3. Ensure GitHub Pages is enabled and deployed from `/docs`
4. Verify `data/tracking.json` and `docs/feed.atom` are committed

### Date parsing issues

If dates aren't parsed correctly:

1. Check logs for warnings about unparsed dates
2. Add new patterns to `parseGermanDate()` in [src/services/parser.service.ts](src/services/parser.service.ts)
3. Add test cases in [src/**tests**/parser.test.ts](src/__tests__/parser.test.ts)

### Environment validation errors

If you see "Invalid environment configuration":

1. Check your `.env` file against [.env.example](.env.example)
2. Ensure required variables are set
3. Verify URLs are valid

### Debug mode

Run with detailed logging:

```bash
LOG_LEVEL=debug npm run start
```

Or set in `.env`:

```bash
LOG_LEVEL=debug
NODE_ENV=development
```

## Contributing

### For Developers

See standard development practices in the codebase. Key points:

- Write tests for new features
- Use structured logging (Pino)
- Validate data with Zod schemas
- Follow the service-oriented architecture
- Keep services focused and testable

### For AI Agents

See [AGENTS.md](AGENTS.md) for comprehensive guidance on:

- Project architecture and patterns
- Common tasks and modifications
- Best practices for code changes
- Debugging strategies
- File references and critical paths

## License

MIT
