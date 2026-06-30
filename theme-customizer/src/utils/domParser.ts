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
  headerContentBoxed: boolean;
  headerLook: string;
  headerGlass: boolean;
  headerShadow: boolean;
  headerShadowIntensity: string;
  headerShadowThemed: boolean;
  headerSolidThemed: boolean;
  headerBorder: boolean;
  headerBorderSize: string;
  headerBorderColor: string;
  headerLayout: string;
  headerEffect: string;
  headerFontSize: string;
  headerFontWeight: string;
  mobileMenuPosition: string;
  mobileMenuFlip: boolean;
  mobileLogoAlign: 'left' | 'center' | 'right';
  mobileDrawerMode: string;
  mobileHamburgerShape: string;
  mobileDrawerButtonsFullWidth: boolean;
  mobileDrawerCombine: boolean;
  mobileDrawerRailPosition: 'left' | 'right';
  mobileRailVerticalAlign: 'top' | 'center' | 'bottom';

  footerStyle: string;
  footerWidgets: 'show' | 'hidden';
  footerWidgetLayout: string;
  footerBottom: string;
  footerLegal: 'show' | 'hidden';
  footerManual: boolean;
  footerColumns?: number;

  railPosition?: string;
  railShowIcons?: boolean;
  railStyle?: string;
  railShadow?: boolean;
  railShadowIntensity?: string;
  railShadowThemed?: boolean;
  railSolidThemed?: boolean;
  railBorder?: boolean;
  railBorderSize?: string;
  railBorderColor?: string;
  railVerticalAlign?: string;
  railFontSize?: string;
  railFontWeight?: string;

  cardThumbnailStyle?: string;
  cardHoverEffect?: string;
  cardGridGapOverride?: string;
  cardPaddingOverride?: string;
  cardContentSpacing?: string;

  copyrightText: string;
  privacyLabel: string;
  privacyHref: string;
  termsLabel: string;
  termsHref: string;
}

type TenantGlobalContent = {
  churchIdentity?: {
    churchName?: string;
    logoUrl?: string;
    faviconUrl?: string;
    tagline?: string;
    description?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  services?: {
    serviceTimes?: Array<{ label?: string; time?: string; location?: string }>;
  };
};

function tenantText(value: unknown): string {
  return String(value || "").trim();
}

function serviceTimesSummary(globalContent: TenantGlobalContent): string {
  const serviceTimes = Array.isArray(globalContent.services?.serviceTimes)
    ? globalContent.services?.serviceTimes || []
    : [];
  return serviceTimes
    .filter((item) => tenantText(item.label) || tenantText(item.time))
    .slice(0, 2)
    .map((item) => {
      const label = tenantText(item.label || "Service");
      const time = tenantText(item.time);
      return time ? `${label}: ${time}` : label;
    })
    .join(" · ");
}

function replaceTenantText(root: ParentNode, replacements: Array<[string, string]>): void {
  const filtered = replacements.filter(([from, to]) => from && to && from !== to);
  if (!filtered.length) return;

  const rootNode = root as unknown as Node;
  const ownerDoc = rootNode.nodeType === 9 ? rootNode as Document : rootNode.ownerDocument || document;
  const walker = ownerDoc.createTreeWalker(rootNode, 4);
  const textNodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    textNodes.push(current as Text);
    current = walker.nextNode();
  }

  textNodes.forEach((node) => {
    let value = node.nodeValue || "";
    filtered.forEach(([from, to]) => {
      value = value.split(from).join(to);
    });
    node.nodeValue = value;
  });
}

