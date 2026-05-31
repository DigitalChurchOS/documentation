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
      settings: {
        colors: { primary: '#111827', secondary: '#4b5563', bg: '#ffffff', text: '#111827' },
        fonts: { header: 'Inter', body: 'Inter' },
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
