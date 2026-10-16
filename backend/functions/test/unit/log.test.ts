import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { functionsLog } from '../../src/log.ts';
import { captureOutput } from '../helpers/fakes.ts';

function entries(output: string): Record<string, unknown>[] {
  return output
    .split('\n')
    .filter((line) => line.trim().startsWith('{'))
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe('functionsLog', () => {
  it('writes one structured entry with only the event, outcome and whole milliseconds', async () => {
    const output = await captureOutput(() => {
      functionsLog.write({ event: 'whoami', outcome: 'ok', millis: 12.6 });
      return Promise.resolve();
    });
    const [entry] = entries(output);
    assert.ok(entry);
    assert.equal(entry.severity, 'INFO');
    assert.equal(entry.message, 'whoami');
    assert.equal(entry.outcome, 'ok');
    assert.equal(entry.millis, 13);
    assert.deepEqual(Object.keys(entry).sort(), ['message', 'millis', 'outcome', 'severity']);
  });

  it('uses WARNING for refusals and ERROR for failures on our side or Shopify’s', async () => {
    const output = await captureOutput(() => {
      functionsLog.write({ event: 'whoami', outcome: 'unauthenticated', millis: 1 });
      functionsLog.write({ event: 'whoami', outcome: 'shopify_unavailable', millis: 1 });
      functionsLog.write({ event: 'whoami', outcome: 'internal', millis: 1 });
      return Promise.resolve();
    });
    assert.deepEqual(
      entries(output).map((entry) => entry.severity),
      ['WARNING', 'ERROR', 'ERROR'],
    );
  });
});
