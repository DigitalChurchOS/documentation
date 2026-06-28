lucide.createIcons();
const menuBtn=document.getElementById('menuBtn'),drawer=document.getElementById('drawer');
if(menuBtn&&drawer){menuBtn.onclick=()=>{drawer.classList.toggle('open');menuBtn.innerHTML=drawer.classList.contains('open')?'<i data-lucide="x"></i>':'<i data-lucide="menu"></i>';lucide.createIcons();};}
function toast(m){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function initArchive(){const grid=document.getElementById('postGrid');if(!grid)return;const search=document.getElementById('searchInput'),channel=document.getElementById('channelFilter'),author=document.getElementById('authorFilter'),sort=document.getElementById('sortFilter'),count=document.getElementById('resultCount'),empty=document.getElementById('emptyState');function tags(){return Array.from(document.querySelectorAll('[name="tag"]:checked')).map(i=>i.value)}function apply(){const q=(search.value||'').toLowerCase(),c=channel.value,a=author.value,tg=tags();let visible=0;Array.from(grid.children).forEach(card=>{const ok=(!q||card.dataset.title.toLowerCase().includes(q)||card.dataset.author.toLowerCase().includes(q)||card.dataset.tags.toLowerCase().includes(q))&&(!c||card.dataset.channel===c)&&(!a||card.dataset.author===a)&&(!tg.length||tg.every(x=>card.dataset.tags.includes(x)));card.style.display=ok?'':'none';if(ok)visible++});Array.from(grid.children).sort((x,y)=>{if(sort.value==='oldest')return Number(y.dataset.order)-Number(x.dataset.order);if(sort.value==='az')return x.dataset.title.localeCompare(y.dataset.title);if(sort.value==='za')return y.dataset.title.localeCompare(x.dataset.title);return Number(x.dataset.order)-Number(y.dataset.order)}).forEach(c=>grid.appendChild(c));empty.classList.toggle('show',visible===0);count.textContent=visible+' articles'}[search,channel,author,sort,...document.querySelectorAll('[name="tag"]')].forEach(el=>el.addEventListener('input',apply));document.querySelectorAll('[name="view"]').forEach(r=>r.addEventListener('change',()=>grid.classList.toggle('list',r.value==='list')));document.querySelectorAll('.channel-tab').forEach(tab=>tab.onclick=()=>{document.querySelectorAll('.channel-tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');channel.value=tab.dataset.channel||'';apply()});document.getElementById('clearFilters')?.addEventListener('click',()=>{search.value='';channel.value='';author.value='';sort.value='newest';document.querySelectorAll('[name="tag"]').forEach(i=>i.checked=false);document.querySelector('[name="view"][value="grid"]').checked=true;grid.classList.remove('list');apply()});apply()}
function initArticle() {
  const progress = document.getElementById('progress');
  if (progress) {
    window.addEventListener('scroll', () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = h > 0 ? ((window.scrollY / h) * 100) + '%' : '0%';
    });
  }

  // Scripture copy button
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.onclick = () => {
      const scriptureText = btn.closest('.scripture')?.querySelector('blockquote')?.innerText || '';
      navigator.clipboard?.writeText(scriptureText);
      toast('Scripture text copied to clipboard');
    };
  });

  // Share buttons
  document.querySelectorAll('[data-share]').forEach(btn => {
    btn.onclick = () => {
      navigator.clipboard?.writeText(window.location.href);
      toast('Article link copied to clipboard');
    };
  });

  // Bookmark / Save Article
  document.querySelectorAll('[data-save]').forEach(btn => {
    btn.onclick = () => {
      btn.classList.toggle('primary');
      btn.classList.toggle('light');
      const isSaved = btn.classList.contains('primary');
      btn.innerHTML = isSaved ? '<i data-lucide="bookmark-check"></i> Saved' : '<i data-lucide="bookmark"></i> Save Article';
      lucide.createIcons();
      toast(isSaved ? 'Saved to reading list' : 'Removed from reading list');
    };
  });

  // Table of Contents Scrollspy using IntersectionObserver
  const articleContent = document.querySelector('.article-content');
  const tocLinks = document.querySelectorAll('.toc-link');
  if (articleContent && tocLinks.length > 0) {
    const headings = articleContent.querySelectorAll('h2[id]');
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -60% 0px',
      threshold: 0
    };

    let activeHeadingId = '';
    const headingObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          activeHeadingId = entry.target.getAttribute('id');
          updateActiveTocLink();
        }
      });
    }, observerOptions);

    headings.forEach(heading => headingObserver.observe(heading));

    function updateActiveTocLink() {
      tocLinks.forEach(link => {
        const href = link.getAttribute('href')?.substring(1);
        link.classList.toggle('active', href === activeHeadingId);
      });
    }
  }

  // Font style preferences
  const fontSansBtn = document.getElementById('fontSansBtn');
  const fontSerifBtn = document.getElementById('fontSerifBtn');
  if (fontSansBtn && fontSerifBtn && articleContent) {
    fontSansBtn.onclick = () => {
      fontSansBtn.classList.add('active');
      fontSerifBtn.classList.remove('active');
      articleContent.classList.remove('serif-mode');
      toast('Sans-serif typography selected');
    };
    fontSerifBtn.onclick = () => {
      fontSerifBtn.classList.add('active');
      fontSansBtn.classList.remove('active');
      articleContent.classList.add('serif-mode');
      toast('Serif reading typography selected');
    };
  }

  // Font size adjuster
  const fontSizeSlider = document.getElementById('fontSizeSlider');
  if (fontSizeSlider && articleContent) {
    fontSizeSlider.oninput = (e) => {
      const size = e.target.value;
      articleContent.style.fontSize = size + 'px';
      articleContent.querySelectorAll('p, li').forEach(el => {
        el.style.fontSize = size + 'px';
      });
    };
  }

  // Comments Section
  const commentsToggle = document.getElementById('commentsToggle');
  const commentsContainer = document.getElementById('commentsContainer');
  if (commentsToggle && commentsContainer) {
    commentsToggle.onchange = () => {
      commentsContainer.style.display = commentsToggle.checked ? 'block' : 'none';
      toast(commentsToggle.checked ? 'Comments enabled' : 'Comments disabled');
    };
  }

  // Comment Form Submission
  const commentForm = document.getElementById('commentForm');
  const commentList = document.getElementById('commentList');
  if (commentForm && commentList) {
    commentForm.onsubmit = (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('commentName');
      const textInput = document.getElementById('commentText');
      if (!nameInput || !textInput) return;

      const name = nameInput.value.trim() || 'Anonymous';
      const text = textInput.value.trim();
      if (!text) return;

      // Create comment card HTML
      const firstInitial = name.charAt(0).toUpperCase();
      const newCard = document.createElement('div');
      newCard.className = 'comment-card';
      newCard.innerHTML = `
        <div class="avatar">${firstInitial}</div>
        <div class="comment-card-body">
          <div class="comment-card-header">
            <span class="comment-author">${name}</span>
            <span class="comment-time">Just now</span>
          </div>
          <p class="comment-text">${text}</p>
          <div class="comment-actions">
            <button class="comment-like-btn" onclick="likeComment(this)">
              <i data-lucide="thumbs-up"></i> <span class="like-count">0</span> likes
            </button>
          </div>
        </div>
      `;

      // Prepend to list
      commentList.insertBefore(newCard, commentList.firstChild);

      // Reset form
      textInput.value = '';
      
      // Update Lucide icons
      lucide.createIcons();

      toast('Comment posted successfully');
    };
  }
}

// Global scope helper for liking comments
window.likeComment = function(btn) {
  btn.classList.toggle('liked');
  const countEl = btn.querySelector('.like-count');
  if (countEl) {
    let count = parseInt(countEl.innerText) || 0;
    const isLiked = btn.classList.contains('liked');
    count = isLiked ? count + 1 : count - 1;
    countEl.innerText = count;
    
    btn.innerHTML = isLiked 
      ? '<i data-lucide="thumbs-up" style="fill: var(--accent); stroke: var(--accent);"></i> <span class="like-count">' + count + '</span> likes'
      : '<i data-lucide="thumbs-up"></i> <span class="like-count">' + count + '</span> likes';
    lucide.createIcons();
  }
};

initArchive();initArticle();
