import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

// The Firebase project folder's settings (P10-02, D-165). The project ID is public; what matters
// is that no command can reach a real project without naming it.
const BACKEND_DIR = join(import.meta.dirname, '..', '..', '..');

function readJson(name: string): unknown {
  return JSON.parse(readFileSync(join(BACKEND_DIR, name), 'utf8'));
}

describe('.firebaserc', () => {
  it('names only the development project, under an alias, with no default', () => {
    assert.deepEqual(readJson('.firebaserc'), {
      projects: { development: 'justbookify-india-dev' },
    });
  });
});

describe('firebase.json', () => {
  it('keeps the functions on nodejs24 (D-160)', () => {
    const config = readJson('firebase.json') as { functions: { runtime: string }[] };
    assert.deepEqual(
      config.functions.map((entry) => entry.runtime),
      ['nodejs24'],
    );
  });
});
