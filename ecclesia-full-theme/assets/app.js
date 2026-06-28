// ----------------------------------------------------
// Ecclesia Full Church Theme Consolidated App & PJAX Router
// ----------------------------------------------------

// Navigation configuration
const railItems = [
  { label: 'Media', url: 'media-archive.html', icon: 'tv' },
  { label: 'Livestream', url: 'livestream-page.html', icon: 'video' },
  { label: 'Podcast', url: 'podcast-archive.html', icon: 'mic' },
  { label: 'Articles', url: 'blog-archive.html', icon: 'newspaper' },
  { label: 'Services', url: 'services-archive.html', icon: 'calendar' },
  { label: 'Library', url: 'library-archive.html', icon: 'book-open' },
  { label: 'LMS', url: 'courses-archive.html', icon: 'graduation-cap' },
  { label: 'Worship', url: 'worship.html', icon: 'music' },
  { label: 'Groups', url: 'groups-archive.html', icon: 'users' }
];

const headerNavItems = [
  { label: 'Home', url: 'index.html' },
  { label: 'About', url: 'about.html' },
  { label: 'Plan a Visit', url: 'contact.html' },
  { label: 'Events', url: 'events.html' },
  { label: 'Get Involved', url: 'ministries.html' },
  { label: 'Contact', url: 'contact.html' }
];

function getLucideIconForMenuLabel(label) {
  const lbl = label.toLowerCase();
  if (lbl.includes('media')) return 'tv';
  if (lbl.includes('live')) return 'video';
  if (lbl.includes('podcast')) return 'mic';
  if (lbl.includes('article') || lbl.includes('blog')) return 'newspaper';
  if (lbl.includes('service') || lbl.includes('connect')) return 'calendar';
  if (lbl.includes('library') || lbl.includes('resource')) return 'book-open';
  if (lbl.includes('lms') || lbl.includes('course')) return 'graduation-cap';
  if (lbl.includes('worship') || lbl.includes('study')) return 'music';
  if (lbl.includes('fellowship') || lbl.includes('cell') || lbl.includes('group')) return 'users';
  if (lbl.includes('store') || lbl.includes('giving')) return 'shopping-bag';
  if (lbl.includes('devortion') || lbl.includes('prayer')) return 'heart';
  return 'link';
}

let finalRailItems = railItems;
let finalHeaderNavItems = headerNavItems;
let finalMobileDrawerItems = headerNavItems;
let finalBottomMobileItems = railItems.filter(item => item.label !== 'Livestream' && item.label !== 'LMS');
let finalMobileRailItems = railItems;

