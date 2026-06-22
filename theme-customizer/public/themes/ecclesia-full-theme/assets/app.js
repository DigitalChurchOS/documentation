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
  { label: 'Worship', url: 'worship.html', icon: 'music' }
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
  if (lbl.includes('fellowship') || lbl.includes('cell')) return 'users';
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
  'worship.html': { primary: 'Listen Now', primaryUrl: 'worship.html', secondary: 'Lyrics Sheets', secondaryUrl: '#chord-charts' }
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
  return parts[parts.length - 1] || 'index.html';
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
  drawer.innerHTML = `
    <div class="drawer-close-row">
      <button class="drawer-close" id="closeDrawer" aria-label="Close menu">
        <i data-lucide="x"></i>
      </button>
    </div>

    <nav class="drawer-nav">
      <a class="pjax-link" href="index.html"><i data-lucide="home"></i> Home</a>
      <a class="pjax-link" href="about.html"><i data-lucide="info"></i> About</a>
      <a class="pjax-link" href="sermons.html"><i data-lucide="play-square"></i> Sermons</a>
      <a class="pjax-link" href="events.html"><i data-lucide="calendar-days"></i> Events</a>
      <a class="pjax-link" href="ministries.html"><i data-lucide="users-round"></i> Ministries</a>
      <a class="pjax-link" href="prayer.html"><i data-lucide="heart-handshake"></i> Prayer</a>
      <a class="pjax-link" href="contact.html"><i data-lucide="mail"></i> Contact</a>
    </nav>

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

  document.body.appendChild(shellWrapper);
  document.body.appendChild(drawer);
  document.body.appendChild(tempTab.firstElementChild);

  // 4. Bind events
  bindEvents();
  
  // 5. Initial active states and CTA load
  updateActiveStates(currentFileName);
  renderHeaderCTAs(currentFileName);
  
  // 6. Create icons
  lucide.createIcons();

  // 7. Trigger show body by adding class
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
    const menuPos = document.body.getAttribute('data-mobile-menu-position') || 'right';

    if (drawerMode === 'overlay') {
      shellWrapper.style.transform = '';
      shellWrapper.style.boxShadow = '';
    } else {
      const shift = getMobileDrawerShift(drawer);
      const sign = menuPos === 'left' ? '' : '-';
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
  // 1. Mobile Rail Drawer (Hamburger / Left)
  const menuBtn = document.getElementById('menuBtn');
  const railDrawer = document.getElementById('mobileRailDrawer');
  const railBackdrop = document.querySelector('.rail-drawer-backdrop');

  if (menuBtn && railDrawer) {
    const newMenuBtn = menuBtn.cloneNode(true);
    menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
    newMenuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = railDrawer.classList.contains('open');
      if (isOpen) {
        railDrawer.classList.remove('open');
        if (railBackdrop) railBackdrop.classList.remove('show');
      } else {
        railDrawer.classList.add('open');
        if (railBackdrop) railBackdrop.classList.add('show');
        closeMobileDrawer();
      }
    });
  }

  if (railBackdrop) {
    const newBackdrop = railBackdrop.cloneNode(true);
    railBackdrop.parentNode.replaceChild(newBackdrop, railBackdrop);
    newBackdrop.addEventListener('click', () => {
      if (railDrawer) railDrawer.classList.remove('open');
      newBackdrop.classList.remove('show');
    });
  }

  // 2. Main Mobile Drawer (Kebab / Right)
  const kebabBtn = document.getElementById('kebabBtn');
  const drawer = document.getElementById('mobileDrawer');
  if (drawer) {
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Mobile navigation');
    drawer.setAttribute('aria-hidden', String(!document.body.classList.contains('drawer-open')));
  }

  if (kebabBtn && drawer) {
    const newKebabBtn = kebabBtn.cloneNode(true);
    kebabBtn.parentNode.replaceChild(newKebabBtn, kebabBtn);
    newKebabBtn.setAttribute('aria-label', 'Open menu');
    newKebabBtn.setAttribute('aria-controls', 'mobileDrawer');
    newKebabBtn.setAttribute('aria-expanded', String(document.body.classList.contains('drawer-open')));

    newKebabBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = document.body.classList.contains('drawer-open');
      if (isOpen) {
        closeMobileDrawer();
      } else {
        openMobileDrawer();
        if (railDrawer) railDrawer.classList.remove('open');
        const activeBackdrop = document.querySelector('.rail-drawer-backdrop');
        if (activeBackdrop) activeBackdrop.classList.remove('show');
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
        if (railDrawer) railDrawer.classList.remove('open');
        const activeBackdrop = document.querySelector('.rail-drawer-backdrop');
        if (activeBackdrop) activeBackdrop.classList.remove('show');
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
      const activeBackdrop = document.querySelector('.rail-drawer-backdrop');
      if (activeRailDrawer && activeRailDrawer.classList.contains('open')) {
        if (!activeRailDrawer.contains(event.target) && (!activeMenuBtn || !activeMenuBtn.contains(event.target))) {
          activeRailDrawer.classList.remove('open');
          if (activeBackdrop) activeBackdrop.classList.remove('show');
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
        window.location.href = 'account.html';
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
      const activeMenu = document.querySelector('.account-dropdown-menu');
      const activeBtn = document.getElementById('accountBtn');
      if (activeMenu && activeMenu.style.display === 'block') {
        if (activeBtn && !activeBtn.contains(event.target) && !activeMenu.contains(event.target)) {
          activeMenu.style.display = 'none';
        }
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
  const actionsContainer = document.querySelector('.header-actions');
  if (!actionsContainer) return;
  
  const config = ctaConfig[pageFile] || ctaConfig['index.html'];
  
  let ctasHtml = '';
  if (config.secondary) {
    ctasHtml += `<a class="btn btn-soft pjax-link" href="${config.secondaryUrl}">${config.secondary}</a>`;
  }
  if (config.primary) {
    ctasHtml += `<a class="btn btn-primary pjax-link" href="${config.primaryUrl}">${config.primary}</a>`;
  }
  
  // Keep the mobile menu button
  ctasHtml += `<button class="mobile-menu-btn" id="menuBtn" aria-label="Open menu" aria-controls="mobileDrawer" aria-expanded="false"><i data-lucide="menu"></i></button>`;
  actionsContainer.innerHTML = ctasHtml;
  
  bindMobileMenu();
  bindPjaxLinks(actionsContainer);
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

      // 7. Render Lucide icons
      lucide.createIcons();

      // 8. Bind click listeners in new content
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

// Initialize on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShell);
} else {
  initShell();
}
