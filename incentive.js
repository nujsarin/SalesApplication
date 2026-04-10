/* ============================================================
   incentive.js — Incentive Calculator Page
   ============================================================ */
'use strict';

window.IncentivePage = {

  async render() {
    const emp   = App.emp;
    const month = DateUtil.currentMonth();

    const [groups, target, bills, orders] = await Promise.all([
      DB.getGroups(),
      DB.getTarget(emp.id, month),
      DB.getBillingByMonth(emp.id, month),
      DB.getSalesOrdersByMonth(emp.id, month),
    ]);

    const targetAmt = target?.targetAmt || 0;
    const soTotal   = orders.reduce((s, o) => s + (o.totalAmt || 0), 0);
    const soPct     = targetAmt > 0 ? (soTotal / targetAmt) * 100 : 0;

    // Determine tier
    const tier = soPct >= 115 ? 4 : soPct >= 100 ? 3 : soPct >= 90 ? 2 : soPct >= 80 ? 1 : 0;
    const tierKey = tier > 0 ? `t${tier}` : 't1';

    // Billing by group
    const billByGroup = {};
    for (const b of bills) {
      billByGroup[b.groupId] = (billByGroup[b.groupId] || 0) + (b.amount || 0);
    }

    // Calculate incentive per group
    let totalIncentive = 0;
    const groupRows = groups.map(g => {
      const amt  = billByGroup[g.id] || 0;
      const pct  = g.incentivePct?.[tierKey] || 0;
      const inc  = amt * pct / 100;
      totalIncentive += inc;
      return { g, amt, pct, inc };
    });

    const tierLabels = { 0:'—', 1:'Tier 1 (80%)', 2:'Tier 2 (90%)', 3:'Tier 3 (100%)', 4:'Tier 4 (115%)' };

    return `
    <!-- Month Header -->
    <div class="card card-dark" style="margin-bottom:16px;text-align:center;padding:24px 20px;">
      <div style="font-size:12px;opacity:0.5;margin-bottom:4px;">${DateUtil.formatMonth(month)}</div>
      <div style="font-size:12px;color:var(--y);margin-bottom:8px;">${I18n.lang==='th'?'Incentive รวมเดือนนี้':'Total Incentive This Month'}</div>
      <div style="font-size:36px;font-weight:700;color:var(--y);">${App.fmtB(totalIncentive)}</div>
    </div>

    <!-- SO Achievement -->
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title">${I18n.lang==='th'?'ยอด SO & Tier':'SO Achievement & Tier'}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div>
          <div style="font-size:12px;color:var(--lt);">${t('so_achieved')}</div>
          <div style="font-size:20px;font-weight:700;">${App.fmtB(soTotal)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;color:var(--lt);">${t('inc_so_achieve')}</div>
          <div class="chip ${tier > 0 ? 'chip-y' : ''}" style="font-size:14px;padding:4px 14px;margin-top:4px;">
            ${tierLabels[tier]}
          </div>
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${Math.min(soPct, 115) / 115 * 100}%;"></div>
      </div>
      <div class="tier-row" style="margin-top:10px;">
        ${[1,2,3,4].map(n => {
          const thresholds = { 1:80, 2:90, 3:100, 4:115 };
          return `<div class="tier-badge tier-${n} ${tier >= n ? 'active' : ''}">${n === 4 ? '★' : ''} T${n} ${thresholds[n]}%</div>`;
        }).join('')}
      </div>
    </div>

    <!-- Incentive Table per Group -->
    <div class="section-header">
      <span class="section-title">${I18n.lang==='th'?'Incentive แยกกลุ่มสินค้า':'Incentive by Product Group'}</span>
    </div>

    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:16px;">
      <table class="data-table">
        <thead>
          <tr>
            <th>${t('inc_group')}</th>
            <th style="text-align:right;">${I18n.lang==='th'?'ยอดบิล':'Billing'}</th>
            <th style="text-align:right;">${t('inc_pct')}</th>
            <th style="text-align:right;">${t('inc_amount')}</th>
          </tr>
        </thead>
        <tbody>
          ${groupRows.map(({ g, amt, pct, inc }) => `
          <tr>
            <td style="font-size:12px;">${(g.name || '').split('—')[0].trim()}</td>
            <td style="text-align:right;font-size:13px;">${App.fmtB(amt)}</td>
            <td style="text-align:right;font-size:13px;">${pct}%</td>
            <td style="text-align:right;font-weight:600;color:var(--y-dark);">${App.fmtB(inc)}</td>
          </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr style="background:var(--y-light);">
            <td colspan="3" style="font-weight:700;">${t('inc_total')}</td>
            <td style="text-align:right;font-weight:700;font-size:15px;color:var(--y-dark);">${App.fmtB(totalIncentive)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Tier Comparison Table -->
    <div class="section-header">
      <span class="section-title">${I18n.lang==='th'?'Incentive หากถึงแต่ละ Tier':'Incentive by Tier (Projection)'}</span>
    </div>
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:16px;">
      <table class="data-table sm">
        <thead>
          <tr>
            <th>Tier</th>
            <th style="text-align:right;">${I18n.lang==='th'?'เงื่อนไข':'Condition'}</th>
            <th style="text-align:right;">${I18n.lang==='th'?'Incentive รวม':'Total Inc.'}</th>
          </tr>
        </thead>
        <tbody>
          ${[1,2,3,4].map(n => {
            const tk = `t${n}`;
            const projInc = groups.reduce((s, g) => {
              const amt = billByGroup[g.id] || 0;
              const p   = g.incentivePct?.[tk] || 0;
              return s + amt * p / 100;
            }, 0);
            const thresholds = { 1:'≥80%', 2:'≥90%', 3:'≥100%', 4:'≥115%' };
            return `<tr style="${tier === n ? 'background:var(--y-light);' : ''}">
              <td><span class="tier-badge tier-${n}" style="display:inline-block;">Tier ${n}</span></td>
              <td style="text-align:right;font-size:12px;">${thresholds[n]}</td>
              <td style="text-align:right;font-weight:700;color:var(--y-dark);">${App.fmtB(projInc)} ${tier === n ? '←' : ''}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Share -->
    <button class="btn btn-outline btn-full" onclick="IncentivePage._share()">
      📤 ${I18n.lang==='th'?'แชร์สรุป Incentive':'Share Incentive Summary'}
    </button>
    <div style="height:20px;"></div>`;
  },

  async _share() {
    const emp   = App.emp;
    const month = DateUtil.currentMonth();
    const [groups, orders, bills] = await Promise.all([
      DB.getGroups(),
      DB.getSalesOrdersByMonth(emp.id, month),
      DB.getBillingByMonth(emp.id, month),
    ]);
    const target = await DB.getTarget(emp.id, month);
    const targetAmt = target?.targetAmt || 0;
    const soTotal   = orders.reduce((s, o) => s + (o.totalAmt || 0), 0);
    const soPct     = targetAmt > 0 ? (soTotal / targetAmt * 100).toFixed(1) : '—';
    const billByGroup = {};
    for (const b of bills) billByGroup[b.groupId] = (billByGroup[b.groupId] || 0) + (b.amount || 0);
    const tier = parseFloat(soPct) >= 115 ? 't4' : parseFloat(soPct) >= 100 ? 't3' : parseFloat(soPct) >= 90 ? 't2' : 't1';
    let totalInc = groups.reduce((s, g) => {
      const amt = billByGroup[g.id] || 0;
      const pct = g.incentivePct?.[tier] || 0;
      return s + amt * pct / 100;
    }, 0);

    const lang = I18n.lang;
    let txt = lang === 'th'
      ? `💰 *Incentive Summary*\n👤 ${emp.name}\n📅 ${DateUtil.formatMonth(month, 'th')}\n━━━━━━━\n🎯 SO: ฿${App.fmt(soTotal)} (${soPct}% ถึงเป้า)\n✨ Incentive รวม: ฿${App.fmt(totalInc)}\n⏰ ${new Date().toLocaleString('th-TH')}`
      : `💰 *Incentive Summary*\n👤 ${emp.name}\n📅 ${DateUtil.formatMonth(month, 'en')}\n━━━━━━━\n🎯 SO: ฿${App.fmt(soTotal)} (${soPct}% to target)\n✨ Total Incentive: ฿${App.fmt(totalInc)}\n⏰ ${new Date().toLocaleString('en-GB')}`;

    await ExportUtil.shareText(txt);
  },

  init() {}
};