if (window.__customizerNavigationMenus) {
  const menus = window.__customizerNavigationMenus;
  const headerMenu = menus.find(m => m.name.toLowerCase() === 'header menu');
  if (headerMenu) {
    const items = typeof headerMenu.items === 'string' ? JSON.parse(headerMenu.items) : headerMenu.items;
    if (Array.isArray(items)) {
      finalHeaderNavItems = items;
    }
  }
  const railMenu = menus.find(m => m.name.toLowerCase() === 'rail navigation');
  if (railMenu) {
    const items = typeof railMenu.items === 'string' ? JSON.parse(railMenu.items) : railMenu.items;
    if (Array.isArray(items)) {
      finalRailItems = items.map(item => ({
        label: item.label,
        url: item.url.replace(/^\//, ''),
        icon: getLucideIconForMenuLabel(item.label)
      }));
    }
  }
  const mobileDrawerMenu = menus.find(m => m.name.toLowerCase() === 'main mobile drawer menu');
  if (mobileDrawerMenu) {
    const items = typeof mobileDrawerMenu.items === 'string' ? JSON.parse(mobileDrawerMenu.items) : mobileDrawerMenu.items;
    if (Array.isArray(items)) {
      finalMobileDrawerItems = items;
    }
  }
  const bottomMobileMenu = menus.find(m => m.name.toLowerCase() === 'bottom mobile menu');
  if (bottomMobileMenu) {
    const items = typeof bottomMobileMenu.items === 'string' ? JSON.parse(bottomMobileMenu.items) : bottomMobileMenu.items;
    if (Array.isArray(items)) {
      finalBottomMobileItems = items.map(item => ({
        label: item.label,
        url: item.url.replace(/^\//, ''),
        icon: getLucideIconForMenuLabel(item.label)
      }));
    }
  }
  const mobileRailMenu = menus.find(m => m.name.toLowerCase() === 'mobile rail navigation');
  if (mobileRailMenu) {
    const items = typeof mobileRailMenu.items === 'string' ? JSON.parse(mobileRailMenu.items) : mobileRailMenu.items;
    if (Array.isArray(items)) {
      finalMobileRailItems = items.map(item => ({
        label: item.label,
        url: item.url.replace(/^\//, ''),
        icon: getLucideIconForMenuLabel(item.label)
      }));
    }
  }
}

const localThemePathPrefixes = ['/themes/ecclesia/', '/ecclesia-full-theme/'];

// Call to action button mapping
const ctaConfig = {
  'index.html': { primary: 'Plan Visit', primaryUrl: 'contact.html', secondary: 'Watch Live', secondaryUrl: 'livestream-page.html' },
  'about.html': { primary: 'Join Us', primaryUrl: 'contact.html', secondary: 'Our Beliefs', secondaryUrl: '#beliefs' },
  'media-archive.html': { primary: 'Watch Sermons', primaryUrl: 'media-archive.html', secondary: 'Watch Live', secondaryUrl: 'livestream-page.html' },
  'media-single.html': { primary: 'Watch Video', primaryUrl: '#', secondary: 'All Sermons', secondaryUrl: 'media-archive.html' },
  'livestream-page.html': { primary: 'Watch Live', primaryUrl: 'livestream-page.html', secondary: 'Prayer Request', secondaryUrl: 'prayer.html' },
  'podcast-archive.html': { primary: 'Listen Now', primaryUrl: 'podcast-archive.html', secondary: 'Subscribe', secondaryUrl: '#subscribe' },
  'podcast-episode.html': { primary: 'Listen Now', primaryUrl: '#', secondary: 'All Episodes', secondaryUrl: 'podcast-archive.html' },
  'services-archive.html': { primary: 'Plan Visit', primaryUrl: 'contact.html', secondary: 'Service Times', secondaryUrl: '#times' },
  'service-single.html': { primary: 'Register', primaryUrl: 'event-register.html', secondary: 'All Services', secondaryUrl: 'services-archive.html' },
  'sermons.html': { primary: 'Watch Sermons', primaryUrl: 'sermons.html', secondary: 'Watch Live', secondaryUrl: 'livestream-page.html' },
  'library-archive.html': { primary: 'Download Now', primaryUrl: 'library-archive.html', secondary: 'Request Resource', secondaryUrl: 'contact.html' },
  'resource-single.html': { primary: 'Download PDF', primaryUrl: '#', secondary: 'All Resources', secondaryUrl: 'library-archive.html' },
  'courses-archive.html': { primary: 'Enrol Now', primaryUrl: 'courses-archive.html', secondary: 'Browse Catalog', secondaryUrl: '#catalog' },
  'course-main.html': { primary: 'Enrol Now', primaryUrl: '#', secondary: 'All Courses', secondaryUrl: 'courses-archive.html' },
  'lesson-single.html': { primary: 'Enrol Now', primaryUrl: '#', secondary: 'Back to Course', secondaryUrl: 'courses-archive.html' },
  'giving.html': { primary: 'Give Now', primaryUrl: 'giving.html', secondary: 'Partner with Us', secondaryUrl: 'giving-partnership.html' },
  'giving-partnership.html': { primary: 'Partner Now', primaryUrl: 'giving-partnership.html', secondary: 'Giving FAQ', secondaryUrl: 'giving.html' },
  'prayer.html': { primary: 'Prayer Request', primaryUrl: 'prayer.html', secondary: 'View Wall', secondaryUrl: 'prayer-wall.html' },
  'prayer-room.html': { primary: 'Join Room', primaryUrl: 'prayer-room.html', secondary: 'Prayer Requests', secondaryUrl: 'prayer.html' },
  'prayer-wall.html': { primary: 'Submit Request', primaryUrl: 'prayer.html', secondary: 'Prayer Room', secondaryUrl: 'prayer-room.html' },
  'prayer-home.html': { primary: 'Submit Request', primaryUrl: 'prayer.html', secondary: 'Prayer Room', secondaryUrl: 'prayer-room.html' },
  'events-archive.html': { primary: 'Register Now', primaryUrl: 'event-register.html', secondary: 'Calendar', secondaryUrl: 'events-archive.html' },
  'events.html': { primary: 'Register Now', primaryUrl: 'event-register.html', secondary: 'Calendar', secondaryUrl: 'events.html' },
  'event-single.html': { primary: 'Register Now', primaryUrl: 'event-register.html', secondary: 'All Events', secondaryUrl: 'events-archive.html' },
  'event-register.html': { primary: 'Submit Register', primaryUrl: '#', secondary: 'Back to Event', secondaryUrl: 'events-archive.html' },
  'blog-archive.html': { primary: 'Read Articles', primaryUrl: 'blog-archive.html', secondary: 'Subscribe', secondaryUrl: '#subscribe' },
  'blog-single.html': { primary: 'All Articles', primaryUrl: 'blog-archive.html', secondary: 'Subscribe', secondaryUrl: '#subscribe' },
  'contact.html': { primary: 'Get in Touch', primaryUrl: 'contact.html', secondary: 'Get Directions', secondaryUrl: '#directions' },
  'ministries.html': { primary: 'Join Group', primaryUrl: 'contact.html', secondary: 'Volunteer', secondaryUrl: 'contact.html' },
  'testimony-wall.html': { primary: 'Submit Testimony', primaryUrl: 'testimony-submit.html', secondary: 'Prayer Requests', secondaryUrl: 'prayer.html' },
  'testimony-submit.html': { primary: 'Submit Testimony', primaryUrl: 'testimony-submit.html', secondary: 'View Wall', secondaryUrl: 'testimony-wall.html' },
  'testimony-single.html': { primary: 'Submit Testimony', primaryUrl: 'testimony-submit.html', secondary: 'View Wall', secondaryUrl: 'testimony-wall.html' },
  'worship.html': { primary: 'Listen Now', primaryUrl: 'worship.html', secondary: 'Lyrics Sheets', secondaryUrl: '#chord-charts' },
  'checkout.html': { secondary: 'Back to Store', secondaryUrl: 'store-archive.html' },
  'cart.html': { secondary: 'Back to Store', secondaryUrl: 'store-archive.html' },
  'checkout-success.html': { secondary: 'Back to Store', secondaryUrl: 'store-archive.html' },
  'checkout-failed.html': { secondary: 'Back to Store', secondaryUrl: 'store-archive.html' },
  'store-archive.html': { primary: 'Cart', primaryUrl: 'cart.html', secondary: 'All Products', secondaryUrl: '#catalog' }
};

// Check if link is a local relative page link
function isLocalLink(anchor) {
  if (!anchor || !anchor.href) return false;
  const hrefAttr = anchor.getAttribute('href');
  if (!hrefAttr || hrefAttr.startsWith('#') || hrefAttr.startsWith('javascript:')) return false;
  if (anchor.href.startsWith('mailto:') || anchor.href.startsWith('tel:')) return false;
  if (anchor.target === '_blank') return false;
  
  try {
    const url = new URL(anchor.href);
    return url.origin === window.location.origin && localThemePathPrefixes.some(prefix => url.pathname.includes(prefix));
  } catch (e) {
    return false;
  }
}

// Get page file name from URL path
function getPageFileName(pathname) {
  const parts = pathname.split('/');
  let segment = parts[parts.length - 1] || 'index.html';
  const clean = segment.split('?')[0].split('#')[0];
  if (clean === 'checkout') return 'checkout.html';
  if (clean === 'cart') return 'cart.html';
  if (clean === 'thank-you') return 'checkout-success.html';
  if (clean === 'checkout-failed') return 'checkout-failed.html';
  if (clean === 'store') return 'store-archive.html';
  if (clean && !clean.endsWith('.html') && clean !== 'index.html') {
    return clean + '.html';
  }
  return clean || 'index.html';
}

const defaultFooterHtml = `
  <div class="footer-inner">
    <div class="footer-grid">
      <div>
        <a href="index.html" class="brand" style="color:white;"><span class="brand-mark"><i data-lucide="church"></i></span><span>Grace City Church</span></a>
        <p style="margin-top:18px;max-width:340px;">A Spirit-filled church helping people encounter Jesus, grow in the Word, build strong families, and serve their city.</p>
        <div class="socials">
          <a href="#"><i data-lucide="facebook"></i></a><a href="#"><i data-lucide="youtube"></i></a><a href="#"><i data-lucide="instagram"></i></a>
        </div>
      </div>
      <div><h4>Explore</h4><a class="pjax-link" href="about.html">About</a><a class="pjax-link" href="sermons.html">Sermons</a><a class="pjax-link" href="events.html">Events</a><a class="pjax-link" href="ministries.html">Ministries</a></div>
      <div><h4>Connect</h4><a class="pjax-link" href="contact.html">Plan a Visit</a><a class="pjax-link" href="prayer.html">Prayer Request</a><a class="pjax-link" href="ministries.html">Join a Group</a><a class="pjax-link" href="contact.html">Volunteer</a></div>
      <div><h4>Service Times</h4><p>Sunday Worship<br />9:30 AM</p><p>Midweek Word & Prayer<br />Wednesday 7:00 PM</p></div>
    </div>
    <div class="footer-bottom"><span>© 2026 Grace City Church. All rights reserved.</span><span>Ecclesia Theme · Digital Church OS</span></div>
  </div>
`;

// Global initialization
function initShell() {
  if (document.querySelector('.shell-wrapper')) {
    // Shell already exists (SPA navigation trigger)
    return;
  }

  // Remove any existing mobile drawers from the page to prevent duplication
  document.querySelectorAll('.mobile-drawer, #mobileDrawer, .drawer, #drawer').forEach(el => el.remove());

  // 1. Extract content from original page
  const originalTitle = document.title;
  const originalMain = document.querySelector('main');
  const originalHeader = document.querySelector('header');
  
  let originalFooter = document.querySelector('footer.footer') || document.querySelector('.footer');
  if (!originalFooter) {
    const f = document.querySelector('footer');
    if (f && (f.querySelector('.footer-inner') || f.querySelector('.footer-grid'))) {
      originalFooter = f;
    }
  }
  
  const headerAttrs = originalHeader ? Array.from(originalHeader.attributes).map(a => `${a.name}="${a.value}"`).join(' ') : 'class="header"';
  
  // Move originalMain's child nodes to a new content outlet.
  // This preserves any event listeners already registered on them.
  const contentOutlet = document.createElement('main');
  contentOutlet.id = 'content-outlet';
  if (originalMain) {
    while (originalMain.firstChild) {
      contentOutlet.appendChild(originalMain.firstChild);
    }
  }

  // Move other non-structural body children to contentOutlet to preserve them
  Array.from(document.body.children).forEach(child => {
    if (
      child !== originalHeader &&
      child !== originalFooter &&
      child !== originalMain &&
      !child.classList.contains('top-notice') &&
      !child.classList.contains('top') &&
      child.id !== 'mobileDrawer' &&
      !child.classList.contains('mobile-drawer') &&
      child.id !== 'mobileRailDrawer' &&
      !child.classList.contains('mobile-rail-drawer') &&
      !child.classList.contains('rail-drawer-backdrop') &&
      child.tagName !== 'SCRIPT'
    ) {
      contentOutlet.appendChild(child);
    }
  });

  const currentFileName = getPageFileName(window.location.pathname);
  const isLivestreamPage = currentFileName.includes('livestream');

  // Cache canonical footer if we find a valid non-livestream one
  if (originalFooter && !isLivestreamPage && !window.__canonicalFooterHtml) {
    window.__canonicalFooterHtml = originalFooter.innerHTML;
  }

  // Determine final footer HTML
  let finalFooterHtml = '';
  if (isLivestreamPage) {
    finalFooterHtml = originalFooter ? originalFooter.innerHTML : defaultFooterHtml;
  } else {
    finalFooterHtml = window.__canonicalFooterHtml || defaultFooterHtml;
  }

  // Create site footer element
  const siteFooter = document.createElement('footer');
  siteFooter.className = 'footer';
  if (originalFooter) {
    Array.from(originalFooter.attributes).forEach(attr => {
      if (attr.name !== 'class') siteFooter.setAttribute(attr.name, attr.value);
    });
  }
  siteFooter.innerHTML = finalFooterHtml;

  // 2. Build shell layout
  const shellWrapper = document.createElement('div');
  shellWrapper.className = 'shell-wrapper';

  // 3. Clear body and build shell using preserved nodes
  const originalTopNotice = document.querySelector('.top-notice, .top');
  
  const railPosition = document.body.getAttribute("data-rail-position") || "left";
  const railShowIcons = document.body.getAttribute("data-rail-show-icons") !== "false";
  const railStyle = document.body.getAttribute("data-rail-style") || "full";
  const railShadow = document.body.getAttribute("data-rail-shadow") === "true";
  const railShadowIntensity = document.body.getAttribute("data-rail-shadow-intensity") || "medium";
  const railShadowThemed = document.body.getAttribute("data-rail-shadow-themed") === "true";
  const railSolidThemed = document.body.getAttribute("data-rail-solid-themed") === "true";
  const railBorder = document.body.getAttribute("data-rail-border") !== "false";
  const railBorderSize = document.body.getAttribute("data-rail-border-size") || "small";
  const railBorderColor = document.body.getAttribute("data-rail-border-color") || "standard";
  const railVerticalAlign = document.body.getAttribute("data-rail-vertical-align") || "center";
  const railFontSize = document.body.getAttribute("data-rail-font-size") || "medium";
  const railFontWeight = document.body.getAttribute("data-rail-font-weight") || "bold";

  // Rail Navigation HTML
  let railHtml = '';
  if (railPosition === 'below-header') {
    railHtml = `
      <div class="rail-menu-horizontal"
           data-rail-style="${railStyle}"
           data-rail-shadow="${railShadow}"
           data-rail-shadow-intensity="${railShadowIntensity}"
           data-rail-shadow-themed="${railShadowThemed}"
           data-rail-solid-themed="${railSolidThemed}"
           data-rail-border="${railBorder}"
           data-rail-border-size="${railBorderSize}"
           data-rail-border-color="${railBorderColor}"
           data-rail-vertical-align="${railVerticalAlign}"
           data-rail-font-size="${railFontSize}"
           data-rail-font-weight="${railFontWeight}">
        <nav class="horizontal-rail-nav">
    `;
    finalRailItems.forEach(item => {
      railHtml += `
        <a class="rail-item pjax-link" href="${item.url}" data-page="${item.url}">
          ${railShowIcons ? `<i data-lucide="${item.icon}"></i>` : ''}
          <span>${item.label}</span>
        </a>
      `;
    });
    railHtml += `
        </nav>
      </div>
    `;
  } else {
    railHtml = `
      <aside class="${railPosition}-rail"
             data-rail-style="${railStyle}"
             data-rail-shadow="${railShadow}"
             data-rail-shadow-intensity="${railShadowIntensity}"
             data-rail-shadow-themed="${railShadowThemed}"
             data-rail-solid-themed="${railSolidThemed}"
             data-rail-border="${railBorder}"
             data-rail-border-size="${railBorderSize}"
             data-rail-border-color="${railBorderColor}"
             data-rail-vertical-align="${railVerticalAlign}"
             data-rail-font-size="${railFontSize}"
             data-rail-font-weight="${railFontWeight}">
        <nav class="rail-nav">
    `;
    finalRailItems.forEach(item => {
      railHtml += `
        <a class="rail-item pjax-link" href="${item.url}" data-page="${item.url}">
          <i data-lucide="${item.icon}"></i>
          <span>${item.label}</span>
        </a>
      `;
    });
    railHtml += `
        </nav>
      </aside>
    `;
  }

  // Mobile bottom tab bar HTML
  let mobileTabHtml = `<div class="mobile-tab-rail">`;
  finalBottomMobileItems.forEach(item => {
    mobileTabHtml += `
      <a class="mobile-tab-item pjax-link" href="${item.url}" data-page="${item.url}">
        <i data-lucide="${item.icon}"></i>
        <span>${item.label}</span>
      </a>
    `;
  });
  mobileTabHtml += `</div>`;

  document.body.innerHTML = '';
  
  if (originalTopNotice) shellWrapper.appendChild(originalTopNotice);
  if (originalHeader) shellWrapper.appendChild(originalHeader);
  
  const tempRail = document.createElement('div');
  tempRail.innerHTML = railHtml;
  const railElement = tempRail.firstElementChild;

  if (railPosition === 'below-header' && railElement) {
    shellWrapper.appendChild(railElement);
  }

  const shellBody = document.createElement('div');
  shellBody.className = 'main-shell-body';
  
  if (railPosition === 'left' && railElement) {
    shellBody.appendChild(railElement);
    shellBody.appendChild(contentOutlet);
  } else if (railPosition === 'right' && railElement) {
    shellBody.appendChild(contentOutlet);
    shellBody.appendChild(railElement);
  } else {
    shellBody.appendChild(contentOutlet);
  }
  
  shellWrapper.appendChild(shellBody);
  shellWrapper.appendChild(siteFooter);
  
  const tempTab = document.createElement('div');
  tempTab.innerHTML = mobileTabHtml;
  
  // Create canonical mobile drawer
  let drawer = document.getElementById('mobileDrawer');
  if (!drawer) {
    drawer = document.createElement('aside');
    drawer.id = 'mobileDrawer';
  }
  drawer.className = 'mobile-drawer';
  drawer.setAttribute('aria-hidden', 'true');

  const mobileDrawerCombine = document.body.getAttribute("data-mobile-drawer-combine") === "true";
  const mobileDrawerRailPosition = document.body.getAttribute("data-mobile-drawer-rail-position") || "right";

  if (mobileDrawerCombine) {
    drawer.setAttribute('data-mobile-drawer-combine', 'true');
    drawer.setAttribute('data-mobile-drawer-rail-position', mobileDrawerRailPosition);

    let railHtml = `<div class="drawer-rail-col"><nav class="rail-nav">`;
    finalMobileRailItems.forEach(item => {
      const url = item.url === "/" ? "index.html" : item.url.replace(/^\//, "");
      railHtml += `
        <a class="rail-item pjax-link" href="${url}" data-page="${item.url}">
          <i data-lucide="${item.icon}"></i>
          <span>${item.label}</span>
        </a>
      `;
    });
    railHtml += `</nav></div>`;

    let mainHtml = `<div class="drawer-main-col">
      <div class="drawer-close-row">
        <button class="drawer-close" id="closeDrawer" aria-label="Close menu">
          <i data-lucide="x"></i>
        </button>
      </div>
      <nav class="drawer-nav">`;
    finalMobileDrawerItems.forEach(item => {
      const url = item.url === "/" ? "index.html" : item.url.replace(/^\//, "");
      const icon = getLucideIconForMenuLabel(item.label);
      mainHtml += `
        <a class="pjax-link" href="${url}">
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

    drawer.innerHTML = `<div class="drawer-combined-wrap">${railHtml}${mainHtml}</div>`;
  } else {
    drawer.setAttribute('data-mobile-drawer-combine', 'false');
    drawer.removeAttribute('data-mobile-drawer-rail-position');

    let drawerNavHtml = '<nav class="drawer-nav">';
    finalMobileDrawerItems.forEach(item => {
      const url = item.url === "/" ? "index.html" : item.url.replace(/^\//, "");
      const icon = getLucideIconForMenuLabel(item.label);
      drawerNavHtml += `
        <a class="pjax-link" href="${url}">
          <i data-lucide="${icon}"></i> ${item.label}
        </a>
      `;
    });
    drawerNavHtml += '</nav>';

    drawer.innerHTML = `
      <div class="drawer-close-row">
        <button class="drawer-close" id="closeDrawer" aria-label="Close menu">
          <i data-lucide="x"></i>
        </button>
      </div>
      ${drawerNavHtml}
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
  }

  // Create canonical mobile rail drawer
  let railDrawer = document.getElementById('mobileRailDrawer');
  let railBackdrop = document.querySelector('.rail-drawer-backdrop');

  if (mobileDrawerCombine) {
    if (railDrawer) {
      railDrawer.remove();
      railDrawer = null;
    }
    if (railBackdrop) {
      railBackdrop.remove();
      railBackdrop = null;
    }
  } else {
    if (!railDrawer) {
      railDrawer = document.createElement('aside');
      railDrawer.id = 'mobileRailDrawer';
      railDrawer.className = 'mobile-rail-drawer';
    }
    railDrawer.setAttribute('aria-hidden', 'true');
    
    let railNavHtml = '<nav class="rail-nav">';
    finalMobileRailItems.forEach(item => {
      const url = item.url === "/" ? "index.html" : item.url.replace(/^\//, "");
      railNavHtml += `
        <a class="rail-item pjax-link" href="${url}" data-page="${item.url}">
          <i data-lucide="${item.icon}"></i>
          <span>${item.label}</span>
        </a>
      `;
    });
    railNavHtml += '</nav>';
    railDrawer.innerHTML = railNavHtml;

    if (!railBackdrop) {
      railBackdrop = document.createElement('div');
      railBackdrop.className = 'rail-drawer-backdrop';
    }
  }

  document.body.appendChild(shellWrapper);
  document.body.appendChild(drawer);
  if (railDrawer) document.body.appendChild(railDrawer);
  if (railBackdrop) document.body.appendChild(railBackdrop);
  document.body.appendChild(tempTab.firstElementChild);

  // Move overlay drawers/modals to root of body to ensure correct stacking context above bottom mobile rail nav
  const cartBackdrop = document.getElementById('cartBackdrop');
  const cartDrawer = document.getElementById('cartDrawer');
  const checkoutBackdrop = document.getElementById('checkoutModalBackdrop');
  if (cartBackdrop) document.body.appendChild(cartBackdrop);
  if (cartDrawer) document.body.appendChild(cartDrawer);
  if (checkoutBackdrop) document.body.appendChild(checkoutBackdrop);

  // 4. Bind events
  bindEvents();
  
  // 5. Initial active states and CTA load
  updateActiveStates(currentFileName);
  renderHeaderCTAs(currentFileName);
  
  // 6. Initialize Custom Dropdowns
  if (window.initCustomDropdowns) window.initCustomDropdowns();
  
  // Initialize fallbacks/placeholders
  if (window.initPlaceholders) window.initPlaceholders();
  
  // Format card buttons and inject icons
  if (window.formatCardButtons) window.formatCardButtons();
  
  // 7. Create icons
  lucide.createIcons();

  // 7. Initialize sort toggles
  if (window.initSortToggles) window.initSortToggles();

  // 8. Trigger show body by adding class
  document.body.classList.add('shell-loaded');
}

function getMobileDrawerShift(drawer) {
  if (!drawer) return '75vw';

  const drawerWidth = drawer.getBoundingClientRect().width;
  return drawerWidth ? `${Math.round(drawerWidth)}px` : '75vw';
}

function setMobileDrawerState(isOpen) {
  const drawer = document.getElementById('mobileDrawer');
  const menuBtn = document.getElementById('menuBtn');
  const shellWrapper = document.querySelector('.shell-wrapper');

  document.body.classList.toggle('drawer-open', isOpen);
  if (drawer) drawer.setAttribute('aria-hidden', String(!isOpen));
  if (menuBtn) menuBtn.setAttribute('aria-expanded', String(isOpen));

  if (shellWrapper) {
    const drawerMode = document.body.getAttribute('data-mobile-drawer-mode') || 'reveal';
    const drawerSide = document.body.getAttribute('data-mobile-drawer-side') || 'right';

    if (drawerMode === 'overlay') {
      shellWrapper.style.transform = '';
      shellWrapper.style.boxShadow = '';
    } else {
      const shift = getMobileDrawerShift(drawer);
      const sign = drawerSide === 'left' ? '' : '-';
      shellWrapper.style.transform = isOpen ? `translateX(${sign}${shift})` : '';
      shellWrapper.style.boxShadow = isOpen ? '30px 0 80px rgba(15,23,42,.16)' : '';
    }
  }
}

function openMobileDrawer() {
  setMobileDrawerState(true);
}

function closeMobileDrawer() {
  setMobileDrawerState(false);
}

// Bind mobile drawers and account buttons
function bindMobileMenu() {
  const mobileDrawerCombine = document.body.getAttribute("data-mobile-drawer-combine") === "true";

  // 1. Mobile Rail Drawer (Kebab / Right)
  const kebabBtn = document.getElementById('kebabBtn');
  const railDrawer = document.getElementById('mobileRailDrawer');
  const railBackdrop = document.querySelector('.rail-drawer-backdrop');

  const setRailDrawerState = (isOpen) => {
    if (railDrawer) {
      railDrawer.classList.toggle('open', isOpen);
      railDrawer.setAttribute('aria-hidden', String(!isOpen));
    }
    if (railBackdrop) {
      railBackdrop.classList.toggle('show', isOpen);
    }
    document.body.classList.toggle('rail-drawer-open', isOpen);
  };

  if (kebabBtn) {
    const newKebabBtn = kebabBtn.cloneNode(true);
    kebabBtn.parentNode.replaceChild(newKebabBtn, kebabBtn);
    newKebabBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (mobileDrawerCombine) {
        // Combined mode: toggle the main mobile drawer
        const isOpen = document.body.classList.contains('drawer-open');
        if (isOpen) {
          closeMobileDrawer();
        } else {
          openMobileDrawer();
        }
      } else {
        // Standalone mode: toggle the rail drawer
        if (railDrawer) {
          const isOpen = railDrawer.classList.contains('open');
          if (isOpen) {
            setRailDrawerState(false);
          } else {
            setRailDrawerState(true);
            closeMobileDrawer();
          }
        }
      }
    });
  }

  if (railBackdrop && !mobileDrawerCombine) {
    const newBackdrop = railBackdrop.cloneNode(true);
    railBackdrop.parentNode.replaceChild(newBackdrop, railBackdrop);
    newBackdrop.addEventListener('click', () => {
      setRailDrawerState(false);
    });
  }

  // 2. Main Mobile Drawer (Hamburger / Left)
  const menuBtn = document.getElementById('menuBtn');
  const drawer = document.getElementById('mobileDrawer');
  if (drawer) {
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Mobile navigation');
    drawer.setAttribute('aria-hidden', String(!document.body.classList.contains('drawer-open')));
  }

  if (menuBtn && drawer) {
    const newMenuBtn = menuBtn.cloneNode(true);
    menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
    newMenuBtn.setAttribute('aria-label', 'Open menu');
    newMenuBtn.setAttribute('aria-controls', 'mobileDrawer');
    newMenuBtn.setAttribute('aria-expanded', String(document.body.classList.contains('drawer-open')));

    newMenuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = document.body.classList.contains('drawer-open');
      if (isOpen) {
        closeMobileDrawer();
      } else {
        openMobileDrawer();
        if (!mobileDrawerCombine) {
          setRailDrawerState(false);
        }
      }
    });
  }

  if (drawer && !drawer.dataset.drawerBound) {
    drawer.addEventListener('click', (event) => {
      const target = event.target.closest('#closeDrawer, a');
      if (target) {
        closeMobileDrawer();
      }
    });
    drawer.dataset.drawerBound = 'true';
  }

  if (!window.__drawerEscBound) {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMobileDrawer();
        if (!mobileDrawerCombine) {
          setRailDrawerState(false);
        }
      }
    });
    window.__drawerEscBound = true;
  }

  if (!window.__drawerClickOutsideBound) {
    document.addEventListener('click', (event) => {
      const activeDrawer = document.getElementById('mobileDrawer');
      const activeKebab = document.getElementById('kebabBtn');
      if (document.body.classList.contains('drawer-open')) {
        if (activeDrawer && !activeDrawer.contains(event.target) && (!activeKebab || !activeKebab.contains(event.target))) {
          closeMobileDrawer();
        }
      }
      
      const activeRailDrawer = document.getElementById('mobileRailDrawer');
      const activeMenuBtn = document.getElementById('menuBtn');
      if (!mobileDrawerCombine && activeRailDrawer && activeRailDrawer.classList.contains('open')) {
        if (!activeRailDrawer.contains(event.target) && (!activeMenuBtn || !activeMenuBtn.contains(event.target))) {
          setRailDrawerState(false);
        }
      }
    });
    window.__drawerClickOutsideBound = true;
  }


  // 3. Member Account Button (Header Actions)
  const accountBtn = document.getElementById('accountBtn');
  const accountMenu = document.querySelector('.account-dropdown-menu');
  const isLoggedIn = !!localStorage.getItem("churchos.token") && localStorage.getItem("churchos.token") !== "local-preview-token";

  if (accountBtn) {
    const newAccountBtn = accountBtn.cloneNode(true);
    accountBtn.parentNode.replaceChild(newAccountBtn, accountBtn);

    if (isLoggedIn) {
      newAccountBtn.setAttribute('href', 'account.html');
      newAccountBtn.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToPage('account.html');
      });
    } else {
      newAccountBtn.setAttribute('href', 'login.html');
      newAccountBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (accountMenu) {
          const isVisible = accountMenu.style.display === 'block';
          accountMenu.style.display = isVisible ? 'none' : 'block';
        }
      });
    }
  }

  if (accountMenu && !window.__accountDropdownClickOutsideBound) {
    document.addEventListener('click', (event) => {
      if (accountBtn && !accountBtn.contains(event.target) && accountMenu && !accountMenu.contains(event.target)) {
        accountMenu.style.display = 'none';
      }
    });
    window.__accountDropdownClickOutsideBound = true;
  }

  if (!window.__drawerResizeBound) {
    const desktopQuery = window.matchMedia('(min-width: 1051px)');
    const closeOnDesktop = (event) => {
      if (event.matches) {
        closeMobileDrawer();
        const activeRailDrawer = document.getElementById('mobileRailDrawer');
        const activeBackdrop = document.querySelector('.rail-drawer-backdrop');
        if (activeRailDrawer) activeRailDrawer.classList.remove('open');
        if (activeBackdrop) activeBackdrop.classList.remove('show');
        document.body.classList.remove('rail-drawer-open');
      }
    };

    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener('change', closeOnDesktop);
    } else if (desktopQuery.addListener) {
      desktopQuery.addListener(closeOnDesktop);
    }
    window.__drawerResizeBound = true;
  }
}

