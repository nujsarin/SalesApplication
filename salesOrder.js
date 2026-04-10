/* ============================================================
   salesOrder.js — Sales Order Page
   ============================================================ */
'use strict';

window.SalesOrderPage = {
  _products: [],
  _groups: [],
  _walkinMode: 'counter', // 'counter' | 'manual'

  async render() {
    const emp = App.emp;
    const month = DateUtil.currentMonth();
    const today = DateUtil.today();

    const [target, orders, todayOrders, groups, products] = await Promise.all([
      DB.getTarget(emp.id, month),
      DB.getSalesOrdersByMonth(emp.id, month),
      DB.getSalesOrdersByDate(emp.id, today),
      DB.getGroups(),
      DB.getProducts(),
    ]);

    this._products = products;
    this._groups   = groups;
    this._walkinMode = await DB.getSetting('walkinMode', 'counter');

    const targetAmt = target?.targetAmt || 0;
    const monthTotal = orders.reduce((s, o) => s + (o.totalAmt || 0), 0);
    const todayTotal = todayOrders.reduce((s, o) => s + (o.totalAmt || 0), 0);
    const pct        = targetAmt > 0 ? Math.min((monthTotal / targetAmt) * 100, 100) : 0;
    const calData    = target?.calendarData || {};
    const daysLeft   = DateUtil.workDaysLeft(calData, month);
    const remaining  = Math.max(targetAmt - monthTotal, 0);
    const runRate    = daysLeft > 0 ? remaining / daysLeft : 0;

    // KPIs
    const walkins    = todayOrders.reduce((s, o) => s + (o.walkins || 0), 0);
    const totalWalkins = await DB.getSetting(`walkins_${today}`, 0);
    const billCount  = todayOrders.length;
    const conversion = totalWalkins > 0 ? (billCount / totalWalkins * 100).toFixed(1) : '—';
    const basketSize = billCount > 0 ? todayTotal / billCount : 0;
    const totalItems = todayOrders.reduce((s, o) => s + (o.items || []).reduce((si, i) => si + (i.qty || 1), 0), 0);
    const upt        = billCount > 0 ? (totalItems / billCount).toFixed(1) : '—';

    // No bill days this month
    const allDays    = DateUtil.getMonthDays(...Object.values(DateUtil.parseMonth(month)));
    const orderDates = new Set(orders.map(o => o.date));
    const noBillDays = allDays.filter(d => {
      const state = calData[d.date] || (d.isWeekend ? 'holiday' : 'work');
      return state === 'work' && d.date < today && !orderDates.has(d.date);
    }).length;

    // Tier targets
    const tiers = [
      { n:1, pct:80,  amt: targetAmt * 0.80 },
      { n:2, pct:90,  amt: targetAmt * 0.90 },
      { n:3, pct:100, amt: targetAmt },
      { n:4, pct:115, amt: targetAmt * 1.15 },
    ];

    return `
    <!-- Progress Overview -->
    <div class="card" style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div>
          <div style="font-size:12px;color:var(--lt);">${t('so_month')}</div>
          <div style="font-size:22px;font-weight:700;color:var(--black);">${App.fmtB(monthTotal)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;color:var(--lt);">${t('so_target')}</div>
          <div style="font-size:16px;font-weight:600;color:var(--mid);">${App.fmtB(targetAmt)}</div>
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--lt);">
        <span>${pct.toFixed(1)}% ${t('so_achieved')}</span>
        <span>${t('so_remaining')}: ${App.fmtB(remaining)}</span>
      </div>
    </div>

    <!-- Tier Progress -->
    <div class="tier-row" style="margin-bottom:12px;">
      ${tiers.map(ti => {
        const tiPct = targetAmt > 0 ? Math.min(monthTotal / ti.amt * 100, 100) : 0;
        const reached = monthTotal >= ti.amt;
        const needMore = Math.max(ti.amt - monthTotal, 0);
        return `<div class="tier-badge tier-${ti.n} ${reached ? 'active' : ''}" title="${App.fmtB(needMore)} more">
          <div>T${ti.n} ${ti.pct}%</div>
          ${reached ? '<div style="font-size:9px;">✅</div>' : `<div style="font-size:9px;">-${App.fmtB(needMore)}</div>`}
        </div>`;
      }).join('')}
    </div>

    <!-- Run Rate + Today -->
    <div class="grid-2" style="margin-bottom:12px;">
      <div class="card card-sm" style="border-left:3px solid var(--y);">
        <div class="kpi-label">${t('home_today_sales')}</div>
        <div class="kpi-value">${App.fmtB(todayTotal)}</div>
        <div class="kpi-sub">${billCount} ${I18n.lang==='th'?'บิล':'bills'}</div>
      </div>
      <div class="card card-sm" style="border-left:3px solid var(--black);">
        <div class="kpi-label">${t('so_run_rate')}</div>
        <div class="kpi-value" style="color:${runRate > 0 ? 'var(--danger)' : 'var(--success)'};">${App.fmtB(runRate)}</div>
        <div class="kpi-sub">${daysLeft} ${t('common_days')} ${I18n.lang==='th'?'เหลือ':'left'}</div>
      </div>
    </div>

    <!-- KPI Row -->
    <div class="kpi-grid" style="margin-bottom:12px;">
      <div class="kpi-card">
        <div class="kpi-label">${t('so_conversion')}</div>
        <div class="kpi-value">${conversion}${typeof conversion === 'string' && conversion !== '—' ? '%' : ''}</div>
        <div class="kpi-sub">${billCount}/${totalWalkins} ${I18n.lang==='th'?'คน':'persons'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">${t('so_basket')}</div>
        <div class="kpi-value">${App.fmtB(basketSize)}</div>
        <div class="kpi-sub">${I18n.lang==='th'?'ต่อบิล':'/bill'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">${t('so_upt')}</div>
        <div class="kpi-value">${upt}</div>
        <div class="kpi-sub">${I18n.lang==='th'?'ชิ้น/บิล':'pcs/bill'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">${t('so_no_bill')}</div>
        <div class="kpi-value" style="color:${noBillDays > 0 ? 'var(--danger)' : 'var(--success)'};">${noBillDays}</div>
        <div class="kpi-sub">${t('common_days')}</div>
      </div>
    </div>


    <!-- Walk-in Counter -->
    <div class="section-header">
      <span class="section-title">${t('so_customers_today')}</span>
      <span style="font-size:13px;color:var(--mid);font-weight:600;">${totalWalkins} ${I18n.lang==='th'?'คน':'persons'}</span>
    </div>
    <div class="card card-sm" style="margin-bottom:16px;">
      ${this._walkinMode === 'counter' ? `
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="btn btn-dark" style="flex:1;" onclick="SalesOrderPage.addWalkin()">
          + ${t('so_add_customer')}
        </button>
        <button class="btn btn-outline btn-sm" onclick="SalesOrderPage.editWalkinManual(${totalWalkins})">
          ${I18n.lang==='th'?'แก้ไข':'Edit'}
        </button>
      </div>` : `
      <div style="display:flex;align-items:center;gap:10px;">
        <label style="font-size:13px;color:var(--mid);flex:1;">${I18n.lang==='th'?'จำนวนลูกค้าวันนี้':'Customers today'}</label>
        <input type="number" min="0" value="${totalWalkins}"
          style="width:80px;height:40px;text-align:center;border-radius:8px;border:1.5px solid var(--border);background:var(--bg2);font-size:15px;font-weight:600;"
          onchange="SalesOrderPage.saveWalkin(parseInt(this.value))">
      </div>`}
    </div>

    <!-- Today's SO List -->
    <div class="section-header">
      <span class="section-title">${t('common_today')} — ${DateUtil.formatDate(today)}</span>
    </div>

    ${todayOrders.length === 0 ? `
    <div class="empty-state" style="padding:32px 0;">
      <div class="empty-icon">📋</div>
      <div class="empty-text">${I18n.lang==='th'?'ยังไม่มี SO วันนี้':'No SO yet today'}</div>
    </div>` : `
    <div style="margin-bottom:16px;">
      ${todayOrders.map(o => this._renderSOItem(o)).join('')}
    </div>`}

    <!-- Spacer for FAB -->
    <div style="height:80px;"></div>

    <!-- FAB -->
    <button class="fab fab-y" onclick="SalesOrderPage.showAddModal()" title="${t('so_add')}">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </button>
    `;
  },

  _renderSOItem(o) {
    const total     = o.totalAmt || 0;
    const items     = o.items || [];
    const itemCount = items.reduce((s, i) => s + (i.qty || 1), 0);
    const dateStr   = DateUtil.formatDate(o.date);
    // Show first 2 product names
    const namePreview = items.length > 0
      ? items.slice(0, 2).map(i => i.name || '—').join(', ') + (items.length > 2 ? ` +${items.length-2}` : '')
      : '—';
    return `
    <div class="list-item" onclick="SalesOrderPage.showSODetail(${o.id})">
      <div class="list-icon">📋</div>
      <div class="list-body">
        <div class="list-title">${o.soId || 'SO'}</div>
        <div class="list-sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${namePreview}</div>
        <div style="font-size:10px;color:var(--lt);margin-top:1px;">${dateStr} · ${itemCount} ${t('common_pieces')}</div>
      </div>
      <div class="list-right">
        <div class="list-amount">${App.fmtB(total)}</div>
        <div class="list-right-sub" style="color:var(--lt);font-size:10px;">${t('common_edit')} ›</div>
      </div>
    </div>`;
  },

  async addWalkin() {
    const today = DateUtil.today();
    const current = await DB.getSetting(`walkins_${today}`, 0);
    await DB.setSetting(`walkins_${today}`, current + 1);
    App.showToast(`+1 ${I18n.lang==='th'?'ลูกค้า':'customer'}`, 'success');
    Router.navigate('salesOrder', false);
  },

  async editWalkinManual(current) {
    App.openModal(`
    <div class="modal-title">${I18n.lang==='th'?'จำนวนลูกค้า':'Customers Today'}</div>
    <div class="form-group">
      <label class="form-label">${I18n.lang==='th'?'จำนวน (คน)':'Count (persons)'}</label>
      <input class="form-input" id="wk-count" type="number" min="0" value="${current}" style="text-align:center;font-size:20px;font-weight:700;">
    </div>
    <button class="btn btn-primary btn-full" onclick="SalesOrderPage._saveWalkinModal()">
      ${t('common_save')}
    </button>`);
  },

  async _saveWalkinModal() {
    const val = parseInt(document.getElementById('wk-count').value) || 0;
    await this.saveWalkin(val);
    App.closeModal();
    Router.navigate('salesOrder', false);
  },

  async saveWalkin(val) {
    await DB.setSetting(`walkins_${DateUtil.today()}`, val);
    App.showToast(t('common_saved'), 'success');
  },

  async showAddModal(editId = null) {
    const products = this._products;
    const groups   = this._groups;
    let so = null;
    if (editId) so = await DB.getSalesOrderById(editId);

    const soIdVal  = so?.soId || '';
    const dateVal  = so?.date || DateUtil.today();
    const items    = so?.items || [{ name: '', qty: 1, price: 0, total: 0, groupId: '' }];

    // Build product options — mark selected by product id or name
    const productOpts = (selectedId = '', selectedName = '') => {
      const all = products;
      let opts = `<option value="">— ${I18n.lang==='th'?'เลือกสินค้า':'Select product'} —</option>`;
      opts += all.map(p => {
        const sel = (selectedId && p.id == selectedId) || (!selectedId && p.name === selectedName);
        return `<option value="${p.id}" data-price="${p.price}" data-group="${p.groupId}" ${sel ? 'selected' : ''}>${p.name}</option>`;
      }).join('');
      // If saved name not in list, add custom option
      if (selectedName && !all.find(p => p.name === selectedName)) {
        opts += `<option value="custom" selected>${selectedName}</option>`;
      }
      return opts;
    };

    App.openModal(`
    <div class="modal-title">${editId ? t('common_edit') : t('so_add')}</div>
    <div class="grid-2" style="gap:10px;margin-bottom:12px;">
      <div class="form-group" style="margin:0;">
        <label class="form-label">${t('so_id')}</label>
        <input class="form-input" id="so-id" value="${soIdVal}" placeholder="SO-00001" style="text-transform:uppercase;">
      </div>
      <div class="form-group" style="margin:0;">
        <label class="form-label">${t('so_date')}</label>
        <input class="form-input" id="so-date" type="date" value="${dateVal}">
      </div>
    </div>

    <div class="card-title" style="margin-bottom:8px;">Product Division</div>
    <div id="so-items">
      ${items.map((it, i) => {
        // Find matching product ID from saved name
        const matchProd = products.find(p => p.name === it.name);
        const selId = matchProd?.id || '';
        return `
      <div class="product-row" id="item-row-${i}">
        <select class="form-input form-select" style="height:40px;padding:0 8px;font-size:13px;"
          onchange="SalesOrderPage._onProductSelect(this,${i})" data-idx="${i}" id="item-sel-${i}">
          ${productOpts(selId, it.name)}
        </select>
        <input type="number" value="${it.qty || 1}" min="1" placeholder="${t('so_qty')}"
          id="item-qty-${i}" oninput="SalesOrderPage._calcRow(${i})">
        <input type="number" value="${it.price || ''}" step="0.01" placeholder="${t('so_price')}"
          id="item-price-${i}" oninput="SalesOrderPage._calcRow(${i})">
        <button class="del-row" onclick="SalesOrderPage._removeItem(${i})">×</button>
      </div>`;
      }).join('')}
    </div>

    <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:8px;" onclick="SalesOrderPage._addItem()">
      ${t('so_add_product')}
    </button>

    <div class="divider"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <span style="font-weight:600;">${t('so_total')}</span>
      <span style="font-size:20px;font-weight:700;color:var(--black);" id="so-total-disp">฿0</span>
    </div>

    <div style="display:flex;gap:10px;">
      ${editId ? `<button class="btn btn-danger" onclick="SalesOrderPage._deleteSO(${editId})">${t('common_delete')}</button>` : ''}
      <button class="btn btn-primary" style="flex:1;" onclick="SalesOrderPage._saveSO(${editId || 'null'})">
        ${t('so_save')}
      </button>
    </div>`);

    this._updateTotal();
  },

  _onProductSelect(sel, idx) {
    // No price auto-fill (Product Division has no catalog price)
    this._calcRow(idx);
  },

  _calcRow(idx) {
    const qty   = parseFloat(document.getElementById(`item-qty-${idx}`)?.value) || 0;
    const price = parseFloat(document.getElementById(`item-price-${idx}`)?.value) || 0;
    this._updateTotal();
  },

  _updateTotal() {
    const rows = document.querySelectorAll('#so-items .product-row');
    let total = 0;
    rows.forEach((_, i) => {
      const qty   = parseFloat(document.getElementById(`item-qty-${i}`)?.value) || 0;
      const price = parseFloat(document.getElementById(`item-price-${i}`)?.value) || 0;
      total += qty * price;
    });
    const disp = document.getElementById('so-total-disp');
    if (disp) disp.textContent = App.fmtB(total);
  },

  _addItem() {
    const container = document.getElementById('so-items');
    const idx = container.querySelectorAll('.product-row').length;
    const row = document.createElement('div');
    row.className = 'product-row';
    row.id = `item-row-${idx}`;
    const productOpts = `<option value="">— ${I18n.lang==='th'?'เลือกสินค้า':'Select product'} —</option>` +
      this._products.map(p =>
        `<option value="${p.id}" data-price="${p.price}" data-group="${p.groupId}">${p.name}</option>`
      ).join('');
    row.innerHTML = `
      <select class="form-input form-select" style="height:40px;padding:0 8px;font-size:13px;"
        id="item-sel-${idx}" onchange="SalesOrderPage._onProductSelect(this,${idx})">
        ${productOpts}
      </select>
      <input type="number" value="1" min="1" id="item-qty-${idx}" oninput="SalesOrderPage._calcRow(${idx})">
      <input type="number" value="" step="0.01" id="item-price-${idx}" oninput="SalesOrderPage._calcRow(${idx})" placeholder="0">
      <button class="del-row" onclick="SalesOrderPage._removeItem(${idx})">×</button>`;
    container.appendChild(row);
  },

  _removeItem(idx) {
    const row = document.getElementById(`item-row-${idx}`);
    if (row) row.remove();
    this._updateTotal();
  },

  async _saveSO(editId) {
    const soId  = (document.getElementById('so-id')?.value || '').trim().toUpperCase();
    const date  = document.getElementById('so-date')?.value || DateUtil.today();
    const rows  = document.querySelectorAll('#so-items .product-row');
    const items = [];
    let totalAmt = 0;

    rows.forEach((_, i) => {
      const sel   = _.querySelector('select');
      const qty   = parseFloat(document.getElementById(`item-qty-${i}`)?.value) || 0;
      const price = parseFloat(document.getElementById(`item-price-${i}`)?.value) || 0;
      if (qty > 0 && price > 0) {
        const name   = sel?.options[sel.selectedIndex]?.text || '';
        const groupId = parseFloat(sel?.options[sel.selectedIndex]?.dataset.group) || '';
        const total  = qty * price;
        items.push({ name, qty, price, total, groupId });
        totalAmt += total;
      }
    });

    if (!soId) { App.showToast(t('common_required'), 'error'); return; }
    if (items.length === 0) { App.showToast(I18n.lang==='th'?'กรุณาเพิ่มสินค้า':'Please add items', 'error'); return; }

    const data = { empId: App.empId, soId, date, items, totalAmt };
    try {
      if (editId) await DB.updateSalesOrder(editId, data);
      else        await DB.addSalesOrder(data);
      App.closeModal();
      App.showToast(t('common_saved'), 'success');
      Router.navigate('salesOrder', false);
    } catch (e) {
      App.showToast(e.message, 'error');
    }
  },

  async showSODetail(id) {
    const so = await DB.getSalesOrderById(id);
    if (!so) return;
    // Only allow edit on same day
    const canEdit = so.date === DateUtil.today();
    if (canEdit) this.showAddModal(id);
    else App.showToast(I18n.lang==='th'?'แก้ไขได้เฉพาะวันที่บันทึก':'Can only edit same-day SO', 'warn');
  },

  async _deleteSO(id) {
    App.confirm(t('so_delete_confirm'), '', '🗑️', async () => {
      await DB.deleteSalesOrder(id);
      App.closeModal();
      App.showToast(t('common_deleted'));
      Router.navigate('salesOrder', false);
    }, true);
  },

  // ── LINE Share: SO Summary ─────────────────────────────────
  async _shareSOLine() {
    try {
      const emp   = App.emp;
      const month = DateUtil.currentMonth();
      const today = DateUtil.today();

      const [target, monthOrders, todayOrders, monthBills, groups] = await Promise.all([
        DB.getTarget(emp.id, month),
        DB.getSalesOrdersByMonth(emp.id, month),
        DB.getSalesOrdersByDate(emp.id, today),
        DB.getBillingByMonth(emp.id, month),
        DB.getGroups(),
      ]);

      const targetAmt  = target?.targetAmt || 0;
      const calData    = target?.calendarData || {};
      const monthTotal = monthOrders.reduce((s, o) => s + (o.totalAmt || 0), 0);
      const todayTotal = todayOrders.reduce((s, o) => s + (o.totalAmt || 0), 0);
      const pct        = targetAmt > 0 ? Math.round(monthTotal / targetAmt * 100) : 0;

      // Tier
      const soPct = targetAmt > 0 ? (monthTotal / targetAmt) * 100 : 0;
      const tier  = soPct >= 115 ? 't4' : soPct >= 100 ? 't3' : soPct >= 90 ? 't2' : 't1';

      // To Tier 115%
      const toT4 = Math.max(targetAmt * 1.15 - monthTotal, 0);

      // Today's items (flatten)
      const todayItems = todayOrders.flatMap(o => o.items || []);
      const todayBillCount = todayOrders.length;
      const todayItemCount = todayItems.reduce((s, it) => s + (it.qty || 1), 0);

      // Month stats
      const monthBillCount    = monthOrders.length;
      const distinctSODates   = new Set(monthOrders.map(o => o.date)).size;

      // Work days passed up to today (exclude weekends & calendar off/leave)
      const [yr, mo] = month.split('-').map(Number);
      const allDays  = DateUtil.getMonthDays(yr, mo);
      const workDaysPassed = allDays.filter(d => {
        if (d.date > today) return false;
        const st = calData[d.date];
        return st !== 'holiday' && st !== 'leave' && !d.isWeekend;
      }).length;
      const noBillDays = Math.max(workDaysPassed - distinctSODates, 0);

      // UPT & Basket Size (today's data)
      const upt        = todayBillCount > 0 ? (todayItemCount / todayBillCount).toFixed(1) : '0.0';
      const basketSize = todayBillCount > 0 ? App.fmtB(todayTotal / todayBillCount) : '—';

      // Incentive from month billing per tier
      const monthInc = monthBills.reduce((s, b) => {
        const g = groups.find(g => g.id === b.groupId);
        const p = g?.incentivePct?.[tier] || 0;
        return s + (b.amount || 0) * p / 100;
      }, 0);

      const D = '──────────────────';
      let txt = `📋 รายงานยอดขาย ${DateUtil.formatDate(today)}\n`;
      txt += `👤 ${emp.name} #${emp.empCode}\n`;
      txt += `${D}\n`;
      txt += `💰 ยอดวันนี้: ${App.fmtB(todayTotal)}\n`;
      txt += `🧾 ${todayBillCount} บิล  📦 ${todayItemCount} ชิ้น\n`;
      txt += `${D}\n`;

      // Today's item breakdown
      for (const it of todayItems) {
        const amt = it.total || (it.qty || 1) * (it.price || 0);
        txt += `• ${it.name || '—'}: ${it.qty || 1} ชิ้น ${App.fmtB(amt)}\n`;
      }

      txt += `${D}\n`;
      txt += `📈 ยอดสะสม: ${App.fmtB(monthTotal)}\n`;
      txt += `🎯 เป้า: ${App.fmtB(targetAmt)} (${pct}%)\n`;
      txt += toT4 > 0
        ? `⚡ อีก ${App.fmtB(toT4)} → Tier 115%\n`
        : `🏆 บรรลุ Tier 115% แล้ว!\n`;
      txt += `${D}\n`;
      txt += `📅 No Bill Days: ${noBillDays} วัน (จาก ${workDaysPassed} วันทำการ)\n`;
      txt += `📦 UPT: ${upt} ชิ้น/บิล\n`;
      txt += `🛒 Basket Size: ${basketSize}/บิล\n`;
      txt += `🧾 จำนวนบิลรวม: ${monthBillCount} บิล\n`;
      txt += `${D}\n`;
      txt += `💎 Incentive: ${App.fmtB(monthInc)}\n`;
      txt += `${D}\n`;
      txt += `ส่งจาก Retail Sales Application`;

      await ExportUtil.shareText(txt);
    } catch (e) {
      App.showToast(e.message, 'error');
    }
  },

  init() {
    App.setTopbarExtra(`
      <button class="icon-btn" onclick="SalesOrderPage._shareSOLine()"
        title="${I18n.lang==='th'?'ส่งรายงานทาง LINE':'Share via LINE'}"
        style="color:#06C755;">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
        </svg>
      </button>`);
  }
};
