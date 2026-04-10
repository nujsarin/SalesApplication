/* ============================================================
   db.js — Dexie.js IndexedDB Schema & Helpers
   ============================================================ */
'use strict';

const db = new Dexie('SalesTrackerPro');

db.version(1).stores({
  employees:   '++id, empCode, name, dept',
  targets:     '++id, empId, month',
  salesOrders: '++id, empId, date, soId',
  billing:     '++id, empId, date, groupId',
  customers:   '++id, empId, status, followUpDate',
  products:    '++id, groupId, name, sort',
  groups:      '++id, name, sort',
  settings:    'key'
});

// ── Default Data ─────────────────────────────────────────────
const DEFAULT_GROUPS = [
  { name: 'Group 1', incentivePct: { t1:1, t2:1, t3:1, t4:1 }, sort: 1 },
  { name: 'Group 2', incentivePct: { t1:1, t2:1, t3:1, t4:1 }, sort: 2 },
  { name: 'Group 3', incentivePct: { t1:1, t2:1, t3:1, t4:1 }, sort: 3 },
  { name: 'Group 4', incentivePct: { t1:1, t2:1, t3:1, t4:1 }, sort: 4 },
  { name: 'Group 5', incentivePct: { t1:1, t2:1, t3:1, t4:1 }, sort: 5 },
];

// Product Divisions per group (groupRef = DEFAULT_GROUPS[].name for fresh installs)
const DEFAULT_PRODUCTS = [
  { groupRef: 'Group 1', name: 'Index',              sort: 1 },
  { groupRef: 'Group 1', name: 'Winner',             sort: 2 },
  { groupRef: 'Group 2', name: 'Personalized',       sort: 1 },
  { groupRef: 'Group 2', name: 'PI',                 sort: 2 },
  { groupRef: 'Group 2', name: 'Trend Design',       sort: 3 },
  { groupRef: 'Group 2', name: 'Logica',             sort: 4 },
  { groupRef: 'Group 3', name: 'Theraflex',          sort: 1 },
  { groupRef: 'Group 3', name: 'Winner (Ownbrand)',  sort: 2 },
  { groupRef: 'Group 4', name: 'HDI',                sort: 1 },
  { groupRef: 'Group 5', name: 'Home Service',       sort: 1 },
  { groupRef: 'Group 5', name: 'Home Improvement',   sort: 2 },
  { groupRef: 'Group 5', name: 'Made to Order',      sort: 3 },
];

// Position-based mapping (for migration on existing DBs — independent of group names)
const PRODUCTS_BY_POS = [
  { pos:1, name:'Index',             sort:1 },
  { pos:1, name:'Winner',            sort:2 },
  { pos:2, name:'Personalized',      sort:1 },
  { pos:2, name:'PI',                sort:2 },
  { pos:2, name:'Trend Design',      sort:3 },
  { pos:2, name:'Logica',            sort:4 },
  { pos:3, name:'Theraflex',         sort:1 },
  { pos:3, name:'Winner (Ownbrand)', sort:2 },
  { pos:4, name:'HDI',               sort:1 },
  { pos:5, name:'Home Service',      sort:1 },
  { pos:5, name:'Home Improvement',  sort:2 },
  { pos:5, name:'Made to Order',     sort:3 },
];

