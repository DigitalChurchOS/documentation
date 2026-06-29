
lucide.createIcons();
const menuBtn=document.getElementById('menuBtn'),drawer=document.getElementById('drawer');
if(menuBtn&&drawer){menuBtn.onclick=()=>{drawer.classList.toggle('open');menuBtn.innerHTML=drawer.classList.contains('open')?'<i data-lucide="x"></i>':'<i data-lucide="menu"></i>';lucide.createIcons();};}
const toast=document.getElementById('toast');function showToast(m){toast.textContent=m;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800)}
function initCountdowns() {
  const countdownContainers = document.querySelectorAll('.featured-event-countdown');
  countdownContainers.forEach(container => {
    let targetTimeStr = container.getAttribute('data-time');
    if (!targetTimeStr) {
      const parentWithTime = container.closest('[data-time]');
      if (parentWithTime) targetTimeStr = parentWithTime.getAttribute('data-time');
    }
    
    let targetDate;
    if (targetTimeStr) {
      targetDate = new Date(targetTimeStr);
    } else {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 18);
      targetDate.setHours(9, 0, 0, 0);
    }

    function tick() {
      const diff = Math.max(0, targetDate - new Date());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor(diff / 3600000) % 24;
      const m = Math.floor(diff / 60000) % 60;
      const s = Math.floor(diff / 1000) % 60;

      const daysEl = container.querySelector('#days');
      const hoursEl = container.querySelector('#hours');
      const minsEl = container.querySelector('#minutes');
      const secsEl = container.querySelector('#seconds');

      if (daysEl) daysEl.textContent = String(d).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(m).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(s).padStart(2, '0');
    }

    tick();
    const intervalId = setInterval(tick, 1000);
    if (container.dataset.intervalId) clearInterval(Number(container.dataset.intervalId));
    container.dataset.intervalId = String(intervalId);
  });
}
initCountdowns();

function updateFeaturedEventDOM(featuredCard) {
  const container = document.getElementById('featuredEventContainer');
  if (!container) return;
  if (featuredCard) {
    container.style.display = 'block';
    const title = featuredCard.querySelector('.event-title').textContent;
    const url = featuredCard.querySelector('a.open-event')?.getAttribute('href') || 'event-single.html';
    const imgUrl = featuredCard.querySelector('.event-img')?.style.backgroundImage || '';
    const month = featuredCard.querySelector('.event-month')?.textContent || '';
    const day = featuredCard.querySelector('.event-day')?.textContent || '';
    const location = featuredCard.querySelector('.event-location')?.innerHTML || '';
    const desc = featuredCard.querySelector('.event-desc')?.textContent || '';
    const price = featuredCard.querySelector('.event-price')?.innerHTML || '';
    const badgesHTML = featuredCard.querySelector('.badges')?.innerHTML || '';
    const modeBadgeHTML = featuredCard.querySelector('.event-mode-badge')?.outerHTML || '';
    const targetTime = featuredCard.getAttribute('data-time') || featuredCard.dataset.time || '';
    
    // Strip time badge from badges if it somehow got in
    let cleanBadgesHTML = badgesHTML;
    if (cleanBadgesHTML) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = cleanBadgesHTML;
      tempDiv.querySelectorAll('.time-badge').forEach(el => el.remove());
      cleanBadgesHTML = tempDiv.innerHTML;
    }

    container.innerHTML = `
      <div class="featured-event-card">
        <a href="${url}" class="featured-event-img open-event" style="background-image: ${imgUrl}">
          ${cleanBadgesHTML ? `<div class="badges">${cleanBadgesHTML}</div>` : ''}
          ${modeBadgeHTML}
        </a>
        <div class="featured-event-body">
          <div class="featured-event-meta">
            <div class="featured-event-date">
              <span class="event-month">${month}</span>
              <span class="event-day">${day}</span>
            </div>
            <div class="featured-event-details">
              <div class="event-location">${location}</div>
              <h2 class="featured-event-title"><a href="${url}" class="open-event">${title}</a></h2>
              <p class="featured-event-desc">${desc}</p>
              <div class="event-price">${price}</div>
            </div>
          </div>
          <div class="featured-event-countdown" data-time="${targetTime}">
            <div class="countdown-label">Event starts in:</div>
            <div class="countdown-timer">
              <div class="countdown-item"><strong id="days">00</strong><span>Days</span></div>
              <div class="countdown-item"><strong id="hours">00</strong><span>Hrs</span></div>
              <div class="countdown-item"><strong id="minutes">00</strong><span>Mins</span></div>
              <div class="countdown-item"><strong id="seconds">00</strong><span>Secs</span></div>
            </div>
          </div>
          <div class="featured-event-actions">
            <button class="btn primary open-register">Register Now</button>
            <button class="btn light open-event">Event Details</button>
            <button class="btn soft" data-share><i data-lucide="share-2"></i> Share</button>
          </div>
        </div>
      </div>
    `;
    lucide.createIcons({ node: container });
    container.querySelectorAll('.open-event').forEach(btn => btn.addEventListener('click', () => (window.navigateToPage ? window.navigateToPage('event-single.html') : location.href = 'event-single.html')));
    container.querySelectorAll('.open-register').forEach(btn => btn.addEventListener('click', () => (window.navigateToPage ? window.navigateToPage('event-register.html') : location.href = 'event-register.html')));
    container.querySelectorAll('[data-share]').forEach(btn => btn.addEventListener('click', () => {
      navigator.clipboard?.writeText(location.href);
      showToast('Event link copied');
    }));
    initCountdowns();
  } else {
    container.style.display = 'none';
  }
}

