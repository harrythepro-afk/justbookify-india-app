import { ERROR_STATUS, type ErrorCode } from './codes.ts';

/**
 * The parts of a request and response the backend uses, so handlers can be tested without the
 * Functions framework. Express's request and response (used by `onRequest`) fit these shapes.
 */
export interface RequestLike {
  readonly method: string;
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
  readonly rawBody?: Buffer | undefined;
}

export interface ResponseLike {
  status(code: number): ResponseLike;
  set(field: string, value: string): ResponseLike;
  json(body: unknown): unknown;
}

export interface GuardOptions {
  readonly methods: readonly string[];
  /** Largest accepted body in bytes. 0 for an endpoint that takes no body. */
  readonly maxBodyBytes: number;
}

/** The default body limit for later endpoints that take a JSON body (D-162). */
export const DEFAULT_MAX_BODY_BYTES = 16 * 1024;

/**
 * Checks the method and the body size before anything else runs. The platform has already read
 * the body by then (up to Cloud Run's own limit), so this limits what the handler accepts, not
 * what the platform reads (D-162).
 */
export function guardRequest(request: RequestLike, options: GuardOptions): ErrorCode | undefined {
  if (!options.methods.includes(request.method)) return 'method_not_allowed';
  const declared = request.headers['content-length'];
  if (typeof declared === 'string' && declared.trim() !== '') {
    const length = Number(declared);
    if (!Number.isSafeInteger(length) || length < 0 || length > options.maxBodyBytes) {
      return 'payload_too_large';
    }
  }
  if ((request.rawBody?.length ?? 0) > options.maxBodyBytes) return 'payload_too_large';
  return undefined;
}

export function sendJson(response: ResponseLike, status: number, body: unknown): void {
  response.status(status).set('Cache-Control', 'no-store').json(body);
}

export function sendError(
  response: ResponseLike,
  code: ErrorCode,
  allowedMethods?: readonly string[],
): void {
  if (code === 'method_not_allowed' && allowedMethods !== undefined) {
    response.set('Allow', allowedMethods.join(', '));
  }
  sendJson(response, ERROR_STATUS[code], { error: code });
}