// Render Header CTA buttons based on current page
function renderHeaderCTAs(pageFile) {
  const actionsContainer = document.querySelector('.header-actions') || document.querySelector('.header .actions');
  if (!actionsContainer) return;
  
  const config = ctaConfig[pageFile] || ctaConfig['index.html'];
  
  let ctasHtml = '';
  if (config.secondary) {
    ctasHtml += `<a class="btn btn-soft pjax-link" href="${config.secondaryUrl}">${config.secondary}</a>`;
  }
  if (config.primary) {
    ctasHtml += `<a class="btn btn-primary pjax-link" href="${config.primaryUrl}">${config.primary}</a>`;
  }
  
  // Keep the mobile menu button (Kebab on the right in header actions) only if drawers are NOT combined
  const mobileDrawerCombine = document.body.getAttribute("data-mobile-drawer-combine") === "true";
  if (!mobileDrawerCombine) {
    ctasHtml += `<button class="mobile-menu-btn mobile-kebab-btn" id="kebabBtn" aria-label="Open Rail Menu" aria-controls="mobileRailDrawer" aria-expanded="false"><i data-lucide="more-vertical"></i></button>`;
  }
  actionsContainer.innerHTML = ctasHtml;

  // Hamburger on the left inside nav-wrap
  const navWrap = document.querySelector('.header .nav-wrap') || document.querySelector('.header .navwrap');
  if (navWrap) {
    let leftHam = navWrap.querySelector('#menuBtn') || navWrap.querySelector('.mobilebtn') || navWrap.querySelector('.menu');
    if (!leftHam) {
      leftHam = document.createElement('button');
      leftHam.className = 'mobile-menu-btn mobile-hamburger-btn';
      leftHam.id = 'menuBtn';
      leftHam.setAttribute('aria-label', 'Open Main Menu');
      leftHam.setAttribute('aria-controls', 'mobileDrawer');
      leftHam.setAttribute('aria-expanded', 'false');
      leftHam.innerHTML = `<i data-lucide="menu"></i>`;
      navWrap.insertBefore(leftHam, navWrap.firstChild);
    } else {
      leftHam.id = 'menuBtn';
      leftHam.className = 'mobile-menu-btn mobile-hamburger-btn';
      leftHam.setAttribute('aria-controls', 'mobileDrawer');
      leftHam.setAttribute('aria-expanded', 'false');
    }
  }
  
  bindMobileMenu();
  bindPjaxLinks(actionsContainer);
  if (navWrap) {
    const leftHam = navWrap.querySelector('#menuBtn');
    if (leftHam) bindPjaxLinks(leftHam.parentNode);
  }
}

