
lucide.createIcons();

const menuBtn = document.getElementById('menuBtn');
const drawer = document.getElementById('drawer');
if (menuBtn && drawer) {
  menuBtn.onclick = () => {
    drawer.classList.toggle('open');
    menuBtn.innerHTML = drawer.classList.contains('open') ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
    lucide.createIcons();
  };
}

const toast = document.getElementById('toast');
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.checkout-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('active');
    document.getElementById('stickyMode').textContent =
      btn.dataset.target === 'standardPanel' ? 'Tithes & Offerings' : 'Partnership & Contributions';
  });
});

document.querySelectorAll('.amount').forEach(btn => {
  btn.addEventListener('click', () => {
    const panel = btn.closest('.checkout-panel');
    panel.querySelectorAll('.amount').forEach(a => a.classList.remove('active'));
    btn.classList.add('active');
    const input = panel.querySelector('.amountInput');
    input.value = btn.dataset.amount;
    panel.querySelector('.summaryAmount').textContent = '$' + btn.dataset.amount;
  });
});

document.querySelectorAll('.amountInput').forEach(input => {
  input.addEventListener('input', () => {
    const panel = input.closest('.checkout-panel');
    panel.querySelector('.summaryAmount').textContent = '$' + (input.value || 0);
  });
});

document.querySelectorAll('[data-checkout]').forEach(btn => btn.addEventListener('click', () => showToast('Secure checkout opened')));
document.querySelectorAll('[data-receipt]').forEach(btn => btn.addEventListener('click', () => showToast('Receipt downloaded')));
document.querySelectorAll('[data-qr]').forEach(btn => btn.addEventListener('click', () => showToast('QR giving opened')));
document.querySelectorAll('[data-share]').forEach(btn => btn.addEventListener('click', () => {
  navigator.clipboard?.writeText(location.href);
  showToast('Giving link copied');
}));
