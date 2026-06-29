
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
document.querySelectorAll('.open-event').forEach(btn=>btn.addEventListener('click',()=>(window.navigateToPage?window.navigateToPage('event-single.html'):location.href='event-single.html')));document.querySelectorAll('.open-register').forEach(btn=>btn.addEventListener('click',()=>(window.navigateToPage?window.navigateToPage('event-register.html'):location.href='event-register.html')));document.querySelectorAll('[data-rsvp]').forEach(btn=>btn.addEventListener('click',()=>showToast('RSVP saved')));document.querySelectorAll('[data-register]').forEach(btn=>btn.addEventListener('click',()=>showToast('Registration started')));document.querySelectorAll('[data-ticket]').forEach(btn=>btn.addEventListener('click',()=>showToast('Ticket downloaded')));document.querySelectorAll('[data-calendar]').forEach(btn=>btn.addEventListener('click',()=>showToast('Added to calendar')));document.querySelectorAll('[data-reminder]').forEach(btn=>btn.addEventListener('click',()=>showToast('Reminder enabled')));document.querySelectorAll('[data-share]').forEach(btn=>btn.addEventListener('click',()=>{navigator.clipboard?.writeText(location.href);showToast('Event link copied')}));document.querySelectorAll('.ticket-type').forEach(t=>t.addEventListener('click',()=>{document.querySelectorAll('.ticket-type').forEach(x=>x.classList.remove('active'));t.classList.add('active');const input=t.querySelector('input');if(input)input.checked=true;const total=document.getElementById('totalPrice');if(total)total.textContent=t.dataset.price||'Free'}));