// Highlight active links in left rail, header nav, and mobile tab bar
function updateActiveStates(pageFile) {
  // Normalize filenames
  const targetPage = pageFile === '' ? 'index.html' : pageFile;

  // Rail navigation (all positions)
  document.querySelectorAll('.rail-item').forEach(link => {
    const linkPage = getPageFileName(link.getAttribute('href'));
    link.classList.toggle('active', linkPage === targetPage);
  });

  // Mobile bottom bar
  document.querySelectorAll('.mobile-tab-rail .mobile-tab-item').forEach(link => {
    const linkPage = getPageFileName(link.getAttribute('href'));
    link.classList.toggle('active', linkPage === targetPage);
  });

  // Top header links
  document.querySelectorAll('.header .nav .header-nav-link').forEach(link => {
    const linkPage = getPageFileName(link.getAttribute('href'));
    link.classList.toggle('active', linkPage === targetPage);
  });
}

// Intercept clicks on links for PJAX SPA experience
function bindPjaxLinks(container = document) {
  container.querySelectorAll('a').forEach(link => {
    if (isLocalLink(link) && !link.classList.contains('pjax-bound')) {
      link.classList.add('pjax-bound');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        navigateToPage(href);
      });
    }
  });
}

// Fetch and load target page content dynamically
function navigateToPage(url, isBack = false) {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'ec-navigate', href: url }, '*');
    return;
  }
  const contentOutlet = document.getElementById('content-outlet');
  if (!contentOutlet) return;

  const skeletonHtml = `
    <div class="skeleton-page">
      <div class="skeleton-shimmer skeleton-hero"></div>
      <div class="skeleton-shimmer skeleton-title" style="margin-top: 24px;"></div>
      <div class="skeleton-shimmer skeleton-text"></div>
      <div class="skeleton-shimmer skeleton-text"></div>
      <div class="skeleton-shimmer skeleton-text short"></div>
      <div class="skeleton-grid" style="margin-top: 32px;">
        <div class="skeleton-shimmer skeleton-card"></div>
        <div class="skeleton-shimmer skeleton-card"></div>
        <div class="skeleton-shimmer skeleton-card"></div>
      </div>
    </div>
  `;

  // Render skeleton instantly to eliminate loading delay feel
  closeMobileDrawer();
  const activeRailDrawer = document.getElementById('mobileRailDrawer');
  const activeBackdrop = document.querySelector('.rail-drawer-backdrop');
  if (activeRailDrawer) activeRailDrawer.classList.remove('open');
  if (activeBackdrop) activeBackdrop.classList.remove('show');
  document.body.classList.remove('rail-drawer-open');
  document.body.classList.add('page-loading');
  contentOutlet.innerHTML = skeletonHtml;
  contentOutlet.style.opacity = '1';

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.text();
    })
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const newMain = doc.querySelector('main');
      const newTitle = doc.querySelector('title') ? doc.querySelector('title').innerText : 'Grace City Church';
      const pageFile = getPageFileName(url.split('?')[0]);

      // 1. Update output content and document title
      contentOutlet.innerHTML = newMain ? newMain.innerHTML : '';
      document.title = newTitle;

      // 2. Clean up previous page-specific stylesheets to prevent styling leaks
      document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('assets/') && !href.includes('styles.css')) {
          link.remove();
        }
      });

      // 3. Extract and dynamically inject stylesheets from fetched document
      doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !document.querySelector(`link[href="${href}"]`)) {
          const newLink = document.createElement('link');
          newLink.rel = 'stylesheet';
          newLink.href = href;
          document.head.appendChild(newLink);
        }
      });

      // 3. Extract and run scripts from fetched document (page-specific JS)
      doc.querySelectorAll('script').forEach(script => {
        const src = script.getAttribute('src');
        if (src) {
          if (src.includes('app.js') || src.includes('lucide')) return;
          
          const oldScript = document.querySelector(`script[src="${src}"]`);
          if (oldScript) oldScript.remove();
          
          const newScript = document.createElement('script');
          newScript.src = src;
          document.body.appendChild(newScript);
        } else if (script.textContent) {
          const newScript = document.createElement('script');
          newScript.textContent = script.textContent;
          document.body.appendChild(newScript);
        }
      });

      // 4. Manage history state
      if (!isBack) {
        history.pushState(null, '', url);
      }

      // 5. Scroll to top
      window.scrollTo(0, 0);

      // 6. Update highlights & CTA buttons
      updateActiveStates(pageFile);
      renderHeaderCTAs(pageFile);

      // 7. Initialize Custom Dropdowns
      if (window.initCustomDropdowns) window.initCustomDropdowns();

      // Initialize fallbacks/placeholders
      if (window.initPlaceholders) window.initPlaceholders();

      // Format card buttons and inject icons
      if (window.formatCardButtons) window.formatCardButtons();

      // 8. Render Lucide icons
      lucide.createIcons();

      // 8. Initialize sort toggles
      if (window.initSortToggles) window.initSortToggles();

      // 9. Bind click listeners in new content
      bindPjaxLinks(contentOutlet);

      // Fade in effect
      setTimeout(() => {
        contentOutlet.style.opacity = '1';
        document.body.classList.remove('page-loading');
      }, 100);
    })
    .catch(err => {
      console.error('Failed to load page dynamically:', err);
      // Fallback: standard location navigate
      window.location.href = url;
    });
}

