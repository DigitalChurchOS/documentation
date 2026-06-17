/* ── CSS Variable Bridge ───────────────────────────────
 * Maps theme settings from the CMS API into CSS custom
 * properties that the Ecclesia CSS framework understands.
 * The existing styles.css uses var(--accent), var(--bg), etc.
 * ──────────────────────────────────────────────────── */
import type { ThemeSettings } from '../../types';

const ECCLESIA_STYLESHEETS = [
  '/themes/ecclesia/assets/styles.css',
  '/themes/ecclesia/assets/media.css',
  '/themes/ecclesia/assets/livestream.css',
  '/themes/ecclesia/assets/podcast.css',
  '/themes/ecclesia/assets/blog.css',
  '/themes/ecclesia/assets/events.css',
  '/themes/ecclesia/assets/giving.css',
  '/themes/ecclesia/assets/library.css',
  '/themes/ecclesia/assets/lms.css',
  '/themes/ecclesia/assets/prayer.css',
  '/themes/ecclesia/assets/services.css',
  '/themes/ecclesia/assets/worship.css',
];

let injectedLinks: HTMLLinkElement[] = [];
let customizerStyle: HTMLStyleElement | null = null;
let runtimeStyle: HTMLStyleElement | null = null;

const CUSTOMIZER_FAMILY_COLORS: Record<string, string> = {
  Blue: '#2563eb',
  Ocean: '#0284c7',
  Purple: '#7c3aed',
  Orchid: '#C71585',
  Green: '#16a34a',
  Teal: '#0d9488',
  Red: '#dc2626',
  Rose: '#FF017F',
  Pink: '#ec4899',
  Orange: '#ea580c',
  Gold: '#d97706',
  Brown: '#8b5e3c',
  Neutral: '#475467',
};

const CUSTOMIZER_TYPOGRAPHY: Record<string, { heading: string; body: string }> = {
  'Modern Sans': { heading: 'Inter', body: 'Inter' },
  'Grace Serif': { heading: 'Georgia', body: 'Inter' },
  Editorial: { heading: 'Georgia', body: 'Inter' },
  Bold: { heading: 'Bebas Neue', body: 'Arial' },
};

const CUSTOMIZER_TYPE_SIZE: Record<string, { title: string; subtitle: string; body: string }> = {
  Balanced: { title: '64px', subtitle: '22px', body: '16px' },
  Compact: { title: '52px', subtitle: '18px', body: '14px' },
  Heroic: { title: '78px', subtitle: '26px', body: '16px' },
  Reader: { title: '58px', subtitle: '22px', body: '18px' },
};

/** Inject Ecclesia CSS stylesheets into the document head */
export function injectEcclesiaCSS(): void {
  if (injectedLinks.length > 0) return; // already injected

  for (const href of ECCLESIA_STYLESHEETS) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.ecclesia = 'true';
    document.head.appendChild(link);
    injectedLinks.push(link);
  }
}

/** Remove Ecclesia CSS stylesheets */
export function removeEcclesiaCSS(): void {
  for (const link of injectedLinks) {
    link.remove();
  }
  injectedLinks = [];
  if (runtimeStyle) {
    runtimeStyle.remove();
    runtimeStyle = null;
  }
}

/** Compute radius tokens from edge style preset */
function getRadiusTokens(edgeStyle?: string) {
  switch (edgeStyle) {
    case 'sharp': return { xl: '0px', lg: '0px', md: '0px', btn: '0px' };
    case 'medium': case 'soft': return { xl: '16px', lg: '12px', md: '8px', btn: '10px' };
    case 'pillow': return { xl: '50px', lg: '34px', md: '24px', btn: '50px' };
    case 'smooth': default: return { xl: '34px', lg: '24px', md: '18px', btn: '14px' };
  }
}

function hasCustomizerSettings(settings: ThemeSettings): boolean {
  return Boolean(
    settings.family ||
      settings.personality ||
      settings.preset ||
      settings.typeSize ||
      settings.shape ||
      settings.visual ||
      settings.density ||
      settings.atmosphere ||
      settings.headerStyle ||
      settings.footerStyle ||
      settings.mobileDrawerMode
  );
}

