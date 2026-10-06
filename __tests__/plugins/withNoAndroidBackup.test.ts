import {
  applyNoBackup,
  DATA_EXTRACTION_RULES,
  FULL_BACKUP_CONTENT,
} from '../../plugins/withNoAndroidBackup';

const DOMAINS = [
  'root',
  'file',
  'database',
  'sharedpref',
  'external',
  'device_root',
  'device_file',
  'device_database',
  'device_sharedpref',
];

function section(xml: string, tag: string): string {
  const match = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(xml);
  if (match?.[1] === undefined) throw new Error(`no <${tag}> section`);
  return match[1];
}

describe('withNoAndroidBackup (D-052)', () => {
  it('turns backup off and points the app at the no-backup rules', () => {
    const manifest: {
      manifest: { $: Record<string, string>; application: { $: Record<string, string> }[] };
    } = {
      manifest: {
        $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
        application: [{ $: { 'android:name': '.MainApplication', 'android:allowBackup': 'true' } }],
      },
    };

    const application = applyNoBackup(manifest).manifest.application[0]?.$ ?? {};

    expect(application['android:allowBackup']).toBe('false');
    expect(application['android:fullBackupContent']).toBe('@xml/no_backup_rules');
    expect(application['android:dataExtractionRules']).toBe('@xml/no_backup_data_extraction_rules');
  });

  it.each(['cloud-backup', 'device-transfer'])(
    'excludes every domain from %s on Android 12 and later',
    (tag) => {
      const rules = section(DATA_EXTRACTION_RULES, tag);

      for (const domain of DOMAINS) {
        expect(rules).toContain(`<exclude domain="${domain}" path="."/>`);
      }
      expect(rules).not.toContain('<include');
    },
  );

  it('excludes every domain on Android 11 and lower', () => {
    const rules = section(FULL_BACKUP_CONTENT, 'full-backup-content');

    for (const domain of DOMAINS) {
      expect(rules).toContain(`<exclude domain="${domain}" path="."/>`);
    }
    expect(rules).not.toContain('<include');
  });
});
