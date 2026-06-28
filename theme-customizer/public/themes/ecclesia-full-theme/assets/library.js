
lucide.createIcons();
const menuBtn=document.getElementById('menuBtn'),drawer=document.getElementById('drawer');
if(menuBtn&&drawer){menuBtn.onclick=()=>{drawer.classList.toggle('open');menuBtn.innerHTML=drawer.classList.contains('open')?'<i data-lucide="x"></i>':'<i data-lucide="menu"></i>';lucide.createIcons();};}
const toast=document.getElementById('toast');function showToast(m){toast.textContent=m;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800)}
function setResource(title='New Believers Foundation Guide',type='PDF Resource'){document.getElementById('downTitle').textContent=title;document.getElementById('downType').textContent=type}
const grid=document.getElementById('resourceGrid');
if(grid){
 const search=document.getElementById('searchInput'),cat=document.getElementById('categoryFilter'),type=document.getElementById('typeFilter'),access=document.getElementById('accessFilter'),sort=document.getElementById('sortFilter'),count=document.getElementById('resultCount'),empty=document.getElementById('emptyState');
 function metas(){return Array.from(document.querySelectorAll('[name="meta"]:checked')).map(i=>i.value)}
 function apply(){const q=(search.value||'').toLowerCase(),c=cat.value,t=type.value,a=access.value,m=metas();let visible=0;Array.from(grid.children).forEach(card=>{const ok=(!q||card.dataset.title.toLowerCase().includes(q)||card.dataset.tags.toLowerCase().includes(q))&&(!c||card.dataset.category===c)&&(!t||card.dataset.type===t)&&(!a||card.dataset.access===a)&&(!m.length||m.every(x=>card.dataset.tags.includes(x)));card.style.display=ok?'':'none';if(ok)visible++});Array.from(grid.children).sort((a,b)=>{if(sort.value==='oldest')return Number(b.dataset.order)-Number(a.dataset.order);if(sort.value==='az')return a.dataset.title.localeCompare(b.dataset.title);if(sort.value==='za')return b.dataset.title.localeCompare(a.dataset.title);return Number(a.dataset.order)-Number(b.dataset.order)}).forEach(card=>grid.appendChild(card));count.textContent=visible+' resources';empty.classList.toggle('show',visible===0)}
 [search,cat,type,access,sort,...document.querySelectorAll('[name="meta"]')].forEach(el=>el.addEventListener('input',apply));
 document.querySelectorAll('[name="view"]').forEach(r=>r.addEventListener('change',()=>grid.classList.toggle('list',r.value==='list')));
 document.querySelectorAll('.cat').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.cat').forEach(b=>b.classList.remove('active'));btn.classList.add('active');cat.value=btn.dataset.category;apply()});
 document.getElementById('clearFilters').onclick=()=>{search.value='';cat.value='';type.value='';access.value='';sort.value='newest';document.querySelectorAll('[name="meta"]').forEach(i=>i.checked=false);document.querySelector('[name="view"][value="grid"]').checked=true;grid.classList.remove('list');document.querySelectorAll('.cat').forEach(b=>b.classList.remove('active'));document.querySelector('.cat').classList.add('active');apply()};
 apply();
}
document.querySelectorAll('.download-btn').forEach(btn=>btn.addEventListener('click',()=>{setResource(btn.dataset.title,btn.dataset.type);showToast('Download started')}));
document.querySelectorAll('.send-btn').forEach(btn=>btn.addEventListener('click',()=>{setResource(btn.dataset.title,btn.dataset.type);showToast('Send dialog opened')}));
document.querySelectorAll('.open-page').forEach(btn=>btn.addEventListener('click',()=>(window.navigateToPage?window.navigateToPage('resource-single.html'):location.href='resource-single.html')));
document.querySelectorAll('[data-send]').forEach(btn=>btn.addEventListener('click',()=>showToast('Resource sent')));
document.querySelectorAll('[data-download]').forEach(btn=>btn.addEventListener('click',()=>showToast('Download started')));
document.querySelectorAll('[data-share]').forEach(btn=>btn.addEventListener('click',()=>{navigator.clipboard?.writeText(location.href);showToast('Link copied')}));
