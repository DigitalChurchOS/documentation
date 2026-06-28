// Small Groups & Cells interactive javascript logic
document.addEventListener('DOMContentLoaded', () => {
  // Check if we are on the archive or single page
  if (document.getElementById('groupGrid')) {
    initGroupsArchive();
  }
  if (document.getElementById('joinForm')) {
    initGroupSingle();
  }
});

function toast(message) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

function initGroupsArchive() {
  const grid = document.getElementById('groupGrid');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const dayFilter = document.getElementById('dayFilter');
  const locationFilter = document.getElementById('locationFilter');
  const countSpan = document.getElementById('resultCount');
  const emptyState = document.getElementById('emptyState');
  const clearBtn = document.getElementById('clearFilters');
  const categoryTabs = document.querySelectorAll('.category-tab');

  if (!grid) return;

  function applyFilters() {
    const query = (searchInput.value || '').toLowerCase().trim();
    const category = categoryFilter.value;
    const day = dayFilter.value;
    const location = locationFilter.value;

    let visibleCount = 0;
    const cards = Array.from(grid.children);

    cards.forEach(card => {
      // Extract filter data attributes
      const cardCategory = card.dataset.category || '';
      const cardDay = card.dataset.day || '';
      const cardLocation = card.dataset.location || '';
      const cardTitle = (card.querySelector('h3')?.textContent || '').toLowerCase();
      const cardDesc = (card.querySelector('p')?.textContent || '').toLowerCase();
      const cardLeader = (card.querySelector('.group-leader-row')?.textContent || '').toLowerCase();

      // Check match conditions
      const matchesQuery = !query || 
        cardTitle.includes(query) || 
        cardDesc.includes(query) || 
        cardLeader.includes(query) ||
        cardCategory.toLowerCase().includes(query) ||
        cardDay.toLowerCase().includes(query);

      const matchesCategory = !category || cardCategory === category;
      const matchesDay = !day || cardDay === day;
      const matchesLocation = !location || cardLocation === location;

      const isVisible = matchesQuery && matchesCategory && matchesDay && matchesLocation;
      
      card.style.display = isVisible ? '' : 'none';
      if (isVisible) {
        visibleCount++;
      }
    });

    // Update count display
    if (countSpan) {
      countSpan.textContent = `${visibleCount} group${visibleCount === 1 ? '' : 's'} found`;
    }

    // Toggle empty state
    if (emptyState) {
      if (visibleCount === 0) {
        emptyState.style.display = 'block';
      } else {
        emptyState.style.display = 'none';
      }
    }
  }

  // Bind input and dropdown changes
  [searchInput, categoryFilter, dayFilter, locationFilter].forEach(el => {
    if (el) el.addEventListener('input', applyFilters);
  });

  // Bind category tab buttons
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (categoryFilter) {
        categoryFilter.value = tab.dataset.category || '';
        applyFilters();
      }
    });
  });

  // Clear filters
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (categoryFilter) categoryFilter.value = '';
      if (dayFilter) dayFilter.value = '';
      if (locationFilter) locationFilter.value = '';
      
      categoryTabs.forEach(t => {
        if (t.dataset.category === '') {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });
      
      applyFilters();
      toast('Filters cleared');
    });
  }

  // Initial call
  applyFilters();
}

function initGroupSingle() {
  const form = document.getElementById('joinForm');
  const saveBtn = document.getElementById('saveGroupBtn');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Simulate form submission
      const name = document.getElementById('joinName')?.value || 'Friend';
      const email = document.getElementById('joinEmail')?.value;
      
      if (!email) return;

      const container = form.parentElement;
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; animation: fadeInOverlay 0.3s ease;">
          <div style="width: 60px; height: 60px; border-radius: 50%; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); display: grid; place-items: center; margin: 0 auto 20px;">
            <i data-lucide="check-circle-2" style="width: 32px; height: 32px;"></i>
          </div>
          <h3 style="margin-bottom: 10px;">Request Sent!</h3>
          <p style="color: var(--muted); font-size: 15px; margin-bottom: 24px;">
            Thank you, <strong>${name}</strong>. The group leader has been notified and will contact you at <strong>${email}</strong> shortly with meeting details.
          </p>
          <a class="btn btn-primary" href="groups-archive.html" style="width: auto; display: inline-flex;">Back to Groups</a>
        </div>
      `;
      lucide.createIcons();
      toast('Join request sent successfully!');
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveBtn.classList.toggle('primary');
      saveBtn.classList.toggle('light');
      const isSaved = saveBtn.classList.contains('primary');
      saveBtn.innerHTML = isSaved 
        ? '<i data-lucide="heart" style="fill: currentColor;"></i> Favorited' 
        : '<i data-lucide="heart"></i> Save Group';
      lucide.createIcons();
      toast(isSaved ? 'Group added to your favorites' : 'Group removed from favorites');
    });
  }
}
