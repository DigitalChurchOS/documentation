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
  if (density === 'Spacious') return '40px';
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
  let cardPadding = '20px';
  if (density === 'Compact') cardPadding = '10px';
  else if (density === 'Spacious') cardPadding = '30px';

  const thumbnailStyle = settings.cardThumbnailStyle || 'padded';
  let cardToThumbPadding = '15px'; // Comfortable
  if (thumbnailStyle === 'padded') {
    if (density === 'Compact') cardToThumbPadding = '10px';
    else if (density === 'Spacious') cardToThumbPadding = '20px';
  } else {
    cardToThumbPadding = '0px';
  }

  let cardContentPadding = '20px'; // Comfortable
  if (density === 'Compact') cardContentPadding = '15px';
  else if (density === 'Spacious') cardContentPadding = '25px';

  // Card grid gap based on density
  let cardGridGap = '22px'; // Comfortable
  if (density === 'Compact') cardGridGap = '15px';
  else if (density === 'Spacious') cardGridGap = '30px';

  // Apply card grid gap overrides if set
  const gridGapOverride = settings.cardGridGapOverride || 'medium';
  if (gridGapOverride === 'small') {
    cardGridGap = '25px';
  } else if (gridGapOverride === 'medium') {
    cardGridGap = '35px';
  } else if (gridGapOverride === 'big') {
    cardGridGap = '40px';
  } else if (gridGapOverride === 'large') {
    cardGridGap = '45px';
  }

  // Apply card padding overrides if set
  const paddingOverride = settings.cardPaddingOverride || 'medium';
  if (paddingOverride === 'small') {
    if (thumbnailStyle === 'padded') cardToThumbPadding = '10px';
    cardContentPadding = '15px';
  } else if (paddingOverride === 'medium') {
    if (thumbnailStyle === 'padded') cardToThumbPadding = '15px';
    cardContentPadding = '20px';
  } else if (paddingOverride === 'big') {
    if (thumbnailStyle === 'padded') cardToThumbPadding = '20px';
    cardContentPadding = '25px';
  } else if (paddingOverride === 'large') {
    if (thumbnailStyle === 'padded') cardToThumbPadding = '25px';
    cardContentPadding = '30px';
  }

  const cardToContentPadding = cardPadding;
  let thumbnailBottomMargin = '17px';
  if (density === 'Compact') thumbnailBottomMargin = '15px';
  else if (density === 'Spacious') thumbnailBottomMargin = '19px';



  let primary = baseAccent;
  let surface = dark ? '#111827' : '#ffffff';
  let bg = dark ? '#000000' : '#ffffff';
  let soft = dark ? '#1e293b' : '#ffffff';
  let text = dark ? '#ffffff' : '#000000';
  let muted = dark ? '#cbd5e1' : '#4b5563';
  let border = dark ? 'rgba(255,255,255,.1)' : 'rgba(29,24,18,.12)';
  let shadow = `0 24px 70px color-mix(in srgb, var(--primary) 16%, ${dark ? 'rgba(0,0,0,0.5)' : 'rgba(15,23,42,0.1)'})`;
  let softShadow = `0 12px 35px color-mix(in srgb, var(--primary) 10%, ${dark ? 'rgba(0,0,0,0.35)' : 'rgba(15,23,42,0.06)'})`;

  if (style === 'Soft') {
    primary = `color-mix(in srgb, ${baseAccent} 65%, ${dark ? '#374151' : '#cbd5e1'})`;
    bg = dark ? `color-mix(in srgb, var(--primary) 8%, #111827)` : `color-mix(in srgb, var(--primary) 6%, #ffffff)`;
    soft = dark ? `color-mix(in srgb, var(--primary) 12%, #1f2937)` : `color-mix(in srgb, var(--primary) 4%, #ffffff)`;
    text = dark ? '#e4e4e7' : '#27272a';
    muted = dark ? '#a1a1aa' : '#71717a';
  } else if (style === 'Rich') {
    primary = dark ? baseAccent : `color-mix(in srgb, ${baseAccent} 82%, #000000)`;
    bg = dark ? `color-mix(in srgb, var(--primary) 12%, #000000)` : `color-mix(in srgb, var(--primary) 8%, #ffffff)`;
    soft = dark ? `color-mix(in srgb, var(--primary) 16%, #0d0f12)` : `color-mix(in srgb, var(--primary) 12%, #ffffff)`;
    text = dark ? '#f8fafc' : '#1d1812';
    muted = dark ? '#cbd5e1' : '#74685e';
  } else if (style === 'Elegant') {
    primary = `color-mix(in srgb, ${baseAccent} 75%, #475569)`;
    bg = dark ? '#090d16' : '#ffffff';
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

  let backdropFilter = 'none';
  let borderStyle = dark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(29,24,18,.12)';

  if (visual === 'Flat') {
    shadow = 'none';
    softShadow = 'none';
  } else if (visual === 'Soft') {
    shadow = 'none';
    softShadow = `0 4px 12px color-mix(in srgb, var(--primary) 8%, ${dark ? 'rgba(0,0,0,0.25)' : 'rgba(15,23,42,0.03)'})`;
  } else if (visual === 'Glass') {
    surface = dark ? 'rgba(17, 24, 39, 0.65)' : 'rgba(255, 255, 255, 0.72)';
    backdropFilter = 'blur(18px)';
    shadow = `0 8px 32px color-mix(in srgb, var(--primary) 10%, ${dark ? 'rgba(0,0,0,0.3)' : 'rgba(15,23,42,0.04)'})`;
    softShadow = `0 4px 16px color-mix(in srgb, var(--primary) 6%, ${dark ? 'rgba(0,0,0,0.2)' : 'rgba(15,23,42,0.02)'})`;
    borderStyle = dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.45)';
  } else if (visual === 'Immersive') {
    shadow = `0 32px 90px color-mix(in srgb, var(--primary) 22%, ${dark ? 'rgba(0,0,0,0.6)' : 'rgba(15,23,42,0.12)'})`;
    softShadow = `0 16px 45px color-mix(in srgb, var(--primary) 14%, ${dark ? 'rgba(0,0,0,0.45)' : 'rgba(15,23,42,0.08)'})`;
  }

  // Base body background with glows depending on style & atmosphere
  let bgGradient = 'none';
  if (atmosphere === 'Warm') {
    bgGradient = `linear-gradient(135deg, color-mix(in srgb, ${primary} 10%, #fff7ed), ${bg} 60%)`;
  } else if (atmosphere === 'Worship') {
    bgGradient = `radial-gradient(circle at 50% 20%, color-mix(in srgb, ${primary} 20%, transparent), transparent 70%), linear-gradient(180deg, ${bg}, #020408)`;
  } else if (atmosphere === 'Prayer') {
    bgGradient = `linear-gradient(90deg, color-mix(in srgb, ${primary} 2%, #fcfbf9) 0%, ${bg} 50%, color-mix(in srgb, ${primary} 2%, #fcfbf9) 100%)`;
  } else if (atmosphere === 'Celebration') {
    bgGradient = `radial-gradient(circle at 10% 20%, color-mix(in srgb, ${primary} 16%, transparent), transparent 45%), radial-gradient(circle at 90% 80%, color-mix(in srgb, ${gold} 12%, transparent), transparent 55%)`;
  }

  let bodyBg = bg;
  if (style === 'Soft') {
    bodyBg = `radial-gradient(circle at 16% -8%, color-mix(in srgb, ${primary} 8%, transparent), transparent 30%), radial-gradient(circle at 84% 2%, color-mix(in srgb, ${gold} 6%, transparent), transparent 26%), ${bg}`;
  } else if (style === 'Vibrant') {
    bodyBg = dark 
      ? `linear-gradient(135deg, color-mix(in srgb, ${primary} 10%, #000000) 0%, #000000 100%)`
      : `linear-gradient(135deg, color-mix(in srgb, ${primary} 7%, #ffffff) 0%, #ffffff 100%)`;
  } else { // Rich and Elegant
    bodyBg = bg;
  }

  const resolvedBg = bgGradient === 'none' ? bodyBg : bgGradient;
  root.style.setProperty('--body-bg', resolvedBg);

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
  root.style.setProperty('--card-border', borderStyle);
  root.style.setProperty('--card-backdrop-filter', backdropFilter);
  root.style.setProperty('--card-to-thumb-padding', cardToThumbPadding);
  root.style.setProperty('--card-to-content-padding', cardToContentPadding);
  root.style.setProperty('--card-content-padding', cardContentPadding);
  root.style.setProperty('--card-padding', cardPadding);
  root.style.setProperty('--card-grid-gap', cardGridGap);
  root.style.setProperty('--thumbnail-bottom-margin', thumbnailBottomMargin);
  root.style.setProperty('--radius-xl', radius.xl);
  root.style.setProperty('--radius-lg', radius.lg);
  root.style.setProperty('--radius-md', radius.md);
  root.style.setProperty('--radius-btn', radius.btn);
  root.style.setProperty('--radius-pill', radius.pill);
  root.style.setProperty('--radius', radius.lg);
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

  // Compute header font size and button paddings based on headerFontSize setting
  const headerFontSizeSetting = settings.headerFontSize || 'medium';
  let navSize = '14px';
  let btnSize = '14px';
  let btnPaddingVal = '13px 19px';

  if (headerFontSizeSetting === 'tiny') {
    navSize = '11px';
    btnSize = '11px';
    btnPaddingVal = '7px 12px';
  } else if (headerFontSizeSetting === 'small') {
    navSize = '13px';
    btnSize = '12px';
    btnPaddingVal = '10px 15px';
  } else if (headerFontSizeSetting === 'big') {
    navSize = '16px';
    btnSize = '16px';
    btnPaddingVal = '15px 22px';
  } else if (headerFontSizeSetting === 'large') {
    navSize = '18px';
    btnSize = '18px';
    btnPaddingVal = '17px 25px';
  }

  root.style.setProperty('--header-nav-size', navSize);
  root.style.setProperty('--header-btn-size', btnSize);
  root.style.setProperty('--header-btn-padding', btnPaddingVal);

  // Compute header font weight based on headerFontWeight setting (thin, normal, semi-bold, bold)
  const headerFontWeightSetting = settings.headerFontWeight || 'bold';
  let navWeight = '720';
  let btnWeight = '850';

  if (headerFontWeightSetting === 'thin') {
    navWeight = '300';
    btnWeight = '400';
  } else if (headerFontWeightSetting === 'normal') {
    navWeight = '500';
    btnWeight = '600';
  } else if (headerFontWeightSetting === 'semi-bold') {
    navWeight = '700';
    btnWeight = '750';
  } else if (headerFontWeightSetting === 'bold') {
    navWeight = '720';
    btnWeight = '850';
  }

  root.style.setProperty('--header-nav-weight', navWeight);
  root.style.setProperty('--header-btn-weight', btnWeight);

  if (settings.headerSolidThemed) {
    root.style.setProperty('--header-bg', 'var(--primary)');
    root.style.setProperty('--header-border', 'color-mix(in srgb, #fff 15%, transparent)');
  } else {
    root.style.setProperty('--header-bg', `color-mix(in srgb, var(--primary) 4%, var(--bg))`);
    root.style.setProperty('--header-border', `color-mix(in srgb, var(--primary) 12%, ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(29,24,18,0.12)'})`);
  }
  root.style.setProperty('--header-bg-glass', `color-mix(in srgb, var(--primary) 8%, ${dark ? 'rgba(11,17,32,.75)' : 'rgba(251,249,246,.78)'})`);
  root.style.setProperty('--active-header-border-width', `${settings.headerBorderSize === 'medium' ? '3' : settings.headerBorderSize === 'large' ? '7' : '1'}px`);
  root.style.setProperty('--active-header-border-color', settings.headerBorderColor === 'white' ? '#ffffff' : 'var(--primary)');

  loadGoogleFont(typography.heading);
  loadGoogleFont(typography.body);

  if (!customizerStyle) {
    customizerStyle = document.createElement('style');
    customizerStyle.id = 'churchos-customizer-token-style';
  }
  // Always append to make sure it remains the last stylesheet in the head,
  // overriding any subsequently injected theme stylesheets.
  document.head.appendChild(customizerStyle);

  customizerStyle.textContent = `
body, html, button, input, select, textarea { font-family: var(--font-body), sans-serif !important; }
h1, h2, h3, h4, h5, h6, .brand, .brand span { font-family: var(--font-title), sans-serif !important; }
body { color: var(--text) !important; font-size: var(--body-size) !important; background: var(--body-bg, var(--bg)) !important; background-attachment: fixed !important; }
h1 { font-size: clamp(40px, 7vw, var(--title-size)) !important; line-height: 1.05 !important; letter-spacing: var(--title-spacing) !important; }
h2 { font-size: clamp(30px, 5vw, var(--subtitle-size)) !important; line-height: 1.15 !important; letter-spacing: var(--subtitle-spacing) !important; }
.lead { font-size: calc(var(--body-size) * 1.2) !important; }
.section, .page-hero { padding-top: var(--section) !important; padding-bottom: var(--section) !important; }
.btn, .button { border-radius: var(--radius-btn) !important; padding: var(--button-padding) !important; }
.card, .feature-card, .sermon-card, .event-card, .ministry-card, .person-card, .contact-card, .form-card, .hero-copy, .prayer-box, .testimony-box, .group-card, .product-card, .checkout-card, .order-card, .post, .blog-card, .blog-post-card, .article-card, .author-card, .video-card, .media-card, .product-item, .cell-card, .course-card, .course-main-card, .lesson-card, .lesson-single-card, .service-card, .mini-card, .audio-card, .audio-episode, .podcast-card, .podcast-episode, .episode-card, .resource-card, .library-card, .location-card, .panel, .solutions-card, .help-card {
  background: var(--surface) !important;
  border: var(--card-border) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--soft-shadow) !important;
  backdrop-filter: var(--card-backdrop-filter) !important;
  -webkit-backdrop-filter: var(--card-backdrop-filter) !important;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease !important;
  overflow: hidden !important;
  transform: translateZ(0) !important;
  backface-visibility: hidden !important;
}
.card img, .sermon-card img, .event-card img, .product-thumb img, .postimg, .blog-card img, .course-card img, .lesson-card img {
  transition: transform 0.4s ease, border-radius 0.25s ease !important;
}

.card, .feature-card, .contact-card, .form-card, .page-hero-inner, .hero-copy, .prayer-box, .testimony-box, .checkout-card, .order-card, .solutions-card, .help-card {
  padding: var(--card-padding) !important;
}

/* Card layout configurations from customizer settings */
.card, .post, .episode, .course, .resource, .media-card, .event-card, .group-card, .product-card, .service-card, .testimony-card {
  padding: 0 !important;
}
.product-thumb, .card-thumb, .postimg, .course-cover, .media-visual, .episode-cover, .event-img, .event-cover, .cover, .thumb, .group-cover, .library-cover, .service-cover {
  padding: var(--card-to-thumb-padding) !important;
  background: transparent !important;
  display: grid !important;
  place-items: center !important;
  overflow: hidden !important;
  transform: translateZ(0) !important;
  backface-visibility: hidden !important;
}
/* Store product images are always 1:1 square, masked to that shape */
.product-thumb {
  aspect-ratio: 1 / 1 !important;
  width: 100% !important;
}
/* img inside a grid container defaults to centered/natural-size — force stretch to fill */
.product-thumb img,
.card-thumb img,
.postimg img,
.course-cover img,
.media-visual img,
.episode-cover img,
.event-img img,
.event-cover img,
.cover img,
.thumb img {
  align-self: stretch !important;
  justify-self: stretch !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
}
.card > img, .post > img, .episode > img, .course > img, .resource > img, .media-card > img, .event-card > img, .group-card > img, .product-card > img, .service-card > img {
  margin: var(--card-to-thumb-padding) var(--card-to-thumb-padding) 0 var(--card-to-thumb-padding) !important;
  width: calc(100% - calc(var(--card-to-thumb-padding) * 2)) !important;
  box-sizing: border-box !important;
  display: block !important;
}
/* Thumbnail bottom margins based on density settings */
.product-thumb, .card-thumb, .postimg, .course-cover, .media-visual, .episode-cover, .event-img, .event-cover, .cover, .thumb, .group-cover, .library-cover, .service-cover,
.card > img, .post > img, .episode > img, .course > img, .resource > img, .media-card > img, .event-card > img, .group-card > img, .product-card > img, .service-card > img {
  margin-bottom: var(--thumbnail-bottom-margin) !important;
}
.product-info, .card-body, .postbody, .media-body, .episode-body, .course-body, .group-body, .event-body, .resource .body, .resource-card .body, .service-card .body, .card > .body, .group-card > .body, .group-card .body, .event-card .body, .testimony-card > .body {
  padding-left: var(--card-content-padding) !important;
  padding-right: var(--card-content-padding) !important;
  padding-bottom: var(--card-content-padding) !important;
  padding-top: var(--card-content-padding) !important;
}
/* Reset top padding if preceded by a thumbnail/cover or img */
.product-thumb + .product-info,
.card-thumb + .card-body,
.postimg + .postbody,
.course-cover + .course-body,
.media-visual + .media-body,
.episode-cover + .episode-body,
.event-img + .event-body,
.cover + .body,
.thumb + .body,
.event-cover + .event-body,
.group-cover + .group-body,
.library-cover + .body,
.service-cover + .body,
.card > img + .body,
.post > img + .postbody,
.episode > img + .episode-body,
.course > img + .course-body,
.resource > img + .body,
.media-card > img + .media-body,
.event-card > img + .event-body,
.group-card > img + .group-body,
.product-card > img + .product-info,
.service-card > img + .body {
  padding-top: 0 !important;
}
.product-badge {
  top: calc(var(--card-to-thumb-padding) + 12px) !important;
  left: calc(var(--card-to-thumb-padding) + 12px) !important;
}

/* Card inner image rounding based on padded vs full-bleed style */
${thumbnailStyle === 'padded' ? `
.product-thumb, .card-thumb, .postimg, .course-cover, .media-visual, .episode-cover, .event-img, .event-cover, .cover, .thumb, .group-cover, .library-cover, .service-cover {
  border-radius: max(0px, calc(var(--radius-lg) - 3px)) !important;
  overflow: hidden !important;
}
.card img, .feature-card img, .sermon-card img, .event-card img, .ministry-card img, .person-card img, .contact-card img, .form-card img, .group-card img, .product-card img, .product-thumb img, .postimg img, .blog-card img, .blog-post-card img, .article-card img, .author-card img, .video-card img, .media-card img, .product-item img, .cell-card img, .course-card img, .course-main-card img, .lesson-card img, .lesson-single-card img, .service-card img, .mini-card img, .audio-card img, .audio-episode img, .podcast-card img, .podcast-episode img, .episode-card img, .resource-card img, .library-card img, .location-card img, .panel img, .solutions-card img, .help-card img, .avatar, .order-card img {
  border-radius: max(0px, calc(var(--radius-lg) - 3px)) !important;
}
` : `
.product-thumb, .card-thumb, .postimg, .course-cover, .media-visual, .episode-cover, .event-img, .event-cover, .cover, .thumb, .group-cover, .library-cover, .service-cover {
  border-radius: 0 !important;
  overflow: hidden !important;
}
.card img, .feature-card img, .sermon-card img, .event-card img, .ministry-card img, .person-card img, .contact-card img, .form-card img, .group-card img, .product-card img, .product-thumb img, .postimg img, .blog-card img, .blog-post-card img, .article-card img, .author-card img, .video-card img, .media-card img, .product-item img, .cell-card img, .course-card img, .course-main-card img, .lesson-card img, .lesson-single-card img, .service-card img, .mini-card img, .audio-card img, .audio-episode img, .podcast-card img, .podcast-episode img, .episode-card img, .resource-card img, .library-card img, .location-card img, .panel img, .solutions-card img, .help-card img, .avatar, .order-card img {
  border-radius: 0 !important;
}
`}

/* Card Hover Animation Styles */
${(settings.cardHoverEffect || 'lift') === 'lift' ? `
.card:hover, .post:hover, .episode:hover, .course:hover, .resource:hover, .media-card:hover, .event-card:hover, .group-card:hover, .product-card:hover, .service-card:hover, .testimony-card:hover, .feature-card:hover, .solutions-card:hover, .help-card:hover {
  transform: translateY(-6px) !important;
  box-shadow: var(--shadow) !important;
}
` : ''}

${(settings.cardHoverEffect || 'lift') === 'grow' ? `
.card:hover, .post:hover, .episode:hover, .course:hover, .resource:hover, .media-card:hover, .event-card:hover, .group-card:hover, .product-card:hover, .service-card:hover, .testimony-card:hover, .feature-card:hover, .solutions-card:hover, .help-card:hover {
  transform: scale(1.03) !important;
}
` : ''}

${(settings.cardHoverEffect || 'lift') === 'shadow' ? `
.card:hover, .post:hover, .episode:hover, .course:hover, .resource:hover, .media-card:hover, .event-card:hover, .group-card:hover, .product-card:hover, .service-card:hover, .testimony-card:hover, .feature-card:hover, .solutions-card:hover, .help-card:hover {
  box-shadow: 0 16px 38px color-mix(in srgb, var(--primary) 22%, ${dark ? 'rgba(0,0,0,0.6)' : 'rgba(15,23,42,0.18)'}) !important;
}
` : ''}

${(settings.cardHoverEffect || 'lift') === 'zoom' ? `
.card:hover img, .post:hover img, .episode:hover img, .course:hover img, .resource:hover img, .media-card:hover img, .event-card:hover img, .group-card:hover img, .product-card:hover img, .service-card:hover img, .testimony-card:hover img, .feature-card:hover img, .solutions-card:hover img, .help-card:hover img {
  transform: scale(1.06) !important;
}
` : ''}

${(settings.cardHoverEffect || 'lift') === 'glow' ? `
.card:hover, .post:hover, .episode:hover, .course:hover, .resource:hover, .media-card:hover, .event-card:hover, .group-card:hover, .product-card:hover, .service-card:hover, .testimony-card:hover, .feature-card:hover, .solutions-card:hover, .help-card:hover {
  border-color: var(--accent) !important;
  box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 24%, transparent) !important;
}
` : ''}

${(settings.cardHoverEffect || 'lift') === 'none' ? `
.card:hover, .feature-card:hover, .sermon-card:hover, .event-card:hover, .ministry-card:hover, .person-card:hover, .group-card:hover, .product-card:hover, .post:hover, .blog-card:hover, .course-card:hover, .lesson-card:hover, .service-card:hover, .podcast-card:hover, .episode-card:hover, .resource-card:hover, .library-card:hover {
  transform: none !important;
  box-shadow: var(--soft-shadow) !important;
}
` : ''}
.section[style*="padding-top: 0"], .section[style*="padding-top:0"] {
  padding-top: 0 !important;
}
header[data-header-solid-themed="true"], .header[data-header-solid-themed="true"] {
  background: var(--primary) !important;
  border-bottom-color: color-mix(in srgb, #fff 15%, transparent) !important;
}
header[data-header-solid-themed="true"] .brand,
.header[data-header-solid-themed="true"] .brand,
header[data-header-solid-themed="true"] .brand span,
.header[data-header-solid-themed="true"] .brand span {
  color: #ffffff !important;
}
header[data-header-solid-themed="true"] .nav a,
.header[data-header-solid-themed="true"] .nav a {
  color: rgba(255, 255, 255, 0.72) !important;
}
header[data-header-solid-themed="true"] .nav a:hover,
.header[data-header-solid-themed="true"] .nav a:hover,
header[data-header-solid-themed="true"] .nav a.active,
.header[data-header-solid-themed="true"] .nav a.active {
  color: #ffffff !important;
}
header[data-header-solid-themed="true"] .brand-mark, .header[data-header-solid-themed="true"] .brand-mark,
header[data-header-solid-themed="true"] .brand .mark, .header[data-header-solid-themed="true"] .brand .mark {
  background: #ffffff !important;
  color: var(--primary) !important;
  box-shadow: none !important;
}

/* Card Lists & Archives Grid Gap */
.grid,
.product-grid,
.media-grid,
.episodes,
.course-grid,
.events-grid,
.cards-3,
.cards-2,
.resources,
.services,
.related-grid,
.related-posts {
  gap: var(--card-grid-gap) !important;
}
header[data-header-solid-themed="true"] .brand-mark i, .header[data-header-solid-themed="true"] .brand-mark i,
header[data-header-solid-themed="true"] .brand-mark svg, .header[data-header-solid-themed="true"] .brand-mark svg,
header[data-header-solid-themed="true"] .brand .mark i, .header[data-header-solid-themed="true"] .brand .mark i,
header[data-header-solid-themed="true"] .brand .mark svg, .header[data-header-solid-themed="true"] .brand .mark svg {
  color: var(--primary) !important;
  stroke: var(--primary) !important;
  fill: none !important;
}
header[data-header-solid-themed="true"] a svg, .header[data-header-solid-themed="true"] a svg,
header[data-header-solid-themed="true"] a i, .header[data-header-solid-themed="true"] a i {
  color: #ffffff !important;
  stroke: #ffffff !important;
}
header[data-header-solid-themed="true"] .btn-primary, .header[data-header-solid-themed="true"] .btn-primary,
header[data-header-solid-themed="true"] .btn.primary, .header[data-header-solid-themed="true"] .btn.primary,
header[data-header-solid-themed="true"] .actions .primary, .header[data-header-solid-themed="true"] .actions .primary,
header[data-header-solid-themed="true"] .header-actions .primary, .header[data-header-solid-themed="true"] .header-actions .primary {
  background: #ffffff !important;
  color: var(--primary) !important;
  border-color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}
header[data-header-solid-themed="true"] .btn-primary:hover, .header[data-header-solid-themed="true"] .btn-primary:hover,
header[data-header-solid-themed="true"] .btn.primary:hover, .header[data-header-solid-themed="true"] .btn.primary:hover,
header[data-header-solid-themed="true"] .actions .primary:hover, .header[data-header-solid-themed="true"] .actions .primary:hover,
header[data-header-solid-themed="true"] .header-actions .primary:hover, .header[data-header-solid-themed="true"] .header-actions .primary:hover {
  background: rgba(255, 255, 255, 0.9) !important;
  color: var(--primary) !important;
}
header[data-header-solid-themed="true"] .btn-primary svg, .header[data-header-solid-themed="true"] .btn-primary svg,
header[data-header-solid-themed="true"] .btn.primary svg, .header[data-header-solid-themed="true"] .btn.primary svg,
header[data-header-solid-themed="true"] .actions .primary svg, .header[data-header-solid-themed="true"] .actions .primary svg {
  color: var(--primary) !important;
  stroke: var(--primary) !important;
}
header[data-header-solid-themed="true"] .btn-soft, .header[data-header-solid-themed="true"] .btn-soft,
header[data-header-solid-themed="true"] .btn.soft, .header[data-header-solid-themed="true"] .btn.soft,
header[data-header-solid-themed="true"] .btn.softbtn, .header[data-header-solid-themed="true"] .btn.softbtn,
header[data-header-solid-themed="true"] .soft, .header[data-header-solid-themed="true"] .soft,
header[data-header-solid-themed="true"] .softbtn, .header[data-header-solid-themed="true"] .softbtn {
  background: rgba(255, 255, 255, 0.16) !important;
  color: #ffffff !important;
  border-color: transparent !important;
}
header[data-header-solid-themed="true"] .btn-soft:hover, .header[data-header-solid-themed="true"] .btn-soft:hover,
header[data-header-solid-themed="true"] .btn.soft:hover, .header[data-header-solid-themed="true"] .btn.soft:hover,
header[data-header-solid-themed="true"] .btn.softbtn:hover, .header[data-header-solid-themed="true"] .btn.softbtn:hover,
header[data-header-solid-themed="true"] .soft:hover, .header[data-header-solid-themed="true"] .soft:hover,
header[data-header-solid-themed="true"] .softbtn:hover, .header[data-header-solid-themed="true"] .softbtn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
}
header[data-header-solid-themed="true"] .btn-soft svg, .header[data-header-solid-themed="true"] .btn-soft svg,
header[data-header-solid-themed="true"] .btn.soft svg, .header[data-header-solid-themed="true"] .btn.soft svg,
header[data-header-solid-themed="true"] .btn.softbtn svg, .header[data-header-solid-themed="true"] .btn.softbtn svg {
  color: #ffffff !important;
  stroke: #ffffff !important;
}
header[data-header-solid-themed="true"] .btn-light, .header[data-header-solid-themed="true"] .btn-light,
header[data-header-solid-themed="true"] .btn.light, .header[data-header-solid-themed="true"] .btn.light,
header[data-header-solid-themed="true"] .light, .header[data-header-solid-themed="true"] .light {
  background: transparent !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
}
header[data-header-solid-themed="true"] .btn-light:hover, .header[data-header-solid-themed="true"] .btn-light:hover,
header[data-header-solid-themed="true"] .btn.light:hover, .header[data-header-solid-themed="true"] .btn.light:hover,
header[data-header-solid-themed="true"] .light:hover, .header[data-header-solid-themed="true"] .light:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.6) !important;
}
header[data-header-solid-themed="true"] .btn-light svg, .header[data-header-solid-themed="true"] .btn-light svg,
header[data-header-solid-themed="true"] .btn.light svg, .header[data-header-solid-themed="true"] .btn.light svg {
  color: #ffffff !important;
  stroke: #ffffff !important;
}
header[data-header-solid-themed="true"] .mobile-menu-btn, .header[data-header-solid-themed="true"] .mobile-menu-btn,
header[data-header-solid-themed="true"] .menu, .header[data-header-solid-themed="true"] .menu,
header[data-header-solid-themed="true"] .mobilebtn, .header[data-header-solid-themed="true"] .mobilebtn {
  background: rgba(255, 255, 255, 0.16) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
}
header[data-header-solid-themed="true"] .mobile-menu-btn:hover, .header[data-header-solid-themed="true"] .mobile-menu-btn:hover,
header[data-header-solid-themed="true"] .menu:hover, .header[data-header-solid-themed="true"] .menu:hover,
header[data-header-solid-themed="true"] .mobilebtn:hover, .header[data-header-solid-themed="true"] .mobilebtn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
}
header[data-header-solid-themed="true"] .mobile-menu-btn svg, .header[data-header-solid-themed="true"] .mobile-menu-btn svg,
header[data-header-solid-themed="true"] .menu svg, .header[data-header-solid-themed="true"] .menu svg,
header[data-header-solid-themed="true"] .mobilebtn svg, .header[data-header-solid-themed="true"] .mobilebtn svg {
  color: #ffffff !important;
  stroke: #ffffff !important;
}
header[data-header-solid-themed="true"][data-mobile-hamburger-shape="plain"] .mobile-menu-btn,
.header[data-header-solid-themed="true"][data-mobile-hamburger-shape="plain"] .mobile-menu-btn,
header[data-header-solid-themed="true"][data-mobile-hamburger-shape="plain"] .menu,
.header[data-header-solid-themed="true"][data-mobile-hamburger-shape="plain"] .menu,
header[data-header-solid-themed="true"][data-mobile-hamburger-shape="plain"] .mobilebtn,
.header[data-header-solid-themed="true"][data-mobile-hamburger-shape="plain"] .mobilebtn {
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

header .nav a, .header .nav a, header .nav-link-item, .header .nav-link-item, header .nav-more-btn, .header .nav-more-btn {
  font-size: var(--header-nav-size) !important;
  font-weight: var(--header-nav-weight) !important;
}
header .btn, .header .btn, header .button, .header .button {
  font-size: var(--header-btn-size) !important;
  font-weight: var(--header-btn-weight) !important;
  padding: var(--header-btn-padding) !important;
}
`;
}

