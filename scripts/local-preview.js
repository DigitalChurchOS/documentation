const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const demoTenantId = 'demo-church-local';
const demoWebsiteId = 'christ-embassy-next-main';
const now = () => new Date().toISOString();
const state = {
  themes: [
    {
      id: 'theme-default',
      name: 'Next Church Minimal Theme',
      tenantId: demoTenantId,
      isCustom: true,
      settings: {
        colors: { primary: '#111827', secondary: '#4b5563', bg: '#ffffff', text: '#111827' },
        fonts: { heading: 'Inter', body: 'Inter' },
        layout: { headerStyle: 'default', footerStyle: 'simple', mobileLayout: 'stacked' },
      },
      createdAt: now(),
    },
  ],
  websites: [
    {
      id: demoWebsiteId,
      title: 'Christ Embassy Next Church',
      description: 'Digital-first demo church for testing every ChurchOS website and ministry workflow.',
      domain: 'nextchurch.localhost',
      themeId: 'theme-default',
      createdAt: now(),
    },
  ],
  themeEngineSettings: {
    id: 'theme-engine-settings-local',
    tenantId: demoTenantId,
    moduleKey: 'theme-engine',
    enabled: true,
    billingPlan: 'premium',
    providerMode: 'bring_your_own',
    configJson: JSON.stringify({
      allowMarketplaceThemes: true,
      allowCustomCss: true,
      publicPublishingRequiresActiveEntitlement: true,
      defaultHeaderStyle: 'default',
      defaultFooterStyle: 'simple',
      mobileLayout: 'stacked',
      sections: [],
      pageTemplates: [],
    }),
    updatedAt: now(),
  },
  themeEngineActivities: [
    { id: 'theme-activity-1', tenantId: demoTenantId, userId: 'Local Preview', actionType: 'activate_theme', metadataJson: JSON.stringify({ themeId: 'theme-default', websiteId: demoWebsiteId }), createdAt: now() },
    { id: 'theme-activity-2', tenantId: demoTenantId, userId: 'Local Preview', actionType: 'customize_theme', metadataJson: JSON.stringify({ themeId: 'theme-default' }), createdAt: now() },
  ],
  sectionTemplates: [
    { name: 'Hero Banner', key: 'hero-banner', type: 'section', structure: { title: 'string', subtitle: 'string', bgImage: 'string' } },
    { name: 'Feature Grid', key: 'feature-grid', type: 'section', structure: { items: 'array' } },
    { name: 'Sermon Player Widget', key: 'sermon-player', type: 'section', structure: { recentCount: 'number' } },
  ],
  pageTemplates: [
    { name: 'Home Page', key: 'home-page', type: 'page', structure: { sections: ['hero-banner', 'feature-grid', 'sermon-player'] } },
    { name: 'Ministry Landing Page', key: 'ministry-landing', type: 'page', structure: { sections: ['hero-banner', 'feature-grid'] } },
  ],
  marketplaceAssets: [
    { id: 'asset-neon-youth', name: 'Neon Youth Style', description: 'Vibrant gradients and bold typography for youth ministries.', type: 'theme', pricingType: 'free', price: 0, status: 'approved', assetConfig: JSON.stringify({ colors: { primary: '#ff00ff', secondary: '#00ffff', accent: '#ffff00' }, fonts: { heading: 'Outfit', body: 'Inter' } }), version: '1.0.0' },
    { id: 'asset-traditional-hymnal', name: 'Traditional Hymnal', description: 'Classic serif fonts and clean layout styles for traditional services.', type: 'theme', pricingType: 'free', price: 0, status: 'approved', assetConfig: JSON.stringify({ colors: { primary: '#4b5563', secondary: '#ffffff', accent: '#7c3aed' }, fonts: { heading: 'Playfair Display', body: 'Georgia' } }), version: '1.0.0' },
    { id: 'asset-modern-dynamic', name: 'Modern Dynamic', description: 'Sleek dark overlays and custom blocks for media ministries.', type: 'theme', pricingType: 'free', price: 0, status: 'approved', assetConfig: JSON.stringify({ colors: { primary: '#0f172a', secondary: '#f8fafc', accent: '#14b8a6' }, fonts: { heading: 'Montserrat', body: 'Inter' } }), version: '1.0.0' },
  ],
  pages: [
    {
      id: 'page-home',
      websiteId: demoWebsiteId,
      title: 'Home',
      slug: 'home',
      status: 'published',
      isHome: true,
      seoTitle: 'Christ Embassy Next Church | Home',
      seoDescription: 'A vibrant digital-first Christ Embassy demo church for testing ChurchOS website, CMS, and ministry features.',
      content: [
        { type: 'hero', title: 'Christ Embassy Next Church', subtitle: 'A Spirit-filled, digital-first church community built for worship, discipleship, prayer, media, giving, and outreach.', bgImage: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1400&q=80', buttonText: 'Join This Sunday', buttonUrl: '/services' },
        { type: 'service_times', title: 'Weekly Service Rhythm', sundayTimes: 'Sunday Celebration Service - 9:00 AM and 11:30 AM', midWeekTimes: 'Wednesday Word & Prayer - 7:00 PM, Friday Youth Ignite - 6:30 PM', address: 'Next Church Campus, 221 Victory Avenue, Lagos' },
        { type: 'ministries_list', title: 'Featured Ministry Pathways', items: [{ name: 'NextGen Youth', desc: 'Youth services, mentorship, creative teams, and campus outreach.' }, { name: 'Prayer & Testimony Hub', desc: 'Prayer requests, testimony moderation, prayer rooms, and corporate prayer schedules.' }, { name: 'Digital Media Team', desc: 'Livestream, sermon clips, podcast publishing, and social media campaigns.' }] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-about',
      websiteId: demoWebsiteId,
      title: 'About Next Church',
      slug: 'about',
      status: 'published',
      isHome: false,
      seoTitle: 'About Christ Embassy Next Church',
      seoDescription: 'Learn the mission, leadership, values, and digital ministry culture of Christ Embassy Next Church.',
      content: [
        { type: 'about_template', headline: 'A Church Built for the Next Generation', storyText: 'Christ Embassy Next Church is a demo ministry environment for testing how a modern church can run public pages, member experiences, media, giving, events, groups, and pastoral care from one operating system.', valuesList: ['Word', 'Worship', 'Prayer', 'Innovation', 'Community'] },
        { type: 'leadership_team', headline: 'Pastoral & Ministry Leadership', members: [{ name: 'Pastor Daniel Okafor', role: 'Resident Pastor', bio: 'Leads teaching, pastoral care, and strategic ministry development.' }, { name: 'Minister Amara Cole', role: 'Digital Ministry Director', bio: 'Oversees livestream, page publishing, content, and volunteer media teams.' }] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-services',
      websiteId: demoWebsiteId,
      title: 'Services',
      slug: 'services',
      status: 'published',
      isHome: false,
      seoTitle: 'Services | Christ Embassy Next Church',
      seoDescription: 'Service times, locations, countdowns, livestream links, and order of service.',
      content: [
        { type: 'service_times', title: 'Service Times & Locations', sundayTimes: 'Sunday Celebration - 9:00 AM and 11:30 AM', midWeekTimes: 'Wednesday Word & Prayer - 7:00 PM', address: '221 Victory Avenue, Lagos and online' },
        { type: 'hero', title: 'Plan Your Visit', subtitle: 'Find parking, children check-in, service schedule, and first-time guest support.', bgImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=80', buttonText: 'I Am Visiting', buttonUrl: '/first-time' },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-livestream',
      websiteId: demoWebsiteId,
      title: 'Watch Live',
      slug: 'live',
      status: 'published',
      isHome: false,
      seoTitle: 'Watch Live | Christ Embassy Next Church',
      seoDescription: 'Livestream player, live prayer, sermon notes, chat, and giving CTA test page.',
      content: [
        { type: 'hero', title: 'Watch Live', subtitle: 'Live service player placeholder with prayer, chat, notes, reactions, and giving actions.', bgImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1400&q=80', buttonText: 'Join Live Service', buttonUrl: '#live-player' },
        { type: 'dynamic_livestream', title: 'Live Video Player', sourceModule: 'Livestream', fields: ['player', 'chat', 'viewerCount', 'prayerRequest', 'givingCTA'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-sermons',
      websiteId: demoWebsiteId,
      title: 'Sermons & Media',
      slug: 'sermons',
      status: 'published',
      isHome: false,
      seoTitle: 'Sermons & Media | Christ Embassy Next Church',
      seoDescription: 'Sermon grid, series pages, podcast feed, media filters, and replay content.',
      content: [
        { type: 'dynamic_sermon_grid', title: 'Latest Sermons', sourceModule: 'Sermons / Media', filters: ['series', 'speaker', 'topic', 'date'] },
        { type: 'dynamic_media_library', title: 'Media Library', sourceModule: 'Media', fields: ['video', 'audio', 'resources'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-events',
      websiteId: demoWebsiteId,
      title: 'Events',
      slug: 'events',
      status: 'published',
      isHome: false,
      seoTitle: 'Events | Christ Embassy Next Church',
      seoDescription: 'Event grid, registration, countdowns, venue maps, reminders, and capacity testing.',
      content: [
        { type: 'hero', title: 'Upcoming Events', subtitle: 'Conference nights, worship experiences, youth events, and leadership training.', bgImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80', buttonText: 'Register Now', buttonUrl: '#events' },
        { type: 'dynamic_events_grid', title: 'Event Calendar', sourceModule: 'Events', fields: ['date', 'location', 'registration', 'capacity', 'reminders'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-giving',
      websiteId: demoWebsiteId,
      title: 'Giving',
      slug: 'give',
      status: 'published',
      isHome: false,
      seoTitle: 'Give | Christ Embassy Next Church',
      seoDescription: 'Giving forms, campaigns, pledges, recurring giving, confirmations, and receipts.',
      content: [
        { type: 'hero', title: 'Give Securely', subtitle: 'Support ministry, missions, outreach, media, welfare, and discipleship work.', bgImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80', buttonText: 'Start Giving', buttonUrl: '#giving-form' },
        { type: 'dynamic_giving_campaign', title: 'Kingdom Expansion Campaign', sourceModule: 'Giving', fields: ['progress', 'recurringGiving', 'pledges', 'receipts'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-prayer',
      websiteId: demoWebsiteId,
      title: 'Prayer & Testimonies',
      slug: 'prayer',
      status: 'published',
      isHome: false,
      seoTitle: 'Prayer & Testimonies | Christ Embassy Next Church',
      seoDescription: 'Prayer request form, prayer wall, testimony wall, prayer sessions, and reactions.',
      content: [
        { type: 'hero', title: 'Prayer & Testimonies', subtitle: 'Submit prayer requests, join corporate prayer, and share testimonies for moderation.', bgImage: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1400&q=80', buttonText: 'Request Prayer', buttonUrl: '#prayer-request' },
        { type: 'dynamic_prayer_wall', title: 'Prayer Wall', sourceModule: 'Prayer & Testimony', fields: ['requests', 'iPrayed', 'testimonies', 'sessions'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-ministries',
      websiteId: demoWebsiteId,
      title: 'Ministries',
      slug: 'ministries',
      status: 'published',
      isHome: false,
      seoTitle: 'Ministries | Christ Embassy Next Church',
      seoDescription: 'Ministry directory, volunteer opportunities, leaders, events, and media connections.',
      content: [
        { type: 'ministries_list', title: 'Find Your Ministry', items: [{ name: 'Worship & Creative Arts', desc: 'Choir, music direction, stage design, dance, and creative production.' }, { name: 'Hospitality & First Impressions', desc: 'Guest welcome, ushers, follow-up, and visitor care.' }, { name: 'Outreach & Missions', desc: 'Evangelism campaigns, local care, and missions support.' }] },
        { type: 'dynamic_ministry_directory', title: 'Ministry Directory', sourceModule: 'Ministries', fields: ['leader', 'meetingTimes', 'joinForm'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-groups',
      websiteId: demoWebsiteId,
      title: 'Cell Groups',
      slug: 'groups',
      status: 'published',
      isHome: false,
      seoTitle: 'Cell Groups | Christ Embassy Next Church',
      seoDescription: 'Cell group finder, leader cards, meeting schedules, and join requests.',
      content: [
        { type: 'dynamic_cell_finder', title: 'Find a Cell Group', sourceModule: 'Cell Groups', fields: ['location', 'language', 'day', 'leader', 'joinRequest'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-courses',
      websiteId: demoWebsiteId,
      title: 'Discipleship Courses',
      slug: 'courses',
      status: 'published',
      isHome: false,
      seoTitle: 'Courses | Christ Embassy Next Church',
      seoDescription: 'Course list, lesson player, progress, quizzes, certificates, and recommendations.',
      content: [
        { type: 'dynamic_course_list', title: 'Discipleship Tracks', sourceModule: 'Discipleship / Courses', fields: ['enrollment', 'lessonProgress', 'quizzes', 'certificates'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-branches',
      websiteId: demoWebsiteId,
      title: 'Branches',
      slug: 'branches',
      status: 'published',
      isHome: false,
      seoTitle: 'Branches | Christ Embassy Next Church',
      seoDescription: 'Branch finder, branch service schedules, campus pastors, maps, and location-aware content.',
      content: [
        { type: 'dynamic_branch_finder', title: 'Find a Next Church Branch', sourceModule: 'Branches', fields: ['nearestBranch', 'pastor', 'serviceTimes', 'map', 'contact'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-volunteer',
      websiteId: demoWebsiteId,
      title: 'Volunteer',
      slug: 'volunteer',
      status: 'published',
      isHome: false,
      seoTitle: 'Volunteer | Christ Embassy Next Church',
      seoDescription: 'Volunteer opportunities, ministry signup, team assignment, schedules, and serving interests.',
      content: [
        { type: 'dynamic_volunteer_opportunities', title: 'Serve With Us', sourceModule: 'Volunteers', fields: ['teams', 'openRoles', 'availability', 'applicationForm'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-announcements',
      websiteId: demoWebsiteId,
      title: 'Announcements',
      slug: 'announcements',
      status: 'published',
      isHome: false,
      seoTitle: 'Announcements | Christ Embassy Next Church',
      seoDescription: 'Featured announcements, alert banners, notification signup, and branch messages.',
      content: [
        { type: 'dynamic_announcement_list', title: 'Latest Church Updates', sourceModule: 'Announcements', fields: ['featured', 'branch', 'alertBanner', 'notificationSignup'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-mobile-app',
      websiteId: demoWebsiteId,
      title: 'Mobile App Screen',
      slug: 'mobile-app',
      status: 'draft',
      isHome: false,
      seoTitle: 'Mobile App Screen | Christ Embassy Next Church',
      seoDescription: 'Mobile app screen composition for member dashboard, giving, livestream, prayer, and notifications.',
      content: [
        { type: 'dynamic_mobile_home', title: 'Next Church Mobile Home', sourceModule: 'Mobile App', fields: ['quickActions', 'liveService', 'giving', 'prayer', 'notifications'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-first-time',
      websiteId: demoWebsiteId,
      title: 'First-Time Visitor',
      slug: 'first-time',
      status: 'draft',
      isHome: false,
      seoTitle: 'First-Time Visitor | Christ Embassy Next Church',
      seoDescription: 'Visitor capture, welcome flow, CRM routing, pastoral follow-up, and next steps.',
      content: [
        { type: 'contact_form', header: 'Plan Your First Visit', email: 'hello@nextchurch.example', phone: '+234 800 000 0000', showMap: true },
        { type: 'dynamic_visitor_capture', title: 'First-Time Visitor Capture', sourceModule: 'Member CRM', fields: ['guestDetails', 'familyInfo', 'followUp', 'assignedCareAgent'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-contact',
      websiteId: demoWebsiteId,
      title: 'Contact',
      slug: 'contact',
      status: 'published',
      isHome: false,
      seoTitle: 'Contact | Christ Embassy Next Church',
      seoDescription: 'Contact form, location map, branch details, pastoral care request, and communication opt-in.',
      content: [
        { type: 'contact_form', header: 'Contact Christ Embassy Next Church', email: 'hello@nextchurch.example', phone: '+234 800 000 0000', showMap: true },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'page-member-dashboard',
      websiteId: demoWebsiteId,
      title: 'Member Dashboard',
      slug: 'member-dashboard',
      status: 'draft',
      isHome: false,
      seoTitle: 'Member Dashboard | Christ Embassy Next Church',
      seoDescription: 'Personalized member actions, events, groups, courses, giving history, and prayer sessions.',
      content: [
        { type: 'dynamic_member_dashboard', title: 'Personalized Member Dashboard', sourceModule: 'Member Management', fields: ['profile', 'events', 'givingHistory', 'groups', 'courses', 'notifications'] },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
  ],
  navigation: [
    {
      id: 'nav-main',
      websiteId: demoWebsiteId,
      name: 'Header Navigation',
      items: [
        { label: 'Home', url: '/home' },
        { label: 'Services', url: '/services' },
        { label: 'Watch Live', url: '/live' },
        { label: 'Events', url: '/events' },
        { label: 'Sermons', url: '/sermons' },
        { label: 'Prayer', url: '/prayer' },
        { label: 'Give', url: '/give' },
        { label: 'Volunteer', url: '/volunteer' },
        { label: 'Contact', url: '/contact' },
      ],
      isActive: true,
      updatedAt: now(),
    },
  ],
  footers: [
    {
      id: 'footer-main',
      websiteId: demoWebsiteId,
      copyrightText: `&copy; ${new Date().getFullYear()} Christ Embassy Next Church. All rights reserved.`,
      socialLinks: [
        { name: 'facebook', url: 'https://facebook.com/christembassynext' },
        { name: 'instagram', url: 'https://instagram.com/christembassynext' },
        { name: 'youtube', url: 'https://youtube.com/@christembassynext' },
      ],
      secondaryLinks: [
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Plan a Visit', url: '/first-time' },
        { label: 'Volunteer', url: '/volunteer' },
        { label: 'Branches', url: '/branches' },
      ],
      updatedAt: now(),
    },
  ],
  reusableBlocks: [
    {
      id: 'block-service-cta',
      name: 'Sunday Celebration CTA',
      key: 'sunday-service-cta',
      content: { type: 'hero', title: 'Join Christ Embassy Next Church This Sunday', subtitle: 'Two services, one family, one mission.', buttonText: 'Plan a Visit' },
      updatedAt: now(),
    },
  ],
  billingPlans: [
    {
      id: 'plan-starter',
      name: 'Starter',
      slug: 'starter',
      description: 'For smaller churches launching core ChurchOS operations.',
      basePrice: 0,
      currency: 'USD',
      billingInterval: 'month',
      includedMembers: 50,
      includedSms: 100,
      includedEmail: 500,
      includedStorageGb: 5,
      includedVideoBandwidthGb: 0,
      includedAiTokens: 0,
      includedMeetingParticipantHours: 0,
      memberOverageRate: 0,
      smsOverageRate: 0,
      storageOverageRate: 0,
      emailOverageRate: 0,
      videoBandwidthOverageRate: 0,
      aiTokenOverageRate: 0,
      meetingParticipantHourRate: 0,
      featuresJson: JSON.stringify(['Member directory', 'Basic CMS', 'Giving setup']),
      modulesJson: JSON.stringify(['members', 'core-website-cms', 'giving']),
    },
    {
      id: 'plan-growth',
      name: 'Growth',
      slug: 'growth',
      description: 'Usage-based plan for growing ministries and media teams.',
      basePrice: 49,
      currency: 'USD',
      billingInterval: 'month',
      includedMembers: 500,
      includedSms: 1000,
      includedEmail: 10000,
      includedStorageGb: 100,
      includedVideoBandwidthGb: 250,
      includedAiTokens: 50000,
      includedMeetingParticipantHours: 40,
      memberOverageRate: 5,
      smsOverageRate: 0.02,
      storageOverageRate: 2,
      emailOverageRate: 0.001,
      videoBandwidthOverageRate: 0.08,
      aiTokenOverageRate: 0.0001,
      meetingParticipantHourRate: 2,
      featuresJson: JSON.stringify(['Usage billing', 'Paid add-ons', 'AI ministry copilots']),
      modulesJson: JSON.stringify(['members', 'communications', 'media', 'live-meetings', 'ai']),
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Multi-campus plan with extended usage pools and premium support.',
      basePrice: 199,
      currency: 'USD',
      billingInterval: 'month',
      includedMembers: 5000,
      includedSms: 20000,
      includedEmail: 150000,
      includedStorageGb: 1000,
      includedVideoBandwidthGb: 2500,
      includedAiTokens: 500000,
      includedMeetingParticipantHours: 400,
      memberOverageRate: 3,
      smsOverageRate: 0.015,
      storageOverageRate: 1.25,
      emailOverageRate: 0.0008,
      videoBandwidthOverageRate: 0.05,
      aiTokenOverageRate: 0.00008,
      meetingParticipantHourRate: 1.25,
      featuresJson: JSON.stringify(['Multi-campus controls', 'Premium support', 'Advanced reporting']),
      modulesJson: JSON.stringify(['members', 'communications', 'media', 'live-meetings', 'ai', 'analytics']),
    },
  ],
  billingSubscription: {
    id: 'sub-local-growth',
    tenantId: demoTenantId,
    planId: 'plan-growth',
    status: 'active',
    provider: 'internal',
    providerMode: 'platform_managed',
    couponCode: 'WELCOME10',
    currentPeriodStart: now(),
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
  },
  billingUsage: {
    active_members: 612,
    sms_sent: 1320,
    email_sent: 12480,
    storage_gb: 96,
    video_bandwidth_gb: 310,
    ai_tokens: 74000,
    meeting_participant_hours: 54,
  },
  billingInvoices: [
    {
      id: 'invoice-local-001',
      invoiceNumber: 'INV-2026-0001',
      tenantId: demoTenantId,
      subscriptionId: 'sub-local-growth',
      amount: 86.91,
      subtotal: 96.57,
      discount: 9.66,
      currency: 'USD',
      status: 'open',
      lineItemsJson: JSON.stringify([
        { label: 'Growth plan', amount: 49 },
        { label: 'Usage overages', amount: 17.57 },
        { label: 'Livestream Studio add-on', amount: 30 },
      ]),
      billingPeriodStart: now(),
      billingPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      createdAt: now(),
    },
  ],
  billingAddOns: [
    {
      id: 'addon-live-studio',
      tenantId: demoTenantId,
      key: 'live-studio',
      name: 'Livestream Studio',
      description: 'Unlock hosted livestream rooms and participant-hour tracking.',
      moduleKey: 'live-meetings',
      price: 30,
      billingMode: 'monthly',
      usageMetricKey: 'meeting_participant_hours',
      includedQuantity: 20,
      overageRate: 1.5,
      isActive: true,
    },
    {
      id: 'addon-ai-care',
      tenantId: demoTenantId,
      key: 'ai-care',
      name: 'AI Pastoral Care',
      description: 'AI-assisted follow-up drafts, prayer categorization, and response summaries.',
      moduleKey: 'ai',
      price: 45,
      billingMode: 'monthly',
      usageMetricKey: 'ai_tokens',
      includedQuantity: 100000,
      overageRate: 0.00008,
      isActive: true,
    },
  ],
  billingActiveAddOns: [
    {
      id: 'active-addon-live-studio',
      tenantId: demoTenantId,
      subscriptionId: 'sub-local-growth',
      addOnId: 'addon-live-studio',
      quantity: 1,
      status: 'active',
      activatedAt: now(),
    },
  ],
  billingCoupons: [
    {
      id: 'coupon-welcome',
      tenantId: demoTenantId,
      code: 'WELCOME10',
      description: 'Preview coupon for the current subscription.',
      discountType: 'percent',
      discountValue: 10,
      maxRedemptions: 100,
      redeemedCount: 1,
      isActive: true,
      expiresAt: null,
    },
  ],
  billingSettings: {
    id: 'billing-settings-local',
    tenantId: demoTenantId,
    moduleKey: 'billing-subscription-management',
    enabled: true,
    billingPlan: 'platform',
    providerMode: 'platform_managed',
    configJson: JSON.stringify({
      invoicePrefix: 'INV',
      enableUsageBilling: true,
      trialDays: 14,
      invoiceGraceDays: 7,
      publicPublishingRequiresPaidAccess: true,
    }),
    updatedAt: now(),
  },
  billingEntitlements: [
    { id: 'ent-core-cms', tenantId: demoTenantId, moduleKey: 'core-website-cms', status: 'active', billingRule: 'included', module: { name: 'Core Website & CMS' } },
    { id: 'ent-live', tenantId: demoTenantId, moduleKey: 'live-meetings', status: 'active', billingRule: 'paid_add_on', module: { name: 'Live Meetings' } },
    { id: 'ent-ai', tenantId: demoTenantId, moduleKey: 'ai', status: 'active', billingRule: 'metered', module: { name: 'AI Copilot' } },
    { id: 'ent-analytics', tenantId: demoTenantId, moduleKey: 'analytics', status: 'suspended', billingRule: 'plan_required', module: { name: 'Analytics & Reporting' } },
  ],
  billingActivities: [
    { id: 'billing-activity-1', tenantId: demoTenantId, actionType: 'coupon_applied', metadataJson: JSON.stringify({ code: 'WELCOME10' }), createdAt: now() },
    { id: 'billing-activity-2', tenantId: demoTenantId, actionType: 'addon_activated', metadataJson: JSON.stringify({ addOn: 'Livestream Studio' }), createdAt: now() },
    { id: 'billing-activity-3', tenantId: demoTenantId, actionType: 'usage_recorded', metadataJson: JSON.stringify({ metricKey: 'sms_sent', quantity: 1320 }), createdAt: now() },
  ],
  billingRecords: [
    { id: 'billing-record-1', tenantId: demoTenantId, title: 'Local Preview Billing Console', description: 'Demo record for the documented module CRUD surface.', status: 'active', visibility: 'private', settingsJson: '{}', createdAt: now(), updatedAt: now() },
  ],
  activityLogs: [
    { id: 'activity-1', actionType: 'page_create', metadataJson: 'Seeded Christ Embassy Next Church homepage', createdAt: now(), actor: 'Local Preview' },
    { id: 'activity-2', actionType: 'page_update', metadataJson: 'Configured navigation for service, livestream, events, sermons, prayer, and giving', createdAt: now(), actor: 'Local Preview' },
    { id: 'activity-3', actionType: 'page_publish', metadataJson: 'Published demo pages for CMS testing', createdAt: now(), actor: 'Local Preview' },
  ],
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
  });
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function addActivity(action) {
  state.activityLogs.unshift({ id: createId('activity'), action, actor: 'Local Preview', createdAt: now() });
}

function addBillingActivity(actionType, metadata = {}) {
  state.billingActivities.unshift({
    id: createId('billing-activity'),
    tenantId: demoTenantId,
    actionType,
    metadataJson: JSON.stringify(metadata),
    createdAt: now(),
  });
}

function addThemeActivity(actionType, metadata = {}) {
  state.themeEngineActivities.unshift({
    id: createId('theme-activity'),
    tenantId: demoTenantId,
    userId: 'Local Preview',
    actionType,
    metadataJson: JSON.stringify(metadata),
    createdAt: now(),
  });
}

function getBillingPlan(planId = state.billingSubscription.planId) {
  return state.billingPlans.find((plan) => plan.id === planId) || state.billingPlans[0];
}

function withBillingAddOn(item) {
  return {
    ...item,
    addOn: state.billingAddOns.find((addOn) => addOn.id === item.addOnId) || null,
  };
}

function billingSubscriptionSnapshot() {
  if (!state.billingSubscription) return null;
  return {
    ...state.billingSubscription,
    plan: getBillingPlan(state.billingSubscription.planId),
  };
}

function billingMetric(label, key, current, included, rate, unit) {
  const overage = Math.max(0, Number(current || 0) - Number(included || 0));
  return {
    key,
    label,
    current: Number(current || 0),
    included: Number(included || 0),
    rate: Number(rate || 0),
    unit,
    overage,
    overageCost: Number((overage * Number(rate || 0)).toFixed(2)),
  };
}

function billingUsageSnapshot() {
  const plan = getBillingPlan();
  const metrics = [
    billingMetric('Active members', 'active_members', state.billingUsage.active_members, plan.includedMembers, plan.memberOverageRate, 'members'),
    billingMetric('SMS messages', 'sms_sent', state.billingUsage.sms_sent, plan.includedSms, plan.smsOverageRate, 'messages'),
    billingMetric('Email sends', 'email_sent', state.billingUsage.email_sent, plan.includedEmail, plan.emailOverageRate, 'messages'),
    billingMetric('Media storage', 'storage_gb', state.billingUsage.storage_gb, plan.includedStorageGb, plan.storageOverageRate, 'GB'),
    billingMetric('Video bandwidth', 'video_bandwidth_gb', state.billingUsage.video_bandwidth_gb, plan.includedVideoBandwidthGb, plan.videoBandwidthOverageRate, 'GB'),
    billingMetric('AI tokens', 'ai_tokens', state.billingUsage.ai_tokens, plan.includedAiTokens, plan.aiTokenOverageRate, 'tokens'),
    billingMetric('Meeting participant-hours', 'meeting_participant_hours', state.billingUsage.meeting_participant_hours, plan.includedMeetingParticipantHours, plan.meetingParticipantHourRate, 'hours'),
  ];
  return {
    ...state.billingUsage,
    metrics,
    projectedOverageTotal: Number(metrics.reduce((sum, metric) => sum + metric.overageCost, 0).toFixed(2)),
  };
}

function billingReportsSnapshot() {
  const paidInvoices = state.billingInvoices.filter((invoice) => invoice.status === 'paid');
  const openInvoices = state.billingInvoices.filter((invoice) => invoice.status === 'open');
  return {
    invoiceCount: state.billingInvoices.length,
    openInvoices: openInvoices.length,
    paidInvoices: paidInvoices.length,
    totalBilled: Number(paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0).toFixed(2)),
    totalDiscounts: Number(state.billingInvoices.reduce((sum, invoice) => sum + Number(invoice.discount || 0), 0).toFixed(2)),
    activeCoupons: state.billingCoupons.filter((coupon) => coupon.isActive).length,
    activeAddOns: state.billingActiveAddOns.filter((item) => item.status === 'active').length,
    activeEntitlements: state.billingEntitlements.filter((item) => item.status === 'active').length,
    activityCount: state.billingActivities.length,
  };
}

function billingOverviewPayload() {
  return {
    plans: state.billingPlans,
    subscription: billingSubscriptionSnapshot(),
    usage: billingUsageSnapshot(),
    invoices: state.billingInvoices,
    addOns: state.billingAddOns,
    activeAddOns: state.billingActiveAddOns.map(withBillingAddOn),
    coupons: state.billingCoupons,
    settings: state.billingSettings,
    reports: billingReportsSnapshot(),
    entitlements: state.billingEntitlements,
    records: state.billingRecords,
  };
}

function createPreviewInvoice(status = 'open') {
  const usage = billingUsageSnapshot();
  const plan = getBillingPlan();
  const activeAddOnTotal = state.billingActiveAddOns
    .filter((item) => item.status === 'active')
    .reduce((sum, item) => {
      const addOn = state.billingAddOns.find((entry) => entry.id === item.addOnId);
      return sum + Number(addOn?.price || 0) * Number(item.quantity || 1);
    }, 0);
  const subtotal = Number((plan.basePrice + usage.projectedOverageTotal + activeAddOnTotal).toFixed(2));
  const coupon = state.billingCoupons.find((item) => item.code === state.billingSubscription.couponCode && item.isActive);
  const discount = coupon
    ? Number((coupon.discountType === 'percent' ? subtotal * (coupon.discountValue / 100) : coupon.discountValue).toFixed(2))
    : 0;
  const invoice = {
    id: createId('invoice'),
    invoiceNumber: `${JSON.parse(state.billingSettings.configJson || '{}').invoicePrefix || 'INV'}-${String(state.billingInvoices.length + 1).padStart(4, '0')}`,
    tenantId: demoTenantId,
    subscriptionId: state.billingSubscription.id,
    amount: Number(Math.max(0, subtotal - discount).toFixed(2)),
    subtotal,
    discount,
    currency: plan.currency || 'USD',
    status,
    lineItemsJson: JSON.stringify([{ label: `${plan.name} plan`, amount: plan.basePrice }, { label: 'Usage overages', amount: usage.projectedOverageTotal }]),
    billingPeriodStart: state.billingSubscription.currentPeriodStart,
    billingPeriodEnd: state.billingSubscription.currentPeriodEnd,
    createdAt: now(),
  };
  state.billingInvoices.unshift(invoice);
  addBillingActivity('invoice_generated', { invoiceNumber: invoice.invoiceNumber, amount: invoice.amount });
  return invoice;
}

async function handleBillingApi(req, res, parsedUrl) {
  const method = req.method || 'GET';
  const pathname = parsedUrl.pathname;
  const body = method === 'GET' ? {} : await readJsonBody(req);

  if (pathname === '/api/billing/overview' && method === 'GET') {
    return sendJson(res, 200, { data: billingOverviewPayload() });
  }

  if (pathname === '/api/billing/activity' && method === 'GET') {
    return sendJson(res, 200, { data: state.billingActivities });
  }

  if (pathname === '/api/billing/plans' && method === 'GET') {
    return sendJson(res, 200, { data: state.billingPlans });
  }

  if (pathname === '/api/billing/usage' && method === 'GET') {
    return sendJson(res, 200, { data: { subscription: billingSubscriptionSnapshot(), usage: billingUsageSnapshot() } });
  }

  if (pathname === '/api/billing/usage' && method === 'POST') {
    const metricKey = body.metricKey || 'sms_sent';
    const quantity = Number(body.quantity || 0);
    state.billingUsage[metricKey] = Number(state.billingUsage[metricKey] || 0) + quantity;
    addBillingActivity('usage_recorded', { metricKey, quantity });
    return sendJson(res, 201, { data: billingUsageSnapshot() });
  }

  if (pathname === '/api/billing/invoices' && method === 'GET') {
    return sendJson(res, 200, { data: state.billingInvoices });
  }

  if (pathname === '/api/billing/invoice/trigger' && method === 'POST') {
    return sendJson(res, 201, { data: createPreviewInvoice('open') });
  }

  if (pathname === '/api/billing/webhook' && method === 'POST') {
    const invoice = state.billingInvoices.find((item) => item.id === body.invoiceId);
    if (!invoice) return sendJson(res, 404, { error: 'Invoice not found' });
    if (body.event === 'payment_intent.succeeded' || body.event === 'invoice.paid') {
      invoice.status = 'paid';
      state.billingSubscription.status = 'active';
    }
    if (body.event === 'payment_intent.payment_failed' || body.event === 'invoice.payment_failed') {
      invoice.status = 'failed';
      state.billingSubscription.status = 'past_due';
    }
    addBillingActivity('payment_webhook_processed', { invoiceId: invoice.id, event: body.event });
    return sendJson(res, 200, { data: { invoice, subscription: billingSubscriptionSnapshot() } });
  }

  if (pathname === '/api/billing/subscribe' && method === 'POST') {
    const plan = getBillingPlan(body.planId);
    state.billingSubscription.planId = plan.id;
    state.billingSubscription.status = Number(body.trialDays || 0) > 0 ? 'trialing' : 'active';
    state.billingSubscription.providerMode = body.providerMode || state.billingSubscription.providerMode;
    if (body.couponCode) state.billingSubscription.couponCode = String(body.couponCode).toUpperCase();
    addBillingActivity('subscription_updated', { planId: plan.id, couponCode: state.billingSubscription.couponCode });
    return sendJson(res, 200, { data: billingSubscriptionSnapshot() });
  }

  if (pathname === '/api/billing/add-ons' && method === 'GET') {
    return sendJson(res, 200, { data: state.billingAddOns });
  }

  if (pathname === '/api/billing/add-ons' && method === 'POST') {
    const addOn = {
      id: createId('addon'),
      tenantId: demoTenantId,
      key: body.key || createId('custom-addon'),
      name: body.name || 'Custom Add-on',
      description: body.description || '',
      moduleKey: body.moduleKey || null,
      price: Number(body.price || 0),
      billingMode: body.billingMode || 'monthly',
      usageMetricKey: body.usageMetricKey || null,
      includedQuantity: Number(body.includedQuantity || 0),
      overageRate: Number(body.overageRate || 0),
      isActive: true,
    };
    state.billingAddOns.push(addOn);
    addBillingActivity('addon_created', { addOnId: addOn.id, name: addOn.name });
    return sendJson(res, 201, { data: addOn });
  }

  const addOnActivateMatch = pathname.match(/^\/api\/billing\/add-ons\/([^/]+)\/activate$/);
  if (addOnActivateMatch && method === 'POST') {
    const addOn = state.billingAddOns.find((item) => item.id === addOnActivateMatch[1]);
    if (!addOn) return sendJson(res, 404, { error: 'Add-on not found' });
    let active = state.billingActiveAddOns.find((item) => item.addOnId === addOn.id);
    if (!active) {
      active = { id: createId('active-addon'), tenantId: demoTenantId, subscriptionId: state.billingSubscription.id, addOnId: addOn.id, quantity: Number(body.quantity || 1), status: 'active', activatedAt: now() };
      state.billingActiveAddOns.push(active);
    } else {
      active.status = 'active';
      active.quantity = Number(body.quantity || active.quantity || 1);
    }
    if (addOn.moduleKey) {
      const entitlement = state.billingEntitlements.find((item) => item.moduleKey === addOn.moduleKey);
      if (entitlement) entitlement.status = 'active';
    }
    addBillingActivity('addon_activated', { addOnId: addOn.id, name: addOn.name });
    return sendJson(res, 200, { data: withBillingAddOn(active) });
  }

  const addOnDeactivateMatch = pathname.match(/^\/api\/billing\/subscription-add-ons\/([^/]+)\/deactivate$/);
  if (addOnDeactivateMatch && method === 'POST') {
    const active = state.billingActiveAddOns.find((item) => item.id === addOnDeactivateMatch[1]);
    if (!active) return sendJson(res, 404, { error: 'Active add-on not found' });
    active.status = 'cancelled';
    addBillingActivity('addon_deactivated', { activeAddOnId: active.id });
    return sendJson(res, 200, { data: withBillingAddOn(active) });
  }

  if (pathname === '/api/billing/coupons' && method === 'GET') {
    return sendJson(res, 200, { data: state.billingCoupons });
  }

  if (pathname === '/api/billing/coupons' && method === 'POST') {
    const coupon = {
      id: createId('coupon'),
      tenantId: demoTenantId,
      code: String(body.code || createId('coupon-code')).toUpperCase(),
      description: body.description || '',
      discountType: body.discountType || 'percent',
      discountValue: Number(body.discountValue || 0),
      maxRedemptions: body.maxRedemptions === undefined || body.maxRedemptions === null ? null : Number(body.maxRedemptions),
      redeemedCount: 0,
      isActive: true,
      expiresAt: body.expiresAt || null,
    };
    state.billingCoupons.push(coupon);
    addBillingActivity('coupon_created', { code: coupon.code });
    return sendJson(res, 201, { data: coupon });
  }

  if (pathname === '/api/billing/coupons/apply' && method === 'POST') {
    const coupon = state.billingCoupons.find((item) => item.code === String(body.code || '').toUpperCase() && item.isActive);
    if (!coupon) return sendJson(res, 404, { error: 'Coupon not found' });
    state.billingSubscription.couponCode = coupon.code;
    coupon.redeemedCount += 1;
    addBillingActivity('coupon_applied', { code: coupon.code });
    return sendJson(res, 200, { data: billingSubscriptionSnapshot() });
  }

  if (pathname === '/api/billing/settings' && method === 'GET') {
    return sendJson(res, 200, { data: state.billingSettings });
  }

  if (pathname === '/api/billing/settings' && method === 'PATCH') {
    state.billingSettings = { ...state.billingSettings, ...body, updatedAt: now() };
    if (body.config) {
      state.billingSettings.configJson = JSON.stringify({ ...JSON.parse(state.billingSettings.configJson || '{}'), ...body.config });
    }
    addBillingActivity('settings_updated', { providerMode: state.billingSettings.providerMode });
    return sendJson(res, 200, { data: state.billingSettings });
  }

  const entitlementMatch = pathname.match(/^\/api\/billing\/entitlements\/([^/]+)$/);
  if (entitlementMatch && method === 'PATCH') {
    let entitlement = state.billingEntitlements.find((item) => item.moduleKey === entitlementMatch[1]);
    if (!entitlement) {
      entitlement = { id: createId('entitlement'), tenantId: demoTenantId, moduleKey: entitlementMatch[1], status: 'active', billingRule: 'manual', module: { name: entitlementMatch[1] } };
      state.billingEntitlements.push(entitlement);
    }
    entitlement.status = body.status || entitlement.status;
    entitlement.billingRule = body.billingRule || entitlement.billingRule;
    addBillingActivity('entitlement_updated', { moduleKey: entitlement.moduleKey, status: entitlement.status });
    return sendJson(res, 200, { data: entitlement });
  }

  if (pathname === '/api/billing/reports' && method === 'GET') {
    return sendJson(res, 200, { data: billingReportsSnapshot() });
  }

  if (pathname === '/api/billing' && method === 'GET') {
    return sendJson(res, 200, { data: state.billingRecords });
  }

  if (pathname === '/api/billing' && method === 'POST') {
    const record = { id: createId('billing-record'), tenantId: demoTenantId, title: body.title || 'Billing Record', description: body.description || '', status: body.status || 'active', visibility: body.visibility || 'private', settingsJson: JSON.stringify(body.settings || {}), createdAt: now(), updatedAt: now() };
    state.billingRecords.push(record);
    addBillingActivity('record_created', { recordId: record.id, title: record.title });
    return sendJson(res, 201, { data: record });
  }

  return sendJson(res, 404, { error: 'Billing preview endpoint not found' });
}

async function handleThemeEngineApi(req, res, parsedUrl) {
  const method = req.method || 'GET';
  const pathname = parsedUrl.pathname;
  const body = method === 'GET' ? {} : await readJsonBody(req);

  const themeOverview = () => {
    const activeWebsite = state.websites.find((website) => website.id === demoWebsiteId) || state.websites[0];
    const activeTheme = state.themes.find((theme) => theme.id === activeWebsite?.themeId) || state.themes[0];
    return {
      moduleKey: 'theme-engine',
      settings: state.themeEngineSettings,
      counts: {
        moduleProfiles: 1,
        installedThemes: state.themes.length,
        globalThemes: 0,
        websites: state.websites.length,
        sectionTemplates: state.sectionTemplates.length,
        pageTemplates: state.pageTemplates.length,
      },
      activeWebsite: activeWebsite ? {
        id: activeWebsite.id,
        title: activeWebsite.title,
        themeId: activeWebsite.themeId,
        themeName: activeTheme?.name,
      } : null,
      recentActivity: state.themeEngineActivities.slice(0, 5),
    };
  };

  if (pathname === '/api/theme-engine/overview' && method === 'GET') {
    return sendJson(res, 200, { data: themeOverview() });
  }

  if (pathname === '/api/theme-engine/themes' && method === 'GET') {
    return sendJson(res, 200, { data: state.themes });
  }

  if (pathname === '/api/theme-engine/sections' && method === 'GET') {
    return sendJson(res, 200, { data: state.sectionTemplates });
  }

  if (pathname === '/api/theme-engine/page-templates' && method === 'GET') {
    return sendJson(res, 200, { data: state.pageTemplates });
  }

  if (pathname === '/api/theme-engine/reports' && method === 'GET') {
    return sendJson(res, 200, { data: state.themeEngineActivities });
  }

  if (pathname === '/api/theme-engine/settings' && method === 'GET') {
    return sendJson(res, 200, { data: state.themeEngineSettings });
  }

  if (pathname === '/api/theme-engine/settings' && method === 'PATCH') {
    const currentConfig = JSON.parse(state.themeEngineSettings.configJson || '{}');
    state.themeEngineSettings = {
      ...state.themeEngineSettings,
      enabled: body.enabled !== undefined ? Boolean(body.enabled) : state.themeEngineSettings.enabled,
      billingPlan: body.billingPlan || state.themeEngineSettings.billingPlan,
      providerMode: body.providerMode || state.themeEngineSettings.providerMode,
      configJson: JSON.stringify({ ...currentConfig, ...(body.configJson || {}) }),
      updatedAt: now(),
    };
    addThemeActivity('settings_update', { updatedFields: Object.keys(body) });
    return sendJson(res, 200, { data: state.themeEngineSettings });
  }

  if (pathname === '/api/theme-engine/themes/install' && method === 'POST') {
    const asset = state.marketplaceAssets.find((item) => item.id === body.assetId || item.name === body.themeName) || state.marketplaceAssets[0];
    const exists = state.themes.find((theme) => theme.name === asset.name);
    if (exists) return sendJson(res, 409, { error: 'Theme is already installed' });

    const theme = {
      id: createId('theme'),
      tenantId: demoTenantId,
      name: asset.name,
      settings: JSON.parse(asset.assetConfig || '{}'),
      isCustom: true,
      createdAt: now(),
      updatedAt: now(),
    };
    state.themes.unshift(theme);
    addThemeActivity('install_theme', { themeId: theme.id, name: theme.name });
    return sendJson(res, 201, { data: theme });
  }

  const activateMatch = pathname.match(/^\/api\/theme-engine\/themes\/([^/]+)\/activate$/);
  if (activateMatch && method === 'POST') {
    const theme = state.themes.find((item) => item.id === activateMatch[1]);
    const website = state.websites.find((item) => item.id === (body.websiteId || demoWebsiteId));
    if (!theme) return sendJson(res, 404, { error: 'Theme not found' });
    if (!website) return sendJson(res, 404, { error: 'Website not found' });
    website.themeId = theme.id;
    website.updatedAt = now();
    addThemeActivity('activate_theme', { themeId: theme.id, websiteId: website.id });
    return sendJson(res, 200, { data: website });
  }

  const customizeMatch = pathname.match(/^\/api\/theme-engine\/themes\/([^/]+)\/customize$/);
  if (customizeMatch && method === 'PATCH') {
    const theme = state.themes.find((item) => item.id === customizeMatch[1]);
    if (!theme) return sendJson(res, 404, { error: 'Theme not found' });
    const current = typeof theme.settings === 'string' ? JSON.parse(theme.settings || '{}') : (theme.settings || {});
    theme.settings = {
      ...current,
      ...body,
      colors: { ...(current.colors || {}), ...(body.colors || {}) },
      fonts: { ...(current.fonts || {}), ...(body.fonts || {}) },
      logos: { ...(current.logos || {}), ...(body.logos || {}) },
      layout: { ...(current.layout || {}), ...(body.layout || {}) },
    };
    theme.updatedAt = now();
    addThemeActivity('customize_theme', { themeId: theme.id });
    return sendJson(res, 200, { data: theme });
  }

  const previewMatch = pathname.match(/^\/api\/theme-engine\/themes\/([^/]+)\/preview$/);
  if (previewMatch && method === 'GET') {
    const theme = state.themes.find((item) => item.id === previewMatch[1]);
    if (!theme) return sendJson(res, 404, { error: 'Theme not found' });
    return sendJson(res, 200, { data: { themeId: theme.id, name: theme.name, settings: theme.settings, isPreview: true, timestamp: now() } });
  }

  const previewCustomizeMatch = pathname.match(/^\/api\/theme-engine\/themes\/([^/]+)\/preview\/customize$/);
  if (previewCustomizeMatch && method === 'POST') {
    const theme = state.themes.find((item) => item.id === previewCustomizeMatch[1]);
    if (!theme) return sendJson(res, 404, { error: 'Theme not found' });
    const current = typeof theme.settings === 'string' ? JSON.parse(theme.settings || '{}') : (theme.settings || {});
    return sendJson(res, 200, {
      data: {
        themeId: theme.id,
        settings: {
          ...current,
          ...body,
          colors: { ...(current.colors || {}), ...(body.colors || {}) },
        },
        isPreview: true,
        staging: true,
      },
    });
  }

  return sendJson(res, 404, { error: 'Theme Engine preview endpoint not found' });
}

async function handleDemoApi(req, res, parsedUrl) {
  const method = req.method || 'GET';
  const pathname = parsedUrl.pathname;

  if (pathname === '/dev/bootstrap' && method === 'POST') {
    return sendJson(res, 200, {
      tenantId: demoTenantId,
      token: 'local-preview-token',
      email: 'admin@demo.churchos.local',
    });
  }

  if (pathname.startsWith('/api/billing')) {
    return handleBillingApi(req, res, parsedUrl);
  }

  if (pathname.startsWith('/api/theme-engine')) {
    return handleThemeEngineApi(req, res, parsedUrl);
  }

  if (pathname === '/api/marketplace/assets' && method === 'GET') {
    return sendJson(res, 200, { data: state.marketplaceAssets });
  }

  if (!pathname.startsWith('/api/cms')) {
    return false;
  }

  const body = method === 'GET' ? {} : await readJsonBody(req);

  if (pathname === '/api/cms/pages' && method === 'GET') {
    return sendJson(res, 200, { data: state.pages });
  }

  if (pathname === '/api/cms/pages' && method === 'POST') {
    const page = {
      id: createId('page'),
      websiteId: body.websiteId || demoWebsiteId,
      title: body.title || 'Untitled Page',
      slug: body.slug || createId('page-slug'),
      status: body.status || 'draft',
      isHome: Boolean(body.isHome),
      content: body.content || [],
      createdAt: now(),
      updatedAt: now(),
    };
    state.pages.push(page);
    addActivity(`Created page: ${page.title}`);
    return sendJson(res, 201, { data: page });
  }

  const pageMatch = pathname.match(/^\/api\/cms\/pages\/([^/]+)$/);
  if (pageMatch && method === 'PATCH') {
    const page = state.pages.find((item) => item.id === pageMatch[1]);
    if (!page) return sendJson(res, 404, { error: 'Page not found' });
    Object.assign(page, body, { updatedAt: now() });
    addActivity(`Updated page: ${page.title}`);
    return sendJson(res, 200, { data: page });
  }

  const revisionsMatch = pathname.match(/^\/api\/cms\/pages\/([^/]+)\/revisions$/);
  if (revisionsMatch && method === 'GET') {
    return sendJson(res, 200, {
      data: [
        { id: `${revisionsMatch[1]}-rev-1`, pageId: revisionsMatch[1], createdAt: now(), summary: 'Current local preview version' },
      ],
    });
  }

  const rollbackMatch = pathname.match(/^\/api\/cms\/pages\/([^/]+)\/rollback$/);
  if (rollbackMatch && method === 'POST') {
    const page = state.pages.find((item) => item.id === rollbackMatch[1]);
    if (!page) return sendJson(res, 404, { error: 'Page not found' });
    addActivity(`Rolled back page: ${page.title}`);
    return sendJson(res, 200, { data: page });
  }

  if (pathname === '/api/cms/themes' && method === 'POST') {
    const theme = { id: createId('theme'), name: body.name || 'New Theme', settings: body.settings || {}, createdAt: now() };
    state.themes.push(theme);
    return sendJson(res, 201, { data: theme });
  }

  if (pathname === '/api/cms/websites' && method === 'POST') {
    const website = { id: createId('website'), title: body.title || 'Church Website', description: body.description || '', domain: body.domain || 'localhost', themeId: body.themeId || 'theme-default' };
    state.websites.push(website);
    return sendJson(res, 201, { data: website });
  }

  if (pathname === '/api/cms/navigation' && method === 'GET') {
    return sendJson(res, 200, { data: state.navigation });
  }

  if (pathname === '/api/cms/navigation' && method === 'POST') {
    const existing = state.navigation.find((item) => item.websiteId === (body.websiteId || demoWebsiteId));
    const menu = Object.assign(existing || { id: createId('nav') }, body, { websiteId: body.websiteId || demoWebsiteId, updatedAt: now() });
    if (!existing) state.navigation.push(menu);
    addActivity(`Saved navigation: ${menu.name || 'Header Navigation'}`);
    return sendJson(res, 200, { data: menu });
  }

  if (pathname === '/api/cms/footer' && method === 'GET') {
    const websiteId = parsedUrl.searchParams.get('websiteId') || demoWebsiteId;
    return sendJson(res, 200, { data: state.footers.find((item) => item.websiteId === websiteId) || null });
  }

  if (pathname === '/api/cms/footer' && method === 'POST') {
    const existing = state.footers.find((item) => item.websiteId === (body.websiteId || demoWebsiteId));
    const footer = Object.assign(existing || { id: createId('footer') }, body, { websiteId: body.websiteId || demoWebsiteId, updatedAt: now() });
    if (!existing) state.footers.push(footer);
    addActivity('Saved footer configuration');
    return sendJson(res, 200, { data: footer });
  }

  if (pathname === '/api/cms/reusable-blocks' && method === 'GET') {
    return sendJson(res, 200, { data: state.reusableBlocks });
  }

  if (pathname === '/api/cms/reusable-blocks' && method === 'POST') {
    const block = { id: createId('block'), name: body.name || 'Reusable Block', key: body.key || createId('block-key'), content: body.content || {}, updatedAt: now() };
    state.reusableBlocks.push(block);
    addActivity(`Created reusable section: ${block.name}`);
    return sendJson(res, 201, { data: block });
  }

  const blockMatch = pathname.match(/^\/api\/cms\/reusable-blocks\/([^/]+)$/);
  if (blockMatch && method === 'PATCH') {
    const block = state.reusableBlocks.find((item) => item.id === blockMatch[1]);
    if (!block) return sendJson(res, 404, { error: 'Reusable block not found' });
    Object.assign(block, body, { updatedAt: now() });
    addActivity(`Updated reusable section: ${block.name}`);
    return sendJson(res, 200, { data: block });
  }

  if (pathname === '/api/cms/activity-logs' && method === 'GET') {
    return sendJson(res, 200, { data: state.activityLogs });
  }

  if (pathname === '/api/cms/render' && method === 'GET') {
    const slug = parsedUrl.searchParams.get('slug') || 'home';
    const page = state.pages.find((item) => item.slug === slug || (!slug && item.isHome)) || state.pages[0];
    return sendJson(res, 200, {
      data: {
        title: page.title,
        slug: page.slug,
        isHome: page.isHome,
        contentBlocks: page.content || [],
        navigation: state.navigation[0] || null,
        footer: state.footers[0] || null,
        theme: state.themes[0] || null,
        churchName: 'Christ Embassy Next Church',
      },
    });
  }

  return sendJson(res, 404, { error: 'CMS preview endpoint not found' });
}

http
  .createServer(async (req, res) => {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const apiHandled = await handleDemoApi(req, res, parsedUrl);
    if (apiHandled !== false) return;

    let urlPath = (req.url || '/').split('?')[0];
    if (urlPath === '/') {
      urlPath = '/index.html';
    } else if (urlPath === '/dashboard') {
      urlPath = '/dashboard.html';
    } else if (urlPath === '/cms') {
      res.writeHead(302, { Location: '/dashboard.html?module=cms' });
      res.end();
      return;
    } else if (urlPath === '/page-builder') {
      urlPath = '/page-builder/';
    }

    let filePath = path.normalize(path.join(root, decodeURIComponent(urlPath)));
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
      });
      res.end(data);
    });
  })
  .listen(port, () => {
    console.log(`ChurchOS preview running at http://localhost:${port}`);
  });