export function applyTenantContent(doc: Document, globalContent?: TenantGlobalContent | null): void {
  if (!globalContent) return;

  const churchName = tenantText(globalContent.churchIdentity?.churchName);
  if (!churchName) return;

  const logoUrl = tenantText(globalContent.churchIdentity?.logoUrl);
  const faviconUrl = tenantText(globalContent.churchIdentity?.faviconUrl);
  const description = tenantText(globalContent.churchIdentity?.description);
  const email = tenantText(globalContent.contact?.email);
  const phone = tenantText(globalContent.contact?.phone);
  const address = tenantText(globalContent.contact?.address);
  const serviceSummary = serviceTimesSummary(globalContent);

  if (doc.title) {
    doc.title = doc.title
      .split("Grace City Church").join(churchName)
      .split("Grace City").join(churchName);
  }

  const metaDescription = doc.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (metaDescription && description) {
    metaDescription.setAttribute("content", description);
  }

  if (faviconUrl) {
    let favicon = doc.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!favicon) {
      favicon = doc.createElement("link");
      favicon.setAttribute("rel", "icon");
      doc.head.appendChild(favicon);
    }
    favicon.setAttribute("href", faviconUrl);
  }

  doc.querySelectorAll<HTMLElement>(".brand").forEach((brand) => {
    const label = Array.from(brand.querySelectorAll("span")).find((span) => {
      const text = tenantText(span.textContent);
      return text.includes("Grace City") || text.includes("Church");
    });
    if (label) label.textContent = churchName;
  });

  if (logoUrl) {
    doc.querySelectorAll<HTMLElement>(".brand .brand-mark, .brand .mark, .site-brand .site-mark").forEach((mark) => {
      mark.innerHTML = "";
      const img = doc.createElement("img");
      img.setAttribute("src", logoUrl);
      img.setAttribute("alt", `${churchName} logo`);
      img.setAttribute("style", "width:100%;height:100%;object-fit:contain;display:block;");
      mark.appendChild(img);
    });
  }

  if (serviceSummary) {
    doc.querySelectorAll<HTMLElement>(".top-notice").forEach((notice) => {
      notice.textContent = serviceSummary;
    });
  }

  replaceTenantText(doc.body || doc, [
    ["Grace City Church", churchName],
    ["Grace City", churchName],
    ["A Spirit-filled church helping people encounter Jesus, grow in the Word, build strong families, and serve their city.", description],
    ["Grace City Church is a vibrant, Spirit-filled community where people worship, grow, serve, pray, and discover God’s purpose for their lives.", description],
    ["Grace City Church exists to help people know Jesus, grow in the Word, build strong families, and serve their city with compassion and excellence.", description],
    ["hello@example.church", email],
    ["hello@gracecitychurch.org", email],
    ["hello@gracecity.church", email],
    ["+1 555 000 0000", phone],
    ["+1 000 000 0000", phone],
    ["+1 555 010 2026", phone],
    ["(555) 123-4567", phone],
    ["123 Worship Avenue, Your City", address],
    ["123 Kingdom Avenue, Edmonton, AB", address],
    ["101 Fellowship Way, Grace City", address],
    ["Sunday Service: 9:30 AM · Midweek Word & Prayer: Wednesday 7:00 PM", serviceSummary],
    ["Sunday Worship: 9:30 AM · Midweek Word & Prayer: Wednesday 7:00 PM", serviceSummary],
    ["Sunday 9:30 AM · Wednesday 7:00 PM", serviceSummary],
  ]);
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
  const baseAccent = colorMap[state.family] || "#0284c7";
  const typo = typographyMap[state.typography] || typographyMap["Modern Sans"];
  const size = typeSizeMap[state.typeSize] || typeSizeMap["Balanced"];
  const dark = state.previewMode === "dark";

  // Map secondary/gold glow based on active primary family so they match
  let secondaryColor = "#fbbf24"; // default gold
  const fam = (state.family || "").toLowerCase();
  if (fam.includes("green") || fam.includes("teal")) {
    secondaryColor = "#4ade80"; // mint/green glow
  } else if (fam.includes("blue") || fam.includes("ocean") || fam.includes("purple") || fam.includes("orchid")) {
    secondaryColor = "#38bdf8"; // sky blue glow
  } else if (fam.includes("neutral") || fam.includes("brown")) {
    secondaryColor = "#cbd5e1"; // slate/silver glow
  }

  // Calculate primary accent color and secondary variables based on style
  let primary = baseAccent;
  let primarySoft = `${baseAccent}20`;
  let accent2 = `${baseAccent}f0`;
  let gold = secondaryColor;

  if (state.style === "Soft") {
    primary = `color-mix(in srgb, ${baseAccent} 65%, ${dark ? "#374151" : "#cbd5e1"})`;
    primarySoft = `color-mix(in srgb, var(--accent) 8%, transparent)`;
    accent2 = `color-mix(in srgb, var(--accent) 70%, transparent)`;
    gold = `color-mix(in srgb, ${secondaryColor} 50%, ${dark ? "#1f2937" : "#f1f5f9"})`;
  } else if (state.style === "Vibrant") {
    primary = baseAccent;
    primarySoft = `color-mix(in srgb, var(--accent) 18%, transparent)`;
    accent2 = `color-mix(in srgb, var(--accent) 90%, transparent)`;
    gold = secondaryColor;
  } else if (state.style === "Rich") {
    primary = dark ? baseAccent : `color-mix(in srgb, ${baseAccent} 82%, #000000)`;
    primarySoft = `color-mix(in srgb, var(--accent) 22%, transparent)`;
    accent2 = `color-mix(in srgb, var(--accent) 95%, transparent)`;
    gold = secondaryColor;
  } else if (state.style === "Elegant") {
    primary = `color-mix(in srgb, ${baseAccent} 75%, #475569)`;
    primarySoft = `color-mix(in srgb, var(--accent) 10%, transparent)`;
    accent2 = `color-mix(in srgb, var(--accent) 75%, transparent)`;
    gold = `color-mix(in srgb, ${secondaryColor} 40%, #64748b)`;
  }

  // Density paddings
  let sectionPadding = "30px";
  let cardPadding = "20px";
  let btnPadding = "13px 20px";
  let filterGap = "30px";
  if (state.density === "Compact") {
    sectionPadding = "20px";
    cardPadding = "10px";
    btnPadding = "9px 15px";
    filterGap = "20px";
  } else if (state.density === "Spacious") {
    sectionPadding = "40px";
    cardPadding = "30px";
    btnPadding = "16px 28px";
    filterGap = "40px";
  }

  // Radius values
  let radXl = "30px";
  let radLg = "20px";
  let radMd = "10px";
  let radBtn = "13px";
  let radPill = "13px";
  if (state.shape === "Sharp") {
    radXl = "3px";
    radLg = "3px";
    radMd = "3px";
    radBtn = "3px";
    radPill = "3px";
  } else if (state.shape === "Round") {
    radXl = "40px";
    radLg = "30px";
    radMd = "20px";
    radBtn = "50px";
    radPill = "50px";
  }

  let cardToThumbPadding = "15px";
  if (state.density === "Compact") cardToThumbPadding = "5px";
  else if (state.density === "Spacious") cardToThumbPadding = "25px";

  // If card thumbnail style is full-bleed, padding is 0
  if (state.cardThumbnailStyle === "full-bleed") {
    cardToThumbPadding = "0px";
  }

  const cardToContentPadding = cardPadding;
  let thumbnailBottomMargin = "17px";
  if (state.density === "Compact") thumbnailBottomMargin = "15px";
  else if (state.density === "Spacious") thumbnailBottomMargin = "19px";

  let cardContentMinPadding = "20px";
  if (state.density === "Compact") cardContentMinPadding = "15px";
  else if (state.density === "Spacious") cardContentMinPadding = "25px";

  let cardContentPadding = "20px"; // Comfortable
  if (state.density === "Compact") cardContentPadding = "15px";
  else if (state.density === "Spacious") cardContentPadding = "25px";

  // Apply card padding overrides if set
  const paddingOverride = state.cardPaddingOverride || "medium";
  if (paddingOverride === "small") {
    if (state.cardThumbnailStyle !== "full-bleed") cardToThumbPadding = "10px";
    cardContentPadding = "15px";
  } else if (paddingOverride === "medium") {
    if (state.cardThumbnailStyle !== "full-bleed") cardToThumbPadding = "15px";
    cardContentPadding = "20px";
  } else if (paddingOverride === "big") {
    if (state.cardThumbnailStyle !== "full-bleed") cardToThumbPadding = "20px";
    cardContentPadding = "25px";
  } else if (paddingOverride === "large") {
    if (state.cardThumbnailStyle !== "full-bleed") cardToThumbPadding = "25px";
    cardContentPadding = "30px";
  }
  cardContentMinPadding = cardContentPadding;

  let cardGridGap = "22px"; // Comfortable
  if (state.density === "Compact") cardGridGap = "15px";
  else if (state.density === "Spacious") cardGridGap = "30px";

  let eventsSeparatorMargin = "25px"; // Comfortable
  if (state.density === "Compact") eventsSeparatorMargin = "15px";
  else if (state.density === "Spacious") eventsSeparatorMargin = "30px";

  // Override grid gap if set explicitly
  const gridGapOverride = state.cardGridGapOverride || "medium";
  if (gridGapOverride === "small") cardGridGap = "25px";
  else if (gridGapOverride === "medium") cardGridGap = "35px";
  else if (gridGapOverride === "big") cardGridGap = "40px";
  else if (gridGapOverride === "large") cardGridGap = "45px";

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

  // Page background and soft backgrounds follow style & accents
  let bgGradient = "none";
  let siteBg = "";
  let siteSoft = "";
  let textMain = "";
  let textMuted = "";
  let siteBorder = dark ? "rgba(255,255,255,.1)" : "rgba(29,24,18,.12)";

  if (state.style === "Soft") {
    siteBg = dark 
      ? "color-mix(in srgb, var(--primary) 8%, #111827)" 
      : "color-mix(in srgb, var(--primary) 6%, #ffffff)";
    siteSoft = dark 
      ? "color-mix(in srgb, var(--primary) 12%, #1f2937)" 
      : "color-mix(in srgb, var(--primary) 4%, #ffffff)";
    textMain = dark ? "#e4e4e7" : "#27272a";
    textMuted = dark ? "#a1a1aa" : "#71717a";
  } else if (state.style === "Vibrant") {
    siteBg = dark ? "#000000" : "#ffffff";
    siteSoft = dark 
      ? "color-mix(in srgb, var(--primary) 10%, #1c1c1e)" 
      : "#ffffff";
    textMain = dark ? "#ffffff" : "#000000";
    textMuted = dark ? "#cbd5e1" : "#4b5563";
  } else if (state.style === "Rich") {
    siteBg = dark 
      ? "color-mix(in srgb, var(--primary) 12%, #000000)" 
      : "color-mix(in srgb, var(--primary) 8%, #ffffff)";
    siteSoft = dark 
      ? "color-mix(in srgb, var(--primary) 16%, #0d0f12)" 
      : "color-mix(in srgb, var(--primary) 12%, #ffffff)";
    textMain = dark ? "#f8fafc" : "#1d1812";
    textMuted = dark ? "#cbd5e1" : "#74685e";
  } else { // Elegant
    siteBg = dark ? "#090d16" : "#ffffff";
    siteSoft = dark 
      ? "color-mix(in srgb, var(--primary) 6%, #1e293b)" 
      : "#f8fafc";
    textMain = dark ? "#f1f5f9" : "#1e293b";
    textMuted = dark ? "#94a3b8" : "#475467";
  }

  // Aura atmospheres
  if (state.atmosphere === "Warm") {
    siteBg = dark 
      ? "color-mix(in srgb, var(--primary) 8%, #1f140e)" 
      : "color-mix(in srgb, var(--primary) 4%, #fffaf3)";
    siteSoft = dark 
      ? "color-mix(in srgb, var(--primary) 12%, #2d1f18)" 
      : "color-mix(in srgb, var(--primary) 8%, #f6efe6)";
    bgGradient = `linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, #fff7ed), var(--bg) 60%)`;
  } else if (state.atmosphere === "Worship") {
    siteBg = dark 
      ? "color-mix(in srgb, var(--primary) 5%, #05080f)" 
      : "color-mix(in srgb, var(--primary) 6%, #1c1826)";
    siteSoft = dark 
      ? "color-mix(in srgb, var(--primary) 9%, #0c111c)" 
      : "color-mix(in srgb, var(--primary) 10%, #292436)";
    textMain = "#f8fafc";
    textMuted = "#cbd5e1";
    bgGradient = `radial-gradient(circle at 50% 20%, color-mix(in srgb, var(--primary) 20%, transparent), transparent 70%), linear-gradient(180deg, var(--bg), #020408)`;
  } else if (state.atmosphere === "Prayer") {
    siteBg = dark 
      ? "color-mix(in srgb, var(--primary) 4%, #121824)" 
      : "color-mix(in srgb, var(--primary) 2%, #fcfbf9)";
    siteSoft = dark 
      ? "color-mix(in srgb, var(--primary) 8%, #0b0f19)" 
      : "color-mix(in srgb, var(--primary) 4%, #f4f2ee)";
    bgGradient = `linear-gradient(90deg, color-mix(in srgb, var(--primary) 2%, #fcfbf9) 0%, var(--bg) 50%, color-mix(in srgb, var(--primary) 2%, #fcfbf9) 100%)`;
  } else if (state.atmosphere === "Celebration") {
    bgGradient = `radial-gradient(circle at 10% 20%, color-mix(in srgb, var(--primary) 16%, transparent), transparent 45%), radial-gradient(circle at 90% 80%, color-mix(in srgb, var(--gold) 12%, transparent), transparent 55%)`;
  } else if (state.atmosphere === "Elegant") {
    siteBg = dark 
      ? "color-mix(in srgb, var(--primary) 3%, #0d1117)" 
      : "#ffffff";
    siteSoft = dark 
      ? "color-mix(in srgb, var(--primary) 6%, #161b22)" 
      : "#f8fafc";
  } else if (state.atmosphere === "Light") {
    bgGradient = "none";
  }

  // Base body background with glows depending on Style
  let bodyBg = "var(--bg)";
  if (state.style === "Soft") {
    bodyBg = `radial-gradient(circle at 16% -8%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 30%), radial-gradient(circle at 84% 2%, color-mix(in srgb, var(--gold) 6%, transparent), transparent 26%), var(--bg)`;
  } else if (state.style === "Vibrant") {
    bodyBg = dark 
      ? `linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, #000000) 0%, #000000 100%)`
      : `linear-gradient(135deg, color-mix(in srgb, var(--accent) 7%, #ffffff) 0%, #ffffff 100%)`;
  } else { // Rich and Elegant
    bodyBg = "var(--bg)";
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

  // Compute header font size and button paddings based on headerFontSize setting
  const headerFontSizeSetting = state.headerFontSize || 'medium';
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

  // Compute header font weight based on headerFontWeight setting (thin, normal, semi-bold, bold)
  const headerFontWeightSetting = state.headerFontWeight || 'bold';
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


  return `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  /* Customizer Variables */
  --primary: ${primary};
  --primary-soft: ${primarySoft};
  --header-nav-size: ${navSize};
  --header-btn-size: ${btnSize};
  --header-btn-padding: ${btnPaddingVal};
  --header-nav-weight: ${navWeight};
  --header-btn-weight: ${btnWeight};
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
  --accent-2: ${accent2};
  --gold: ${gold};
  --bg: ${siteBg};
  --surface: ${cardBg};
  --surface-soft: ${siteSoft};
  --soft: ${siteSoft};
  --text: ${textMain};
  --muted: ${textMuted};
  --border: ${siteBorder};
  --radius-xl: ${radXl};
  --radius-lg: ${radLg};
  --radius-md: ${radMd};
  --radius-btn: ${radBtn};
  --radius-pill: ${radPill};
  --xl: ${radXl};
  --lg: ${radLg};
  --shadow: ${shadow};
  --soft-shadow: ${softShadow};
  --section: ${sectionPadding};
  --card-to-thumb-padding: ${cardToThumbPadding};
  --card-to-content-padding: ${cardToContentPadding};
  --card-content-padding: ${cardContentPadding};
  --card-grid-gap: ${cardGridGap};
  --thumbnail-bottom-margin: ${thumbnailBottomMargin};
  --card-content-min-padding: ${cardContentMinPadding};
  --events-separator-margin: ${eventsSeparatorMargin};

  /* Header following accents */
  --header-bg: color-mix(in srgb, var(--primary) 4%, var(--bg));
  --header-border: color-mix(in srgb, var(--primary) 12%, ${dark ? "rgba(255,255,255,0.08)" : "rgba(29,24,18,0.12)"});
  --header-bg-glass: color-mix(in srgb, var(--primary) 8%, ${dark ? "rgba(11, 17, 32, 0.75)" : "rgba(251, 249, 246, 0.78)"});
  --header-text: var(--text);
  --active-header-border-width: ${state.headerBorderSize === 'small' ? '1' : state.headerBorderSize === 'medium' ? '3' : state.headerBorderSize === 'large' ? '7' : (state.headerBorderSize || '1')}px;
  --active-header-border-color: ${state.headerBorderColor === 'white' ? '#ffffff' : 'var(--primary)'};

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
  overflow-x: clip;
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

body, .shell-wrapper {
  background: ${bgGradient === "none" ? bodyBg : bgGradient} !important;
  background-attachment: fixed !important;
}

body {
  width: 100%;
  max-width: 100%;
  overflow-x: clip;
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

.card, .feature-card, .sermon-card, .event-card, .ministry-card, .person-card, .contact-card, .form-card, .group-card, .product-card, .checkout-card, .order-card, .post, .blog-card, .blog-post-card, .article-card, .author-card, .video-card, .media-card, .product-item, .cell-card, .course-card, .course-main-card, .lesson-card, .lesson-single-card, .service-card, .mini-card, .audio-card, .audio-episode, .podcast-card, .podcast-episode, .episode-card, .resource-card, .library-card, .location-card, .panel, .solutions-card, .help-card {
  background: var(--surface) !important;
  border: ${borderStyle} !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--soft-shadow) !important;
  backdrop-filter: ${backdropFilter} !important;
  -webkit-backdrop-filter: ${backdropFilter} !important;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease !important;
  overflow: hidden !important;
  transform: translateZ(0) !important;
  backface-visibility: hidden !important;
  isolation: isolate !important;
  will-change: transform !important;
}

.card img, .sermon-card img, .event-card img, .product-thumb img, .postimg, .blog-card img, .course-card img, .lesson-card img {
  transition: transform 0.4s ease, border-radius 0.25s ease !important;
}

.card, .feature-card, .contact-card, .form-card, .page-hero-inner, .hero-copy, .prayer-box, .testimony-box, .checkout-card, .order-card, .solutions-card, .help-card {
  padding: ${cardPadding} !important;
}

/* Card layout configurations from customizer settings */
.product-card, .course-card, .course, .lesson-card, .sermon-card, .event-card, .blog-card, .post, .group-card, .media-card, .related-card {
  padding: 0 !important;
}
.product-thumb, .card-thumb, .postimg, .course-cover, .media-visual, .episode-cover {
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
  display: flex !important;
  position: relative !important;
  align-items: center !important;
  justify-content: center !important;
  isolation: isolate !important;
  will-change: transform !important;
}
/* img inside a grid container defaults to centered/natural-size — force stretch to fill */
.product-thumb img,
.card-thumb img,
.postimg img,
.course-cover img,
.media-visual img,
.episode-cover img,
.event-img img,
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
.product-thumb, .card-thumb, .postimg, .course-cover, .media-visual, .episode-cover, .event-img, .cover, .thumb,
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

/* Card Hover Animation Styles */
${state.cardHoverEffect === 'lift' ? `
.card:hover, .post:hover, .episode:hover, .course:hover, .resource:hover, .media-card:hover, .event-card:hover, .group-card:hover, .product-card:hover, .service-card:hover, .testimony-card:hover, .feature-card:hover, .solutions-card:hover, .help-card:hover {
  transform: translateY(-6px) !important;
  box-shadow: var(--shadow) !important;
}
` : ''}

${state.cardHoverEffect === 'grow' ? `
.card:hover, .post:hover, .episode:hover, .course:hover, .resource:hover, .media-card:hover, .event-card:hover, .group-card:hover, .product-card:hover, .service-card:hover, .testimony-card:hover, .feature-card:hover, .solutions-card:hover, .help-card:hover {
  transform: scale(1.03) !important;
}
` : ''}

${state.cardHoverEffect === 'shadow' ? `
.card:hover, .post:hover, .episode:hover, .course:hover, .resource:hover, .media-card:hover, .event-card:hover, .group-card:hover, .product-card:hover, .service-card:hover, .testimony-card:hover, .feature-card:hover, .solutions-card:hover, .help-card:hover {
  box-shadow: 0 16px 38px color-mix(in srgb, var(--primary) 22%, ${dark ? "rgba(0,0,0,0.6)" : "rgba(15,23,42,0.18)"}) !important;
}
` : ''}

${state.cardHoverEffect === 'zoom' ? `
.card:hover img, .post:hover img, .episode:hover img, .course:hover img, .resource:hover img, .media-card:hover img, .event-card:hover img, .group-card:hover img, .product-card:hover img, .service-card:hover img, .testimony-card:hover img, .feature-card:hover img, .solutions-card:hover img, .help-card:hover img {
  transform: scale(1.06) !important;
}
` : ''}

${state.cardHoverEffect === 'glow' ? `
.card:hover, .post:hover, .episode:hover, .course:hover, .resource:hover, .media-card:hover, .event-card:hover, .group-card:hover, .product-card:hover, .service-card:hover, .testimony-card:hover, .feature-card:hover, .solutions-card:hover, .help-card:hover {
  border-color: var(--accent) !important;
  box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 24%, transparent) !important;
}
` : ''}

${state.cardHoverEffect === 'none' ? `
.card:hover, .post:hover, .episode:hover, .course:hover, .resource:hover, .media-card:hover, .event-card:hover, .group-card:hover, .product-card:hover, .service-card:hover, .testimony-card:hover, .feature-card:hover, .solutions-card:hover, .help-card:hover {
  transform: none !important;
  box-shadow: var(--soft-shadow) !important;
}
` : ''}

/* Card inner image rounding based on padded vs full-bleed style */
${state.cardThumbnailStyle === 'padded' ? `
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

