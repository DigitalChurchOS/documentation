import prisma from '../lib/prisma';

export type SettingFieldType = 'boolean' | 'number' | 'string' | 'select';

export interface SettingSelectOption {
  label: string;
  value: any;
}

export interface SettingFieldConfig {
  key: string;
  label: string;
  description: string;
  type: SettingFieldType;
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: SettingSelectOption[];
}

export interface ModuleSettingsSchema {
  moduleKey: string;
  moduleName: string;
  category: string;
  fields: SettingFieldConfig[];
}

// ─────────────────────────────────────────────────────────────
// SETTINGS SCHEMAS REGISTRY FOR ALL MODULES
// ─────────────────────────────────────────────────────────────
export const SETTINGS_REGISTRY: Record<string, ModuleSettingsSchema> = {
  liveChat: {
    moduleKey: 'liveChat',
    moduleName: 'Live Chat & Pastoral Care',
    category: 'engagement',
    fields: [
      {
        key: 'enableAiScreening',
        label: 'AI Safety & Sentiment Screening',
        description: 'Enables real-time sentiment analysis and crisis keyword detection on visitor messages.',
        type: 'boolean',
        default: true
      },
      {
        key: 'autoEscalateTimer',
        label: 'Auto-Escalation SLA Timer (min)',
        description: 'Minutes of inactivity before an unanswered visitor message escalates to senior care leaders.',
        type: 'number',
        default: 15,
        min: 5,
        max: 120,
        step: 5
      },
      {
        key: 'enableTypingIndicators',
        label: 'Live Presence & Typing Indicators',
        description: 'Shows real-time typing indicators and counsellor availability indicators.',
        type: 'boolean',
        default: true
      },
      {
        key: 'enableTranslation',
        label: 'Live Translation Engine',
        description: 'Enables real-time automated translations of incoming and outgoing chat messages.',
        type: 'boolean',
        default: false
      },
      {
        key: 'defaultCounsellorLanguage',
        label: 'Default Ministry Language',
        description: 'Preferred language used for matching visitors to active intercessors.',
        type: 'select',
        default: 'en',
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'Luganda', value: 'lg' }
        ]
      }
    ]
  },
  cells: {
    moduleKey: 'cells',
    moduleName: 'Cell Groups',
    category: 'training',
    fields: [
      {
        key: 'cellSizeLimit',
        label: 'Cell Member Limit',
        description: 'Accreditation threshold: Maximum number of members allowed in a Cell before splitting.',
        type: 'number',
        default: 25,
        min: 5,
        max: 100,
        step: 1
      },
      {
        key: 'superCellSizeLimit',
        label: 'Super Cell Limit',
        description: 'Accreditation threshold: Maximum number of Cells under a Super Cell network.',
        type: 'number',
        default: 25,
        min: 5,
        max: 100,
        step: 1
      },
      {
        key: 'autoNamingRuleEnabled',
        label: 'Automated Cell Naming',
        description: 'Automatically generates structured descriptive names for pioneered groups (e.g. Dunamis Cell #10).',
        type: 'boolean',
        default: true
      },
      {
        key: 'hierarchyDeepLimit',
        label: 'Maximum Hierarchy Depth',
        description: 'Limit for parent-child relationship nesting levels for home fellowships.',
        type: 'number',
        default: 3,
        min: 1,
        max: 5,
        step: 1
      }
    ]
  },
  attendance: {
    moduleKey: 'attendance',
    moduleName: 'Check-In & Attendance Management',
    category: 'engagement',
    fields: [
      {
        key: 'enableQrCheckIn',
        label: 'QR Code Check-Ins',
        description: 'Enables secure, contactless attendance logging via scannable QR codes on displays.',
        type: 'boolean',
        default: true
      },
      {
        key: 'checkInGracePeriod',
        label: 'Check-In Grace Period (min)',
        description: 'Minutes after a service starts during which check-ins are counted as on-time.',
        type: 'number',
        default: 30,
        min: 5,
        max: 120,
        step: 5
      },
      {
        key: 'enableGuestSelfCheckIn',
        label: 'Guest Self Check-In',
        description: 'Allows new visitors and guests to check in and register their profiles autonomously.',
        type: 'boolean',
        default: false
      }
    ]
  },
  giving: {
    moduleKey: 'giving',
    moduleName: 'Tithes & Offerings',
    category: 'giving',
    fields: [
      {
        key: 'enableAnonymousGiving',
        label: 'Anonymous Giving Mode',
        description: 'Provides an option for donors to submit tithes and offerings without linking their profiles.',
        type: 'boolean',
        default: true
      },
      {
        key: 'processingFeePercentage',
        label: 'Credit Card Fee Recovery (%)',
        description: 'Percentage surcharge added or suggested to donors to recover processing fees.',
        type: 'number',
        default: 1.9,
        min: 0.0,
        max: 5.0,
        step: 0.1
      },
      {
        key: 'defaultCurrency',
        label: 'Preferred Platform Currency',
        description: 'Default currency displayed on public checkout forms and giving dashboards.',
        type: 'select',
        default: 'USD',
        options: [
          { label: 'US Dollar ($)', value: 'USD' },
          { label: 'Euro (€)', value: 'EUR' },
          { label: 'UGX (Shs)', value: 'UGX' }
        ]
      }
    ]
  },
  media: {
    moduleKey: 'media',
    moduleName: 'Content & Media Hosting',
    category: 'media',
    fields: [
      {
        key: 'enableAutoTranscripts',
        label: 'AI Auto-Transcription',
        description: 'Automatically generates AI subtitles, transcripts, and blog drafts for newly uploaded sermons.',
        type: 'boolean',
        default: true
      },
      {
        key: 'maxUploadSizeMb',
        label: 'Max File Upload Size (MB)',
        description: 'Restricts single file media uploads to prevent bandwidth and storage abuse.',
        type: 'number',
        default: 500,
        min: 50,
        max: 5000,
        step: 50
      },
      {
        key: 'defaultStreamingQuality',
        label: 'Default Streaming Resolution',
        description: 'Default player quality preset loaded for livestreams and sermon archives.',
        type: 'select',
        default: '720p',
        options: [
          { label: '1080p Full HD', value: '1080p' },
          { label: '720p HD', value: '720p' },
          { label: '480p Standard', value: '480p' }
        ]
      }
    ]
  },
  settings: {
    moduleKey: 'settings',
    moduleName: 'Platform Central Settings',
    category: 'core',
    fields: [
      {
        key: 'maintenanceMode',
        label: 'Global Maintenance Mode',
        description: 'Temporarily disables public interfaces and displays a branded maintenance page.',
        type: 'boolean',
        default: false
      },
      {
        key: 'allowBranchManagersToModifySettings',
        label: 'Branch-Level Overrides',
        description: 'Allows campus/branch managers to override global tenant settings for their branches.',
        type: 'boolean',
        default: false
      }
    ]
  }
};

