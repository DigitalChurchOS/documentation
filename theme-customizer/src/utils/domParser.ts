export interface ThemeState {
  preset: string;
  personality: string;
  typography: string;
  typeSize: string;
  family: string;
  style: string;
  shape: string;
  visual: string;
  density: string;
  motion: string;
  atmosphere: string;
  previewMode: 'light' | 'dark';

  headerStyle: string;
  headerLayout: string;
  headerEffect: string;
  mobileMenuPosition: string;
  mobileDrawerMode: string;
  mobileHamburgerShape: string;

  footerStyle: string;
  footerWidgets: 'show' | 'hidden';
  footerWidgetLayout: string;
  footerBottom: string;
  footerLegal: 'show' | 'hidden';
  footerManual: boolean;

  copyrightText: string;
  privacyLabel: string;
  privacyHref: string;
  termsLabel: string;
  termsHref: string;
}

export const colorMap: Record<string, string> = {
  Blue: "#2563eb",
  "Ocean": "#0284c7",
  Purple: "#7c3aed",
  Orchid: "#C71585",
  Green: "#16a34a",
  Teal: "#0d9488",
  Red: "#dc2626",
  Rose: "#FF017F",
  Pink: "#ec4899",
  Orange: "#ea580c",
  Gold: "#d97706",
  Brown: "#8b5e3c",
  Neutral: "#475467",
};

export const typographyMap: Record<string, { title: string; body: string }> = {
  "Modern Sans": { title: "Inter,system-ui,sans-serif", body: "Inter,system-ui,sans-serif" },
  "Grace Serif": { title: "Georgia,serif", body: "Inter,system-ui,sans-serif" },
  Editorial: { title: "Georgia,'Times New Roman',serif", body: "Inter,system-ui,sans-serif" },
  Bold: { title: "'Bebas Neue',Impact,sans-serif", body: "Arial,system-ui,sans-serif" },
};

export const typeSizeMap: Record<string, { title: string; subtitle: string; body: string }> = {
  Balanced: { title: "64px", subtitle: "22px", body: "16px" },
  Compact: { title: "52px", subtitle: "18px", body: "14px" },
  Heroic: { title: "78px", subtitle: "26px", body: "16px" },
  Reader: { title: "58px", subtitle: "22px", body: "18px" },
};

