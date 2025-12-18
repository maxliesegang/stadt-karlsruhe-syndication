/**
 * Branded types for type-safe strings
 *
 * These types prevent accidentally mixing different kinds of strings
 * (e.g., using a regular string where an MD5 hash is expected)
 */

/**
 * Brand symbol used to distinguish branded types at compile time
 * This symbol exists only at the type level and has no runtime cost
 */
declare const __brand: unique symbol;

/**
 * Base branded type that adds a compile-time-only brand to a type
 */
type Brand<T, TBrand extends string> = T & { readonly [__brand]: TBrand };

/**
 * MD5 hash string (32 hexadecimal characters)
 * Used for article IDs and content hashes
 */
export type MD5Hash = Brand<string, 'MD5Hash'>;

/**
 * ISO 8601 datetime string (e.g., "2024-03-15T10:30:00.000Z")
 * Used for tracking timestamps
 */
export type ISODateString = Brand<string, 'ISODateString'>;

/**
 * Valid URL string (must be absolute URL with protocol)
 * Used for article links
 */
export type ValidUrl = Brand<string, 'ValidUrl'>;

/**
 * Type guard to check if a string is a valid MD5 hash
 */
export function isMD5Hash(value: string): value is MD5Hash {
  return /^[a-f0-9]{32}$/i.test(value);
}

/**
 * Type guard to check if a string is a valid ISO date string
 */
export function isISODateString(value: string): value is ISODateString {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

/**
 * Type guard to check if a string is a valid URL
 */
export function isValidUrl(value: string): value is ValidUrl {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely cast a string to MD5Hash after validation
 * Throws if the string is not a valid MD5 hash
 */
export function toMD5Hash(value: string): MD5Hash {
  if (!isMD5Hash(value)) {
    throw new TypeError(`Invalid MD5 hash: ${value}`);
  }
  return value as MD5Hash;
}

/**
 * Safely cast a string to ISODateString after validation
 * Throws if the string is not a valid ISO date string
 */
export function toISODateString(value: string): ISODateString {
  if (!isISODateString(value)) {
    throw new TypeError(`Invalid ISO date string: ${value}`);
  }
  return value as ISODateString;
}

/**
 * Safely cast a string to ValidUrl after validation
 * Throws if the string is not a valid URL
 */
export function toValidUrl(value: string): ValidUrl {
  if (!isValidUrl(value)) {
    throw new TypeError(`Invalid URL: ${value}`);
  }
  return value as ValidUrl;
}

/**
 * Unsafe cast without validation - use only when you're certain the value is valid
 * Prefer the type guard functions or safe cast functions in production code
 */
export function unsafeCastMD5Hash(value: string): MD5Hash {
  return value as MD5Hash;
}

/**
 * Unsafe cast without validation - use only when you're certain the value is valid
 * Prefer the type guard functions or safe cast functions in production code
 */
export function unsafeCastISODateString(value: string): ISODateString {
  return value as ISODateString;
}

/**
 * Unsafe cast without validation - use only when you're certain the value is valid
 * Prefer the type guard functions or safe cast functions in production code
 */
export function unsafeCastValidUrl(value: string): ValidUrl {
  return value as ValidUrl;
}
