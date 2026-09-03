/**
 * KIMS Admin Portal - Core Client-Side Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  initActiveNav();
  initNotifications();
  initModals();
  initSearch();
});

/* Theme Manager */
function initTheme() {
  const savedTheme = localStorage.getItem('kims_admin_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const themeToggleButtons = document.querySelectorAll('.theme-toggle-btn');
  themeToggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('kims_admin_theme', next);
      updateThemeIcon(next);
      showToast('Theme Changed', `Switched to ${next} mode`, 'info');
    });
  });
}

function updateThemeIcon(theme) {
  const icons = document.querySelectorAll('.theme-toggle-btn i');
  icons.forEach(icon => {
    if (theme === 'dark') {
      icon.className = 'fa-solid fa-sun text-amber-400';
    } else {
      icon.className = 'fa-solid fa-moon text-slate-600';
    }
  });
}

/* Sidebar & Mobile Drawer */
function initSidebar() {
  const sidebar = document.querySelector('.admin-sidebar');
  const toggleBtns = document.querySelectorAll('.sidebar-toggle-btn, .mobile-menu-trigger');
  const overlay = document.querySelector('.sidebar-overlay');

  if (!sidebar) return;

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      if (overlay) overlay.classList.toggle('active');
    });
  });

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    });
  }

  // Close sidebar on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
      sidebar.classList.remove('mobile-open');
      if (overlay) overlay.classList.remove('active');
    }
  });
}

/* Sync Navigation Active Classes */
function initActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  
  // Sidebar Links
  const sideLinks = document.querySelectorAll('.sidebar-nav .nav-link');
  sideLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Mobile Bottom Nav Items
  const bottomItems = document.querySelectorAll('.mobile-bottom-nav .bottom-nav-item');
  bottomItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

/* Notification Dropdown Simulation */
function initNotifications() {
  const notifBtn = document.querySelector('.notification-toggle-btn');
  const notifPopover = document.querySelector('.notification-popover');
  
  if (!notifBtn || !notifPopover) return;

  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notifPopover.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!notifPopover.contains(e.target) && !notifBtn.contains(e.target)) {
      notifPopover.classList.add('hidden');
    }
  });
}

/* Modal Management */
function initModals() {
  // Triggers
  document.querySelectorAll('[data-modal-target]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = trigger.getAttribute('data-modal-target');
      openModal(targetId);
    });
  });

  // Closers
  document.querySelectorAll('[data-modal-close]').forEach(closer => {
    closer.addEventListener('click', () => {
      const modal = closer.closest('.modal-overlay');
      if (modal) closeModal(modal.id);
    });
  });

  // Close when clicking overlay backdrop
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* Table Search Filter */
function initSearch() {
  const searchInputs = document.querySelectorAll('[data-table-search]');
  searchInputs.forEach(input => {
    input.addEventListener('keyup', () => {
      const targetSelector = input.getAttribute('data-table-search');
      const table = document.querySelector(targetSelector);
      if (!table) return;

      const query = input.value.toLowerCase().trim();
      const rows = table.querySelectorAll('tbody tr');

      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  });
}

/* Global Toast Notifications */
function showToast(title, message, type = 'success') {
  let container = document.querySelector('.toast-stack');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-stack';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';

  let icon = '<i class="fa-solid fa-circle-check text-emerald-500 text-lg"></i>';
  if (type === 'error') {
    icon = '<i class="fa-solid fa-circle-exclamation text-rose-500 text-lg"></i>';
  } else if (type === 'warning') {
    icon = '<i class="fa-solid fa-triangle-exclamation text-amber-500 text-lg"></i>';
  } else if (type === 'info') {
    icon = '<i class="fa-solid fa-circle-info text-blue-500 text-lg"></i>';
  }

  toast.innerHTML = `
    ${icon}
    <div style="flex: 1;">
      <strong style="display: block; font-size: 0.88rem;">${escapeHtml(title)}</strong>
      <span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(message)}</span>
    </div>
    <button style="background:none; border:none; color:var(--text-subtle); cursor:pointer; padding:2px;" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(string) {
  const div = document.createElement('div');
  div.innerText = string;
  return div.innerHTML;
}

/* Admin Logout */
function handleAdminLogout() {
  localStorage.removeItem('kims_admin_auth');
  sessionStorage.removeItem('kims_admin_auth');
  showToast('Logged Out', 'You have been safely signed out.', 'info');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 700);
}
