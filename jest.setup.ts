// Runs after the test framework in every test file (package.json, `setupFilesAfterEnv`).

import { notifyManager } from '@tanstack/react-query';
import { act } from 'react';

// TanStack Query delivers its updates to components in a batch on a 0 ms timer. On CI's Linux
// runner such a batch could land between a test's own `act` calls, and React logged "not wrapped
// in act" (P6-07, D-106). TanStack's documented hook for tests wraps each delivery in React's
// `act`. Only while React's act environment is on (React Native Testing Library turns it on for
// the files that use it); other files deliver as in the app. Test-only: the app never loads this.
notifyManager.setNotifyFunction((callback) => {
  if ((globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT === true) {
    act(callback);
  } else {
    callback();
  }
});

// The double-tap guard (D-099) remembers the last open for half a second. Tests in one file run
// faster than that, so each test starts with the guard cleared. The guard is loaded here only
// after a test, so it is the same instance the test file loaded, with the file's own mocks
// (such as its `expo-router`); importing it at the top would load it before those mocks exist.
afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const guard = require('@/navigation/openGuard') as typeof import('@/navigation/openGuard');
  guard.resetOpenGuardForTests();
});
