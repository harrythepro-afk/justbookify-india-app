import type { Href } from 'expo-router';

import { openScreen } from '@/navigation/openGuard';
import type { BookCard as BookCardData } from '@/shopify/hooks/catalogue';

/** The book page's address for one book (P6-05). The handle is the only parameter. */
export function bookHref(handle: string): Href {
  return { pathname: '/book/[handle]', params: { handle } };
}

/**
 * Opens a book's page, through the shared guard, so a double tap opens it once (D-099). A plain
 * function, not a hook, so every card in a list gets the same one and the memoised cards do not
 * redraw (D-093).
 */
export function openBook(book: Pick<BookCardData, 'handle'>): void {
  openScreen(bookHref(book.handle));
}
