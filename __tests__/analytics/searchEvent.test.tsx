/**
 * When the `search` event is sent (P6-09, D-108): once per term in a visit, after its results
 * have stayed on screen for 2 seconds, at once after the search key or when a book is opened; never
 * for a sort, "Available now" or "Load more", and never once the term is gone.
 */

import { act, renderHook } from '@testing-library/react-native';

import {
  SEARCH_EVENT_DELAY_MS,
  useSearchEvent,
  type SearchMatchLists,
  type ShownSearchResults,
} from '@/analytics/searchEvent';

let mockGranted = true;
const mockSendEvent = jest.fn((_name: string, _params: unknown) => Promise.resolve());

jest.mock('@/analytics/consent', () => ({ isAnalyticsConsentGranted: () => mockGranted }));
jest.mock('@/analytics/firebase', () => ({
  sendEvent: (name: string, params: unknown) => mockSendEvent(name, params),
  sendScreenView: () => Promise.resolve(),
}));
jest.mock('@/crashReporting/sentry', () => ({ reportAnalyticsProblem: jest.fn() }));

const HARRY_SERIES = 'gid://shopify/Collection/411000000001';

const LISTS: SearchMatchLists = {
  series: [{ name: 'Harry Potter', collectionGid: HARRY_SERIES }],
  ageGroups: [],
  genres: [],
  commonWords: ['the'],
};

function results(term: string, totalCount: number): ShownSearchResults {
  return {
    term,
    totalCount,
    books: [
      { id: 'gid://shopify/Product/8000000000001', title: 'Harry potter', author: 'J.k. Rowling' },
    ],
  };
}

type Props = {
  term: string | null;
  shown: ShownSearchResults | null;
  failed: boolean;
  lists: SearchMatchLists | null;
};

const IDLE: Props = { term: null, shown: null, failed: false, lists: LISTS };

async function renderEvent(initial: Props = IDLE) {
  return renderHook((props: Props) => useSearchEvent(props), { initialProps: initial });
}

