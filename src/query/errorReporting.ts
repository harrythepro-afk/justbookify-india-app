/**
 * The one place that reports data-layer errors to Sentry (D-061). The query cache and the
 * mutation cache call it; screens and hooks never report. A StorefrontError follows the D-057
 * rule. A cancel is never reported. Any other error is reported as unexpected, by its code
 * only, because its message could carry a URL or other detail.
 */

import { CancelledError } from '@tanstack/react-query';

import { safeErrorCode } from '@/crashReporting/errorCode';
import { reportUnexpectedDataError } from '@/crashReporting/sentry';
import { reportStorefrontError, StorefrontError } from '@/shopify/errors';

function isCancel(error: unknown): boolean {
  return (
    error instanceof CancelledError ||
    (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError')
  );
}

/** `handledCodes` are the user-error codes a mutation deals with itself (D-057). */
export function reportQueryError(error: unknown, handledCodes: readonly string[] = []): void {
  if (isCancel(error)) return;
  if (error instanceof StorefrontError) {
    reportStorefrontError(error, handledCodes);
    return;
  }
  reportUnexpectedDataError(safeErrorCode(error));
}