// ── DB Helpers ───────────────────────────────────────────────
window.DB = {

  // ── Settings ──────────────────────────────────────────────
  async getSetting(key, def = null) {
    const r = await db.settings.get(key);
    return r ? r.value : def;
  },
  async setSetting(key, value) {
    await db.settings.put({ key, value });
  },

  // ── Session ────────────────────────────────────────────────
  async getSessionEmpId() {
    return await this.getSetting('sessionEmpId', null);
  },
  async setSession(empId) {
    await this.setSetting('sessionEmpId', empId);
    await this.setSetting('sessionTime', Date.now());
  },
  async clearSession() {
    await db.settings.delete('sessionEmpId');
    await db.settings.delete('sessionTime');
  },
  async isSessionValid() {
    const empId = await this.getSessionEmpId();
    if (!empId) return false;
    const t = await this.getSetting('sessionTime', 0);
    // Session expires after 12 hours
    return (Date.now() - t) < 12 * 60 * 60 * 1000;
  },

  // ── Employees ─────────────────────────────────────────────
  async getAllEmployees() {
    return db.employees.toArray();
  },
  async getEmployee(id) {
    return db.employees.get(id);
  },
  async getEmployeeByCode(code) {
    return db.employees.where('empCode').equals(code).first();
  },
  async addEmployee(data) {
    return db.employees.add(data);
  },
  async updateEmployee(id, data) {
    return db.employees.update(id, data);
  },

  // ── Targets ───────────────────────────────────────────────
  async getTarget(empId, month) {
    // month = 'YYYY-MM'
    return db.targets.where('[empId+month]').equals([empId, month]).first()
      .catch(() => db.targets.where('empId').equals(empId).and(r => r.month === month).first());
  },
  async setTarget(empId, month, data) {
    const existing = await this.getTarget(empId, month);
    if (existing) {
      await db.targets.update(existing.id, { ...data, empId, month });
      return existing.id;
    } else {
      return db.targets.add({ ...data, empId, month });
    }
  },

  // ── Sales Orders ──────────────────────────────────────────
  async getSalesOrdersByDate(empId, date) {
    // date = 'YYYY-MM-DD'
    return db.salesOrders.where('empId').equals(empId)
      .and(r => r.date === date).toArray();
  },
  async getSalesOrdersByMonth(empId, month) {
    // month = 'YYYY-MM'
    return db.salesOrders.where('empId').equals(empId)
      .and(r => r.date.startsWith(month)).toArray();
  },
  async addSalesOrder(data) {
    return db.salesOrders.add({ ...data, createdAt: Date.now() });
  },
  async updateSalesOrder(id, data) {
    return db.salesOrders.update(id, { ...data, updatedAt: Date.now() });
  },
  async deleteSalesOrder(id) {
    return db.salesOrders.delete(id);
  },
  async getSalesOrderById(id) {
    return db.salesOrders.get(id);
  },

  // ── Billing ────────────────────────────────────────────────
  async getBillingByDate(empId, date) {
    return db.billing.where('empId').equals(empId)
      .and(r => r.date === date).toArray();
  },
  async getBillingByMonth(empId, month) {
    return db.billing.where('empId').equals(empId)
      .and(r => r.date.startsWith(month)).toArray();
  },
  async addBilling(data) {
    return db.billing.add({ ...data, createdAt: Date.now() });
  },
  async updateBilling(id, data) {
    return db.billing.update(id, data);
  },
  async deleteBilling(id) {
    return db.billing.delete(id);
  },
  async upsertBillingEntry(empId, date, groupId, data) {
    const existing = await db.billing.where('empId').equals(empId)
      .and(r => r.date === date && r.groupId === groupId).first();
    if (existing) {
      await db.billing.update(existing.id, data);
      return existing.id;
    } else {
      return db.billing.add({ empId, date, groupId, ...data, createdAt: Date.now() });
    }
  },

  // ── Customers ─────────────────────────────────────────────
  async getCustomers(empId) {
    return db.customers.where('empId').equals(empId).toArray();
  },
  async addCustomer(data) {
    return db.customers.add({ ...data, createdAt: Date.now() });
  },
  async updateCustomer(id, data) {
    return db.customers.update(id, { ...data, updatedAt: Date.now() });
  },
  async deleteCustomer(id) {
    return db.customers.delete(id);
  },
  async getCustomer(id) {
    return db.customers.get(id);
  },

  // ── Products ──────────────────────────────────────────────
  async getProducts(groupId = null) {
    if (groupId !== null)
      return db.products.where('groupId').equals(groupId).sortBy('sort');
    return db.products.orderBy('sort').toArray();
  },
  async addProduct(data) {
    const maxSort = await db.products.where('groupId').equals(data.groupId).count();
    return db.products.add({ ...data, sort: maxSort + 1 });
  },
  async updateProduct(id, data) {
    return db.products.update(id, data);
  },
  async deleteProduct(id) {
    return db.products.delete(id);
  },

  // ── Groups ────────────────────────────────────────────────
  async getGroups() {
    return db.groups.orderBy('sort').toArray();
  },
  async addGroup(data) {
    const count = await db.groups.count();
    return db.groups.add({ ...data, sort: count + 1 });
  },
  async updateGroup(id, data) {
    return db.groups.update(id, data);
  },
  async deleteGroup(id) {
    return db.groups.delete(id);
  },
  async initDefaultGroups() {
    const count = await db.groups.count();
    if (count === 0) {
      // Seed groups and capture their auto-generated IDs
      const groupIdMap = {};
      for (const g of DEFAULT_GROUPS) {
        const id = await db.groups.add(g);
        groupIdMap[g.name] = id;
      }
      // Seed default product divisions (only if none exist)
      const prodCount = await db.products.count();
      if (prodCount === 0) {
        for (const p of DEFAULT_PRODUCTS) {
          const gid = groupIdMap[p.groupRef];
          if (gid) await db.products.add({ name: p.name, groupId: gid, price: 0, sort: p.sort });
        }
      }
    }
  },

  // ── Aggregations ──────────────────────────────────────────
  async getMonthSOTotal(empId, month) {
    const orders = await this.getSalesOrdersByMonth(empId, month);
    return orders.reduce((sum, o) => sum + (o.totalAmt || 0), 0);
  },
  async getDaySOTotal(empId, date) {
    const orders = await this.getSalesOrdersByDate(empId, date);
    return orders.reduce((sum, o) => sum + (o.totalAmt || 0), 0);
  },
  async getMonthBillingTotal(empId, month) {
    const bills = await this.getBillingByMonth(empId, month);
    return bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  },

  // ── Danger Zone ────────────────────────────────────────────
  async deleteMonthData(empId, month) {
    const orders = await this.getSalesOrdersByMonth(empId, month);
    for (const o of orders) await db.salesOrders.delete(o.id);
    const bills = await this.getBillingByMonth(empId, month);
    for (const b of bills) await db.billing.delete(b.id);
    // Clear walkin counter localStorage keys for this month
    try {
      const prefix = `walkins_${month}`;
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (_) {}
  },
  async deleteAllSalesData(empId) {
    await db.salesOrders.where('empId').equals(empId).delete();
    await db.billing.where('empId').equals(empId).delete();
  },

  // ── Delete single employee + all their data ──────────────
  async deleteEmployee(empId) {
    await db.salesOrders.where('empId').equals(empId).delete();
    await db.billing.where('empId').equals(empId).delete();
    await db.customers.where('empId').equals(empId).delete();
    await db.targets.where('empId').equals(empId).delete();
    await db.employees.delete(empId);
    // Clear walkin localStorage keys for this employee
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('walkins_')) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (_) {}
    // Clear session
    await this.clearSession();
  },

  async fullReset() {
    // 1. Try table-level clear FIRST (works even when DB delete is blocked)
    try {
      await db.employees.clear();
      await db.targets.clear();
      await db.salesOrders.clear();
      await db.billing.clear();
      await db.customers.clear();
      await db.products.clear();
      await db.groups.clear();
      await db.settings.clear();
      console.log('[DB] All tables cleared');
    } catch (e) {
      console.warn('[DB] Table clear failed:', e.message);
    }

    // 2. Close connection and attempt full DB delete
    try { db.close(); } catch (_) {}
    await new Promise(r => setTimeout(r, 100));

    try {
      await Dexie.delete('SalesTrackerPro');
      console.log('[DB] Database deleted');
    } catch (e) {
      console.warn('[DB] DB delete failed (tables already cleared):', e.message);
      // Tables already cleared in step 1, so data is still gone
    }

    // 3. Clear ALL Web Storage
    try { localStorage.clear(); } catch (_) {}
    try { sessionStorage.clear(); } catch (_) {}

    // 4. Unregister service workers + clear caches
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg => reg.unregister()));
    } catch (_) {}
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch (_) {}

    // 5. Wait for cleanup, then hard reload
    await new Promise(r => setTimeout(r, 300));
    location.href = location.href.split('?')[0] + '?_r=' + Date.now();
  },

  // ── Startup Migration ─────────────────────────────────────────
  // Runs on every app start. Fully idempotent — safe to repeat.
  // Fixes: old group name format, any missing product divisions.
  async migrateDefaultData() {
    try {
      const groups = await db.groups.orderBy('sort').toArray();
      if (groups.length === 0) return; // Fresh DB — nothing to migrate

      // 1. Rename groups that still have old "Group N — ..." format
      for (const g of groups) {
        if (g.name && g.name.includes('—')) {
          const clean = g.name.split('—')[0].trim();
          await db.groups.update(g.id, { name: clean });
        }
      }

      // 2. Seed any missing product divisions
      //    Map sort-position (1-based index of groups ordered by sort) → group id
      const posMap = {};
      groups.forEach((g, i) => { posMap[i + 1] = g.id; });

      // Load all existing products once for comparison
      const existing = await db.products.toArray();

      for (const p of PRODUCTS_BY_POS) {
        const gid = posMap[p.pos];
        if (!gid) continue;
        // Only insert if this name+group combination doesn't exist yet
        const alreadyExists = existing.some(e => e.name === p.name && e.groupId === gid);
        if (!alreadyExists) {
          await db.products.add({ name: p.name, groupId: gid, price: 0, sort: p.sort });
        }
      }
    } catch (e) {
      console.warn('[DB] migrateDefaultData:', e.message);
    }
  },

  // ── Backup / Export ───────────────────────────────────────
  async exportAll(empId) {
    const [orders, bills, customers, targets] = await Promise.all([
      db.salesOrders.where('empId').equals(empId).toArray(),
      db.billing.where('empId').equals(empId).toArray(),
      db.customers.where('empId').equals(empId).toArray(),
      db.targets.where('empId').equals(empId).toArray(),
    ]);
    return { orders, bills, customers, targets, exportedAt: new Date().toISOString() };
  }
};

console.log('[DB] Initialized — SalesTrackerPro v1');
