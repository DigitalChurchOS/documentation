
lucide.createIcons();
const menuBtn=document.getElementById('menuBtn'),drawer=document.getElementById('drawer');
if(menuBtn&&drawer){menuBtn.onclick=()=>{drawer.classList.toggle('open');menuBtn.innerHTML=drawer.classList.contains('open')?'<i data-lucide="x"></i>':'<i data-lucide="menu"></i>';lucide.createIcons();};}
const toast=document.getElementById('toast');function showToast(m){toast.textContent=m;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800)}
function setNow(title='Sunday Celebration Replay', type='Video'){document.getElementById('nowTitle').textContent=title;document.getElementById('nowType').textContent=type;showToast('Now playing: '+title)}
const grid=document.getElementById('mediaGrid');
if(grid){
 const search=document.getElementById('searchInput'),type=document.getElementById('typeFilter'),speaker=document.getElementById('speakerFilter'),series=document.getElementById('seriesFilter'),provider=document.getElementById('providerFilter'),sort=document.getElementById('sortFilter'),count=document.getElementById('resultCount'),empty=document.getElementById('emptyState');
 function metas(){return Array.from(document.querySelectorAll('[name="meta"]:checked')).map(i=>i.value)}
 function apply(){const q=(search.value||'').toLowerCase(),t=type.value,s=speaker.value,se=series.value,p=provider.value,m=metas();let visible=0;Array.from(grid.children).forEach(card=>{const ok=(!q||card.dataset.title.toLowerCase().includes(q)||card.dataset.tags.toLowerCase().includes(q)||card.dataset.speaker.toLowerCase().includes(q))&&(!t||card.dataset.type===t)&&(!s||card.dataset.speaker===s)&&(!se||card.dataset.series===se)&&(!p||card.dataset.provider===p)&&(!m.length||m.every(x=>card.dataset.tags.includes(x)));card.style.display=ok?'':'none';if(ok)visible++});Array.from(grid.children).sort((a,b)=>sort.value==='oldest'?Number(b.dataset.order)-Number(a.dataset.order):Number(a.dataset.order)-Number(b.dataset.order)).forEach(c=>grid.appendChild(c));count.textContent=visible+' media items';empty.classList.toggle('show',visible===0)}
 [search,type,speaker,series,provider,sort,...document.querySelectorAll('[name="meta"]')].forEach(el=>el.addEventListener('input',apply));
 document.querySelectorAll('[name="view"]').forEach(r=>r.addEventListener('change',()=>grid.classList.toggle('list',r.value==='list')));
 document.querySelectorAll('.type-tab').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.type-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');type.value=btn.dataset.type;apply()});
 document.getElementById('clearFilters').onclick=()=>{search.value='';type.value='';speaker.value='';series.value='';provider.value='';sort.value='newest';document.querySelectorAll('[name="meta"]').forEach(i=>i.checked=false);document.querySelector('[name="view"][value="grid"]').checked=true;grid.classList.remove('list');document.querySelectorAll('.type-tab').forEach(b=>b.classList.remove('active'));document.querySelector('.type-tab').classList.add('active');apply()};
 apply();
}
document.querySelectorAll('.play-media').forEach(btn=>btn.addEventListener('click',()=>setNow(btn.dataset.title,btn.dataset.type)));
document.querySelectorAll('.open-page').forEach(btn=>btn.addEventListener('click',()=> {
  const url = 'media-single.html?type='+encodeURIComponent(btn.dataset.type||'Video');
  (window.navigateToPage ? window.navigateToPage(url) : location.href=url);
}));
document.querySelectorAll('[data-share]').forEach(btn=>btn.addEventListener('click',()=>{navigator.clipboard?.writeText(location.href);showToast('Link copied')}));
document.querySelectorAll('[data-download]').forEach(btn=>btn.addEventListener('click',()=>showToast('Download started')));
document.querySelectorAll('[data-embed]').forEach(btn=>btn.addEventListener('click',()=>showToast('Embed code copied')));
document.getElementById('commentBtn')?.addEventListener('click',()=>{const text=document.getElementById('commentText');if(!text.value.trim())return;const wrap=document.getElementById('comments');const el=document.createElement('div');el.className='comment';el.innerHTML='<strong>You</strong><span>Just now</span><p>'+text.value+'</p>';wrap.prepend(el);text.value='';showToast('Comment posted')});
