/* ============================================================
   date.js — Date/Calendar utilities (supports Buddhist Era)
   ============================================================ */
'use strict';

window.DateUtil = {

  // ── Current Helpers ────────────────────────────────────────
  today()        { return new Date().toISOString().slice(0, 10); },
  currentMonth() { return new Date().toISOString().slice(0, 7); },
  currentYear()  { return new Date().getFullYear(); },

  // ── Format ────────────────────────────────────────────────
  formatDate(dateStr, lang = null) {
    lang = lang || I18n.lang;
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d)) return dateStr;
    if (lang === 'th') {
      const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
    }
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  },

  formatMonth(monthStr, lang = null) {
    lang = lang || I18n.lang;
    const [y, m] = monthStr.split('-').map(Number);
    const key = `month_${String(m).padStart(2,'0')}`;
    const monthName = I18n.t(key);
    return lang === 'th' ? `${monthName} ${y + 543}` : `${monthName} ${y}`;
  },

  formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
  },

  // ── Month Calendar Generation ──────────────────────────────
  getMonthDays(year, month) {
    // Returns array of {date, dayOfWeek(0=Sun..6=Sat), isWeekend}
    const days = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month - 1, d);
      const dow = dt.getDay(); // 0=Sun
      days.push({
        date: `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`,
        day: d,
        dayOfWeek: dow,
        isWeekend: dow === 0 || dow === 6
      });
    }
    return days;
  },

  // First day offset for Mon-first calendar
  getStartOffset(year, month) {
    const firstDay = new Date(year, month - 1, 1).getDay();
    // Convert Sun=0 to Mon=0
    return firstDay === 0 ? 6 : firstDay - 1;
  },

  // Count working days from calendar data
  calcWorkDays(year, month, calendarData = {}) {
    const days = this.getMonthDays(year, month);
    let work = 0;
    for (const d of days) {
      const state = calendarData[d.date] || (d.isWeekend ? 'holiday' : 'work');
      if (state === 'work') work++;
    }
    return work;
  },

  // Days remaining in month (from today)
  daysLeftInMonth(month = null) {
    const today = new Date();
    const [y, m] = (month || this.currentMonth()).split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const todayDate = today.getDate();
    if (today.getFullYear() === y && today.getMonth() + 1 === m) {
      return Math.max(lastDay - todayDate, 0);
    }
    return 0;
  },

  // Working days left from today
  workDaysLeft(calendarData = {}, month = null) {
    const today = this.today();
    const [y, m] = (month || this.currentMonth()).split('-').map(Number);
    const days = this.getMonthDays(y, m);
    let left = 0;
    for (const d of days) {
      if (d.date <= today) continue;
      const state = calendarData[d.date] || (d.isWeekend ? 'holiday' : 'work');
      if (state === 'work') left++;
    }
    return left;
  },

  // Parse YYYY-MM
  parseMonth(monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    return { year: y, month: m };
  },

  prevMonth(monthStr) {
    let [y, m] = monthStr.split('-').map(Number);
    m--; if (m < 1) { m = 12; y--; }
    return `${y}-${String(m).padStart(2,'0')}`;
  },

  nextMonth(monthStr) {
    let [y, m] = monthStr.split('-').map(Number);
    m++; if (m > 12) { m = 1; y++; }
    return `${y}-${String(m).padStart(2,'0')}`;
  },

  // Generate list of past months for report picker
  recentMonths(count = 6) {
    const months = [];
    let cur = this.currentMonth();
    for (let i = 0; i < count; i++) {
      months.push(cur);
      cur = this.prevMonth(cur);
    }
    return months;
  }
};