.section[style*="padding-top: 0"], .section[style*="padding-top:0"] {
  padding-top: 0 !important;
}

.btn, .button {
  border-radius: var(--radius-md) !important;
  padding: ${btnPadding} !important;
}

/* Responsive Button and Icon Overrides to follow Accents dynamically */
/* Legacy shape overrides for archive and single page elements */
.btn, .badge, .pill, .eyebrow, .emailbox input, .toast, .mini-play, .date-chip, .iconbtn, .search, .select, .input, .fileicon, .down-icon, .sticky-icon, .check span, .radio span, .filtertop .select, .chat-box input, .chat-box button, .meeting-chat-input input, .meeting-chat-input button, .comment-form input, .menu, .language-list span, .tags span, .tag {
  border-radius: var(--radius-pill) !important;
}

.feature-media, .hero-feature, .event-feature, .single-media, .course-feature, .feature-shelf, .preview-cover, .article-card, .author-card, .register-card, .ticket-card, .panel, .rich, .dashboard-card, .impact, .hero-copy, .meeting-chat-box, .cover-art {
  border-radius: var(--radius-xl) !important;
}

.type-tab, .cat, .channel-tab, .channel, .channel-mini, .resource, .event-card, .post, .media-card, .course-card, .comment-card, .chat-item, .comment, textarea, .comment-form textarea, .detail-grid div, .stats div, .progress-list div, .platform-list button {
  border-radius: var(--radius-lg) !important;
}