function getCustomizerRadiusTokens(shape?: string) {
  switch (shape) {
    case 'Sharp':
      return { xl: '3px', lg: '3px', md: '3px', btn: '3px', pill: '3px' };
    case 'Round':
      return { xl: '40px', lg: '30px', md: '20px', btn: '50px', pill: '50px' };
    case 'Soft':
    default:
      return { xl: '30px', lg: '20px', md: '10px', btn: '13px', pill: '13px' };
  }
}

function getCustomizerSectionPadding(density?: string): string {
  if (density === 'Compact') return '20px';
  if (density === 'Spacious') return '50px';
  return '30px';
}

function getCustomizerButtonPadding(density?: string): string {
  if (density === 'Compact') return '9px 15px';
  if (density === 'Spacious') return '16px 28px';
  return '13px 20px';
}

function secondaryAccentForFamily(family: string): string {
  const normalized = family.toLowerCase();
  if (normalized.includes('green') || normalized.includes('teal')) return '#4ade80';
  if (normalized.includes('blue') || normalized.includes('ocean') || normalized.includes('purple') || normalized.includes('orchid')) return '#38bdf8';
  if (normalized.includes('neutral') || normalized.includes('brown')) return '#cbd5e1';
  return '#fbbf24';
}

function coerceCustomizerChoice(value: unknown, fallback: string, choices: string[] = []): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object') {
    const numericChars = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => /^\d+$/.test(key))
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, char]) => String(char ?? ''))
      .join('');

    if (numericChars.trim()) {
      const knownChoice = choices.find((choice) => numericChars === choice || numericChars.startsWith(choice));
      return knownChoice || numericChars;
    }
  }
  return fallback;
}

