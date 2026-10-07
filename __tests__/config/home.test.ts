import { HOME_CONTENT } from '@/config/home';

// The architect's list from the live home page (7 October 2026), in the website's order.
describe('Home content (D-075)', () => {
  it('lists the 15 popular series in the website order', () => {
    expect(HOME_CONTENT.popularSeries.map((link) => link.handle)).toEqual([
      'dog-man-series',
      'wimpy-kid-series',
      'harry-potter-series',
      'tintin-series',
      'captain-underpants-series',
      'peppa-pig-series',
      'disney-series',
      'dork-diaries-series',
      'naruto-series',
      'geronimo-stilton',
      'ella-dairies',
      'read-it-yourself',
      'demon-slayer-series',
      'famous-five-series',
      'asterix',
    ]);
  });

  it('keeps the store handle "ella-dairies" while the tile says "Ella Diaries"', () => {
    expect(HOME_CONTENT.popularSeries).toContainEqual({
      handle: 'ella-dairies',
      label: 'Ella Diaries',
    });
  });

  it('lists the five age groups in order, with their labels', () => {
    expect(HOME_CONTENT.ageGroups).toEqual([
      { handle: 'early-readers', label: 'Up to 5 years' },
      { handle: 'emerging-readers', label: '6-8 years' },
      { handle: 'junior-readers', label: '9-10 years' },
      { handle: 'pre-teen-readers', label: '11-12 years' },
      { handle: 'teenage-readers', label: '13+ years' },
    ]);
  });

  it('shows the first 6 new arrivals', () => {
    expect(HOME_CONTENT.newArrivals).toEqual({ handle: 'new-arrivals', count: 6 });
  });

  it('has the banner wording', () => {
    expect(HOME_CONTENT.banner).toEqual({
      headline: "Children's books rental in Bengaluru",
      line: 'Now delivering across South India. No subscription. No deposit.',
      buttonLabel: 'Books for Rent',
    });
  });

  it('has unique handles and a label for every link', () => {
    const links = [...HOME_CONTENT.popularSeries, ...HOME_CONTENT.ageGroups];
    const handles = [...links.map((link) => link.handle), HOME_CONTENT.newArrivals.handle];
    expect(new Set(handles).size).toBe(handles.length);
    for (const link of links) {
      expect(link.label.trim()).not.toBe('');
      expect(link.handle).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});