function setupFeaturedEvent() {
  const container = document.getElementById('featuredEventContainer');
  if (!container) return;
  const grid = document.getElementById('eventGrid') || document.querySelector('.cards-3');
  if (!grid) return;
  const cards = Array.from(grid.children).filter(el => el.classList.contains('event-card'));
  if (!cards.length) {
    container.style.display = 'none';
    return;
  }
  let featuredCard = cards.find(card => card.dataset.featured === 'true' || card.classList.contains('featured'));
  if (!featuredCard) {
    featuredCard = cards[0];
  }
  if (featuredCard) {
    cards.forEach(c => c.style.setProperty('display', '', 'important'));
    featuredCard.style.setProperty('display', 'none', 'important');
    updateFeaturedEventDOM(featuredCard);
  } else {
    container.style.display = 'none';
  }
}
window.setupFeaturedEvent = setupFeaturedEvent;

const grid=document.getElementById('eventGrid');
if(grid){
  const search=document.getElementById('searchInput'),cat=document.getElementById('categoryFilter'),type=document.getElementById('typeFilter'),price=document.getElementById('priceFilter'),mode=document.getElementById('modeFilter'),sort=document.getElementById('sortFilter'),count=document.getElementById('resultCount'),empty=document.getElementById('emptyState');
  function metas(){return Array.from(document.querySelectorAll('[name="meta"]:checked')).map(i=>i.value)}
  function apply(){
    const q=(search.value||'').toLowerCase(),c=cat.value,t=type.value,p=price.value,mo=mode.value,m=metas();
    let visible=0;
    const sorted = Array.from(grid.children).sort((a,b)=>{
      if(sort.value==='oldest')return Number(b.dataset.order)-Number(a.dataset.order);
      if(sort.value==='az')return a.dataset.title.localeCompare(b.dataset.title);
      if(sort.value==='za')return b.dataset.title.localeCompare(a.dataset.title);
      return Number(a.dataset.order)-Number(b.dataset.order);
    });
    sorted.forEach(el => grid.appendChild(el));
    sorted.forEach(card=>{
      const ok=(!q||card.dataset.title.toLowerCase().includes(q)||card.dataset.tags.toLowerCase().includes(q))&&(!c||card.dataset.category===c)&&(!t||card.dataset.type===t)&&(!p||card.dataset.price===p)&&(!mo||card.dataset.mode===mo)&&(!m.length||m.every(x=>card.dataset.tags.includes(x)));
      card.dataset.matchesFilter = ok ? 'true' : 'false';
    });
    let featuredCandidate = sorted.find(card => card.dataset.matchesFilter === 'true' && (card.dataset.featured === 'true' || card.classList.contains('featured')));
    if (!featuredCandidate) {
      featuredCandidate = sorted.find(card => card.dataset.matchesFilter === 'true');
    }
    sorted.forEach(card => {
      const ok = card.dataset.matchesFilter === 'true';
      if (ok) {
        if (card === featuredCandidate) {
          card.style.setProperty('display', 'none', 'important');
        } else {
          card.style.setProperty('display', '', 'important');
          visible++;
        }
      } else {
        card.style.setProperty('display', 'none', 'important');
      }
    });
    updateFeaturedEventDOM(featuredCandidate);
    const totalVisible = visible + (featuredCandidate ? 1 : 0);
    count.textContent=totalVisible+' events';
    empty.classList.toggle('show',totalVisible===0);
  }
  [search,cat,type,price,mode,sort,...document.querySelectorAll('[name="meta"]')].forEach(el=>el.addEventListener('input',apply));
  document.querySelectorAll('[name="view"]').forEach(r=>r.addEventListener('change',()=>grid.classList.toggle('list',r.value==='list')));
  document.querySelectorAll('.cat').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.cat').forEach(b=>b.classList.remove('active'));btn.classList.add('active');cat.value=btn.dataset.category;apply()});
  document.getElementById('clearFilters').onclick=()=>{search.value='';cat.value='';type.value='';price.value='';mode.value='';sort.value='newest';document.querySelectorAll('[name="meta"]').forEach(i=>i.checked=false);document.querySelector('[name="view"][value="grid"]').checked=true;grid.classList.remove('list');document.querySelectorAll('.cat').forEach(b=>b.classList.remove('active'));document.querySelector('.cat').classList.add('active');apply()};
  apply();
}
if (!grid) {
  setupFeaturedEvent();
}
// Robust fallback: re-run after frame paint in case DOM wasn't ready
requestAnimationFrame(function() {
  if (!document.getElementById('eventGrid')) {
    setupFeaturedEvent();
  }
});
// Also run on window load as ultimate fallback
window.addEventListener('load', function() {
  if (!document.getElementById('eventGrid')) {
    setupFeaturedEvent();
  }
});
document.querySelectorAll('.open-event').forEach(btn=>btn.addEventListener('click',()=>(window.navigateToPage?window.navigateToPage('event-single.html'):location.href='event-single.html')));
document.querySelectorAll('[data-rsvp]').forEach(btn=>btn.addEventListener('click',()=>showToast('RSVP saved')));
document.querySelectorAll('[data-register]').forEach(btn=>btn.addEventListener('click',()=>showToast('Registration started')));
document.querySelectorAll('[data-ticket]').forEach(btn=>btn.addEventListener('click',()=>showToast('Ticket downloaded')));
document.querySelectorAll('[data-reminder]').forEach(btn=>btn.addEventListener('click',()=>showToast('Reminder enabled')));
document.querySelectorAll('.ticket-type').forEach(t=>t.addEventListener('click',()=>{document.querySelectorAll('.ticket-type').forEach(x=>x.classList.remove('active'));t.classList.add('active');const input=t.querySelector('input');if(input)input.checked=true;const total=document.getElementById('totalPrice');if(total)total.textContent=t.dataset.price||'Free'}));

