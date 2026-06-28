
lucide.createIcons();
const menuBtn=document.getElementById('menuBtn'),drawer=document.getElementById('drawer');
if(menuBtn&&drawer){menuBtn.onclick=()=>{drawer.classList.toggle('open');menuBtn.innerHTML=drawer.classList.contains('open')?'<i data-lucide="x"></i>':'<i data-lucide="menu"></i>';lucide.createIcons();};}
const toast=document.getElementById('toast');function showToast(m){toast.textContent=m;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800)}
const grid=document.getElementById('courseGrid');
if(grid){
 const search=document.getElementById('searchInput'),track=document.getElementById('trackFilter'),level=document.getElementById('levelFilter'),format=document.getElementById('formatFilter'),status=document.getElementById('statusFilter'),sort=document.getElementById('sortFilter'),count=document.getElementById('resultCount'),empty=document.getElementById('emptyState');
 function metas(){return Array.from(document.querySelectorAll('[name="meta"]:checked')).map(i=>i.value)}
 function apply(){const q=(search.value||'').toLowerCase(),t=track.value,l=level.value,f=format.value,s=status.value,m=metas();let visible=0;Array.from(grid.children).forEach(card=>{const ok=(!q||card.dataset.title.toLowerCase().includes(q)||card.dataset.tags.toLowerCase().includes(q)||card.dataset.instructor.toLowerCase().includes(q))&&(!t||card.dataset.track===t)&&(!l||card.dataset.level===l)&&(!f||card.dataset.format===f)&&(!s||card.dataset.status===s)&&(!m.length||m.every(x=>card.dataset.tags.includes(x)));card.style.display=ok?'':'none';if(ok)visible++}); Array.from(grid.children).sort((a,b)=>{if(sort.value==='oldest')return Number(b.dataset.order)-Number(a.dataset.order);if(sort.value==='az')return a.dataset.title.localeCompare(b.dataset.title);if(sort.value==='za')return b.dataset.title.localeCompare(a.dataset.title);return Number(a.dataset.order)-Number(b.dataset.order)}).forEach(c=>grid.appendChild(c));count.textContent=visible+' courses';empty.classList.toggle('show',visible===0)}
 [search,track,level,format,status,sort,...document.querySelectorAll('[name="meta"]')].forEach(el=>el.addEventListener('input',apply));
 document.querySelectorAll('[name="view"]').forEach(r=>r.addEventListener('change',()=>grid.classList.toggle('list',r.value==='list')));
 document.querySelectorAll('.track').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.track').forEach(b=>b.classList.remove('active'));btn.classList.add('active');track.value=btn.dataset.track;apply()});
 document.getElementById('clearFilters').onclick=()=>{search.value='';track.value='';level.value='';format.value='';status.value='';sort.value='newest';document.querySelectorAll('[name="meta"]').forEach(i=>i.checked=false);document.querySelector('[name="view"][value="grid"]').checked=true;grid.classList.remove('list');document.querySelectorAll('.track').forEach(b=>b.classList.remove('active'));document.querySelector('.track').classList.add('active');apply()};
 apply();
}
document.querySelectorAll('.open-course').forEach(btn=>btn.addEventListener('click',()=>(window.navigateToPage?window.navigateToPage('course-main.html'):location.href='course-main.html')));
document.querySelectorAll('.open-lesson').forEach(btn=>btn.addEventListener('click',()=>(window.navigateToPage?window.navigateToPage('lesson-single.html'):location.href='lesson-single.html')));
document.querySelectorAll('.enroll-btn').forEach(btn=>btn.addEventListener('click',()=>showToast('Enrollment started')));
document.querySelectorAll('[data-complete]').forEach(btn=>btn.addEventListener('click',()=>showToast('Lesson marked complete')));
document.querySelectorAll('[data-quiz]').forEach(btn=>btn.addEventListener('click',()=>showToast('Quiz submitted')));
document.querySelectorAll('[data-certificate]').forEach(btn=>btn.addEventListener('click',()=>showToast('Certificate downloaded')));
document.querySelectorAll('[data-reminder]').forEach(btn=>btn.addEventListener('click',()=>showToast('Reminder enabled')));
document.querySelectorAll('[data-save]').forEach(btn=>btn.addEventListener('click',()=>showToast('Progress saved')));
document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));tab.classList.add('active');document.getElementById(tab.dataset.tab).classList.add('active')}));
