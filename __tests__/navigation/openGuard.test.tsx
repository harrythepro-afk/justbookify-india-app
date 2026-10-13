/**
 * The double-tap guard (P6-06 review, D-099): every in-app open goes through one guard, and a
 * second open within 0.5 s of the last one is ignored. On the phone, a double tap on a book card
 * and on the search button opened the screen twice; a series tile and an age chip did not, but go
 * through the same guard. Fake timers move the clock, so each case sits just inside or just
 * outside the window.
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Href } from 'expo-router';
import type { ReactElement } from 'react';

import { BookCard, bookCardSummary } from '@/components/BookCard';
import { AgeChip, SeriesTile } from '@/components/CollectionLinks';
import { bookHref, openBook } from '@/components/openBook';
import { SearchButton } from '@/components/SearchButton';
import {
  guardLinkPress,
  OPEN_GUARD_MS,
  openScreen,
  resetOpenGuardForTests,
} from '@/navigation/openGuard';
import { toBookCard, type BookCard as BookCardData } from '@/shopify/bookCard';

import { bookProduct } from '../helpers/catalogue';

// The card's cart button loads the analytics events (P8-01); nothing is sent here.
jest.mock('@/analytics/firebase', () => ({}));

const mockPush = jest.fn();
const mockNavigate = jest.fn();

type PressEvent = { defaultPrevented: boolean; preventDefault(): void };

// Expo Router's Link, as its source does it (expo-router 57.0.25, `BaseExpoRouterLink` and
// `useLinkToPathProps`): the `onPress` given to the link runs first, and on Android or iOS the
// link navigates only if that left the event's default alone.
jest.mock('expo-router', () => {
  const { cloneElement } = jest.requireActual<typeof import('react')>('react');
  return {
    router: {
      push: (href: unknown) => mockPush(href),
      navigate: (href: unknown) => mockNavigate(href),
    },
    Link: ({
      href,
      onPress,
      children,
    }: {
      href: unknown;
      onPress?: (event: PressEvent) => void;
      children: ReactElement<{ onPress?: (event: PressEvent) => void }>;
    }) =>
      cloneElement(children, {
        onPress: (event: PressEvent) => {
          onPress?.(event);
          if (!event.defaultPrevented) mockNavigate(href);
        },
      }),
  };
});

const CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };

function card(handle: string): BookCardData {
  const result = toBookCard(bookProduct({ handle, title: handle }), CONFIG);
  if (result === null) throw new Error('expected a card');
  return result;
}

/** A press event with a working `preventDefault`, as React Native gives one. */
function pressEvent(): PressEvent {
  return {
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  resetOpenGuardForTests();
  mockPush.mockReset();
  mockNavigate.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('openScreen', () => {
  it('ignores a second open inside the window, and opens again once it has passed', () => {
    expect(OPEN_GUARD_MS).toBe(500);

    expect(openScreen('/search')).toBe(true);
    jest.advanceTimersByTime(499);
    expect(openScreen('/search')).toBe(false);
    jest.advanceTimersByTime(1);
    expect(openScreen('/search')).toBe(true);

    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it('ignores any second open inside the window, whichever control it comes from', () => {
    openScreen(bookHref('a'));
    jest.advanceTimersByTime(100);
    openScreen('/search');
    openScreen('/browse', 'navigate');

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('pushes by default and navigates when asked', () => {
    openScreen('/search');
    jest.advanceTimersByTime(OPEN_GUARD_MS);
    openScreen('/browse', 'navigate');

    expect(mockPush).toHaveBeenCalledWith('/search');
    expect(mockNavigate).toHaveBeenCalledWith('/browse');
  });

  it('never blocks when the clock moves back', () => {
    jest.setSystemTime(new Date('2026-10-08T05:00:00Z'));
    openScreen('/search');
    jest.setSystemTime(new Date('2026-10-08T04:00:00Z'));

    expect(openScreen('/search')).toBe(true);
  });
});

describe('a book card (it opened twice on the phone)', () => {
  async function renderCards() {
    await render(
      <>
        <BookCard book={card('book-a')} onOpen={openBook} />
        <BookCard book={card('book-b')} onOpen={openBook} />
      </>,
    );
  }

  function linkOf(handle: string) {
    return screen.getByRole('link', { name: bookCardSummary(card(handle)) });
  }

  it('opens the book page once on a double tap', async () => {
    await renderCards();

    await fireEvent.press(linkOf('book-a'));
    jest.advanceTimersByTime(120);
    await fireEvent.press(linkOf('book-a'));

    expect(mockPush.mock.calls).toEqual([[bookHref('book-a')]]);
  });

  it('opens another card after Back, once the window has passed', async () => {
    await renderCards();
    await fireEvent.press(linkOf('book-a'));

    // The customer reads the page and presses Back; then taps another card.
    jest.advanceTimersByTime(OPEN_GUARD_MS + 300);
    await fireEvent.press(linkOf('book-b'));

    expect(mockPush.mock.calls).toEqual([[bookHref('book-a')], [bookHref('book-b')]]);
  });

  it('opens a different book from a book page later', () => {
    openBook({ handle: 'book-a' });
    jest.advanceTimersByTime(OPEN_GUARD_MS);
    openBook({ handle: 'book-b' });

    expect(mockPush.mock.calls).toEqual([[bookHref('book-a')], [bookHref('book-b')]]);
  });
});

describe('the search button (it opened twice on the phone)', () => {
  it('opens search once on a double tap, and again after the window', async () => {
    await render(<SearchButton />);
    const button = screen.getByRole('button', { name: 'Search' });

    await fireEvent.press(button);
    jest.advanceTimersByTime(80);
    await fireEvent.press(button);
    expect(mockPush.mock.calls).toEqual([['/search']]);

    jest.advanceTimersByTime(OPEN_GUARD_MS);
    await fireEvent.press(button);
    expect(mockPush).toHaveBeenCalledTimes(2);
  });
});

describe.each([
  ['a series tile', SeriesTile, 'Wimpy Kid'],
  ['an age chip', AgeChip, '6-8 years'],
] as const)('%s (a Link, through the same guard)', (_kind, Control, label) => {
  const href: Href = { pathname: '/collection/[handle]', params: { handle: 'some-collection' } };

  it('opens its collection once on a double tap, and again after the window', async () => {
    await render(<Control href={href} label={label} />);
    const link = screen.getByRole('link', { name: label });

    await fireEvent.press(link, pressEvent());
    jest.advanceTimersByTime(150);
    await fireEvent.press(link, pressEvent());
    expect(mockNavigate.mock.calls).toEqual([[href]]);

    jest.advanceTimersByTime(OPEN_GUARD_MS);
    await fireEvent.press(link, pressEvent());
    expect(mockNavigate).toHaveBeenCalledTimes(2);
  });
});

describe('guardLinkPress', () => {
  it('prevents the default only for a second open inside the window', () => {
    const first = pressEvent();
    const second = pressEvent();
    const later = pressEvent();

    guardLinkPress(first);
    jest.advanceTimersByTime(OPEN_GUARD_MS - 1);
    guardLinkPress(second);
    jest.advanceTimersByTime(1);
    guardLinkPress(later);

    expect([first, second, later].map((event) => event.defaultPrevented)).toEqual([
      false,
      true,
      false,
    ]);
  });
});
