import { BROWSE_CONTENT, noResultsMessage, resultCountLabel, SEARCH_CONTENT } from '@/config';

// P6-06: the owner's wording at plan review (answer 4) and the website's search (SHOPIFY_AUDIT.md).
describe('SEARCH_CONTENT', () => {
  it('has the agreed wording', () => {
    expect(SEARCH_CONTENT.title).toBe('Search');
    expect(SEARCH_CONTENT.placeholder).toBe('Search books');
    expect(SEARCH_CONTENT.hint).toBe("Type a book's title or the author's name.");
  });

  it('offers Relevance, then the two price sorts in Browse wording, Relevance first', () => {
    expect(SEARCH_CONTENT.sortOptions).toEqual([
      { sort: 'relevance', label: 'Relevance' },
      { sort: 'price-ascending', label: 'Price, low to high' },
      { sort: 'price-descending', label: 'Price, high to low' },
    ]);
    const browseLabels = BROWSE_CONTENT.sortOptions.map((option) => option.label);
    expect(browseLabels).toEqual(
      expect.arrayContaining(SEARCH_CONTENT.sortOptions.slice(1).map((option) => option.label)),
    );
    expect(SEARCH_CONTENT.defaultSort).toBe('relevance');
  });

  it('waits 300 ms after typing, and sends at most 100 characters', () => {
    expect(SEARCH_CONTENT.typingPauseMs).toBe(300);
    expect(SEARCH_CONTENT.maxTermLength).toBe(100);
  });
});

describe('resultCountLabel', () => {
  it('reads as on the website, with Shopify’s 1,000 cap', () => {
    expect(resultCountLabel(1)).toBe('1 result');
    expect(resultCountLabel(7)).toBe('7 results');
    expect(resultCountLabel(999)).toBe('999 results');
    expect(resultCountLabel(1000)).toBe('1,000+ results');
  });
});

describe('noResultsMessage', () => {
  it('uses the website’s line with "Available now" off', () => {
    expect(noResultsMessage('zzqxv', false)).toBe(
      'No results found for “zzqxv”. Check the spelling or use a different word or phrase.',
    );
  });

  it('mentions the switch and the spelling with "Available now" on', () => {
    expect(noResultsMessage('zzqxv', true)).toBe(
      'No available books found for “zzqxv”. Switch off Available now to see rented-out books, or check the spelling.',
    );
  });
});