// An async act, so React runs each render's effects before the clock moves on (fake timers).
async function wait(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

const HARRY_EVENT = [
  'search',
  { term_length: 5, result_count: 7, match_type: 'series', match_id: '411000000001' },
];

beforeEach(() => {
  jest.useFakeTimers();
  mockGranted = true;
  mockSendEvent.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

it('waits 2 seconds after the results are shown, then sends the event once', async () => {
  expect(SEARCH_EVENT_DELAY_MS).toBe(2000);
  const { rerender } = await renderEvent();

  await rerender({ ...IDLE, term: 'harry' });
  await wait(5000);
  expect(mockSendEvent).not.toHaveBeenCalled();

  await rerender({ ...IDLE, term: 'harry', shown: results('harry', 7) });
  await wait(1999);
  expect(mockSendEvent).not.toHaveBeenCalled();
  await wait(1);
  expect(mockSendEvent.mock.calls).toEqual([HARRY_EVENT]);

  await wait(10_000);
  expect(mockSendEvent).toHaveBeenCalledTimes(1);
});

it('sends nothing for a term replaced or cleared before 2 seconds', async () => {
  const { rerender } = await renderEvent();

  await rerender({ ...IDLE, term: 'harr', shown: results('harr', 7) });
  await wait(1500);
  await rerender({ ...IDLE, term: 'harry', shown: null });
  await wait(1000);
  expect(mockSendEvent).not.toHaveBeenCalled();

  await rerender({ ...IDLE, term: 'harry', shown: results('harry', 7) });
  await wait(1500);
  await rerender(IDLE);
  await wait(5000);
  expect(mockSendEvent).not.toHaveBeenCalled();
});

it('never sends a term twice in one visit, whatever its letter case', async () => {
  const { rerender } = await renderEvent();

  await rerender({ ...IDLE, term: 'harry', shown: results('harry', 7) });
  await wait(2000);
  await rerender({ ...IDLE, term: 'dahl', shown: results('dahl', 3) });
  await wait(2000);
  await rerender({ ...IDLE, term: 'Harry', shown: results('Harry', 7) });
  await wait(2000);

  expect(mockSendEvent.mock.calls.map(([, params]) => params)).toEqual([
    expect.objectContaining({ term_length: 5, result_count: 7 }),
    expect.objectContaining({ term_length: 4, result_count: 3, match_type: 'other' }),
  ]);
});

it('is not restarted or repeated by a sort, "Available now" or "Load more"', async () => {
  const { rerender } = await renderEvent();

  await rerender({ ...IDLE, term: 'harry', shown: results('harry', 7) });
  await wait(1000);
  // A new sort loads: the earlier results of the same term stay on screen.
  await rerender({ ...IDLE, term: 'harry', shown: null });
  await wait(500);
  await rerender({ ...IDLE, term: 'harry', shown: results('harry', 6) });
  await wait(500);
  expect(mockSendEvent).toHaveBeenCalledTimes(1);
  expect(mockSendEvent.mock.calls[0]?.[1]).toMatchObject({ result_count: 6 });

  // "Load more" and another sort later: nothing more.
  await rerender({ ...IDLE, term: 'harry', shown: results('harry', 7) });
  await wait(5000);
  expect(mockSendEvent).toHaveBeenCalledTimes(1);
});

it('sends at once after the search key, as soon as the results arrive', async () => {
  const { result, rerender } = await renderEvent();

  await act(async () => result.current.sendWhenShown('harry'));
  await rerender({ ...IDLE, term: 'harry' });
  expect(mockSendEvent).not.toHaveBeenCalled();
  await rerender({ ...IDLE, term: 'harry', shown: results('harry', 7) });
  expect(mockSendEvent.mock.calls).toEqual([HARRY_EVENT]);

  await wait(5000);
  expect(mockSendEvent).toHaveBeenCalledTimes(1);
});

it('sends at once after the search key when the results are already shown', async () => {
  const { result, rerender } = await renderEvent();

  await rerender({ ...IDLE, term: 'harry', shown: results('harry', 7) });
  await wait(500);
  await act(async () => result.current.sendWhenShown('harry'));
  expect(mockSendEvent.mock.calls).toEqual([HARRY_EVENT]);
  await wait(5000);
  expect(mockSendEvent).toHaveBeenCalledTimes(1);
});

it('sends at once when a book is opened before 2 seconds (owner, plan review)', async () => {
  const { result, rerender } = await renderEvent();

  await rerender({ ...IDLE, term: 'harry', shown: results('harry', 7) });
  await wait(300);
  await act(async () => result.current.sendNow());
  expect(mockSendEvent.mock.calls).toEqual([HARRY_EVENT]);
  await act(async () => result.current.sendNow());
  await wait(5000);
  expect(mockSendEvent).toHaveBeenCalledTimes(1);
});

it('sends nothing when a book is opened while no results of the term are shown', async () => {
  const { result, rerender } = await renderEvent();

  await rerender({ ...IDLE, term: 'harry' });
  await act(async () => result.current.sendNow());
  expect(mockSendEvent).not.toHaveBeenCalled();
});

it('sends nothing while an error replaces the results, and starts again on success', async () => {
  const { rerender } = await renderEvent();

  await rerender({ ...IDLE, term: 'harry', shown: results('harry', 7) });
  await wait(1000);
  await rerender({ ...IDLE, term: 'harry', shown: null, failed: true });
  await wait(5000);
  expect(mockSendEvent).not.toHaveBeenCalled();

  await rerender({ ...IDLE, term: 'harry', shown: results('harry', 7) });
  await wait(2000);
  expect(mockSendEvent.mock.calls).toEqual([HARRY_EVENT]);
});

it('waits for the store’s series, age groups and genres, so a match is not missed', async () => {
  const { rerender } = await renderEvent({ ...IDLE, lists: null });

  await rerender({ ...IDLE, lists: null, term: 'harry', shown: results('harry', 7) });
  await wait(5000);
  expect(mockSendEvent).not.toHaveBeenCalled();

  await rerender({ ...IDLE, term: 'harry', shown: results('harry', 7) });
  expect(mockSendEvent.mock.calls).toEqual([HARRY_EVENT]);
});

it('sends nothing after the screen closes', async () => {
  const { rerender, unmount } = await renderEvent();

  await rerender({ ...IDLE, term: 'harry', shown: results('harry', 7) });
  await wait(1000);
  await unmount();
  await wait(5000);
  expect(mockSendEvent).not.toHaveBeenCalled();
});

it('caps the count at Shopify’s 1,000 and sends 0 for no results', async () => {
  const { rerender } = await renderEvent();

  await rerender({ ...IDLE, term: 'the', shown: results('the', 4000) });
  await wait(2000);
  await rerender({ ...IDLE, term: 'zzqxv', shown: { term: 'zzqxv', totalCount: 0, books: [] } });
  await wait(2000);

  expect(mockSendEvent.mock.calls).toEqual([
    ['search', { term_length: 3, result_count: 1000, match_type: 'other' }],
    ['search', { term_length: 5, result_count: 0, match_type: 'other' }],
  ]);
});

it('counts only letters and digits, as the search does (D-097)', async () => {
  const { rerender } = await renderEvent();

  await rerender({ ...IDLE, term: 'r. dahl!', shown: results('r. dahl!', 3) });
  await wait(2000);

  expect(mockSendEvent.mock.calls[0]?.[1]).toMatchObject({ term_length: 5 });
});

it('sends nothing without consent', async () => {
  mockGranted = false;
  const { result, rerender } = await renderEvent();

  await rerender({ ...IDLE, term: 'harry', shown: results('harry', 7) });
  await wait(2000);
  await act(async () => result.current.sendWhenShown('harry'));

  expect(mockSendEvent).not.toHaveBeenCalled();
});
