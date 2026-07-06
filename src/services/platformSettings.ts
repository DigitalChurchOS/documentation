import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'platform-settings.json');

export interface PlatformSettings {
  platformName: string;
  defaultTrialDays: number;
  signupEnabled: boolean;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  cloudinarySeparateContent: boolean;
  cloudinaryContentCloudName: string;
  cloudinaryContentApiKey: string;
  cloudinaryContentApiSecret: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'Churchtell',
  defaultTrialDays: 14,
  signupEnabled: true,
  cloudinaryCloudName: 'pguyn8bv',
  cloudinaryApiKey: '361943296662427',
  cloudinaryApiSecret: 'ssUh1aCybDMpnaMK1-cVs8ik320',
  cloudinarySeparateContent: false,
  cloudinaryContentCloudName: '',
  cloudinaryContentApiKey: '',
  cloudinaryContentApiSecret: ''
};

export function getPlatformSettings(): PlatformSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Failed to read platform settings:', err);
  }
  return DEFAULT_SETTINGS;
}

export function savePlatformSettings(settings: Partial<PlatformSettings>): PlatformSettings {
  try {
    const existing = getPlatformSettings();
    const updated = { ...existing, ...settings };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  } catch (err) {
    console.error('Failed to save platform settings:', err);
    throw err;
  }
}
