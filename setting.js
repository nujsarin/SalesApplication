/* ============================================================
   setting.js — Settings Page
   ============================================================ */
'use strict';

window.SettingPage = {
  _sub: null,

  async render() {
    if (this._sub) {
      const html = await this._renderSub(this._sub);
      return html;
    }
    return this._renderMain();
  },

  async _renderMain() {
    const emp = App.emp;
    const lang = I18n.lang;

    return `
    <!-- Profile -->
    <div class="card" style="margin-bottom:16px;display:flex;align-items:center;gap:14px;">
      <div style="width:52px;height:52px;border-radius:50%;background:var(--y);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:var(--black);flex-shrink:0;">
        ${esc((emp?.name || '?').charAt(0).toUpperCase())}
      </div>
      <div style="flex:1;">
        <div style="font-size:17px;font-weight:700;">${esc(emp?.name || '—')}</div>
        <div style="font-size:13px;color:var(--lt);">${esc(emp?.empCode || '')} · ${esc(emp?.dept || '—')}</div>
      </div>
      <button class="btn btn-outline btn-sm" onclick="SettingPage._showEditProfile()">
        ${t('common_edit')}
      </button>
    </div>

    <!-- General Settings -->
    <div class="section-title" style="margin-bottom:8px;">${I18n.lang==='th'?'ทั่วไป':'General'}</div>
    <div class="settings-list" style="margin-bottom:20px;">
      <div class="settings-row" onclick="SettingPage._showSub('target')">
        <div class="settings-row-icon">🎯</div>
        <div class="settings-row-body">
          <div class="settings-row-title">${t('setting_target')}</div>
          <div class="settings-row-sub">${I18n.lang==='th'?'ตั้งเป้าหมายและวันทำงาน':'Set monthly target & work days'}</div>
        </div>
        <svg class="settings-row-right" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <div class="settings-row" onclick="SettingPage._toggleLang()">
        <div class="settings-row-icon">🌐</div>
        <div class="settings-row-body">
          <div class="settings-row-title">${t('setting_language')}</div>
          <div class="settings-row-sub">${lang === 'th' ? 'ภาษาไทย (Thai)' : 'English'}</div>
        </div>
        <div class="lang-toggle" style="pointer-events:none;">
          <button class="${lang === 'th' ? 'active' : ''}">TH</button>
          <button class="${lang === 'en' ? 'active' : ''}">EN</button>
        </div>
      </div>
      <div class="settings-row" onclick="SettingPage._showChangePin()">
        <div class="settings-row-icon">🔒</div>
        <div class="settings-row-body">
          <div class="settings-row-title">${t('setting_change_pin')}</div>
          <div class="settings-row-sub">${I18n.lang==='th'?'เปลี่ยน PIN 6 หลัก':'Change 6-digit PIN'}</div>
        </div>
        <svg class="settings-row-right" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <div class="settings-row" onclick="SettingPage._toggleWalkinMode()">
        <div class="settings-row-icon">👥</div>
        <div class="settings-row-body">
          <div class="settings-row-title">${t('setting_walkin_mode')}</div>
          <div class="settings-row-sub" id="walkin-mode-label">
            ${(await DB.getSetting('walkinMode','counter')) === 'counter'
              ? (I18n.lang==='th'?'ปุ่มนับ (Counter)':'Tap Counter')
              : (I18n.lang==='th'?'กรอกเอง (Manual)':'Manual Input')}
          </div>
        </div>
        <svg class="settings-row-right" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>

    <!-- Catalog Settings -->
    <div class="section-title" style="margin-bottom:8px;">${I18n.lang==='th'?'ข้อมูลสินค้า':'Product Catalog'}</div>
    <div class="settings-list" style="margin-bottom:20px;">
      <div class="settings-row" onclick="SettingPage._showSub('groups')">
        <div class="settings-row-icon">📦</div>
        <div class="settings-row-body">
          <div class="settings-row-title">${t('setting_groups')}</div>
          <div class="settings-row-sub">${I18n.lang==='th'?'จัดการ Product Group + % Incentive':'Manage groups & incentive %'}</div>
        </div>
        <svg class="settings-row-right" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      <div class="settings-row" onclick="SettingPage._showSub('products')">
        <div class="settings-row-icon">🛍️</div>
        <div class="settings-row-body">
          <div class="settings-row-title">${t('setting_products')}</div>
          <div class="settings-row-sub">${I18n.lang==='th'?'จัดการรายการ Product Division':'Manage product divisions per group'}</div>
        </div>
        <svg class="settings-row-right" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="section-title" style="margin-bottom:8px;color:var(--danger);">⚠️ Danger Zone</div>
    <div class="settings-list" style="margin-bottom:20px;">
      <div class="settings-row" onclick="SettingPage._confirmDelMonth()">
        <div class="settings-row-icon" style="background:#FEE2E2;">🗑️</div>
        <div class="settings-row-body">
          <div class="settings-row-title" style="color:var(--danger);">${t('setting_del_month')}</div>
          <div class="settings-row-sub">${I18n.lang==='th'?'ลบข้อมูล SO และบิลเดือนนี้':'Delete this month SO & billing'}</div>
        </div>
      </div>
      <div class="settings-row" onclick="SettingPage._confirmDelAll()">
        <div class="settings-row-icon" style="background:#FEE2E2;">💣</div>
        <div class="settings-row-body">
          <div class="settings-row-title" style="color:var(--danger);">${t('setting_del_all_so')}</div>
          <div class="settings-row-sub">${I18n.lang==='th'?'ลบยอดขายทั้งหมด':'Delete all sales data'}</div>
        </div>
      </div>
      <div class="settings-row" onclick="SettingPage._confirmDelAccount()">
        <div class="settings-row-icon" style="background:#FEE2E2;">👤</div>
        <div class="settings-row-body">
          <div class="settings-row-title" style="color:var(--danger);">${I18n.lang==='th'?'ลบบัญชีนี้':'Delete This Account'}</div>
          <div class="settings-row-sub">${I18n.lang==='th'?'ลบผู้ใช้และข้อมูลทั้งหมดของบัญชีนี้':'Delete this user and all their data'}</div>
        </div>
      </div>
      <div class="settings-row" onclick="SettingPage._confirmReset()">
        <div class="settings-row-icon" style="background:#FEE2E2;">☢️</div>
        <div class="settings-row-body">
          <div class="settings-row-title" style="color:var(--danger);">${t('setting_reset')}</div>
          <div class="settings-row-sub">${I18n.lang==='th'?'ล้างข้อมูลทั้งหมด รีเซ็ตแอป':'Wipe all data and reset app'}</div>
        </div>
      </div>
    </div>

    <!-- Logout -->
    <button class="btn btn-outline btn-full" style="margin-bottom:20px;" onclick="SettingPage._logout()">
      ${I18n.lang==='th'?'ออกจากระบบ':'Logout'}
    </button>

    <div style="text-align:center;font-size:11px;color:var(--lt);padding-bottom:20px;">
      Retail Sales Application v1.0 · Offline PWA<br>
      IndexedDB · SHA-256 PIN Security
    </div>`;
  },

  async _renderSub(sub) {
    switch (sub) {
      case 'groups':   return await this._renderGroups();
      case 'products': return await this._renderProducts();
      case 'target':   return await this._renderTarget();
      default: return '';
    }
  },

  async _renderGroups() {
    const groups = await DB.getGroups();
    const tiers  = ['t1','t2','t3','t4'];

    return `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <button class="icon-btn" onclick="SettingPage._clearSub()" style="background:var(--bg2);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span style="font-size:17px;font-weight:700;">${t('setting_groups')}</span>
    </div>

    <div style="margin-bottom:16px;">
      ${groups.map((g, idx) => `
      <div class="card card-sm" style="margin-bottom:8px;">
        <!-- Header row: name + action buttons -->
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
          <div style="font-weight:600;font-size:13px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${g.name}</div>
          <!-- Move Up -->
          <button title="${I18n.lang==='th'?'เลื่อนขึ้น':'Move Up'}"
            style="width:28px;height:28px;border-radius:6px;background:var(--bg2);display:flex;align-items:center;justify-content:center;flex-shrink:0;${idx === 0 ? 'opacity:0.3;pointer-events:none;' : ''}"
            onclick="SettingPage._moveGroupUp(${g.id}, ${g.sort})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <!-- Move Down -->
          <button title="${I18n.lang==='th'?'เลื่อนลง':'Move Down'}"
            style="width:28px;height:28px;border-radius:6px;background:var(--bg2);display:flex;align-items:center;justify-content:center;flex-shrink:0;${idx === groups.length-1 ? 'opacity:0.3;pointer-events:none;' : ''}"
            onclick="SettingPage._moveGroupDown(${g.id}, ${g.sort})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <!-- Copy -->
          <button title="${I18n.lang==='th'?'คัดลอก':'Copy'}"
            style="width:28px;height:28px;border-radius:6px;background:var(--y-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;"
            onclick="SettingPage._copyGroup(${g.id})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--y-dark)" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <!-- Edit -->
          <button class="btn btn-outline btn-xs" onclick="SettingPage._editGroup(${g.id})">
            ${t('common_edit')}
          </button>
        </div>
        <!-- Incentive % per tier -->
        <div style="display:flex;gap:6px;">
          ${tiers.map(tk => `
          <div style="flex:1;text-align:center;padding:4px 6px;background:var(--bg2);border-radius:6px;">
            <div style="font-size:9px;color:var(--lt);">${tk.toUpperCase()}</div>
            <div style="font-size:13px;font-weight:600;">${g.incentivePct?.[tk] || 0}%</div>
          </div>`).join('')}
        </div>
      </div>`).join('')}
    </div>

    <button class="btn btn-primary btn-full" onclick="SettingPage._addGroup()">
      + ${I18n.lang==='th'?'เพิ่มกลุ่มสินค้า':'Add Group'}
    </button>`;
  },

  async _copyGroup(id) {
    const groups = await DB.getGroups();
    const g = groups.find(g => g.id === id);
    if (!g) return;
    const newName = `${g.name} (${I18n.lang==='th'?'สำเนา':'Copy'})`;
    await DB.addGroup({ name: newName, incentivePct: { ...g.incentivePct } });
    App.showToast(I18n.lang==='th'?'คัดลอกแล้ว':'Copied!', 'success');
    Router.navigate('setting', false);
  },

  async _moveGroupUp(id, sort) {
    const groups = await DB.getGroups();
    const idx = groups.findIndex(g => g.id === id);
    if (idx <= 0) return;
    const prev = groups[idx - 1];
    await DB.updateGroup(id, { sort: prev.sort });
    await DB.updateGroup(prev.id, { sort: sort });
    Router.navigate('setting', false);
  },

  async _moveGroupDown(id, sort) {
    const groups = await DB.getGroups();
    const idx = groups.findIndex(g => g.id === id);
    if (idx < 0 || idx >= groups.length - 1) return;
    const next = groups[idx + 1];
    await DB.updateGroup(id, { sort: next.sort });
    await DB.updateGroup(next.id, { sort: sort });
    Router.navigate('setting', false);
  },

  _editGroup(id) {
    DB.getGroups().then(groups => {
      const g = groups.find(g => g.id === id);
      if (!g) return;
      App.openModal(`
      <div class="modal-title">${t('common_edit')} ${I18n.lang==='th'?'กลุ่ม':'Group'}</div>
      <div class="form-group">
        <label class="form-label">${t('common_name')}</label>
        <input class="form-input" id="grp-name" value="${esc(g.name || '')}">
      </div>
      <div class="card-title" style="margin:12px 0 8px;">% Incentive per Tier</div>
      ${['t1','t2','t3','t4'].map(tk => `
      <div class="form-group" style="margin-bottom:10px;">
        <label class="form-label">${tk.toUpperCase()} %</label>
        <input class="form-input" id="grp-${tk}" type="number" step="0.1" value="${g.incentivePct?.[tk] || 0}">
      </div>`).join('')}
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn btn-danger" onclick="SettingPage._deleteGroup(${id})">${t('common_delete')}</button>
        <button class="btn btn-primary" style="flex:1;" onclick="SettingPage._saveGroup(${id})">${t('common_save')}</button>
      </div>`);
    });
  },

  _addGroup() {
    App.openModal(`
    <div class="modal-title">${I18n.lang==='th'?'เพิ่มกลุ่มสินค้า':'Add Product Group'}</div>
    <div class="form-group">
      <label class="form-label">${t('common_name')} <span>*</span></label>
      <input class="form-input" id="grp-name" placeholder="${I18n.lang==='th'?'ชื่อกลุ่ม':'Group name'}">
    </div>
    ${['t1','t2','t3','t4'].map(tk => `
    <div class="form-group" style="margin-bottom:10px;">
      <label class="form-label">${tk.toUpperCase()} % Incentive</label>
      <input class="form-input" id="grp-${tk}" type="number" step="0.1" value="0">
    </div>`).join('')}
    <button class="btn btn-primary btn-full" onclick="SettingPage._saveGroup(null)">${t('common_save')}</button>`);
  },

  async _saveGroup(id) {
    const name = (document.getElementById('grp-name')?.value || '').trim();
    if (!name) { App.showToast(t('common_required'), 'error'); return; }
    const incentivePct = {};
    for (const tk of ['t1','t2','t3','t4']) {
      incentivePct[tk] = parseFloat(document.getElementById(`grp-${tk}`)?.value) || 0;
    }
    if (id) await DB.updateGroup(id, { name, incentivePct });
    else    await DB.addGroup({ name, incentivePct });
    App.closeModal();
    App.showToast(t('common_saved'), 'success');
    Router.navigate('setting', false);
  },

  async _deleteGroup(id) {
    App.confirm(I18n.lang==='th'?'ลบกลุ่มสินค้านี้?':'Delete this group?', '', '🗑️', async () => {
      await DB.deleteGroup(id);
      App.closeModal();
      App.showToast(t('common_deleted'));
      Router.navigate('setting', false);
    }, true);
  },

  async _renderProducts() {
    const [products, groups] = await Promise.all([DB.getProducts(), DB.getGroups()]);
    const groupMap = {};
    for (const g of groups) groupMap[g.id] = g;
    const groupOpts = groups.map(g => `<option value="${g.id}">${(g.name||'').split('—')[0].trim()}</option>`).join('');

    return `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <button class="icon-btn" onclick="SettingPage._clearSub()" style="background:var(--bg2);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span style="font-size:17px;font-weight:700;">${t('setting_products')}</span>
    </div>

    <div style="margin-bottom:12px;">
      ${products.length === 0
        ? `<div class="empty-state" style="padding:24px;"><div class="empty-text">${I18n.lang==='th'?'ยังไม่มี Division':'No divisions yet'}</div></div>`
        : products.map(p => `
        <div class="list-item" style="border-radius:var(--radius-sm);margin-bottom:4px;border:1px solid var(--border);"
          onclick="SettingPage._editProduct(${p.id})">
          <div class="list-body">
            <div class="list-title">${p.name || '—'}</div>
            <div class="list-sub">${groupMap[p.groupId]?.name || '—'}</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--lt)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`).join('')}
    </div>

    <button class="btn btn-primary btn-full" onclick="SettingPage._addProduct()">
      + ${I18n.lang==='th'?'เพิ่ม Product Division':'Add Product Division'}
    </button>`;
  },

  async _showProductForm(id, groupOpts) {
    let p = null;
    if (id) p = (await DB.getProducts()).find(x => x.id === id);
    const titleTH = id ? `แก้ไข Product Division` : `เพิ่ม Product Division`;
    const titleEN = id ? `Edit Product Division` : `Add Product Division`;
    App.openModal(`
    <div class="modal-title">${I18n.lang==='th' ? titleTH : titleEN}</div>
    <div class="form-group">
      <label class="form-label">Division Name <span>*</span></label>
      <input class="form-input" id="prd-name" value="${p?.name || ''}" placeholder="${I18n.lang==='th'?'ชื่อ Division เช่น Index':'e.g. Index'}">
    </div>
    <div class="form-group">
      <label class="form-label">Product Group</label>
      <select class="form-input form-select" id="prd-group">
        ${groupOpts}
      </select>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px;">
      ${id ? `<button class="btn btn-danger" onclick="SettingPage._deleteProduct(${id})">${t('common_delete')}</button>` : ''}
      <button class="btn btn-primary" style="flex:1;" onclick="SettingPage._saveProduct(${id||'null'})">${t('common_save')}</button>
    </div>`);

    if (p?.groupId) {
      const sel = document.getElementById('prd-group');
      if (sel) sel.value = p.groupId;
    }
  },

  async _addProduct() {
    const groups = await DB.getGroups();
    const opts = groups.map(g => `<option value="${g.id}">${(g.name||'').split('—')[0].trim()}</option>`).join('');
    this._showProductForm(null, opts);
  },

  async _editProduct(id) {
    const groups = await DB.getGroups();
    const opts = groups.map(g => `<option value="${g.id}">${(g.name||'').split('—')[0].trim()}</option>`).join('');
    this._showProductForm(id, opts);
  },

  async _saveProduct(id) {
    const name    = (document.getElementById('prd-name')?.value || '').trim();
    const groupId = parseInt(document.getElementById('prd-group')?.value);
    if (!name) { App.showToast(t('common_required'), 'error'); return; }
    if (id) await DB.updateProduct(id, { name, price: 0, groupId });
    else    await DB.addProduct({ name, price: 0, groupId });
    App.closeModal();
    App.showToast(t('common_saved'), 'success');
    Router.navigate('setting', false);
  },

  async _deleteProduct(id) {
    App.confirm(I18n.lang==='th'?'ลบ Division นี้?':'Delete this division?', '', '🗑️', async () => {
      await DB.deleteProduct(id);
      App.closeModal();
      App.showToast(t('common_deleted'));
      Router.navigate('setting', false);
    }, true);
  },

  async _renderTarget() {
    const emp   = App.emp;
    const month = DateUtil.currentMonth();
    const target= await DB.getTarget(emp.id, month) || {};
    return `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <button class="icon-btn" onclick="SettingPage._clearSub()" style="background:var(--bg2);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span style="font-size:17px;font-weight:700;">${t('setting_target')}</span>
    </div>
    <div class="form-group">
      <label class="form-label">${t('auth_target')}</label>
      <div class="amount-input-wrap">
        <span class="amount-prefix">฿</span>
        <input class="amount-input" id="tgt-amount" type="number" value="${target.targetAmt||''}" placeholder="500000" style="text-align:left;">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">${I18n.lang==='th'?'วันทำงาน (วัน)':'Working Days'}</label>
      <input class="form-input" id="tgt-days" type="number" value="${target.workDays||22}" min="1" max="31">
    </div>
    <button class="btn btn-primary btn-full" onclick="SettingPage._saveTarget()">
      ${t('common_save')}
    </button>`;
  },

  async _saveTarget() {
    const amt  = parseFloat(document.getElementById('tgt-amount')?.value) || 0;
    const days = parseInt(document.getElementById('tgt-days')?.value) || 22;
    const month= DateUtil.currentMonth();
    const existing = await DB.getTarget(App.empId, month) || {};
    await DB.setTarget(App.empId, month, { ...existing, targetAmt: amt, workDays: days });
    App.showToast(t('common_saved'), 'success');
    this._clearSub();
    Router.navigate('setting', false);
  },

  _showSub(sub) {
    this._sub = sub;
    Router.navigate('setting', false);
  },

  _clearSub() {
    this._sub = null;
    Router.navigate('setting', false);
  },

  _toggleLang() {
    App.toggleLang();
  },

  async _toggleWalkinMode() {
    const cur = await DB.getSetting('walkinMode', 'counter');
    await DB.setSetting('walkinMode', cur === 'counter' ? 'manual' : 'counter');
    App.showToast(t('common_saved'), 'success');
    Router.navigate('setting', false);
  },

  _showChangePin() {
    App.openModal(`
    <div class="modal-title">${t('setting_change_pin')}</div>
    <div class="form-group">
      <label class="form-label">${I18n.lang==='th'?'PIN ปัจจุบัน':'Current PIN'}</label>
      <input class="form-input" id="cp-old" type="password" inputmode="numeric" maxlength="6" placeholder="••••••">
    </div>
    <div class="form-group">
      <label class="form-label">${I18n.lang==='th'?'PIN ใหม่':'New PIN'} (6 ${I18n.lang==='th'?'หลัก':'digits'})</label>
      <input class="form-input" id="cp-new" type="password" inputmode="numeric" maxlength="6" placeholder="••••••">
    </div>
    <div class="form-group">
      <label class="form-label">${I18n.lang==='th'?'ยืนยัน PIN ใหม่':'Confirm New PIN'}</label>
      <input class="form-input" id="cp-confirm" type="password" inputmode="numeric" maxlength="6" placeholder="••••••">
    </div>
    <button class="btn btn-primary btn-full" onclick="SettingPage._doChangePin()">
      ${t('common_save')}
    </button>`);
  },

  async _doChangePin() {
    try {
      await Auth.changePin(
        App.empId,
        document.getElementById('cp-old')?.value || '',
        document.getElementById('cp-new')?.value || '',
        document.getElementById('cp-confirm')?.value || ''
      );
      App.closeModal();
      App.showToast(t('common_saved'), 'success');
    } catch (e) {
      App.showToast(e.message, 'error');
    }
  },

  _showEditProfile() {
    const emp = App.emp;
    App.openModal(`
    <div class="modal-title">${t('setting_profile')}</div>
    <div class="form-group">
      <label class="form-label">${t('auth_name')}</label>
      <input class="form-input" id="prof-name" value="${esc(emp?.name || '')}">
    </div>
    <div class="form-group">
      <label class="form-label">${t('auth_dept')}</label>
      <input class="form-input" id="prof-dept" value="${esc(emp?.dept || '')}">
    </div>
    <button class="btn btn-primary btn-full" onclick="SettingPage._saveProfile()">${t('common_save')}</button>`);
  },

  async _saveProfile() {
    const name = (document.getElementById('prof-name')?.value || '').trim();
    const dept = (document.getElementById('prof-dept')?.value || '').trim();
    if (!name) { App.showToast(t('common_required'), 'error'); return; }
    await DB.updateEmployee(App.empId, { name, dept });
    await App.refreshEmployee();
    App.closeModal();
    App.showToast(t('common_saved'), 'success');
    Router.navigate('setting', false);
  },

  _confirmDelMonth() {
    App.confirm(
      t('setting_del_month'),
      DateUtil.formatMonth(DateUtil.currentMonth()),
      '🗑️',
      async () => {
        await DB.deleteMonthData(App.empId, DateUtil.currentMonth());
        App.showToast(t('common_deleted'));
      }, true
    );
  },

  _confirmDelAll() {
    App.confirm(
      t('setting_del_all_so'),
      I18n.lang==='th'?'ข้อมูล SO และบิลทั้งหมดจะถูกลบ':'All SO and billing will be deleted',
      '💣',
      async () => {
        await DB.deleteAllSalesData(App.empId);
        App.showToast(t('common_deleted'));
      }, true
    );
  },

  _confirmDelAccount() {
    const emp = App.emp;
    App.confirm(
      I18n.lang==='th' ? 'ลบบัญชีนี้?' : 'Delete This Account?',
      I18n.lang==='th'
        ? `ข้อมูลทั้งหมดของ "${esc(emp?.name || '')}" (${esc(emp?.empCode || '')}) จะถูกลบถาวร`
        : `All data for "${esc(emp?.name || '')}" (${esc(emp?.empCode || '')}) will be permanently deleted`,
      '👤',
      async () => {
        App.confirm(
          I18n.lang==='th' ? 'ยืนยันอีกครั้ง' : 'Confirm Again',
          I18n.lang==='th' ? 'ไม่สามารถกู้คืนได้' : 'This cannot be undone',
          '⚠️',
          async () => {
            await DB.deleteEmployee(App.empId);
            App.showToast(I18n.lang==='th' ? 'ลบบัญชีสำเร็จ' : 'Account deleted', 'success');
            Router.showAuth();
          },
          true
        );
      }, true
    );
  },

  _confirmReset() {
    App.confirm(
      t('setting_reset'),
      I18n.lang==='th'?'ข้อมูลทั้งหมดจะถูกลบและแอปจะรีสตาร์ท':'All data will be wiped and app will restart',
      '☢️',
      async () => {
        App.confirm(
          I18n.lang==='th'?'ยืนยันอีกครั้ง':'Confirm Again',
          I18n.lang==='th'?'ไม่สามารถกู้คืนได้':'This cannot be undone',
          '⚠️',
          () => DB.fullReset(),
          true
        );
      }, true
    );
  },

  async _logout() {
    App.confirm(
      I18n.lang==='th'?'ออกจากระบบ?':'Logout?',
      '',
      '👋',
      () => Auth.logout()
    );
  },

  init() {}
};