function applyEcclesiaRuntimeStyle(): void {
  if (!runtimeStyle) {
    runtimeStyle = document.createElement('style');
    runtimeStyle.id = 'churchos-ecclesia-runtime-style';
  }
  // Always append/move to the end of the head so runtime styles consistently override standard ones
  document.head.appendChild(runtimeStyle);

  runtimeStyle.textContent = `
html, body, #root { min-height: 100%; }
body { padding-bottom: 0 !important; background: var(--body-bg, var(--bg)) !important; background-attachment: fixed !important; }
html {
  overflow: visible !important;
}
.ecclesia-theme-root, .static-html-stage, .static-html-stage > .shell-wrapper {
  min-height: 100vh;
  background: var(--body-bg, var(--bg)) !important;
  background-attachment: fixed !important;
}
.static-html-stage {
  overflow-x: visible !important;
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
  .static-html-stage #mobileDrawer,
  .static-html-stage .drawer,
  .static-html-stage #drawer {
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
  root.style.setProperty('--radius', r.lg);

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

  // ── Rail navigation body attributes ──────────────────────────────────────
  // app.js reads these from <body> when building the shell. We must set them
  // here so standalone pages (cart, checkout-failed, etc.) get the correct
  // rail layout from the active theme settings.
  document.body.setAttribute('data-rail-position', String((settings as any).railPosition || 'left'));
  document.body.setAttribute('data-rail-show-icons', String((settings as any).railShowIcons !== false));
  document.body.setAttribute('data-rail-style', String((settings as any).railStyle || 'full'));
  document.body.setAttribute('data-rail-shadow', String((settings as any).railShadow || false));
  document.body.setAttribute('data-rail-shadow-intensity', String((settings as any).railShadowIntensity || 'medium'));
  document.body.setAttribute('data-rail-shadow-themed', String((settings as any).railShadowThemed || false));
  document.body.setAttribute('data-rail-solid-themed', String((settings as any).railSolidThemed || false));
  document.body.setAttribute('data-rail-border', String((settings as any).railBorder !== false));
  document.body.setAttribute('data-rail-border-size', String((settings as any).railBorderSize || 'small'));
  document.body.setAttribute('data-rail-border-color', String((settings as any).railBorderColor || 'standard'));
  document.body.setAttribute('data-rail-vertical-align', String((settings as any).railVerticalAlign || 'center'));
  document.body.setAttribute('data-rail-font-size', String((settings as any).railFontSize || 'medium'));
  document.body.setAttribute('data-rail-font-weight', String((settings as any).railFontWeight || 'bold'));
  document.body.setAttribute('data-mobile-drawer-combine', String(!!(settings as any).mobileDrawerCombine));
  document.body.setAttribute('data-mobile-drawer-rail-position', String((settings as any).mobileDrawerRailPosition || 'right'));
  document.body.setAttribute('data-mobile-menu-flip', String(!!(settings as any).mobileMenuFlip));

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

  // ── Rebuild shell with correct theme attributes ───────────────────────────
  // After body attributes are set, tell app.js to rebuild the shell so the
  // rail menu and header reflect the active customizer settings.
  if (typeof (window as any).reinitShell === 'function') {
    (window as any).reinitShell();
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
