/**
 * Link normalization and validation utilities
 * Handles URL normalization and validation for article links
 */

export class LinkNormalizer {
  constructor(
    private readonly baseUrl: string,
    private readonly sourceUrl: string
  ) {}

  /**
   * Normalizes a link to an absolute URL
   * @param link - The link to normalize (can be relative or absolute)
   * @returns Normalized absolute URL
   */
  normalize(link: string): string {
    if (!link) return '';

    // Already absolute with protocol
    if (link.startsWith('http')) return link;

    // Root-relative path (/foo/bar)
    if (link.startsWith('/')) {
      return new URL(link, this.baseUrl).href;
    }

    // Relative path (foo/bar)
    return new URL(link, this.sourceUrl).href;
  }

  /**
   * Validates that a string is a valid URL
   * @param url - The URL to validate
   * @returns true if valid URL, false otherwise
   */
  isValid(url: string): boolean {
    if (!url) return false;

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
