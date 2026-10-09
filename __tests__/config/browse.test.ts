import { BROWSE_CONTENT, effectiveSort, HOME_CONTENT, sortOptionsFor } from '@/config';

describe('BROWSE_CONTENT (P6-04)', () => {
  it('is titled "Books for Rent"', () => {
    expect(BROWSE_CONTENT.title).toBe('Books for Rent');
  });

  it("offers Home's age groups, so the two lists never drift apart (D-084)", () => {
    expect(BROWSE_CONTENT.ageGroups).toBe(HOME_CONTENT.ageGroups);
  });

  it("lists Home's 15 series first, in Home's order, then the architect's 40 (D-103)", () => {
    expect(HOME_CONTENT.popularSeries).toHaveLength(15);
    expect(BROWSE_CONTENT.series.slice(0, 15)).toEqual(HOME_CONTENT.popularSeries);
    expect(
      BROWSE_CONTENT.series.slice(15).map(({ handle, label }) => `${handle} = ${label}`),
    ).toEqual([
      'a-z-mysteries = A-Z Mysteries',
      'alex-rider = Alex Rider',
      'amar-chitra-katha = Amar Chitra Katha',
      'amulet = Amulet',
      'artemis-fowl = Artemis Fowl',
      'baby-sitters-little-sister = Baby-Sitters Little Sister',
      'bad-guys = Bad Guys',
      'big-nate-series = Big Nate',
      'cat-kid-comic-club = Cat Kid Comic Club',
      'chainsaw-man = Chainsaw Man',
      'dragon-ball-z-series = Dragon Ball Z',
      'dragon-masters = Dragon Masters',
      'goosebumps-series = Goosebumps',
      'his-dark-materials = His Dark Materials',
      'horrid-henry = Horrid Henry',
      'how-to-train-your-dragon = How to Train Your Dragon',
      'i-survived = I Survived',
      'investigators = Investigators',
      'jujutsu-kaisen = Jujutsu Kaisen',
      'keeper-of-the-lost-cities = Keeper of the Lost Cities',
      'lockwood-co = Lockwood & Co.',
      'magic-tree-house-series = Magic Tree House',
      'maze-runner = Maze Runner',
      'my-hero-academia = My Hero Academia',
      'nancy-drew = Nancy Drew',
      'one-of-us = One of Us',
      'one-piece = One Piece',
      'owl-diaries = Owl Diaries',
      'percy-jackson = Percy Jackson',
      'secret-seven-series = Secret Seven',
      'the-baby-sitters-club = The Baby-Sitters Club',
      'the-hunger-games = The Hunger Games',
      'the-inheritance-games = The Inheritance Games',
      'the-kane-chronicles = The Kane Chronicles',
      'the-trials-of-apollo = The Trials of Apollo',
      'thea-stilton = Thea Stilton',
      'tinkle = Tinkle',
      'tom-gates-series = Tom Gates',
      'treehouse-series = Treehouse',
      'vagabond = Vagabond',
    ]);
  });

  it('names no series handle twice', () => {
    const handles = BROWSE_CONTENT.series.map((link) => link.handle);
    expect(new Set(handles).size).toBe(handles.length);
  });

  it('reads all books from the all-books collection (D-100)', () => {
    expect(BROWSE_CONTENT.allBooksHandle).toBe('all-books');
  });

  it("names Shopify's Genre filter and the store's genre entries, and no genre (D-101, D-102)", () => {
    expect(BROWSE_CONTENT.genre).toEqual({
      filterId: 'filter.v.t.shopify.genre',
      entryType: 'shopify--genre',
    });
    expect(JSON.stringify(BROWSE_CONTENT)).not.toMatch(/Manga|Fantasy|Fairy tale|Design/);
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
