import assert from 'node:assert/strict';
import { request } from 'node:http';
import { describe, it } from 'node:test';

/**
 * `whoami` in the Functions emulator (D-162), with the committed made-up configuration. Only the
 * paths that stop before Shopify are called here: Shopify itself is faked in the unit tests, and no
 * real token exists in any test.
 */
const PROJECT = 'demo-justbookify-india';
const URL_PATH = `/${PROJECT}/asia-south1/whoami`;
const HOST = '127.0.0.1';
const PORT = 5001;

function send(
  method: string,
  headers: Record<string, string> = {},
  body?: string,
): Promise<{ status: number; headers: Record<string, unknown>; body: unknown }> {
  return new Promise((resolve, reject) => {
    const outgoing = request(
      { host: HOST, port: PORT, path: URL_PATH, method, headers },
      (incoming) => {
        const chunks: Buffer[] = [];
        incoming.on('data', (chunk: Buffer) => chunks.push(chunk));
        incoming.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let parsed: unknown = text;
          try {
            parsed = JSON.parse(text);
          } catch {
            // left as text: the assertion below shows it
          }
          resolve({ status: incoming.statusCode ?? 0, headers: incoming.headers, body: parsed });
        });
      },
    );
    outgoing.on('error', reject);
    if (body !== undefined) outgoing.write(body);
    outgoing.end();
  });
}

describe('whoami in the Functions emulator', () => {
  it('answers 401 unauthenticated with no token, not cached', async () => {
    const response = await send('GET');
    assert.equal(response.status, 401);
    assert.deepEqual(response.body, { error: 'unauthenticated' });
    assert.equal(response.headers['cache-control'], 'no-store');
  });

  it('answers 401 for a malformed token without calling Shopify', async () => {
    const response = await send('GET', { Authorization: 'Bearer short' });
    assert.equal(response.status, 401);
    assert.deepEqual(response.body, { error: 'unauthenticated' });
  });

  it('answers 405 to another method', async () => {
    const response = await send('POST', { 'Content-Type': 'application/json' }, '{}');
    assert.equal(response.status, 405);
    assert.deepEqual(response.body, { error: 'method_not_allowed' });
    assert.equal(response.headers.allow, 'GET');
  });

  it('answers 413 to a GET with a body', async () => {
    const response = await send(
      'GET',
      { 'Content-Type': 'application/json', 'Content-Length': '2' },
      '{}',
    );
    assert.equal(response.status, 413);
    assert.deepEqual(response.body, { error: 'payload_too_large' });
  });

  it('sends no CORS headers (the caller is the app, never a web page)', async () => {
    const response = await send('GET', { Origin: 'https://example.example' });
    assert.equal(response.headers['access-control-allow-origin'], undefined);
  });
});