window.navigateToPage = navigateToPage;


// Bind popstate (browser back/forward button clicks)
function bindEvents() {
  window.addEventListener('popstate', () => {
    navigateToPage(window.location.href, true);
  });
  
  // Initial bindings
  bindPjaxLinks();
  bindMobileMenu();
  bindHeaderScroll();
}

function bindHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;
  
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const effect = header.getAttribute('data-header-effect');
    const currentScrollY = window.scrollY;
    
    // Glass effect toggle
    if (effect === 'glass') {
      if (currentScrollY > 10) {
        header.classList.add('ec-header-glass');
      } else {
        header.classList.remove('ec-header-glass');
      }
    } else {
      header.classList.remove('ec-header-glass');
    }

    // Reveal and Hide scroll effects
    if (effect === 'reveal') {
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        header.classList.add('ec-header-hidden');
      } else {
        header.classList.remove('ec-header-hidden');
      }
    } else if (effect === 'hide') {
      if (currentScrollY > 80) {
        header.classList.add('ec-header-hidden');
      } else {
        header.classList.remove('ec-header-hidden');
      }
    } else {
      header.classList.remove('ec-header-hidden');
    }
    
    lastScrollY = currentScrollY;
  }, { passive: true });
}

// Initialize simplified sort toggle buttons
function initSortToggles() {
  const dateBtn = document.getElementById('dateSortToggle');
  const alphaBtn = document.getElementById('alphaSortToggle');
  const priceBtn = document.getElementById('priceSortToggle');
  const mobileBtn = document.getElementById('mobileSortToggle');
  const hiddenSelect = document.getElementById('sortFilter');

  if (!hiddenSelect) return;

  function updateHiddenSelect(value) {
    hiddenSelect.value = value;
    hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));
    hiddenSelect.dispatchEvent(new Event('input', { bubbles: true }));
    syncButtonStyles();
  }

  function updateDateIcon(btn, state) {
    btn.innerHTML = '<i data-lucide="calendar"></i>' + ` <span class="toggle-label">${state === 'new' ? 'New' : 'Old'}</span>`;
    lucide.createIcons();
  }

  function updateAlphaIcon(btn, state) {
    btn.innerHTML = (state === 'az' ? '<i data-lucide="arrow-down"></i>' : '<i data-lucide="arrow-up"></i>') + ` <span class="toggle-label">${state === 'az' ? 'AZ' : 'ZA'}</span>`;
    lucide.createIcons();
  }

  function updatePriceIcon(btn, state) {
    btn.innerHTML = '<i data-lucide="dollar-sign"></i>' + ` <span class="toggle-label">${state === 'low' ? 'Low' : 'High'}</span>`;
    lucide.createIcons();
  }

  function updateMobileIcon(btn, state) {
    let icon = 'calendar';
    let label = 'New';
    if (state === 'new') {
      icon = 'calendar';
      label = 'New';
    } else if (state === 'old') {
      icon = 'calendar';
      label = 'Old';
    } else if (state === 'az') {
      icon = 'arrow-down';
      label = 'AZ';
    } else {
      icon = 'arrow-up';
      label = 'ZA';
    }
    btn.innerHTML = `<i data-lucide="${icon}"></i> <span class="toggle-label">${label}</span>`;
    lucide.createIcons();
  }

  function syncButtonStyles() {
    const val = hiddenSelect.value;
    
    if (dateBtn) dateBtn.classList.remove('active');
    if (alphaBtn) alphaBtn.classList.remove('active');
    if (priceBtn) priceBtn.classList.remove('active');
    if (mobileBtn) mobileBtn.classList.remove('active');

    if (val === 'newest' || val === 'oldest') {
      if (dateBtn) {
        dateBtn.classList.add('active');
        const state = val === 'newest' ? 'new' : 'old';
        dateBtn.setAttribute('data-sort', state);
        updateDateIcon(dateBtn, state);
      }
    } else if (val === 'az' || val === 'za') {
      if (alphaBtn) {
        alphaBtn.classList.add('active');
        alphaBtn.setAttribute('data-sort', val);
        updateAlphaIcon(alphaBtn, val);
      }
    } else if (val === 'price-low' || val === 'price-high') {
      if (priceBtn) {
        priceBtn.classList.add('active');
        const state = val === 'price-low' ? 'low' : 'high';
        priceBtn.setAttribute('data-sort', state);
        updatePriceIcon(priceBtn, state);
      }
    }

    if (mobileBtn) {
      mobileBtn.classList.add('active');
      let mobState = 'new';
      if (val === 'oldest') mobState = 'old';
      else if (val === 'az') mobState = 'az';
      else if (val === 'za') mobState = 'za';
      mobileBtn.setAttribute('data-sort', mobState);
      updateMobileIcon(mobileBtn, mobState);
    }
  }

  if (dateBtn) {
    dateBtn.onclick = (e) => {
      e.preventDefault();
      const current = dateBtn.getAttribute('data-sort') || 'new';
      const nextSort = current === 'new' ? 'old' : 'new';
      updateHiddenSelect(nextSort === 'new' ? 'newest' : 'oldest');
    };
  }

  if (alphaBtn) {
    alphaBtn.onclick = (e) => {
      e.preventDefault();
      const current = alphaBtn.getAttribute('data-sort') || 'az';
      const nextSort = current === 'az' ? 'za' : 'az';
      updateHiddenSelect(nextSort);
    };
  }

  if (priceBtn) {
    priceBtn.onclick = (e) => {
      e.preventDefault();
      const current = priceBtn.getAttribute('data-sort') || 'low';
      const nextSort = current === 'low' ? 'high' : 'low';
      updateHiddenSelect(nextSort === 'low' ? 'price-low' : 'price-high');
    };
  }

  if (mobileBtn) {
    mobileBtn.onclick = (e) => {
      e.preventDefault();
      const current = mobileBtn.getAttribute('data-sort') || 'new';
      let nextSort = 'new';
      let selectVal = 'newest';

      if (current === 'new') {
        nextSort = 'old';
        selectVal = 'oldest';
      } else if (current === 'old') {
        nextSort = 'az';
        selectVal = 'az';
      } else if (current === 'az') {
        nextSort = 'za';
        selectVal = 'za';
      } else {
        nextSort = 'new';
        selectVal = 'newest';
      }

      updateHiddenSelect(selectVal);
    };
  }

  // Initial sync
  syncButtonStyles();

  // Reset toggles when clear filters is clicked
  const clearFiltersBtn = document.getElementById('clearFilters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      setTimeout(() => {
        syncButtonStyles();
      }, 50);
    });
  }
}

