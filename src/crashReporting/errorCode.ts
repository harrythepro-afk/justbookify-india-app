// React Native Firebase errors carry a code such as `remoteConfig/failure`; Expo's native
// modules carry one such as `ERR_KEY_STORE_ERROR`.
const SAFE_CODE = /^([A-Za-z]+\/[a-z_-]+|ERR_[A-Z0-9_]+)$/;

/**
 * A code that is safe to report: the library's error code, or the error's class name. Never the
 * error's message, which can carry native detail.
 */
export function safeErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error;
    if (typeof code === 'string' && SAFE_CODE.test(code)) return code;
  }
  return error instanceof Error ? error.name : 'unknown';
}
