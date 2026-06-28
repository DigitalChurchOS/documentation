
lucide.createIcons();
const menuBtn=document.getElementById('menuBtn'),drawer=document.getElementById('drawer');
if(menuBtn&&drawer){menuBtn.onclick=()=>{drawer.classList.toggle('open');menuBtn.innerHTML=drawer.classList.contains('open')?'<i data-lucide="x"></i>':'<i data-lucide="menu"></i>';lucide.createIcons();};}
const toast=document.getElementById('toast');function showToast(m){toast.textContent=m;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800)}
function setPlayer(title='Faith That Speaks',speaker='Pastor Daniel Grace'){document.getElementById('nowTitle').textContent=title;document.getElementById('nowSpeaker').textContent=speaker;showToast('Now playing: '+title)}
const grid=document.getElementById('episodeGrid');
if(grid){
 const search=document.getElementById('searchInput'),channel=document.getElementById('channelFilter'),speaker=document.getElementById('speakerFilter'),sort=document.getElementById('sortFilter'),count=document.getElementById('resultCount'),empty=document.getElementById('emptyState');
 function metas(){return Array.from(document.querySelectorAll('[name="meta"]:checked')).map(i=>i.value)}
 function apply(){const q=(search.value||'').toLowerCase(),c=channel.value,s=speaker.value,m=metas();let visible=0;Array.from(grid.children).forEach(card=>{const ok=(!q||card.dataset.title.toLowerCase().includes(q)||card.dataset.speaker.toLowerCase().includes(q)||card.dataset.tags.toLowerCase().includes(q))&&(!c||card.dataset.channel===c)&&(!s||card.dataset.speaker===s)&&(!m.length||m.every(x=>card.dataset.tags.includes(x)));card.style.display=ok?'':'none';if(ok)visible++});Array.from(grid.children).sort((a,b)=>{if(sort.value==='oldest')return Number(b.dataset.order)-Number(a.dataset.order);if(sort.value==='az')return a.dataset.title.localeCompare(b.dataset.title);if(sort.value==='za')return b.dataset.title.localeCompare(a.dataset.title);return Number(a.dataset.order)-Number(b.dataset.order)}).forEach(card=>grid.appendChild(card));count.textContent=visible+' episodes';empty.classList.toggle('show',visible===0)}
 [search,channel,speaker,sort,...document.querySelectorAll('[name="meta"]')].forEach(el=>el.addEventListener('input',apply));
 document.querySelectorAll('[name="view"]').forEach(r=>r.addEventListener('change',()=>grid.classList.toggle('list',r.value==='list')));
 document.querySelectorAll('.channel').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.channel').forEach(b=>b.classList.remove('active'));btn.classList.add('active');channel.value=btn.dataset.channel;apply()});
 document.getElementById('clearFilters').onclick=()=>{search.value='';channel.value='';speaker.value='';sort.value='newest';document.querySelectorAll('[name="meta"]').forEach(i=>i.checked=false);document.querySelector('[name="view"][value="grid"]').checked=true;grid.classList.remove('list');document.querySelectorAll('.channel').forEach(b=>b.classList.remove('active'));document.querySelector('.channel').classList.add('active');apply()};
 apply();
}
document.querySelectorAll('.play-audio,.play-feature').forEach(btn=>btn.addEventListener('click',()=>setPlayer(btn.dataset.title||'Faith That Speaks',btn.dataset.speaker||'Pastor Daniel Grace')));
document.querySelectorAll('.open-page').forEach(btn=>btn.addEventListener('click',()=>(window.navigateToPage?window.navigateToPage('podcast-episode.html'):location.href='podcast-episode.html')));
document.querySelectorAll('.platform-list button,.actions .soft').forEach(btn=>btn.addEventListener('click',()=>showToast('Podcast link copied')));
document.getElementById('barPlay')?.addEventListener('click',()=>showToast('Playback toggled'));
document.querySelectorAll('.feedback-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.feedback-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');showToast('Feedback saved')}));
document.getElementById('commentBtn')?.addEventListener('click',()=>{const text=document.getElementById('commentText');if(!text.value.trim())return;const wrap=document.getElementById('comments');const el=document.createElement('div');el.className='comment';el.innerHTML='<strong>You</strong><span>Just now</span><p>'+text.value+'</p>';wrap.prepend(el);text.value='';showToast('Comment posted')});
document.querySelectorAll('[data-share]').forEach(btn=>btn.addEventListener('click',()=>{navigator.clipboard?.writeText(location.href);showToast('Link copied')}));