export function getTokenStyle(state: ThemeState): string {
  const primary = colorMap[state.family] || "#0284c7";
  const typo = typographyMap[state.typography] || typographyMap["Modern Sans"];
  const size = typeSizeMap[state.typeSize] || typeSizeMap["Balanced"];
  const dark = state.previewMode === "dark";

  // Density paddings
  let sectionPadding = "30px";
  let cardPadding = "24px";
  let btnPadding = "13px 20px";
  let filterGap = "30px";
  if (state.density === "Compact") {
    sectionPadding = "20px";
    cardPadding = "20px";
    btnPadding = "9px 15px";
    filterGap = "20px";
  } else if (state.density === "Spacious") {
    sectionPadding = "50px";
    cardPadding = "36px";
    btnPadding = "16px 28px";
    filterGap = "40px";
  }

  // Radius values
  let radXl = "34px";
  let radLg = "24px";
  let radMd = "16px";
  if (state.shape === "Sharp") {
    radXl = "6px";
    radLg = "4px";
    radMd = "2px";
  } else if (state.shape === "Round") {
    radXl = "48px";
    radLg = "36px";
    radMd = "24px";
  }

  // Visual card presentation - shadows follow accents using CSS color-mix()
  let shadow = `0 24px 70px color-mix(in srgb, var(--primary) 16%, ${dark ? "rgba(0,0,0,0.5)" : "rgba(15,23,42,0.1)"})`;
  let softShadow = `0 12px 35px color-mix(in srgb, var(--primary) 10%, ${dark ? "rgba(0,0,0,0.35)" : "rgba(15,23,42,0.06)"})`;
  let cardBg = dark ? "#111827" : "#ffffff";
  let backdropFilter = "none";
  let borderStyle = dark ? "1px solid rgba(255,255,255,.08)" : "1px solid rgba(29,24,18,.12)";

  if (state.visual === "Flat") {
    shadow = "none";
    softShadow = "none";
  } else if (state.visual === "Soft") {
    shadow = "none";
    softShadow = `0 4px 12px color-mix(in srgb, var(--primary) 8%, ${dark ? "rgba(0,0,0,0.25)" : "rgba(15,23,42,0.03)"})`;
  } else if (state.visual === "Glass") {
    cardBg = dark ? "rgba(17, 24, 39, 0.65)" : "rgba(255, 255, 255, 0.72)";
    backdropFilter = "blur(18px)";
    shadow = `0 8px 32px color-mix(in srgb, var(--primary) 10%, ${dark ? "rgba(0,0,0,0.3)" : "rgba(15,23,42,0.04)"})`;
    softShadow = `0 4px 16px color-mix(in srgb, var(--primary) 6%, ${dark ? "rgba(0,0,0,0.2)" : "rgba(15,23,42,0.02)"})`;
    borderStyle = dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.45)";
  } else if (state.visual === "Immersive") {
    shadow = `0 32px 90px color-mix(in srgb, var(--primary) 22%, ${dark ? "rgba(0,0,0,0.6)" : "rgba(15,23,42,0.12)"})`;
    softShadow = `0 16px 45px color-mix(in srgb, var(--primary) 14%, ${dark ? "rgba(0,0,0,0.45)" : "rgba(15,23,42,0.08)"})`;
  }

  // Aura backgrounds - page background and soft backgrounds follow accents
  let bgGradient = "none";
  let siteBg = dark
    ? "color-mix(in srgb, var(--primary) 6%, #0b1120)"
    : "color-mix(in srgb, var(--primary) 4%, #fffaf3)";
  let siteSoft = dark
    ? "color-mix(in srgb, var(--primary) 12%, #172033)"
    : "color-mix(in srgb, var(--primary) 8%, #f6efe6)";
  let textMain = dark ? "#f8fafc" : "#1d1812";
  let textMuted = dark ? "#cbd5e1" : "#74685e";
  let siteBorder = dark ? "rgba(255,255,255,.1)" : "rgba(29,24,18,.12)";

  if (state.atmosphere === "Soft Glow") {
    bgGradient = `radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 65%)`;
  } else if (state.atmosphere === "Gradient") {
    bgGradient = `linear-gradient(135deg, color-mix(in srgb, var(--primary) 14%, transparent), var(--bg) 50%, color-mix(in srgb, var(--primary) 4%, transparent))`;
  } else if (state.atmosphere === "Cinematic") {
    siteBg = dark ? "color-mix(in srgb, var(--primary) 4%, #05080f)" : "color-mix(in srgb, var(--primary) 5%, #1f140e)";
    siteSoft = dark ? "color-mix(in srgb, var(--primary) 8%, #0c111c)" : "color-mix(in srgb, var(--primary) 10%, #2d1f18)";
    textMain = "#f8fafc";
    textMuted = "#94a3b8";
    bgGradient = `linear-gradient(180deg, var(--bg), ${dark ? "color-mix(in srgb, var(--primary) 2%, #010204)" : "color-mix(in srgb, var(--primary) 2%, #0f0a07)"})`;
  } else if (state.atmosphere === "Editorial") {
    siteBg = "color-mix(in srgb, var(--primary) 3%, #fffbf7)";
    siteSoft = "color-mix(in srgb, var(--primary) 7%, #fff3e5)";
    bgGradient = "linear-gradient(90deg, color-mix(in srgb, var(--primary) 4%, #fff7ed) 0%, color-mix(in srgb, var(--primary) 1%, #fffbf7) 50%, color-mix(in srgb, var(--primary) 4%, #fff7ed) 100%)";
  } else if (state.atmosphere === "Atmospheric") {
    bgGradient = `radial-gradient(circle at 10% 20%, color-mix(in srgb, var(--primary) 16%, transparent), transparent 45%), radial-gradient(circle at 90% 80%, color-mix(in srgb, var(--primary) 10%, transparent), transparent 55%)`;
  }

  // Motion transitions
  let motionSpeed = "0.4s";
  let useAnimation = state.motion !== "None";
  if (state.motion === "Gentle") motionSpeed = "0.3s";
  else if (state.motion === "Dynamic") motionSpeed = "0.55s";
  else if (state.motion === "Cinematic") motionSpeed = "0.85s";

  // Typography Spacing Adjustments
  let titleSpacing = "-0.08em";
  let subtitleSpacing = "-0.065em";
  if (state.typography === "Bold") {
    titleSpacing = "0.04em";
    subtitleSpacing = "0.05em";
  }

  return `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  /* Customizer Variables */
  --primary: ${primary};
  --primary-soft: ${primary}20;
  --radius: ${radLg};
  --font-title: ${typo.title};
  --font-body: ${typo.body};
  --title-size: ${size.title};
  --subtitle-size: ${size.subtitle};
  --body-size: ${size.body};
  --title-spacing: ${titleSpacing};
  --subtitle-spacing: ${subtitleSpacing};
  --site-bg: ${siteBg};
  --site-surface: ${cardBg};
  --site-soft: ${siteSoft};
  --site-text: ${textMain};
  --site-muted: ${textMuted};
  --site-border: ${siteBorder};
  --section: ${sectionPadding};
  --padding: 42px;
  --gap: 18px;
  --filter-gap: ${filterGap};
  --duration: ${state.motion === "None" ? "0s" : "0.25s"};
  --ease: cubic-bezier(.2,.8,.2,1);
  --shadow-soft: ${softShadow};

  /* Ecclesia theme overrides */
  --accent: ${primary};
  --accent-2: ${primary}f0;
  --bg: ${siteBg};
  --surface: ${cardBg};
  --surface-soft: ${siteSoft};
  --text: ${textMain};
  --muted: ${textMuted};
  --border: ${siteBorder};
  --radius-xl: ${radXl};
  --radius-lg: ${radLg};
  --radius-md: ${radMd};
  --shadow: ${shadow};
  --soft-shadow: ${softShadow};
  --section: ${sectionPadding};

  /* Header following accents */
  --header-bg: color-mix(in srgb, var(--primary) 4%, ${siteBg});
  --header-border: color-mix(in srgb, var(--primary) 12%, ${dark ? "rgba(255,255,255,0.08)" : "rgba(29,24,18,0.12)"});
  --header-bg-glass: color-mix(in srgb, var(--primary) 8%, ${dark ? "rgba(11, 17, 32, 0.75)" : "rgba(251, 249, 246, 0.78)"});
  --header-text: var(--text);

  /* Footer following accents */
  --footer-bg: color-mix(in srgb, var(--primary) 10%, #0d0f12);
  --footer-text: #ffffff;
  --footer-text-muted: rgba(255, 255, 255, 0.65);
  --footer-link: color-mix(in srgb, var(--primary) 28%, rgba(255, 255, 255, 0.8));
  --footer-link-hover: var(--accent);
  --footer-border: color-mix(in srgb, var(--primary) 15%, rgba(255, 255, 255, 0.08));

  /* Left Rail & Tab Bar following accents */
  --rail-bg-glass: color-mix(in srgb, var(--primary) 6%, ${dark ? "rgba(11, 17, 32, 0.78)" : "rgba(251, 249, 246, 0.82)"});
  --rail-border: color-mix(in srgb, var(--primary) 12%, ${dark ? "rgba(255,255,255,0.08)" : "rgba(29,24,18,0.12)"});
  --rail-item-active-bg: color-mix(in srgb, var(--primary) 9%, transparent);
  --cinema-rail-bg-glass: color-mix(in srgb, var(--primary) 6%, rgba(11, 17, 32, 0.78));
  --cinema-rail-border: color-mix(in srgb, var(--primary) 12%, rgba(255,255,255,0.08));
}

html {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  scrollbar-gutter: stable;
}

/* Sleek Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--accent) 30%, rgba(0,0,0,0.15));
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--accent) 60%, rgba(0,0,0,0.25));
}

@media (max-width: 1024px) {
  ::-webkit-scrollbar {
    display: none;
    width: 0;
  }
  * {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
}

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  background: ${bgGradient === "none" ? "var(--bg)" : bgGradient} !important;
  background-attachment: fixed !important;
  color: var(--text) !important;
  font-size: var(--body-size) !important;
  transition: transform var(--duration) var(--ease);
}

body, html, button, input, select, textarea {
  font-family: var(--font-body), sans-serif !important;
}

h1, h2, h3, h4, h5, h6, .brand, .brand, .brand span {
  font-family: var(--font-title), sans-serif !important;
}

h1 {
  font-size: var(--title-size) !important;
  line-height: 1.05 !important;
  letter-spacing: var(--title-spacing) !important;
}

h2 {
  font-size: var(--subtitle-size) !important;
  line-height: 1.15 !important;
  letter-spacing: var(--subtitle-spacing) !important;
}

h3, h4, h5, h6, .brand, .brand span {
  letter-spacing: var(--subtitle-spacing) !important;
}

.lead {
  font-size: calc(var(--body-size) * 1.2) !important;
}

.section, .page-hero {
  padding-top: var(--section) !important;
  padding-bottom: var(--section) !important;
}

.card, .feature-card, .sermon-card, .event-card, .ministry-card, .person-card, .contact-card, .form-card, .page-hero-inner, .hero-copy, .prayer-box, .testimony-box {
  background: var(--surface) !important;
  border: ${borderStyle} !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--soft-shadow) !important;
  padding: ${cardPadding} !important;
  backdrop-filter: ${backdropFilter} !important;
  -webkit-backdrop-filter: ${backdropFilter} !important;
}

.btn, .button, .mobile-menu-btn {
  border-radius: var(--radius-md) !important;
  padding: ${btnPadding} !important;
}

/* Responsive Button and Icon Overrides to follow Accents dynamically */
.btn-primary, .primary, .primary-btn, button.primary, button.btn-primary {
  background: var(--accent) !important;
  color: white !important;
  box-shadow: 0 16px 34px color-mix(in srgb, var(--primary) 28%, transparent) !important;
}

.btn-soft, .softbtn, .soft, .soft-btn, .btn-secondary, button.soft {
  background: color-mix(in srgb, var(--primary) 11%, transparent) !important;
  color: var(--accent) !important;
  border-color: color-mix(in srgb, var(--primary) 15%, transparent) !important;
  box-shadow: none !important;
}

.btn-soft:hover, .softbtn:hover, .soft:hover, .soft-btn:hover, button.soft:hover {
  background: color-mix(in srgb, var(--primary) 20%, transparent) !important;
}

.feature-icon, .icon-box, .service-icon, .ministry-icon {
  background: color-mix(in srgb, var(--primary) 12%, transparent) !important;
  color: var(--accent) !important;
}

.eyebrow {
  background: color-mix(in srgb, var(--primary) 11%, transparent) !important;
  color: var(--accent) !important;
  border: 1px solid color-mix(in srgb, var(--primary) 22%, transparent) !important;
}

.sticky-icon {
  background: linear-gradient(145deg, var(--accent), color-mix(in srgb, var(--primary) 30%, #000000)) !important;
}

.day.has {
  background: color-mix(in srgb, var(--primary) 11%, transparent) !important;
  color: var(--accent) !important;
  border-color: color-mix(in srgb, var(--primary) 25%, transparent) !important;
}

.chat-item.host {
  background: color-mix(in srgb, var(--primary) 14%, transparent) !important;
}

.mark {
  box-shadow: 0 14px 30px color-mix(in srgb, var(--primary) 28%, transparent) !important;
}


${useAnimation ? `
@keyframes ecFadeIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
.section, .page-hero, .card, .feature-card, .sermon-card, .event-card, .ministry-card, .person-card, .contact-card, .form-card, .prayer-box, .testimony-box, h1, h2 {
  animation: ecFadeIn ${motionSpeed} var(--ease) both;
}
` : `
* {
  animation: none !important;
}
`}

header, footer, .header, .footer {
  transition: all var(--duration) var(--ease);
}

header, .header {
  width: 100%;
  min-width: 0;
  background: var(--header-bg) !important;
  border-bottom: 1px solid var(--header-border) !important;
  color: var(--header-text) !important;
}

header nav, .header nav {
  min-width: 0;
  flex-wrap: wrap;
}

header[data-header-style="full"], .header[data-header-style="full"] {
  width: 100%;
  position: relative;
}

header[data-header-style="transparent"], .header[data-header-style="transparent"] {
  background: transparent !important;
  border-color: transparent !important;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
}

header[data-header-style="floating"], .header[data-header-style="floating"] {
  width: calc(100% - 48px);
  max-width: var(--max) !important;
  margin: 18px auto 0;
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  position: relative;
  border: 1px solid var(--header-border) !important;
}

header[data-header-style="detached"], .header[data-header-style="detached"] {
  width: calc(100% - 96px);
  max-width: var(--max) !important;
  margin: 22px auto;
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  position: relative;
  border: 1px solid var(--header-border) !important;
}

header[data-header-effect="sticky"], .header[data-header-effect="sticky"],
header[data-header-effect="reveal"], .header[data-header-effect="reveal"],
header[data-header-effect="hide"], .header[data-header-effect="hide"],
header[data-header-effect="glass"], .header[data-header-effect="glass"] {
  position: fixed !important;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 999;
}

header[data-header-effect="floating-sticky"], .header[data-header-effect="floating-sticky"] {
  position: fixed !important;
  top: 18px;
  left: 0;
  right: 0;
  width: calc(100% - 36px) !important;
  z-index: 999;
  max-width: var(--max) !important;
  margin: 0 auto !important;
  border-radius: var(--radius-lg) !important;
  background: var(--site-surface) !important;
  box-shadow: var(--shadow-soft) !important;
}

/* Prevent content jump for fixed headers */
body:has(header[data-header-effect="sticky"]) .main-shell-body,
body:has(header[data-header-effect="reveal"]) .main-shell-body,
body:has(header[data-header-effect="hide"]) .main-shell-body,
body:has(header[data-header-effect="glass"]) .main-shell-body {
  padding-top: 82px;
}

body:has(header[data-header-effect="floating-sticky"]) .main-shell-body {
  padding-top: 110px;
}

header.ec-header-hidden, .header.ec-header-hidden {
  transform: translateY(-140%) !important;
}

header.ec-header-glass, .header.ec-header-glass {
  background: var(--header-bg-glass) !important;
  backdrop-filter: blur(22px) !important;
  -webkit-backdrop-filter: blur(22px) !important;
  box-shadow: var(--shadow-soft) !important;
  border-color: var(--header-border) !important;
}

header[data-header-layout="logo-left"] .nav-wrap, .header[data-header-layout="logo-left"] .nav-wrap {
  flex-direction: row;
  justify-content: space-between;
}

header[data-header-layout="logo-center"] .nav-wrap, .header[data-header-layout="logo-center"] .nav-wrap {
  justify-content: center;
  gap: 32px;
}

header[data-header-layout="logo-right"] .nav-wrap, .header[data-header-layout="logo-right"] .nav-wrap {
  flex-direction: row-reverse;
  justify-content: space-between;
}

header[data-header-layout="stacked"] .nav-wrap, .header[data-header-layout="stacked"] .nav-wrap {
  height: auto;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  padding-top: 20px;
  padding-bottom: 20px;
}

header[data-header-layout="menu-top"] .nav-wrap, .header[data-header-layout="menu-top"] .nav-wrap {
  height: auto;
  flex-direction: column-reverse;
  justify-content: center;
  gap: 14px;
  padding-top: 20px;
  padding-bottom: 20px;
}

.ec-mobile-menu-toggle {
  display: none;
  width: 42px;
  height: 42px;
  border: 1px solid var(--site-border);
  background: var(--site-surface);
  color: var(--site-text);
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
}

header[data-mobile-hamburger-shape="plain"] .ec-mobile-menu-toggle,
.header[data-mobile-hamburger-shape="plain"] .ec-mobile-menu-toggle {
  border-color: transparent !important;
  background: transparent !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

header[data-mobile-hamburger-shape="circle"] .ec-mobile-menu-toggle,
.header[data-mobile-hamburger-shape="circle"] .ec-mobile-menu-toggle {
  border-radius: 999px !important;
  border: 1px solid var(--site-border) !important;
  background: var(--site-surface) !important;
  box-shadow: var(--shadow-soft);
}

.ec-mobile-menu-toggle span,
.ec-mobile-menu-toggle span:before,
.ec-mobile-menu-toggle span:after {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
  content: "";
  position: relative;
}

.ec-mobile-menu-toggle span:before {
  position: absolute;
  top: -6px;
}

.ec-mobile-menu-toggle span:after {
  position: absolute;
  top: 6px;
}

.ec-mobile-drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 75vw;
  max-width: 75vw;
  background: var(--site-surface);
  color: var(--site-text);
  z-index: 500;
  padding: 28px;
  box-shadow: 0 30px 90px rgba(15, 23, 42, 0.25);
  transition: transform var(--duration) var(--ease);
  display: block;
  overflow-y: auto;
}

.ec-mobile-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.ec-mobile-drawer-head h3 {
  font-family: var(--font-title);
  font-size: 24px;
  color: var(--site-text);
  margin: 0;
}

.ec-mobile-drawer-close {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid var(--site-border);
  background: var(--site-soft);
  color: var(--site-text);
  display: grid;
  place-items: center;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  padding: 0;
  flex-shrink: 0;
}

.ec-mobile-drawer a {
  display: block;
  padding: 13px 0;
  color: var(--site-text);
  text-decoration: none;
  border-bottom: 1px solid var(--site-border);
}

.ec-mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
  z-index: 450;
  cursor: pointer;
}

body[data-mobile-menu-position="right"] .ec-mobile-drawer {
  right: 0;
  transform: translateX(100%);
}

body[data-mobile-menu-position="left"] .ec-mobile-drawer {
  left: 0;
  transform: translateX(-100%);
}

body.ec-mobile-drawer-open[data-mobile-menu-position="right"] .ec-mobile-drawer,
body.ec-mobile-drawer-open[data-mobile-menu-position="left"] .ec-mobile-drawer {
  transform: translateX(0);
}

body.ec-mobile-drawer-open .ec-mobile-overlay {
  display: block;
}

body.ec-mobile-drawer-open[data-mobile-drawer-mode="push"] .ec-mobile-overlay {
  background: transparent;
}

body[data-mobile-drawer-mode="push"] > *:not(.ec-mobile-drawer):not(.ec-mobile-overlay):not(base):not(script):not(style) {
  transition: transform var(--duration) var(--ease);
}

body.ec-mobile-drawer-open[data-mobile-drawer-mode="push"][data-mobile-menu-position="right"] > *:not(.ec-mobile-drawer):not(.ec-mobile-overlay) {
  transform: translateX(-75vw);
}

body.ec-mobile-drawer-open[data-mobile-drawer-mode="push"][data-mobile-menu-position="left"] > *:not(.ec-mobile-drawer):not(.ec-mobile-overlay) {
  transform: translateX(75vw);
}

@media(max-width:980px) {
  :root {
    --section: clamp(16px, 4vw, 24px);
    --padding: clamp(28px, 5vw, 42px);
  }

  h1 {
    font-size: clamp(40px, 7vw, var(--title-size)) !important;
  }

  p {
    font-size: clamp(17px, 2.5vw, var(--subtitle-size)) !important;
  }

  header, .header {
    padding-left: clamp(22px, 4vw, 34px) !important;
    padding-right: clamp(22px, 4vw, 34px) !important;
  }
}

@media(max-width:760px) {
  header, .header {
    position: relative;
    gap: 12px;
    min-height: 74px;
    display: flex !important;
    align-items: center !important;
  }

  header .nav-wrap, .header .nav-wrap,
  header .navwrap, .header .navwrap {
    display: contents !important;
  }

  header nav, .header nav,
  header .header-actions, .header .header-actions,
  header .actions, .header .actions {
    display: none !important;
  }

  .ec-mobile-menu-toggle {
    display: flex;
  }

  header .brand, .header .brand {
    min-width: 0;
    white-space: nowrap;
  }

  header[data-header-layout="logo-left"][data-mobile-menu-position="left"],
  .header[data-header-layout="logo-left"][data-mobile-menu-position="left"] {
    justify-content: flex-start !important;
    flex-direction: row !important;
  }

  header[data-header-layout="logo-left"][data-mobile-menu-position="left"] .ec-mobile-menu-toggle,
  .header[data-header-layout="logo-left"][data-mobile-menu-position="left"] .ec-mobile-menu-toggle {
    order: 0;
    margin: 0;
  }

  header[data-header-layout="logo-left"][data-mobile-menu-position="left"] .brand,
  .header[data-header-layout="logo-left"][data-mobile-menu-position="left"] .brand {
    order: 1;
    margin: 0;
    text-align: left;
  }

  header[data-header-layout="logo-left"][data-mobile-menu-position="right"],
  .header[data-header-layout="logo-left"][data-mobile-menu-position="right"] {
    justify-content: space-between !important;
    flex-direction: row !important;
  }

  header[data-header-layout="logo-left"][data-mobile-menu-position="right"] .brand,
  .header[data-header-layout="logo-left"][data-mobile-menu-position="right"] .brand {
    order: 0;
    margin: 0;
    text-align: left;
  }

  header[data-header-layout="logo-left"][data-mobile-menu-position="right"] .ec-mobile-menu-toggle,
  .header[data-header-layout="logo-left"][data-mobile-menu-position="right"] .ec-mobile-menu-toggle {
    order: 20;
    margin-left: auto;
  }

  header[data-header-layout="logo-right"][data-mobile-menu-position="left"],
  .header[data-header-layout="logo-right"][data-mobile-menu-position="left"] {
    justify-content: space-between !important;
    flex-direction: row !important;
  }

  header[data-header-layout="logo-right"][data-mobile-menu-position="left"] .ec-mobile-menu-toggle,
  .header[data-header-layout="logo-right"][data-mobile-menu-position="left"] .ec-mobile-menu-toggle {
    order: 0;
    margin-right: auto;
  }

  header[data-header-layout="logo-right"][data-mobile-menu-position="left"] .brand,
  .header[data-header-layout="logo-right"][data-mobile-menu-position="left"] .brand {
    order: 20;
    margin-left: auto;
    text-align: right;
  }

  header[data-header-layout="logo-right"][data-mobile-menu-position="right"],
  .header[data-header-layout="logo-right"][data-mobile-menu-position="right"] {
    justify-content: flex-end !important;
    flex-direction: row !important;
  }

  header[data-header-layout="logo-right"][data-mobile-menu-position="right"] .brand,
  .header[data-header-layout="logo-right"][data-mobile-menu-position="right"] .brand {
    order: 10;
    margin: 0;
    text-align: right;
  }

  header[data-header-layout="logo-right"][data-mobile-menu-position="right"] .ec-mobile-menu-toggle,
  .header[data-header-layout="logo-right"][data-mobile-menu-position="right"] .ec-mobile-menu-toggle {
    order: 20;
    margin: 0;
  }

  header[data-header-layout="logo-center"], .header[data-header-layout="logo-center"],
  header[data-header-layout="stacked"], .header[data-header-layout="stacked"],
  header[data-header-layout="menu-top"], .header[data-header-layout="menu-top"] {
    justify-content: center !important;
    flex-direction: row !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  header[data-header-layout="logo-center"] .brand, .header[data-header-layout="logo-center"] .brand,
  header[data-header-layout="stacked"] .brand, .header[data-header-layout="stacked"] .brand,
  header[data-header-layout="menu-top"] .brand, .header[data-header-layout="menu-top"] .brand {
    order: 10;
    margin: 0 auto;
    text-align: center;
  }

  header[data-header-layout="logo-center"][data-mobile-menu-position="left"] .ec-mobile-menu-toggle,
  .header[data-header-layout="logo-center"][data-mobile-menu-position="left"] .ec-mobile-menu-toggle,
  header[data-header-layout="stacked"][data-mobile-menu-position="left"] .ec-mobile-menu-toggle,
  .header[data-header-layout="stacked"][data-mobile-menu-position="left"] .ec-mobile-menu-toggle,
  header[data-header-layout="menu-top"][data-mobile-menu-position="left"] .ec-mobile-menu-toggle,
  .header[data-header-layout="menu-top"][data-mobile-menu-position="left"] .ec-mobile-menu-toggle {
    position: absolute;
    left: clamp(18px, 5vw, 34px);
    order: 0;
    margin: 0;
  }

  header[data-header-layout="logo-center"][data-mobile-menu-position="right"] .ec-mobile-menu-toggle,
  .header[data-header-layout="logo-center"][data-mobile-menu-position="right"] .ec-mobile-menu-toggle,
  header[data-header-layout="stacked"][data-mobile-menu-position="right"] .ec-mobile-menu-toggle,
  .header[data-header-layout="stacked"][data-mobile-menu-position="right"] .ec-mobile-menu-toggle,
  header[data-header-layout="menu-top"][data-mobile-menu-position="right"] .ec-mobile-menu-toggle,
  .header[data-header-layout="menu-top"][data-mobile-menu-position="right"] .ec-mobile-menu-toggle {
    position: absolute;
    right: clamp(18px, 5vw, 34px);
    order: 20;
    margin: 0;
  }

  header[data-header-style="detached"], .header[data-header-style="detached"] {
    width: calc(100% - 34px);
    margin: 14px auto;
  }

  h1 {
    font-size: clamp(36px, 10vw, 58px) !important;
  }

  section {
    padding-left: clamp(22px, 6vw, 32px) !important;
    padding-right: clamp(22px, 6vw, 32px) !important;
  }

  .grid { grid-template-columns: 1fr !important }
  .footer-widgets { grid-template-columns: 1fr !important }
  .footer-bottom { flex-direction: column; text-align: center }
}

footer, .footer {
  background: var(--footer-bg) !important;
  color: var(--footer-text) !important;
  border-top: 1px solid var(--footer-border) !important;
}

/* Base text elements like paragraphs, list items, etc. */
footer p, .footer p, footer span, .footer span, footer li, .footer li, footer div, .footer div {
  color: var(--footer-text-muted) !important;
}

/* Headings in the footer should be clean white */
footer h1, footer h2, footer h3, footer h4, footer h5, footer h6,
.footer h1, .footer h2, .footer h3, .footer h4, .footer h5, .footer h6 {
  color: var(--footer-text) !important;
}

/* Links in the footer can have a little bit of the accent color */
footer a, .footer a {
  color: var(--footer-link) !important;
  transition: color var(--duration) var(--ease) !important;
}

footer a:hover, .footer a:hover {
  color: var(--footer-link-hover) !important;
}

footer[data-footer-style="classic"], .footer[data-footer-style="classic"] {
  background: var(--footer-bg) !important;
  border-top: 1px solid var(--footer-border) !important;
  text-align: left;
}

footer[data-footer-style="minimal"], .footer[data-footer-style="minimal"] {
  background: transparent !important;
  border-top: 1px solid var(--footer-border) !important;
  text-align: center;
}

footer[data-footer-style="floating"], .footer[data-footer-style="floating"] {
  width: calc(100% - 48px);
  margin: 0 auto 24px;
  border-radius: var(--radius);
  background: var(--surface) !important;
  box-shadow: var(--shadow-soft) !important;
  border: 1px solid var(--footer-border) !important;
}

footer[data-footer-style="boxed"], .footer[data-footer-style="boxed"] {
  max-width: 1120px;
  width: calc(100% - 96px);
  margin: 24px auto;
  border-radius: var(--radius);
  background: var(--footer-bg) !important;
  border: 1px solid var(--footer-border) !important;
}

footer[data-footer-style="compact"], .footer[data-footer-style="compact"] {
  padding-top: 22px !important;
  padding-bottom: 22px !important;
  background: var(--footer-bg) !important;
  border-top: 1px solid var(--footer-border) !important;
  text-align: center;
}

footer[data-footer-widgets="hidden"] .footer-widgets { display: none !important }
footer[data-footer-widget-layout="equal"] .footer-widgets { grid-template-columns: repeat(4, 1fr) }
footer[data-footer-widget-layout="feature"] .footer-widgets { grid-template-columns: 1.55fr 1fr 1fr 1fr }
footer[data-footer-widget-layout="compact"] .footer-widgets { grid-template-columns: repeat(4, 1fr); gap: 12px }
footer[data-footer-widget-layout="stacked"] .footer-widgets { grid-template-columns: 1fr; text-align: center }

footer[data-footer-bottom="center"] .footer-bottom { justify-content: center; text-align: center; flex-direction: column }
footer[data-footer-bottom="split"] .footer-bottom { justify-content: space-between }
footer[data-footer-bottom="minimal"] .footer-bottom { border-top: 0; justify-content: center; text-align: center }
footer[data-footer-bottom="minimal"] .footer-legal { display: none !important }
footer[data-footer-legal="hidden"] .footer-legal { display: none !important }

.ec-editing * { cursor: pointer !important }

/* Centered sticky side navigation.
   The sticky element owns the full viewport-height layout box so the browser's
   sticky boundary math matches the visible box and stops before the footer. */
@media (min-width: 901px) {
  :where(.side, aside.side) {
    position: sticky !important;
    top: var(--sticky-side-offset, 0px) !important;
    align-self: start !important;
    block-size: calc(100dvh - var(--sticky-side-offset, 0px)) !important;
    display: grid !important;
    align-content: center !important;
    gap: var(--sticky-side-gap, 10px);
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  :where(.side, aside.side) > :where(.side-inner, nav) {
    max-block-size: calc(100dvh - var(--sticky-side-offset, 0px) - 24px);
    overflow-y: auto;
  }
}

/* Responsive Left Rail Sidebar & Bottom Tab Rail Overrides */
.left-rail, aside.left-rail {
  background: var(--rail-bg-glass) !important;
  border-right: 1px solid var(--rail-border) !important;
  backdrop-filter: blur(25px) !important;
  -webkit-backdrop-filter: blur(25px) !important;
  transition: all var(--duration) var(--ease) !important;
}

body.cinema-mode .left-rail {
  background: var(--cinema-rail-bg-glass) !important;
  border-right-color: var(--cinema-rail-border) !important;
}

.rail-item {
  color: var(--site-muted) !important;
  transition: all var(--duration) var(--ease) !important;
}

.rail-item:hover {
  color: var(--accent) !important;
}

.rail-item.active, body.cinema-mode .left-rail .rail-item.active {
  color: var(--accent) !important;
  background: var(--rail-item-active-bg) !important;
  border-left-color: var(--accent) !important;
}

.mobile-tab-rail {
  background: var(--rail-bg-glass) !important;
  border-top: 1px solid var(--rail-border) !important;
  backdrop-filter: blur(22px) !important;
  -webkit-backdrop-filter: blur(22px) !important;
  transition: all var(--duration) var(--ease) !important;
}

body.cinema-mode .mobile-tab-rail {
  background: var(--cinema-rail-bg-glass) !important;
  border-top-color: var(--cinema-rail-border) !important;
}

.mobile-tab-item {
  color: var(--site-muted) !important;
}

.mobile-tab-item.active {
  color: var(--accent) !important;
}

/* Residue Overrides for Top Notice, Ambient Backgrounds, and Action Cards */
.top-notice {
  background: color-mix(in srgb, var(--primary) 6%, #111111) !important;
}
.top-notice span {
  color: var(--accent) !important;
}

.ambient {
  background:
    radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 32%),
    radial-gradient(circle at 86% 8%, color-mix(in srgb, var(--primary) 12%, transparent), transparent 28%),
    linear-gradient(180deg, color-mix(in srgb, var(--primary) 4%, #0d0907) 0%, #070707 52%, #0b0a08 100%) !important;
}

.topbar {
  background: color-mix(in srgb, var(--primary) 3%, rgba(7,7,7,0.65)) !important;
}

.action-card.prayer { background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 18%, transparent), rgba(255,255,255,.07)) !important; }
.action-card.salvation { background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, transparent), rgba(255,255,255,.07)) !important; }
.action-card.giving { background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 16%, transparent), rgba(255,255,255,.07)) !important; }

.chat-item.host { background: color-mix(in srgb, var(--primary) 14%, transparent) !important; }
.eyebrow {
  background: color-mix(in srgb, var(--primary) 14%, transparent) !important;
  color: var(--accent) !important;
  border-color: color-mix(in srgb, var(--primary) 22%, transparent) !important;
}
`;
}

