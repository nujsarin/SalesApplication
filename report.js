/* ============================================================
   report.js — Reports Page
   ============================================================ */
'use strict';

window.ReportPage = {
  _tab: 'so_monthly',
  _month: null,

  async render() {
    this._month = this._month || DateUtil.currentMonth();
    const months = DateUtil.recentMonths(6);

    const tabs = [
      { k:'so_monthly',   l: t('report_so_monthly') },
      { k:'so_daily',     l: t('report_so_daily') },
      { k:'bill_monthly', l: t('report_bill_monthly') },
      { k:'bill_daily',   l: t('report_bill_daily') },
      { k:'pipeline',     l: t('report_pipeline') },
    ];

    return `
    <!-- Tab Bar -->
    <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:16px;">
      ${tabs.map(tab => `
      <button style="flex-shrink:0;height:34px;padding:0 14px;border-radius:99px;font-size:12px;font-weight:600;
        border:1.5px solid ${this._tab === tab.k ? 'var(--black)' : 'var(--border)'};
        background:${this._tab === tab.k ? 'var(--black)' : 'transparent'};
        color:${this._tab === tab.k ? '#fff' : 'var(--mid)'};"
        onclick="ReportPage._setTab('${tab.k}')">
        ${tab.l}
      </button>`).join('')}
    </div>

    <!-- Month Picker (for monthly reports, not daily/pipeline) -->
    ${this._tab !== 'pipeline' && this._tab !== 'so_daily' && this._tab !== 'bill_daily' ? `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;overflow-x:auto;padding-bottom:2px;">
      ${months.map(m => `
      <button style="flex-shrink:0;height:32px;padding:0 12px;border-radius:99px;font-size:11px;font-weight:600;
        border:1.5px solid ${this._month === m ? 'var(--y)' : 'var(--border)'};
        background:${this._month === m ? 'var(--y)' : 'transparent'};
        color:${this._month === m ? 'var(--black)' : 'var(--mid)'};"
        onclick="ReportPage._setMonth('${m}')">
        ${DateUtil.formatMonth(m)}
      </button>`).join('')}
    </div>` : ''}

    <!-- Content -->
    <div id="report-content">
      <div style="text-align:center;padding:32px;color:var(--lt);">
        <span class="spinner"></span>
      </div>
    </div>
    `;
  },

  _setTab(tab) {
    this._tab = tab;
    Router.navigate('report', false);
  },

  _setMonth(m) {
    this._month = m;
    Router.navigate('report', false);
  },

  async init() {
    const content = document.getElementById('report-content');
    if (!content) return;
    try {
      let html = '';
      switch (this._tab) {
        case 'so_monthly':   html = await this._renderSOMonthly(); break;
        case 'so_daily':     html = await this._renderSODaily(); break;
        case 'bill_monthly': html = await this._renderBillingMonthly(); break;
        case 'bill_daily':   html = await this._renderBillingDaily(); break;
        case 'pipeline':     html = await this._renderPipeline(); break;
      }
      content.innerHTML = html;
      this._initCharts();
    } catch (e) {
      content.innerHTML = `<div class="empty-state"><div class="empty-text">${e.message}</div></div>`;
    }
  },

  async _renderSOMonthly() {
    const emp = App.emp;
    const [orders, target] = await Promise.all([
      DB.getSalesOrdersByMonth(emp.id, this._month),
      DB.getTarget(emp.id, this._month),
    ]);
    const targetAmt = target?.targetAmt || 0;
    const total = orders.reduce((s, o) => s + (o.totalAmt || 0), 0);
    const pct   = targetAmt > 0 ? (total / targetAmt * 100).toFixed(1) : '—';

    // Daily breakdown
    const byDate = {};
    for (const o of orders) byDate[o.date] = (byDate[o.date] || 0) + (o.totalAmt || 0);
    const sortedDates = Object.keys(byDate).sort();

    return `
    <!-- Summary -->
    <div class="grid-2" style="margin-bottom:12px;">
      <div class="kpi-card" style="border-left:3px solid var(--y);">
        <div class="kpi-label">${t('so_achieved')}</div>
        <div class="kpi-value">${App.fmtB(total)}</div>
        <div class="kpi-sub">${pct}% of target</div>
      </div>
      <div class="kpi-card" style="border-left:3px solid var(--black);">
        <div class="kpi-label">${t('so_target')}</div>
        <div class="kpi-value">${App.fmtB(targetAmt)}</div>
        <div class="kpi-sub">${orders.length} SO bills</div>
      </div>
    </div>

    <!-- Chart -->
    <div class="chart-wrap" style="margin-bottom:16px;">
      <div class="chart-title">${I18n.lang==='th'?'ยอดขายรายวัน':'Daily Sales'}</div>
      <div style="height:180px;"><canvas id="report-chart-main"></canvas></div>
    </div>

    <!-- Data -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:16px;">
      <table class="data-table">
        <thead><tr>
          <th>${t('so_date')}</th>
          <th style="text-align:right;">${t('so_total')}</th>
          <th style="text-align:right;">${I18n.lang==='th'?'บิล':'Bills'}</th>
        </tr></thead>
        <tbody>
          ${sortedDates.length === 0
            ? `<tr><td colspan="3" style="text-align:center;color:var(--lt);">${t('common_no_data')}</td></tr>`
            : sortedDates.map(d => {
              const dayOrders = orders.filter(o => o.date === d);
              return `<tr>
                <td>${DateUtil.formatDate(d)}</td>
                <td style="text-align:right;font-weight:600;">${App.fmtB(byDate[d])}</td>
                <td style="text-align:right;">${dayOrders.length}</td>
              </tr>`;
            }).join('')}
        </tbody>
        <tfoot>
          <tr style="background:var(--bg2);">
            <td style="font-weight:700;">${t('so_total')}</td>
            <td style="text-align:right;font-weight:700;">${App.fmtB(total)}</td>
            <td style="text-align:right;">${orders.length}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    ${this._exportButtons('so_monthly', orders, targetAmt)}`;
  },

  async _renderSODaily() {
    const today = DateUtil.today();
    const emp   = App.emp;
    const orders = await DB.getSalesOrdersByDate(emp.id, today);
    const total  = orders.reduce((s, o) => s + (o.totalAmt || 0), 0);

    return `
    <div style="margin-bottom:12px;">
      <div style="font-size:13px;color:var(--lt);">${DateUtil.formatDate(today)}</div>
      <div style="font-size:24px;font-weight:700;">${App.fmtB(total)}</div>
      <div style="font-size:13px;color:var(--mid);">${orders.length} ${I18n.lang==='th'?'บิล':'bills'}</div>
    </div>

    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:16px;">
      <table class="data-table">
        <thead><tr>
          <th>SO ID</th>
          <th style="text-align:right;">${t('so_total')}</th>
          <th style="text-align:right;">${I18n.lang==='th'?'ชิ้น':'Items'}</th>
        </tr></thead>
        <tbody>
          ${orders.length === 0
            ? `<tr><td colspan="3" style="text-align:center;color:var(--lt);">${t('common_no_data')}</td></tr>`
            : orders.map(o => {
              const items = o.items || [];
              const qty = items.reduce((s, i) => s + (i.qty || 1), 0);
              return `<tr>
                <td style="font-weight:500;">${o.soId || '—'}</td>
                <td style="text-align:right;font-weight:600;">${App.fmtB(o.totalAmt)}</td>
                <td style="text-align:right;">${qty}</td>
              </tr>`;
            }).join('')}
        </tbody>
        ${orders.length > 0 ? `<tfoot>
          <tr style="background:var(--bg2);">
            <td style="font-weight:700;">${t('so_total')}</td>
            <td style="text-align:right;font-weight:700;">${App.fmtB(total)}</td>
            <td></td>
          </tr>
        </tfoot>` : ''}
      </table>
    </div>
    ${this._exportButtons('so_daily', orders)}`;
  },

  async _renderBillingMonthly() {
    const emp  = App.emp;
    const [bills, groups] = await Promise.all([
      DB.getBillingByMonth(emp.id, this._month),
      DB.getGroups(),
    ]);
    const byGroup = {};
    for (const b of bills) byGroup[b.groupId] = (byGroup[b.groupId] || 0) + (b.amount || 0);
    const total = bills.reduce((s, b) => s + (b.amount || 0), 0);

    return `
    <div class="kpi-card" style="margin-bottom:12px;border-left:3px solid var(--y);">
      <div class="kpi-label">${t('billing_title')} — ${DateUtil.formatMonth(this._month)}</div>
      <div class="kpi-value">${App.fmtB(total)}</div>
    </div>

    <div class="chart-wrap" style="margin-bottom:16px;">
      <div class="chart-title">${I18n.lang==='th'?'บิลแยกกลุ่ม':'Billing by Group'}</div>
      <div style="height:160px;"><canvas id="report-chart-main"></canvas></div>
    </div>

    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:16px;">
      <table class="data-table">
        <thead><tr>
          <th>${t('billing_group')}</th>
          <th style="text-align:right;">${t('billing_amount')}</th>
        </tr></thead>
        <tbody>
          ${groups.map(g => `<tr>
            <td style="font-size:12px;">${(g.name||'').split('—')[0].trim()}</td>
            <td style="text-align:right;font-weight:600;">${App.fmtB(byGroup[g.id] || 0)}</td>
          </tr>`).join('')}
        </tbody>
        <tfoot><tr style="background:var(--bg2);">
          <td style="font-weight:700;">${t('common_all')}</td>
          <td style="text-align:right;font-weight:700;">${App.fmtB(total)}</td>
        </tr></tfoot>
      </table>
    </div>
    ${this._exportButtons('bill_monthly', bills, null, groups)}`;
  },

  async _renderBillingDaily() {
    const emp   = App.emp;
    const today = DateUtil.today();
    const month = DateUtil.currentMonth();

    const [bills, groups, target, monthSO] = await Promise.all([
      DB.getBillingByDate(emp.id, today),
      DB.getGroups(),
      DB.getTarget(emp.id, month),
      DB.getMonthSOTotal(emp.id, month),
    ]);

    const targetAmt = target?.targetAmt || 0;
    const soPct     = targetAmt > 0 ? (monthSO / targetAmt) * 100 : 0;
    const tier      = soPct >= 115 ? 't4' : soPct >= 100 ? 't3' : soPct >= 90 ? 't2' : 't1';
    const tierNum   = parseInt(tier.replace('t', ''));

    const total   = bills.reduce((s, b) => s + (b.amount || 0), 0);
    const totalInc = bills.reduce((s, b) => {
      const g = groups.find(g => g.id === b.groupId);
      const p = g?.incentivePct?.[tier] || 0;
      return s + (b.amount || 0) * p / 100;
    }, 0);

    const billsByGroup = {};
    for (const b of bills) billsByGroup[b.groupId] = b;

    return `
    <div style="margin-bottom:12px;">
      <div style="font-size:13px;color:var(--lt);">${DateUtil.formatDate(today)}</div>
      <div style="font-size:24px;font-weight:700;">${App.fmtB(total)}</div>
      <div style="font-size:13px;color:var(--mid);">Incentive: <strong style="color:var(--y-dark);">${App.fmtB(totalInc)}</strong></div>
    </div>

    <!-- Tier badge -->
    <div class="card card-sm" style="margin-bottom:12px;background:var(--y-light);">
      <div style="font-size:12px;color:var(--y-dark);font-weight:600;">
        🏆 SO Tier ปัจจุบัน: <strong>T${tierNum}</strong> (${soPct.toFixed(1)}%)
      </div>
    </div>

    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:16px;">
      <table class="data-table">
        <thead><tr>
          <th>${t('billing_group')}</th>
          <th style="text-align:right;">${t('billing_amount')}</th>
          <th style="text-align:right;">${t('billing_incentive')}</th>
        </tr></thead>
        <tbody>
          ${groups.map(g => {
            const bill = billsByGroup[g.id];
            const amt  = bill?.amount || 0;
            const pct  = g.incentivePct?.[tier] || 0;
            const inc  = amt * pct / 100;
            return `<tr>
              <td style="font-size:12px;">
                <div style="font-weight:500;">${(g.name||'').split('—')[0].trim()}</div>
                <div style="font-size:10px;color:var(--lt);">Incentive ${pct}%</div>
              </td>
              <td style="text-align:right;font-weight:600;">${amt > 0 ? App.fmtB(amt) : '<span style="color:var(--lt);">—</span>'}</td>
              <td style="text-align:right;font-weight:600;color:var(--y-dark);">${inc > 0 ? App.fmtB(inc) : '—'}</td>
            </tr>`;
          }).join('')}
        </tbody>
        <tfoot><tr style="background:var(--bg2);">
          <td style="font-weight:700;">${t('common_all')}</td>
          <td style="text-align:right;font-weight:700;">${App.fmtB(total)}</td>
          <td style="text-align:right;font-weight:700;color:var(--y-dark);">${App.fmtB(totalInc)}</td>
        </tr></tfoot>
      </table>
    </div>
    ${this._exportButtons('bill_daily', bills)}`;
  },

  async _renderPipeline() {
    const customers = await DB.getCustomers(App.empId);
    const stMap = {
      deciding: { cls: 'ps-deciding', l: t('cust_deciding') },
      followup:  { cls: 'ps-followup', l: t('cust_followup') },
      closed:    { cls: 'ps-closed',   l: t('cust_closed') },
    };
    return `
    <div class="kpi-grid" style="margin-bottom:16px;">
      <div class="kpi-card"><div class="kpi-label">${t('common_all')}</div><div class="kpi-value">${customers.length}</div></div>
      <div class="kpi-card"><div class="kpi-label">${t('cust_closed')}</div><div class="kpi-value" style="color:var(--success);">${customers.filter(c=>c.status==='closed').length}</div></div>
    </div>

    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:16px;">
      <table class="data-table">
        <thead><tr>
          <th>${t('cust_name')}</th>
          <th>${t('cust_status')}</th>
          <th>${t('cust_tel')}</th>
        </tr></thead>
        <tbody>
          ${customers.length === 0
            ? `<tr><td colspan="3" style="text-align:center;color:var(--lt);">${t('common_no_data')}</td></tr>`
            : customers.map(c => {
              const st = stMap[c.status] || stMap.deciding;
              return `<tr>
                <td style="font-weight:500;">${c.name || '—'}</td>
                <td><span class="pipeline-status ${st.cls}">${st.l}</span></td>
                <td style="font-size:12px;color:var(--lt);">${c.tel || '—'}</td>
              </tr>`;
            }).join('')}
        </tbody>
      </table>
    </div>
    ${this._exportButtons('pipeline', customers)}`;
  },

  _exportButtons(type, data, extra1 = null, extra2 = null) {
    return `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
      <button class="btn btn-outline btn-sm" style="flex:1;" onclick="ReportPage._exportExcel('${type}')">
        📊 ${t('report_export_xlsx')}
      </button>
      <button class="btn btn-outline btn-sm" style="flex:1;" onclick="ReportPage._shareLine('${type}')">
        💬 ${t('report_share_line')}
      </button>
    </div>`;
  },

  async _exportExcel(type) {
    const emp = App.emp;
    if (type === 'so_monthly' || type === 'so_daily') {
      const orders = type === 'so_monthly'
        ? await DB.getSalesOrdersByMonth(emp.id, this._month)
        : await DB.getSalesOrdersByDate(emp.id, DateUtil.today());
      await ExportUtil.exportSOToExcel(emp, this._month, orders);
    } else if (type === 'bill_monthly' || type === 'bill_daily') {
      const date   = type === 'bill_daily' ? DateUtil.today() : null;
      const [bills, groups] = await Promise.all([
        date ? DB.getBillingByDate(emp.id, date) : DB.getBillingByMonth(emp.id, this._month),
        DB.getGroups(),
      ]);
      await ExportUtil.exportBillingToExcel(emp, date || this._month, bills, groups);
    } else if (type === 'pipeline') {
      const customers = await DB.getCustomers(emp.id);
      await ExportUtil.exportCustomerToExcel(emp, customers);
    }
  },

  async _shareLine(type) {
    const emp = App.emp;
    if (type === 'bill_daily') {
      // Reuse BillingPage share method for daily billing summary
      await BillingPage._shareBillingLine();
      return;
    }
    if (type === 'bill_monthly') {
      const [bills, groups, target, monthSO] = await Promise.all([
        DB.getBillingByMonth(emp.id, this._month),
        DB.getGroups(),
        DB.getTarget(emp.id, this._month),
        DB.getMonthSOTotal(emp.id, this._month),
      ]);
      const targetAmt = target?.targetAmt || 0;
      const soPct = targetAmt > 0 ? (monthSO / targetAmt) * 100 : 0;
      const tier  = soPct >= 115 ? 't4' : soPct >= 100 ? 't3' : soPct >= 90 ? 't2' : 't1';
      const total = bills.reduce((s, b) => s + (b.amount || 0), 0);
      const totalInc = bills.reduce((s, b) => {
        const g = groups.find(g => g.id === b.groupId);
        return s + (b.amount || 0) * (g?.incentivePct?.[tier] || 0) / 100;
      }, 0);
      const isTH = I18n.lang === 'th';
      let txt = isTH
        ? `💰 สรุปบิลเดือน ${DateUtil.formatMonth(this._month)}\n`
        : `💰 Billing Monthly ${DateUtil.formatMonth(this._month)}\n`;
      txt += `${'─'.repeat(28)}\n`;
      for (const g of groups) {
        const amt = bills.filter(b => b.groupId === g.id).reduce((s, b) => s + (b.amount || 0), 0);
        if (!amt) continue;
        const pct = g.incentivePct?.[tier] || 0;
        txt += `• ${(g.name||'').split('—')[0].trim()}: ${App.fmtB(amt)} (Inc ${pct}%)\n`;
      }
      txt += `${'─'.repeat(28)}\n`;
      txt += isTH ? `รวม: ${App.fmtB(total)}\nIncentive: ${App.fmtB(totalInc)}\n` : `Total: ${App.fmtB(total)}\nIncentive: ${App.fmtB(totalInc)}\n`;
      await ExportUtil.shareText(txt);
      return;
    }
    // Default: SO summary
    const orders = await DB.getSalesOrdersByMonth(emp.id, this._month);
    const target = await DB.getTarget(emp.id, this._month);
    const text = ExportUtil.buildSOSummaryText(emp, this._month, orders, target?.targetAmt || 0);
    await ExportUtil.shareText(text);
  },

  _initCharts() {
    const tab = this._tab;
    setTimeout(async () => {
      if (tab === 'so_monthly') {
        const orders = await DB.getSalesOrdersByMonth(App.empId, this._month);
        const byDate = {};
        for (const o of orders) byDate[o.date] = (byDate[o.date] || 0) + (o.totalAmt || 0);
        const dates = Object.keys(byDate).sort();
        ChartUtil.renderBarChart('report-chart-main',
          dates.map(d => d.slice(8)),
          dates.map(d => byDate[d])
        );
      } else if (tab === 'bill_monthly') {
        const [bills, groups] = await Promise.all([
          DB.getBillingByMonth(App.empId, this._month),
          DB.getGroups(),
        ]);
        const byGroup = {};
        for (const b of bills) byGroup[b.groupId] = (byGroup[b.groupId] || 0) + (b.amount || 0);
        ChartUtil.renderGroupBar('report-chart-main',
          groups.map(g => (g.name||'').split('—')[0].trim().slice(0,12)),
          groups.map(g => byGroup[g.id] || 0)
        );
      }
    }, 100);
  }
};
