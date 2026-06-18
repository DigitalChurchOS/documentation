import { useState, useEffect, useMemo, useRef } from "react";
import { Preview } from "./components/Preview";
import { SettingsPanel } from "./components/SettingsPanel";
import { CustomizerPanel } from "./components/CustomizerPanel";
import { EditorPanel } from "./components/EditorPanel";
import type { ThemeState } from "./utils/domParser";
import {
  parseHtml,
  serializeHtml,
  injectThemeTokens,
  applyThemeStructure,
  cssPath,
  changeElementTag,
  changeButtonRole,
  changeCardRole,

  cleanPageForExport,
  insertBlockAtSelector,
} from "./utils/domParser";
import {
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  X,
  MousePointerClick,
  Navigation,
  Download,
  Settings,
  ChevronDown,
  ArrowLeft,
  Save,
  Loader2,
  Check,
  Eye,
} from "lucide-react";

const defaultPageTemplate = `<!DOCTYPE html>
<html>
<head>
<title>GraceHouse Church</title>
<style>
html{width:100%;max-width:100%;overflow-x:clip;scrollbar-gutter:stable}
*{box-sizing:border-box}
body{margin:0;width:100%;max-width:100%;overflow-x:clip;background:var(--site-bg);color:var(--site-text);font-family:var(--font-body);transition:transform var(--duration) var(--ease)}
img,video,canvas,svg{max-width:100%;height:auto}
header{width:100%;max-width:100%;min-width:0;height:74px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(24px,4vw,34px);background:var(--site-surface);border-bottom:1px solid var(--site-border)}
.logo{font-weight:900;min-width:0}
nav{display:flex;gap:20px;color:var(--site-muted);font-size:14px;min-width:0;flex-wrap:wrap}
nav a{color:var(--site-muted);text-decoration:none;white-space:nowrap}
section{width:100%;max-width:100%;padding:var(--section) clamp(28px,5vw,var(--padding))}
.hero{background:linear-gradient(135deg,var(--site-soft),var(--site-bg));min-height:520px}
.badge{display:inline-block;background:var(--primary-soft);color:var(--primary);padding:8px 14px;border-radius:999px;font-weight:800;margin-bottom:18px}
h1{font-family:var(--font-title);font-size:clamp(42px,7vw,var(--title-size));line-height:1;letter-spacing:var(--title-spacing,-.06em);max-width:760px;margin:0 0 18px;overflow-wrap:anywhere;text-wrap:balance}
p{font-size:clamp(17px,2.4vw,var(--subtitle-size));color:var(--site-muted);line-height:1.45;max-width:670px;overflow-wrap:anywhere}
button,.btn{display:inline-block;background:var(--primary);color:#fff;border:0;border-radius:var(--radius);padding:13px 20px;font-weight:500!important;transition:all var(--duration) var(--ease);text-decoration:none}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--gap);padding:clamp(28px,5vw,var(--padding));background:var(--site-bg);max-width:100%}
.card{display:block;min-width:0;background:var(--site-surface);border:1px solid var(--site-border);border-radius:var(--radius);padding:24px;box-shadow:var(--shadow-soft);text-decoration:none;color:var(--site-text)}
.card p{font-size:var(--body-size)}
footer{width:100%;max-width:100%;padding:42px;background:var(--site-soft);color:var(--site-muted);overflow:hidden}
.footer-widgets{display:grid;grid-template-columns:1.45fr 1fr 1fr 1fr;gap:24px;margin-bottom:28px}
.footer-widget{min-width:0}
.footer-widget h4{color:var(--site-text);margin-bottom:10px}
.footer-widget p{font-size:14px}
.footer-widget a{display:block;color:var(--site-muted);text-decoration:none;margin:8px 0;font-size:14px}
.footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:18px;border-top:1px solid var(--site-border);padding-top:18px}
.footer-bottom p{font-size:14px;margin:0}
.footer-legal{display:flex;gap:16px;flex-wrap:wrap}
.footer-legal a{color:var(--site-muted);text-decoration:none;font-size:14px}
.ec-mobile-menu-toggle{display:none}
.ec-mobile-drawer,.ec-mobile-overlay{display:none}
@media(max-width:900px){
  .grid{grid-template-columns:1fr}
  h1{font-size:clamp(38px,8vw,62px)}
}
</style>
</head>
<body>
<header data-editor-type="header" data-editor-label="Header">
  <div class="logo" data-editor-type="title">GraceHouse</div>
  <nav>
    <a href="#home" data-editor-type="button">Home</a>
    <a href="#about" data-editor-type="button">About</a>
    <a href="#events" data-editor-type="button">Events</a>
  </nav>
</header>

<section id="home" class="hero" data-editor-type="section" data-editor-label="Hero Section">
  <span class="badge" data-editor-type="badge">Welcome Home</span>
  <h1 data-editor-type="title">A church website shaped by one simple Theme DNA.</h1>
  <p data-editor-type="description">This page uses Ecclesia tokens and can be edited intelligently.</p>
  <a class="btn" href="#about" data-editor-type="button">Visit Us</a>
</section>

<section id="about" class="grid" data-editor-type="section" data-editor-label="Cards Section">
  <a href="#one" class="card" data-editor-type="card">
    <h3 data-editor-type="title">One Visual DNA</h3>
    <p data-editor-type="description">Every page follows the same design system.</p>
  </a>
  <a href="#preview" class="card" data-editor-type="card">
    <h3 data-editor-type="title">Live Preview</h3>
    <p data-editor-type="description">Preview across devices.</p>
  </a>
  <a href="#publish" class="card" data-editor-type="card">
    <h3 data-editor-type="title">Simple Publishing</h3>
    <p data-editor-type="description">Simple and powerful.</p>
  </a>
</section>

<footer data-editor-type="footer" data-editor-label="Footer">
  <div class="footer-widgets">
    <div class="footer-widget" data-editor-type="card" data-editor-label="Footer Brand">
      <h4 data-editor-type="title">GraceHouse</h4>
      <p data-editor-type="description">A welcoming church community shaped by faith, love, and purpose.</p>
    </div>
    <div class="footer-widget" data-editor-type="card" data-editor-label="Footer Menu">
      <h4 data-editor-type="title">Explore</h4>
      <a href="#home" data-editor-type="button">Home</a>
      <a href="#about" data-editor-type="button">About</a>
      <a href="#events" data-editor-type="button">Events</a>
    </div>
    <div class="footer-widget" data-editor-type="card" data-editor-label="Footer Ministries">
      <h4 data-editor-type="title">Ministries</h4>
      <a href="#kids" data-editor-type="button">Kids</a>
      <a href="#youth" data-editor-type="button">Youth</a>
      <a href="#care" data-editor-type="button">Care</a>
    </div>
    <div class="footer-widget" data-editor-type="card" data-editor-label="Footer Contact">
      <h4 data-editor-type="title">Visit</h4>
      <p data-editor-type="description">Join us this Sunday and experience a warm church family.</p>
    </div>
  </div>

  <div class="footer-bottom">
    <p class="footer-copy" data-editor-type="description">© GraceHouse Church. All rights reserved.</p>
    <div class="footer-legal">
      <a class="privacy-link" href="#privacy" data-editor-type="button">Privacy Policy</a>
      <a class="terms-link" href="#terms" data-editor-type="button">Terms of Use</a>
    </div>
  </div>
</footer>
</body>
</html>`;