window.initSortToggles = initSortToggles;

// Initialize on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShell);
} else {
  initShell();
}

// Expose reinitShell so the React theme bridge (cssVarBridge.ts) can trigger a
// full shell rebuild after it has written data-rail-* / data-header-* body
// attributes from saved customizer settings. Without this, cart, checkout-failed
// and other standalone pages render with default rail/header styling.
window.reinitShell = function() {
  const existingShell = document.querySelector('.shell-wrapper');
  if (existingShell) existingShell.remove();
  window.__canonicalFooterHtml = null;
  initShell();
};

function getIconForOption(text) {
  const t = text.toLowerCase();
  if (t.includes('all') || t.includes('category') || t.includes('filter')) return 'filter';
  if (t.includes('apparel') || t.includes('shirt') || t.includes('clothing') || t.includes('hoodie') || t.includes('tee')) return 'shirt';
  if (t.includes('book') || t.includes('bible') || t.includes('read') || t.includes('literature') || t.includes('ebook') || t.includes('manual')) return 'book-open';
  if (t.includes('music') || t.includes('worship') || t.includes('audio') || t.includes('song') || t.includes('track') || t.includes('cd')) return 'music';
  if (t.includes('resource') || t.includes('study') || t.includes('guide') || t.includes('theology') || t.includes('handbook')) return 'file-text';
  if (t.includes('sermon') || t.includes('video') || t.includes('watch') || t.includes('movie') || t.includes('media')) return 'video';
  if (t.includes('podcast') || t.includes('audio') || t.includes('listen') || t.includes('mic')) return 'mic';
  if (t.includes('blog') || t.includes('news') || t.includes('article') || t.includes('paper') || t.includes('devotional') || t.includes('inspiration') || t.includes('announcement')) return 'newspaper';
  if (t.includes('event') || t.includes('calendar') || t.includes('date') || t.includes('conference') || t.includes('service')) return 'calendar';
  if (t.includes('group') || t.includes('cell') || t.includes('community') || t.includes('fellowship') || t.includes('men') || t.includes('women') || t.includes('youth') || t.includes('marry') || t.includes('married') || t.includes('family')) return 'users';
  if (t.includes('outreach') || t.includes('kid') || t.includes('pray') || t.includes('heart') || t.includes('love') || t.includes('faith') || t.includes('culture') || t.includes('ministry')) return 'heart-handshake';
  if (t.includes('course') || t.includes('class') || t.includes('teach') || t.includes('learn') || t.includes('leadership')) return 'graduation-cap';
  return 'tag';
}

