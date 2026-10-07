import { BROWSE_CONTENT, effectiveSort, HOME_CONTENT, sortOptionsFor } from '@/config';

describe('BROWSE_CONTENT (P6-04)', () => {
  it('is titled "Books for Rent"', () => {
    expect(BROWSE_CONTENT.title).toBe('Books for Rent');
  });

  it("offers Home's age groups and series, so the two lists never drift apart (D-084)", () => {
    expect(BROWSE_CONTENT.ageGroups).toBe(HOME_CONTENT.ageGroups);
    expect(BROWSE_CONTENT.series).toBe(HOME_CONTENT.popularSeries);
  });

  it("lists the website's sorts in its order and wording, without Most relevant (D-085)", () => {
    expect(BROWSE_CONTENT.sortOptions.map((option) => option.label)).toEqual([
      'Featured',
      'Best selling',
      'Alphabetically, A-Z',
      'Alphabetically, Z-A',
      'Price, low to high',
      'Price, high to low',
      'Date, old to new',
      'Date, new to old',
    ]);
  });

  it('offers Featured only inside a group', () => {
    expect(sortOptionsFor(true).map((option) => option.sort)).toContain('featured');
    expect(sortOptionsFor(false).map((option) => option.sort)).not.toContain('featured');
    expect(sortOptionsFor(false)).toHaveLength(7);
  });
});

describe('effectiveSort (D-085)', () => {
  it('defaults to A-Z for all books and Featured inside a group', () => {
    expect(effectiveSort(null, false)).toBe('title-ascending');
    expect(effectiveSort(null, true)).toBe('featured');
  });

  it('keeps a sort the customer picked when the group changes', () => {
    expect(effectiveSort('price-descending', true)).toBe('price-descending');
    expect(effectiveSort('price-descending', false)).toBe('price-descending');
  });

  it('uses A-Z for all books when the picked sort is Featured', () => {
    expect(effectiveSort('featured', true)).toBe('featured');
    expect(effectiveSort('featured', false)).toBe('title-ascending');
  });
});
