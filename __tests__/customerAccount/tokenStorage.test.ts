import {
  CHUNK_SIZE,
  chunkKey,
  deleteStoredSession,
  headerKey,
  MAX_CHUNKS,
  POINTER_KEY,
  readStoredSession,
  storedLengths,
  TokenStorageError,
  writeStoredSession,
  type StoredSession,
} from '@/customerAccount/tokenStorage';

// An in-memory stand-in for expo-secure-store. `killAfter` simulates the app being killed: the
// write with that index (0 = the first write or delete) and every later call fail.
const mockStore = new Map<string, string>();
let mockMutations = 0;
let mockKillAfter: number | undefined;
let mockReadFails = false;
const mockOptions: unknown[] = [];

function mockMutate(): void {
  if (mockKillAfter !== undefined && mockMutations >= mockKillAfter) {
    throw new Error('the app was killed');
  }
  mockMutations += 1;
}

jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'after-first-unlock-this-device-only',
  getItemAsync: jest.fn(async (key: string, options: unknown) => {
    mockOptions.push(options);
    if (mockReadFails) throw new Error('keystore unavailable');
    return mockStore.get(key) ?? null;
  }),
  setItemAsync: jest.fn(async (key: string, value: string, options: unknown) => {
    mockOptions.push(options);
    mockMutate();
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string, options: unknown) => {
    mockOptions.push(options);
    mockMutate();
    mockStore.delete(key);
  }),
}));

function session(label: string, size = 40): StoredSession {
  return {
    accessToken: `access-${label}-${'a'.repeat(size)}`,
    refreshToken: `refresh-${label}-${'r'.repeat(size)}`,
    idToken: `id-${label}-${'i'.repeat(size)}`,
    expiresAt: 1_800_000_000_000,
    nonce: `nonce-${label}`,
  };
}

// About 4,000 characters of JSON: three chunks, larger than the 2048 bytes some iOS releases
// refused for one value (Expo's SecureStore page, SDK 57).
const LARGE = session('large', 1300);

beforeEach(() => {
  mockStore.clear();
  mockMutations = 0;
  mockKillAfter = undefined;
  mockReadFails = false;
  mockOptions.length = 0;
});