function applyCustomizerSettings(root: HTMLElement, settings: ThemeSettings): void {
  const family = coerceCustomizerChoice(settings.family, 'Ocean', Object.keys(CUSTOMIZER_FAMILY_COLORS));
  const style = coerceCustomizerChoice(settings.style, 'Rich', ['Soft', 'Vibrant', 'Rich', 'Elegant']);
  const visual = coerceCustomizerChoice(settings.visual, 'Elevated', ['Flat', 'Soft', 'Glass', 'Immersive', 'Elevated']);
  const atmosphere = coerceCustomizerChoice(settings.atmosphere, 'Light', ['Warm', 'Worship', 'Prayer', 'Celebration', 'Elegant', 'Light']);
  const dark = settings.previewMode === 'dark' || settings.colorMode === 'dark';
  const baseAccent = CUSTOMIZER_FAMILY_COLORS[family] || CUSTOMIZER_FAMILY_COLORS.Ocean;
  const gold = secondaryAccentForFamily(family);
  const typographyChoice = coerceCustomizerChoice(settings.typography, 'Modern Sans', Object.keys(CUSTOMIZER_TYPOGRAPHY));
  const typography = CUSTOMIZER_TYPOGRAPHY[typographyChoice] || CUSTOMIZER_TYPOGRAPHY['Modern Sans'];
  const typeSize = CUSTOMIZER_TYPE_SIZE[coerceCustomizerChoice(settings.typeSize, 'Balanced', Object.keys(CUSTOMIZER_TYPE_SIZE))] || CUSTOMIZER_TYPE_SIZE.Balanced;
  const radius = getCustomizerRadiusTokens(coerceCustomizerChoice(settings.shape, 'Soft', ['Sharp', 'Soft', 'Round']));
  const density = coerceCustomizerChoice(settings.density, 'Comfortable', ['Compact', 'Comfortable', 'Spacious']);
  const sectionPadding = getCustomizerSectionPadding(density);
  const buttonPadding = getCustomizerButtonPadding(density);

  let primary = baseAccent;
  let surface = dark ? '#111827' : '#ffffff';
  let bg = dark ? '#0f172a' : '#f8fafc';
  let soft = dark ? '#1e293b' : '#ffffff';
  let text = dark ? '#ffffff' : '#000000';
  let muted = dark ? '#cbd5e1' : '#4b5563';
  let border = dark ? 'rgba(255,255,255,.1)' : 'rgba(29,24,18,.12)';
  let shadow = `0 24px 70px color-mix(in srgb, var(--primary) 16%, ${dark ? 'rgba(0,0,0,0.5)' : 'rgba(15,23,42,0.1)'})`;
  let softShadow = `0 12px 35px color-mix(in srgb, var(--primary) 10%, ${dark ? 'rgba(0,0,0,0.35)' : 'rgba(15,23,42,0.06)'})`;

  if (style === 'Soft') {
    primary = `color-mix(in srgb, ${baseAccent} 65%, ${dark ? '#4b5563' : '#94a3b8'})`;
    bg = dark ? `color-mix(in srgb, var(--primary) 4%, #1f2937)` : `color-mix(in srgb, var(--primary) 2%, #faf9f6)`;
    soft = dark ? `color-mix(in srgb, var(--primary) 8%, #111827)` : `color-mix(in srgb, var(--primary) 4%, #faf9f6)`;
    text = dark ? '#e4e4e7' : '#27272a';
    muted = dark ? '#a1a1aa' : '#71717a';
  } else if (style === 'Rich') {
    primary = dark ? baseAccent : `color-mix(in srgb, ${baseAccent} 85%, #000000)`;
    bg = dark ? `color-mix(in srgb, var(--primary) 10%, #080c14)` : `color-mix(in srgb, var(--primary) 8%, #fcf8f2)`;
    soft = dark ? `color-mix(in srgb, var(--primary) 16%, #111827)` : `color-mix(in srgb, var(--primary) 14%, #f6efe6)`;
    text = dark ? '#f8fafc' : '#1d1812';
    muted = dark ? '#cbd5e1' : '#74685e';
  } else if (style === 'Elegant') {
    primary = `color-mix(in srgb, ${baseAccent} 60%, #475467)`;
    bg = dark ? `color-mix(in srgb, var(--primary) 3%, #0b0f19)` : '#ffffff';
    soft = dark ? `color-mix(in srgb, var(--primary) 6%, #1e293b)` : '#f8fafc';
    text = dark ? '#f1f5f9' : '#1e293b';
    muted = dark ? '#94a3b8' : '#475467';
  }

  if (atmosphere === 'Warm') {
    bg = dark ? `color-mix(in srgb, var(--primary) 8%, #1f140e)` : `color-mix(in srgb, var(--primary) 4%, #fffaf3)`;
    soft = dark ? `color-mix(in srgb, var(--primary) 12%, #2d1f18)` : `color-mix(in srgb, var(--primary) 8%, #f6efe6)`;
  } else if (atmosphere === 'Prayer') {
    bg = dark ? `color-mix(in srgb, var(--primary) 4%, #121824)` : `color-mix(in srgb, var(--primary) 2%, #fcfbf9)`;
    soft = dark ? `color-mix(in srgb, var(--primary) 8%, #0b0f19)` : `color-mix(in srgb, var(--primary) 4%, #f4f2ee)`;
  } else if (atmosphere === 'Worship') {
    bg = dark ? `color-mix(in srgb, var(--primary) 5%, #05080f)` : `color-mix(in srgb, var(--primary) 6%, #1c1826)`;
    soft = dark ? `color-mix(in srgb, var(--primary) 9%, #0c111c)` : `color-mix(in srgb, var(--primary) 10%, #292436)`;
    text = '#f8fafc';
    muted = '#cbd5e1';
  }

  if (visual === 'Flat') {
    shadow = 'none';
    softShadow = 'none';
  } else if (visual === 'Soft') {
    shadow = 'none';
    softShadow = `0 4px 12px color-mix(in srgb, var(--primary) 8%, ${dark ? 'rgba(0,0,0,0.25)' : 'rgba(15,23,42,0.03)'})`;
  } else if (visual === 'Glass') {
    surface = dark ? 'rgba(17, 24, 39, 0.65)' : 'rgba(255, 255, 255, 0.72)';
    border = dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.45)';
  }

  root.style.setProperty('--primary', primary);
  root.style.setProperty('--primary-soft', `color-mix(in srgb, var(--primary) 12%, transparent)`);
  root.style.setProperty('--accent', primary);
  root.style.setProperty('--accent-2', gold);
  root.style.setProperty('--gold', gold);
  root.style.setProperty('--bg', bg);
  root.style.setProperty('--surface', surface);
  root.style.setProperty('--surface-soft', soft);
  root.style.setProperty('--soft', soft);
  root.style.setProperty('--text', text);
  root.style.setProperty('--muted', muted);
  root.style.setProperty('--border', border);
  root.style.setProperty('--radius-xl', radius.xl);
  root.style.setProperty('--radius-lg', radius.lg);
  root.style.setProperty('--radius-md', radius.md);
  root.style.setProperty('--radius-btn', radius.btn);
  root.style.setProperty('--radius-pill', radius.pill);
  root.style.setProperty('--xl', radius.xl);
  root.style.setProperty('--lg', radius.lg);
  root.style.setProperty('--section', sectionPadding);
  root.style.setProperty('--shadow', shadow);
  root.style.setProperty('--soft-shadow', softShadow);
  root.style.setProperty('--font-heading', typography.heading);
  root.style.setProperty('--font-title', typography.heading);
  root.style.setProperty('--font-body', typography.body);
  root.style.setProperty('--title-size', typeSize.title);
  root.style.setProperty('--subtitle-size', typeSize.subtitle);
  root.style.setProperty('--body-size', typeSize.body);
  root.style.setProperty('--title-spacing', typographyChoice === 'Bold' ? '0.04em' : '-0.08em');
  root.style.setProperty('--subtitle-spacing', typographyChoice === 'Bold' ? '0.05em' : '-0.065em');
  root.style.setProperty('--button-padding', buttonPadding);
  root.style.setProperty('--header-bg', `color-mix(in srgb, var(--primary) 4%, var(--bg))`);
  root.style.setProperty('--header-border', `color-mix(in srgb, var(--primary) 12%, ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(29,24,18,0.12)'})`);
  root.style.setProperty('--header-bg-glass', `color-mix(in srgb, var(--primary) 8%, ${dark ? 'rgba(11,17,32,.75)' : 'rgba(251,249,246,.78)'})`);
  root.style.setProperty('--active-header-border-width', `${settings.headerBorderSize === 'medium' ? '3' : settings.headerBorderSize === 'large' ? '7' : '1'}px`);
  root.style.setProperty('--active-header-border-color', settings.headerBorderColor === 'white' ? '#ffffff' : 'var(--primary)');

  loadGoogleFont(typography.heading);
  loadGoogleFont(typography.body);

  if (!customizerStyle) {
    customizerStyle = document.createElement('style');
    customizerStyle.id = 'churchos-customizer-token-style';
    document.head.appendChild(customizerStyle);
  }

  customizerStyle.textContent = `
body, html, button, input, select, textarea { font-family: var(--font-body), sans-serif !important; }
h1, h2, h3, h4, h5, h6, .brand, .brand span { font-family: var(--font-title), sans-serif !important; }
body { color: var(--text) !important; font-size: var(--body-size) !important; }
h1 { font-size: clamp(40px, 7vw, var(--title-size)) !important; line-height: 1.05 !important; letter-spacing: var(--title-spacing) !important; }
h2 { font-size: clamp(30px, 5vw, var(--subtitle-size)) !important; line-height: 1.15 !important; letter-spacing: var(--subtitle-spacing) !important; }
.lead { font-size: calc(var(--body-size) * 1.2) !important; }
.section, .page-hero { padding-top: var(--section) !important; padding-bottom: var(--section) !important; }
.btn, .button { border-radius: var(--radius-btn) !important; padding: var(--button-padding) !important; }
.card, .feature-card, .sermon-card, .event-card, .ministry-card, .person-card, .contact-card, .form-card, .hero-copy, .prayer-box, .testimony-box {
  background: var(--surface) !important;
  border-color: var(--border) !important;
  box-shadow: var(--soft-shadow) !important;
}
`;
}

