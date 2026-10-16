import type { RequestLike, ResponseLike } from '../../src/http/guard.ts';
import type { FetchLike } from '../../src/identity/fetchTypes.ts';

/**
 * Made-up values only (D-161): no real token, customer ID, shop ID or store domain ever appears in
 * a test. Low-entropy on purpose, so they read as fakes to people and to the secret scanner.
 */
export const FAKE_TOKEN = 'fake-access-token-0001-not-real';
export const FAKE_CUSTOMER_ID = 'gid://shopify/Customer/7000000001';
export const FAKE_STORE_DOMAIN = 'example-store.example';
export const FAKE_SHOP_ID = '1000000001';
export const FAKE_DISCOVERED_URL = `https://accounts.example/${FAKE_SHOP_ID}/account/customer/api/2026-10/graphql`;
export const FAKE_ENDPOINT = `https://accounts.example/${FAKE_SHOP_ID}/account/customer/api/2026-04/graphql`;

export class FakeResponse implements ResponseLike {
  statusCode: number | undefined;
  readonly headers: Record<string, string> = {};
  body: unknown;
  sends = 0;

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  set(field: string, value: string): this {
    this.headers[field] = value;
    return this;
  }

  json(body: unknown): this {
    this.body = body;
    this.sends += 1;
    return this;
  }
}

export function fakeRequest(overrides: Partial<RequestLike> = {}): RequestLike {
  return { method: 'GET', headers: {}, rawBody: Buffer.alloc(0), ...overrides };
}

export interface FetchCall {
  readonly url: string;
  readonly init: RequestInit;
}

export type FakeReply = Response | Error | ((call: FetchCall) => Promise<Response>);

/** A fetch that answers from a list of replies in order and records every call. */
export function fakeFetch(...replies: FakeReply[]): { fetch: FetchLike; calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  const fetch: FetchLike = async (url, init) => {
    const call = { url, init };
    calls.push(call);
    const reply = replies.shift();
    if (reply === undefined) throw new Error('unexpected fetch');
    if (reply instanceof Error) throw reply;
    if (typeof reply === 'function') return reply(call);
    return reply;
  };
  return { fetch, calls };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const discoveryReply = (): Response => jsonResponse({ graphql_api: FAKE_DISCOVERED_URL });
export const customerReply = (id: string = FAKE_CUSTOMER_ID): Response =>
  jsonResponse({ data: { customer: { id } } });

/** A reply that waits until the request's signal aborts, like a server that never answers. */
export function neverAnswers(): (call: FetchCall) => Promise<Response> {
  return (call) =>
    new Promise((_resolve, reject) => {
      const signal = call.init.signal;
      if (signal === null || signal === undefined) return;
      signal.addEventListener('abort', () => {
        reject(signal.reason instanceof Error ? signal.reason : new Error('aborted'));
      });
    });
}

/** Everything written to stdout, stderr or the console while `run` runs. */
export async function captureOutput(run: () => Promise<void>): Promise<string> {
  const chunks: string[] = [];
  const record = (value: unknown): void => {
    chunks.push(typeof value === 'string' ? value : String(value));
  };
  const stdoutWrite = process.stdout.write.bind(process.stdout);
  const stderrWrite = process.stderr.write.bind(process.stderr);
  const methods = ['log', 'info', 'warn', 'error', 'debug'] as const;
  const saved = methods.map((name) => console[name].bind(console));
  process.stdout.write = (chunk: unknown) => {
    record(chunk);
    return true;
  };
  process.stderr.write = (chunk: unknown) => {
    record(chunk);
    return true;
  };
  for (const name of methods) {
    console[name] = (...args: unknown[]) => {
      args.forEach(record);
    };
  }
  try {
    await run();
  } finally {
    process.stdout.write = stdoutWrite;
    process.stderr.write = stderrWrite;
    methods.forEach((name, index) => {
      const original = saved[index];
      if (original !== undefined) console[name] = original;
    });
  }
  return chunks.join('\n');
}
