/**
 * Date utility functions for creating and manipulating dates
 * Eliminates duplicate date construction logic
 */

import { TIME_CONSTANTS } from '../config/constants.js';

/**
 * Creates a Date from day, month (0-indexed), and year
 * @param day - Day of the month (1-31)
 * @param month - Month (0-11, where 0 is January)
 * @param year - Full year (e.g., 2024)
 */
export function createDateFromParts(day: number, month: number, year: number): Date {
  return new Date(year, month, day);
}

/**
 * Creates a Date from day, month (1-indexed), and year
 * Commonly used when parsing DD.MM.YYYY formats where month is 1-12
 * @param day - Day of the month (1-31)
 * @param month - Month (1-12, where 1 is January)
 * @param year - Full year (e.g., 2024)
 */
export function createDateFromNumericParts(day: number, month: number, year: number): Date {
  return new Date(year, month - 1, day);
}

/**
 * Subtracts milliseconds from a reference date
 * @param reference - The reference date
 * @param milliseconds - Number of milliseconds to subtract
 */
export function subtractMilliseconds(reference: Date, milliseconds: number): Date {
  return new Date(reference.getTime() - milliseconds);
}

/**
 * Calculates total milliseconds from time components
 * @param config - Object with optional hours, minutes, and days
 * @returns Total milliseconds
 */
export function calculateMilliseconds(config: {
  hours?: number;
  minutes?: number;
  days?: number;
}): number {
  const { hours = 0, minutes = 0, days = 0 } = config;
  const { MILLISECONDS_PER_SECOND, SECONDS_PER_MINUTE, MINUTES_PER_HOUR, HOURS_PER_DAY } =
    TIME_CONSTANTS;

  return (
    hours * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND +
    minutes * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND +
    days * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND
  );
}
