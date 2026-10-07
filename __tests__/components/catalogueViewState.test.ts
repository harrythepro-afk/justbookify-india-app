import { catalogueViewState, showsOfflineNotice } from '@/components/catalogueViewState';
import { StorefrontError } from '@/shopify/errors';

const NO_NETWORK = new StorefrontError('no-network', { operationName: 'CollectionBooks' });
const SERVER = new StorefrontError('http-error', { operationName: 'CollectionBooks', status: 503 });
const BASE = { hasData: false, isFetching: false, isOffline: false, error: null };

describe('catalogueViewState (D-078)', () => {
  it('shows data whenever there is some, offline or after a failure', () => {
    expect(catalogueViewState({ ...BASE, hasData: true, isOffline: true })).toBe('ready');
    expect(catalogueViewState({ ...BASE, hasData: true, error: SERVER })).toBe('ready');
  });

  it('is loading while a first fetch runs, also after a failure (Try again)', () => {
    expect(catalogueViewState({ ...BASE, isFetching: true })).toBe('loading');
    expect(catalogueViewState({ ...BASE, isFetching: true, error: SERVER })).toBe('loading');
    expect(catalogueViewState(BASE)).toBe('loading');
  });

  it('is offline with nothing saved, by the signal or by an unreachable Shopify', () => {
    expect(catalogueViewState({ ...BASE, isOffline: true })).toBe('offline');
    expect(catalogueViewState({ ...BASE, error: NO_NETWORK })).toBe('offline');
  });

  it('is an error for any other failure with nothing to show', () => {
    expect(catalogueViewState({ ...BASE, error: SERVER })).toBe('error');
    expect(catalogueViewState({ ...BASE, error: new Error('boom') })).toBe('error');
  });
});

describe('showsOfflineNotice', () => {
  it('shows only over saved data while offline', () => {
    expect(showsOfflineNotice({ hasData: true, isOffline: true, error: null })).toBe(true);
    expect(showsOfflineNotice({ hasData: true, isOffline: false, error: NO_NETWORK })).toBe(true);
    expect(showsOfflineNotice({ hasData: false, isOffline: true, error: null })).toBe(false);
    expect(showsOfflineNotice({ hasData: true, isOffline: false, error: SERVER })).toBe(false);
  });
});
