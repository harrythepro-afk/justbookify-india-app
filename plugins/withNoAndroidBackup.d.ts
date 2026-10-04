import type { ConfigPlugin } from 'expo/config-plugins';

type AndroidManifestLike = {
  manifest: { $?: Record<string, string>; application?: { $: Record<string, string> }[] };
};

declare const withNoAndroidBackup: ConfigPlugin;
export default withNoAndroidBackup;

export function applyNoBackup<Manifest extends AndroidManifestLike>(
  androidManifest: Manifest,
): Manifest;
export const DATA_EXTRACTION_RULES: string;
export const FULL_BACKUP_CONTENT: string;
