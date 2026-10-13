import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { BookCard, bookCardSummary } from '@/components/BookCard';
import { toBookCard, type BookCard as BookCardData } from '@/shopify/bookCard';
import { colors } from '@/theme/tokens';

import { bookProduct, EXAMPLES } from '../helpers/catalogue';

const CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };

function card(product = bookProduct()): BookCardData {
  const result = toBookCard(product, CONFIG);
  if (result === null) throw new Error('expected a card');
  return result;
}

// The card draws the cart's own button (P8-01), which is tested on its own
// (AddToCartButton.test.tsx); here a stand-in records which book it was drawn for and pressed with.
const mockAddToCart = jest.fn();
jest.mock('@/components/AddToCartButton', () => {
  const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    AddToCartButton: ({ book }: { book: { title: string } }) => (
      <Pressable
        accessibilityLabel={`Add ${book.title} to cart`}
        accessibilityRole="button"
        onPress={() => mockAddToCart(book)}
      >
        <Text>Add to Cart</Text>
      </Pressable>
    ),
  };
});

const onAddToCart = mockAddToCart;
const onNotifyMe = jest.fn();

async function renderCard(book: BookCardData) {
  return render(<BookCard book={book} cartButton onNotifyMe={onNotifyMe} />);
}

beforeEach(() => {
  onAddToCart.mockReset();
  onNotifyMe.mockReset();
});

describe('an orderable book', () => {
  it('shows the cover, title, author, prices and "Add to Cart"', async () => {
    await renderCard(card(EXAMPLES.inStock()));

    expect(screen.getByTestId('book-card-cover')).toBeOnTheScreen();
    expect(screen.getByText('Julia Donaldson')).toBeOnTheScreen();
    expect(screen.getByText('₹49')).toBeOnTheScreen();
    expect(screen.getByText('Add to Cart')).toBeOnTheScreen();
    expect(screen.queryByText('Rented Out')).not.toBeOnTheScreen();
    expect(screen.queryByText('Notify me')).not.toBeOnTheScreen();
  });

  it('strikes through the retail price', async () => {
    await renderCard(card());

    expect(StyleSheet.flatten(screen.getByText('₹350').props.style)).toMatchObject({
      textDecorationLine: 'line-through',
    });
    expect(StyleSheet.flatten(screen.getByText('₹49').props.style).fontFamily).toBe(
      'Archivo_700Bold',
    );
  });

  it('shows no retail price when there is none', async () => {
    await renderCard(card(bookProduct({ compareAtPrice: null })));

    expect(screen.queryByText('₹350')).not.toBeOnTheScreen();
  });

  it('cuts a long title to one line', async () => {
    const title = 'Harry Potter and the Deathly Hallows (Book 7), the long paperback edition';
    await renderCard(card(bookProduct({ title })));

    expect(screen.getByText(title).props.numberOfLines).toBe(1);
  });

  it('draws the cart button for the book (P8-01)', async () => {
    const book = card(EXAMPLES.inStock());
    await renderCard(book);

    await fireEvent.press(screen.getByRole('button', { name: `Add ${book.title} to cart` }));

    expect(onAddToCart).toHaveBeenCalledWith(book);
    expect(onNotifyMe).not.toHaveBeenCalled();
  });
});

describe('a book orderable at zero stock (owner, answer 4)', () => {
  it('renders exactly like an in-stock book', async () => {
    const zero = card(bookProduct({ handle: 'same', title: 'Same', currentlyNotInStock: true }));
    const inStock = card(bookProduct({ handle: 'same', title: 'Same' }));
    // Same ID too, so only availability differs.
    // Serialised, so React's per-render debug data and the callbacks are left out.
    const zeroTree = JSON.stringify((await renderCard({ ...zero, id: inStock.id })).toJSON());
    const inStockTree = JSON.stringify((await renderCard(inStock)).toJSON());

    expect(zeroTree).toEqual(inStockTree);
    expect(screen.queryByText('Rented Out')).not.toBeOnTheScreen();
  });
});