function initCustomDropdowns() {
  const selectWraps = document.querySelectorAll('.filtertop .selectwrap');
  selectWraps.forEach(wrap => {
    const select = wrap.querySelector('select');
    if (!select) return;

    // Hide duplicate category/channel/type dropdown filters if big cards (.cats) are present on the page
    const hasBigCards = document.querySelector('.cats, .channels, .types, .tracks');
    const isDuplicateSelect = select.id === 'categoryFilter' || select.id === 'channelFilter' || select.id === 'trackFilter' || select.id === 'typeFilter';
    if (hasBigCards && isDuplicateSelect) {
      wrap.style.setProperty('display', 'none', 'important');
      return;
    }

    if (select.classList.contains('customized')) return;
    select.classList.add('customized');
    wrap.classList.add('has-custom-dropdown');
    
    // Hide original select
    select.style.display = 'none';
    
    // Hide default absolute icon if any
    const originalIcon = wrap.querySelector('i:not(.radio-icon i), svg:not(.radio-icon svg)');
    if (originalIcon) originalIcon.style.display = 'none';
    
    // Create new custom dropdown wrapper
    const customDropdown = document.createElement('div');
    customDropdown.className = 'custom-dropdown';
    
    const options = Array.from(select.options);
    const selectedOption = select.options[select.selectedIndex] || select.options[0];
    const selectedIcon = getIconForOption(selectedOption.text);
    
    // Build trigger
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-dropdown-trigger';
    trigger.innerHTML = `
      <i class="trigger-icon" data-lucide="${selectedIcon}"></i>
      <span class="trigger-label">${selectedOption.text}</span>
      <i class="trigger-chevron" data-lucide="chevron-down"></i>
    `;
    
    // Build options list
    const optionsList = document.createElement('div');
    optionsList.className = 'custom-dropdown-list';
    
    options.forEach(opt => {
      const optIcon = getIconForOption(opt.text);
      const optItem = document.createElement('div');
      optItem.className = `custom-dropdown-item${opt.value === select.value ? ' active' : ''}`;
      optItem.setAttribute('data-value', opt.value);
      optItem.innerHTML = `
        <i data-lucide="${optIcon}"></i>
        <span>${opt.text}</span>
      `;
      
      optItem.addEventListener('click', (e) => {
        e.stopPropagation();
        select.value = opt.value;
        // Trigger change event
        select.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Update trigger UI
        trigger.querySelector('.trigger-icon').setAttribute('data-lucide', optIcon);
        trigger.querySelector('.trigger-label').textContent = opt.text;
        lucide.createIcons();
        
        // Close dropdown
        customDropdown.classList.remove('open');
        
        // Update active class on items
        optionsList.querySelectorAll('.custom-dropdown-item').forEach(item => {
          item.classList.toggle('active', item.getAttribute('data-value') === opt.value);
        });
      });
      
      optionsList.appendChild(optItem);
    });
    
    customDropdown.appendChild(trigger);
    customDropdown.appendChild(optionsList);
    wrap.appendChild(customDropdown);
    
    // Toggle dropdown open
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close other open custom dropdowns
      document.querySelectorAll('.custom-dropdown.open').forEach(d => {
        if (d !== customDropdown) d.classList.remove('open');
      });
      customDropdown.classList.toggle('open');
    });
  });
  
  // Close custom dropdowns on click outside
  if (!window.__customDropdownsBound) {
    window.__customDropdownsBound = true;
    document.addEventListener('click', () => {
      document.querySelectorAll('.custom-dropdown.open').forEach(d => {
        d.classList.remove('open');
      });
    });
  }
}

window.initCustomDropdowns = initCustomDropdowns;