export function parseHtml(htmlStr: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(htmlStr, "text/html");
}

export function serializeHtml(doc: Document): string {
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

export function injectThemeTokens(doc: Document, state: ThemeState): void {
  let styleEl = doc.getElementById("ecclesia-theme-tokens");
  if (!styleEl) {
    styleEl = doc.createElement("style");
    styleEl.id = "ecclesia-theme-tokens";
    doc.head.appendChild(styleEl);
  }
  styleEl.textContent = getTokenStyle(state);
}

export function applyThemeStructure(doc: Document, state: ThemeState): void {
  // Inject base URL so relative assets (like styles.css) resolve correctly to the theme folder
  let baseEl = doc.querySelector("base");
  if (!baseEl) {
    baseEl = doc.createElement("base");
    baseEl.setAttribute("href", "/themes/ecclesia/");
    doc.head.insertBefore(baseEl, doc.head.firstChild);
  }

  // Cache bust all stylesheets so the preview always loads the latest CSS
  const timestamp = Date.now();
  doc.querySelectorAll("link[rel='stylesheet']").forEach(link => {
    const href = link.getAttribute("href");
    if (href && !href.startsWith("http")) {
      link.setAttribute("href", `${href}?t=${timestamp}`);
    }
  });

  const body = doc.body;
  if (body) {
    body.setAttribute("data-mobile-menu-position", state.mobileMenuPosition);
    body.setAttribute("data-mobile-drawer-mode", state.mobileDrawerMode);
  }

  const header = doc.querySelector("header, [data-editor-type='header']");
  if (header) {
    header.setAttribute("data-editor-type", "header");
    header.setAttribute("data-editor-label", "Header");
    header.setAttribute("data-header-style", state.headerStyle);
    header.setAttribute("data-header-layout", state.headerLayout);
    header.setAttribute("data-header-effect", state.headerEffect);
    header.setAttribute("data-mobile-menu-position", state.mobileMenuPosition);
    header.setAttribute("data-mobile-hamburger-shape", state.mobileHamburgerShape);

    // Make sure elements match mobile menu toggles
    ensureMobileMenu(doc, header as HTMLElement);
  }

  const footer = doc.querySelector("footer, [data-editor-type='footer']");
  if (footer) {
    footer.setAttribute("data-editor-type", "footer");
    footer.setAttribute("data-editor-label", "Footer");
    footer.setAttribute("data-footer-style", state.footerStyle);
    footer.setAttribute("data-footer-widgets", state.footerWidgets === "show" ? "shown" : "hidden");
    footer.setAttribute("data-footer-widget-layout", state.footerWidgetLayout);
    footer.setAttribute("data-footer-bottom", state.footerBottom);
    footer.setAttribute("data-footer-legal", state.footerLegal === "show" ? "shown" : "hidden");

    const copy = footer.querySelector(".footer-copy");
    if (copy) (copy as HTMLElement).innerText = state.copyrightText;

    const privacy = footer.querySelector(".privacy-link");
    if (privacy) {
      (privacy as HTMLElement).innerText = state.privacyLabel;
      privacy.setAttribute("href", state.privacyHref);
    }

    const terms = footer.querySelector(".terms-link");
    if (terms) {
      (terms as HTMLElement).innerText = state.termsLabel;
      terms.setAttribute("href", state.termsHref);
    }
  }
}

function ensureMobileMenu(doc: Document, header: HTMLElement): void {
  const oldMenuBtn = header.querySelector(".mobilebtn, .mobile-menu-btn");
  if (oldMenuBtn) oldMenuBtn.remove();

  let toggle = header.querySelector(".ec-mobile-menu-toggle");
  if (!toggle) {
    toggle = doc.createElement("button");
    toggle.className = "ec-mobile-menu-toggle";
    toggle.setAttribute("data-editor-type", "button");
    toggle.setAttribute("data-editor-label", "Mobile Menu Button");
    toggle.setAttribute("aria-label", "Open mobile menu");
    toggle.innerHTML = "<span></span>";
    header.appendChild(toggle);
  }

  let drawer = doc.querySelector(".ec-mobile-drawer");
  if (!drawer) {
    drawer = doc.createElement("aside");
    drawer.className = "ec-mobile-drawer";
    drawer.setAttribute("data-editor-type", "section");
    drawer.setAttribute("data-editor-label", "Mobile Drawer");
    doc.body.appendChild(drawer);
  }

  let overlay = doc.querySelector(".ec-mobile-overlay");
  if (!overlay) {
    overlay = doc.createElement("div");
    overlay.className = "ec-mobile-overlay";
    doc.body.appendChild(overlay);
  }

  const nav = header.querySelector("nav");
  drawer.innerHTML = `
    <div class="ec-mobile-drawer-head">
      <h3>Menu</h3>
      <button class="ec-mobile-drawer-close" aria-label="Close mobile menu">×</button>
    </div>
    <div class="ec-mobile-drawer-nav"></div>
  `;

  const drawerNav = drawer.querySelector(".ec-mobile-drawer-nav");
  if (drawerNav) {
    if (nav) {
      Array.from(nav.querySelectorAll("a")).forEach((link) => {
        const clone = link.cloneNode(true) as HTMLElement;
        clone.setAttribute("data-editor-type", "button");
        drawerNav.appendChild(clone);
      });
    }
    
    const actions = header.querySelector(".header-actions, .actions");
    if (actions) {
      Array.from(actions.querySelectorAll("a, button:not(.ec-mobile-menu-toggle):not(.mobile-menu-btn):not(.mobilebtn)")).forEach((action) => {
        const clone = action.cloneNode(true) as HTMLElement;
        clone.setAttribute("data-editor-type", "button");
        clone.style.marginTop = "8px";
        drawerNav.appendChild(clone);
      });
    }
  }
}

export function changeElementTag(doc: Document, path: string, newTagName: string): string {
  const el = doc.querySelector(path);
  if (!el || !el.parentElement) return path;

  const newEl = doc.createElement(newTagName);

  // Copy attributes
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    newEl.setAttribute(attr.name, attr.value);
  }

  // Copy children
  while (el.firstChild) {
    newEl.appendChild(el.firstChild);
  }

  el.parentElement.replaceChild(newEl, el);

  // Return new CSS path helper
  return cssPath(newEl);
}

