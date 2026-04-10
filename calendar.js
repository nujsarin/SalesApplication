/* ============================================================
   calendar.js — Work Calendar Page (tap to toggle day type)
   ============================================================ */
'use strict';

window.CalendarPage = {
  _viewMonth: null,
  _calData: {},
  _target: null,

  async render() {
    this._viewMonth = this._viewMonth || DateUtil.currentMonth();
    const { year, month } = DateUtil.parseMonth(this._viewMonth);
    const emp = App.emp;

    this._target = await DB.getTarget(emp.id, this._viewMonth);
    this._calData = this._target?.calendarData || {};

    const targetAmt = this._target?.targetAmt || 0;
    const workDays  = DateUtil.calcWorkDays(year, month, this._calData);
    const avgPerDay = workDays > 0 ? targetAmt / workDays : 0;

    const days    = DateUtil.getMonthDays(year, month);
    const offset  = DateUtil.getStartOffset(year, month);
    const today   = DateUtil.today();
    const monthLabel = DateUtil.formatMonth(this._viewMonth);

    // Day headers Mon-Sun
    const headers = ['day_mon','day_tue','day_wed','day_thu','day_fri','day_sat','day_sun'];

    return `
    <!-- Month Navigation -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <button class="icon-btn" onclick="CalendarPage._prevMonth()" style="background:var(--bg2);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div style="text-align:center;">
        <div style="font-size:18px;font-weight:700;">${monthLabel}</div>
        <div style="font-size:12px;color:var(--lt);">${I18n.lang==='th'?'ปฏิทินวันทำงาน':'Work Calendar'}</div>
      </div>
      <button class="icon-btn" onclick="CalendarPage._nextMonth()" style="background:var(--bg2);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>

    <!-- Summary -->
    <div class="grid-2" style="margin-bottom:16px;">
      <div class="card card-sm" style="border-left:3px solid var(--black);text-align:center;">
        <div class="kpi-label">${t('cal_work_days')}</div>
        <div class="kpi-value">${workDays} ${t('common_days')}</div>
      </div>
      <div class="card card-sm" style="border-left:3px solid var(--y);text-align:center;">
        <div class="kpi-label">${t('cal_avg_need')}</div>
        <div class="kpi-value" style="font-size:16px;">${App.fmtB(avgPerDay)}</div>
      </div>
    </div>

    <!-- Legend -->
    <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:5px;">
        <div style="width:12px;height:12px;border-radius:3px;background:var(--bg2);border:1px solid var(--border);"></div>
        <span style="font-size:11px;color:var(--mid);">${t('cal_workday')}</span>
      </div>
      <div style="display:flex;align-items:center;gap:5px;">
        <div style="width:12px;height:12px;border-radius:3px;background:#FEE2E2;"></div>
        <span style="font-size:11px;color:var(--mid);">${t('cal_holiday')}</span>
      </div>
      <div style="display:flex;align-items:center;gap:5px;">
        <div style="width:12px;height:12px;border-radius:3px;background:#FEF3C7;"></div>
        <span style="font-size:11px;color:var(--mid);">${t('cal_leave')}</span>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="card" style="padding:12px;">
      <div class="cal-grid">
        ${headers.map(h => `<div class="cal-day-header">${t(h)}</div>`).join('')}
        ${[...Array(offset)].map(() => `<div class="cal-day empty"></div>`).join('')}
        ${days.map(d => {
          const state = this._calData[d.date] || (d.isWeekend ? 'holiday' : 'work');
          const isToday = d.date === today;
          const cls = [
            'cal-day',
            state === 'holiday' ? 'holiday' : '',
            state === 'leave' ? 'leave' : '',
            state === 'work' && !d.isWeekend ? 'workday' : '',
            d.isWeekend && state !== 'work' ? 'weekend' : '',
            isToday ? 'today' : '',
          ].filter(Boolean).join(' ');
          const stamp = state === 'holiday'
            ? `<div style="font-size:7px;line-height:1;font-weight:700;color:var(--danger);margin-top:1px;">${I18n.lang==='th'?'หยุด':'Off'}</div>`
            : state === 'leave'
            ? `<div style="font-size:7px;line-height:1;font-weight:700;color:var(--warning);margin-top:1px;">${I18n.lang==='th'?'ลา':'Leave'}</div>`
            : '';
          return `<div class="${cls}" onclick="CalendarPage._tapDay('${d.date}')" title="${d.date}" style="flex-direction:column;gap:0;">
            <span style="line-height:1;">${d.day}</span>${stamp}
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Tap hint -->
    <div style="margin-top:12px;padding:12px;background:var(--bg2);border-radius:var(--radius-sm);">
      <div style="font-size:12px;color:var(--lt);line-height:1.8;">
        ${t('cal_tap1')}<br>
        ${t('cal_tap2')}<br>
        ${t('cal_tap3')}
      </div>
    </div>

    <!-- Target Input -->
    <div class="card" style="margin-top:16px;">
      <div class="card-title">${I18n.lang==='th'?'ตั้งเป้าหมายเดือน':'Monthly Target'}</div>
      <div class="amount-input-wrap">
        <span class="amount-prefix">฿</span>
        <input class="amount-input" id="cal-target" type="number" value="${targetAmt || ''}"
          placeholder="500000" style="text-align:left;"
          onchange="CalendarPage._saveTarget(parseFloat(this.value))">
      </div>
      <div style="font-size:12px;color:var(--lt);margin-top:8px;">
        ${I18n.lang==='th'?'กด Enter หรือเปลี่ยน field เพื่อบันทึก':'Press Enter or change field to save'}
      </div>
    </div>

    <div style="height:20px;"></div>`;
  },

  async _tapDay(date) {
    // Cycle: work → holiday → leave → work
    const dayObj = DateUtil.getMonthDays(
      ...Object.values(DateUtil.parseMonth(this._viewMonth))
    ).find(d => d.date === date);

    const current = this._calData[date] || (dayObj?.isWeekend ? 'holiday' : 'work');
    let next;
    if (current === 'work')    next = 'holiday';
    else if (current === 'holiday') next = 'leave';
    else                       next = 'work';

    this._calData[date] = next;
    await this._persistCalendar();
    this._rerenderInPlace();
  },

  async _persistCalendar() {
    const empId = App.empId;
    const month = this._viewMonth;
    const existing = await DB.getTarget(empId, month);
    const targetAmt = existing?.targetAmt || 0;
    const { year, month: m } = DateUtil.parseMonth(month);
    const workDays = DateUtil.calcWorkDays(year, m, this._calData);
    await DB.setTarget(empId, month, { targetAmt, workDays, calendarData: this._calData });
  },

  async _saveTarget(val) {
    if (isNaN(val) || val < 0) return;
    const empId = App.empId;
    const month = this._viewMonth;
    const existing = await DB.getTarget(empId, month);
    const { year, m } = DateUtil.parseMonth(month);
    await DB.setTarget(empId, month, {
      targetAmt: val,
      workDays: existing?.workDays || 22,
      calendarData: this._calData
    });
    App.showToast(t('common_saved'), 'success');
    this._rerenderInPlace();
  },

  _prevMonth() {
    this._viewMonth = DateUtil.prevMonth(this._viewMonth);
    Router.navigate('calendar', false);
  },
  _nextMonth() {
    this._viewMonth = DateUtil.nextMonth(this._viewMonth);
    Router.navigate('calendar', false);
  },

  async _rerenderInPlace() {
    const content = document.getElementById('page-content');
    if (content) {
      const html = await CalendarPage.render();
      content.innerHTML = `<div class="page-inner">${html}</div>`;
    }
  },

  init() {}
};
