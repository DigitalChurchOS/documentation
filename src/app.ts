import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { tenantMiddleware } from './middleware/tenant';
import { requireModule } from './middleware/entitlements';
import { localeMiddleware } from './middleware/locale';
import authRoutes from './routes/auth';
import memberRoutes from './routes/members';
import servicesRoutes from './routes/services';
import cmsRoutes from './routes/cms';
import crmRoutes from './routes/crm';
import commsRoutes from './routes/communication';
import billingRoutes from './routes/billing';
import analyticsRoutes from './routes/analytics';
import pluginRoutes from './routes/plugin';
import pluginEngineRoutes from './routes/pluginExtensionsEngine';
import marketplaceRoutes from './routes/marketplace';
import localizationRoutes from './routes/localization';
import mediaRoutes from './routes/media';
import livestreamRoutes from './routes/livestream';
import publicLivestreamRoutes from './routes/publicLivestream';
import churchServicesRoutes from './routes/churchServices';
import blogRoutes from './routes/blog';
import libraryRoutes from './routes/library';
import podcastRoutes from './routes/podcast';
import aiRoutes from './routes/ai';
import signageRoutes from './routes/signage';
import worshipRoutes from './routes/worship';
import givingRoutes from './routes/giving';
import partnershipsRoutes from './routes/partnerships';
import campaignsRoutes from './routes/campaigns';
import storeRoutes from './routes/store';
import financeRoutes from './routes/finance';
import funnelRoutes from './routes/funnels';
import communityRoutes from './routes/community';
import liveChatRoutes from './routes/liveChat';
import outreachRoutes from './routes/outreach';
import attendanceRoutes from './routes/attendance';
import volunteerRoutes from './routes/volunteer';
import formsRoutes from './routes/forms';
import prayerRoutes from './routes/prayer';
import salvationRoutes from './routes/salvation';
import lmsRoutes from './routes/lms';
import bibleRoutes from './routes/bible';
import cellRoutes from './routes/cells';
import childrenRoutes from './routes/children';
import eventsRoutes from './routes/events';
import liveMeetingsRoutes from './routes/liveMeetings';
import bookingsRoutes from './routes/bookings';
import mobileRoutes from './routes/mobile';
import whiteLabelRoutes from './routes/whiteLabel';
import multiBranchRoutes from './routes/multiBranch';
import aiCopilotRoutes from './routes/aiCopilot';
import settingsRoutes from './routes/settings';
import themeEngineRoutes from './routes/themeEngine';
import tenantRoutes from './routes/tenant';
import centralizedSettingsEngineRoutes from './routes/centralizedSettingsEngine';
import developerMarketplaceRoutes from './routes/developerMarketplace';
import domainTenantManagementRoutes from './routes/domainTenantManagement';
import digitalLibraryResourceCenterRoutes from './routes/digitalLibraryResourceCenter';
import dynamicBlogPublishingEngineRoutes from './routes/dynamicBlogPublishingEngine';
import superAdminRoutes from './routes/superAdmin';

// Load .env before anything else
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

const app = express();

// ── Global middleware ──────────────────────────────────────
app.use(helmet({
  hsts: isProd, // Only enforce HTTPS in production
  contentSecurityPolicy: isProd ? undefined : false, // Disable CSP in local development
}));
app.use(express.json());

// Rate limiting: 100 requests per 15 minutes in production; high limits/bypass locally
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 999999,
  message: { error: 'Too many requests, please try again later' },
  skip: () => !isProd,
});

// ── Serve static files ──────────────────────────────────────
app.use('/themes/ecclesia', express.static(path.join(__dirname, '..', 'ecclesia-full-theme')));
app.use(express.static(path.join(__dirname, '..')));

app.get('/cms', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'cms.html'));
});

app.get(/^\/admin(?:\/.*)?$/, (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'apps', 'tenant-dashboard', 'public', 'index.html'));
});

app.get(/^\/central(?:\/.*)?$/, (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'apps', 'super-admin', 'public', 'index.html'));
});

app.get(/^\/church(?:\/.*)?$/, (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'apps', 'church-frontend', 'public', 'index.html'));
});

app.get(/^\/marketplace(?:\/.*)?$/, (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'apps', 'marketplace', 'frontend', 'index.html'));
});

app.get(/^\/developer(?:\/.*)?$/, (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'apps', 'marketplace', 'developer', 'index.html'));
});

app.get(/^\/web(?:\/.*)?$/, (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'apps', 'web', 'public', 'index.html'));
});

app.get('/page-builder', (_req, res) => {
  res.redirect('/admin?module=customizer&tab=pages');
});

app.get('/live/:id', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'live.html'));
});

// ── Health check (no tenant required) ──────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Tenant gate — everything below requires x-tenant-id ───
app.use('/api', apiLimiter, tenantMiddleware, localeMiddleware);

// ── Route mounts ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/core-website-cms', cmsRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/communication', commsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/billing-subscription-management', billingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/plugins', pluginRoutes);
app.use('/api/plugin-engine', pluginEngineRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/localization', localizationRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/livestream', livestreamRoutes);
app.use('/api/public/livestream', publicLivestreamRoutes);
app.use('/api/church-services', churchServicesRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/podcast', podcastRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-copilot', requireModule('ai-assistant-ministry-copilot'), aiCopilotRoutes);
app.use('/api/signage', signageRoutes);
app.use('/api/worship', worshipRoutes);
app.use('/api/giving', givingRoutes);
app.use('/api/partnerships', partnershipsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/funnels', funnelRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/chat', liveChatRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/volunteer', volunteerRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/prayer', prayerRoutes);
app.use('/api/salvation', salvationRoutes);
app.use('/api/lms', lmsRoutes);
app.use('/api/bible', bibleRoutes);
app.use('/api/cells', cellRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/meetings', liveMeetingsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api/whitelabel', whiteLabelRoutes);
app.use('/api/branches', multiBranchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/theme-engine', themeEngineRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/centralized-settings-engine', centralizedSettingsEngineRoutes);
app.use('/api/developer-marketplace', developerMarketplaceRoutes);
app.use('/api/domain-tenant-management', domainTenantManagementRoutes);
app.use('/api/digital-library-resource-center', digitalLibraryResourceCenterRoutes);
app.use('/api/dynamic-blog-publishing-engine', dynamicBlogPublishingEngineRoutes);
app.use('/api/super-admin', superAdminRoutes);

// ── Global error handler ──────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
