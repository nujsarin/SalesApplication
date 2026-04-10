/* ============================================================
   auth.js — PIN Authentication (SHA-256 hashed)
   ============================================================ */
'use strict';

window.Auth = {
  // ── Brute-force protection ────────────────────────────────
  _MAX_ATTEMPTS: 5,
  _LOCKOUT_MS: 5 * 60 * 1000, // 5 minutes

  _getAttemptKey(empId) { return `loginAttempts_${empId}`; },
  _getLockKey(empId) { return `loginLock_${empId}`; },

  _isLocked(empId) {
    const lockUntil = parseInt(localStorage.getItem(this._getLockKey(empId)) || '0');
    if (lockUntil && Date.now() < lockUntil) {
      const remainSec = Math.ceil((lockUntil - Date.now()) / 1000);
      const remainMin = Math.ceil(remainSec / 60);
      throw new Error(
        I18n.lang === 'th'
          ? `บัญชีถูกล็อค กรุณารอ ${remainMin} นาที`
          : `Account locked. Please wait ${remainMin} minute(s).`
      );
    }
    // Clear expired lock
    if (lockUntil) {
      localStorage.removeItem(this._getLockKey(empId));
      localStorage.removeItem(this._getAttemptKey(empId));
    }
  },

  _recordFailedAttempt(empId) {
    const key = this._getAttemptKey(empId);
    const attempts = (parseInt(localStorage.getItem(key) || '0')) + 1;
    localStorage.setItem(key, String(attempts));
    if (attempts >= this._MAX_ATTEMPTS) {
      localStorage.setItem(this._getLockKey(empId), String(Date.now() + this._LOCKOUT_MS));
      localStorage.removeItem(key);
    }
    return attempts;
  },

  _clearAttempts(empId) {
    localStorage.removeItem(this._getAttemptKey(empId));
    localStorage.removeItem(this._getLockKey(empId));
  },


  // ── SHA-256 via Web Crypto (salted) ────────────────────────
  _generateSalt() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async _sha256(str) {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async hashPin(pin, salt) {
    if (!salt) salt = this._generateSalt();
    const hash = await this._sha256(salt + pin);
    return { hash, salt };
  },

  // Legacy: unsalted hash for backward-compat login check
  async _hashPinLegacy(pin) {
    return await this._sha256(pin);
  },

  // ── Register ───────────────────────────────────────────────
  async register(data) {
    const { empCode, name, dept, targetAmt, workDays, pin, confirmPin } = data;

    if (!empCode || !name || !pin) throw new Error(t('common_required'));
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) throw new Error(t('auth_pin_short'));
    if (pin !== confirmPin) throw new Error(t('auth_pin_mismatch'));

    // Check unique empCode
    const existing = await DB.getEmployeeByCode(empCode);
    if (existing) throw new Error('Employee code already exists');

    const { hash: pinHash, salt: pinSalt } = await this.hashPin(pin);
    const empId = await DB.addEmployee({ empCode, name, dept, pinHash, pinSalt, createdAt: Date.now() });

    // Set initial target
    const month = DateUtil.currentMonth();
    await DB.setTarget(empId, month, {
      targetAmt: parseFloat(targetAmt) || 0,
      workDays: parseInt(workDays) || 22,
      calendarData: {}
    });

    await DB.initDefaultGroups();
    await DB.setSession(empId);
    return empId;
  },

  // ── Login ──────────────────────────────────────────────────
  async login(empId, pin) {
    // Check brute-force lockout
    this._isLocked(empId);

    const emp = await DB.getEmployee(empId);
    if (!emp) throw new Error('Employee not found');

    let match = false;
    if (emp.pinSalt) {
      const { hash } = await this.hashPin(pin, emp.pinSalt);
      match = (hash === emp.pinHash);
    } else {
      // Legacy unsalted hash — migrate on successful login
      const legacyHash = await this._hashPinLegacy(pin);
      match = (legacyHash === emp.pinHash);
      if (match) {
        const { hash: newHash, salt: newSalt } = await this.hashPin(pin);
        await DB.updateEmployee(empId, { pinHash: newHash, pinSalt: newSalt });
      }
    }

    if (!match) {
      const attempts = this._recordFailedAttempt(empId);
      const remaining = this._MAX_ATTEMPTS - attempts;
      if (remaining > 0) {
        throw new Error(t('auth_wrong_pin') + (remaining <= 2
          ? ` (${I18n.lang==='th'?'เหลือ':'remaining:'} ${remaining})`
          : ''));
      }
      throw new Error(t('auth_wrong_pin'));
    }

    this._clearAttempts(empId);
    await DB.setSession(empId);
    return emp;
  },

  // ── Change PIN ─────────────────────────────────────────────
  async changePin(empId, oldPin, newPin, confirmPin) {
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) throw new Error(t('auth_pin_short'));
    if (newPin !== confirmPin) throw new Error(t('auth_pin_mismatch'));

    const emp = await DB.getEmployee(empId);
    // Verify old PIN (support both salted and legacy)
    let oldMatch = false;
    if (emp.pinSalt) {
      const { hash } = await this.hashPin(oldPin, emp.pinSalt);
      oldMatch = (hash === emp.pinHash);
    } else {
      oldMatch = (await this._hashPinLegacy(oldPin)) === emp.pinHash;
    }
    if (!oldMatch) throw new Error(t('auth_wrong_pin'));

    const { hash: newHash, salt: newSalt } = await this.hashPin(newPin);
    await DB.updateEmployee(empId, { pinHash: newHash, pinSalt: newSalt });
  },

  // ── Reset PIN (via empCode verify) ────────────────────────
  async resetPin(empCode, newPin, confirmPin) {
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) throw new Error(t('auth_pin_short'));
    if (newPin !== confirmPin) throw new Error(t('auth_pin_mismatch'));

    const emp = await DB.getEmployeeByCode(empCode);
    if (!emp) throw new Error('Employee not found');

    const { hash: newHash, salt: newSalt } = await this.hashPin(newPin);
    await DB.updateEmployee(emp.id, { pinHash: newHash, pinSalt: newSalt });
    return emp.id;
  },

  // ── Logout ─────────────────────────────────────────────────
  async logout() {
    await DB.clearSession();
    Router.showAuth();
  },

  // ── Render: Employee Select ────────────────────────────────
  async renderEmployeeSelect() {
    const emps = await DB.getAllEmployees();
    if (emps.length === 0) {
      return this.renderRegister();
    }
    return this.renderPinScreen(emps);
  },

  // ── Render: PIN Screen ─────────────────────────────────────
  renderPinScreen(emps) {
    const opts = emps.map(e => `<option value="${e.id}">${esc(e.name)} (${esc(e.empCode)})</option>`).join('');
    return `
    <div class="auth-container" style="width:100%;max-width:360px;margin:auto;padding:20px 0;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:48px;margin-bottom:8px;">📊</div>
        <h1 style="font-size:22px;font-weight:700;color:var(--black);">Retail Sales Application</h1>
        <p style="font-size:13px;color:var(--lt);margin-top:4px;" data-i18n="auth_pin_label">${t('auth_pin_label')}</p>
      </div>

      ${emps.length > 1 ? `
      <div class="form-group" style="margin-bottom:16px;">
        <select class="form-input form-select" id="emp-select">
          ${opts}
        </select>
      </div>` : `<input type="hidden" id="emp-select" value="${emps[0].id}">`}

      <div class="pin-dots" id="pin-dots">
        ${[...Array(6)].map(() => `<div class="pin-dot"></div>`).join('')}
      </div>

      <div class="numpad" id="numpad">
        ${[1,2,3,4,5,6,7,8,9].map(n => `
        <button class="numpad-key" data-n="${n}" onclick="Auth._pinPress(${n})">
          <span>${n}</span>
        </button>`).join('')}
        <button class="numpad-key empty"></button>
        <button class="numpad-key" data-n="0" onclick="Auth._pinPress(0)">0</button>
        <button class="numpad-key del" onclick="Auth._pinDel()">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
            <line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
          </svg>
        </button>
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:20px;padding:0 4px;">
        <button class="btn btn-ghost btn-sm" onclick="Auth.showForgotPin()" style="font-size:13px;" data-i18n="auth_forgot">${t('auth_forgot')}</button>
        <button class="btn btn-ghost btn-sm" onclick="Auth.showRegister()" style="font-size:13px;" data-i18n="auth_register">${t('auth_register')}</button>
      </div>
    </div>`;
  },

  // ── PIN input state ────────────────────────────────────────
  _pin: '',
  _pinPress(n) {
    if (this._pin.length >= 6) return;
    this._pin += String(n);
    this._updateDots();
    if (this._pin.length === 6) {
      setTimeout(() => this._submitPin(), 180);
    }
  },
  _pinDel() {
    this._pin = this._pin.slice(0, -1);
    this._updateDots();
  },
  _updateDots() {
    const dots = document.querySelectorAll('#pin-dots .pin-dot');
    dots.forEach((d, i) => {
      d.classList.toggle('filled', i < this._pin.length);
      d.classList.remove('error');
    });
  },
  async _submitPin() {
    const empId = parseInt(document.getElementById('emp-select').value);
    try {
      await Auth.login(empId, this._pin);
      this._pin = '';
      Router.showMain();
    } catch (e) {
      document.querySelectorAll('#pin-dots .pin-dot').forEach(d => d.classList.add('error'));
      setTimeout(() => {
        this._pin = '';
        this._updateDots();
      }, 800);
      App.showToast(t('auth_wrong_pin'), 'error');
    }
  },

  // ── Render: Register ──────────────────────────────────────
  renderRegister() {
    return `
    <div class="auth-container" style="width:100%;max-width:400px;margin:auto;padding:20px 0;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
        <button onclick="Auth.showLogin()" style="color:var(--mid);padding:4px;" id="reg-back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h2 style="font-size:20px;font-weight:700;color:var(--black);" data-i18n="auth_reg_title">${t('auth_reg_title')}</h2>
          <p style="font-size:13px;color:var(--lt);">Retail Sales Application</p>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" data-i18n="auth_emp_code">${t('auth_emp_code')} <span>*</span></label>
        <input class="form-input" id="reg-code" type="text" placeholder="EMP001" autocomplete="off" style="text-transform:uppercase;">
      </div>
      <div class="form-group">
        <label class="form-label" data-i18n="auth_name">${t('auth_name')} <span>*</span></label>
        <input class="form-input" id="reg-name" type="text" placeholder="${I18n.lang === 'th' ? 'ชื่อ นามสกุล' : 'Full Name'}" autocomplete="name">
      </div>
      <div class="form-group">
        <label class="form-label" data-i18n="auth_dept">${t('auth_dept')}</label>
        <input class="form-input" id="reg-dept" type="text" placeholder="${I18n.lang === 'th' ? 'เช่น Sales, BD' : 'e.g. Sales, BD'}">
      </div>
      <div class="form-group">
        <label class="form-label" data-i18n="auth_target">${t('auth_target')}</label>
        <div class="amount-input-wrap">
          <span class="amount-prefix">฿</span>
          <input class="amount-input" id="reg-target" type="number" placeholder="500,000" style="text-align:left;">
        </div>
      </div>

      <div class="divider"></div>

      <div class="grid-2" style="gap:12px;">
        <div class="form-group" style="margin:0;">
          <label class="form-label" data-i18n="auth_set_pin">${t('auth_set_pin')} <span>*</span></label>
          <input class="form-input" id="reg-pin" type="password" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="••••••" autocomplete="new-password">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label" data-i18n="auth_confirm_pin">${t('auth_confirm_pin')} <span>*</span></label>
          <input class="form-input" id="reg-pin2" type="password" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="••••••" autocomplete="new-password">
        </div>
      </div>

      <button class="btn btn-primary btn-full" id="reg-btn" style="margin-top:24px;height:52px;"
        onclick="Auth._doRegister()">
        <span data-i18n="auth_register">${t('auth_register')}</span>
      </button>
    </div>`;
  },

  async _doRegister() {
    const btn = document.getElementById('reg-btn');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;
    try {
      const empId = await Auth.register({
        empCode:    (document.getElementById('reg-code').value || '').trim().toUpperCase(),
        name:       (document.getElementById('reg-name').value || '').trim(),
        dept:       (document.getElementById('reg-dept').value || '').trim(),
        targetAmt:  parseFloat(document.getElementById('reg-target').value) || 0,
        workDays:   22,
        pin:        document.getElementById('reg-pin').value,
        confirmPin: document.getElementById('reg-pin2').value,
      });
      App.showToast(t('common_saved'), 'success');
      Router.showMain();
    } catch (e) {
      App.showToast(e.message || t('common_error'), 'error');
      btn.disabled = false;
      btn.innerHTML = `<span data-i18n="auth_register">${t('auth_register')}</span>`;
    }
  },

  showLogin() {
    Auth.renderEmployeeSelect().then(html => {
      document.getElementById('auth-view').innerHTML = html;
      Auth._pin = '';
    });
  },

  showRegister() {
    document.getElementById('auth-view').innerHTML = Auth.renderRegister();
  },

  showForgotPin() {
    document.getElementById('auth-view').innerHTML = `
    <div style="width:100%;max-width:360px;margin:auto;padding:20px 0;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
        <button onclick="Auth.showLogin()" style="color:var(--mid);padding:4px;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 style="font-size:20px;font-weight:700;color:var(--black);">${t('auth_reset_title')}</h2>
      </div>
      <p style="font-size:13px;color:var(--mid);margin-bottom:20px;">${t('auth_reset_desc')}</p>
      <div class="form-group">
        <label class="form-label">${t('auth_emp_code')} <span>*</span></label>
        <input class="form-input" id="fp-code" type="text" placeholder="EMP001" style="text-transform:uppercase;">
      </div>
      <div class="form-group">
        <label class="form-label">${t('auth_new_pin')} <span>*</span></label>
        <input class="form-input" id="fp-pin" type="password" inputmode="numeric" maxlength="6" placeholder="••••••">
      </div>
      <div class="form-group">
        <label class="form-label">${t('auth_confirm_new')} <span>*</span></label>
        <input class="form-input" id="fp-pin2" type="password" inputmode="numeric" maxlength="6" placeholder="••••••">
      </div>
      <button class="btn btn-primary btn-full" style="height:52px;" onclick="Auth._doResetPin()">${t('auth_reset_btn')}</button>
    </div>`;
  },

  async _doResetPin() {
    try {
      const empId = await Auth.resetPin(
        document.getElementById('fp-code').value.trim().toUpperCase(),
        document.getElementById('fp-pin').value,
        document.getElementById('fp-pin2').value
      );
      await DB.setSession(empId);
      App.showToast(t('auth_reset_success'), 'success');
      Router.showMain();
    } catch (e) {
      App.showToast(e.message || t('common_error'), 'error');
    }
  }
};