describe('a rented-out book', () => {
  it('shows the "Rented Out" badge and "Notify me" instead of "Add to Cart"', async () => {
    await renderCard(card(EXAMPLES.rentedOut()));

    expect(screen.getByText('Rented Out')).toBeOnTheScreen();
    expect(screen.getByText('Notify me')).toBeOnTheScreen();
    expect(screen.queryByText('Add to Cart')).not.toBeOnTheScreen();
  });

  it('uses the "Rented Out" badge colours', async () => {
    await renderCard(card(EXAMPLES.rentedOut()));

    expect(StyleSheet.flatten(screen.getByText('Rented Out').props.style).color).toBe(
      colors.onRentedOutBadge,
    );
  });

  it('passes the book to onNotifyMe', async () => {
    const book = card(EXAMPLES.rentedOut());
    await renderCard(book);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Notify me when The Gruffalo is back' }),
    );

    expect(onNotifyMe).toHaveBeenCalledWith(book);
    expect(onAddToCart).not.toHaveBeenCalled();
  });
});

describe('a book without a cover (owner, plan review)', () => {
  it('shows the cream frame and the book icon only, with no visible text', async () => {
    await renderCard(card(EXAMPLES.noCover()));

    const fallback = screen.getByTestId('book-card-cover-fallback');
    expect(fallback.props.accessibilityLabel).toBe('Peter and the Wolf');
    expect(screen.queryByTestId('book-card-cover')).not.toBeOnTheScreen();
    expect(screen.queryByText(/cover/i)).not.toBeOnTheScreen();
    expect(StyleSheet.flatten(fallback.props.style)).toMatchObject({
      backgroundColor: colors.coverFallback,
    });
  });
});

// Notify-me is wired later; until then no customer screen shows a dead button (D-081). The cart
// button is drawn only when the screen asks for it (P8-01).
describe('without actions (owner, P6-03)', () => {
  it('draws no "Add to Cart" without the cart button', async () => {
    await render(<BookCard book={card(EXAMPLES.inStock())} />);

    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
    expect(screen.getByText('₹49')).toBeOnTheScreen();
  });

  it('draws no "Notify me", but keeps the "Rented Out" badge', async () => {
    await render(<BookCard book={card(EXAMPLES.rentedOut())} />);

    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
    expect(screen.getByText('Rented Out')).toBeOnTheScreen();
  });

  it('draws each button only with its own action', async () => {
    // A rented-out book never has a cart button.
    await render(<BookCard book={card(EXAMPLES.rentedOut())} cartButton />);
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();

    await render(<BookCard book={card(EXAMPLES.inStock())} onNotifyMe={onNotifyMe} />);
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });
});

// A long list re-renders a card only when its props change (P6-03 phone check, slow-list warning).
it('is memoised', () => {
  expect((BookCard as unknown as { $$typeof: symbol }).$$typeof).toBe(Symbol.for('react.memo'));
});

describe('accessibility', () => {
  it('summarises the card for a screen reader', () => {
    expect(bookCardSummary(card(EXAMPLES.rentedOut()))).toBe(
      'The Gruffalo, by Julia Donaldson, ₹49, retail price ₹350, Rented out',
    );
    expect(bookCardSummary(card(bookProduct({ title: 'Kid', compareAtPrice: null })))).toBe(
      'Kid, by Julia Donaldson, ₹49',
    );
  });

  it('labels the cover with its alt text, or the title when there is none', async () => {
    const book = card(EXAMPLES.inStock());
    await renderCard(book);
    expect(screen.getByTestId('book-card-cover').props.accessibilityLabel).toBe(book.title);
  });

  // The cart button's own touch target is checked in AddToCartButton.test.tsx (P8-01).
  it('gives each button a touch target of at least 44 points', async () => {
    await renderCard(card(EXAMPLES.rentedOut()));

    const style = StyleSheet.flatten(
      screen.getByRole('button', { name: /is back$/ }).props.style,
    ) as { minHeight?: number };
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
  });
});

describe('opening the book page (P6-05)', () => {
  it('opens the book when its cover, title, author or prices are tapped', async () => {
    const onOpen = jest.fn();
    const book = card(EXAMPLES.rentedOut());
    await render(<BookCard book={book} onOpen={onOpen} />);

    const link = screen.getByRole('link', { name: bookCardSummary(book) });
    await fireEvent.press(link);

    expect(onOpen).toHaveBeenCalledWith(book);
    expect(screen.getByText('Rented Out')).toBeOnTheScreen();
  });

  it('keeps the buttons apart from the link', async () => {
    const onOpen = jest.fn();
    await render(<BookCard book={card(EXAMPLES.inStock())} cartButton onOpen={onOpen} />);

    await fireEvent.press(screen.getByRole('button', { name: /to cart$/ }));

    expect(onAddToCart).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('is no link without onOpen', async () => {
    await render(<BookCard book={card(EXAMPLES.inStock())} />);

    expect(screen.queryByRole('link')).not.toBeOnTheScreen();
  });
});
