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
  initAcademicSession();
});

/* Theme Manager - Light Theme Enforced */
function initTheme() {
  document.documentElement.setAttribute('data-theme', 'light');
  localStorage.removeItem('kims_admin_theme');
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

/* ==========================================================================
   Kohat Board (BISE Kohat) Academic Session Manager
   ========================================================================== */
const DEFAULT_ACADEMIC_SESSIONS = [
  { id: '2025-2026', name: 'Session 2025–2026', startYear: 2025, startMonth: 'April', endYear: 2026, endMonth: 'March', board: 'BISE Kohat', status: 'Active', isCurrent: true, notes: 'Current Regular Academic & BISE Examination Year' },
  { id: '2026-2027', name: 'Session 2026–2027', startYear: 2026, startMonth: 'April', endYear: 2027, endMonth: 'March', board: 'BISE Kohat', status: 'Upcoming', isCurrent: false, notes: 'Upcoming Academic Cycle & Admissions' },
  { id: '2024-2025', name: 'Session 2024–2025', startYear: 2024, startMonth: 'April', endYear: 2025, endMonth: 'March', board: 'BISE Kohat', status: 'Archived', isCurrent: false, notes: 'Concluded BISE Kohat Annual Gazette' },
  { id: '2023-2024', name: 'Session 2023–2024', startYear: 2023, startMonth: 'April', endYear: 2024, endMonth: 'March', board: 'BISE Kohat', status: 'Archived', isCurrent: false, notes: 'Archived Historical Gazette' }
];

function getStoredSessions() {
  const stored = localStorage.getItem('kims_academic_sessions');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Error parsing stored sessions', e);
    }
  }
  return DEFAULT_ACADEMIC_SESSIONS;
}

function saveStoredSessions(sessions) {
  localStorage.setItem('kims_academic_sessions', JSON.stringify(sessions));
}

function getActiveSession() {
  const sessions = getStoredSessions();
  const activeId = localStorage.getItem('kims_active_session');
  if (activeId) {
    const found = sessions.find(s => s.id === activeId);
    if (found) return found;
  }
  const current = sessions.find(s => s.isCurrent) || sessions[0];
  return current;
}

function switchAcademicSession(sessionId, suppressToast = false) {
  const sessions = getStoredSessions();
  const target = sessions.find(s => s.id === sessionId);
  if (!target) return;

  sessions.forEach(s => {
    s.isCurrent = (s.id === sessionId);
    if (s.id === sessionId) {
      s.status = 'Active';
    } else if (s.status === 'Active') {
      s.status = 'Archived';
    }
  });

  saveStoredSessions(sessions);
  localStorage.setItem('kims_active_session', sessionId);

  // Update header widgets
  updateHeaderSessionDisplay();

  // Trigger custom event for pages like settings.html
  window.dispatchEvent(new CustomEvent('academicSessionChanged', { detail: target }));

  if (!suppressToast) {
    showToast('Academic Session Switched', `Active Session set to ${target.name} (${target.board})`, 'success');
  }
}

function updateHeaderSessionDisplay() {
  const active = getActiveSession();
  const labels = document.querySelectorAll('.session-current-year');
  labels.forEach(label => {
    label.textContent = active.name;
  });

  // Update dropdown options active class
  const optionsList = document.getElementById('headerSessionOptionsList');
  if (optionsList) {
    renderHeaderSessionDropdown(optionsList);
  }
}

function renderHeaderSessionDropdown(container) {
  const sessions = getStoredSessions();
  const active = getActiveSession();

  container.innerHTML = sessions.map(s => {
    const isActive = s.id === active.id;
    let badgeClass = 'badge-success';
    if (s.status === 'Upcoming') badgeClass = 'badge-gold';
    if (s.status === 'Archived') badgeClass = 'badge-secondary';

    return `
      <div class="session-option-item ${isActive ? 'active' : ''}" onclick="switchAcademicSession('${s.id}')">
        <div>
          <div class="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <span>${escapeHtml(s.name)}</span>
            ${isActive ? '<i class="fa-solid fa-check text-emerald-600 text-[11px]"></i>' : ''}
          </div>
          <div class="text-[11px] text-slate-400 font-mono">${escapeHtml(s.startMonth)} ${s.startYear} – ${escapeHtml(s.endMonth)} ${s.endYear}</div>
        </div>
        <span class="badge ${badgeClass} text-[10px] py-0.5">${escapeHtml(s.status)}</span>
      </div>
    `;
  }).join('');
}

function initAcademicSession() {
  const headerRight = document.querySelector('.admin-header .header-right');
  if (!headerRight) return;

  let widget = document.getElementById('headerSessionWidget');
  if (!widget) {
    const container = document.createElement('div');
    container.className = 'session-header-widget';
    container.id = 'headerSessionWidget';

    const active = getActiveSession();
    container.innerHTML = `
      <button type="button" class="session-badge-btn" id="sessionDropdownBtn" title="Current BISE Kohat Academic Session">
        <span class="session-pulse-dot"></span>
        <i class="fa-solid fa-graduation-cap text-emerald-600 dark:text-emerald-400"></i>
        <div class="session-text-group">
          <span class="session-mini-label">BISE Kohat</span>
          <span class="session-current-year" id="topHeaderSessionLabel">${escapeHtml(active.name)}</span>
        </div>
        <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 ml-1"></i>
      </button>

      <div class="session-quick-dropdown hidden" id="sessionQuickDropdown">
        <div class="session-dropdown-header">
          <span>Academic Sessions</span>
          <span class="badge badge-success text-[10px] py-0.5">BISE Kohat</span>
        </div>
        <div class="session-options-list" id="headerSessionOptionsList"></div>
        <div class="session-dropdown-footer">
          <a href="settings.html" class="manage-sessions-link">
            <i class="fa-solid fa-sliders text-xs"></i>
            <span>Manage Academic Sessions</span>
          </a>
        </div>
      </div>
    `;

    const publicLink = headerRight.querySelector('.public-site-link');
    if (publicLink) {
      headerRight.insertBefore(container, publicLink);
    } else {
      headerRight.prepend(container);
    }
    widget = container;
  }

  const dropdownBtn = document.getElementById('sessionDropdownBtn');
  const dropdownMenu = document.getElementById('sessionQuickDropdown');
  const optionsList = document.getElementById('headerSessionOptionsList');

  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('hidden');
      if (!dropdownMenu.classList.contains('hidden') && optionsList) {
        renderHeaderSessionDropdown(optionsList);
      }
    });

    document.addEventListener('click', (e) => {
      if (!dropdownMenu.contains(e.target) && !dropdownBtn.contains(e.target)) {
        dropdownMenu.classList.add('hidden');
      }
    });
  }

  updateHeaderSessionDisplay();

  window.addEventListener('storage', (e) => {
    if (e.key === 'kims_active_session' || e.key === 'kims_academic_sessions') {
      updateHeaderSessionDisplay();
    }
  });
}

