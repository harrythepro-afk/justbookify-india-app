import * as logger from 'firebase-functions/logger';

import { ERROR_STATUS, type ErrorCode } from './http/codes.ts';

/**
 * The backend's only logger (D-162; ESLint stops any other). An entry has a fixed shape: the
 * endpoint's event name, an outcome code and a duration. There is no free-text field, so a header,
 * token, customer ID, IP address, URL or Shopify's text cannot reach a log.
 */
export type LogEvent = 'whoami';
export type LogOutcome = 'ok' | ErrorCode;

export interface LogEntry {
  readonly event: LogEvent;
  readonly outcome: LogOutcome;
  readonly millis: number;
}

export interface Log {
  write(entry: LogEntry): void;
}

export const functionsLog: Log = {
  write(entry) {
    const fields = { outcome: entry.outcome, millis: Math.round(entry.millis) };
    if (entry.outcome === 'ok') {
      logger.info(entry.event, fields);
    } else if (ERROR_STATUS[entry.outcome] >= 500) {
      logger.error(entry.event, fields);
    } else {
      logger.warn(entry.event, fields);
    }
  },
};
