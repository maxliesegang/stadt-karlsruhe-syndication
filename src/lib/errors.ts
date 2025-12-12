export class ScraperError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ScraperError';
  }
}

export class FetchError extends ScraperError {
  constructor(message: string, cause?: unknown) {
    super(message, 'FETCH_ERROR', cause);
    this.name = 'FetchError';
  }
}

export class ParseError extends ScraperError {
  constructor(message: string, cause?: unknown) {
    super(message, 'PARSE_ERROR', cause);
    this.name = 'ParseError';
  }
}

export class ValidationError extends ScraperError {
  constructor(message: string, cause?: unknown) {
    super(message, 'VALIDATION_ERROR', cause);
    this.name = 'ValidationError';
  }
}

export class FileSystemError extends ScraperError {
  constructor(message: string, cause?: unknown) {
    super(message, 'FILE_SYSTEM_ERROR', cause);
    this.name = 'FileSystemError';
  }
}

export function isScraperError(error: unknown): error is ScraperError {
  return error instanceof ScraperError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