export function changeButtonRole(doc: Document, path: string, role: "primary" | "soft" | "light"): void {
  const el = doc.querySelector(path);
  if (!el) return;

  el.classList.remove("btn-primary", "btn-soft", "btn-light");
  if (role === "primary") el.classList.add("btn-primary");
  else if (role === "soft") el.classList.add("btn-soft");
  else if (role === "light") el.classList.add("btn-light");
}

export function changeCardRole(doc: Document, path: string, role: "generic" | "icon" | "person"): void {
  const el = doc.querySelector(path);
  if (!el) return;

  el.classList.remove("card", "feature-card", "person-card");

  if (role === "generic") {
    el.classList.add("card");
    const icon = el.querySelector(".feature-icon");
    if (icon) icon.remove();
    const img = el.querySelector("img");
    if (img) img.remove();
  } else if (role === "icon") {
    el.classList.add("feature-card");
    // Ensure feature icon exists
    let icon = el.querySelector(".feature-icon");
    if (!icon) {
      icon = doc.createElement("div");
      icon.className = "feature-icon";
      icon.innerHTML = `<i data-lucide="help-circle"></i>`;
      el.insertBefore(icon, el.firstChild);
    }
    const img = el.querySelector("img");
    if (img) img.remove();
  } else if (role === "person") {
    el.classList.add("person-card");
    // Ensure image exists
    let img = el.querySelector("img");
    if (!img) {
      img = doc.createElement("img");
      img.setAttribute("src", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=85");
      el.insertBefore(img, el.firstChild);
    }
    const icon = el.querySelector(".feature-icon");
    if (icon) icon.remove();
  }
}

export function cssPath(el: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current.nodeType === 1 && current.tagName !== "BODY") {
    let index = 1;
    let sibling = current;

    while ((sibling = sibling.previousElementSibling as Element)) {
      if (sibling.tagName === current.tagName) index++;
    }

    parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${index})`);
    current = current.parentElement;
  }

  return parts.join(">");
}

export function optimizeStylesIntoTokens(doc: Document): { count: number; details: string[] } {
  const details: string[] = [];
  let count = 0;

  // 1. Scan for inline styles
  const allElements = Array.from(doc.querySelectorAll("*"));
  allElements.forEach((el) => {
    const styleAttr = el.getAttribute("style");
    if (!styleAttr) return;

    // Convert hex/rgb primary colors to var(--primary)
    // Matches ocean blue #0284c7, purple #7c3aed, blue #2563eb, etc.
    let updatedStyle = styleAttr;

    // Color conversion checks
    const hexColorRegex = /#([0-9a-fA-F]{3,8})/g;
    updatedStyle = updatedStyle.replace(hexColorRegex, (match) => {
      // Check if matches accent colors
      const lower = match.toLowerCase();
      if (
        lower === "#0284c7" ||
        lower === "#2563eb" ||
        lower === "#7c3aed" ||
        lower === "#c71585" ||
        lower === "#16a34a" ||
        lower === "#0d9488" ||
        lower === "#dc2626" ||
        lower === "#ff017f" ||
        lower === "#ec4899" ||
        lower === "#ea580c" ||
        lower === "#d97706" ||
        lower === "#8b5e3c"
      ) {
        count++;
        details.push(`Replaced inline hex color "${match}" with var(--primary) on <${el.tagName.toLowerCase()}>`);
        return "var(--primary)";
      }
      return match;
    });

    // Font-family replacements
    if (updatedStyle.includes("font-family")) {
      updatedStyle = updatedStyle.replace(/font-family:[^;]+/g, () => {
        count++;
        if (el.tagName.startsWith("H") || el.classList.contains("title")) {
          details.push(`Normalized title font-family to var(--font-title) on <${el.tagName.toLowerCase()}>`);
          return "font-family: var(--font-title)";
        } else {
          details.push(`Normalized body font-family to var(--font-body) on <${el.tagName.toLowerCase()}>`);
          return "font-family: var(--font-body)";
        }
      });
    }

    if (updatedStyle !== styleAttr) {
      el.setAttribute("style", updatedStyle);
    }
  });

  // 2. Scan class names for raw color-based background classes and replace with theme token variables
  // (In Ecclesia Theme, components use standard variables, so we clear static styling files overrides where possible)
  
  return { count, details };
}

export function cleanPageForExport(doc: Document): string {
  // Clone doc to avoid editing the live document
  const clone = doc.cloneNode(true) as Document;

  // Remove base tag if it was injected by the customizer
  const baseTag = clone.querySelector("base");
  if (baseTag && baseTag.getAttribute("href") === "/themes/ecclesia/") {
    baseTag.remove();
  }

  // Remove customizer outlines
  const elements = Array.from(clone.querySelectorAll("*"));
  elements.forEach((el) => {
    (el as HTMLElement).style.outline = "";
    (el as HTMLElement).style.outlineOffset = "";
  });

  // Remove edit class from body
  if (clone.body) {
    clone.body.classList.remove("ec-editing");
    clone.body.classList.remove("ec-mobile-drawer-open");
  }

  // Remove any custom script tags injected by the editor
  const scriptTags = Array.from(clone.querySelectorAll("script"));
  scriptTags.forEach((s) => {
    if (s.textContent && s.textContent.includes("__ecclesiaBound")) {
      s.remove();
    }
  });

  return serializeHtml(clone);
}
