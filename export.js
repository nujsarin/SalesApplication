/* ============================================================
   export.js — PDF / Excel / LINE share
   ============================================================ */
'use strict';

window.ExportUtil = {

  // ── Share text via Web Share API (LINE) ───────────────────
  async shareText(text) {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return true;
      } catch (e) {
        if (e.name !== 'AbortError') this._copyFallback(text);
      }
    } else {
      this._copyFallback(text);
    }
  },

  _copyFallback(text) {
    navigator.clipboard?.writeText(text).then(() => {
      App.showToast('คัดลอกข้อความแล้ว', 'success');
    }).catch(() => App.showToast('ไม่สามารถแชร์ได้', 'error'));
  },

  // ── Generate SO Summary Text ──────────────────────────────
  buildSOSummaryText(emp, month, orders, target) {
    const lang = I18n.lang;
    const total = orders.reduce((s, o) => s + (o.totalAmt || 0), 0);
    const pct = target > 0 ? ((total / target) * 100).toFixed(1) : '—';
    const monthLabel = DateUtil.formatMonth(month, lang);

    if (lang === 'th') {
      let txt = `📊 *Sales Order Summary*\n`;
      txt += `👤 ${emp.name} (${emp.empCode})\n`;
      txt += `📅 ${monthLabel}\n`;
      txt += `━━━━━━━━━━━━━━\n`;
      txt += `🎯 เป้าหมาย: ฿${App.fmt(target)}\n`;
      txt += `✅ ยอดสะสม: ฿${App.fmt(total)}\n`;
      txt += `📈 % ถึงเป้า: ${pct}%\n`;
      txt += `📋 จำนวน SO: ${orders.length} บิล\n`;
      txt += `━━━━━━━━━━━━━━\n`;
      txt += `⏰ ${new Date().toLocaleString('th-TH')}`;
      return txt;
    } else {
      let txt = `📊 *Sales Order Summary*\n`;
      txt += `👤 ${emp.name} (${emp.empCode})\n`;
      txt += `📅 ${monthLabel}\n`;
      txt += `━━━━━━━━━━━━━━\n`;
      txt += `🎯 Target: ฿${App.fmt(target)}\n`;
      txt += `✅ Achieved: ฿${App.fmt(total)}\n`;
      txt += `📈 % to Target: ${pct}%\n`;
      txt += `📋 Total SO: ${orders.length} bills\n`;
      txt += `━━━━━━━━━━━━━━\n`;
      txt += `⏰ ${new Date().toLocaleString('en-GB')}`;
      return txt;
    }
  },

  // ── Export to XLSX using SheetJS ──────────────────────────
  async exportSOToExcel(emp, month, orders) {
    if (!window.XLSX) {
      await this._loadXLSX();
    }
    const monthLabel = DateUtil.formatMonth(month, 'en');
    const rows = [
      ['SO ID', 'Date', 'Product', 'Qty', 'Price', 'Total'],
    ];
    for (const o of orders) {
      if (o.items && o.items.length > 0) {
        for (const it of o.items) {
          rows.push([o.soId, o.date, it.name, it.qty, it.price, it.total]);
        }
      } else {
        rows.push([o.soId, o.date, '', '', '', o.totalAmt]);
      }
    }
    const totalRow = ['', '', '', '', 'TOTAL', orders.reduce((s,o) => s+(o.totalAmt||0), 0)];
    rows.push([]);
    rows.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 },{ wch: 12 },{ wch: 30 },{ wch: 8 },{ wch: 12 },{ wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Order');

    const fn = `SO_${emp.empCode}_${month}.xlsx`;
    XLSX.writeFile(wb, fn);
    App.showToast(`บันทึก ${fn}`, 'success');
  },

  async exportBillingToExcel(emp, month, bills, groups) {
    if (!window.XLSX) await this._loadXLSX();
    const rows = [['Group', 'Date', 'Amount', 'Incentive %', 'Incentive Amt']];
    for (const b of bills) {
      const g = groups.find(g => g.id === b.groupId);
      rows.push([g?.name || '-', b.date, b.amount, b.incentivePct || '', b.incentiveAmt || '']);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 36 },{ wch: 12 },{ wch: 14 },{ wch: 12 },{ wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Billing');
    XLSX.writeFile(wb, `Billing_${emp.empCode}_${month}.xlsx`);
    App.showToast('บันทึก Excel แล้ว', 'success');
  },

  async exportCustomerToExcel(emp, customers) {
    if (!window.XLSX) await this._loadXLSX();
    const rows = [['Name', 'Phone', 'Line ID', 'Status', 'Follow-up Date', 'Note']];
    for (const c of customers) {
      rows.push([c.name, c.tel, c.lineId, c.status, c.followUpDate || '', c.note || '']);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, `Customers_${emp.empCode}.xlsx`);
    App.showToast('บันทึก Excel แล้ว', 'success');
  },

  // ── Print / PDF via browser print ─────────────────────────
  async printPage(title, htmlContent) {
    const w = window.open('', '_blank');
    if (!w) { App.showToast('กรุณาอนุญาต popup', 'warn'); return; }
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family:'Sarabun',sans-serif; padding:24px; font-size:13px; color:#1a1a1a; }
        table { width:100%; border-collapse:collapse; margin-top:16px; }
        th { background:#1A1A1A; color:#F5C842; padding:8px 10px; text-align:left; font-size:12px; }
        td { padding:8px 10px; border-bottom:1px solid #eee; }
        .header { display:flex; justify-content:space-between; margin-bottom:16px; }
        h2 { font-size:18px; font-weight:700; }
        .total { font-weight:700; font-size:14px; }
        @media print { @page { margin:1cm; } }
      </style>
    </head><body>${htmlContent}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
  },

  _loadXLSX() {
    return new Promise((res, rej) => {
      if (window.XLSX) { res(); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
};
