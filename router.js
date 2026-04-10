/* ============================================================
   router.js — SPA Router + App Bootstrap
   ============================================================ */
'use strict';

window.Router = {
  _current: null,
  _history: [],

  pages: {
    home:       () => HomePage.render(),
    salesOrder: () => SalesOrderPage.render(),
    billing:    () => BillingPage.render(),
    customer:   () => CustomerPage.render(),
    calendar:   () => CalendarPage.render(),
    incentive:  () => IncentivePage.render(),
    report:     () => ReportPage.render(),
    setting:    () => SettingPage.render(),
  },

  titles: {
    home:       () => 'Retail Sales',
    salesOrder: () => I18n.t('so_title'),
    billing:    () => I18n.t('billing_title'),
    customer:   () => I18n.t('cust_title'),
    calendar:   () => I18n.t('cal_title'),
    incentive:  () => I18n.t('inc_title'),
    report:     () => I18n.t('report_title'),
    setting:    () => I18n.t('setting_title'),
  },

  navPages: ['home', 'salesOrder', 'billing', 'customer', 'report'],

  async navigate(page, pushHistory = true) {
    if (!this.pages[page]) page = 'home';

    if (pushHistory && this._current && this._current !== page) {
      this._history.push(this._current);
    }
    this._current = page;

    // Update topbar
    const title = document.getElementById('topbar-title');
    if (title) title.textContent = this.titles[page]?.() || page;

    // Back button visibility
    const back = document.getElementById('btn-back');
    if (back) {
      const showBack = !this.navPages.includes(page);
      back.classList.toggle('hidden', !showBack);
    }

    // Bottom nav active state
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Clear page-specific topbar buttons
    const extra = document.getElementById('topbar-extra');
    if (extra) extra.innerHTML = '';

    // Render page
    const content = document.getElementById('page-content');
    if (content) {
      content.innerHTML = `<div class="page-inner">${t('common_loading')}</div>`;
      try {
        const html = await this.pages[page]();
        content.innerHTML = `<div class="page-inner">${html}</div>`;
        content.scrollTop = 0;
        // Re-apply i18n
        I18n.apply();
        // Run page init if available
        const initFn = `${page.charAt(0).toUpperCase() + page.slice(1)}Page`;
        if (window[initFn] && window[initFn].init) {
          window[initFn].init();
        }
      } catch (err) {
        console.error('[Router]', err);
        content.innerHTML = `<div class="page-inner"><div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <div class="empty-text">เกิดข้อผิดพลาด</div>
          <div class="empty-sub">${esc(err.message)}</div>
        </div></div>`;
      }
    }
  },

  back() {
    const prev = this._history.pop();
    if (prev) this.navigate(prev, false);
    else this.navigate('home', false);
  },

  showAuth() {
    document.getElementById('auth-layer').classList.remove('hidden');
    document.getElementById('main-layer').classList.add('hidden');
    Auth.showLogin();
  },

  showMain() {
    document.getElementById('auth-layer').classList.add('hidden');
    document.getElementById('main-layer').classList.remove('hidden');
    this.navigate('home');
  }
};

// ── HTML Escape — prevents XSS when rendering user data ──────
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
window.esc = esc;

// ── App Global Controller ─────────────────────────────────────
window.App = {
  _empId: null,
  _emp: null,

  async init() {
    // Animate splash
    const splash = document.getElementById('splash');
    const app = document.getElementById('app');

    await new Promise(r => setTimeout(r, 1600));
    app.classList.remove('hidden');

    // Auto-migration: fix group names + seed product divisions for existing data
    await DB.migrateDefaultData();

    // Check session
    const valid = await DB.isSessionValid();
    if (valid) {
      this._empId = await DB.getSessionEmpId();
      this._emp = await DB.getEmployee(this._empId);
      splash.classList.add('hide');
      setTimeout(() => splash.classList.add('hidden'), 500);
      await DB.initDefaultGroups();
      I18n.apply();
      Router.showMain();
    } else {
      splash.classList.add('hide');
      setTimeout(() => splash.classList.add('hidden'), 500);
      I18n.apply();
      Router.showAuth();
    }
  },

  async refreshEmployee() {
    this._empId = await DB.getSessionEmpId();
    if (this._empId) this._emp = await DB.getEmployee(this._empId);
  },

  navigate(page) {
    Router.navigate(page);
  },

  goBack() {
    Router.back();
  },

  toggleLang() {
    const newLang = I18n.toggle();
    const lb = document.getElementById('lang-label');
    if (lb) lb.textContent = newLang.toUpperCase();
    // Re-render current page
    Router.navigate(Router._current, false);
  },

  setTopbarExtra(html) {
    const el = document.getElementById('topbar-extra');
    if (el) el.innerHTML = html;
  },

  showToast(msg, type = '') {
    const c = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  },

  openModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const box = document.getElementById('modal-box');
    box.innerHTML = `<div class="modal-handle"></div>${html}`;
    overlay.classList.remove('hidden');
  },

  closeModal(e) {
    if (!e || e.target === document.getElementById('modal-overlay')) {
      document.getElementById('modal-overlay').classList.add('hidden');
    }
  },

  confirm(title, msg, icon, onConfirm, danger = false) {
    App.openModal(`
      <div class="confirm-dialog">
        <div class="confirm-icon">${icon || '⚠️'}</div>
        <div class="confirm-title">${title}</div>
        <div class="confirm-msg">${msg}</div>
        <div class="confirm-btns">
          <button class="btn btn-outline" onclick="App.closeModal()">
            ${t('common_cancel')}
          </button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" onclick="App._confirmAction()">
            ${t('common_confirm')}
          </button>
        </div>
      </div>
    `);
    this._pendingConfirm = onConfirm;
  },

  async _confirmAction() {
    App.closeModal();
    if (this._pendingConfirm) {
      try { await this._pendingConfirm(); } catch(e) { App.showToast(e.message, 'error'); }
      this._pendingConfirm = null;
    }
  },

  // Format number
  fmt(n, dec = 0) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec
    }).format(n);
  },

  fmtB(n) {
    return `฿${this.fmt(n)}`;
  },

  // Get current employee
  get empId() { return this._empId; },
  get emp()   { return this._emp; },
};
