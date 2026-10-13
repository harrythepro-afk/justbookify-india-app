import * as SecureStore from 'expo-secure-store';

/**
 * The customer's tokens in Keystore-backed (Android) and Keychain (iOS) storage, and nowhere else
 * (D-121). The only file that writes them to `expo-secure-store`.
 *
 * **Crash-safe saving (architect's change B to P7-01).** The whole set is one JSON value, kept in
 * one of two slots, `a` and `b`. A new set is written in full into the slot not in use, and only
 * then is the pointer (`customer_session_active`) switched to it. The pointer is one small value,
 * so its write is the single commit point: if the app is killed at any earlier write, the pointer
 * still names the previous, complete slot, and the customer stays logged in with it.
 *
 * **Size (change C).** Expo's SecureStore page for SDK 57 says Expo enforces no limit but some
 * iOS releases refused values above about 2048 bytes. The JSON is ASCII, so each slot holds it in
 * chunks of at most 1,500 characters, with a header (`<chunks>:<length>`) written after them. A
 * set needing more than 8 chunks (12,000 characters) is refused, never cut.
 */

export type StoredSession = {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly idToken: string;
  /** When the access token expires, in milliseconds since the epoch. */
  readonly expiresAt: number;
  /** The nonce of the login that started this session, for the refreshed ID token's check. */
  readonly nonce: string;
};

export type ReadResult =
  | { readonly kind: 'session'; readonly session: StoredSession }
  | { readonly kind: 'none' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'unreadable' };

export class TokenStorageError extends Error {
  readonly code: 'too_large' | 'write_failed' | 'delete_failed';

  constructor(code: 'too_large' | 'write_failed' | 'delete_failed') {
    super(`Token storage: ${code}.`);
    this.name = 'TokenStorageError';
    this.code = code;
  }
}

type Slot = 'a' | 'b';

export const POINTER_KEY = 'customer_session_active';
export const CHUNK_SIZE = 1_500;
export const MAX_CHUNKS = 8;
const SLOTS: readonly Slot[] = ['a', 'b'];
const HEADER = /^([1-9]\d*):([1-9]\d*)$/;
const FORMAT_VERSION = 1;

// iOS: readable after the first unlock (a refresh can run in the background later), and never
// moved to another device by a backup. Android ignores it; app backup is off there (D-052).
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export function headerKey(slot: Slot): string {
  return `customer_session_${slot}_header`;
}

export function chunkKey(slot: Slot, index: number): string {
  return `customer_session_${slot}_${index}`;
}

function serialise(session: StoredSession): string {
  return JSON.stringify({
    v: FORMAT_VERSION,
    a: session.accessToken,
    r: session.refreshToken,
    i: session.idToken,
    e: session.expiresAt,
    n: session.nonce,
  });
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}

function deserialise(text: string): StoredSession | undefined {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (typeof value !== 'object' || value === null) return undefined;
  const { v, a, r, i, e, n } = value as Record<string, unknown>;
  if (v !== FORMAT_VERSION || !nonEmpty(a) || !nonEmpty(r) || !nonEmpty(i) || !nonEmpty(n)) {
    return undefined;
  }
  if (typeof e !== 'number' || !Number.isFinite(e)) return undefined;
  return { accessToken: a, refreshToken: r, idToken: i, expiresAt: e, nonce: n };
}

function chunksOf(text: string): string[] {
  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += CHUNK_SIZE) {
    chunks.push(text.slice(start, start + CHUNK_SIZE));
  }
  return chunks;
}

function isSlot(value: string | null): value is Slot {
  return value === 'a' || value === 'b';
}

async function readSlot(slot: Slot): Promise<StoredSession | undefined> {
  const header = HEADER.exec((await SecureStore.getItemAsync(headerKey(slot), OPTIONS)) ?? '');
  if (header === null) return undefined;
  const count = Number(header[1]);
  const length = Number(header[2]);
  if (count > MAX_CHUNKS) return undefined;

  const chunks: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const chunk = await SecureStore.getItemAsync(chunkKey(slot, index), OPTIONS);
    if (chunk === null) return undefined;
    chunks.push(chunk);
  }
  const text = chunks.join('');
  return text.length === length ? deserialise(text) : undefined;
}

