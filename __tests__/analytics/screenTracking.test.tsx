import { renderHook } from '@testing-library/react-native';

import type { AnalyticsConsentState } from '@/analytics/consent';
import { screenNameFromSegments, useScreenTracking } from '@/analytics/screenTracking';

let mockSegments: string[] = ['(tabs)'];
let mockConsent: AnalyticsConsentState = { consent: 'loading', busy: false, saveFailed: false };
const mockTrackScreenView = jest.fn();

jest.mock('expo-router', () => ({ useSegments: () => mockSegments }));
jest.mock('@/analytics/consent', () => ({ useAnalyticsConsent: () => mockConsent }));
jest.mock('@/analytics/events', () => ({
  trackScreenView: (name: string) => mockTrackScreenView(name),
}));

describe('screenNameFromSegments', () => {
  it.each([
    [[], 'index'],
    [['(tabs)'], 'index'],
    [['(tabs)', 'account'], 'account'],
    [['(tabs)', 'my-books'], 'my-books'],
    [['dev-checkout'], 'dev-checkout'],
    [['(tabs)', 'book', '[id]'], 'book/[id]'],
  ])('names %p as %p', (segments, name) => {
    expect(screenNameFromSegments(segments)).toBe(name);
  });
});

describe('useScreenTracking', () => {
  beforeEach(() => {
    mockSegments = ['(tabs)'];
    mockConsent = { consent: 'loading', busy: false, saveFailed: false };
    jest.clearAllMocks();
  });

  it('logs nothing until consent is granted, then the current screen', async () => {
    mockSegments = ['(tabs)', 'account'];
    const { rerender } = await renderHook(() => useScreenTracking());
    expect(mockTrackScreenView).not.toHaveBeenCalled();

    mockConsent = { consent: 'granted', busy: false, saveFailed: false };
    await rerender({});

    expect(mockTrackScreenView).toHaveBeenCalledWith('account');
  });

  it('logs each route change by its file route, never the address', async () => {
    mockConsent = { consent: 'granted', busy: false, saveFailed: false };
    const { rerender } = await renderHook(() => useScreenTracking());

    mockSegments = ['(tabs)', 'book', '[id]'];
    await rerender({});

    expect(mockTrackScreenView.mock.calls).toEqual([['index'], ['book/[id]']]);
  });
});
