/* ============================================================
   home.js — Home / Dashboard Page
   ============================================================ */
'use strict';

window.HomePage = {

  async render() {
    await App.refreshEmployee();
    const emp = App.emp;
    if (!emp) return `<div class="empty-state"><div class="empty-text">ไม่พบข้อมูลพนักงาน</div></div>`;

    const month = DateUtil.currentMonth();
    const today = DateUtil.today();

    const [target, todayTotal, monthTotal] = await Promise.all([
      DB.getTarget(emp.id, month),
      DB.getDaySOTotal(emp.id, today),
      DB.getMonthSOTotal(emp.id, month),
    ]);

    const targetAmt    = target?.targetAmt || 0;
    const calData      = target?.calendarData || {};
    const workDays     = target?.workDays || DateUtil.calcWorkDays(...DateUtil.parseMonth(month).year, ...[], calData);
    const daysLeft     = DateUtil.workDaysLeft(calData, month);
    const pct          = targetAmt > 0 ? Math.min((monthTotal / targetAmt) * 100, 100) : 0;
    const remaining    = Math.max(targetAmt - monthTotal, 0);
    const runRate      = daysLeft > 0 ? remaining / daysLeft : 0;
    const tier         = this._getTier(pct);

    const greeting = this._greeting();
    const dateStr  = DateUtil.formatDate(today);

    return `
    <!-- Hero Banner -->
    <div class="hero-banner">
      <div class="hero-greeting">${greeting}, </div>
      <div class="hero-name">${emp.name}</div>
      <div class="hero-date">${dateStr} · ${emp.dept || 'Sales'}</div>

      <div style="margin-top:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:12px;opacity:0.6;">${t('so_achieved')}</span>
          <span style="font-size:12px;color:var(--y);font-weight:600;">${pct.toFixed(1)}%</span>
        </div>
        <div class="progress-track" style="height:6px;background:rgba(255,255,255,0.15);">
          <div class="progress-fill ${tier.cls}" style="width:${pct}%;background:${tier.color};"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;">
          <span style="font-size:11px;opacity:0.5;">฿0</span>
          <span style="font-size:11px;opacity:0.5;">${App.fmtB(targetAmt)}</span>
        </div>
      </div>

      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-label">${t('home_today_sales')}</div>
          <div class="hero-stat-value">${App.fmtB(todayTotal)}</div>
        </div>
        <div class="hero-stat" style="border-left:1px solid rgba(255,255,255,0.1);padding-left:16px;">
          <div class="hero-stat-label">${t('home_month_total')}</div>
          <div class="hero-stat-value">${App.fmtB(monthTotal)}</div>
        </div>
        <div class="hero-stat" style="border-left:1px solid rgba(255,255,255,0.1);padding-left:16px;">
          <div class="hero-stat-label">${t('home_work_days_left')}</div>
          <div class="hero-stat-value" style="color:#fff;">${daysLeft} ${t('common_days')}</div>
        </div>
      </div>
    </div>

    <!-- Tier Badges -->
    <div class="tier-row" style="margin-bottom:16px;">
      ${this._tierBadge(1, 80, pct, targetAmt)}
      ${this._tierBadge(2, 90, pct, targetAmt)}
      ${this._tierBadge(3, 100, pct, targetAmt)}
      ${this._tierBadge(4, 115, pct, targetAmt)}
    </div>

    <!-- Run Rate -->
    ${daysLeft > 0 ? `
    <div class="card card-sm" style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:12px;color:var(--lt);">${t('so_run_rate')}</div>
          <div style="font-size:18px;font-weight:700;color:var(--black);margin-top:2px;">${App.fmtB(runRate)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;color:var(--lt);">${t('so_remaining')}</div>
          <div style="font-size:16px;font-weight:600;color:var(--danger);margin-top:2px;">${App.fmtB(remaining)}</div>
        </div>
      </div>
    </div>` : `
    <div class="card card-sm" style="margin-bottom:16px;background:var(--y-light);">
      <div style="text-align:center;font-weight:600;color:var(--y-dark);">🎉 ${I18n.lang==='th'?'หมดเดือนแล้ว':'End of Month'}</div>
    </div>`}

    <!-- Feature Grid -->
    <div class="section-header">
      <span class="section-title" data-i18n="home_quick_actions">${t('home_quick_actions')}</span>
    </div>
    <div class="feature-grid">
      <div class="feat-card y" onclick="App.navigate('salesOrder')">
        <div class="feat-icon">📋</div>
        <div class="feat-name" data-i18n="home_so">${t('home_so')}</div>
        <div class="feat-sub" data-i18n="home_so_sub">${t('home_so_sub')}</div>
      </div>
      <div class="feat-card y" onclick="App.navigate('billing')">
        <div class="feat-icon">🧾</div>
        <div class="feat-name" data-i18n="home_billing">${t('home_billing')}</div>
        <div class="feat-sub" data-i18n="home_billing_sub">${t('home_billing_sub')}</div>
      </div>
      <div class="feat-card bk" onclick="App.navigate('customer')">
        <div class="feat-icon">👥</div>
        <div class="feat-name" data-i18n="home_customer">${t('home_customer')}</div>
        <div class="feat-sub" data-i18n="home_customer_sub">${t('home_customer_sub')}</div>
      </div>
      <div class="feat-card bk" onclick="App.navigate('calendar')">
        <div class="feat-icon">📅</div>
        <div class="feat-name" data-i18n="home_calendar">${t('home_calendar')}</div>
        <div class="feat-sub" data-i18n="home_calendar_sub">${t('home_calendar_sub')}</div>
      </div>
      <div class="feat-card lt" onclick="App.navigate('incentive')">
        <div class="feat-icon">💰</div>
        <div class="feat-name" data-i18n="home_incentive">${t('home_incentive')}</div>
        <div class="feat-sub" data-i18n="home_incentive_sub">${t('home_incentive_sub')}</div>
      </div>
      <div class="feat-card lt" onclick="App.navigate('report')">
        <div class="feat-icon">📊</div>
        <div class="feat-name" data-i18n="home_report">${t('home_report')}</div>
        <div class="feat-sub" data-i18n="home_report_sub">${t('home_report_sub')}</div>
      </div>
      <div class="feat-card lt" onclick="App.navigate('setting')">
        <div class="feat-icon">⚙️</div>
        <div class="feat-name" data-i18n="home_setting">${t('home_setting')}</div>
        <div class="feat-sub" data-i18n="home_setting_sub">${t('home_setting_sub')}</div>
      </div>
    </div>
    `;
  },

  _greeting() {
    const h = new Date().getHours();
    if (h < 12) return t('home_greeting_morning');
    if (h < 17) return t('home_greeting_afternoon');
    return t('home_greeting_evening');
  },

  _getTier(pct) {
    if (pct >= 115) return { cls: 't4', color: '#DC2626' };
    if (pct >= 100) return { cls: 't3', color: '#E07020' };
    if (pct >= 90)  return { cls: 't2', color: '#E8A020' };
    if (pct >= 80)  return { cls: 't1', color: '#F5C842' };
    return { cls: '', color: '#F5C842' };
  },

  _tierBadge(num, threshold, currentPct, target) {
    const isActive = currentPct >= threshold;
    const tierAmt  = target * threshold / 100;
    return `
    <div class="tier-badge tier-${num} ${isActive ? 'active' : ''}" style="opacity:${isActive ? 1 : 0.5};">
      <div>Tier ${num}</div>
      <div style="font-size:9px;margin-top:1px;">${threshold}%</div>
      <div style="font-size:9px;">${App.fmtB(tierAmt)}</div>
    </div>`;
  },

  init() {} // No async init needed for home
};
