/**
 * What the Home screen shows for the India store (P6-03, D-075): the header's store name, the
 * banner's wording, and the collections behind each row, by handle and in the website's order
 * (architect, live home page, 7 October 2026). Store-specific: a second store (Bahrain) gets its
 * own content, never a change to the screen. Collections are read by handle (D-068); a handle
 * the store does not have is not shown.
 */

export type CollectionLink = {
  /** The Shopify collection's handle. */
  readonly handle: string;
  /** What the tile or chip says. */
  readonly label: string;
};

export type HomeContent = {
  readonly storeName: string;
  readonly banner: {
    readonly headline: string;
    readonly line: string;
    /** Opens the Browse tab. */
    readonly buttonLabel: string;
  };
  /** "Popular series": a sideways row of text tiles, then "All series". */
  readonly popularSeries: readonly CollectionLink[];
  /** "Browse by age": a row of chips. */
  readonly ageGroups: readonly CollectionLink[];
  /** "New arrivals": the first `count` books, and "See all". */
  readonly newArrivals: { readonly handle: string; readonly count: number };
};

export const HOME_CONTENT: HomeContent = {
  storeName: 'JustBookify',
  banner: {
    headline: "Children's books rental in Bengaluru",
    line: 'Now delivering across South India. No subscription. No deposit.',
    buttonLabel: 'Books for Rent',
  },
  popularSeries: [
    { handle: 'dog-man-series', label: 'Dog Man' },
    { handle: 'wimpy-kid-series', label: 'Wimpy Kid' },
    { handle: 'harry-potter-series', label: 'Harry Potter' },
    { handle: 'tintin-series', label: 'Tintin' },
    { handle: 'captain-underpants-series', label: 'Captain Underpants' },
    { handle: 'peppa-pig-series', label: 'Peppa Pig' },
    { handle: 'disney-series', label: 'Disney' },
    { handle: 'dork-diaries-series', label: 'Dork Diaries' },
    { handle: 'naruto-series', label: 'Naruto' },
    { handle: 'geronimo-stilton', label: 'Geronimo Stilton' },
    // The store's handle really is spelled "dairies".
    { handle: 'ella-dairies', label: 'Ella Diaries' },
    { handle: 'read-it-yourself', label: 'Read It Yourself' },
    { handle: 'demon-slayer-series', label: 'Demon Slayer' },
    { handle: 'famous-five-series', label: 'Famous Five' },
    { handle: 'asterix', label: 'Asterix' },
  ],
  ageGroups: [
    { handle: 'early-readers', label: 'Up to 5 years' },
    { handle: 'emerging-readers', label: '6-8 years' },
    { handle: 'junior-readers', label: '9-10 years' },
    { handle: 'pre-teen-readers', label: '11-12 years' },
    { handle: 'teenage-readers', label: '13+ years' },
  ],
  newArrivals: { handle: 'new-arrivals', count: 6 },
};