/** Every key of a slot, whatever its header says, so nothing is left behind. */
async function clearSlot(slot: Slot): Promise<void> {
  await SecureStore.deleteItemAsync(headerKey(slot), OPTIONS);
  for (let index = 0; index < MAX_CHUNKS; index += 1) {
    await SecureStore.deleteItemAsync(chunkKey(slot, index), OPTIONS);
  }
}

/**
 * The stored session, if the pointer names a complete slot; `none` when no pointer is stored.
 * `invalid` when the pointer or the slot it names does not hold a complete set (which a crash
 * cannot cause): the caller deletes everything. `unreadable` when the store itself throws: the
 * caller treats it as signed out for this launch but deletes nothing, because the failure may pass.
 */
export async function readStoredSession(): Promise<ReadResult> {
  try {
    const pointer = await SecureStore.getItemAsync(POINTER_KEY, OPTIONS);
    if (pointer === null) return { kind: 'none' };
    if (!isSlot(pointer)) return { kind: 'invalid' };
    const session = await readSlot(pointer);
    return session === undefined ? { kind: 'invalid' } : { kind: 'session', session };
  } catch {
    return { kind: 'unreadable' };
  }
}

/**
 * Saves a new set crash-safely: the inactive slot in full, then the pointer. Throws
 * `TokenStorageError` if the set is too large or a write fails; until the pointer moves, the
 * previous set stays the stored one. The old slot is cleared afterwards, best effort: a failure
 * there leaves an unused, older set that the next save overwrites and logout deletes.
 */
export async function writeStoredSession(session: StoredSession): Promise<void> {
  const chunks = chunksOf(serialise(session));
  if (chunks.length > MAX_CHUNKS) throw new TokenStorageError('too_large');

  let active: Slot | undefined;
  try {
    const pointer = await SecureStore.getItemAsync(POINTER_KEY, OPTIONS);
    active = isSlot(pointer) ? pointer : undefined;
  } catch {
    throw new TokenStorageError('write_failed');
  }
  const target: Slot = active === 'a' ? 'b' : 'a';
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);

  try {
    // The header goes first as a delete, so a half-written slot never looks complete, and is
    // written again only after every chunk.
    await SecureStore.deleteItemAsync(headerKey(target), OPTIONS);
    for (const [index, chunk] of chunks.entries()) {
      await SecureStore.setItemAsync(chunkKey(target, index), chunk, OPTIONS);
    }
    await SecureStore.setItemAsync(headerKey(target), `${chunks.length}:${length}`, OPTIONS);
    await SecureStore.setItemAsync(POINTER_KEY, target, OPTIONS);
  } catch {
    throw new TokenStorageError('write_failed');
  }

  if (active !== undefined) {
    try {
      await clearSlot(active);
    } catch {
      // Best effort, as described above.
    }
  }
}

/**
 * Deletes the session: the pointer first, which signs out at once even if a later delete fails,
 * then both slots. Throws `TokenStorageError('delete_failed')` if any delete failed.
 */
export async function deleteStoredSession(): Promise<void> {
  let failed = false;
  for (const remove of [
    () => SecureStore.deleteItemAsync(POINTER_KEY, OPTIONS),
    ...SLOTS.map((slot) => () => clearSlot(slot)),
  ]) {
    try {
      await remove();
    } catch {
      failed = true;
    }
  }
  if (failed) throw new TokenStorageError('delete_failed');
}

/** Characters per stored value, for the development line only: never the values themselves. */
export function storedLengths(session: StoredSession): {
  readonly accessToken: number;
  readonly refreshToken: number;
  readonly idToken: number;
  readonly total: number;
  readonly chunks: number;
} {
  const text = serialise(session);
  return {
    accessToken: session.accessToken.length,
    refreshToken: session.refreshToken.length,
    idToken: session.idToken.length,
    total: text.length,
    chunks: chunksOf(text).length,
  };
}
