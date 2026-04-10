/* ============================================================
   i18n.js — TH / EN bilingual strings
   ============================================================ */
'use strict';

window.I18n = {
  _lang: localStorage.getItem('lang') || 'th',

  get lang() { return this._lang; },

  set lang(v) {
    this._lang = v;
    localStorage.setItem('lang', v);
    document.documentElement.lang = v;
    this.apply();
  },

  toggle() {
    this.lang = this._lang === 'th' ? 'en' : 'th';
    return this._lang;
  },

  t(key) {
    const d = I18n.strings[key];
    if (!d) return key;
    return d[this._lang] || d['en'] || key;
  },

  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = this.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
    const lb = document.getElementById('lang-label');
    if (lb) lb.textContent = this._lang.toUpperCase();
  },

  strings: {
    // Nav
    nav_home:    { th: 'หน้าหลัก',   en: 'Home' },
    nav_so:      { th: 'ยอดขาย',     en: 'Sales' },
    nav_billing: { th: 'บิล',         en: 'Billing' },
    nav_cust:    { th: 'ลูกค้า',     en: 'Customers' },
    nav_report:  { th: 'รายงาน',     en: 'Reports' },

    // Auth
    auth_welcome:       { th: 'ยินดีต้อนรับ',          en: 'Welcome Back' },
    auth_pin_label:     { th: 'กรอก PIN 6 หลัก',        en: 'Enter 6-digit PIN' },
    auth_forgot:        { th: 'ลืม PIN?',               en: 'Forgot PIN?' },
    auth_register:      { th: 'สมัครใช้งาน',            en: 'Register' },
    auth_login:         { th: 'เข้าสู่ระบบ',            en: 'Login' },
    auth_reg_title:     { th: 'ลงทะเบียนพนักงาน',      en: 'Employee Registration' },
    auth_emp_code:      { th: 'รหัสพนักงาน',            en: 'Employee Code' },
    auth_name:          { th: 'ชื่อ-นามสกุล',           en: 'Full Name' },
    auth_dept:          { th: 'แผนก / ทีม',             en: 'Department / Team' },
    auth_target:        { th: 'เป้าหมายรายเดือน (฿)',   en: 'Monthly Target (฿)' },
    auth_set_pin:       { th: 'ตั้ง PIN (6 หลัก)',      en: 'Set PIN (6 digits)' },
    auth_confirm_pin:   { th: 'ยืนยัน PIN',             en: 'Confirm PIN' },
    auth_pin_mismatch:  { th: 'PIN ไม่ตรงกัน',          en: 'PINs do not match' },
    auth_pin_short:     { th: 'PIN ต้องมี 6 หลัก',      en: 'PIN must be 6 digits' },
    auth_wrong_pin:     { th: 'PIN ไม่ถูกต้อง',          en: 'Incorrect PIN' },
    auth_save:          { th: 'บันทึก',                  en: 'Save' },
    auth_creating:      { th: 'กำลังสร้างบัญชี...',     en: 'Creating account...' },
    auth_reset_title:   { th: 'รีเซ็ต PIN',              en: 'Reset PIN' },
    auth_reset_desc:    { th: 'กรอกรหัสพนักงานเพื่อยืนยันตัวตน', en: 'Enter employee code to verify identity' },
    auth_new_pin:       { th: 'PIN ใหม่ (6 หลัก)',       en: 'New PIN (6 digits)' },
    auth_confirm_new:   { th: 'ยืนยัน PIN ใหม่',         en: 'Confirm New PIN' },
    auth_reset_btn:     { th: 'รีเซ็ต PIN',              en: 'Reset PIN' },
    auth_reset_success: { th: 'รีเซ็ต PIN สำเร็จ',       en: 'PIN reset successful' },

    // Home
    home_greeting_morning: { th: 'อรุณสวัสดิ์',        en: 'Good Morning' },
    home_greeting_afternoon:{ th: 'สวัสดีตอนบ่าย',     en: 'Good Afternoon' },
    home_greeting_evening: { th: 'สวัสดีตอนเย็น',      en: 'Good Evening' },
    home_today_sales:   { th: 'ยอดขายวันนี้',           en: "Today's Sales" },
    home_month_total:   { th: 'ยอดเดือนนี้',            en: 'Month Total' },
    home_target_reach:  { th: 'ถึงเป้า',                en: 'To Target' },
    home_work_days_left:{ th: 'วันทำงานเหลือ',          en: 'Working Days Left' },
    home_quick_actions: { th: 'เมนูหลัก',               en: 'Main Menu' },
    home_so:            { th: 'Sales Order',             en: 'Sales Order' },
    home_billing:       { th: 'Sales Billing',           en: 'Sales Billing' },
    home_customer:      { th: 'ลูกค้า',                  en: 'Customer' },
    home_calendar:      { th: 'ปฏิทิน',                 en: 'Calendar' },
    home_incentive:     { th: 'Incentive',               en: 'Incentive' },
    home_report:        { th: 'รายงาน',                  en: 'Report' },
    home_setting:       { th: 'ตั้งค่า',                 en: 'Settings' },
    home_so_sub:        { th: 'บันทึกยอดรายวัน',         en: 'Daily entry' },
    home_billing_sub:   { th: 'ยอดจัดส่ง/ชำระ',         en: 'Delivery / billing' },
    home_customer_sub:  { th: 'Pipeline ลูกค้า',         en: 'Customer pipeline' },
    home_calendar_sub:  { th: 'วันทำงาน',               en: 'Work days' },
    home_incentive_sub: { th: 'คำนวณ incentive',         en: 'Calculate incentive' },
    home_report_sub:    { th: 'สรุปยอด/export',          en: 'Summary & export' },
    home_setting_sub:   { th: 'ตั้งค่าระบบ',             en: 'System settings' },

    // Sales Order
    so_title:           { th: 'Sales Order',             en: 'Sales Order' },
    so_today:           { th: 'วันนี้',                  en: 'Today' },
    so_month:           { th: 'เดือนนี้',                en: 'This Month' },
    so_target:          { th: 'เป้าหมาย',               en: 'Target' },
    so_achieved:        { th: 'ยอดสะสม',                en: 'Achieved' },
    so_remaining:       { th: 'ต้องขายเพิ่ม',           en: 'Remaining' },
    so_run_rate:        { th: 'Run Rate/วัน',              en: 'Run Rate/Day' },
    so_add:             { th: '+ บันทึก SO',             en: '+ New SO' },
    so_id:              { th: 'SO ID',                   en: 'SO ID' },
    so_date:            { th: 'วันที่',                  en: 'Date' },
    so_product:         { th: 'สินค้า',                  en: 'Product' },
    so_qty:             { th: 'จำนวน',                   en: 'Qty' },
    so_price:           { th: 'ราคา',                    en: 'Price' },
    so_total:           { th: 'รวม',                     en: 'Total' },
    so_add_product:     { th: '+ เพิ่มรายการ',           en: '+ Add Item' },
    so_save:            { th: 'บันทึก SO',               en: 'Save SO' },
    so_delete_confirm:  { th: 'ลบ SO นี้?',              en: 'Delete this SO?' },
    so_customers_today: { th: 'ลูกค้าวันนี้',            en: 'Customers Today' },
    so_add_customer:    { th: '+ รับลูกค้า 1 คน',        en: '+ Add 1 Customer' },
    so_conversion:      { th: 'Conversion Rate',         en: 'Conversion Rate' },
    so_basket:          { th: 'Basket Size',             en: 'Basket Size' },
    so_upt:             { th: 'UPT',                     en: 'UPT' },
    so_no_bill:         { th: 'No Bill Days',            en: 'No Bill Days' },
    so_pace_chart:      { th: 'เปรียบยอดขายกับแผน',     en: 'Sales vs Plan' },

    // Billing
    billing_title:      { th: 'Sales Billing',           en: 'Sales Billing' },
    billing_date:       { th: 'วันที่บิล',              en: 'Billing Date' },
    billing_group:      { th: 'Product Group',           en: 'Product Group' },
    billing_amount:     { th: 'ยอดชำระ',                en: 'Amount' },
    billing_cumulative: { th: 'ยอดสะสม',                en: 'Cumulative' },
    billing_forecast:   { th: 'ประมาณการ',              en: 'Forecast' },
    billing_incentive:  { th: 'Incentive สะสม',         en: 'Cumulative Incentive' },
    billing_add:        { th: '+ บันทึกบิล',            en: '+ Add Billing' },
    billing_save:       { th: 'บันทึก',                  en: 'Save' },

    // Customer
    cust_title:         { th: 'ลูกค้า Pipeline',        en: 'Customer Pipeline' },
    cust_add:           { th: '+ เพิ่มลูกค้า',          en: '+ Add Customer' },
    cust_name:          { th: 'ชื่อลูกค้า',             en: 'Customer Name' },
    cust_tel:           { th: 'เบอร์โทร',               en: 'Phone' },
    cust_line:          { th: 'Line ID',                 en: 'Line ID' },
    cust_note:          { th: 'หมายเหตุ',               en: 'Note' },
    cust_status:        { th: 'สถานะ',                  en: 'Status' },
    cust_followup_date: { th: 'วันนัดติดตาม',           en: 'Follow-up Date' },
    cust_deciding:      { th: 'กำลังตัดสินใจ',          en: 'Deciding' },
    cust_followup:      { th: 'นัดติดตาม',              en: 'Follow-up Scheduled' },
    cust_closed:        { th: 'ปิดการขายแล้ว',          en: 'Closed' },
    cust_save:          { th: 'บันทึก',                  en: 'Save' },
    cust_search:        { th: 'ค้นหาลูกค้า...',         en: 'Search customers...' },
    cust_delete_confirm:{ th: 'ลบลูกค้านี้?',           en: 'Delete this customer?' },

    // Calendar
    cal_title:          { th: 'ปฏิทินวันทำงาน',        en: 'Work Calendar' },
    cal_work_days:      { th: 'วันทำงานเดือนนี้',       en: 'Working Days' },
    cal_avg_need:       { th: 'ยอดเฉลี่ยที่ต้องทำ/วัน', en: 'Avg Needed / Day' },
    cal_holiday:        { th: 'วันหยุด',                en: 'Holiday' },
    cal_leave:          { th: 'วันลา',                  en: 'Leave' },
    cal_workday:        { th: 'วันทำงาน',               en: 'Work Day' },
    cal_tap1:           { th: 'แตะ 1 ครั้ง = วันหยุด', en: 'Tap 1 = Holiday' },
    cal_tap2:           { th: 'แตะ 2 ครั้ง = วันลา',   en: 'Tap 2 = Leave' },
    cal_tap3:           { th: 'แตะ 3 ครั้ง = รีเซ็ต',  en: 'Tap 3 = Reset' },

    // Incentive
    inc_title:          { th: 'คำนวณ Incentive',        en: 'Incentive Calculator' },
    inc_so_achieve:     { th: 'SO ถึง Tier',            en: 'SO Achieved Tier' },
    inc_billing_total:  { th: 'ยอดบิลรวม',              en: 'Total Billing' },
    inc_total:          { th: 'Incentive รวม',           en: 'Total Incentive' },
    inc_group:          { th: 'Product Group',           en: 'Product Group' },
    inc_pct:            { th: '% Incentive',            en: '% Incentive' },
    inc_amount:         { th: 'ยอด Incentive',          en: 'Incentive Amount' },

    // Report
    report_title:       { th: 'รายงาน',                 en: 'Reports' },
    report_so_daily:    { th: 'SO รายวัน',              en: 'SO Daily' },
    report_so_monthly:  { th: 'SO รายเดือน',            en: 'SO Monthly' },
    report_bill_daily:  { th: 'บิลรายวัน',              en: 'Billing Daily' },
    report_bill_monthly:{ th: 'บิลรายเดือน',            en: 'Billing Monthly' },
    report_pipeline:    { th: 'Customer Pipeline',      en: 'Customer Pipeline' },
    report_export_pdf:  { th: 'ส่งออก PDF',             en: 'Export PDF' },
    report_export_xlsx: { th: 'ส่งออก Excel',           en: 'Export Excel' },
    report_share_line:  { th: 'แชร์ LINE',              en: 'Share to LINE' },
    report_period:      { th: 'ช่วงเวลา',               en: 'Period' },

    // Settings
    setting_title:      { th: 'ตั้งค่า',                en: 'Settings' },
    setting_profile:    { th: 'ข้อมูลพนักงาน',          en: 'Employee Profile' },
    setting_target:     { th: 'ตั้งเป้าหมาย',           en: 'Set Target' },
    setting_groups:     { th: 'Product Group',           en: 'Product Group' },
    setting_products:   { th: 'Product Division',        en: 'Product Division' },
    setting_incentive_table: { th: 'ตาราง Incentive', en: 'Incentive Table' },
    setting_language:   { th: 'ภาษา',                   en: 'Language' },
    setting_change_pin: { th: 'เปลี่ยน PIN',            en: 'Change PIN' },
    setting_walkin_mode:{ th: 'โหมดบันทึกลูกค้า',       en: 'Customer Entry Mode' },
    setting_danger:     { th: 'Danger Zone',             en: 'Danger Zone' },
    setting_del_month:  { th: 'ลบข้อมูลเดือนนี้',       en: 'Delete This Month Data' },
    setting_del_all_so: { th: 'ลบยอดขายทั้งหมด',        en: 'Delete All Sales' },
    setting_reset:      { th: 'รีเซ็ตระบบทั้งหมด',      en: 'Full System Reset' },

    // Common
    common_save:        { th: 'บันทึก',                  en: 'Save' },
    common_cancel:      { th: 'ยกเลิก',                 en: 'Cancel' },
    common_delete:      { th: 'ลบ',                      en: 'Delete' },
    common_edit:        { th: 'แก้ไข',                   en: 'Edit' },
    common_close:       { th: 'ปิด',                     en: 'Close' },
    common_confirm:     { th: 'ยืนยัน',                  en: 'Confirm' },
    common_loading:     { th: 'กำลังโหลด...',            en: 'Loading...' },
    common_saved:       { th: 'บันทึกแล้ว',              en: 'Saved!' },
    common_deleted:     { th: 'ลบแล้ว',                  en: 'Deleted!' },
    common_error:       { th: 'เกิดข้อผิดพลาด',         en: 'An error occurred' },
    common_required:    { th: 'กรุณากรอกข้อมูล',        en: 'Please fill in all required fields' },
    common_no_data:     { th: 'ไม่มีข้อมูล',             en: 'No data' },
    common_baht:        { th: '฿',                       en: '฿' },
    common_days:        { th: 'วัน',                     en: 'days' },
    common_pieces:      { th: 'ชิ้น',                    en: 'pcs' },
    common_add:         { th: 'เพิ่ม',                   en: 'Add' },
    common_search:      { th: 'ค้นหา...',                en: 'Search...' },
    common_all:         { th: 'ทั้งหมด',                 en: 'All' },
    common_today:       { th: 'วันนี้',                  en: 'Today' },
    common_month:       { th: 'เดือนนี้',                en: 'This Month' },
    common_name:        { th: 'ชื่อ',                    en: 'Name' },
    common_price:       { th: 'ราคา',                    en: 'Price' },
    common_group:       { th: 'กลุ่ม',                   en: 'Group' },
    common_yes:         { th: 'ใช่',                     en: 'Yes' },
    common_no:          { th: 'ไม่',                     en: 'No' },

    // Months TH
    month_01: { th: 'มกราคม',    en: 'January' },
    month_02: { th: 'กุมภาพันธ์', en: 'February' },
    month_03: { th: 'มีนาคม',    en: 'March' },
    month_04: { th: 'เมษายน',    en: 'April' },
    month_05: { th: 'พฤษภาคม',  en: 'May' },
    month_06: { th: 'มิถุนายน',  en: 'June' },
    month_07: { th: 'กรกฎาคม',  en: 'July' },
    month_08: { th: 'สิงหาคม',   en: 'August' },
    month_09: { th: 'กันยายน',   en: 'September' },
    month_10: { th: 'ตุลาคม',    en: 'October' },
    month_11: { th: 'พฤศจิกายน', en: 'November' },
    month_12: { th: 'ธันวาคม',   en: 'December' },

    // Days
    day_mon: { th: 'จ', en: 'Mo' },
    day_tue: { th: 'อ', en: 'Tu' },
    day_wed: { th: 'พ', en: 'We' },
    day_thu: { th: 'พฤ',en: 'Th' },
    day_fri: { th: 'ศ', en: 'Fr' },
    day_sat: { th: 'ส', en: 'Sa' },
    day_sun: { th: 'อา',en: 'Su' },
  }
};

// Shorthand
window.t = (key) => I18n.t(key);
