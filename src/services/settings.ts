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
  livestream: {
    moduleKey: 'livestream',
    moduleName: 'Livestream Module',
    category: 'media',
    fields: [
      {
        key: 'enabled',
        label: 'Enable Livestream Module',
        description: 'Toggles activation of the Livestream module features.',
        type: 'boolean',
        default: true
      },
      {
        key: 'adminPreviewOnly',
        label: 'Admin-Only Preview',
        description: 'Allows tenant admins to configure and preview livestreams prior to public launch.',
        type: 'boolean',
        default: true
      },
      {
        key: 'publicPublishingEnabled',
        label: 'Allow Public Publishing',
        description: 'Enables streaming pages and replay archives to be visible on the public website.',
        type: 'boolean',
        default: false
      },
      {
        key: 'billingPlan',
        label: 'Active Billing Tier',
        description: 'Specifies the current financial plan of the module.',
        type: 'select',
        default: 'free',
        options: [
          { label: 'Free Tier', value: 'free' },
          { label: 'Pro Broadcast', value: 'pro' },
          { label: 'Enterprise Ministry', value: 'enterprise' }
        ]
      },
      {
        key: 'providerMode',
        label: 'Stream Infrastructure Mode',
        description: 'Controls whether streaming is managed by the platform, by your own provider, or hybrid.',
        type: 'select',
        default: 'hybrid',
        options: [
          { label: 'Hybrid Ingest', value: 'hybrid' },
          { label: 'Platform Managed Ingest', value: 'platform_managed' },
          { label: 'Bring Your Own Provider Ingest', value: 'bring_your_own' }
        ]
      },
      {
        key: 'defaultProvider',
        label: 'Default Ingest Provider',
        description: 'Primary broadcast ingest and CDN source provider.',
        type: 'select',
        default: 'youtube',
        options: [
          { label: 'YouTube Live', value: 'youtube' },
          { label: 'Vimeo Livestream', value: 'vimeo' },
          { label: 'Mux Live', value: 'mux' },
          { label: 'Cloudflare Stream', value: 'cloudflare' },
          { label: 'AWS IVS', value: 'aws_ivs' },
          { label: 'Bunny Stream', value: 'bunny' },
          { label: 'Custom RTMP', value: 'custom' }
        ]
      },
      {
        key: 'embedWidth',
        label: 'Embed Width (px)',
        description: 'Default width for website player iframe embeds.',
        type: 'number',
        default: 560,
        min: 200,
        max: 1920
      },
      {
        key: 'embedHeight',
        label: 'Embed Height (px)',
        description: 'Default height for website player iframe embeds.',
        type: 'number',
        default: 315,
        min: 150,
        max: 1080
      },
      {
        key: 'chatEnabled',
        label: 'Enable Live Chat Room',
        description: 'Displays a live chat room widget alongside the video stream player.',
        type: 'boolean',
        default: true
      },
      {
        key: 'replayAutoArchive',
        label: 'Auto-Archive Replays',
        description: 'Automatically converts ended livestreams into on-demand sermon media assets.',
        type: 'boolean',
        default: true
      },
      {
        key: 'smsRemindersEnabled',
        label: 'SMS Stream Reminders',
        description: 'Sends automated SMS text notifications to subscribers 15 minutes before a broadcast.',
        type: 'boolean',
        default: false
      },
      {
        key: 'givingButtonEnabled',
        label: 'Display Offering Button',
        description: 'Displays a call-to-action button linking directly to the giving form.',
        type: 'boolean',
        default: true
      },
      {
        key: 'prayerRequestEnabled',
        label: 'Display Care Request Button',
        description: 'Displays a call-to-action button linking directly to the intercessor prayer room.',
        type: 'boolean',
        default: true
      },
      {
        key: 'salvationResponseEnabled',
        label: 'Display Salvation Decision Button',
        description: 'Displays a prominent salvation call button to accept Christ during broadcasts.',
        type: 'boolean',
        default: true
      },
      {
        key: 'biblePanelEnabled',
        label: 'Enable Bible Widget Panel',
        description: 'Displays an interactive Scripture lookup widget panel next to the video player.',
        type: 'boolean',
        default: true
      },
      {
        key: 'notesPanelEnabled',
        label: 'Enable Sermon Notes Panel',
        description: 'Allows viewers to type personal notes and email them to themselves.',
        type: 'boolean',
        default: true
      },
      {
        key: 'multilingualAudioEnabled',
        label: 'Enable Secondary Audio Feeds',
        description: 'Enables selection of alternative translation channels during streams.',
        type: 'boolean',
        default: false
      },
      {
        key: 'analyticsTrackingEnabled',
        label: 'Real-Time Stream Analytics',
        description: 'Tracks viewer counts, average watch time, and click metrics for reporting.',
        type: 'boolean',
        default: true
      },
      {
        key: 'autoAttachToServices',
        label: 'Link Streams to Services',
        description: 'Automatically links scheduled streams and replays to Sunday service logs.',
        type: 'boolean',
        default: true
      },
      {
        key: 'defaultVisibility',
        label: 'Default Visibility',
        description: 'Default target audience visibility for newly scheduled broadcasts.',
        type: 'select',
        default: 'public',
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Members Only', value: 'members_only' },
          { label: 'Leaders Only', value: 'leaders_only' },
          { label: 'Private', value: 'private' }
        ]
      }
    ]
  },
  'salvation-new-believer-journey': {
    moduleKey: 'salvation-new-believer-journey',
    moduleName: 'Salvation & New Believer Journey',
    category: 'discipleship',
    fields: [
      {
        key: 'enabled',
        label: 'Enable New Believer Journey',
        description: 'Activates public decision intake, care routing, reminders, and journey reports.',
        type: 'boolean',
        default: true
      },
      {
        key: 'displayPublicDecisionFlow',
        label: 'Public Decision Flow',
        description: 'Displays salvation and new visitor calls to action on public website and livestream surfaces.',
        type: 'boolean',
        default: true
      },
      {
        key: 'autoSendWelcomeMessage',
        label: 'Automatic Welcome Message',
        description: 'Marks the pastoral welcome message as started when a new believer profile is created.',
        type: 'boolean',
        default: true
      },
      {
        key: 'followUpSequenceDays',
        label: 'Follow-Up Sequence Length',
        description: 'Number of days the default care sequence should cover for each new believer.',
        type: 'number',
        default: 30,
        min: 1,
        max: 90,
        step: 1
      },
      {
        key: 'day7CareReminderEnabled',
        label: 'Day 7 Care Reminder',
        description: 'Schedules a first-week pastoral check-in reminder for the assigned care agent.',
        type: 'boolean',
        default: true
      },
      {
        key: 'day30CareReminderEnabled',
        label: 'Day 30 Care Reminder',
        description: 'Schedules a one-month pastoral follow-up reminder for the assigned care agent.',
        type: 'boolean',
        default: true
      },
      {
        key: 'autoAssignCareAgent',
        label: 'Automatic Care Agent',
        description: 'Assigns the first available leader in the tenant as the care agent for new responses.',
        type: 'boolean',
        default: true
      },
      {
        key: 'autoEnrollFoundationSchool',
        label: 'Foundation School Enrollment',
        description: 'Starts the LMS discipleship path when a new believer profile is created.',
        type: 'boolean',
        default: true
      },
      {
        key: 'autoAssignBibleReadingPlan',
        label: 'Bible Reading Plan',
        description: 'Starts the new believer Bible reading plan after a public response is submitted.',
        type: 'boolean',
        default: true
      },
      {
        key: 'autoAssignCellGroup',
        label: 'Cell Group Routing',
        description: 'Assigns a suggested cell or fellowship group based on the response location.',
        type: 'boolean',
        default: true
      },
      {
        key: 'defaultSource',
        label: 'Default Response Source',
        description: 'Source label applied when public forms do not provide a more specific channel.',
        type: 'select',
        default: 'web',
        options: [
          { label: 'Website', value: 'web' },
          { label: 'Livestream', value: 'livestream' },
          { label: 'Physical Service', value: 'physical_service' },
          { label: 'Ministry Funnel', value: 'funnel' },
          { label: 'Event', value: 'event' }
        ]
      }
    ]
  },
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
    moduleName: 'Media Module',
    category: 'media',
    fields: [
      {
        key: 'enablePlatformHosting',
        label: 'Platform-Managed Hosting',
        description: 'Allows ChurchOS to host uploaded videos, audio files, images, and downloadable resources.',
        type: 'boolean',
        default: true
      },
      {
        key: 'enableExternalEmbeds',
        label: 'External Media Embeds',
        description: 'Allows staff to catalog YouTube, Vimeo, Cloudinary, Mux, or other provider links.',
        type: 'boolean',
        default: true
      },
      {
        key: 'enableShortClips',
        label: 'Short Clips',
        description: 'Enables vertical short-form media records for social sharing and sermon highlights.',
        type: 'boolean',
        default: true
      },
      {
        key: 'enableImageGalleries',
        label: 'Image Galleries',
        description: 'Allows staff to organize event images into galleries for public website display.',
        type: 'boolean',
        default: true
      },
      {
        key: 'enableDownloads',
        label: 'Downloadable Resources',
        description: 'Allows PDFs, slides, and notes to be attached to sermons and public media records.',
        type: 'boolean',
        default: true
      },
      {
        key: 'enableAutoTranscripts',
        label: 'AI Auto-Transcription',
        description: 'Automatically generates AI subtitles, transcripts, and blog drafts for newly uploaded sermons.',
        type: 'boolean',
        default: true
      },
      {
        key: 'providerMode',
        label: 'Provider Mode',
        description: 'Controls whether media uses ChurchOS hosting, church-owned providers, or both.',
        type: 'select',
        default: 'hybrid',
        options: [
          { label: 'Hybrid', value: 'hybrid' },
          { label: 'Platform Managed', value: 'platform_managed' },
          { label: 'Bring Your Own Provider', value: 'bring_your_own' }
        ]
      },
      {
        key: 'defaultStorageProvider',
        label: 'Default Storage Provider',
        description: 'Default destination for new uploads and generated thumbnails.',
        type: 'select',
        default: 'platform',
        options: [
          { label: 'ChurchOS Platform', value: 'platform' },
          { label: 'Cloudinary', value: 'cloudinary' },
          { label: 'AWS S3', value: 'aws_s3' },
          { label: 'Cloudflare R2', value: 'cloudflare_r2' },
          { label: 'Mux', value: 'mux' },
          { label: 'Vimeo', value: 'vimeo' }
        ]
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
        key: 'monthlyStorageGbLimit',
        label: 'Monthly Storage Allowance (GB)',
        description: 'Soft limit used for storage reports, billing, and upload routing warnings.',
        type: 'number',
        default: 100,
        min: 1,
        max: 10000,
        step: 10
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
      },
      {
        key: 'defaultVisibility',
        label: 'Default Visibility',
        description: 'Visibility used for new media records unless staff choose a different audience.',
        type: 'select',
        default: 'public',
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Members Only', value: 'members_only' },
          { label: 'Leaders Only', value: 'leaders_only' },
          { label: 'Private', value: 'private' }
        ]
      },
      {
        key: 'publishRequiresThumbnail',
        label: 'Require Thumbnail Before Publishing',
        description: 'Prevents public publishing until a thumbnail or cover image has been attached.',
        type: 'boolean',
        default: false
      }
    ]
  },
  'theme-engine': {
    moduleKey: 'theme-engine',
    moduleName: 'Theme Engine',
    category: 'core',
    fields: [
      {
        key: 'allowMarketplaceThemes',
        label: 'Theme Marketplace',
        description: 'Allows admins to browse and install approved free or purchased themes.',
        type: 'boolean',
        default: true
      },
      {
        key: 'allowCustomCss',
        label: 'Custom CSS',
        description: 'Enables advanced stylesheet overrides for trusted tenant admins.',
        type: 'boolean',
        default: true
      },
      {
        key: 'publicPublishingRequiresActiveEntitlement',
        label: 'Publishing Gate',
        description: 'Keeps disabled or unpaid theme features out of the public church site.',
        type: 'boolean',
        default: true
      },
      {
        key: 'defaultHeaderStyle',
        label: 'Default Header Layout',
        description: 'Default header structure used when a theme does not define one.',
        type: 'select',
        default: 'default',
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Transparent', value: 'transparent' },
          { label: 'Centered', value: 'centered' }
        ]
      },
      {
        key: 'defaultFooterStyle',
        label: 'Default Footer Layout',
        description: 'Default footer structure used by new website themes.',
        type: 'select',
        default: 'simple',
        options: [
          { label: 'Simple', value: 'simple' },
          { label: 'Detailed', value: 'detailed' },
          { label: 'Centered', value: 'centered' }
        ]
      },
      {
        key: 'mobileLayout',
        label: 'Mobile Layout',
        description: 'Default small-screen stacking behavior for theme sections.',
        type: 'select',
        default: 'stacked',
        options: [
          { label: 'Stacked', value: 'stacked' },
          { label: 'Compact', value: 'compact' },
          { label: 'Editorial', value: 'editorial' }
        ]
      }
    ]
  },
  'billing-subscription-management': {
    moduleKey: 'billing-subscription-management',
    moduleName: 'Billing & Subscription Management',
    category: 'core',
    fields: [
      {
        key: 'enableUsageBilling',
        label: 'Usage Billing',
        description: 'Meters usage such as storage, SMS, email, video bandwidth, AI tokens, and meeting participant-hours.',
        type: 'boolean',
        default: true
      },
      {
        key: 'providerMode',
        label: 'Payment Provider Mode',
        description: 'Chooses whether billing uses the platform-managed gateway or a connected church provider.',
        type: 'select',
        default: 'platform_managed',
        options: [
          { label: 'Platform Managed', value: 'platform_managed' },
          { label: 'Bring Your Own Provider', value: 'bring_your_own' }
        ]
      },
      {
        key: 'trialDays',
        label: 'Default Trial Days',
        description: 'Number of trial days granted when a church starts a new subscription.',
        type: 'number',
        default: 14,
        min: 0,
        max: 90,
        step: 1
      },
      {
        key: 'invoiceGraceDays',
        label: 'Invoice Grace Days',
        description: 'Days before unpaid invoices should move an account toward suspension.',
        type: 'number',
        default: 7,
        min: 0,
        max: 30,
        step: 1
      },
      {
        key: 'publicPublishingRequiresPaidAccess',
        label: 'Paid Public Publishing',
        description: 'Keeps unpaid or disabled module features hidden from the public church site.',
        type: 'boolean',
        default: true
      }
    ]
  },
  'developer-marketplace': {
    moduleKey: 'developer-marketplace',
    moduleName: 'Developer Marketplace',
    category: 'core',
    fields: [
      {
        key: 'allowThirdPartyDevelopers',
        label: 'Allow Third-Party Developers',
        description: 'Enables external software engineers to register profiles and submit extensions.',
        type: 'boolean',
        default: true
      },
      {
        key: 'requireReviewForAssets',
        label: 'Require Asset Approval Review',
        description: 'Requires all marketplace submissions to pass security and quality review.',
        type: 'boolean',
        default: true
      },
      {
        key: 'revenueShareSplit',
        label: 'Platform Revenue Share (%)',
        description: 'The percentage split retained by the church platform on premium asset sales.',
        type: 'number',
        default: 30,
        min: 0,
        max: 100,
        step: 5
      },
      {
        key: 'billingPlan',
        label: 'Developer Payout Billing Tier',
        description: 'Default financial billing rule for developer payouts (automatic Stripe / Manual payout).',
        type: 'select',
        default: 'stripe_connect',
        options: [
          { label: 'Stripe Connect Payouts', value: 'stripe_connect' },
          { label: 'Manual Bank Transfer', value: 'manual' }
        ]
      }
    ]
  },
  'digital-library-resource-center': {
    moduleKey: 'digital-library-resource-center',
    moduleName: 'Digital Library & Resource Center',
    category: 'media',
    fields: [
      {
        key: 'enablePdfUploads',
        label: 'PDF Uploads',
        description: 'Secure storage for distributing written documents, policies, or printable materials.',
        type: 'boolean',
        default: true
      },
      {
        key: 'enableEbookUploads',
        label: 'eBook Uploads',
        description: 'Hosting for digital books in ePub or PDF format.',
        type: 'boolean',
        default: true
      },
      {
        key: 'enableDevotionals',
        label: 'Devotional Resources',
        description: 'Organization for daily reading plans and short devotional guides.',
        type: 'boolean',
        default: true
      },
      {
        key: 'enableStudyGuides',
        label: 'Study Guides & Workbooks',
        description: 'Workbooks and discussion questions designed to be downloaded by cell group leaders.',
        type: 'boolean',
        default: true
      },
      {
        key: 'enableMemberOnlyRestriction',
        label: 'Member-Only Access Gates',
        description: 'Lock resources behind login screens restricting them to verified members.',
        type: 'boolean',
        default: true
      },
      {
        key: 'enableLeadMagnets',
        label: 'Ministry Funnel Lead Magnets',
        description: 'Allows using free library resources as conversion incentives for outreach landing pages.',
        type: 'boolean',
        default: false
      }
    ]
  },
  'dynamic-blog-publishing-engine': {
    moduleKey: 'dynamic-blog-publishing-engine',
    moduleName: 'Dynamic Blog & Publishing Engine',
    category: 'media',
    fields: [
      {
        key: 'enableMultipleBlogs',
        label: 'Multiple Independent Blogs',
        description: 'Allows setting up separate blogs (e.g. devotionals, news, youth updates) under the same tenant.',
        type: 'boolean',
        default: true
      },
      {
        key: 'enableComments',
        label: 'Optional Public Comments',
        description: 'Toggles a comment system section allowing readers to comment at the bottom of blog articles.',
        type: 'boolean',
        default: true
      },
      {
        key: 'enableScheduledPosts',
        label: 'Scheduled Publishing',
        description: 'Enables planning content in advance and scheduling articles to automatically go live at a future date and time.',
        type: 'boolean',
        default: true
      },
      {
        key: 'enableRevisions',
        label: 'Article Revision Tracking',
        description: 'Keeps previous drafts history and revisions backup for undoing editor errors.',
        type: 'boolean',
        default: true
      },
      {
        key: 'enableMemberOnlyAccess',
        label: 'Member-Only Security Gate',
        description: 'Restricts reading designated articles to logged-in portal portal members only.',
        type: 'boolean',
        default: false
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
