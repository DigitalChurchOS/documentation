
lucide.createIcons();
const menuBtn=document.getElementById('menuBtn'),drawer=document.getElementById('drawer');
if(menuBtn&&drawer){menuBtn.onclick=()=>{drawer.classList.toggle('open');menuBtn.innerHTML=drawer.classList.contains('open')?'<i data-lucide="x"></i>':'<i data-lucide="menu"></i>';lucide.createIcons();};}
const toast=document.getElementById('toast');function showToast(m){toast.textContent=m;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800)}
document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));tab.classList.add('active');document.getElementById(tab.dataset.tab).classList.add('active')}));
document.querySelectorAll('[data-join]').forEach(btn=>btn.addEventListener('click',()=>(window.navigateToPage?window.navigateToPage('prayer-room.html'):location.href='prayer-room.html')));
document.querySelectorAll('[data-prayed]').forEach(btn=>btn.addEventListener('click',()=>{btn.classList.add('success');showToast('Your prayer participation was recorded')}));
document.querySelectorAll('[data-react]').forEach(btn=>btn.addEventListener('click',()=>{btn.classList.toggle('active');showToast(btn.textContent.trim()+' recorded')}));
document.querySelectorAll('[data-submit]').forEach(btn=>btn.addEventListener('click',()=>showToast('Submission received for moderation')));
document.querySelectorAll('[data-reminder]').forEach(btn=>btn.addEventListener('click',()=>showToast('Prayer reminder enabled')));
document.querySelectorAll('[data-alarm]').forEach(btn=>btn.addEventListener('click',()=>showToast('Prayer alarm enabled')));
document.querySelectorAll('[data-scripture]').forEach(btn=>btn.addEventListener('click',()=>showToast('Scripture opened')));
document.querySelectorAll('[data-share]').forEach(btn=>btn.addEventListener('click',()=>{navigator.clipboard?.writeText(location.href);showToast('Link copied')}));
document.querySelectorAll('[data-chat]').forEach(btn=>btn.addEventListener('click',()=>showToast('Pastoral care chat opened')));
document.querySelectorAll('[data-music]').forEach(btn=>btn.addEventListener('click',()=>showToast('Music control updated')));