// ====================================================
// REGISTRATION MODAL FLOW
// ====================================================
(function() {
  // Inject Registration Modal if not exists
  if (!document.getElementById('eventRegisterModal')) {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'eventRegisterModal';
    modalDiv.className = 'universal-modal-overlay';
    modalDiv.innerHTML = `
      <div class="universal-modal-card" style="max-width: 520px !important;">
        <button class="modal-close-btn" id="eventRegisterClose"><i data-lucide="x"></i></button>
        <h3 class="modal-title">Event Registration</h3>
        <p class="modal-desc" id="registerModalSubTitle">Register for Kingdom Leadership Conference</p>
        
        <form id="eventRegisterForm" style="display: grid; gap: 16px;">
          <div class="field">
            <label for="regName">Full Name</label>
            <input type="text" id="regName" class="input" required placeholder="Enter your full name">
          </div>
          <div class="field">
            <label for="regEmail">Email Address</label>
            <input type="email" id="regEmail" class="input" required placeholder="name@example.com">
          </div>
          <div class="field">
            <label for="regPhone">Phone Number</label>
            <input type="tel" id="regPhone" class="input" required placeholder="+1 (555) 000-0000">
          </div>
          <div class="field" id="regTicketWrapper">
            <label for="regTicket">Ticket Type</label>
            <select id="regTicket" class="select" style="padding-left: 14px !important;">
              <option value="standard">Standard Pass - $35</option>
              <option value="vip">VIP Premium Pass - $75</option>
              <option value="online">Online Replay Only - Free</option>
            </select>
          </div>
          <button type="submit" class="btn primary" style="width: 100%; margin-top: 8px;">Complete Registration</button>
        </form>

        <div id="eventRegisterSuccess" style="display: none; text-align: center;">
          <div style="width: 64px; height: 64px; background: rgba(22, 163, 74, 0.1); color: var(--green, #16a34a); border-radius: 99px; display: grid; place-items: center; margin: 0 auto 16px;">
            <i data-lucide="check-circle" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 class="modal-title" style="margin-bottom: 8px;">Registration Confirmed!</h3>
          <p class="modal-desc" style="margin-bottom: 20px;">You've successfully reserved your ticket. A confirmation email with details has been sent.</p>
          
          <div class="ticket-preview" style="grid-template-columns: 1fr; margin-bottom: 20px; text-align: left; background: #fffaf3; border: 1px dashed var(--border); border-radius: 16px; padding: 0;">
            <div style="padding: 16px; border-bottom: 1px dashed var(--border);">
              <strong id="ticketEventName" style="display: block; font-size: 16px; margin-bottom: 4px; color: var(--text);">Kingdom Leadership Conference</strong>
              <span id="ticketEventMeta" style="font-size: 13px; color: var(--text-muted);">July 28, 2026 · 9:00 AM</span>
            </div>
            <div style="padding: 16px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <span style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 800; display: block; margin-bottom: 2px;">Attendee</span>
                <strong id="ticketAttendeeName" style="color: var(--text);">Guest User</strong>
              </div>
              <div>
                <span style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 800; display: block; margin-bottom: 2px;">Pass Type</span>
                <strong id="ticketPassType" style="color: var(--text);">Standard</strong>
              </div>
            </div>
          </div>

          <button class="btn light" id="eventRegisterDoneBtn" style="width: 100%;">Close Window</button>
        </div>
      </div>
    </div>
    `;
    document.body.appendChild(modalDiv);
  }

  const regModal = document.getElementById('eventRegisterModal');
  const regClose = document.getElementById('eventRegisterClose');
  const regDoneBtn = document.getElementById('eventRegisterDoneBtn');
  const regForm = document.getElementById('eventRegisterForm');
  const regSuccess = document.getElementById('eventRegisterSuccess');
  const subTitle = document.getElementById('registerModalSubTitle');

  const ticketEventName = document.getElementById('ticketEventName');
  const ticketEventMeta = document.getElementById('ticketEventMeta');
  const ticketAttendeeName = document.getElementById('ticketAttendeeName');
  const ticketPassType = document.getElementById('ticketPassType');

  let currentEventName = '';
  let currentEventMeta = '';

  window.openRegisterModal = function(title, meta, priceInfo) {
    currentEventName = title || 'Kingdom Leadership Conference';
    currentEventMeta = meta || 'July 28, 2026 · 9:00 AM';
    
    // Customize select options if priceInfo matches free
    const isFree = priceInfo?.toLowerCase().includes('free') || false;
    const ticketSelect = document.getElementById('regTicket');
    if (ticketSelect) {
      if (isFree) {
        ticketSelect.innerHTML = `<option value="free">Free Admission Pass</option>`;
      } else {
        ticketSelect.innerHTML = `
          <option value="standard">Standard Pass - $35</option>
          <option value="vip">VIP Premium Pass - $75</option>
          <option value="online">Online Replay Only - Free</option>
        `;
      }
    }

    if (subTitle) subTitle.textContent = `Register for ${currentEventName}`;
    
    // Reset view
    if (regForm) regForm.style.display = 'grid';
    if (regSuccess) regSuccess.style.display = 'none';
    if (regForm) regForm.reset();

    regModal.classList.add('open');
    if (window.lucide) window.lucide.createIcons({ node: regModal });
  };

  // Close handlers
  const closeRegister = function() {
    regModal.classList.remove('open');
  };
  if (regClose) regClose.onclick = closeRegister;
  if (regDoneBtn) regDoneBtn.onclick = closeRegister;
  regModal.onclick = function(e) {
    if (e.target === regModal) closeRegister();
  };

  // Form Submission
  if (regForm) {
    regForm.onsubmit = function(e) {
      e.preventDefault();
      
      const attendeeName = document.getElementById('regName').value;
      const ticketSelect = document.getElementById('regTicket');
      const passText = ticketSelect ? ticketSelect.options[ticketSelect.selectedIndex].text.split(' - ')[0] : 'Standard';

      // Set ticket values
      if (ticketEventName) ticketEventName.textContent = currentEventName;
      if (ticketEventMeta) ticketEventMeta.textContent = currentEventMeta;
      if (ticketAttendeeName) ticketAttendeeName.textContent = attendeeName;
      if (ticketPassType) ticketPassType.textContent = passText;

      // Switch views
      regForm.style.display = 'none';
      regSuccess.style.display = 'block';
      
      if (window.lucide) window.lucide.createIcons({ node: regSuccess });

      // Notify customizer/user
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = 'Registration completed!';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1800);
      }
    };
  }

  // Intercept click on open-register buttons
  document.addEventListener('click', function(e) {
    const regBtn = e.target.closest('.open-register');
    if (regBtn) {
      e.preventDefault();
      e.stopPropagation();

      // Scrape context for event information
      let eventTitle = 'Kingdom Leadership Conference';
      let eventMeta = 'July 28, 2026 · 9:00 AM';
      let eventPrice = '$35';

      // Try finding single page details
      const singleHero = regBtn.closest('.single-hero');
      if (singleHero) {
        eventTitle = singleHero.querySelector('h1')?.textContent || eventTitle;
        const timeVal = singleHero.querySelector('.featured-event-countdown')?.getAttribute('data-time') || '';
        if (timeVal) {
          const dateObj = new Date(timeVal);
          eventMeta = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ' · ' + dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        eventPrice = singleHero.querySelector('.price')?.textContent || eventPrice;
      }

      // Try finding featured event card details
      const featured = regBtn.closest('.featured-card') || regBtn.closest('.featured-event-card');
      if (featured) {
        eventTitle = featured.querySelector('.featured-event-title')?.textContent || eventTitle;
        const month = featured.querySelector('.event-month')?.textContent || 'JUL';
        const day = featured.querySelector('.event-day')?.textContent || '28';
        eventMeta = `${month} ${day}, 2026 · 9:00 AM`;
        eventPrice = featured.querySelector('.event-price')?.textContent || eventPrice;
      }

      // Try finding standard grid card details
      const card = regBtn.closest('.event-card');
      if (card) {
        eventTitle = card.querySelector('.event-title')?.textContent || eventTitle;
        const month = card.querySelector('.event-month')?.textContent || 'JUL';
        const day = card.querySelector('.event-day')?.textContent || '28';
        eventMeta = `${month} ${day}, 2026 · 9:00 AM`;
        eventPrice = card.querySelector('.event-price')?.textContent || eventPrice;
      }

      window.openRegisterModal(eventTitle, eventMeta, eventPrice);
    }
  });

})();
