/* ============================================================
   billing.js — Sales Billing Page
   ============================================================ */
'use strict';

window.BillingPage = {
  _groups: [],
  _selectedDate: null,

  async render() {
    const emp = App.emp;
    this._selectedDate = this._selectedDate || DateUtil.today();
    const month = DateUtil.currentMonth();

    const [groups, bills, monthBills, target] = await Promise.all([
      DB.getGroups(),
      DB.getBillingByDate(emp.id, this._selectedDate),
      DB.getBillingByMonth(emp.id, month),
      DB.getTarget(emp.id, month),
    ]);

    this._groups = groups;

    // Month cumulative per group
    const monthByGroup = {};
    for (const b of monthBills) {
      if (!monthByGroup[b.groupId]) monthByGroup[b.groupId] = 0;
      monthByGroup[b.groupId] += (b.amount || 0);
    }

    const totalMonth = monthBills.reduce((s, b) => s + (b.amount || 0), 0);
    const totalDay   = bills.reduce((s, b) => s + (b.amount || 0), 0);

    // Determine current tier from SO
    const monthSO    = await DB.getMonthSOTotal(emp.id, month);
    const targetAmt  = target?.targetAmt || 0;
    const soPct      = targetAmt > 0 ? (monthSO / targetAmt) * 100 : 0;
    const tier       = soPct >= 115 ? 't4' : soPct >= 100 ? 't3' : soPct >= 90 ? 't2' : soPct >= 80 ? 't1' : 't1';
    const tierNum    = parseInt(tier.replace('t', ''));

    // Build billing entries for display
    const billsByGroup = {};
    for (const b of bills) {
      billsByGroup[b.groupId] = b;
    }

    const todayStr = DateUtil.today();

    return `
    <!-- Header: Date picker -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <div>
        <div style="font-size:12px;color:var(--lt);">${t('billing_date')}</div>
        <div style="font-size:17px;font-weight:700;">${DateUtil.formatDate(this._selectedDate)}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        ${this._selectedDate !== todayStr ? `
        <button class="btn btn-dark btn-xs" onclick="BillingPage._changeDate('${todayStr}')">
          ${I18n.lang==='th'?'วันนี้':'Today'}
        </button>` : `
        <span class="chip chip-y" style="font-size:11px;">${I18n.lang==='th'?'วันนี้':'Today'}</span>`}
        <input type="date" value="${this._selectedDate}"
          style="height:36px;padding:0 10px;border-radius:var(--radius-sm);border:1.5px solid var(--border);background:var(--bg2);font-size:13px;outline:none;"
          onchange="BillingPage._changeDate(this.value)">
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid-2" style="margin-bottom:16px;">
      <div class="card card-sm" style="border-left:3px solid var(--y);">
        <div class="kpi-label">${I18n.lang==='th'?'บิลวันนี้':'Today Billing'}</div>
        <div class="kpi-value">${App.fmtB(totalDay)}</div>
      </div>
      <div class="card card-sm" style="border-left:3px solid var(--black);">
        <div class="kpi-label">${I18n.lang==='th'?'บิลสะสมเดือน':'Month Billing'}</div>
        <div class="kpi-value">${App.fmtB(totalMonth)}</div>
      </div>
    </div>

    <!-- Tier indicator -->
    <div class="card card-sm" style="margin-bottom:16px;background:var(--y-light);">
      <div style="font-size:12px;color:var(--y-dark);font-weight:600;">
        📊 SO Tier ปัจจุบัน: <strong>Tier ${tierNum}</strong> (${soPct.toFixed(1)}%) → Incentive อ้างอิง Tier ${tierNum}
      </div>
    </div>

    <!-- Billing Entry Table -->
    <div class="section-header">
      <span class="section-title">${t('billing_group')}</span>
    </div>

    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:16px;">
      <table class="data-table" style="width:100%;">
        <thead>
          <tr>
            <th>${t('billing_group')}</th>
            <th style="text-align:right;">${t('billing_amount')}</th>
            <th style="text-align:right;">${t('billing_incentive')}</th>
          </tr>
        </thead>
        <tbody>
          ${groups.map(g => {
            const bill    = billsByGroup[g.id];
            const amount  = bill?.amount || 0;
            const pctVal  = g.incentivePct?.[tier] || 0;
            const incAmt  = amount * pctVal / 100;
            const cumul   = monthByGroup[g.id] || 0;
            return `<tr onclick="BillingPage.showGroupModal(${g.id}, '${(g.name || '').replace(/'/g, "\\'")}', ${amount}, ${g.incentivePct ? JSON.stringify(g.incentivePct).replace(/"/g,"'") : '{}'}, '${tier}')">
              <td style="font-size:13px;">
                <div style="font-weight:500;color:var(--black);">${(g.name || '').split('—')[0].trim()}</div>
                <div style="font-size:10px;color:var(--lt);margin-top:2px;">${t('billing_cumulative')}: ${App.fmtB(cumul)}</div>
              </td>
              <td style="text-align:right;">
                <div style="font-weight:600;">${amount > 0 ? App.fmtB(amount) : '<span style="color:var(--lt);">—</span>'}</div>
                <div style="font-size:10px;color:var(--lt);">Incentive ${pctVal}%</div>
              </td>
              <td style="text-align:right;">
                <div style="font-weight:600;color:var(--y-dark);">${incAmt > 0 ? App.fmtB(incAmt) : '—'}</div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background:var(--bg2);">
            <td style="font-weight:700;font-size:14px;">${t('common_all')}</td>
            <td style="text-align:right;font-weight:700;font-size:14px;">${App.fmtB(totalDay)}</td>
            <td style="text-align:right;font-weight:700;font-size:14px;color:var(--y-dark);">
              ${App.fmtB(bills.reduce((s, b) => {
                const g = groups.find(g => g.id === b.groupId);
                const p = g?.incentivePct?.[tier] || 0;
                return s + (b.amount || 0) * p / 100;
              }, 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Month Chart -->
    <div class="chart-wrap" style="margin-bottom:16px;">
      <div class="chart-title">${I18n.lang==='th'?'บิลแยกตามกลุ่ม (เดือนนี้)':'Billing by Group (Month)'}</div>
      <div style="height:160px;">
        <canvas id="billing-chart"></canvas>
      </div>
    </div>

    <div style="height:20px;"></div>
    `;
  },

  async _changeDate(date) {
    this._selectedDate = date;
    Router.navigate('billing', false);
  },

  async showGroupModal(groupId, groupName, currentAmount, incPctObj, tier) {
    const forecasts = [0, 50000, 100000, 200000, 300000, 500000];
    const pct = incPctObj?.[tier] || 0;

    App.openModal(`
    <div class="modal-title">${groupName.split('—')[0].trim()}</div>

    <div class="form-group">
      <label class="form-label">${t('billing_amount')} (${DateUtil.formatDate(this._selectedDate)})</label>
      <div class="amount-input-wrap">
        <span class="amount-prefix">฿</span>
        <input class="amount-input" id="bill-amount" type="number" value="${currentAmount || ''}"
          placeholder="0" oninput="BillingPage._previewIncentive(${pct})">
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">${t('billing_forecast')} (${I18n.lang==='th'?'ประมาณการเดือน':'Month Forecast'})</label>
      <div class="amount-input-wrap">
        <span class="amount-prefix">฿</span>
        <input class="amount-input" id="bill-forecast" type="number" placeholder="0"
          oninput="BillingPage._previewIncentive(${pct})">
      </div>
    </div>

    <div class="card card-y card-sm" style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:12px;color:var(--y-dark);">Incentive (${tier.toUpperCase()} · ${pct}%)</div>
          <div style="font-size:11px;color:var(--lt);margin-top:2px;">${t('billing_forecast')} incentive</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:18px;font-weight:700;color:var(--y-dark);" id="inc-preview">฿0</div>
          <div style="font-size:11px;color:var(--lt);" id="inc-forecast-preview"></div>
        </div>
      </div>
    </div>

    <button class="btn btn-primary btn-full" onclick="BillingPage._saveBilling(${groupId}, ${pct})">
      ${t('billing_save')}
    </button>`);

    setTimeout(() => {
      const inp = document.getElementById('bill-amount');
      if (inp) { inp.focus(); BillingPage._previewIncentive(pct); }
    }, 100);
  },

  _previewIncentive(pct) {
    const amt  = parseFloat(document.getElementById('bill-amount')?.value) || 0;
    const fore = parseFloat(document.getElementById('bill-forecast')?.value) || 0;
    const inc  = amt * pct / 100;
    const incF = fore * pct / 100;
    const prev = document.getElementById('inc-preview');
    const prevF= document.getElementById('inc-forecast-preview');
    if (prev) prev.textContent = App.fmtB(inc);
    if (prevF) prevF.textContent = fore > 0 ? `${t('billing_forecast')}: ${App.fmtB(incF)}` : '';
  },

  async _saveBilling(groupId, pct) {
    const amount = parseFloat(document.getElementById('bill-amount')?.value) || 0;
    const forecast = parseFloat(document.getElementById('bill-forecast')?.value) || 0;
    const incentiveAmt = amount * pct / 100;

    try {
      await DB.upsertBillingEntry(App.empId, this._selectedDate, groupId, {
        amount, forecast, incentivePct: pct, incentiveAmt
      });
      App.closeModal();
      App.showToast(t('common_saved'), 'success');
      Router.navigate('billing', false);
    } catch (e) {
      App.showToast(e.message, 'error');
    }
  },

  async _shareBillingLine() {
    try {
      const emp   = App.emp;
      const month = DateUtil.currentMonth();
      const today = DateUtil.today();

      const [groups, bills, monthBills, target, monthSO] = await Promise.all([
        DB.getGroups(),
        DB.getBillingByDate(emp.id, today),
        DB.getBillingByMonth(emp.id, month),
        DB.getTarget(emp.id, month),
        DB.getMonthSOTotal(emp.id, month),
      ]);

      const targetAmt = target?.targetAmt || 0;
      const soPct     = targetAmt > 0 ? (monthSO / targetAmt) * 100 : 0;
      const tier      = soPct >= 115 ? 't4' : soPct >= 100 ? 't3' : soPct >= 90 ? 't2' : 't1';
      const tierNum   = parseInt(tier.replace('t', ''));

      const totalDay   = bills.reduce((s, b) => s + (b.amount || 0), 0);
      const totalMonth = monthBills.reduce((s, b) => s + (b.amount || 0), 0);

      // Day incentive
      const dayInc = bills.reduce((s, b) => {
        const g = groups.find(g => g.id === b.groupId);
        const p = g?.incentivePct?.[tier] || 0;
        return s + (b.amount || 0) * p / 100;
      }, 0);

      // Month incentive
      const monthByGroup = {};
      for (const b of monthBills) {
        if (!monthByGroup[b.groupId]) monthByGroup[b.groupId] = 0;
        monthByGroup[b.groupId] += (b.amount || 0);
      }
      const monthInc = Object.entries(monthByGroup).reduce((s, [gid, amt]) => {
        const g = groups.find(g => g.id == gid);
        const p = g?.incentivePct?.[tier] || 0;
        return s + amt * p / 100;
      }, 0);

      const isTH = I18n.lang === 'th';
      const fmt  = v => App.fmtB(v);
      const dateStr = DateUtil.formatDate(today);

      let txt = isTH
        ? `💰 สรุปยอดเก็บเงิน\n📅 ${dateStr}\n`
        : `💰 Billing Summary\n📅 ${dateStr}\n`;

      txt += `${'─'.repeat(28)}\n`;

      // Group breakdown for today
      if (bills.length > 0) {
        txt += isTH ? `📋 วันนี้แยกตามกลุ่ม:\n` : `📋 Today by Group:\n`;
        for (const b of bills) {
          if (!b.amount) continue;
          const g   = groups.find(g => g.id === b.groupId);
          const gName = (g?.name || '').split('—')[0].trim();
          const pct   = g?.incentivePct?.[tier] || 0;
          const inc   = b.amount * pct / 100;
          txt += `  • ${gName}: ${fmt(b.amount)} (Inc ${fmt(inc)})\n`;
        }
      }

      txt += `${'─'.repeat(28)}\n`;
      txt += isTH
        ? `📊 วันนี้รวม:  ${fmt(totalDay)}\n   Incentive: ${fmt(dayInc)}\n\n`
        : `📊 Today Total: ${fmt(totalDay)}\n   Incentive:  ${fmt(dayInc)}\n\n`;

      txt += isTH
        ? `📈 สะสมเดือน: ${fmt(totalMonth)}\n   Incentive: ${fmt(monthInc)}\n`
        : `📈 Month Total: ${fmt(totalMonth)}\n   Incentive:  ${fmt(monthInc)}\n`;

      txt += `${'─'.repeat(28)}\n`;
      txt += isTH
        ? `🏆 SO Tier: T${tierNum} (${soPct.toFixed(1)}%)\n`
        : `🏆 SO Tier: T${tierNum} (${soPct.toFixed(1)}%)\n`;

      await ExportUtil.shareText(txt);
    } catch (e) {
      App.showToast(e.message, 'error');
    }
  },

  init() {
    // Inject LINE share button into topbar
    App.setTopbarExtra(`
      <button class="icon-btn" onclick="BillingPage._shareBillingLine()"
        title="${I18n.lang==='th'?'ส่งรายงานทาง LINE':'Share via LINE'}"
        style="color:#06C755;">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
        </svg>
      </button>`);

    // Render billing chart
    setTimeout(() => {
      const groups = this._groups;
      if (!groups.length) return;
      DB.getBillingByMonth(App.empId, DateUtil.currentMonth()).then(bills => {
        const byGroup = {};
        for (const b of bills) {
          byGroup[b.groupId] = (byGroup[b.groupId] || 0) + (b.amount || 0);
        }
        const labels = groups.map(g => (g.name || '').split('—')[0].trim().slice(0, 16));
        const data   = groups.map(g => byGroup[g.id] || 0);
        ChartUtil.renderGroupBar('billing-chart', labels, data);
      });
    }, 100);
  }
};
