import type { Breadcrumb, ErrorEvent, Exception, StackFrame } from '@sentry/react-native';

/**
 * Removes personal data, credentials and the store's identity from crash reports before they
 * leave the device (D-042, SECURITY.md). Pure functions: Sentry's `beforeSend` and
 * `beforeBreadcrumb` call them, and the unit tests call them directly.
 *
 * Stack-frame file names, function names and line numbers are kept, so stack traces still
 * resolve. Native crash reports never pass through here; Sentry's server-side data scrubbing
 * covers those.
 */

/** Values known only at runtime, from the store configuration, that must never be sent. */
export type SensitiveValues = {
  readonly storeDomain?: string;
  readonly storefrontToken?: string;
  /** The shop's numeric ID (login configuration, D-120), removed as the store domain is. */
  readonly shopId?: string;
  /** The customer's access, refresh and ID tokens held in memory (D-121). */
  readonly customerTokens?: readonly string[];
};

export const FILTERED = '[Filtered]';
export const STORE = '[store]';

// Breadcrumb data and `extra` keys whose values are dropped whole, whatever they contain.
// `token` also covers access_token, refresh_token, id_token and id_token_hint. P7-01 adds the
// login's own values: the nonce, the PKCE verifier and challenge, the authorization code and state.
const SENSITIVE_KEY =
  /e-?mail|phone|mobile|address|street|city|postal|pincode|zip|name|token|secret|password|passwd|authori[sz]ation|cookie|credit|card|upi|nonce|verifier|code_?challenge|^code$|^state$/i;