function applyEcclesiaRuntimeStyle(): void {
  if (!runtimeStyle) {
    runtimeStyle = document.createElement('style');
    runtimeStyle.id = 'churchos-ecclesia-runtime-style';
    document.head.appendChild(runtimeStyle);
  }

  runtimeStyle.textContent = `
html, body, #root { min-height: 100%; }
body { padding-bottom: 0 !important; background: var(--bg); }
.ecclesia-theme-root, .static-html-stage, .static-html-stage > .shell-wrapper {
  min-height: 100vh;
  background: var(--bg);
}
.static-html-stage {
  overflow-x: clip;
}
@media (max-width: 1050px) {
  .static-html-stage .mobile-drawer[aria-hidden="true"] {
    visibility: hidden !important;
    pointer-events: none !important;
  }
  .static-html-stage .mobile-drawer[aria-hidden="false"] {
    visibility: visible !important;
    pointer-events: auto !important;
  }
  body[data-mobile-drawer-mode="reveal"] .static-html-stage .mobile-drawer {
    z-index: 1 !important;
  }
}
@media (min-width: 1051px) {
  .static-html-stage .mobile-drawer,
  .static-html-stage #mobileDrawer {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
}
body:not(.drawer-open) .static-html-stage .shell-wrapper {
  transform: none !important;
  box-shadow: none !important;
}
.static-html-stage footer,
.static-html-stage .footer {
  margin-bottom: 0 !important;
}
.static-html-stage footer:last-of-type {
  margin-bottom: 0 !important;
}
`;
}