describe('token storage (P7-01, D-121)', () => {
  it('reads nothing when nothing is stored', async () => {
    expect(await readStoredSession()).toEqual({ kind: 'none' });
  });

  it('saves a set and reads it back', async () => {
    await writeStoredSession(session('one'));
    expect(await readStoredSession()).toEqual({ kind: 'session', session: session('one') });
    expect(mockStore.get(POINTER_KEY)).toBe('a');
  });

  it("uses the keychain's this-device-only, after-first-unlock class for every call", async () => {
    await writeStoredSession(session('one'));
    await readStoredSession();
    await deleteStoredSession();
    expect(mockOptions.length).toBeGreaterThan(0);
    for (const options of mockOptions) {
      expect(options).toEqual({ keychainAccessible: 'after-first-unlock-this-device-only' });
    }
  });

  it('writes a new set into the other slot, then clears the old one', async () => {
    await writeStoredSession(session('one'));
    await writeStoredSession(session('two'));

    expect(mockStore.get(POINTER_KEY)).toBe('b');
    expect(await readStoredSession()).toEqual({ kind: 'session', session: session('two') });
    expect([...mockStore.keys()].filter((key) => key.startsWith('customer_session_a_'))).toEqual(
      [],
    );
  });

  it('keeps no value longer than one chunk, and splits a large set safely (change C)', async () => {
    await writeStoredSession(LARGE);

    for (const value of mockStore.values()) expect(value.length).toBeLessThanOrEqual(CHUNK_SIZE);
    expect(mockStore.get(headerKey('a'))).toMatch(/^3:\d+$/);
    expect(await readStoredSession()).toEqual({ kind: 'session', session: LARGE });
    expect(storedLengths(LARGE)).toMatchObject({ chunks: 3, idToken: LARGE.idToken.length });
  });

  it('refuses a set that would need more than 8 chunks, and keeps the previous one', async () => {
    await writeStoredSession(session('one'));
    const tooLarge = session('huge', Math.ceil((CHUNK_SIZE * MAX_CHUNKS) / 3));

    await expect(writeStoredSession(tooLarge)).rejects.toEqual(new TokenStorageError('too_large'));
    expect(await readStoredSession()).toEqual({ kind: 'session', session: session('one') });
  });

  // Change B: an interrupted save leaves the previous valid set usable, never a partial set.
  describe('a save interrupted after each single write', () => {
    async function writesOfOneSave(previous: StoredSession | undefined, next: StoredSession) {
      mockStore.clear();
      if (previous !== undefined) await writeStoredSession(previous);
      mockMutations = 0;
      await writeStoredSession(next);
      return mockMutations;
    }

    it.each([
      ['a small set over a small one', session('old'), session('new')],
      ['a large set over a small one', session('old'), LARGE],
      ['a small set over a large one', LARGE, session('new')],
    ])('keeps a complete set for %s', async (_case, previous, next) => {
      const total = await writesOfOneSave(previous, next);
      expect(total).toBeGreaterThan(3);

      for (let kill = 0; kill < total; kill += 1) {
        mockStore.clear();
        mockKillAfter = undefined;
        await writeStoredSession(previous);
        const pointerBefore = mockStore.get(POINTER_KEY);
        mockMutations = 0;
        mockKillAfter = kill;

        await writeStoredSession(next).catch(() => undefined);

        mockKillAfter = undefined;
        const result = await readStoredSession();
        // Before the pointer moves: the previous set. After: the new one. Never anything else.
        const committed = mockStore.get(POINTER_KEY) !== pointerBefore;
        expect(result).toEqual({ kind: 'session', session: committed ? next : previous });
      }
    });

    it('leaves nothing stored when the very first login save is interrupted', async () => {
      const total = await writesOfOneSave(undefined, session('first'));

      for (let kill = 0; kill < total; kill += 1) {
        mockStore.clear();
        mockMutations = 0;
        mockKillAfter = kill;
        await writeStoredSession(session('first')).catch(() => undefined);
        mockKillAfter = undefined;

        const result = await readStoredSession();
        expect(result.kind === 'none' || result.kind === 'session').toBe(true);
        if (result.kind === 'session') expect(result.session).toEqual(session('first'));
      }
    });

    it('throws write_failed when a write before the pointer fails', async () => {
      await writeStoredSession(session('old'));
      mockMutations = 0;
      mockKillAfter = 1;
      await expect(writeStoredSession(session('new'))).rejects.toEqual(
        new TokenStorageError('write_failed'),
      );
    });
  });

  it('reads a pointer to a slot that is not complete as invalid', async () => {
    mockStore.set(POINTER_KEY, 'a');
    mockStore.set(headerKey('a'), '2:10');
    mockStore.set(chunkKey('a', 0), 'abcde');
    expect(await readStoredSession()).toEqual({ kind: 'invalid' });
  });

  it.each([
    ['an unknown pointer', () => mockStore.set(POINTER_KEY, 'c')],
    ['a length that does not match', () => mockStore.set(headerKey('a'), '1:999')],
    ['a chunk count over the limit', () => mockStore.set(headerKey('a'), '9:10')],
    ['a set that is not JSON', () => mockStore.set(chunkKey('a', 0), 'x'.repeat(5))],
  ])('reads %s as invalid', async (_case, corrupt) => {
    await writeStoredSession(session('one'));
    if (_case === 'a set that is not JSON') mockStore.set(headerKey('a'), '1:5');
    corrupt();
    expect(await readStoredSession()).toEqual({ kind: 'invalid' });
  });

  it('reads a store that throws as unreadable, deleting nothing', async () => {
    await writeStoredSession(session('one'));
    const keys = [...mockStore.keys()];
    mockReadFails = true;

    expect(await readStoredSession()).toEqual({ kind: 'unreadable' });
    expect([...mockStore.keys()]).toEqual(keys);
  });

  it('deletes the pointer first, then every key of both slots', async () => {
    await writeStoredSession(LARGE);
    await writeStoredSession(session('two'));

    await deleteStoredSession();

    expect(mockStore.size).toBe(0);
    expect(await readStoredSession()).toEqual({ kind: 'none' });
  });

  it('signs out even when a later delete fails, and says so', async () => {
    await writeStoredSession(session('one'));
    mockMutations = 0;
    mockKillAfter = 1; // the pointer's delete succeeds, the slot's deletes fail

    await expect(deleteStoredSession()).rejects.toEqual(new TokenStorageError('delete_failed'));
    mockKillAfter = undefined;
    expect(await readStoredSession()).toEqual({ kind: 'none' });
  });
});