const AVAILABLE_THEMES = [
  {
    id: "ecclesia",
    name: "Ecclesia Theme",
    description: "A beautiful, content-rich design system for modern digital-first churches.",
    folderName: "ecclesia-full-theme",
    thumbnail: "/themes/ecclesia-full-theme/thumbnail.png"
  }
];

const CUSTOMIZER_PAGES_LIST = [
  { value: "index.html", label: "Home Page (index.html)" },
  { value: "about.html", label: "About Page (about.html)" },
  { value: "contact.html", label: "Contact Page (contact.html)" },
  { value: "login.html", label: "Member Login / Register (login.html)" },
  { value: "account.html", label: "Member Account Profile (account.html)" },
  { value: "ministries.html", label: "Ministries Page (ministries.html)" },
  { value: "sermons.html", label: "Sermons Archive (sermons.html)" },
  { value: "media-single.html", label: "Single Sermon (media-single.html)" },
  { value: "media-archive.html", label: "Media Archive (media-archive.html)" },
  { value: "livestream-page.html", label: "Livestream Page (livestream-page.html)" },
  { value: "giving.html", label: "Giving Page (giving.html)" },
  { value: "giving-partnership.html", label: "Partnership Campaign (giving-partnership.html)" },
  { value: "events.html", label: "Events Landing (events.html)" },
  { value: "event-single.html", label: "Single Event (event-single.html)" },
  { value: "event-register.html", label: "Event Registration (event-register.html)" },
  { value: "events-archive.html", label: "Events Archive (events-archive.html)" },
  { value: "blog-archive.html", label: "Blog Archive (blog-archive.html)" },
  { value: "blog-single.html", label: "Single Blog Post (blog-single.html)" },
  { value: "podcast-archive.html", label: "Podcast Archive (podcast-archive.html)" },
  { value: "podcast-episode.html", label: "Podcast Episode (podcast-episode.html)" },
  { value: "services-archive.html", label: "Services Archive (services-archive.html)" },
  { value: "service-single.html", label: "Single Service (service-single.html)" },
  { value: "library-archive.html", label: "Library Archive (library-archive.html)" },
  { value: "resource-single.html", label: "Single Resource (resource-single.html)" },
  { value: "courses-archive.html", label: "Courses Archive (courses-archive.html)" },
  { value: "course-main.html", label: "Course Landing (course-main.html)" },
  { value: "lesson-single.html", label: "Single Lesson (lesson-single.html)" },
  { value: "prayer-home.html", label: "Prayer Home (prayer-home.html)" },
  { value: "prayer-room.html", label: "Prayer Room (prayer-room.html)" },
  { value: "prayer-wall.html", label: "Prayer Wall (prayer-wall.html)" },
  { value: "prayer.html", label: "Prayer & Testimony (prayer.html)" },
  { value: "testimony-wall.html", label: "Testimony Wall (testimony-wall.html)" },
  { value: "testimony-single.html", label: "Single Testimony (testimony-single.html)" },
  { value: "testimony-submit.html", label: "Submit Testimony (testimony-submit.html)" },
  { value: "worship.html", label: "Worship / Style Guide (worship.html)" }
];


const CUSTOMIZER_FILE_SLUGS: Record<string, string> = {
  'index.html': '',
  'home.html': '',
  'about.html': 'about',
  'sermons.html': 'sermons',
  'events.html': 'events',
  'ministries.html': 'ministries',
  'prayer.html': 'prayer',
  'contact.html': 'contact',
  'login.html': 'login',
  'account.html': 'account',
  'giving.html': 'giving',
  'giving-partnership.html': 'partnership',
  'livestream-page.html': 'livestream',
  'media-archive.html': 'media',
  'media-single.html': 'media/sample-message',
  'podcast-archive.html': 'podcast',
  'podcast-episode.html': 'podcast/sample-episode',
  'blog-archive.html': 'blog',
  'blog-single.html': 'blog/sample-post',
  'services-archive.html': 'services',
  'service-single.html': 'services/sample-service',
  'library-archive.html': 'library',
  'resource-single.html': 'library/sample-resource',
  'courses-archive.html': 'courses',
  'course-main.html': 'courses/main',
  'lesson-single.html': 'courses/lesson',
  'events-archive.html': 'events/archive',
  'event-single.html': 'events/sample-event',
  'event-register.html': 'events/register',
  'prayer-home.html': 'prayer-home',
  'prayer-wall.html': 'prayer/wall',
  'prayer-room.html': 'prayer/room',
  'testimony-wall.html': 'testimonies',
  'testimony-single.html': 'testimonies/sample-story',
  'testimony-submit.html': 'testimonies/submit',
  'worship.html': 'worship',
};