const URL_QUERY_OR_FRAGMENT = /\b(https?:\/\/[^\s?#"'<>]*)[?#][^\s"'<>]*/gi;
// The same for an app path such as /account?tab=orders.
const PATH_QUERY_OR_FRAGMENT = /(^|[\s"'(])(\/[^\s?#"'<>]*)[?#][^\s"'<>]*/g;
// The login callback (D-120), shop.<shop ID>.app://callback?code=…&state=…, removed whole: its
// scheme names the shop and its query holds the authorization code.
const LOGIN_CALLBACK = /\bshop\.\d{1,20}\.app:\/\/[^\s"'<>]*/gi;
// Any other app scheme's query or fragment, as for https above.
const APP_SCHEME_QUERY_OR_FRAGMENT = /\b([a-z][a-z0-9+.-]*:\/\/[^\s?#"'<>]*)[?#][^\s"'<>]*/gi;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const JWT = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;
// Shopify's secret tokens carry a prefix such as shpat_ or shpss_ (see src/config/store.ts).
const SHOPIFY_SECRET = /\bshp[a-z]{2}_[A-Za-z0-9]+/gi;
// Shopify's customer account tokens. Shopify's docs name no prefix (checked 13 October 2026), so
// the shc…_ form is covered by shape too; the tokens held in memory are also removed by value.
const SHOPIFY_CUSTOMER_TOKEN = /\bshc[a-z]{1,4}_[A-Za-z0-9_-]+/gi;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PERSONAL_GID =
  /gid:\/\/shopify\/(Customer|CustomerAddress|MailingAddress|Order|Checkout|Cart)\/[^\s"'<>]+/g;
const MYSHOPIFY_HOST = /\b[a-z0-9][a-z0-9-]*\.myshopify\.com\b/gi;
// Phone numbers: Indian mobiles with an optional +91, 91 or 0 prefix; landlines with a leading
// 0; anything written with a leading +. The leading group stops a match inside a longer number.
const PHONE_PATTERNS = [
  /(^|\D)((?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5})(?!\d)/g,
  /(^|\D)(0\d{2,4}[\s-]?\d{6,8})(?!\d)/g,
  /(^|\D)(\+\d[\d\s()-]{7,16}\d)(?!\d)/g,
];
// 24 or more letters, digits or _, with at least one letter and one digit: access tokens,
// cart and checkout tokens, keys. Hyphenated UUIDs are left alone.
const TOKEN_LIKE = /\b(?=\w*\d)(?=\w*[A-Za-z])\w{24,}\b/g;

const MAX_DEPTH = 8;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function scrubString(value: string, sensitive: SensitiveValues): string {
  let text = value;
  // By value first, before a pattern can change part of a token.
  for (const token of sensitive.customerTokens ?? []) {
    if (token.length >= 8) text = text.split(token).join(FILTERED);
  }
  text = text
    .replace(LOGIN_CALLBACK, FILTERED)
    .replace(URL_QUERY_OR_FRAGMENT, '$1')
    .replace(APP_SCHEME_QUERY_OR_FRAGMENT, '$1')
    .replace(PATH_QUERY_OR_FRAGMENT, '$1$2')
    .replace(BEARER, `Bearer ${FILTERED}`)
    .replace(JWT, FILTERED)
    .replace(SHOPIFY_SECRET, FILTERED)
    .replace(SHOPIFY_CUSTOMER_TOKEN, FILTERED)
    .replace(EMAIL, FILTERED)
    .replace(PERSONAL_GID, `gid://shopify/$1/${FILTERED}`);

  if (sensitive.storeDomain) {
    text = text.replace(new RegExp(escapeRegExp(sensitive.storeDomain), 'gi'), STORE);
  }
  text = text.replace(MYSHOPIFY_HOST, STORE);
  if (sensitive.shopId) {
    // As a whole number only, so a longer ID that contains its digits is left alone.
    text = text.replace(
      new RegExp(`(^|\\D)${escapeRegExp(sensitive.shopId)}(?!\\d)`, 'g'),
      `$1${STORE}`,
    );
  }
  if (sensitive.storefrontToken) {
    text = text.split(sensitive.storefrontToken).join(FILTERED);
  }

  for (const pattern of PHONE_PATTERNS) text = text.replace(pattern, `$1${FILTERED}`);
  return text.replace(TOKEN_LIKE, FILTERED);
}

/**
 * Scrubs every string inside `value`. With `dropSensitiveKeys`, a key that names personal data
 * or a credential has its whole value replaced, whatever its type.
 */
function scrubValue(
  value: unknown,
  sensitive: SensitiveValues,
  dropSensitiveKeys: boolean,
  depth = 0,
): unknown {
  if (typeof value === 'string') return scrubString(value, sensitive);
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return FILTERED;

  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, sensitive, dropSensitiveKeys, depth + 1));
  }
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    result[key] =
      dropSensitiveKeys && SENSITIVE_KEY.test(key)
        ? FILTERED
        : scrubValue(item, sensitive, dropSensitiveKeys, depth + 1);
  }
  return result;
}

function scrubRecord<T extends object>(
  record: T | undefined,
  sensitive: SensitiveValues,
  dropSensitiveKeys: boolean,
): T | undefined {
  return record === undefined ? undefined : (scrubValue(record, sensitive, dropSensitiveKeys) as T);
}

// Frame `vars` hold local variable values; everything else in a frame is code location.
function scrubFrames(frames: StackFrame[] | undefined): StackFrame[] | undefined {
  return frames?.map(({ vars: _vars, ...frame }) => frame);
}

function scrubException(exception: Exception, sensitive: SensitiveValues): Exception {
  return {
    ...exception,
    value: exception.value === undefined ? undefined : scrubString(exception.value, sensitive),
    mechanism:
      exception.mechanism === undefined
        ? undefined
        : {
            ...exception.mechanism,
            data: scrubRecord(exception.mechanism.data, sensitive, true),
          },
    stacktrace:
      exception.stacktrace === undefined
        ? undefined
        : { ...exception.stacktrace, frames: scrubFrames(exception.stacktrace.frames) },
  };
}

const HTTP_CATEGORIES = new Set(['http', 'fetch', 'xhr']);

/**
 * Console breadcrumbs are dropped: a log line can hold any object. HTTP breadcrumbs keep only
 * the method, the status code and the URL without its query string; bodies never leave.
 */
export function scrubBreadcrumb(
  breadcrumb: Breadcrumb,
  sensitive: SensitiveValues,
): Breadcrumb | null {
  if (breadcrumb.category === 'console') return null;

  const message =
    breadcrumb.message === undefined ? undefined : scrubString(breadcrumb.message, sensitive);

  if (breadcrumb.type === 'http' || HTTP_CATEGORIES.has(breadcrumb.category ?? '')) {
    const { method, status_code, url } = breadcrumb.data ?? {};
    return {
      ...breadcrumb,
      message,
      data: {
        method: typeof method === 'string' ? method : undefined,
        status_code: typeof status_code === 'number' ? status_code : undefined,
        url: typeof url === 'string' ? scrubString(url, sensitive) : undefined,
      },
    };
  }

  return { ...breadcrumb, message, data: scrubRecord(breadcrumb.data, sensitive, true) };
}

export function scrubEvent(event: ErrorEvent, sensitive: SensitiveValues): ErrorEvent {
  // `user` and `server_name` are removed whole.
  const { user: _user, server_name: _serverName, ...rest } = event;

  // The trace context holds only IDs the SDK generates; Sentry rejects a filtered trace ID.
  const { trace, ...otherContexts } = rest.contexts ?? {};
  const contexts = scrubRecord(otherContexts, sensitive, false) ?? {};
  if (trace !== undefined) contexts.trace = trace;
  if (contexts.device !== undefined) {
    // A device name is often its owner's name ("Asha's phone").
    const { name: _name, ...device } = contexts.device;
    contexts.device = device;
  }

  return {
    ...rest,
    message: rest.message === undefined ? undefined : scrubString(rest.message, sensitive),
    logentry:
      rest.logentry === undefined
        ? undefined
        : {
            message:
              rest.logentry.message === undefined
                ? undefined
                : scrubString(rest.logentry.message, sensitive),
            params: scrubRecord(rest.logentry.params, sensitive, false),
          },
    transaction:
      rest.transaction === undefined ? undefined : scrubString(rest.transaction, sensitive),
    // Only the address of the request is kept, and that without its query string.
    request:
      rest.request === undefined
        ? undefined
        : {
            method: rest.request.method,
            url:
              rest.request.url === undefined ? undefined : scrubString(rest.request.url, sensitive),
          },
    exception:
      rest.exception === undefined
        ? undefined
        : { values: rest.exception.values?.map((value) => scrubException(value, sensitive)) },
    threads:
      rest.threads === undefined
        ? undefined
        : {
            values: rest.threads.values.map((thread) => ({
              ...thread,
              stacktrace:
                thread.stacktrace === undefined
                  ? undefined
                  : { ...thread.stacktrace, frames: scrubFrames(thread.stacktrace.frames) },
            })),
          },
    breadcrumbs: rest.breadcrumbs
      ?.map((breadcrumb) => scrubBreadcrumb(breadcrumb, sensitive))
      .filter((breadcrumb): breadcrumb is Breadcrumb => breadcrumb !== null),
    tags: scrubRecord(rest.tags, sensitive, false),
    extra: scrubRecord(rest.extra, sensitive, true),
    contexts: rest.contexts === undefined ? undefined : contexts,
  };
}
