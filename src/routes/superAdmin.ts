import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = Router();

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}
const JWT_SECRET = process.env.JWT_SECRET;

type PlatformModule = {
  key: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  status: 'active' | 'hidden';
  billingRule: 'included' | 'add-on' | 'platform';
  dependencies: string[];
};

const platformModules: PlatformModule[] = [
  ['website-cms', 'Churchfront', 'Core Platform', 'layout-template'],
  ['theme-engine', 'Theme Engine', 'Core Platform', 'palette'],
  ['user-role-management', 'User & Role Management', 'Core Platform', 'shield-check'],
  ['domain-tenant-management', 'Church Details', 'Core Platform', 'globe'],
  ['billing-subscription-management', 'Billing & Subscription Management', 'Core Platform', 'badge-dollar-sign'],
  ['analytics-reporting', 'Analytics & Reporting', 'Core Platform', 'bar-chart-3'],
  ['plugin-extensions-engine', 'Plugin Extensions Engine', 'Core Platform', 'puzzle'],
  ['marketplace', 'Marketplace', 'Core Platform', 'store'],
  ['localization-multilingual-engine', 'Localization & Multilingual Engine', 'Core Platform', 'languages'],
  ['centralized-settings-engine', 'Centralized Settings Engine', 'Core Platform', 'settings'],
  ['media', 'Media Library', 'Content & Media', 'library'],
  ['livestream', 'Livestream Studio', 'Content & Media', 'radio'],
  ['church-services', 'Church Services', 'Content & Media', 'church'],
  ['dynamic-blog-publishing-engine', 'Dynamic Blog Publishing Engine', 'Content & Media', 'newspaper'],
  ['digital-library-resource-center', 'Digital Library Resource Center', 'Content & Media', 'book-open'],
  ['podcast-audio-broadcasting', 'Podcast & Audio Broadcasting', 'Content & Media', 'podcast'],
  ['ai-media-content', 'AI Media Content', 'Content & Media', 'wand-sparkles'],
  ['digital-signage-tv-display', 'Digital Signage TV Display', 'Content & Media', 'monitor'],
  ['worship-experience', 'Worship Experience', 'Content & Media', 'music'],
  ['tithes-offerings', 'Tithes & Offerings', 'Giving & Commerce', 'hand-coins'],
  ['partnerships-contributions', 'Partnerships & Contributions', 'Giving & Commerce', 'handshake'],
  ['campaigns-causes', 'Campaigns & Causes', 'Giving & Commerce', 'target'],
  ['e-commerce-church-store', 'E-Commerce Church Store', 'Giving & Commerce', 'shopping-bag'],
  ['financial-management-accounting', 'Financial Management & Accounting', 'Giving & Commerce', 'landmark'],
  ['ministry-funnels-landing-pages', 'Ministry Funnels & Landing Pages', 'Community', 'mouse-pointer-click'],
  ['member-management', 'Member Management', 'Community', 'users'],
  ['community-engagement', 'Community Engagement', 'Community', 'message-circle'],
  ['ministry-crm', 'Ministry CRM', 'Community', 'contact'],
  ['communication-notification-follow-up', 'Communication & Follow-Up', 'Community', 'send'],
  ['live-chat-pastoral-care-support', 'Live Chat Pastoral Care', 'Community', 'message-square-heart'],
  ['member-outreach-invite-campaign', 'Member Outreach Invite Campaign', 'Community', 'user-plus'],
  ['check-in-attendance-management', 'Check-In & Attendance', 'Community', 'clipboard-check'],
  ['volunteer-workforce-management', 'Volunteer Workforce Management', 'Community', 'badge-check'],
  ['forms-workflow-automation', 'Forms & Workflow Automation', 'Community', 'workflow'],
  ['prayer-testimony', 'Prayer & Testimony', 'Community', 'heart'],
  ['salvation-new-believer-journey', 'Salvation & New Believer Journey', 'Discipleship', 'sparkles'],
  ['lms-discipleship-training', 'LMS Discipleship Training', 'Discipleship', 'graduation-cap'],
  ['bible-scripture-engagement', 'Bible & Scripture Engagement', 'Discipleship', 'book'],
  ['cell-fellowship', 'Cell Fellowship', 'Discipleship', 'network'],
  ['children-family-ministry', 'Children & Family Ministry', 'Discipleship', 'baby'],
  ['events-registration', 'Events & Registration', 'Events', 'calendar-days'],
  ['live-meetings', 'Live Meetings', 'Events', 'video'],
  ['booking-appointment-management', 'Booking & Appointment Management', 'Events', 'calendar-check'],
  ['mobile-app-access', 'Mobile App Access', 'Mobile', 'smartphone'],
  ['dedicated-white-label-church-app', 'Dedicated White Label Church App', 'Mobile', 'app-window'],
  ['multi-branch-multi-campus-management', 'Multi-Branch & Multi-Campus', 'Multi-Branch', 'git-branch'],
  ['advanced-translation-multilingual', 'Advanced Translation & Multilingual', 'Multi-Branch', 'languages'],
  ['ai-assistant-ministry-copilot', 'AI Assistant Ministry Copilot', 'AI Layer', 'bot'],
].map(([key, name, category, icon]) => ({
  key,
  name,
  category,
  icon,
  description: `${name} controls for platform-wide ChurchOS operations.`,
  status: 'active',
  billingRule: key.includes('ai') || key.includes('white-label') ? 'add-on' : 'included',
  dependencies: [],
}));

// POST /api/super-admin/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  // Basic mock authentication for development
  if (email === 'superadmin@churchos.local') {
    const token = jwt.sign({ role: 'super-admin', email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { email, role: 'super-admin' } });
  } else {
    res.status(401).json({ error: 'Invalid super admin credentials' });
  }
});

// Mock endpoints to satisfy the frontend console
router.get('/overview', (_req: Request, res: Response) => {
  res.json({
    data: {
      totalChurches: 1,
      activeChurches: 1,
      trialChurches: 0,
      mrr: 49,
      totalCustomDomains: 1,
      recentActivities: [
        {
          actorEmail: 'superadmin@churchos.local',
          action: 'modules_catalog_loaded',
          targetType: 'platform-module',
          createdAt: new Date().toISOString(),
        },
      ],
    },
  });
});

router.get('/modules', (_req: Request, res: Response) => {
  res.json({ data: platformModules });
});

router.patch('/modules/:key', (req: Request, res: Response) => {
  const module = platformModules.find((item) => item.key === req.params.key);
  if (!module) {
    res.status(404).json({ error: 'Module not found' });
    return;
  }

  if (req.body.status === 'active' || req.body.status === 'hidden') {
    module.status = req.body.status;
  }

  res.json({ data: module });
});

router.get('/tenants', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany();
    res.json({ data: tenants });
  } catch(e) {
    res.json({ data: [] });
  }
});

// Catch-all to prevent other missing endpoints from crashing the console
router.use((req, res) => { res.json({ data: [] }) });

export default router;