function initPlaceholders() {
  // Resolve primary and accent colors from CSS custom properties
  let primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  let accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  
  if (!primaryColor || primaryColor.startsWith('color-mix') || primaryColor.startsWith('var')) {
    primaryColor = '#1d1812';
  }
  if (!accentColor || accentColor.startsWith('color-mix') || accentColor.startsWith('var')) {
    accentColor = '#f97316';
  }

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${primaryColor}"/><stop offset="100%" stop-color="${accentColor}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)" opacity="0.85"/><g transform="translate(200, 130)" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.6"><path d="M-20,-15 L20,-15 L20,20 L-20,20 Z"/><circle cx="-6" cy="-2" r="4"/><path d="M-20,12 L-6,-2 L6,10 L12,4 L20,12"/></g><text x="50%" y="75%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="900" fill="#ffffff" letter-spacing="1.5" opacity="0.8">THE CHURCH</text></svg>`;
  const placeholderSvg = `data:image/svg+xml;base64,${btoa(svgContent)}`;


  // 1. Process img tags
  document.querySelectorAll('img').forEach(img => {
    // If src is empty or missing, set placeholder
    if (!img.getAttribute('src') || img.getAttribute('src') === '') {
      img.src = placeholderSvg;
    }
    // Set onerror fallback
    img.onerror = () => {
      img.src = placeholderSvg;
    };
    // Force trigger if already failed
    if (img.naturalWidth === 0 && img.src) {
      img.src = placeholderSvg;
    }
  });

  // 2. Process all elements with background images (including cards, thumbs, covers, heroes)
  document.querySelectorAll('*').forEach(el => {
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
    
    // Check if it's one of our target card visual covers
    const isCardCover = el.classList.contains('postimg') ||
                        el.classList.contains('media-visual') ||
                        el.classList.contains('episode-cover') ||
                        el.classList.contains('thumb') ||
                        el.classList.contains('cover') ||
                        el.classList.contains('course-cover') ||
                        el.classList.contains('event-cover') ||
                        el.classList.contains('event-img') ||
                        el.classList.contains('group-cover') ||
                        el.classList.contains('library-cover') ||
                        el.classList.contains('product-thumb') ||
                        el.classList.contains('card-thumb') ||
                        el.classList.contains('service-cover') ||
                        el.classList.contains('hero-feature');
                        
    const style = el.style.backgroundImage || getComputedStyle(el).backgroundImage;
    
    if (!style || style === 'none' || style === 'initial' || style === 'url("")') {
      // If it's a known card cover container but has no background-image, set placeholder
      if (isCardCover) {
        el.style.backgroundImage = `url("${placeholderSvg}")`;
      }
    } else {
      // Extract URL
      const match = style.match(/url\((['"]?)(.*?)\1\)/);
      if (match && match[2]) {
        const url = match[2];
        if (url.startsWith('http') || url.startsWith('/')) {
          const img = new Image();
          let loaded = false;
          img.onload = () => {
            loaded = true;
          };
          img.onerror = () => {
            loaded = true;
            el.style.setProperty('background-image', `url("${placeholderSvg}")`, 'important');
          };
          img.src = url;
          // Timeout after 3 seconds to handle very slow or hanging requests in offline/restricted sandbox environments
          setTimeout(() => {
            if (!loaded) {
              el.style.setProperty('background-image', `url("${placeholderSvg}")`, 'important');
            }
          }, 3000);
        }
      }
    }
  });
}

window.initPlaceholders = initPlaceholders;

// Run initially as fallback
initPlaceholders();

function formatCardButtons() {
  const cards = document.querySelectorAll('.card, .post, .episode, .course, .resource, .media-card, .event-card, .group-card, .product-card');
  
  cards.forEach(card => {
    // 1. Make entire cover/thumbnail and title clickable
    const title = card.querySelector('h3');
    const thumbnail = card.querySelector('.cover, .thumb, .postimg, .event-img, .course-cover, .media-visual, .episode-cover, .mini-play');
    const openBtn = card.querySelector('a.pjax-link, a[href*="-single"], a[href*="single"], a[href*="-main"], a[href*="main"], .open-page, .open-course, .open-event, .open-lesson');
    
    if (openBtn) {
      const targetUrl = openBtn.getAttribute('href') || openBtn.getAttribute('data-url') || '';
      
      // Click handler callback helper
      const triggerDetails = (e) => {
        if (e.target.tagName !== 'A' && !e.target.closest('button, .play-audio, .play-media, .download-btn, .send-btn, .enroll-btn')) {
          e.preventDefault();
          e.stopPropagation();
          openBtn.click();
        }
      };
      
      if (title && !title.classList.contains('has-click-trigger')) {
        title.style.cursor = 'pointer';
        title.classList.add('has-click-trigger');
        title.addEventListener('click', triggerDetails);
      }
      
      if (thumbnail && !thumbnail.classList.contains('has-click-trigger')) {
        thumbnail.style.cursor = 'pointer';
        thumbnail.classList.add('has-click-trigger');
        thumbnail.addEventListener('click', triggerDetails);
      }
    }
    
    // 2. Hide "open", "details", "view", or "continue" buttons, ensuring exactly 2 buttons max with icons
    const actionsContainer = card.querySelector('.res-actions, .card-actions, .episode-actions, .course-actions, .hero-actions, .postbody > .row:last-child, .body > .row:last-child, .product-info > .row:last-child, .card-body > .row:last-child');
    if (actionsContainer) {
      const buttons = Array.from(actionsContainer.querySelectorAll('button, a'));
      buttons.forEach(btn => {
        const text = btn.textContent.trim().toLowerCase();
        const isDetailsBtn = text === 'open' || 
                            text === 'details' || 
                            text === 'view' || 
                            text.includes('open page') || 
                            text.includes('open course') || 
                            text.includes('open event') || 
                            text.includes('view details') || 
                            text.includes('read article') || 
                            text.includes('view article') ||
                            btn.classList.contains('open-page') ||
                            btn.classList.contains('open-course') ||
                            btn.classList.contains('open-event') ||
                            btn.classList.contains('open-lesson');
        
        if (isDetailsBtn) {
          btn.style.setProperty('display', 'none', 'important');
        }
      });
      
      // Re-query currently visible buttons
      let visibleButtons = buttons.filter(btn => btn.style.display !== 'none');
      
      // If we have fewer than 2 visible buttons and we hid an open button, repurpose the hidden button as a Share button
      if (visibleButtons.length < 2) {
        const hiddenOpenBtn = buttons.find(btn => btn.style.display === 'none');
        if (hiddenOpenBtn) {
          hiddenOpenBtn.style.setProperty('display', 'inline-flex', 'important');
          hiddenOpenBtn.innerHTML = '<i data-lucide="share-2"></i> Share';
          hiddenOpenBtn.className = 'btn light share-btn';
          
          const newShareBtn = hiddenOpenBtn.cloneNode(true);
          hiddenOpenBtn.parentNode.replaceChild(newShareBtn, hiddenOpenBtn);
          
          newShareBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const toast = document.getElementById('toast');
            if (toast) {
              toast.innerText = 'Link copied to clipboard!';
              toast.classList.add('show');
              setTimeout(() => toast.classList.remove('show'), 2000);
            }
          });
          
          visibleButtons.push(newShareBtn);
        }
      }
      
      // Ensure all visible buttons have appropriate icons
      visibleButtons.forEach(btn => {
        if (btn.querySelector('i, svg')) return;
        
        const text = btn.textContent.toLowerCase();
        let iconName = 'tag';
        if (text.includes('download')) iconName = 'download';
        else if (text.includes('send') || text.includes('email') || text.includes('submit')) iconName = 'send';
        else if (text.includes('play') || text.includes('watch') || text.includes('listen')) iconName = 'play-circle';
        else if (text.includes('share')) iconName = 'share-2';
        else if (text.includes('add') || text.includes('buy') || text.includes('cart')) iconName = 'shopping-cart';
        else if (text.includes('enroll') || text.includes('join') || text.includes('register') || text.includes('rsvp')) iconName = 'check-circle';
        else if (text.includes('calendar')) iconName = 'calendar';
        
        btn.innerHTML = `<i data-lucide="${iconName}"></i> ` + btn.innerHTML;
      });
    }
  });
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

window.formatCardButtons = formatCardButtons;
formatCardButtons();


