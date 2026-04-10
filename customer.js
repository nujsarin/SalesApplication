/* ============================================================
   customer.js — Customer Pipeline Page
   ============================================================ */
'use strict';

window.CustomerPage = {
  _filter: 'all',
  _search: '',

  async render() {
    const customers = await DB.getCustomers(App.empId);

    // Filter by search
    let filtered = customers;
    if (this._search) {
      const q = this._search.toLowerCase();
      filtered = customers.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.tel || '').includes(q) ||
        (c.lineId || '').toLowerCase().includes(q)
      );
    }
    if (this._filter !== 'all') {
      filtered = filtered.filter(c => c.status === this._filter);
    }

    // Sort: followup first, then by date
    filtered.sort((a, b) => {
      const stOrd = { followup: 0, deciding: 1, closed: 2 };
      return (stOrd[a.status] || 99) - (stOrd[b.status] || 99);
    });

    // Count by status
    const counts = {
      all: customers.length,
      deciding: customers.filter(c => c.status === 'deciding').length,
      followup:  customers.filter(c => c.status === 'followup').length,
      closed:    customers.filter(c => c.status === 'closed').length,
    };

    // Upcoming follow-ups today
    const today = DateUtil.today();
    const todayFU = customers.filter(c => c.status === 'followup' && c.followUpDate === today);

    return `
    <!-- Search -->
    <div class="search-bar" style="margin-bottom:12px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="search" placeholder="${t('cust_search')}" value="${this._search}"
        oninput="CustomerPage._onSearch(this.value)">
    </div>

    <!-- Filter Tabs -->
    <div style="display:flex;gap:6px;margin-bottom:16px;overflow-x:auto;padding-bottom:2px;">
      ${[
        { k:'all',      l: t('common_all'),      c: counts.all },
        { k:'followup', l: t('cust_followup'),   c: counts.followup },
        { k:'deciding', l: t('cust_deciding'),   c: counts.deciding },
        { k:'closed',   l: t('cust_closed'),     c: counts.closed },
      ].map(tab => `
      <button style="flex-shrink:0;height:34px;padding:0 14px;border-radius:99px;font-size:12px;font-weight:600;
        border:1.5px solid ${this._filter === tab.k ? 'var(--black)' : 'var(--border)'};
        background:${this._filter === tab.k ? 'var(--black)' : 'transparent'};
        color:${this._filter === tab.k ? '#fff' : 'var(--mid)'};"
        onclick="CustomerPage._setFilter('${tab.k}')">
        ${tab.l} ${tab.c > 0 ? `<span style="opacity:0.7;">(${tab.c})</span>` : ''}
      </button>`).join('')}
    </div>

    <!-- Follow-up Alert -->
    ${todayFU.length > 0 ? `
    <div class="card card-y card-sm" style="margin-bottom:16px;">
      <div style="font-size:13px;font-weight:600;color:var(--y-dark);">
        🔔 ${I18n.lang==='th'?`มีนัดติดตาม ${todayFU.length} ราย วันนี้`:`${todayFU.length} follow-up(s) today`}
      </div>
      ${todayFU.slice(0,2).map(c => `<div style="font-size:12px;color:var(--mid);margin-top:4px;">· ${c.name}</div>`).join('')}
    </div>` : ''}

    <!-- Customer List -->
    ${filtered.length === 0 ? `
    <div class="empty-state">
      <div class="empty-icon">👥</div>
      <div class="empty-text">${I18n.lang==='th'?'ยังไม่มีลูกค้า':'No customers yet'}</div>
      <div class="empty-sub">${I18n.lang==='th'?'เพิ่มลูกค้าด้วยปุ่ม +':'Tap + to add a customer'}</div>
    </div>` : `
    <div style="margin-bottom:80px;">
      ${filtered.map(c => this._renderCustomerCard(c)).join('')}
    </div>`}

    <!-- FAB -->
    <button class="fab fab-y" onclick="CustomerPage.showAddModal()" title="${t('cust_add')}">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </button>`;
  },

  _renderCustomerCard(c) {
    const stMap = {
      deciding: { cls: 'ps-deciding', label: t('cust_deciding') },
      followup: { cls: 'ps-followup', label: t('cust_followup') },
      closed:   { cls: 'ps-closed',   label: t('cust_closed') },
    };
    const st = stMap[c.status] || stMap.deciding;
    const fuDate = c.followUpDate ? DateUtil.formatDate(c.followUpDate) : '';

    return `
    <div class="list-item" style="border-radius:var(--radius);margin-bottom:8px;border:1px solid var(--border);"
      onclick="CustomerPage.showEditModal(${c.id})">
      <div class="list-icon" style="background:${c.status === 'closed' ? 'var(--y-light)' : 'var(--bg2)'};">
        ${c.status === 'closed' ? '✅' : c.status === 'followup' ? '📞' : '🤔'}
      </div>
      <div class="list-body">
        <div class="list-title">${c.name || '—'}</div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:4px;">
          <span class="pipeline-status ${st.cls}">${st.label}</span>
          ${c.tel ? `<span style="font-size:11px;color:var(--lt);">📞 ${c.tel}</span>` : ''}
          ${c.lineId ? `<span style="font-size:11px;color:var(--lt);">LINE: ${c.lineId}</span>` : ''}
          ${fuDate ? `<span style="font-size:11px;color:${c.status==='followup'?'var(--warning)':'var(--lt)'};">📅 ${fuDate}</span>` : ''}
        </div>
        ${c.note ? `<div style="font-size:12px;color:var(--lt);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.note}</div>` : ''}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--lt)" stroke-width="2">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>`;
  },

  _onSearch(q) {
    this._search = q;
    this._rerender();
  },

  _setFilter(f) {
    this._filter = f;
    this._rerender();
  },

  async _rerender() {
    const content = document.getElementById('page-content');
    if (content) {
      const html = await CustomerPage.render();
      content.innerHTML = `<div class="page-inner">${html}</div>`;
    }
  },

  showAddModal(editId = null) {
    this._showForm(editId);
  },

  showEditModal(id) {
    this._showForm(id);
  },

  async _showForm(editId) {
    let c = null;
    if (editId) c = await DB.getCustomer(editId);

    const statusOpts = [
      { v:'deciding', l: t('cust_deciding') },
      { v:'followup', l: t('cust_followup') },
      { v:'closed',   l: t('cust_closed') },
    ];

    App.openModal(`
    <div class="modal-title">${editId ? t('common_edit') : t('cust_add')}</div>

    <div class="form-group">
      <label class="form-label">${t('cust_name')} <span>*</span></label>
      <input class="form-input" id="cust-name" value="${c?.name || ''}" placeholder="${I18n.lang==='th'?'ชื่อลูกค้า':'Customer name'}">
    </div>
    <div class="grid-2" style="gap:10px;">
      <div class="form-group" style="margin:0;">
        <label class="form-label">${t('cust_tel')}</label>
        <input class="form-input" id="cust-tel" type="tel" value="${c?.tel || ''}" placeholder="08X-XXX-XXXX">
      </div>
      <div class="form-group" style="margin:0;">
        <label class="form-label">${t('cust_line')}</label>
        <input class="form-input" id="cust-line" value="${c?.lineId || ''}" placeholder="@line_id">
      </div>
    </div>
    <div class="form-group" style="margin-top:12px;">
      <label class="form-label">${t('cust_status')}</label>
      <select class="form-input form-select" id="cust-status" onchange="CustomerPage._onStatusChange(this.value)">
        ${statusOpts.map(s => `<option value="${s.v}" ${c?.status === s.v ? 'selected' : ''}>${s.l}</option>`).join('')}
      </select>
    </div>
    <div class="form-group" id="cust-fudate-group" style="${c?.status === 'followup' ? '' : 'display:none;'}">
      <label class="form-label">${t('cust_followup_date')}</label>
      <input class="form-input" id="cust-fudate" type="date" value="${c?.followUpDate || ''}">
    </div>
    <div class="form-group">
      <label class="form-label">${t('cust_note')}</label>
      <textarea class="form-input form-textarea" id="cust-note" placeholder="${I18n.lang==='th'?'บันทึกเพิ่มเติม...':'Additional notes...'}">${c?.note || ''}</textarea>
    </div>

    <div style="display:flex;gap:10px;margin-top:8px;">
      ${editId ? `<button class="btn btn-danger" onclick="CustomerPage._deleteCustomer(${editId})">${t('common_delete')}</button>` : ''}
      <button class="btn btn-primary" style="flex:1;" onclick="CustomerPage._saveCustomer(${editId || 'null'})">
        ${t('cust_save')}
      </button>
    </div>`);
  },

  _onStatusChange(val) {
    const fuGroup = document.getElementById('cust-fudate-group');
    if (fuGroup) fuGroup.style.display = val === 'followup' ? '' : 'none';
  },

  async _saveCustomer(editId) {
    const name   = (document.getElementById('cust-name')?.value || '').trim();
    const tel    = (document.getElementById('cust-tel')?.value || '').trim();
    const lineId = (document.getElementById('cust-line')?.value || '').trim();
    const status = document.getElementById('cust-status')?.value || 'deciding';
    const fuDate = document.getElementById('cust-fudate')?.value || '';
    const note   = (document.getElementById('cust-note')?.value || '').trim();

    if (!name) { App.showToast(t('common_required'), 'error'); return; }

    const empId = App.emp?.id || App.empId;
    const data  = { empId, name, tel, lineId, status, followUpDate: fuDate, note };
    try {
      if (editId) {
        await DB.updateCustomer(editId, data);
      } else {
        await DB.addCustomer(data);
        // Reset filter/search so newly added customer is always visible
        this._filter = 'all';
        this._search = '';
      }
      App.closeModal();
      App.showToast(t('common_saved'), 'success');
      await this._rerender();
    } catch (e) {
      App.showToast(e.message, 'error');
    }
  },

  async _deleteCustomer(id) {
    App.confirm(t('cust_delete_confirm'), '', '🗑️', async () => {
      await DB.deleteCustomer(id);
      App.closeModal();
      App.showToast(t('common_deleted'));
      await this._rerender();
    }, true);
  },

  init() {}
};
