import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

/**
 * Firestore security rules against the Firestore emulator (D-163), over its REST API: no
 * `@firebase/rules-unit-testing`, whose `firebase` peer brings the `@grpc/grpc-js` advisory the
 * backend's audit gate does not allow (D-159). A request without the emulator's admin bearer is
 * a client request and goes through the rules; `Bearer owner` is the emulator's admin and skips them.
 */
const PROJECT = 'demo-justbookify-india';
const HOST = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
const DOCUMENTS = `http://${HOST}/v1/projects/${PROJECT}/databases/(default)/documents`;
const ADMIN = { Authorization: 'Bearer owner' };

/** An unsigned ID token for a made-up signed-in user; the emulator accepts unsigned tokens. */
function fakeUserToken(): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'none', typ: 'JWT' });
  const payload = encode({
    iss: `https://securetoken.google.com/${PROJECT}`,
    aud: PROJECT,
    sub: 'fake-user-0001',
    user_id: 'fake-user-0001',
    iat: now,
    exp: now + 3600,
    auth_time: now,
    firebase: { sign_in_provider: 'custom', identities: {} },
  });
  return `${header}.${payload}.`;
}

const CALLERS: { name: string; headers: Record<string, string> }[] = [
  { name: 'signed out', headers: {} },
  { name: 'a signed-in user', headers: { Authorization: `Bearer ${fakeUserToken()}` } },
];

const PATHS = [
  'deviceTokens/fake-device-0001',
  'alertRequests/fake-alert-0001',
  'any/fake/nested/doc',
];

const FIELDS = JSON.stringify({ fields: { note: { stringValue: 'made-up' } } });

async function call(method: string, url: string, headers: Record<string, string>, body?: string) {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body !== undefined) init.body = body;
  const response = await fetch(url, init);
  return { status: response.status, text: await response.text() };
}

function collectionAndId(path: string): { collection: string; id: string } {
  const slash = path.lastIndexOf('/');
  return { collection: path.slice(0, slash), id: path.slice(slash + 1) };
}

describe('Firestore rules: every client read and write is refused', () => {
  before(async () => {
    const cleared = await fetch(
      `http://${HOST}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
      { method: 'DELETE' },
    );
    assert.equal(cleared.status, 200);
    // Each document exists, written by the admin, so a refusal is the rules and not a missing document.
    for (const path of PATHS) {
      const written = await call('PATCH', `${DOCUMENTS}/${path}`, ADMIN, FIELDS);
      assert.equal(written.status, 200, `the admin write failed: ${written.text}`);
    }
  });

  it('lets the emulator admin read (the control: the emulator is up and the data is there)', async () => {
    for (const path of PATHS) {
      assert.equal((await call('GET', `${DOCUMENTS}/${path}`, ADMIN)).status, 200, path);
    }
  });

  for (const caller of CALLERS) {
    describe(caller.name, () => {
      for (const path of PATHS) {
        const { collection, id } = collectionAndId(path);
        it(`refuses get, list, create, update and delete on ${path}`, async () => {
          const attempts = [
            await call('GET', `${DOCUMENTS}/${path}`, caller.headers),
            await call('GET', `${DOCUMENTS}/${collection}`, caller.headers),
            await call(
              'POST',
              `${DOCUMENTS}/${collection}?documentId=${id}-new`,
              caller.headers,
              FIELDS,
            ),
            await call('PATCH', `${DOCUMENTS}/${path}`, caller.headers, FIELDS),
            await call('DELETE', `${DOCUMENTS}/${path}`, caller.headers),
          ];
          for (const attempt of attempts) {
            assert.equal(attempt.status, 403, attempt.text);
            assert.match(attempt.text, /PERMISSION_DENIED/);
          }
        });
      }
    });
  }

  it('left every document as the admin wrote it', async () => {
    for (const path of PATHS) {
      const read = await call('GET', `${DOCUMENTS}/${path}`, ADMIN);
      assert.equal(read.status, 200, path);
      assert.match(read.text, /made-up/);
    }
  });
});
