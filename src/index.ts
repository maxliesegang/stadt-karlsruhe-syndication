import { logger } from './lib/logger.js';
import { isScraperError, getErrorMessage } from './lib/errors.js';
import { syndicationService } from './services/syndication.service.js';

async function main(): Promise<void> {
  const startTime = Date.now();

  try {
    await syndicationService.run();
  } catch (error) {
    const duration = Date.now() - startTime;

    if (isScraperError(error)) {
      logger.error(
        {
          error: error.message,
          code: error.code,
          cause: error.cause,
          durationMs: duration,
        },
        'Feed generation failed'
      );
    } else {
      logger.error(
        {
          error: getErrorMessage(error),
          durationMs: duration,
        },
        'Unexpected error during feed generation'
      );
    }

    process.exit(1);
  }
}

main();
