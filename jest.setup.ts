// Runs after the test framework in every test file (package.json, `setupFilesAfterEnv`).

// The double-tap guard (D-099) remembers the last open for half a second. Tests in one file run
// faster than that, so each test starts with the guard cleared. The guard is loaded here only
// after a test, so it is the same instance the test file loaded, with the file's own mocks
// (such as its `expo-router`); importing it at the top would load it before those mocks exist.
afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const guard = require('@/navigation/openGuard') as typeof import('@/navigation/openGuard');
  guard.resetOpenGuardForTests();
});