.mark, .brand-mark, .avatar, .quick-list div, .author-mini, .chapter, .schedule-row, .ticket-type, .day, .panel-tab, .worship-tab-btn, .mobile-tab-item {
  border-radius: var(--radius-md) !important;
}

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

footer, .footer {
  transition: all var(--duration) var(--ease);
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
}

@media(max-width:760px) {
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
/* Header Font Size & Weight customizer settings */
header .nav a, .header .nav a, header .nav-link-item, .header .nav-link-item, header .nav-more-btn, .header .nav-more-btn {
  font-size: var(--header-nav-size) !important;
  font-weight: var(--header-nav-weight) !important;
}
header .btn, .header .btn, header .button, .header .button {
  font-size: var(--header-btn-size) !important;
  font-weight: var(--header-btn-weight) !important;
  padding: var(--header-btn-padding) !important;
}

/* Solid Themed Header Overrides */
header[data-header-solid-themed="true"], .header[data-header-solid-themed="true"] {
  background: var(--primary) !important;
  color: #ffffff !important;
  --header-bg: var(--primary) !important;
  --header-text: #ffffff !important;
  --header-border: rgba(255, 255, 255, 0.15) !important;
  --active-header-border-color: #ffffff !important;
}

/* Base text/icons/links contrast inside header */
header[data-header-solid-themed="true"] a, .header[data-header-solid-themed="true"] a,
header[data-header-solid-themed="true"] .nav a, .header[data-header-solid-themed="true"] .nav a,
header[data-header-solid-themed="true"] svg, .header[data-header-solid-themed="true"] svg,
header[data-header-solid-themed="true"] i, .header[data-header-solid-themed="true"] i {
  color: #ffffff !important;
}

header[data-header-solid-themed="true"] .nav a, .header[data-header-solid-themed="true"] .nav a {
  color: rgba(255, 255, 255, 0.8) !important;
}
header[data-header-solid-themed="true"] .nav a:hover, header[data-header-solid-themed="true"] .nav a.active,
.header[data-header-solid-themed="true"] .nav a:hover, .header[data-header-solid-themed="true"] .nav a.active {
  color: #ffffff !important;
}

/* Brand styling */
header[data-header-solid-themed="true"] .brand, .header[data-header-solid-themed="true"] .brand,
header[data-header-solid-themed="true"] .brand span, .header[data-header-solid-themed="true"] .brand span {
  color: #ffffff !important;
}
header[data-header-solid-themed="true"] .brand-mark, .header[data-header-solid-themed="true"] .brand-mark,
header[data-header-solid-themed="true"] .brand .mark, .header[data-header-solid-themed="true"] .brand .mark {
  background: #ffffff !important;
  color: var(--primary) !important;
  box-shadow: none !important;
}
header[data-header-solid-themed="true"] .brand-mark i, .header[data-header-solid-themed="true"] .brand-mark i,
header[data-header-solid-themed="true"] .brand-mark svg, .header[data-header-solid-themed="true"] .brand-mark svg,
header[data-header-solid-themed="true"] .brand .mark i, .header[data-header-solid-themed="true"] .brand .mark i,
header[data-header-solid-themed="true"] .brand .mark svg, .header[data-header-solid-themed="true"] .brand .mark svg {
  color: var(--primary) !important;
  stroke: var(--primary) !important;
  fill: none !important;
}

/* Icons (without background shapes) */
header[data-header-solid-themed="true"] a svg, .header[data-header-solid-themed="true"] a svg,
header[data-header-solid-themed="true"] a i, .header[data-header-solid-themed="true"] a i {
  color: #ffffff !important;
  stroke: #ffffff !important;
}

/* Primary buttons styling */
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

/* Soft buttons styling */
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

/* Light buttons styling */
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

/* Mobile menu hamburger button styling */
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

/* plain hamburger shape overrides */
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

function getLucideIconForMenuLabel(label: string): string {
  const lbl = label.toLowerCase();
  if (lbl.includes('media')) return 'tv';
  if (lbl.includes('live')) return 'video';
  if (lbl.includes('podcast')) return 'mic';
  if (lbl.includes('article') || lbl.includes('blog')) return 'newspaper';
  if (lbl.includes('service') || lbl.includes('connect')) return 'calendar';
  if (lbl.includes('library') || lbl.includes('resource')) return 'book-open';
  if (lbl.includes('lms') || lbl.includes('course')) return 'graduation-cap';
  if (lbl.includes('worship') || lbl.includes('study')) return 'music';
  if (lbl.includes('fellowship') || lbl.includes('cell')) return 'users';
  if (lbl.includes('store') || lbl.includes('giving')) return 'shopping-bag';
  if (lbl.includes('devortion') || lbl.includes('prayer')) return 'heart';
  return 'link';
}

export function applyThemeStructure(doc: Document, state: ThemeState, navigationMenus?: any[], themeFolder?: string): void {
  // Inject base URL so relative assets (like styles.css) resolve correctly to the theme folder
  let baseEl = doc.querySelector("base");
  const folder = themeFolder || "ecclesia-full-theme";
  if (!baseEl) {
    baseEl = doc.createElement("base");
    baseEl.setAttribute("href", `/themes/${folder}/`);
    doc.head.insertBefore(baseEl, doc.head.firstChild);
  } else {
    baseEl.setAttribute("href", `/themes/${folder}/`);
  }

  // Cache bust all stylesheets so the preview always loads the latest CSS
  const timestamp = Date.now();
  doc.querySelectorAll("link[rel='stylesheet']").forEach(link => {
    const href = link.getAttribute("href");
    if (href && !href.startsWith("http")) {
      const sep = href.includes("?") ? "&" : "?";
      link.setAttribute("href", `${href}${sep}t=${timestamp}`);
    }
  });

  const body = doc.body;
  if (body) {
    body.classList.add("ec-preview");
    // The theme stylesheet hides pages until the runtime marks them loaded.
    // Preview HTML should remain visible even when a template script fails.
    body.classList.add("shell-loaded");
    const mainDrawerSide = state.mobileMenuFlip 
      ? (state.mobileMenuPosition === 'left' ? 'right' : 'left')
      : state.mobileMenuPosition;
    const railDrawerSide = state.mobileMenuFlip 
      ? state.mobileMenuPosition
      : (state.mobileMenuPosition === 'left' ? 'right' : 'left');

    body.setAttribute("data-mobile-menu-position", state.mobileMenuPosition);
    body.setAttribute("data-mobile-menu-flip", String(!!state.mobileMenuFlip));
    body.setAttribute("data-mobile-drawer-side", mainDrawerSide);
    body.setAttribute("data-mobile-rail-side", railDrawerSide);
    body.setAttribute("data-mobile-rail-vertical-align", state.mobileRailVerticalAlign || "center");
    body.setAttribute("data-mobile-logo-align", state.mobileLogoAlign || "center");
    body.setAttribute("data-mobile-drawer-mode", state.mobileDrawerMode);
    body.setAttribute("data-mobile-drawer-buttons-full-width", String(state.mobileDrawerButtonsFullWidth));
    body.setAttribute("data-mobile-drawer-combine", String(!!state.mobileDrawerCombine));
    body.setAttribute("data-mobile-drawer-rail-position", state.mobileDrawerRailPosition || "right");
    body.setAttribute("data-rail-position", state.railPosition || "left");
    body.setAttribute("data-rail-show-icons", String(state.railShowIcons !== false));
    body.setAttribute("data-rail-style", state.railStyle || "full");
    body.setAttribute("data-rail-shadow", String(state.railShadow || false));
    body.setAttribute("data-rail-shadow-intensity", state.railShadowIntensity || "medium");
    body.setAttribute("data-rail-shadow-themed", String(state.railShadowThemed || false));
    body.setAttribute("data-rail-solid-themed", String(state.railSolidThemed || false));
    body.setAttribute("data-rail-border", String(state.railBorder || false));
    body.setAttribute("data-rail-border-size", state.railBorderSize || "small");
    body.setAttribute("data-rail-border-color", state.railBorderColor || "standard");
    body.setAttribute("data-rail-vertical-align", state.railVerticalAlign || "center");
    body.setAttribute("data-rail-font-size", state.railFontSize || "medium");
    body.setAttribute("data-rail-font-weight", state.railFontWeight || "bold");
  }

  const header = doc.querySelector("header, [data-editor-type='header']");
  if (header) {
    header.setAttribute("data-editor-type", "header");
    header.setAttribute("data-editor-label", "Header");
    header.setAttribute("data-header-style", state.headerStyle);
    header.setAttribute("data-header-content", state.headerContentBoxed ? "boxed" : "full");
    header.setAttribute("data-header-look", state.headerLook);
    header.setAttribute("data-header-shadow", String(state.headerShadow));
    header.setAttribute("data-header-shadow-intensity", state.headerShadowIntensity || "medium");
    header.setAttribute("data-header-shadow-themed", String(!!state.headerShadowThemed));
    header.setAttribute("data-header-solid-themed", String(!!state.headerSolidThemed));
    header.setAttribute("data-header-border", String(state.headerBorder));
    header.setAttribute("data-header-border-size", state.headerBorderSize);
    header.setAttribute("data-header-border-color", state.headerBorderColor);
    header.setAttribute("data-header-layout", state.headerLayout);
    header.setAttribute("data-header-effect", state.headerEffect);
    header.setAttribute("data-header-font-size", state.headerFontSize || "medium");
    header.setAttribute("data-header-font-weight", state.headerFontWeight || "bold");
    header.setAttribute("data-mobile-menu-position", state.mobileMenuPosition);
    header.setAttribute("data-mobile-logo-align", state.mobileLogoAlign || "center");
    header.setAttribute("data-mobile-hamburger-shape", state.mobileHamburgerShape);

    // Rebuild the header links
    const headerNav = doc.querySelector("header nav, .header nav");
    if (headerNav && navigationMenus) {
      const headerMenu = navigationMenus.find(m => m.name.toLowerCase() === 'header menu');
      if (headerMenu) {
        const items = typeof headerMenu.items === 'string' ? JSON.parse(headerMenu.items) : (headerMenu.items || []);
        headerNav.innerHTML = "";
        items.forEach((item: any) => {
          const a = doc.createElement("a");
          a.setAttribute("href", item.url === "/" ? "index.html" : item.url.replace(/^\//, ""));
          a.setAttribute("data-editor-type", "button");
          a.innerText = item.label;
          headerNav.appendChild(a);
        });
      }
    }

    // Rebuild the account icon
    const headerActions = header.querySelector(".header-actions");
    if (headerActions) {
      let accountWrapper = headerActions.querySelector(".header-account-dropdown");
      if (!accountWrapper) {
        accountWrapper = doc.createElement("div");
        accountWrapper.className = "nav-more-dropdown header-account-dropdown";
        const existingAccountLink = headerActions.querySelector(".member-account-icon-only-link");
        if (existingAccountLink) {
          existingAccountLink.id = "accountBtn";
          existingAccountLink.setAttribute("data-editor-type", "button");
          accountWrapper.appendChild(existingAccountLink);
        } else {
          accountWrapper.innerHTML = `
            <a class="member-account-icon-only-link" id="accountBtn" href="login.html" title="Account" data-editor-type="button">
              <i data-lucide="user-circle"></i>
            </a>
          `;
        }
        const accountMenu = doc.createElement("div");
        accountMenu.className = "nav-more-menu account-dropdown-menu";
        accountMenu.setAttribute("style", "display: none;");
        accountMenu.innerHTML = `
          <a class="nav-more-item" href="login.html">Login</a>
          <a class="nav-more-item" href="login.html">Register</a>
        `;
        accountWrapper.appendChild(accountMenu);
        const menuBtn = headerActions.querySelector("#menuBtn");
        if (menuBtn && menuBtn.parentElement === headerActions) {
          headerActions.insertBefore(accountWrapper, menuBtn);
        } else {
          headerActions.appendChild(accountWrapper);
        }
      }
    }

    // Ensure Left Hamburger and Right Kebab button layout
    const navWrap = header.querySelector(".nav-wrap") || header.querySelector(".navwrap");
    if (navWrap) {
      let leftHam = navWrap.querySelector("#menuBtn") || navWrap.querySelector(".mobilebtn") || navWrap.querySelector(".menu");
      if (!leftHam) {
        leftHam = doc.createElement("button");
        leftHam.className = "mobile-menu-btn mobile-hamburger-btn";
        leftHam.id = "menuBtn";
        leftHam.setAttribute("aria-label", "Open Main Menu");
        leftHam.innerHTML = `<i data-lucide="menu"></i>`;
        navWrap.insertBefore(leftHam, navWrap.firstChild);
      } else {
        leftHam.id = "menuBtn";
        leftHam.className = "mobile-menu-btn mobile-hamburger-btn";
        leftHam.setAttribute("aria-label", "Open Main Menu");
      }
      
      const headerActions = header.querySelector(".header-actions") || header.querySelector(".actions");
      if (headerActions) {
        let rightKebab = headerActions.querySelector("#kebabBtn");
        if (state.mobileDrawerCombine) {
          if (rightKebab) rightKebab.remove();
        } else {
          if (!rightKebab) {
            rightKebab = doc.createElement("button");
            rightKebab.className = "mobile-menu-btn mobile-kebab-btn";
            rightKebab.id = "kebabBtn";
            rightKebab.setAttribute("aria-label", "Open Rail Menu");
            rightKebab.innerHTML = `<i data-lucide="more-vertical"></i>`;
            headerActions.appendChild(rightKebab);
          } else {
            rightKebab.setAttribute("aria-label", "Open Rail Menu");
            rightKebab.className = "mobile-menu-btn mobile-kebab-btn";
          }
        }
        const oldMenuBtn = headerActions.querySelector("#menuBtn") || headerActions.querySelector(".mobilebtn") || headerActions.querySelector(".menu") || headerActions.querySelector(".mobile-menu-btn:not(#kebabBtn)");
        if (oldMenuBtn) {
          oldMenuBtn.remove();
        }
      }
    }
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
    footer.setAttribute("data-footer-columns", String(state.footerColumns || 4));

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

    // Rebuild footer columns
    const footerGrid = footer.querySelector(".footer-grid");
    if (footerGrid && navigationMenus) {
      const children = Array.from(footerGrid.children);
      const brandBlock = children[0] ? children[0].outerHTML : `
        <div>
          <a href="index.html" class="brand" style="color:white;"><span class="brand-mark"><i data-lucide="church"></i></span><span>Grace City Church</span></a>
          <p style="margin-top:18px;max-width:340px;">A Spirit-filled church helping people encounter Jesus, grow in the Word, build strong families, and serve their city.</p>
          <div class="socials">
            <a href="#"><i data-lucide="facebook"></i></a><a href="#"><i data-lucide="youtube"></i></a><a href="#"><i data-lucide="instagram"></i></a>
          </div>
        </div>
      `;

      const serviceTimesBlock = children[children.length - 1] ? children[children.length - 1].outerHTML : `
        <div><h4>Service Times</h4><p>Sunday Worship<br />9:30 AM</p><p>Midweek Word & Prayer<br />Wednesday 7:00 PM</p></div>
      `;

      let menu1Html = "";
      const f1Menu = navigationMenus.find(m => m.name.toLowerCase() === 'footer menu 1');
      if (f1Menu) {
        const items = typeof f1Menu.items === 'string' ? JSON.parse(f1Menu.items) : (f1Menu.items || []);
        menu1Html = `<div><h4>Explore</h4>${items.map((it: any) => `<a href="${it.url === "/" ? "index.html" : it.url.replace(/^\//, "")}">${it.label}</a>`).join("")}</div>`;
      }

      let menu2Html = "";
      const f2Menu = navigationMenus.find(m => m.name.toLowerCase() === 'footer menu 2');
      if (f2Menu) {
        const items = typeof f2Menu.items === 'string' ? JSON.parse(f2Menu.items) : (f2Menu.items || []);
        menu2Html = `<div><h4>Connect</h4>${items.map((it: any) => `<a href="${it.url === "/" ? "index.html" : it.url.replace(/^\//, "")}">${it.label}</a>`).join("")}</div>`;
      }

      let menu3Html = "";
      const f3Menu = navigationMenus.find(m => m.name.toLowerCase() === 'footer menu 3');
      const footerColsCount = state.footerColumns || 4;
      if (footerColsCount === 5 && f3Menu) {
        const items = typeof f3Menu.items === 'string' ? JSON.parse(f3Menu.items) : (f3Menu.items || []);
        menu3Html = `<div><h4>Resources</h4>${items.map((it: any) => `<a href="${it.url === "/" ? "index.html" : it.url.replace(/^\//, "")}">${it.label}</a>`).join("")}</div>`;
      }

      if (footerColsCount === 5) {
        footerGrid.setAttribute("style", "grid-template-columns: 1.25fr 1fr 1fr 1fr 1.25fr;");
      } else {
        footerGrid.removeAttribute("style");
      }

      footerGrid.innerHTML = `${brandBlock}${menu1Html}${menu2Html}${menu3Html}${serviceTimesBlock}`;
    }
  }

  // Rebuild mobile drawer links and inject mobile rail drawer
  const mobileDrawer = doc.querySelector("#mobileDrawer, .mobile-drawer");
  if (mobileDrawer) {
    if (state.mobileDrawerCombine) {
      mobileDrawer.setAttribute("data-mobile-drawer-combine", "true");
      mobileDrawer.setAttribute("data-mobile-drawer-rail-position", state.mobileDrawerRailPosition || "right");
      
      const mobileRailMenu = navigationMenus?.find(m => m.name.toLowerCase() === 'mobile rail navigation');
      const railItems = mobileRailMenu ? (typeof mobileRailMenu.items === 'string' ? JSON.parse(mobileRailMenu.items) : (mobileRailMenu.items || [])) : [];
      let railHtml = `<div class="drawer-rail-col"><nav class="rail-nav">`;
      railItems.forEach((item: any) => {
        const icon = getLucideIconForMenuLabel(item.label);
        railHtml += `
          <a class="rail-item pjax-link" href="${item.url === "/" ? "index.html" : item.url.replace(/^\//, "")}" data-page="${item.url}">
            <i data-lucide="${icon}"></i>
            <span>${item.label}</span>
          </a>
        `;
      });
      railHtml += `</nav></div>`;

      const drawerMenu = navigationMenus?.find(m => m.name.toLowerCase() === 'main mobile drawer menu');
      const mainItems = drawerMenu ? (typeof drawerMenu.items === 'string' ? JSON.parse(drawerMenu.items) : (drawerMenu.items || [])) : [];
      let mainHtml = `<div class="drawer-main-col">
        <div class="drawer-close-row">
          <button class="drawer-close" id="closeDrawer" aria-label="Close menu">
            <i data-lucide="x"></i>
          </button>
        </div>
        <nav class="drawer-nav">`;
      mainItems.forEach((item: any) => {
        const icon = getLucideIconForMenuLabel(item.label);
        mainHtml += `
          <a class="pjax-link" href="${item.url === "/" ? "index.html" : item.url.replace(/^\//, "")}">
            <i data-lucide="${icon}"></i> ${item.label}
          </a>
        `;
      });
      mainHtml += `</nav>
        <div class="drawer-actions">
          <a href="livestream-page.html" class="btn btn-light btn-full pjax-link">
            <i data-lucide="radio"></i>
            Watch Live
          </a>
          <a href="contact.html" class="btn btn-primary btn-full pjax-link">
            <i data-lucide="map-pin"></i>
            Plan Visit
          </a>
        </div>
      </div>`;

      mobileDrawer.innerHTML = `<div class="drawer-combined-wrap">${railHtml}${mainHtml}</div>`;
      
      // Remove standalone rail drawer if present
      doc.getElementById("mobileRailDrawer")?.remove();
      doc.querySelector(".rail-drawer-backdrop")?.remove();
    } else {
      mobileDrawer.setAttribute("data-mobile-drawer-combine", "false");
      mobileDrawer.removeAttribute("data-mobile-drawer-rail-position");
      
      mobileDrawer.innerHTML = `
        <div class="drawer-close-row">
          <button class="drawer-close" id="closeDrawer" aria-label="Close menu">
            <i data-lucide="x"></i>
          </button>
        </div>
        <nav class="drawer-nav"></nav>
        <div class="drawer-actions">
          <a href="livestream-page.html" class="btn btn-light btn-full pjax-link">
            <i data-lucide="radio"></i>
            Watch Live
          </a>
          <a href="contact.html" class="btn btn-primary btn-full pjax-link">
            <i data-lucide="map-pin"></i>
            Plan Visit
          </a>
        </div>
      `;

      const drawerNav = mobileDrawer.querySelector(".drawer-nav");
      if (drawerNav && navigationMenus) {
        const drawerMenu = navigationMenus.find(m => m.name.toLowerCase() === 'main mobile drawer menu');
        if (drawerMenu) {
          const items = typeof drawerMenu.items === 'string' ? JSON.parse(drawerMenu.items) : (drawerMenu.items || []);
          items.forEach((item: any) => {
            const icon = getLucideIconForMenuLabel(item.label);
            const a = doc.createElement("a");
            a.className = "pjax-link";
            a.setAttribute("href", item.url === "/" ? "index.html" : item.url.replace(/^\//, ""));
            a.innerHTML = `<i data-lucide="${icon}"></i> ${item.label}`;
            drawerNav.appendChild(a);
          });
        }
      }

      // Inject Standalone Mobile Rail Drawer and backdrop
      let mobileRailDrawer = doc.getElementById("mobileRailDrawer");
      if (!mobileRailDrawer) {
        mobileRailDrawer = doc.createElement("aside");
        mobileRailDrawer.setAttribute("class", "mobile-rail-drawer");
        mobileRailDrawer.setAttribute("id", "mobileRailDrawer");
        mobileRailDrawer.setAttribute("aria-hidden", "true");
        doc.body.appendChild(mobileRailDrawer);

        const backdrop = doc.createElement("div");
        backdrop.className = "rail-drawer-backdrop";
        doc.body.appendChild(backdrop);
      }

      if (navigationMenus) {
        const mobileRailMenu = navigationMenus.find(m => m.name.toLowerCase() === 'mobile rail navigation');
        if (mobileRailMenu) {
          const items = typeof mobileRailMenu.items === 'string' ? JSON.parse(mobileRailMenu.items) : (mobileRailMenu.items || []);
          let navHtml = `<nav class="rail-nav">`;
          items.forEach((item: any) => {
            const icon = getLucideIconForMenuLabel(item.label);
            navHtml += `
              <a class="rail-item pjax-link" href="${item.url === "/" ? "index.html" : item.url.replace(/^\//, "")}" data-page="${item.url}">
                <i data-lucide="${icon}"></i>
                <span>${item.label}</span>
              </a>
            `;
          });
          navHtml += `</nav>`;
          mobileRailDrawer.innerHTML = navHtml;
        }
      }
    }
  }

  // Inject navigation state as a global variable script for preview runtime
  let scriptEl = doc.getElementById("ec-customizer-nav-menus");
  if (!scriptEl) {
    scriptEl = doc.createElement("script");
    scriptEl.setAttribute("id", "ec-customizer-nav-menus");
    doc.head.appendChild(scriptEl);
  }
  if (navigationMenus) {
    scriptEl.innerHTML = `window.__customizerNavigationMenus = ${JSON.stringify(navigationMenus)};`;
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
  if (baseTag) {
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

export function insertBlockAtSelector(
  doc: Document,
  targetSelector: string,
  position: "before" | "after" | "inside",
  blockHtml: string
): string | null {
  const target = doc.querySelector(targetSelector);
  if (!target) return null;

  const template = doc.createElement("template");
  template.innerHTML = blockHtml.trim();
  const newElement = template.content.firstElementChild;
  if (!newElement) return null;

  newElement.setAttribute("data-ec-just-added", "true");

  if (position === "before") {
    target.parentNode?.insertBefore(newElement, target);
  } else if (position === "after") {
    target.parentNode?.insertBefore(newElement, target.nextSibling);
  } else if (position === "inside") {
    target.appendChild(newElement);
  }

  return cssPath(newElement);
}