// Helper to check if value matches option value
function isValidSelectOption(value: any, options: SettingSelectOption[]): boolean {
  return options.some(opt => opt.value === value);
}

// ─────────────────────────────────────────────────────────────
// SERVICE CLASS
// ─────────────────────────────────────────────────────────────
export class SettingsService {
  /**
   * Retrieves the dynamic settings schemas for all modules.
   */
  static async getSchemas(): Promise<ModuleSettingsSchema[]> {
    return Object.values(SETTINGS_REGISTRY);
  }

  /**
   * Gets merged settings for a given module and tenant.
   * If no settings exist in DB, returns defaults specified by the schema.
   */
  static async getSettingsForModule(tenantId: string, moduleKey: string): Promise<Record<string, any>> {
    const schema = SETTINGS_REGISTRY[moduleKey];
    if (!schema) {
      throw new Error(`Module '${moduleKey}' is not registered in the Settings Registry.`);
    }

    // Load defaults
    const settings: Record<string, any> = {};
    for (const field of schema.fields) {
      settings[field.key] = field.default;
    }

    // Query DB overrides
    const record = await prisma.moduleSettings.findUnique({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey
        }
      }
    });

    if (record && record.settings) {
      try {
        const customSettings = JSON.parse(record.settings);
        // Merge only valid keys from the schema
        for (const key of Object.keys(customSettings)) {
          if (key in settings) {
            settings[key] = customSettings[key];
          }
        }
      } catch (e) {
        console.error(`Failed to parse custom settings JSON for module '${moduleKey}':`, e);
      }
    }

    return settings;
  }

  /**
   * Gets merged settings for all active modules for a tenant.
   */
  static async getAllSettings(tenantId: string): Promise<Record<string, Record<string, any>>> {
    const allMerged: Record<string, Record<string, any>> = {};
    const modules = Object.keys(SETTINGS_REGISTRY);
    
    await Promise.all(
      modules.map(async (key) => {
        allMerged[key] = await this.getSettingsForModule(tenantId, key);
      })
    );

    return allMerged;
  }

  /**
   * Validates and updates settings for a specific module under a tenant.
   */
  static async updateSettingsForModule(
    tenantId: string,
    moduleKey: string,
    updates: Record<string, any>
  ): Promise<Record<string, any>> {
    const schema = SETTINGS_REGISTRY[moduleKey];
    if (!schema) {
      throw new Error(`Module '${moduleKey}' is not registered in the Settings Registry.`);
    }

    // Load current merged settings
    const current = await this.getSettingsForModule(tenantId, moduleKey);

    // Validate updates
    for (const [key, val] of Object.entries(updates)) {
      const field = schema.fields.find(f => f.key === key);
      if (!field) {
        throw new Error(`Field '${key}' does not exist in schema for module '${moduleKey}'.`);
      }

      // Check types
      if (field.type === 'boolean' && typeof val !== 'boolean') {
        throw new Error(`Validation Error: Field '${key}' must be a boolean value.`);
      }

      if (field.type === 'number') {
        if (typeof val !== 'number' || isNaN(val)) {
          throw new Error(`Validation Error: Field '${key}' must be a numeric value.`);
        }
        if (field.min !== undefined && val < field.min) {
          throw new Error(`Validation Error: Field '${key}' must be at least ${field.min}.`);
        }
        if (field.max !== undefined && val > field.max) {
          throw new Error(`Validation Error: Field '${key}' must be at most ${field.max}.`);
        }
      }

      if (field.type === 'string' && typeof val !== 'string') {
        throw new Error(`Validation Error: Field '${key}' must be a string.`);
      }

      if (field.type === 'select') {
        if (!field.options || !isValidSelectOption(val, field.options)) {
          throw new Error(
            `Validation Error: Value '${val}' is not a valid option for field '${key}'. Allowed values: ${field.options?.map(o => o.value).join(', ')}`
          );
        }
      }

      // If validation passes, stage the update
      current[key] = val;
    }

    // Save to DB
    const record = await prisma.moduleSettings.upsert({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey
        }
      },
      create: {
        tenantId,
        moduleKey,
        settings: JSON.stringify(current)
      },
      update: {
        settings: JSON.stringify(current)
      }
    });

    return current;
  }

  /**
   * Resets settings for a specific module to default values by deleting the custom database entry.
   */
  static async resetSettingsForModule(tenantId: string, moduleKey: string): Promise<Record<string, any>> {
    const schema = SETTINGS_REGISTRY[moduleKey];
    if (!schema) {
      throw new Error(`Module '${moduleKey}' is not registered in the Settings Registry.`);
    }

    // Try deleting custom settings
    try {
      await prisma.moduleSettings.delete({
        where: {
          tenantId_moduleKey: {
            tenantId,
            moduleKey
          }
        }
      });
    } catch (e: any) {
      // Record might not exist, which is fine
      if (e.code !== 'P2025') {
        throw e;
      }
    }

    // Return pure defaults
    const defaults: Record<string, any> = {};
    for (const field of schema.fields) {
      defaults[field.key] = field.default;
    }
    return defaults;
  }
}
