/**
 * When the `search` event is sent (P6-09, D-108): once per term in a visit, after its results
 * have stayed on screen for 2 seconds, at once after the search key or when a book is opened; never
 * for a sort, "Available now" or "Load more", and never once the term is gone. The wanted list
 * (P6-11, D-117): only for no results with "Available now" off, and only after the catalogue.
 */

import { act, renderHook } from '@testing-library/react-native';

import {
  SEARCH_EVENT_DELAY_MS,
  useSearchEvent,
  type SearchMatchLists,
  type ShownSearchResults,
} from '@/analytics/searchEvent';
import { parseWantedList, type WantedList } from '@/analytics/wantedList';

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
    available: false,
  };
}

type Props = {
  term: string | null;
  shown: ShownSearchResults | null;
  failed: boolean;
  lists: SearchMatchLists | null;
  wanted: WantedList | null;
};

const IDLE: Props = { term: null, shown: null, failed: false, lists: LISTS, wanted: [] };

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
  await rerender({
    ...IDLE,
    term: 'zzqxv',
    shown: { term: 'zzqxv', totalCount: 0, books: [], available: false },
  });
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

describe('the wanted list (P6-11, D-117)', () => {
  const TINTIN_SERIES = 'gid://shopify/Collection/411000000002';
  const WANTED_LISTS: SearchMatchLists = {
    ...LISTS,
    series: [...LISTS.series, { name: 'Tintin', collectionGid: TINTIN_SERIES }],
  };
  // The phone check's list (owner), plus a store author and a private-looking name.
  const WANTED = parseWantedList(
    {
      source: 'remote',
      value: JSON.stringify([
        'David Walliams',
        'Rick Riordan',
        'Tintin',
        'Harry Potter',
        'Roald Dahl',
        'Asha Rao',
        '9876543210',
      ]),
    },
    ['the'],
  ).list;
  const BASE: Props = { ...IDLE, lists: WANTED_LISTS, wanted: WANTED };

  function none(term: string, available = false): ShownSearchResults {
    return { term, totalCount: 0, books: [], available };
  }

  function sentParams() {
    return mockSendEvent.mock.calls.map(([, params]) => params);
  }

  it('sends wanted with the listed name’s code when nothing is found', async () => {
    const { rerender } = await renderEvent(BASE);

    await rerender({ ...BASE, term: 'walliams', shown: none('walliams') });
    await wait(2000);
    await rerender({ ...BASE, term: 'Rick Riordan', shown: none('Rick Riordan') });
    await wait(2000);

    expect(sentParams()).toEqual([
      { term_length: 8, result_count: 0, match_type: 'wanted', match_id: 'david_walliams' },
      { term_length: 11, result_count: 0, match_type: 'wanted', match_id: 'rick_riordan' },
    ]);
  });

  it('lets the catalogue win, also with 0 results (tintin) and with results (harry)', async () => {
    const { rerender } = await renderEvent(BASE);

    await rerender({ ...BASE, term: 'tintin', shown: none('tintin') });
    await wait(2000);
    await rerender({ ...BASE, term: 'harry', shown: results('harry', 7) });
    await wait(2000);

    expect(sentParams()).toEqual([
      { term_length: 6, result_count: 0, match_type: 'series', match_id: '411000000002' },
      { term_length: 5, result_count: 7, match_type: 'series', match_id: '411000000001' },
    ]);
  });

  it('shows a listed store author as wanted only when the search found no books', async () => {
    const dahlBook = {
      id: 'gid://shopify/Product/8000000000002',
      title: 'Matilda',
      author: 'Roald Dahl',
    };
    const { rerender } = await renderEvent(BASE);

    await rerender({
      ...BASE,
      term: 'dahl',
      shown: { term: 'dahl', totalCount: 3, books: [dahlBook], available: false },
    });
    await wait(2000);
    await rerender({ ...BASE, term: 'roald dahl', shown: none('roald dahl') });
    await wait(2000);

    expect(sentParams()).toEqual([
      { term_length: 4, result_count: 3, match_type: 'author', match_id: 'roald_dahl' },
      { term_length: 9, result_count: 0, match_type: 'wanted', match_id: 'roald_dahl' },
    ]);
  });

  it('never sends wanted with "Available now" on, or when books were found', async () => {
    const { rerender } = await renderEvent(BASE);

    await rerender({ ...BASE, term: 'walliams', shown: none('walliams', true) });
    await wait(2000);
    const unrelated = {
      id: 'gid://shopify/Product/8000000000003',
      title: 'Gangsta Granny',
      author: 'Someone Else',
    };
    await rerender({
      ...BASE,
      term: 'riordan',
      shown: { term: 'riordan', totalCount: 1, books: [unrelated], available: false },
    });
    await wait(2000);

    expect(sentParams()).toEqual([
      { term_length: 8, result_count: 0, match_type: 'other' },
      { term_length: 7, result_count: 1, match_type: 'other' },
    ]);
  });

  it('uses the "Available now" setting of the results the event is based on', async () => {
    const { rerender } = await renderEvent(BASE);

    // "Available now" switched on while the 2 seconds run: the newer results count.
    await rerender({ ...BASE, term: 'walliams', shown: none('walliams') });
    await wait(1000);
    await rerender({ ...BASE, term: 'walliams', shown: null });
    await wait(500);
    await rerender({ ...BASE, term: 'walliams', shown: none('walliams', true) });
    await wait(500);

    expect(sentParams()).toEqual([{ term_length: 8, result_count: 0, match_type: 'other' }]);
  });

  it('waits for this launch’s wanted list, so a match is not missed', async () => {
    const { rerender } = await renderEvent({ ...BASE, wanted: null });

    await rerender({ ...BASE, wanted: null, term: 'walliams', shown: none('walliams') });
    await wait(5000);
    expect(mockSendEvent).not.toHaveBeenCalled();

    await rerender({ ...BASE, term: 'walliams', shown: none('walliams') });
    expect(sentParams()).toEqual([
      { term_length: 8, result_count: 0, match_type: 'wanted', match_id: 'david_walliams' },
    ]);
  });

  it('sends other with an empty list', async () => {
    const { rerender } = await renderEvent({ ...BASE, wanted: [] });

    await rerender({ ...BASE, wanted: [], term: 'walliams', shown: none('walliams') });
    await wait(2000);

    expect(sentParams()).toEqual([{ term_length: 8, result_count: 0, match_type: 'other' }]);
  });

  it('never puts a private-looking term, or any part of it, in an event', async () => {
    const { rerender } = await renderEvent(BASE);
    const terms = ['Asha Rao 9876543210', '9876543210', 'asha.rao@example.com', '-walliams'];

    for (const term of terms) {
      await rerender({ ...BASE, term, shown: none(term) });
      await wait(2000);
    }

    expect(sentParams()).toEqual(
      terms.map(() => expect.objectContaining({ result_count: 0, match_type: 'other' })),
    );
    const sent = JSON.stringify(mockSendEvent.mock.calls);
    for (const part of ['asha', 'rao', '9876543210', 'example', 'walliams']) {
      expect(sent.toLowerCase()).not.toContain(part);
    }
  });
});