const apiFetch = async (method: string, path: string, body?: any) => {
  const tenantId = localStorage.getItem("churchos.tenantId") || "demo-church-local";
  const token = localStorage.getItem("churchos.token") || "local-preview-token";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-tenant-id": tenantId,
    "Authorization": `Bearer ${token}`
  };
  const options: RequestInit = {
    method,
    headers
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(path, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
};

function getSubdomainFromHostname(): string | null {
  const host = window.location.hostname.toLowerCase();
  const parts = host.split('.');
  
  const BASE_DOMAINS = ['churched.online', 'churchos.local', 'churchos.com', 'localhost'];
  
  for (const base of BASE_DOMAINS) {
    if (host === base) {
      return null;
    }
    if (host.endsWith(`.${base}`)) {
      return host.slice(0, -(base.length + 1));
    }
  }
  
  if (parts.length > 2 && !BASE_DOMAINS.includes(host)) {
    return parts[0];
  }
  
  return null;
}

function getFullHtml(blocks?: any[]): string | null {
  if (!blocks || blocks.length === 0) return null;
  const block = blocks.find((b: any) => typeof b.html === 'string' || typeof b.content === 'string');
  if (!block) return null;
  const html = block.html || block.content || null;
  if (!html) return null;

  // Validate that the HTML has actual page structure — not just a stub.
  // If the body lacks any header, footer, section, nav, or main element,
  // the content is broken/stale and we should fall back to the theme template.
  const hasStructure = /<(header|footer|section|nav|main)[\s>]/i.test(html);
  if (!hasStructure) {
    console.warn("getFullHtml: DB content lacks page structure (no header/footer/section/nav/main). Falling back to theme template.");
    return null;
  }

  return html;
}

export function App() {
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const [pageId, setPageId] = useState<string>(() => urlParams.get("pageId") || "");
  const [themeId, setThemeId] = useState<string>("");
  const [websiteId, setWebsiteId] = useState<string>("");
  const [resolvingTenant, setResolvingTenant] = useState(true);
  const [tenantError, setTenantError] = useState<string | null>(null);
  const [tenantSubdomain, setTenantSubdomain] = useState<string>(() => localStorage.getItem("churchos.subdomain") || "");
  
  const [pagesList, setPagesList] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'published' | 'preview'>('idle');
  const previewWindowRef = useRef<Window | null>(null);

  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem("ec_autosave_theme_folder") || "ecclesia-full-theme";
  });

  useEffect(() => {
    localStorage.setItem("ec_autosave_theme_folder", currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const initTenantAndEntities = async () => {
      try {
        const queryTenantId = urlParams.get("tenantId");
        const querySubdomain = urlParams.get("subdomain");
        const hostSubdomain = getSubdomainFromHostname();
        
        let resolvedTenantId = "";
        let resolvedSubdomain = "";

        if (queryTenantId) {
          resolvedTenantId = queryTenantId;
        } else if (querySubdomain) {
          const res = await fetch(`/api/public/resolve-subdomain?subdomain=${encodeURIComponent(querySubdomain)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.data && json.data.id) {
              resolvedTenantId = json.data.id;
              resolvedSubdomain = json.data.subdomain || querySubdomain;
            }
          }
        } else if (hostSubdomain) {
          const res = await fetch(`/api/public/resolve-subdomain?subdomain=${encodeURIComponent(hostSubdomain)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.data && json.data.id) {
              resolvedTenantId = json.data.id;
              resolvedSubdomain = json.data.subdomain || hostSubdomain;
            }
          }
        }

        if (resolvedTenantId) {
          localStorage.setItem("churchos.tenantId", resolvedTenantId);
          if (resolvedSubdomain) {
            localStorage.setItem("churchos.subdomain", resolvedSubdomain);
            setTenantSubdomain(resolvedSubdomain);
          }
        } else {
          const existing = localStorage.getItem("churchos.tenantId");
          if (!existing || existing === "demo-church-local") {
            localStorage.setItem("churchos.tenantId", "de4498dc-069d-45b6-bc56-1a90ade1fb34");
          }
        }

        const existingToken = localStorage.getItem("churchos.token");
        if (!existingToken || existingToken === "local-preview-token") {
          localStorage.setItem("churchos.token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZTdlMjhlYS05ZmJhLTQ1MjEtYjUzZS1mMDBhMTcyZDk0ZWQiLCJ0ZW5hbnRJZCI6ImRlNDQ5OGRjLTA2OWQtNDViNi1iYzU2LTFhOTBhZGUxZmIzNCIsImVtYWlsIjoiYWRtaW5AdGhlbWUtdGVzdC5jb20iLCJpYXQiOjE3ODE2NDk3NjV9.NQITrY91wCtviuWIc27bYk3BbnqHPkwjqqNPodaPlG0");
        }

        // Fetch themes, websites and pages
        const themesRes = await apiFetch("GET", "/api/theme-engine/themes");
        const websitesRes = await apiFetch("GET", "/api/cms/websites");
        const pagesRes = await apiFetch("GET", "/api/cms/pages");
        if (!resolvedSubdomain) {
          try {
            const domainRes = await apiFetch("GET", "/api/tenant/domain");
            const domainSubdomain = domainRes?.data?.subdomain || "";
            if (domainSubdomain) {
              localStorage.setItem("churchos.subdomain", domainSubdomain);
              setTenantSubdomain(domainSubdomain);
            }
          } catch (domainErr) {
            const storedSubdomain = localStorage.getItem("churchos.subdomain") || "";
            if (storedSubdomain) setTenantSubdomain(storedSubdomain);
            console.warn("Could not resolve tenant subdomain for preview URLs:", domainErr);
          }
        }

        if (pagesRes && pagesRes.data) {
          setPagesList(pagesRes.data);
        }

        // 2. Resolve websiteId
        const queryWebsiteId = urlParams.get("websiteId") || "";
        let finalWebsiteId = "";
        let resolvedWebsite: any = null;
        if (websitesRes && websitesRes.data) {
          const matched = websitesRes.data.find((w: any) => w.id === queryWebsiteId);
          if (matched) {
            finalWebsiteId = matched.id;
            resolvedWebsite = matched;
          } else {
            if (queryWebsiteId) {
              throw new Error("404 Website not found under current tenant context");
            }
            if (websitesRes.data.length > 0) {
              finalWebsiteId = websitesRes.data[0].id;
              resolvedWebsite = websitesRes.data[0];
            }
          }
        }
        setWebsiteId(finalWebsiteId);

        // 1. Resolve themeId
        const queryThemeId = urlParams.get("themeId") || "";
        let finalThemeId = "";
        if (resolvedWebsite && resolvedWebsite.themeId) {
          finalThemeId = resolvedWebsite.themeId;
        } else if (themesRes && themesRes.data) {
          const matched = themesRes.data.find(
            (t: any) => t.id === queryThemeId || t.name.toLowerCase() === queryThemeId.toLowerCase()
          );
          if (matched) {
            finalThemeId = matched.id;
          } else if (themesRes.data.length > 0) {
            finalThemeId = themesRes.data[0].id;
          }
        }
        setThemeId(finalThemeId);

        // 3. Resolve pageId
        let finalPageId = pageId;
        if (finalPageId) {
          const matchedPage = pagesRes?.data?.find((p: any) => p.id === finalPageId);
          if (!matchedPage) {
            throw new Error("404 Page not found under current tenant context");
          }
        } else if (pagesRes && pagesRes.data) {
          const homePage = pagesRes.data.find((p: any) => p.slug === "" || p.isHome);
          if (homePage) {
            finalPageId = homePage.id;
            setPageId(homePage.id);
          }
        }

        // 4. Update URL search parameters silently
        const currentUrl = new URL(window.location.href);
        let urlChanged = false;
        if (finalThemeId && currentUrl.searchParams.get("themeId") !== finalThemeId) {
          currentUrl.searchParams.set("themeId", finalThemeId);
          urlChanged = true;
        }
        if (finalWebsiteId && currentUrl.searchParams.get("websiteId") !== finalWebsiteId) {
          currentUrl.searchParams.set("websiteId", finalWebsiteId);
          urlChanged = true;
        }
        if (finalPageId && currentUrl.searchParams.get("pageId") !== finalPageId) {
          currentUrl.searchParams.set("pageId", finalPageId);
          urlChanged = true;
        }
        
        if (urlChanged) {
          window.history.replaceState({}, "", currentUrl.toString());
        }

      } catch (err: any) {
        console.error("Initialization error:", err);
        const errMsg = err.message || "";
        if (errMsg.includes("Tenant not found") || errMsg.includes("404") || errMsg.includes("401") || errMsg.includes("token")) {
          console.warn("Detected invalid/stale session. Auto-recovering tenant and token...");
          localStorage.setItem("churchos.tenantId", "de4498dc-069d-45b6-bc56-1a90ade1fb34");
          localStorage.setItem("churchos.token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZTdlMjhlYS05ZmJhLTQ1MjEtYjUzZS1mMDBhMTcyZDk0ZWQiLCJ0ZW5hbnRJZCI6ImRlNDQ5OGRjLTA2OWQtNDViNi1iYzU2LTFhOTBhZGUxZmIzNCIsImVtYWlsIjoiYWRtaW5AdGhlbWUtdGVzdC5jb20iLCJpYXQiOjE3ODE2NDk3NjV9.NQITrY91wCtviuWIc27bYk3BbnqHPkwjqqNPodaPlG0");
          window.location.reload();
          return;
        }
        setTenantError(err.message || "Failed to initialize customizer workspace settings.");
      } finally {
        setResolvingTenant(false);
      }
    };

    initTenantAndEntities();
  }, []);

  // Customizer state
  const [themeState, setThemeState] = useState<ThemeState>(() => {
    const saved = localStorage.getItem("ec_autosave_theme");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      preset: "Horizon",
      personality: "Modern",
      typography: "Modern Sans",
      typeSize: "Balanced",
      family: "Ocean",
      style: "Rich",
      shape: "Soft",
      visual: "Elevated",
      density: "Comfortable",
      motion: "Gentle",
      atmosphere: "Light",
      previewMode: "light",
      headerStyle: "floating",
      headerContentBoxed: false,
      headerLook: "flat",
      headerGlass: false,
      headerShadow: true,
      headerShadowIntensity: 'medium',
      headerShadowThemed: false,
      headerSolidThemed: false,
      headerBorder: false,
      headerBorderSize: "small",
      headerBorderColor: "accent",
      headerLayout: "logo-left",
      headerEffect: "static",
      headerFontSize: "medium",
      headerFontWeight: "bold",
      mobileMenuPosition: "right",
      mobileDrawerMode: "reveal",
      mobileHamburgerShape: "circle",
      mobileDrawerButtonsFullWidth: false,
      footerStyle: "classic",
      footerWidgets: "show",
      footerWidgetLayout: "feature",
      footerBottom: "split",
      footerLegal: "show",
      footerManual: false,
      copyrightText: "© GraceHouse Church. All rights reserved.",
      privacyLabel: "Privacy Policy",
      privacyHref: "#privacy",
      termsLabel: "Terms of Use",
      termsHref: "#terms",
    };
  });

  // UI state
  const [deviceSize, setDeviceSize] = useState<"desktop" | "laptop" | "tablet" | "mobile">("desktop");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorMode, setEditorMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "customizer" | "editor">("customizer");
  const [isPageMenuOpen, setIsPageMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragData, setDragData] = useState<{ blockType: string; category: string; html: string } | null>(null);

  // HTML Page state
  const [rawHtml, setRawHtml] = useState<string>(() => {
    const cached = localStorage.getItem("ec_autosave_html");
    // Only use cached HTML if it has actual page structure
    if (cached && /<(header|footer|section|nav|main)[\s>]/i.test(cached)) {
      return cached;
    }
    return defaultPageTemplate;
  });
  const [importedFilename, setImportedFilename] = useState<string>(() => {
    return localStorage.getItem("ec_autosave_filename") || "default-theme-page.html";
  });
  
  // Element selection state
  const [selectedElement, setSelectedElement] = useState<{
    path: string;
    type: string;
    label: string;
    text: string;
    href: string;
    src: string;
    alt: string;
    tagName?: string;
  } | null>(null);

  const [activeSectionPath, setActiveSectionPath] = useState<string | null>(null);


  // Auto-save effects
  useEffect(() => {
    localStorage.setItem("ec_autosave_theme", JSON.stringify(themeState));
  }, [themeState]);

  useEffect(() => {
    localStorage.setItem("ec_autosave_html", rawHtml);
  }, [rawHtml]);

  useEffect(() => {
    localStorage.setItem("ec_autosave_filename", importedFilename);
  }, [importedFilename]);

  // Pages list is loaded and resolved inside initTenantAndEntities

  // Load theme settings from CMS
  useEffect(() => {
    const loadThemeSettings = async () => {
      if (!themeId) return;
      try {
        const res = await apiFetch("GET", "/api/theme-engine/themes");
        if (res && res.data) {
          const themeRecord = res.data.find((t: any) => t.id === themeId);
          if (themeRecord) {
            const rawSettings = themeRecord.draftSettings || themeRecord.settings || "{}";
            const settings = typeof rawSettings === "string" ? JSON.parse(rawSettings) : rawSettings;
            
            const filteredSettings: any = {};
            for (const key of Object.keys(settings)) {
              if (settings[key] !== null && typeof settings[key] !== "object") {
                filteredSettings[key] = settings[key];
              }
            }

            setThemeState((prev) => ({
              ...prev,
              ...filteredSettings,
            }));
          }
        }
      } catch (err) {
        console.warn("Failed to load theme settings:", err);
      }
    };
    loadThemeSettings();
  }, [themeId]);

  // Parse sections inside HTML
  const sections = useMemo(() => {
    const doc = parseHtml(rawHtml);
    const nodes = Array.from(doc.querySelectorAll("header, section, footer, main, [data-editor-type='header'], [data-editor-type='section'], [data-editor-type='footer']"));
    return nodes.map((node) => {
      const path = cssPath(node);
      const tag = node.tagName.toLowerCase();
      let label = (node as HTMLElement).dataset.editorLabel || "Section";
      if (tag === "header") label = "Header";
      if (tag === "footer") label = "Footer";

      return {
        path,
        type: tag === "header" ? "header" : tag === "footer" ? "footer" : "section",
        label,
      };
    });
  }, [rawHtml]);

  // Parse children of current active section
  const childrenOfSection = useMemo(() => {
    if (!activeSectionPath) return [];
    const doc = parseHtml(rawHtml);
    const parent = doc.querySelector(activeSectionPath);
    if (!parent) return [];

    const nodes = Array.from(parent.querySelectorAll("[data-editor-type], h1, h2, h3, h4, p, button, a, img, .card, .feature-card, .person-card"));
    return nodes
      .filter((n) => n !== parent)
      .map((node) => {
        const path = cssPath(node);
        const tag = node.tagName.toLowerCase();
        let type = "element";
        if ((node as HTMLElement).dataset.editorType) type = (node as HTMLElement).dataset.editorType!;
        else if (["h1", "h2", "h3", "h4"].includes(tag)) type = "title";
        else if (tag === "p") type = "description";
        else if (["a", "button"].includes(tag)) type = "button";
        else if (tag === "img") type = "image";
        else if (node.classList.contains("card") || node.classList.contains("feature-card") || node.classList.contains("person-card")) type = "card";

        return {
          path,
          type,
          label: (node as HTMLElement).dataset.editorLabel || type.toUpperCase(),
          text: (node as HTMLElement).innerText || (node as HTMLImageElement).alt || type,
        };
      });
  }, [rawHtml, activeSectionPath]);

  // Compute live HTML to render in iframe (applies theme styling dynamically)
  const renderedHtml = useMemo(() => {
    const doc = parseHtml(rawHtml);
    injectThemeTokens(doc, themeState);
    applyThemeStructure(doc, themeState);

    // Inject base tag so relative assets resolve correctly inside the srcDoc iframe
    let baseTag = doc.querySelector("base");
    if (!baseTag) {
      baseTag = doc.createElement("base");
      doc.head.insertBefore(baseTag, doc.head.firstChild);
    }
    baseTag.setAttribute("href", `${window.location.origin}/themes/${currentTheme}/`);

    return serializeHtml(doc);
  }, [rawHtml, themeState, currentTheme]);

  const fetchPage = async (filename: string, themeFolder = currentTheme, targetPageId = pageId) => {
    try {
      const baseName = filename.split("/").pop() || "index.html";
      const timestamp = new Date().getTime();

      if (targetPageId) {
        try {
          const res = await apiFetch("GET", `/api/cms/pages/${targetPageId}`);
          if (res && res.data) {
            const pageData = res.data;
            const blocks = typeof pageData.draftContent === 'string'
              ? JSON.parse(pageData.draftContent || "[]")
              : (pageData.draftContent || (typeof pageData.content === 'string'
                ? JSON.parse(pageData.content || "[]")
                : (pageData.content || [])));
            
            const savedHtml = getFullHtml(blocks);
            if (savedHtml) {
              setRawHtml(savedHtml);
              setImportedFilename(baseName);
              setSelectedElement(null);
              setActiveSectionPath(null);

              return;
            }
          }
        } catch (dbErr) {
          console.warn("Could not load page from database, falling back to theme template:", dbErr);
        }
      }

      const response = await fetch(`/themes/${themeFolder}/${baseName}?t=${timestamp}`);
      if (response.ok) {
        const text = await response.text();
        setRawHtml(text);
        setImportedFilename(baseName);
        setSelectedElement(null);
        setActiveSectionPath(null);
      }
    } catch (err) {
      console.warn("Fetch error, keeping current template", err);
    }
  };

  const navigateCustomizerPage = async (filename: string) => {
    const rawFilename = filename.split(/[?#]/)[0].split("/").filter(Boolean).pop() || "index.html";
    const urlFilename = rawFilename.includes(".")
      ? rawFilename
      : (Object.keys(CUSTOMIZER_FILE_SLUGS).find((key) => CUSTOMIZER_FILE_SLUGS[key] === rawFilename) || `${rawFilename}.html`);
    const mappedSlug = CUSTOMIZER_FILE_SLUGS[urlFilename] !== undefined 
      ? CUSTOMIZER_FILE_SLUGS[urlFilename] 
      : (urlFilename === "index.html" ? "" : urlFilename.replace(".html", ""));
    
    let pageRecord = pagesList.find((p) => p.slug === mappedSlug);
    let resolvedPageId = pageRecord?.id || "";
    
    if (!pageRecord && websiteId) {
      try {
        const opt = CUSTOMIZER_PAGES_LIST.find(p => p.value === urlFilename);
        const title = opt ? opt.label.split(" (")[0] : urlFilename.replace(".html", "");
        const newPage = await apiFetch("POST", "/api/cms/pages", {
          websiteId,
          slug: mappedSlug,
          title: title,
          status: "draft",
          content: []
        });
        if (newPage && newPage.data) {
          pageRecord = newPage.data;
          resolvedPageId = pageRecord.id;
          setPagesList((prev) => [...prev, pageRecord]);
        }
      } catch (createErr) {
        console.error("Failed to dynamically create page in database:", createErr);
      }
    }

    if (resolvedPageId) {
      setPageId(resolvedPageId);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("pageId", resolvedPageId);
      window.history.pushState({}, "", newUrl.toString());
    } else {
      setPageId("");
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("pageId");
      window.history.pushState({}, "", newUrl.toString());
    }
    
    fetchPage(urlFilename, currentTheme, resolvedPageId);
  };

  const handleSelectTheme = (themeFolder: string) => {
    setCurrentTheme(themeFolder);
    fetchPage("index.html", themeFolder);
  };

  // Load correct page template once tenant resolves and pages are loaded
  useEffect(() => {
    if (resolvingTenant) return;

    const pageRecord = pagesList.find((p) => p.id === pageId);
    const slug = pageRecord ? pageRecord.slug : "";
    const filename = Object.keys(CUSTOMIZER_FILE_SLUGS).find(
      (key) => CUSTOMIZER_FILE_SLUGS[key] === slug
    ) || "index.html";

    fetchPage(filename, currentTheme, pageId);
  }, [resolvingTenant]);

  // Sync scroll lock on escape key and listen for frame navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "ec-navigate") {
        navigateCustomizerPage(event.data.href);
      } else if (event.data && event.data.type === "ec-block-dropped") {
        const { targetPath, position, html } = event.data.data;
        setIsDragging(false);
        setDragData(null);
        let nextHtml = "";
        setRawHtml((currentHtml) => {
          const doc = parseHtml(currentHtml);
          const newSelector = insertBlockAtSelector(doc, targetPath, position, html);
          nextHtml = newSelector ? serializeHtml(doc) : currentHtml;
          return nextHtml;
        });

        // Trigger auto-save immediately with updated HTML
        setTimeout(() => {
          if (nextHtml) {
            saveThemeDraft(nextHtml, themeState, true);
          }
        }, 100);
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("message", handleMessage);
    };
  }, [pagesList, currentTheme, websiteId]);

  const handleImport = (content: string, filename: string) => {
    setRawHtml(content);
    setImportedFilename(filename);
    setSelectedElement(null);
    setActiveSectionPath(null);
  };

  const handleSaveElementProperties = (
    path: string,
    updates: { text?: string; href?: string; src?: string; alt?: string }
  ) => {
    const doc = parseHtml(rawHtml);
    const el = doc.querySelector(path);
    if (el) {
      if (updates.text !== undefined) (el as HTMLElement).innerText = updates.text;
      if (updates.href !== undefined) el.setAttribute("href", updates.href);
      if (updates.src !== undefined) el.setAttribute("src", updates.src);
      if (updates.alt !== undefined) el.setAttribute("alt", updates.alt);
      setRawHtml(serializeHtml(doc));
      
      // Update local selection state
      if (selectedElement && selectedElement.path === path) {
        setSelectedElement({
          ...selectedElement,
          text: updates.text !== undefined ? updates.text : selectedElement.text,
          href: updates.href !== undefined ? updates.href : selectedElement.href,
          src: updates.src !== undefined ? updates.src : selectedElement.src,
          alt: updates.alt !== undefined ? updates.alt : selectedElement.alt,
        });
      }
    }
  };

  const handleRewriteTag = (path: string, newTag: string) => {
    const doc = parseHtml(rawHtml);
    const newPath = changeElementTag(doc, path, newTag);
    setRawHtml(serializeHtml(doc));
    
    // Update local selection path to match new node type
    if (selectedElement && selectedElement.path === path) {
      setSelectedElement({
        ...selectedElement,
        path: newPath,
        tagName: newTag.toUpperCase(),
      });
    }
  };

  const handleChangeButtonRole = (path: string, role: "primary" | "soft" | "light") => {
    const doc = parseHtml(rawHtml);
    changeButtonRole(doc, path, role);
    setRawHtml(serializeHtml(doc));
  };

  const handleChangeCardRole = (path: string, role: "generic" | "icon" | "person") => {
    const doc = parseHtml(rawHtml);
    changeCardRole(doc, path, role);
    setRawHtml(serializeHtml(doc));
  };

  const handleDuplicateElement = (path: string) => {
    const doc = parseHtml(rawHtml);
    const el = doc.querySelector(path);
    if (el) {
      const clone = el.cloneNode(true);
      el.after(clone);
      setRawHtml(serializeHtml(doc));
      setSelectedElement(null);
    }
  };

  const handleDeleteElement = (path: string) => {
    const doc = parseHtml(rawHtml);
    const el = doc.querySelector(path);
    if (el) {
      el.remove();
      setRawHtml(serializeHtml(doc));
      setSelectedElement(null);
    }
  };

  const handleSaveSectionStyles = (path: string, bg: string, bgImg: string) => {
    const doc = parseHtml(rawHtml);
    const el = doc.querySelector(path);
    if (el) {
      if (bg) (el as HTMLElement).style.background = bg;
      if (bgImg) (el as HTMLElement).style.backgroundImage = `url('${bgImg}')`;
      setRawHtml(serializeHtml(doc));
    }
  };



  const handleClose = () => {
    window.close();
    setTimeout(() => {
      window.location.href = "/admin/";
    }, 100);
  };

  const saveThemeDraft = async (latestHtml: string, latestThemeState: ThemeState, isAuto = false) => {
    if (!themeId) {
      if (!isAuto) alert("No active theme identified to save customizations.");
      return;
    }
    setSaveStatus('saving');
    try {
      const draftRes = await apiFetch("PATCH", `/api/theme-engine/themes/${themeId}/customization/draft`, latestThemeState);
      let activeThemeId = themeId;
      if (draftRes && draftRes.data && draftRes.data.id) {
        activeThemeId = draftRes.data.id;
        setThemeId(activeThemeId);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("themeId", activeThemeId);
        window.history.replaceState({}, "", newUrl.toString());
      }
      if (pageId) {
        const doc = parseHtml(latestHtml);
        injectThemeTokens(doc, latestThemeState);
        applyThemeStructure(doc, latestThemeState);
        const cleanedHtml = cleanPageForExport(doc);
        const blocksPayload = [{ html: cleanedHtml }];
        await apiFetch("PATCH", `/api/cms/pages/${pageId}/draft`, { draftContent: blocksPayload });
      }
      setSaveStatus('saved');
    } catch (err: any) {
      console.error("Save error:", err);
      if (!isAuto) alert(`Failed to save: ${err.message || err}`);
      setSaveStatus('idle');
    }
  };

  const handleSave = () => {
    saveThemeDraft(rawHtml, themeState, false);
  };

  const handlePublish = async () => {
    if (publishStatus === 'preview') {
      const pageSlug = CUSTOMIZER_FILE_SLUGS[importedFilename] !== undefined 
        ? CUSTOMIZER_FILE_SLUGS[importedFilename] 
        : (importedFilename === "index.html" ? "" : importedFilename.replace(".html", ""));
      const slugPath = pageSlug ? `/${pageSlug}` : "/";

      // Build the subdomain-based preview URL
      // Production: [subdomain].churched.online/[slug]
      // Local dev:  [subdomain].localhost:3000/[slug]
      const currentHost = window.location.hostname.toLowerCase();
      const port = window.location.port;
      const protocol = window.location.protocol;
      const subdomain = getSubdomainFromHostname();
      const previewSubdomain = subdomain || tenantSubdomain || localStorage.getItem("churchos.subdomain") || "demo";

      let previewOrigin: string;
      if (subdomain) {
        // Already on a subdomain — use same origin
        previewOrigin = `${protocol}//${window.location.host}`;
      } else if (currentHost === 'localhost' || currentHost.endsWith('.localhost')) {
        // Local dev mirrors production subdomain routing.
        previewOrigin = `${protocol}//${previewSubdomain}.localhost${port ? `:${port}` : ''}`;
      } else {
        // Production uses the tenant subdomain on churched.online.
        previewOrigin = `${protocol}//${previewSubdomain}.churched.online`;
      }
      const previewUrl = `${previewOrigin}${slugPath}`;
      
      if (previewWindowRef.current && !previewWindowRef.current.closed) {
        previewWindowRef.current.location.href = previewUrl;
        previewWindowRef.current.focus();
      } else {
        previewWindowRef.current = window.open(previewUrl, 'church_preview_tab');
      }
      return;
    }

    if (!themeId) {
      alert("No active theme identified to publish.");
      return;
    }
    setPublishStatus('publishing');
    try {
      const draftRes = await apiFetch("PATCH", `/api/theme-engine/themes/${themeId}/customization/draft`, themeState);
      let activeThemeId = themeId;
      if (draftRes && draftRes.data && draftRes.data.id) {
        activeThemeId = draftRes.data.id;
        setThemeId(activeThemeId);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("themeId", activeThemeId);
        window.history.replaceState({}, "", newUrl.toString());
      }

      if (pageId) {
        const doc = parseHtml(renderedHtml);
        const cleanedHtml = cleanPageForExport(doc);
        const blocksPayload = [{ html: cleanedHtml }];
        await apiFetch("PATCH", `/api/cms/pages/${pageId}/draft`, { draftContent: blocksPayload });
      }

      await apiFetch("POST", `/api/theme-engine/themes/${activeThemeId}/customization/publish`);

      if (websiteId) {
        await apiFetch("POST", `/api/theme-engine/themes/${activeThemeId}/activate`, { websiteId });
      }

      if (pageId) {
        await apiFetch("POST", `/api/cms/pages/${pageId}/publish`);
      }

      setPublishStatus('published');
      
      setTimeout(() => {
        setPublishStatus('preview');
      }, 1000);
      
    } catch (err: any) {
      console.error("Publish error:", err);
      alert(`Failed to publish: ${err.message || err}`);
      setPublishStatus('idle');
    }
  };

  useEffect(() => {
    if (saveStatus === 'saved') {
      setSaveStatus('idle');
    }
    if (publishStatus === 'published' || publishStatus === 'preview') {
      setPublishStatus('idle');
    }
  }, [themeState, rawHtml]);

  if (resolvingTenant) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0f172a",
        color: "#f8fafc",
        fontFamily: "sans-serif"
      }}>
        <Loader2 size={48} className="animate-spin" style={{ color: "#38bdf8", marginBottom: "16px" }} />
        <h3>Initializing Website Editing Studio...</h3>
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Resolving workspace tenant configuration...</p>
      </div>
    );
  }

  if (tenantError) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0f172a",
        color: "#f8fafc",
        fontFamily: "sans-serif",
        padding: "20px",
        textAlign: "center"
      }}>
        <div style={{
          background: "#1e293b",
          border: "1px solid #ef4444",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "480px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
        }}>
          <h2 style={{ color: "#f87171", marginTop: 0, marginBottom: "16px" }}>Workspace Configuration Error</h2>
          <p style={{ color: "#cbd5e1", fontSize: "15px", lineHeight: "1.5", marginBottom: "24px" }}>
            {tenantError}
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("churchos.tenantId");
              localStorage.removeItem("churchos.token");
              window.location.reload();
            }}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: 0,
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#dc2626")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#ef4444")}
          >
            Reset Workspace & Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${isFullscreen ? "fullscreen" : ""}`} id="app">
      <header className="topbar">
        <div className="brand" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
          <button
            className="icon-btn"
            onClick={handleClose}
            title="Back to Dashboard"
            style={{
              padding: "6px 10px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              cursor: "pointer",
              color: "inherit",
              display: "flex",
              alignItems: "center"
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <strong style={{ whiteSpace: "nowrap" }}>Theme Builder</strong>
        </div>

        <div className="page-switcher">
          <label>Page</label>
          <div className="custom-dropdown" 
               tabIndex={0} 
               onBlur={(e) => {
                 if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                   setIsPageMenuOpen(false);
                 }
               }}
          >
            <div className="dropdown-selected" onClick={() => setIsPageMenuOpen(!isPageMenuOpen)}>
               <span className="dropdown-label">{
                 CUSTOMIZER_PAGES_LIST.find(p => p.value === importedFilename)?.label || `${importedFilename} (Custom)`
               }</span>
               <ChevronDown size={14} className={`dropdown-icon ${isPageMenuOpen ? "open" : ""}`} />
             </div>
             {isPageMenuOpen && (
               <div className="dropdown-options">
                 {CUSTOMIZER_PAGES_LIST.map((opt) => (

                  <div
                    key={opt.value}
                    className={`dropdown-item ${importedFilename === opt.value ? "active" : ""}`}
                    onClick={async () => {
                      await navigateCustomizerPage(opt.value);
                      setIsPageMenuOpen(false);
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="top-actions">
          <button
            className={`editor-switch ${!editorMode ? "browse" : ""}`}
            onClick={() => setEditorMode(!editorMode)}
            title={editorMode ? "Switch to Browse Mode" : "Switch to Editor Mode"}
          >
            <span className="switch-knob">
              {editorMode ? <MousePointerClick /> : <Navigation />}
            </span>
          </button>

          <div className="screen-switcher">
            <button
              className={`screen-btn ${deviceSize === "desktop" ? "active" : ""}`}
              onClick={() => setDeviceSize("desktop")}
            >
              <Monitor />
              <span>Desktop</span>
            </button>
            <button
              className={`screen-btn ${deviceSize === "laptop" ? "active" : ""}`}
              onClick={() => setDeviceSize("laptop")}
            >
              <Laptop />
              <span>Laptop</span>
            </button>
            <button
              className={`screen-btn ${deviceSize === "tablet" ? "active" : ""}`}
              onClick={() => setDeviceSize("tablet")}
            >
              <Tablet />
              <span>Tablet</span>
            </button>
            <button
              className={`screen-btn ${deviceSize === "mobile" ? "active" : ""}`}
              onClick={() => setDeviceSize("mobile")}
            >
              <Smartphone />
              <span>Mobile</span>
            </button>
          </div>

          <button className="icon-btn" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            className="screen-btn"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid var(--border)",
              background: saveStatus === 'saved' ? "rgba(16, 185, 129, 0.15)" : "transparent",
              color: saveStatus === 'saved' ? "#10b981" : "inherit",
              borderColor: saveStatus === 'saved' ? "#10b981" : "var(--border)",
              cursor: saveStatus === 'saving' ? "not-allowed" : "pointer",
              height: "36px",
              padding: "0 12px",
              borderRadius: "6px",
              transition: "all 0.2s"
            }}
          >
            {saveStatus === 'saving' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saveStatus === 'saved' ? (
              <Check size={14} style={{ color: "#10b981" }} />
            ) : (
              <Save size={14} />
            )}
            <span>
              {saveStatus === 'saving' ? "Saving..." : saveStatus === 'saved' ? "Saved" : "Save"}
            </span>
          </button>
          <button
            className="publish-btn"
            onClick={handlePublish}
            disabled={publishStatus === 'publishing'}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: publishStatus === 'publishing' ? "not-allowed" : "pointer",
              height: "36px",
              padding: "0 12px",
              borderRadius: "6px",
              background: publishStatus === 'preview' 
                ? "var(--primary)" 
                : publishStatus === 'published' 
                  ? "#10b981" 
                  : "var(--primary)",
              color: "#ffffff",
              transition: "all 0.2s"
            }}
          >
            {publishStatus === 'publishing' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : publishStatus === 'published' ? (
              <Check size={14} style={{ color: "#ffffff" }} />
            ) : publishStatus === 'preview' ? (
              <Eye size={14} />
            ) : (
              <Download size={14} />
            )}
            <span>
              {publishStatus === 'publishing' 
                ? "Publishing..." 
                : publishStatus === 'published' 
                  ? "Published" 
                  : publishStatus === 'preview' 
                    ? "Preview" 
                    : "Publish"}
            </span>
          </button>
        </div>
      </header>

      {/* Floating Toolbar when Fullscreen */}
      <div className="fullscreen-floating">
        <button className="icon-btn" onClick={() => setIsFullscreen(false)}>
          <X />
        </button>
        <button
          className={`screen-btn ${deviceSize === "desktop" ? "active" : ""}`}
          onClick={() => setDeviceSize("desktop")}
        >
          <Monitor />
        </button>
        <button
          className={`screen-btn ${deviceSize === "laptop" ? "active" : ""}`}
          onClick={() => setDeviceSize("laptop")}
        >
          <Laptop />
        </button>
        <button
          className={`screen-btn ${deviceSize === "tablet" ? "active" : ""}`}
          onClick={() => setDeviceSize("tablet")}
        >
          <Tablet />
        </button>
        <button
          className={`screen-btn ${deviceSize === "mobile" ? "active" : ""}`}
          onClick={() => setDeviceSize("mobile")}
        >
          <Smartphone />
        </button>
      </div>

      <main className="workspace">
        <aside className="sidebar">

          <div style={{ minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {activeTab === "settings" && (
              <SettingsPanel
                htmlContent={rawHtml}
                onImport={handleImport}
                currentTheme={currentTheme}
                onSelectTheme={handleSelectTheme}
                themes={AVAILABLE_THEMES}
              />
            )}
            
            {activeTab === "customizer" && (
              <CustomizerPanel
                state={themeState}
                onChange={(updates) => setThemeState((prev) => ({ ...prev, ...updates }))}
              />
            )}

            {activeTab === "editor" && (
              <EditorPanel
                state={themeState}
                selectedElement={selectedElement}
                sections={sections}
                childrenOfSection={childrenOfSection}
                onChange={(updates) => setThemeState((prev) => ({ ...prev, ...updates }))}
                onSelectElementByPath={(path) => {
                  const doc = parseHtml(rawHtml);
                  const node = doc.querySelector(path);
                  if (node) {
                    const tag = node.tagName.toLowerCase();
                    let type = "element";
                    if ((node as HTMLElement).dataset.editorType) type = (node as HTMLElement).dataset.editorType!;
                    else if (["h1", "h2", "h3", "h4"].includes(tag)) type = "title";
                    else if (tag === "p") type = "description";
                    else if (["a", "button"].includes(tag)) type = "button";
                    else if (tag === "img") type = "image";
                    else if (node.classList.contains("card") || node.classList.contains("feature-card") || node.classList.contains("person-card")) type = "card";

                    setSelectedElement({
                      path,
                      type,
                      label: (node as HTMLElement).dataset.editorLabel || type.toUpperCase(),
                      text: (node as HTMLElement).innerText || (node as HTMLImageElement).alt || "",
                      href: node.getAttribute("href") || "",
                      src: node.getAttribute("src") || "",
                      alt: node.getAttribute("alt") || "",
                    });
                  }
                }}
                onSaveElement={handleSaveElementProperties}
                onRewriteTag={handleRewriteTag}
                onChangeButtonRole={handleChangeButtonRole}
                onChangeCardRole={handleChangeCardRole}
                onDuplicateElement={handleDuplicateElement}
                onDeleteElement={handleDeleteElement}
                onSelectSection={(path) => {
                  setActiveSectionPath(path);
                  setSelectedElement(null);
                }}
                activeSectionPath={activeSectionPath}
                onSaveSectionStyles={handleSaveSectionStyles}
                onBackToSections={() => {
                  setActiveSectionPath(null);
                  setSelectedElement(null);
                }}
                onDragStart={(blockData) => {
                  setEditorMode(true);
                  if (blockData) {
                    setIsDragging(true);
                    setDragData(blockData);
                  }
                }}
                onDragEnd={() => {
                  setIsDragging(false);
                  setDragData(null);
                }}
              />
            )}
          </div>

          <div className="bottom-tabs">
            <button
              className={`bottom-tab ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("settings");
                setSelectedElement(null);
                setActiveSectionPath(null);
              }}
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <button
              className={`bottom-tab ${activeTab === "customizer" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("customizer");
                setSelectedElement(null);
                setActiveSectionPath(null);
                setEditorMode(false);
              }}
            >
              Interface
            </button>
            <button
              className={`bottom-tab ${activeTab === "editor" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("editor");
                setSelectedElement(null);
                setActiveSectionPath(null);
                setEditorMode(true);
              }}
            >
              Editor
            </button>
          </div>
        </aside>

        <Preview
          html={renderedHtml}
          deviceSize={deviceSize}
          editorMode={editorMode}
          isDragging={isDragging}
          dragData={dragData}
          onElementSelect={(data) => {
            setSelectedElement(data);
            setActiveTab("editor");
          }}
        />
      </main>
    </div>
  );
}
export default App;
