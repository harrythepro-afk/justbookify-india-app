import { parseBackendConfig } from '@/config/backend';

// Shaped like a Cloud Functions base URL; not a real project.
const BASE = 'https://asia-south1-example-project.cloudfunctions.net';

describe('parseBackendConfig (P10-02, D-166)', () => {
  it('accepts an https base URL on a development build', () => {
    expect(parseBackendConfig({ url: BASE, appEnv: 'development' })).toEqual({ baseUrl: BASE });
  });

  it('trims, lowercases and drops one trailing slash', () => {
    expect(
      parseBackendConfig({
        url: ' HTTPS://Asia-South1-Example-Project.cloudfunctions.net/ ',
        appEnv: 'development',
      }),
    ).toEqual({ baseUrl: BASE });
  });

  it.each(['staging', 'production'] as const)(
    'gives no backend on a %s build, even with the variable set',
    (appEnv) => {
      expect(parseBackendConfig({ url: BASE, appEnv })).toBeUndefined();
    },
  );

  it.each([undefined, '', '   '])('gives no backend when the variable is %p', (url) => {
    expect(parseBackendConfig({ url, appEnv: 'development' })).toBeUndefined();
  });

  it.each([
    'http://asia-south1-example-project.cloudfunctions.net',
    `${BASE}/whoami`,
    `${BASE}?key=value`,
    `${BASE}#part`,
    `${BASE}:443`,
    'https://user@asia-south1-example-project.cloudfunctions.net',
    'https://localhost',
    'asia-south1-example-project.cloudfunctions.net',
    'not a url',
  ])('refuses %s', (url) => {
    expect(parseBackendConfig({ url, appEnv: 'development' })).toBeUndefined();
  });

  it('never logs, so a malformed value is not echoed', () => {
    const spies = (['log', 'warn', 'error', 'info'] as const).map((name) =>
      jest.spyOn(console, name).mockImplementation(() => {}),
    );
    parseBackendConfig({ url: `${BASE}?secret-looking=1`, appEnv: 'development' });
    for (const spy of spies) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    }
  });
});
