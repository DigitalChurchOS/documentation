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

// Global initialization
function initShell() {
  if (document.querySelector('.shell-wrapper')) {
    // Shell already exists (SPA navigation trigger)
    return;
  }

  // 1. Extract content from original page
  const originalTitle = document.title;
  const originalMain = document.querySelector('main');
  const originalHeader = document.querySelector('header');
  const originalFooter = document.querySelector('footer');
  
  const headerAttrs = originalHeader ? Array.from(originalHeader.attributes).map(a => `${a.name}="${a.value}"`).join(' ') : 'class="header"';
  const footerAttrs = originalFooter ? Array.from(originalFooter.attributes).map(a => `${a.name}="${a.value}"`).join(' ') : 'class="footer"';
  
  // Move originalMain's child nodes to a new content outlet.
  // This preserves any event listeners already registered on them.
  const contentOutlet = document.createElement('main');
  contentOutlet.id = 'content-outlet';
  if (originalMain) {
    while (originalMain.firstChild) {
      contentOutlet.appendChild(originalMain.firstChild);
    }
  }
  const currentFileName = getPageFileName(window.location.pathname);

  // 2. Build shell layout
  const shellWrapper = document.createElement('div');
  shellWrapper.className = 'shell-wrapper';

  // 3. Clear body and build shell using preserved nodes
  const originalTopNotice = document.querySelector('.top-notice');
  
  // Left vertical rail HTML
  let railHtml = `
    <aside class="left-rail">
      <nav class="rail-nav">
  `;
  railItems.forEach(item => {
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

  // Mobile bottom tab bar HTML
  let mobileTabHtml = `<div class="mobile-tab-rail">`;
  railItems.forEach(item => {
    if (item.label === 'Livestream' || item.label === 'LMS') return;
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
  
  const shellBody = document.createElement('div');
  shellBody.className = 'main-shell-body';
  
  const tempRail = document.createElement('div');
  tempRail.innerHTML = railHtml;
  shellBody.appendChild(tempRail.firstElementChild);
  
  shellBody.appendChild(contentOutlet);
  shellWrapper.appendChild(shellBody);
  
  if (originalFooter) shellWrapper.appendChild(originalFooter);
  
  const tempTab = document.createElement('div');
  tempTab.innerHTML = mobileTabHtml;
  shellWrapper.appendChild(tempTab.firstElementChild);

  document.body.appendChild(shellWrapper);



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

// Bind mobile drawer menu
function bindMobileMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const drawer = document.getElementById('mobileDrawer');
  if (menuBtn && drawer) {
    // Remove old listeners by cloning and replacing
    const newMenuBtn = menuBtn.cloneNode(true);
    menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);

    newMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      drawer.classList.toggle('open');
      newMenuBtn.innerHTML = drawer.classList.contains('open') ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
      lucide.createIcons();
    });

    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        drawer.classList.remove('open');
        newMenuBtn.innerHTML = '<i data-lucide="menu"></i>';
        lucide.createIcons();
      });
    });
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
  ctasHtml += `<button class="mobile-menu-btn" id="menuBtn"><i data-lucide="menu"></i></button>`;
  actionsContainer.innerHTML = ctasHtml;
  
  bindMobileMenu();
  bindPjaxLinks(actionsContainer);
}

// Highlight active links in left rail, header nav, and mobile tab bar
function updateActiveStates(pageFile) {
  // Normalize filenames
  const targetPage = pageFile === '' ? 'index.html' : pageFile;

  // Left rail
  document.querySelectorAll('.left-rail .rail-nav .rail-item').forEach(link => {
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

  // Fade out effect
  document.body.classList.add('page-loading');
  contentOutlet.style.opacity = '0.3';

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
