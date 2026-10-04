const fs = require('fs');
const path = require('path');

const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

// Android backup is off for the whole app (D-052). Firebase keeps its "collection enabled"
// setting in a SharedPreferences file, while the customer's consent sits in expo-secure-store,
// which is never backed up (its keys cannot move between phones). Without this, a cloud restore
// or a phone-to-phone transfer could start the new install with collection on and no consent.
// `android:allowBackup="false"` stops cloud backup, but on Android 12 and later some phones still
// copy the app during a device-to-device transfer, so the extraction rules exclude every domain
// from both. The older rules file covers Android 11 and lower.

const APP_DOMAINS = ['root', 'file', 'database', 'sharedpref', 'external'];
const DEVICE_DOMAINS = ['device_root', 'device_file', 'device_database', 'device_sharedpref'];

function excludeAll(domains, indent) {
  return domains.map((domain) => `${indent}<exclude domain="${domain}" path="."/>`).join('\n');
}

const DATA_EXTRACTION_RULES = `<?xml version="1.0" encoding="utf-8"?>
<!-- Android 12 and later: nothing is backed up or transferred (D-052). -->
<data-extraction-rules>
  <cloud-backup>
${excludeAll([...APP_DOMAINS, ...DEVICE_DOMAINS], '    ')}
  </cloud-backup>
  <device-transfer>
${excludeAll([...APP_DOMAINS, ...DEVICE_DOMAINS], '    ')}
  </device-transfer>
</data-extraction-rules>
`;

const FULL_BACKUP_CONTENT = `<?xml version="1.0" encoding="utf-8"?>
<!-- Android 11 and lower: nothing is backed up (D-052). -->
<full-backup-content>
${excludeAll([...APP_DOMAINS, ...DEVICE_DOMAINS], '  ')}
</full-backup-content>
`;

const DATA_EXTRACTION_RULES_FILE = 'no_backup_data_extraction_rules';
const FULL_BACKUP_CONTENT_FILE = 'no_backup_rules';

/** Sets the application tag's backup attributes. Exported for the unit test. */
function applyNoBackup(androidManifest) {
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  application.$['android:allowBackup'] = 'false';
  application.$['android:fullBackupContent'] = `@xml/${FULL_BACKUP_CONTENT_FILE}`;
  application.$['android:dataExtractionRules'] = `@xml/${DATA_EXTRACTION_RULES_FILE}`;
  return androidManifest;
}

function withNoAndroidBackup(config) {
  const withManifest = withAndroidManifest(config, (modConfig) => {
    modConfig.modResults = applyNoBackup(modConfig.modResults);
    return modConfig;
  });

  return withDangerousMod(withManifest, [
    'android',
    async (modConfig) => {
      const xmlDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml',
      );
      await fs.promises.mkdir(xmlDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(xmlDir, `${DATA_EXTRACTION_RULES_FILE}.xml`),
        DATA_EXTRACTION_RULES,
      );
      await fs.promises.writeFile(
        path.join(xmlDir, `${FULL_BACKUP_CONTENT_FILE}.xml`),
        FULL_BACKUP_CONTENT,
      );
      return modConfig;
    },
  ]);
}

module.exports = withNoAndroidBackup;
module.exports.applyNoBackup = applyNoBackup;
module.exports.DATA_EXTRACTION_RULES = DATA_EXTRACTION_RULES;
module.exports.FULL_BACKUP_CONTENT = FULL_BACKUP_CONTENT;