/** Apply theme settings as CSS custom properties on :root */
export function applyEcclesiaCSSVars(settings: ThemeSettings): void {
  const root = document.documentElement;
  const c = settings.colors;
  const r = getRadiusTokens(settings.components?.edgeStyle || settings.edgeStyle);

  if (c) {
    root.style.setProperty('--accent', c.primary || c.accent);
    root.style.setProperty('--accent-2', c.accentSecondary || c.primary);
    root.style.setProperty('--bg', c.background);
    root.style.setProperty('--surface', c.surface);
    root.style.setProperty('--surface-soft', c.mutedSurface);
    root.style.setProperty('--text', c.textPrimary);
    root.style.setProperty('--muted', c.textSecondary);
    root.style.setProperty('--border', c.border);
  }

  root.style.setProperty('--radius-xl', settings.components?.borderRadius || r.xl);
  root.style.setProperty('--radius-lg', r.lg);
  root.style.setProperty('--radius-md', r.md);
  root.style.setProperty('--radius-btn', r.btn);

  if (settings.layout?.contentWidth) {
    root.style.setProperty('--max', settings.layout.contentWidth);
  }
  if (settings.layout?.sectionPadding) {
    root.style.setProperty('--section', settings.layout.sectionPadding);
  }

  // Font injection
  const heading = settings.fonts?.heading || settings.typography?.headingFont || 'Outfit';
  const body = settings.fonts?.body || settings.typography?.bodyFont || 'Inter';
  root.style.setProperty('--font-heading', heading);
  root.style.setProperty('--font-body', body);

  // Load Google Fonts if not already present
  loadGoogleFont(heading);
  loadGoogleFont(body);

  // Shadow
  if (settings.components?.shadowDepth === 'none') {
    root.style.setProperty('--shadow', 'none');
    root.style.setProperty('--soft-shadow', 'none');
  } else if (settings.components?.shadowDepth === 'deep') {
    root.style.setProperty('--shadow', '0 24px 70px rgba(0,0,0,0.18)');
    root.style.setProperty('--soft-shadow', '0 12px 35px rgba(0,0,0,0.12)');
  }

  // Dark mode body class
  const mode = settings.colorMode || settings.design?.colorMode || 'light';
  document.body.classList.toggle('dark-mode', mode === 'dark' || mode === 'slate');
  document.body.classList.toggle('sepia-mode', mode === 'sepia');

  // Mobile drawer settings
  const drawerMode = settings.mobileDrawerMode || 'reveal';
  const menuPos = settings.mobileMenuPosition || 'right';
  const fullWidthBtns = String(settings.mobileDrawerButtonsFullWidth ?? 'false');

  document.body.setAttribute('data-mobile-drawer-mode', drawerMode);
  document.body.setAttribute('data-mobile-menu-position', menuPos);
  document.body.setAttribute('data-mobile-drawer-buttons-full-width', fullWidthBtns);
  applyEcclesiaRuntimeStyle();

  if (hasCustomizerSettings(settings)) {
    applyCustomizerSettings(root, settings);
    document.body.setAttribute('data-mobile-drawer-mode', String(settings.mobileDrawerMode || drawerMode));
    document.body.setAttribute('data-mobile-menu-position', String(settings.mobileMenuPosition || menuPos));
    document.body.setAttribute('data-mobile-drawer-buttons-full-width', String(settings.mobileDrawerButtonsFullWidth ?? false));
  } else if (customizerStyle) {
    customizerStyle.remove();
    customizerStyle = null;
  }

  // Mark body as Ecclesia-active
  document.body.classList.add('ecclesia-theme-active');
  document.body.classList.add('shell-loaded');
}

const loadedFonts = new Set<string>();

function loadGoogleFont(family: string): void {
  if (loadedFonts.has(family)) return;
  loadedFonts.add(family);

  const existing = document.querySelector(`link[data-font="${family}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;500;600;700;800;900&display=swap`;
  link.dataset.font = family;
  document.head.appendChild(link);
}
