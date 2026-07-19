/**
 * نسما ستور — منطق لوحة التحكم
 * Nasma Store — Admin Control Panel Logic
 */

'use strict';

// تخزين مؤقت للصور المرفوعة (Base64) أثناء إضافة أو تعديل منتج
let uploadedProductImages = [null, null];
let uploadedProductImagesSizes = [null, null];


document.addEventListener('DOMContentLoaded', () => {
  // التحقق من حالة تسجيل الدخول
  if (NasmaDB.AdminAuth.isLoggedIn()) {
    showDashboard();
  } else {
    showLogin();
  }

  // ربط أزرار القائمة الجانبية بالتباديل
  document.querySelectorAll('.admin-menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
});

/* ===========================================
   إدارة تسجيل الدخول والخروج
   =========================================== */
function showLogin() {
  document.getElementById('admin-login-screen').style.display = 'flex';
  document.getElementById('admin-dashboard-layout').style.display = 'none';
}

function showDashboard() {
  document.getElementById('admin-login-screen').style.display = 'none';
  document.getElementById('admin-dashboard-layout').style.display = 'flex';
  
  // تطبيق ألوان وستايل المتجر حتى على لوحة التحكم
  const settings = NasmaDB.SettingsDB.get();
  document.documentElement.style.setProperty('--color-primary', settings.colorPrimary);
  document.documentElement.style.setProperty('--color-secondary', settings.colorSecondary);

  // تحميل التبويب الافتراضي (الإحصائيات)
  switchTab('dashboard');
}

function handleAdminLogin(e) {
  e.preventDefault();
  const user = document.getElementById('admin-username').value.trim();
  const pass = document.getElementById('admin-password').value;
  const errorEl = document.getElementById('login-error-msg');

  if (NasmaDB.AdminAuth.login(user, pass)) {
    errorEl.style.display = 'none';
    showDashboard();
  } else {
    errorEl.style.display = 'block';
  }
}

function handleAdminLogout() {
  NasmaDB.AdminAuth.logout();
  showLogin();
}

/* ===========================================
   التبديل بين التبويبات
   =========================================== */
function switchTab(tabId) {
  // إخفاء كل السكشنز
  document.querySelectorAll('.admin-tab-section').forEach(sec => {
    sec.style.display = 'none';
  });

  // إزالة الكلاس النشط من الأزرار
  document.querySelectorAll('.admin-menu-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active');
    }
  });

  // إظهار السكشن المطلوب
  const activeSection = document.getElementById(`admin-section-${tabId}`);
  if (activeSection) {
    activeSection.style.display = 'block';
  }

  // تحديث العنوان
  const titlesMap = {
    dashboard: 'الإحصائيات ونشاط المتجر',
    orders: 'إدارة الطلبات',
    products: 'إدارة المنتجات والمخزون',
    categories: 'تصنيفات المنتجات',
    coupons: 'كوبونات الخصم',
    shipping: 'إدارة أسعار الشحن للمحافظات',
    settings: 'إعدادات المتجر العامة',
    landingpages: '🚀 مولّد صفحات الهبوط الاحترافية',
    marketing: '📡 التسويق الرقمي — البيكسل وكتالوج المنتجات',
  };
  document.getElementById('admin-current-tab-title').textContent = titlesMap[tabId] || '';

  // تنفيذ تحميل البيانات الخاص بكل تبويب
  if (tabId === 'dashboard') loadDashboardStats();
  if (tabId === 'orders') loadOrdersList();
  if (tabId === 'products') loadProductsList();
  if (tabId === 'categories') loadCategoriesList();
  if (tabId === 'coupons') loadCouponsList();
  if (tabId === 'shipping') loadShippingList();
  if (tabId === 'settings') loadStoreSettingsForm();
  if (tabId === 'landingpages') loadLandingPageTab();
  if (tabId === 'marketing') loadMarketingTab();
}

let dashDateFilter = { from: null, to: null, preset: 'all' };

function setDashDatePreset(preset) {
  const now = new Date();
  let fromDate = null;
  let toDate = new Date();

  // reset inputs
  const fromInput = document.getElementById('dash-date-from');
  const toInput = document.getElementById('dash-date-to');
  if (fromInput) fromInput.value = '';
  if (toInput) toInput.value = '';

  document.querySelectorAll('#dash-date-presets button').forEach(btn => btn.classList.remove('active'));
  const btn = document.getElementById(`preset-${preset}`);
  if (btn) btn.classList.add('active');

  if (preset === 'today') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (preset === 'week') {
    // start of week (Sunday)
    const day = now.getDay();
    fromDate = new Date(now.setDate(now.getDate() - day));
    fromDate.setHours(0, 0, 0, 0);
    toDate = new Date();
    toDate.setHours(23, 59, 59, 999);
  } else if (preset === 'month') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (preset === 'year') {
    fromDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    toDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (preset === 'all') {
    fromDate = null;
    toDate = null;
  }

  dashDateFilter.from = fromDate;
  dashDateFilter.to = toDate;
  dashDateFilter.preset = preset;

  updateDashDateLabel();
  loadDashboardStats();
}

function onDashCustomDate() {
  const fromVal = document.getElementById('dash-date-from').value;
  const toVal = document.getElementById('dash-date-to').value;

  document.querySelectorAll('#dash-date-presets button').forEach(btn => btn.classList.remove('active'));

  dashDateFilter.from = fromVal ? new Date(new Date(fromVal).setHours(0, 0, 0, 0)) : null;
  dashDateFilter.to = toVal ? new Date(new Date(toVal).setHours(23, 59, 59, 999)) : null;
  dashDateFilter.preset = 'custom';

  updateDashDateLabel();
  loadDashboardStats();
}

function resetDashDate() {
  setDashDatePreset('all');
}

function updateDashDateLabel() {
  const labelEl = document.getElementById('dash-date-label');
  if (!labelEl) return;

  if (dashDateFilter.preset === 'all') {
    labelEl.textContent = 'كل الفترات';
  } else if (dashDateFilter.preset === 'today') {
    labelEl.textContent = 'اليوم';
  } else if (dashDateFilter.preset === 'week') {
    labelEl.textContent = 'هذا الأسبوع';
  } else if (dashDateFilter.preset === 'month') {
    labelEl.textContent = 'هذا الشهر';
  } else if (dashDateFilter.preset === 'year') {
    labelEl.textContent = 'هذا العام';
  } else if (dashDateFilter.preset === 'custom') {
    const fromStr = dashDateFilter.from ? new Date(dashDateFilter.from).toLocaleDateString('ar-EG') : 'البداية';
    const toStr = dashDateFilter.to ? new Date(dashDateFilter.to).toLocaleDateString('ar-EG') : 'النهاية';
    labelEl.textContent = `من ${fromStr} إلى ${toStr}`;
  }
}

/* ===========================================
   1. الإحصائيات (Dashboard)
   =========================================== */
function loadDashboardStats() {
  let orders     = NasmaDB.OrdersDB.getAll();
  const products = NasmaDB.ProductsDB.getAll();
  const coupons  = NasmaDB.CouponsDB.getAll();

  // فلترة الطلبات بالتاريخ
  if (dashDateFilter.from) {
    orders = orders.filter(o => new Date(o.createdAt) >= dashDateFilter.from);
  }
  if (dashDateFilter.to) {
    orders = orders.filter(o => new Date(o.createdAt) <= dashDateFilter.to);
  }

  // ─── KPI الأساسية ───
  const total = orders.length;
  const revenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + o.total, 0);

  const byStatus = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const pending = byStatus.pending || 0;
  const processing = byStatus.processing || 0;
  const shipped = byStatus.shipped || 0;
  const delivered = byStatus.delivered || 0;
  const cancelled = byStatus.cancelled || 0;

  const completedOrders = orders.filter(o => ['processing','shipped','delivered'].includes(o.status));
  const avgOrder = completedOrders.length
    ? completedOrders.reduce((s, o) => s + o.total, 0) / completedOrders.length
    : 0;

  // إحصائيات الكوبونات حسب الطلبات المفلترة
  const couponUsesMap = {};
  orders.forEach(o => {
    if (o.couponCode) {
      couponUsesMap[o.couponCode] = (couponUsesMap[o.couponCode] || 0) + 1;
    }
  });
  const totalCouponUses  = Object.values(couponUsesMap).reduce((s, v) => s + v, 0);
  const totalCouponSaving = orders.reduce((s, o) => s + (o.discount || 0), 0);

  const activeProducts = products.filter(p => p.active !== false).length;
  const cancelRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : 0;
  const deliverRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : 0;

  // ─── تحديث بطاقات KPI ───
  document.getElementById('stat-revenue').textContent         = NasmaDB.formatPrice(revenue);
  document.getElementById('stat-revenue-sub').textContent     = 'استثناء الملغيات';
  document.getElementById('stat-total-orders').textContent    = total;
  document.getElementById('stat-orders-sub').textContent      = `${pending} معلق، ${processing} قيد التنفيذ`;
  document.getElementById('stat-pending-orders').textContent  = pending;
  document.getElementById('stat-delivered-orders').textContent= delivered;
  document.getElementById('stat-deliver-rate').textContent    = `${deliverRate}% معدل الإنجاز`;
  document.getElementById('stat-cancelled-orders').textContent= cancelled;
  document.getElementById('stat-cancel-rate').textContent     = `${cancelRate}% نسبة الإلغاء`;
  document.getElementById('stat-total-products').textContent  = products.length;
  document.getElementById('stat-active-products').textContent = `${activeProducts} منتج نشط`;
  document.getElementById('stat-avg-order').textContent       = NasmaDB.formatPrice(avgOrder);
  document.getElementById('stat-coupon-uses').textContent     = totalCouponUses;
  document.getElementById('stat-coupon-saving').textContent   = `توفير إجمالي ${NasmaDB.formatPrice(totalCouponSaving)}`;

  // ─── توزيع حالات الطلبات ───
  const statusDefs = [
    { key: 'pending',    label: 'معلقة',       color: '#f59e0b', count: pending    },
    { key: 'processing', label: 'قيد التنفيذ', color: '#3b82f6', count: processing },
    { key: 'shipped',    label: 'تم الشحن',    color: '#8b5cf6', count: shipped    },
    { key: 'delivered',  label: 'تم التسليم',  color: '#10b981', count: delivered  },
    { key: 'cancelled',  label: 'ملغية',       color: '#ef4444', count: cancelled  },
  ];
  const statusEl = document.getElementById('dash-status-breakdown');
  if (total === 0) {
    statusEl.innerHTML = '<p style="color:#94a3b8; font-size:13px; text-align:center; padding:20px 0;">لا توجد طلبات بعد في هذه الفترة</p>';
  } else {
    statusEl.innerHTML = statusDefs.map(s => {
      const pct = ((s.count / total) * 100).toFixed(1);
      return `
        <div class="dash-progress-item">
          <div class="dash-progress-row">
            <span style="display:flex; align-items:center; gap:6px;">
              <span class="status-dot" style="background:${s.color};"></span>
              ${s.label}
            </span>
            <span style="color:#475569;">${s.count} <span style="color:#94a3b8;">(${pct}%)</span></span>
          </div>
          <div class="dash-progress-bar-track">
            <div class="dash-progress-bar-fill" style="width:${pct}%; background:${s.color};"></div>
          </div>
        </div>`;
    }).join('');
  }

  // ─── أكثر المحافظات طلباً ───
  const cityMap = {};
  orders.forEach(o => {
    const city = (o.customer && o.customer.city) ? o.customer.city.trim() : 'غير محدد';
    cityMap[city] = (cityMap[city] || 0) + 1;
  });
  const topCities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCity   = topCities[0]?.[1] || 1;
  const citiesEl  = document.getElementById('dash-top-cities');
  if (!topCities.length) {
    citiesEl.innerHTML = '<p style="color:#94a3b8; font-size:13px; text-align:center; padding:20px 0;">لا توجد بيانات لهذه الفترة</p>';
  } else {
    const colors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6','#14b8a6','#f97316'];
    citiesEl.innerHTML = topCities.map(([city, count], i) => {
      const pct = ((count / maxCity) * 100).toFixed(0);
      const color = colors[i % colors.length];
      return `
        <div class="dash-progress-item">
          <div class="dash-progress-row">
            <span>${city}</span>
            <span style="color:#475569;">${count} طلب</span>
          </div>
          <div class="dash-progress-bar-track">
            <div class="dash-progress-bar-fill" style="width:${pct}%; background:${color};"></div>
          </div>
        </div>`;
    }).join('');
  }

  // ─── أفضل المنتجات مبيعاً ───
  const productSales = {};
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { name: item.name, sold: 0, revenue: 0, image: '' };
      }
      productSales[item.productId].sold    += item.qty || 1;
      productSales[item.productId].revenue += (item.price || 0) * (item.qty || 1);
    });
  });
  products.forEach(p => {
    if (productSales[p.id]) {
      productSales[p.id].image = (p.images && p.images[0]) ? p.images[0] : '';
    }
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.sold - a.sold).slice(0, 7);
  const rankClasses = ['gold','silver','bronze','','','',''];
  const topProdEl = document.getElementById('dash-top-products');
  if (!topProducts.length) {
    topProdEl.innerHTML = '<p style="color:#94a3b8; font-size:13px; text-align:center; padding:20px 0;">لا توجد مبيعات في هذه الفترة</p>';
  } else {
    topProdEl.innerHTML = topProducts.map((p, i) => `
      <div class="top-product-item">
        <div class="top-product-rank ${rankClasses[i]}">${i + 1}</div>
        ${p.image ? `<img class="top-product-img" src="${p.image}" alt="${p.name}">` : '<div class="top-product-img" style="display:flex;align-items:center;justify-content:center;font-size:18px;">🛍️</div>'}
        <div class="top-product-name">${p.name}</div>
        <span class="top-product-sold">${p.sold} مبيعة</span>
      </div>`).join('');
  }

  // ─── ملخص الكوبونات ───
  const activeCoupons   = coupons.filter(c => c.active).length;
  const expiredCoupons  = coupons.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length;
  const exhaustedCoupons= coupons.filter(c => c.maxUses > 0 && c.usedCount >= c.maxUses).length;
  const couponSummaryEl = document.getElementById('dash-coupons-summary');
  couponSummaryEl.innerHTML = `
    <div class="mini-stat-row"><span class="mini-stat-label">إجمالي الكوبونات</span><span class="mini-stat-val">${coupons.length}</span></div>
    <div class="mini-stat-row"><span class="mini-stat-label">كوبونات نشطة</span><span class="mini-stat-val" style="color:#10b981;">${activeCoupons}</span></div>
    <div class="mini-stat-row"><span class="mini-stat-label">منتهية الصلاحية</span><span class="mini-stat-val" style="color:#f59e0b;">${expiredCoupons}</span></div>
    <div class="mini-stat-row"><span class="mini-stat-label">استُنفدت استخداماتها</span><span class="mini-stat-val" style="color:#ef4444;">${exhaustedCoupons}</span></div>
    <div class="mini-stat-row"><span class="mini-stat-label">الاستخدامات في هذه الفترة</span><span class="mini-stat-val" style="color:#6366f1;">${totalCouponUses}</span></div>`;

  // أكثر الكوبونات استخداماً في هذه الفترة
  const topCoupons = coupons
    .map(c => ({ ...c, periodUses: couponUsesMap[c.code] || 0 }))
    .sort((a, b) => b.periodUses - a.periodUses)
    .slice(0, 4);
  
  const couponDetailEl = document.getElementById('dash-coupons-detail');
  if (!topCoupons.length || !totalCouponUses) {
    couponDetailEl.innerHTML = '<p style="color:#94a3b8; font-size:12px;">لا توجد كوبونات مستخدمة في هذه الفترة</p>';
  } else {
    couponDetailEl.innerHTML = topCoupons.filter(c => c.periodUses > 0).map(c => `
      <div class="mini-stat-row">
        <span class="mini-stat-label" style="font-weight:700; color:#0f172a;">${c.code}</span>
        <span class="mini-stat-val">${c.periodUses} مرة</span>
      </div>`).join('') || '<p style="color:#94a3b8; font-size:12px;">لا توجد كوبونات مستخدمة في هذه الفترة</p>';
  }

  // ─── آخر 10 طلبات ───
  const recentOrders = orders.slice(0, 10);
  const tbody = document.getElementById('dashboard-recent-orders-list');
  if (!recentOrders.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#94a3b8; padding:2rem;">لا توجد طلبات مسجلة في هذه الفترة</td></tr>`;
    return;
  }
  tbody.innerHTML = recentOrders.map(o => {
    const status = NasmaDB.orderStatusLabel(o.status);
    return `
      <tr>
        <td style="font-weight:700;">${o.orderNumber}</td>
        <td>${o.customer.name || ''}</td>
        <td style="direction:ltr;">${o.customer.phone || ''}</td>
        <td>${o.customer.city || ''}</td>
        <td>${NasmaDB.formatDate(o.createdAt)}</td>
        <td style="font-weight:700; color:var(--color-primary-dark);">${NasmaDB.formatPrice(o.total)}</td>
        <td>${o.couponCode ? `<span style="background:#dbeafe; color:#2563eb; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:700;">${o.couponCode}</span>` : '<span style="color:#94a3b8;">—</span>'}</td>
        <td>
          <span class="badge-status" style="background:${status.color}15; color:${status.color};">${status.label}</span>
        </td>
      </tr>
    `;
  }).join('');
}


/* ===========================================
   2. إدارة الطلبات
   =========================================== */
function loadOrdersList() {
  let orders = NasmaDB.OrdersDB.getAll();
  const tbody = document.getElementById('admin-orders-list');

  // جلب قيمة البحث وحالة الطلب للفلترة
  const searchInput = document.getElementById('order-search-input');
  const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const statusFilter = document.getElementById('order-status-filter');
  const statusValue = statusFilter ? statusFilter.value : 'all';

  // تطبيق فلترة البحث
  if (searchQuery) {
    orders = orders.filter(o => {
      const orderNumber = o.orderNumber ? o.orderNumber.toLowerCase() : '';
      const name = (o.customer && o.customer.name) ? o.customer.name.toLowerCase() : '';
      const phone = (o.customer && o.customer.phone) ? o.customer.phone.toLowerCase() : '';
      const city = (o.customer && o.customer.city) ? o.customer.city.toLowerCase() : '';

      return orderNumber.includes(searchQuery) ||
             name.includes(searchQuery) ||
             phone.includes(searchQuery) ||
             city.includes(searchQuery);
    });
  }

  // تطبيق فلترة الحالة
  if (statusValue && statusValue !== 'all') {
    orders = orders.filter(o => o.status === statusValue);
  }

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#94a3b8; padding:2rem;">لا توجد نتائج مطابقة للبحث</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const status = NasmaDB.orderStatusLabel(o.status);
    return `
      <tr>
        <td style="font-weight:700;">${o.orderNumber}</td>
        <td>${o.customer.name || ''}</td>
        <td>${o.customer.phone || ''}</td>
        <td>${o.customer.city || ''}</td>
        <td>${NasmaDB.formatDate(o.createdAt)}</td>
        <td style="font-weight:700;">${NasmaDB.formatPrice(o.total)}</td>
        <td>
          <select onchange="updateOrderStatus('${o.id}', this.value)" style="padding:4px 8px; border-radius:4px; border:1px solid #cbd5e1; font-family:'Tajawal'; font-size:12px; background:#fff; cursor:pointer;">
            <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>معلق</option>
            <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>قيد التنفيذ</option>
            <option value="shipped" ${o.status === 'shipped' ? 'selected' : ''}>تم الشحن</option>
            <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>تم التسليم</option>
            <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
          </select>
        </td>
        <td>
          <div class="action-row-btns">
            <button class="action-btn" onclick="viewOrderDetails('${o.id}')" title="عرض التفاصيل">👁️</button>
            <button class="action-btn" onclick="exportOrderInvoice('${o.id}')" title="تصدير فاتورة PDF">📄</button>
            <button class="action-btn" onclick="openEditOrderModal('${o.id}')" title="تعديل بيانات الطلب">✏️</button>
            <button class="action-btn delete" onclick="deleteOrder('${o.id}')" title="حذف الطلب">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateOrderStatus(orderId, newStatus) {
  if (NasmaDB.OrdersDB.updateStatus(orderId, newStatus)) {
    alert('تم تحديث حالة الطلب بنجاح');
    loadOrdersList();
  }
}

function viewOrderDetails(orderId) {
  const o = NasmaDB.OrdersDB.getById(orderId);
  if (!o) return;

  const modalBody = document.getElementById('order-detail-modal-body');
  
  const itemsHTML = o.items.map(item => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f1f5f9;">
      <div>
        <p style="font-weight:700; margin:0;">${item.name}</p>
        <p style="font-size:12px; color:#64748b; margin:4px 0 0 0;">
          الكمية: ${item.qty} ${item.size ? `| الحجم: ${item.size}` : ''} ${item.color ? `| اللون: ${item.color}` : ''}
        </p>
      </div>
      <span style="font-weight:700;">${NasmaDB.formatPrice(item.price * item.qty)}</span>
    </div>
  `).join('');

  modalBody.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:15px; text-align:right;">
      <div>
        <h4 style="margin:0 0 8px 0; color:#475569;">بيانات العميل:</h4>
        <p style="margin:4px 0;"><strong>الاسم:</strong> ${o.customer.name}</p>
        <p style="margin:4px 0;"><strong>الهاتف:</strong> ${o.customer.phone}</p>
        <p style="margin:4px 0;"><strong>البريد:</strong> ${o.customer.email || '-'}</p>
        <p style="margin:4px 0;"><strong>العنوان:</strong> ${o.customer.city}، ${o.customer.address}</p>
        ${o.notes ? `<p style="margin:4px 0;"><strong>ملاحظات:</strong> ${o.notes}</p>` : ''}
      </div>
      
      <hr style="border:none; border-top:1px solid #cbd5e1; margin:5px 0;">

      <div>
        <h4 style="margin:0 0 8px 0; color:#475569;">المنتجات المطلوبة:</h4>
        ${itemsHTML}
      </div>

      <div style="background:#f8fafc; padding:15px; border-radius:8px; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between;">
          <span>المجموع الفرعي:</span>
          <span>${NasmaDB.formatPrice(o.subtotal)}</span>
        </div>
        ${o.discount > 0 ? `
        <div style="display:flex; justify-content:space-between; color:#ef4444;">
          <span>الخصم (${o.couponCode}):</span>
          <span>-${NasmaDB.formatPrice(o.discount)}</span>
        </div>` : ''}
        <div style="display:flex; justify-content:space-between;">
          <span>الشحن:</span>
          <span>${o.shipping === 0 ? 'مجاني' : NasmaDB.formatPrice(o.shipping)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-weight:800; font-size:16px; border-top:1px solid #e2e8f0; padding-top:8px;">
          <span>المجموع الكلي:</span>
          <span style="color:var(--color-primary-dark);">${NasmaDB.formatPrice(o.total)}</span>
        </div>
      </div>
      <button class="btn btn-primary" onclick="exportOrderInvoice('${o.id}')" style="margin-top: 15px; width: 100%; justify-content: center; display: flex; align-items: center; gap: 8px;">
        📄 تصدير فاتورة PDF
      </button>
    </div>
  `;

  document.getElementById('order-modal-overlay').classList.add('open');
}

function closeOrderModal() {
  document.getElementById('order-modal-overlay').classList.remove('open');
}

function openEditOrderModal(orderId) {
  const o = NasmaDB.OrdersDB.getById(orderId);
  if (!o) return;

  document.getElementById('edit-order-id').value = o.id;
  document.getElementById('edit-order-customer-name').value = o.customer.name || '';
  document.getElementById('edit-order-customer-phone').value = o.customer.phone || '';
  document.getElementById('edit-order-customer-city').value = o.customer.city || '';
  document.getElementById('edit-order-customer-address').value = o.customer.address || '';
  document.getElementById('edit-order-subtotal').value = o.subtotal || 0;
  document.getElementById('edit-order-shipping').value = o.shipping || 0;
  document.getElementById('edit-order-discount').value = o.discount || 0;
  document.getElementById('edit-order-total').value = o.total || 0;

  document.getElementById('edit-order-modal-overlay').classList.add('open');
}

function closeEditOrderModal() {
  document.getElementById('edit-order-modal-overlay').classList.remove('open');
}

function calculateEditOrderTotal() {
  const subtotal = parseFloat(document.getElementById('edit-order-subtotal').value) || 0;
  const shipping = parseFloat(document.getElementById('edit-order-shipping').value) || 0;
  const discount = parseFloat(document.getElementById('edit-order-discount').value) || 0;
  const total = Math.max(0, subtotal + shipping - discount);
  document.getElementById('edit-order-total').value = total;
}

function handleEditOrderSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('edit-order-id').value;
  const name = document.getElementById('edit-order-customer-name').value.trim();
  const phone = document.getElementById('edit-order-customer-phone').value.trim();
  const city = document.getElementById('edit-order-customer-city').value.trim();
  const address = document.getElementById('edit-order-customer-address').value.trim();
  const subtotal = parseFloat(document.getElementById('edit-order-subtotal').value) || 0;
  const shipping = parseFloat(document.getElementById('edit-order-shipping').value) || 0;
  const discount = parseFloat(document.getElementById('edit-order-discount').value) || 0;
  const total = parseFloat(document.getElementById('edit-order-total').value) || 0;

  const updatedData = {
    customer: { name, phone, city, address },
    subtotal,
    shipping,
    discount,
    total
  };

  if (NasmaDB.OrdersDB.update(id, updatedData)) {
    alert('تم تعديل بيانات الطلب بنجاح');
    closeEditOrderModal();
    loadOrdersList();
  } else {
    alert('حدث خطأ أثناء تعديل الطلب');
  }
}

function deleteOrder(orderId) {
  if (confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟')) {
    if (NasmaDB.OrdersDB.delete(orderId)) {
      alert('تم حذف الطلب بنجاح');
      loadOrdersList();
    } else {
      alert('حدث خطأ أثناء حذف الطلب');
    }
  }
}

function exportOrdersReport() {
  const startVal = document.getElementById('order-report-start').value;
  const endVal = document.getElementById('order-report-end').value;

  let orders = NasmaDB.OrdersDB.getAll();

  if (startVal) {
    const startDate = new Date(startVal);
    startDate.setHours(0, 0, 0, 0);
    orders = orders.filter(o => new Date(o.createdAt) >= startDate);
  }
  if (endVal) {
    const endDate = new Date(endVal);
    endDate.setHours(23, 59, 59, 999);
    orders = orders.filter(o => new Date(o.createdAt) <= endDate);
  }

  if (!orders.length) {
    alert('لا توجد طلبات في الفترة المحددة لتصدير تقريرها.');
    return;
  }

  // BOM to support Arabic characters in Microsoft Excel
  let csvContent = "\uFEFF"; 
  
  const headers = [
    "رقم الطلب", "تاريخ الإنشاء", "اسم العميل", "رقم الجوال", "البريد الإلكتروني", 
    "المدينة", "العنوان بالتفصيل", "المنتجات وتفاصيلها", "المجموع الفرعي (ج.م)", 
    "خصم الكوبون (ج.م)", "تكلفة الشحن (ج.م)", "المجموع النهائي (ج.م)", 
    "كود الكوبون", "حالة الطلب", "ملاحظات العميل"
  ];
  
  csvContent += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",") + "\n";

  orders.forEach(o => {
    const productsDetails = o.items.map(item => {
      let details = `${item.name} (كمية: ${item.qty}`;
      if (item.size) details += `, مقاس: ${item.size}`;
      if (item.color) details += `, لون: ${item.color}`;
      details += `)`;
      return details;
    }).join(" | ");

    const statusLabels = {
      pending: "معلق",
      processing: "قيد التنفيذ",
      shipped: "تم الشحن",
      delivered: "تم التسليم",
      cancelled: "ملغي"
    };

    const row = [
      o.orderNumber || '',
      o.createdAt ? new Date(o.createdAt).toLocaleString('ar-EG') : '',
      o.customer.name || '',
      o.customer.phone || '',
      o.customer.email || '',
      o.customer.city || '',
      o.customer.address || '',
      productsDetails,
      o.subtotal || 0,
      o.discount || 0,
      o.shipping || 0,
      o.total || 0,
      o.couponCode || '',
      statusLabels[o.status] || o.status,
      o.notes || ''
    ];

    csvContent += row.map(val => {
      const stringVal = String(val);
      return `"${stringVal.replace(/"/g, '""')}"`;
    }).join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const filename = `تقرير_الطلبات_${startVal || 'من_البداية'}_إلى_${endVal || 'اليوم'}.csv`;
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportOrdersPDF() {
  const startVal = document.getElementById('order-report-start').value;
  const endVal   = document.getElementById('order-report-end').value;

  let orders = NasmaDB.OrdersDB.getAll();

  if (startVal) {
    const s = new Date(startVal); s.setHours(0,0,0,0);
    orders = orders.filter(o => new Date(o.createdAt) >= s);
  }
  if (endVal) {
    const e = new Date(endVal); e.setHours(23,59,59,999);
    orders = orders.filter(o => new Date(o.createdAt) <= e);
  }

  if (!orders.length) {
    alert('لا توجد طلبات في الفترة المحددة.');
    return;
  }

  const settings  = NasmaDB.SettingsDB.get();
  const storeName = settings.storeTitle || settings.storeName || 'نسما ستور';
  const year = new Date().getFullYear();

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);

  const statusMap = {
    pending: 'new',
    processing: 'processing',
    shipped: 'shipped',
    delivered: 'done',
    cancelled: 'cancelled'
  };

  const rows = orders.map((o, i) => {
    const dateStr = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '-';
    
    // Add '#' prefix to order number if it doesn't already have it
    let orderNum = o.orderNumber || '';
    if (orderNum && !orderNum.startsWith('#')) {
      orderNum = '#' + orderNum;
    }

    const productsText = o.items.map(it => `${it.name} (${it.qty})`).join(' - ');
    const statusText = statusMap[o.status] || o.status;

    return `
      <tr>
        <td>${i + 1}</td>
        <td style="font-weight: 700;">${orderNum}</td>
        <td>${dateStr}</td>
        <td>${o.customer.name || '-'}</td>
        <td style="direction: ltr;">${o.customer.phone || '-'}</td>
        <td>${o.customer.city || '-'}</td>
        <td>${o.customer.address || '-'}</td>
        <td>${productsText}</td>
        <td>${o.total} ج.م</td>
        <td>${statusText}</td>
      </tr>
    `;
  }).join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير الطلبات — ${storeName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
    
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Tajawal', sans-serif;
      background: #ffffff;
      color: #000000;
      direction: rtl;
      padding: 40px 20px;
    }

    .header-container {
      text-align: center;
      margin-bottom: 40px;
    }

    .store-title {
      font-size: 36px;
      font-weight: 800;
      color: #00a2e8;
      margin-bottom: 10px;
    }

    .report-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .order-count {
      font-size: 18px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    th, td {
      border: 1px solid #b3b3b3;
      padding: 12px 8px;
      text-align: center;
      vertical-align: middle;
      font-size: 13px;
      line-height: 1.5;
    }

    th {
      font-weight: 700;
      background-color: #ffffff;
    }

    .total-container {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 18px;
      font-weight: 700;
      padding: 0 10px;
    }

    .total-label {
      color: #000000;
    }

    .total-value {
      color: #00a2e8;
    }

    @media print {
      body {
        padding: 20px 10px;
      }
      .total-container {
        margin-top: 30px;
      }
    }
  </style>
</head>
<body>
  <div class="header-container">
    <h1 class="store-title">${storeName}</h1>
    <h2 class="report-title">تقرير طلبات سنة ${year}</h2>
    <p class="order-count">عدد الطلبات: ${orders.length}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px;">#</th>
        <th>رقم الطلب</th>
        <th>التاريخ</th>
        <th>اسم العميل</th>
        <th>الهاتف</th>
        <th>المحافظة</th>
        <th>العنوان</th>
        <th>المنتجات</th>
        <th>الإجمالي</th>
        <th>الحالة</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="total-container">
    <span class="total-label">إجمالي المبيعات:</span>
    <span class="total-value">${totalRevenue} ج.م</span>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

function exportOrderInvoice(orderId) {
  const o = NasmaDB.OrdersDB.getById(orderId);
  if (!o) return;

  const settings = NasmaDB.SettingsDB.get();
  const storeName = settings.storeTitle || settings.storeName || 'نسما ستور';
  const logoHTML = settings.logoDataUrl
    ? `<img src="${settings.logoDataUrl}" alt="شعار ${storeName}" style="max-height: 80px; object-fit: contain; margin-bottom: 10px;">`
    : `<h1 style="font-size: 28px; font-weight: 800; color: var(--color-primary, #C4A882); margin-bottom: 5px;">${storeName}</h1>`;

  const dateStr = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '-';
  
  let orderNum = o.orderNumber || '';
  if (orderNum && !orderNum.startsWith('#')) {
    orderNum = '#' + orderNum;
  }

  const itemsRows = o.items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td style="text-align: right; font-weight: 700;">${item.name}</td>
      <td>${item.qty}</td>
      <td>${item.size || '-'}</td>
      <td>${item.color || '-'}</td>
      <td>${item.price} ج.م</td>
      <td style="font-weight: 700;">${item.price * item.qty} ج.م</td>
    </tr>
  `).join('');

  const discountRow = o.discount > 0 ? `
    <div class="summary-row" style="color: #ef4444;">
      <span>خصم (${o.couponCode || 'كوبون'}):</span>
      <span>-${o.discount} ج.م</span>
    </div>
  ` : '';

  const shippingText = o.shipping === 0 ? 'شحن مجاني' : `${o.shipping} ج.م`;

  const invoiceHtml = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>فاتورة طلب ${orderNum} — ${storeName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
    
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Tajawal', sans-serif;
      background: #ffffff;
      color: #1e293b;
      direction: rtl;
      padding: 40px;
    }

    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }

    .store-info {
      text-align: right;
    }

    .invoice-meta {
      text-align: left;
      font-size: 14px;
      line-height: 1.6;
    }

    .invoice-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 5px;
    }

    .grid-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }

    .info-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px 20px;
    }

    .info-title {
      font-size: 14px;
      font-weight: 800;
      color: #475569;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
    }

    .info-row {
      font-size: 13px;
      margin-bottom: 5px;
      line-height: 1.5;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }

    th, td {
      border-bottom: 1px solid #cbd5e1;
      padding: 12px 10px;
      text-align: center;
      vertical-align: middle;
      font-size: 13px;
    }

    th {
      font-weight: 700;
      background-color: #f8fafc;
      color: #475569;
      border-top: 1px solid #cbd5e1;
      border-bottom: 2px solid #cbd5e1;
    }

    .financial-summary {
      width: 100%;
      max-width: 320px;
      margin-right: auto;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px 20px;
      font-size: 14px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .summary-row.total {
      font-size: 16px;
      font-weight: 800;
      border-top: 2px solid #cbd5e1;
      padding-top: 8px;
      margin-top: 8px;
      color: #0f172a;
    }

    .invoice-footer {
      text-align: center;
      margin-top: 40px;
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
    }

    @media print {
      body {
        padding: 0;
      }
      .invoice-card {
        border: none;
        box-shadow: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="invoice-header">
      <div class="store-info">
        ${logoHTML}
        <p style="font-size: 14px; color: #64748b;">${settings.storeDesc || ''}</p>
      </div>
      <div class="invoice-meta">
        <h2 class="invoice-title">فاتورة شراء</h2>
        <p><strong>رقم الفاتورة:</strong> ${orderNum}</p>
        <p><strong>التاريخ:</strong> ${dateStr}</p>
        <p><strong>حالة الطلب:</strong> ${NasmaDB.orderStatusLabel(o.status).label}</p>
      </div>
    </div>

    <div class="grid-container">
      <div class="info-section">
        <h3 class="info-title">👤 بيانات المستلم</h3>
        <div class="info-row"><strong>الاسم:</strong> ${o.customer.name || '-'}</div>
        <div class="info-row"><strong>رقم الهاتف:</strong> ${o.customer.phone || '-'}</div>
        <div class="info-row"><strong>المدينة / المحافظة:</strong> ${o.customer.city || '-'}</div>
        <div class="info-row"><strong>العنوان بالتفصيل:</strong> ${o.customer.address || '-'}</div>
        ${o.notes ? `<div class="info-row"><strong>ملاحظات العميل:</strong> ${o.notes}</div>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th style="text-align: right;">اسم المنتج</th>
          <th>الكمية</th>
          <th>المقاس</th>
          <th>اللون</th>
          <th>سعر الوحدة</th>
          <th>الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="financial-summary">
      <div class="summary-row">
        <span>المجموع الفرعي:</span>
        <span>${o.subtotal} ج.م</span>
      </div>
      ${discountRow}
      <div class="summary-row">
        <span>تكلفة الشحن:</span>
        <span>${shippingText}</span>
      </div>
      <div class="summary-row total">
        <span>الإجمالي النهائي:</span>
        <span>${o.total} ج.م</span>
      </div>
    </div>

    <div class="invoice-footer">
      <p>شكراً لتسوقكِ من متجرنا 🌸</p>
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(invoiceHtml);
  win.document.close();
}


function loadProductsList() {
  const products = NasmaDB.ProductsDB.getAll();
  const tbody = document.getElementById('admin-products-list');

  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#94a3b8; padding:2rem;">لا توجد منتجات مضافة بعد</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const cat = NasmaDB.CategoriesDB.getById(p.categoryId);
    const badgeLabel = { new: 'جديد', sale: 'تخفيض', sold_out: 'نفد' }[p.badge] || '-';
    
    return `
      <tr>
        <td>
          <img src="${p.images[0] || ''}" style="width:40px; height:50px; object-fit:cover; border-radius:4px; background:#f1f5f9;">
        </td>
        <td style="font-weight:600;">${p.name}</td>
        <td>${cat ? cat.name : '-'}</td>
        <td style="font-weight:700;">${NasmaDB.formatPrice(p.price)}</td>
        <td>تم بيع ${p.soldCount || 0} ويتبقى ${p.stock}</td>
        <td><span style="font-size:12px; font-weight:700;">${badgeLabel}</span></td>
        <td>
          <span class="badge-status" style="background:${p.active ? '#d1fae5; color:#10b981' : '#fee2e2; color:#ef4444'};">
            ${p.active ? 'نشط' : 'مخفي'}
          </span>
        </td>
        <td>
          <div class="action-row-btns">
            <button class="action-btn" onclick="openEditProductModal('${p.id}')">✏️</button>
            <button class="action-btn delete" onclick="deleteProduct('${p.id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function getBase64Size(base64String) {
  if (!base64String || typeof base64String !== 'string') return 0;
  if (!base64String.startsWith('data:')) {
    // Relative paths or external URLs
    return 0;
  }
  const stringLength = base64String.length - (base64String.indexOf(',') + 1);
  return (stringLength * 3) / 4;
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 بايت';
  if (!bytes || isNaN(bytes)) return 'غير معروف';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function openAddProductModal() {
  document.getElementById('product-modal-title').textContent = 'إضافة منتج جديد';
  document.getElementById('product-id-field').value = '';
  document.getElementById('product-form').reset();
  
  uploadedProductImages = [null, null];
  uploadedProductImagesSizes = [null, null];
  renderProductImages();

  fillCategorySelect();
  document.getElementById('product-modal-overlay').classList.add('open');
}

function openEditProductModal(productId) {
  const p = NasmaDB.ProductsDB.getById(productId);
  if (!p) return;

  document.getElementById('product-modal-title').textContent = 'تعديل المنتج';
  document.getElementById('product-id-field').value = p.id;
  document.getElementById('prod-name-input').value = p.name;
  document.getElementById('prod-stock-input').value = p.stock;
  document.getElementById('prod-price-input').value = p.price;
  document.getElementById('prod-price-old-input').value = p.priceOld || '';
  document.getElementById('prod-badge-select').value = p.badge || '';
  document.getElementById('prod-sku-input').value = p.sku || '';
  document.getElementById('prod-rating-input').value = p.rating !== undefined ? p.rating : 5;
  document.getElementById('prod-reviews-input').value = p.reviewCount !== undefined ? p.reviewCount : 0;
  document.getElementById('prod-sizes-input').value = (p.sizes || []).join(', ');
  document.getElementById('prod-colors-input').value = (p.colors || []).join(', ');
  document.getElementById('prod-desc-input').value = p.description;

  fillCategorySelect(p.categoryId);

  // تعيين الصور الحالية
  uploadedProductImages = p.images && p.images.length ? [...p.images] : [null, null];
  uploadedProductImagesSizes = uploadedProductImages.map(img => {
    if (!img) return null;
    const size = getBase64Size(img);
    return { original: null, compressed: size };
  });
  renderProductImages();

  document.getElementById('product-modal-overlay').classList.add('open');
}


function fillCategorySelect(selectedId = '') {
  const cats = NasmaDB.CategoriesDB.getAll();
  const select = document.getElementById('prod-category-select');
  select.innerHTML = cats.map(c => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.name}</option>`).join('');
}

function closeProductModal() {
  document.getElementById('product-modal-overlay').classList.remove('open');
}

function renderProductImages() {
  const container = document.getElementById('product-images-container');
  if (!container) return;

  container.innerHTML = uploadedProductImages.map((img, i) => {
    const sizes = uploadedProductImagesSizes && uploadedProductImagesSizes[i];
    let sizeInfoHTML = '';
    if (img && sizes) {
      const origText = sizes.original ? formatBytes(sizes.original) : 'غير معروف';
      const compText = sizes.compressed ? formatBytes(sizes.compressed) : 'غير معروف';
      let ratioText = '';
      if (sizes.skipped) {
        ratioText = `<span style="color:#3b82f6; font-weight:bold; display:block; font-size:10px;">جودة أصلية (أقل من 300KB) 📁</span>`;
      } else if (sizes.original && sizes.compressed) {
        const pct = Math.round((1 - (sizes.compressed / sizes.original)) * 100);
        if (pct > 0) {
          ratioText = `<span style="color:#10b981; font-weight:bold; display:block; font-size:10px;">وفرنا ${pct}% 🚀</span>`;
        }
      }
      sizeInfoHTML = `
        <div style="font-size:10px; color:#64748b; text-align:center; line-height:1.3; margin-top:4px; max-width:120px; word-wrap:break-word;">
          <div style="color:#ef4444;">قبل: ${origText}</div>
          <div style="color:#10b981; font-weight:700;">بعد: ${compText}</div>
          ${ratioText}
        </div>
      `;
    } else if (img) {
      const size = getBase64Size(img);
      const sizeText = size > 0 ? formatBytes(size) : 'رابط خارجي';
      sizeInfoHTML = `
        <div style="font-size:10px; color:#64748b; text-align:center; line-height:1.3; margin-top:4px; max-width:120px;">
          <div style="font-weight:700; color:#10b981;">الحجم: ${sizeText}</div>
        </div>
      `;
    }

    return `
      <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
        <div class="product-thumb-preview" style="margin-bottom:0; width:120px; height:120px; position:relative; flex-shrink:0;">
          <input type="file" accept="image/*" style="position:absolute; inset:0; opacity:0; cursor:pointer; z-index:5;" onchange="handleImageUpload(event, ${i})">
          ${img ? 
            `<img src="${img}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">
             <button type="button" onclick="removeProductImage(${i})" style="position:absolute; top:-8px; left:-8px; width:22px; height:22px; border-radius:50%; background:#ef4444; color:#fff; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.2); z-index:10;">×</button>` :
            `<div style="text-align:center; font-size:12px; color:#64748b; padding:10px; pointer-events:none;">الصورة ${i + 1}<br><span style="font-size:10px; color:#94a3b8;">اضغط لرفع</span></div>`
          }
        </div>
        ${sizeInfoHTML}
      </div>
    `;
  }).join('');
}

function addNewImageField() {
  uploadedProductImages.push(null);
  if (!uploadedProductImagesSizes) uploadedProductImagesSizes = [];
  uploadedProductImagesSizes.push(null);
  renderProductImages();
}

function removeProductImage(index) {
  uploadedProductImages.splice(index, 1);
  if (uploadedProductImagesSizes) {
    uploadedProductImagesSizes.splice(index, 1);
  }
  if (uploadedProductImages.length === 0) {
    uploadedProductImages.push(null);
    if (uploadedProductImagesSizes) {
      uploadedProductImagesSizes.push(null);
    }
  }
  renderProductImages();
}

function compressImageToWebP(dataUrl, maxWidth, maxHeight, quality, callback) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    let compressedDataUrl = canvas.toDataURL('image/webp', quality);
    
    if (!compressedDataUrl.startsWith('data:image/webp')) {
      compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    
    callback(compressedDataUrl);
  };
  img.onerror = () => {
    callback(dataUrl);
  };
  img.src = dataUrl;
}

function handleImageUpload(event, index) {
  const file = event.target.files[0];
  if (!file) return;

  const originalSize = file.size;
  const reader = new FileReader();
  reader.onload = (e) => {
    if (originalSize < 300 * 1024) {
      uploadedProductImages[index] = e.target.result;
      if (!uploadedProductImagesSizes) uploadedProductImagesSizes = [];
      uploadedProductImagesSizes[index] = { original: originalSize, compressed: originalSize, skipped: true };
      renderProductImages();
    } else {
      compressImageToWebP(e.target.result, 800, 800, 0.85, (compressed) => {
        const compressedSize = getBase64Size(compressed);
        uploadedProductImages[index] = compressed;
        if (!uploadedProductImagesSizes) uploadedProductImagesSizes = [];
        uploadedProductImagesSizes[index] = { original: originalSize, compressed: compressedSize, skipped: false };
        renderProductImages();
      });
    }
  };
  reader.readAsDataURL(file);
}


function handleProductFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('product-id-field').value;
  const name = document.getElementById('prod-name-input').value.trim();
  const categoryId = document.getElementById('prod-category-select').value;
  const stock = parseInt(document.getElementById('prod-stock-input').value);
  const price = parseFloat(document.getElementById('prod-price-input').value);
  const priceOld = parseFloat(document.getElementById('prod-price-old-input').value) || 0;
  const badge = document.getElementById('prod-badge-select').value;
  const sku = document.getElementById('prod-sku-input').value.trim();
  const rating = parseFloat(document.getElementById('prod-rating-input').value) || 5;
  const reviewCount = parseInt(document.getElementById('prod-reviews-input').value) || 0;
  
  const sizes = document.getElementById('prod-sizes-input').value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const colors = document.getElementById('prod-colors-input').value
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);

  const description = document.getElementById('prod-desc-input').value.trim();

  // تصفية الصور المستبعدة أو الفارغة
  const images = uploadedProductImages.filter(Boolean);

  const productData = {
    name,
    categoryId,
    stock,
    price,
    priceOld,
    badge,
    sku,
    sizes,
    colors,
    description,
    images,
    rating,
    reviewCount
  };

  if (id) {
    NasmaDB.ProductsDB.update(id, productData);
  } else {
    NasmaDB.ProductsDB.add(productData);
  }

  closeProductModal();
  loadProductsList();
}

function deleteProduct(id) {
  if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
    NasmaDB.ProductsDB.delete(id);
    loadProductsList();
  }
}

/* ===========================================
   4. إدارة التصنيفات
   =========================================== */
function loadCategoriesList() {
  const cats = NasmaDB.CategoriesDB.getAll();
  const tbody = document.getElementById('admin-categories-list');

  if (!cats.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:2rem;">لا توجد تصنيفات حالياً</td></tr>`;
    return;
  }

  tbody.innerHTML = cats.map(c => `
    <tr>
      <td style="font-size:24px;">${c.icon}</td>
      <td style="font-weight:700;">${c.name}</td>
      <td>${c.slug}</td>
      <td>${NasmaDB.formatDate(c.createdAt)}</td>
      <td>
        <div class="action-row-btns">
          <button class="action-btn" onclick="openEditCategoryModal('${c.id}')">✏️</button>
          <button class="action-btn delete" onclick="deleteCategory('${c.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddCategoryModal() {
  document.getElementById('category-modal-title').textContent = 'إضافة تصنيف جديد';
  document.getElementById('category-id-field').value = '';
  document.getElementById('category-form').reset();
  document.getElementById('cat-icon-input').value = '🧥';
  document.getElementById('cat-icon-preview').textContent = '🧥';
  const panel = document.getElementById('emoji-picker-panel');
  if (panel) panel.style.display = 'none';
  document.getElementById('category-modal-overlay').classList.add('open');
}

function openEditCategoryModal(catId) {
  const c = NasmaDB.CategoriesDB.getById(catId);
  if (!c) return;

  document.getElementById('category-modal-title').textContent = 'تعديل التصنيف';
  document.getElementById('category-id-field').value = c.id;
  document.getElementById('cat-name-input').value = c.name;
  document.getElementById('cat-icon-input').value = c.icon;
  document.getElementById('cat-icon-preview').textContent = c.icon || '🧥';
  const panel = document.getElementById('emoji-picker-panel');
  if (panel) panel.style.display = 'none';
  document.getElementById('category-modal-overlay').classList.add('open');
}

function closeCategoryModal() {
  document.getElementById('category-modal-overlay').classList.remove('open');
  const panel = document.getElementById('emoji-picker-panel');
  if (panel) panel.style.display = 'none';
}

function toggleEmojiPicker() {
  const panel = document.getElementById('emoji-picker-panel');
  if (!panel) return;
  if (panel.style.display === 'none' || panel.style.display === '') {
    panel.style.display = 'block';
  } else {
    panel.style.display = 'none';
  }
}

function pickEmoji(element) {
  const emoji = element.textContent;
  document.getElementById('cat-icon-input').value = emoji;
  document.getElementById('cat-icon-preview').textContent = emoji;
  const panel = document.getElementById('emoji-picker-panel');
  if (panel) panel.style.display = 'none';
}

// إغلاق لوحة الإيموجي عند النقر خارجها
document.addEventListener('click', function(e) {
  const panel = document.getElementById('emoji-picker-panel');
  if (!panel || panel.style.display !== 'block') return;
  
  const btn = document.querySelector('button[onclick="toggleEmojiPicker()"]');
  if (!panel.contains(e.target) && e.target !== btn && (!btn || !btn.contains(e.target))) {
    panel.style.display = 'none';
  }
});

function handleCategoryFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('category-id-field').value;
  const name = document.getElementById('cat-name-input').value.trim();
  const icon = document.getElementById('cat-icon-input').value.trim();

  if (id) {
    NasmaDB.CategoriesDB.update(id, { name, icon, slug: NasmaDB.slugify(name) });
  } else {
    NasmaDB.CategoriesDB.add({ name, icon });
  }

  closeCategoryModal();
  loadCategoriesList();
}

function deleteCategory(id) {
  if (confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
    NasmaDB.CategoriesDB.delete(id);
    loadCategoriesList();
  }
}

/* ===========================================
   5. إدارة الكوبونات
   =========================================== */
let editingCouponId = null;

function populateCouponCategories() {
  const select = document.getElementById('coupon-category-field');
  if (!select) return;
  let categories = NasmaDB.CategoriesDB.getAll();
  if (!Array.isArray(categories)) categories = [];
  select.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function populateCouponProducts() {
  const wrapper = document.getElementById('coupon-products-list-wrapper');
  if (!wrapper) return;
  let products = NasmaDB.ProductsDB.getAll();
  if (!Array.isArray(products)) products = [];
  wrapper.innerHTML = products.map(p => `
    <label style="display:flex; align-items:center; gap:8px; font-size:12px; cursor:pointer;">
      <input type="checkbox" name="coupon-product-checkbox" value="${p.id}">
      <span>${p.name}</span>
    </label>
  `).join('');
}

function toggleCouponRestrictionsUI() {
  const selectEl = document.getElementById('coupon-restricted-to-field');
  if (!selectEl) return;
  const val = selectEl.value;
  const catPanel = document.getElementById('coupon-category-panel');
  const prodPanel = document.getElementById('coupon-products-panel');

  if (catPanel) catPanel.style.display = (val === 'category') ? 'block' : 'none';
  if (prodPanel) prodPanel.style.display = (val === 'products') ? 'block' : 'none';
}

function loadCouponsList() {
  let coupons = NasmaDB.CouponsDB.getAll();
  if (!Array.isArray(coupons)) coupons = [];
  const tbody = document.getElementById('admin-coupons-list');
  if (!tbody) return;

  if (!coupons.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#94a3b8; padding:2rem;">لا توجد كوبونات خصم حالياً</td></tr>`;
    return;
  }

  tbody.innerHTML = coupons.map(c => {
    let restrictionText = 'شامل لجميع المنتجات';
    if (c.restrictedTo === 'category') {
      const cat = NasmaDB.CategoriesDB.getById(c.categoryId);
      restrictionText = `🗂️ تصنيف: (${cat ? cat.name : c.categoryId})`;
    } else if (c.restrictedTo === 'products') {
      restrictionText = `👗 منتجات محددة (${c.productIds ? c.productIds.length : 0})`;
    }

    return `
      <tr>
        <td style="font-weight:700;">${c.code}</td>
        <td>${c.type === 'percent' ? 'نسبة مئوية' : 'مبلغ ثابت'}</td>
        <td style="font-weight:700;">${c.type === 'percent' ? `${c.value}%` : NasmaDB.formatPrice(c.value)}</td>
        <td>${NasmaDB.formatPrice(c.minOrder)}</td>
        <td style="font-size: 12px; color: #475569;">${restrictionText}</td>
        <td>
          <span class="badge-status" style="background:${c.freeShipping ? '#e0f2fe; color:#0ea5e9;' : '#f1f5f9; color:#64748b;'};">
            ${c.freeShipping ? 'نعم 🚚' : 'لا'}
          </span>
        </td>
        <td>${c.usedCount}</td>
        <td>
          <span class="badge-status" style="background:${c.active ? '#d1fae5; color:#10b981' : '#fee2e2; color:#ef4444'};">
            ${c.active ? 'نشط' : 'معطل'}
          </span>
        </td>
        <td>
          <div class="action-row-btns">
            <button class="action-btn" onclick="openEditCouponModal('${c.id}')" title="تعديل">✏️</button>
            <button class="action-btn" onclick="toggleCoupon('${c.id}')">${c.active ? 'تعطيل' : 'تفعيل'}</button>
            <button class="action-btn delete" onclick="deleteCoupon('${c.id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddCouponModal() {
  try {
    editingCouponId = null;
    const titleEl = document.getElementById('coupon-modal-title');
    if (titleEl) titleEl.textContent = 'إضافة كوبون جديد';
    
    const formEl = document.getElementById('coupon-form');
    if (formEl) formEl.reset();
    
    populateCouponCategories();
    populateCouponProducts();
    toggleCouponRestrictionsUI();

    const cb = document.getElementById('coupon-free-shipping-field');
    if (cb) cb.checked = false;
    
    const toggleEl = document.getElementById('toggle-coupon-free-shipping');
    if (toggleEl) applyToggleUI(toggleEl, false);
    
    const overlayEl = document.getElementById('coupon-modal-overlay');
    if (overlayEl) {
      overlayEl.classList.add('open');
    } else {
      console.error('coupon-modal-overlay element not found!');
      alert('عنصر coupon-modal-overlay غير موجود في الصفحة!');
    }
  } catch (error) {
    console.error('Error in openAddCouponModal:', error);
    alert('حدث خطأ أثناء فتح نافذة الكوبون: ' + error.message);
  }
}

function openEditCouponModal(id) {
  try {
    const coupons = NasmaDB.CouponsDB.getAll();
    const c = coupons.find(item => item.id === id);
    if (!c) {
      alert('الكوبون غير موجود!');
      return;
    }

    editingCouponId = id;
    const titleEl = document.getElementById('coupon-modal-title');
    if (titleEl) titleEl.textContent = `تعديل الكوبون: ${c.code}`;
    
    const codeEl = document.getElementById('coupon-code-field');
    if (codeEl) codeEl.value = c.code;
    
    const typeEl = document.getElementById('coupon-type-field');
    if (typeEl) typeEl.value = c.type;
    
    const valEl = document.getElementById('coupon-val-field');
    if (valEl) valEl.value = c.value;
    
    const minEl = document.getElementById('coupon-min-field');
    if (minEl) minEl.value = c.minOrder;
    
    const restrictEl = document.getElementById('coupon-restricted-to-field');
    if (restrictEl) restrictEl.value = c.restrictedTo || 'none';
    
    populateCouponCategories();
    const catEl = document.getElementById('coupon-category-field');
    if (catEl) catEl.value = c.categoryId || '';
    
    populateCouponProducts();
    if (c.productIds && c.productIds.length) {
      c.productIds.forEach(pId => {
        const cb = document.querySelector(`input[name="coupon-product-checkbox"][value="${pId}"]`);
        if (cb) cb.checked = true;
      });
    }
    
    toggleCouponRestrictionsUI();

    const cb = document.getElementById('coupon-free-shipping-field');
    if (cb) cb.checked = !!c.freeShipping;
    
    const toggleEl = document.getElementById('toggle-coupon-free-shipping');
    if (toggleEl && cb) applyToggleUI(toggleEl, cb.checked);
    
    const overlayEl = document.getElementById('coupon-modal-overlay');
    if (overlayEl) {
      overlayEl.classList.add('open');
    } else {
      console.error('coupon-modal-overlay element not found!');
      alert('عنصر coupon-modal-overlay غير موجود في الصفحة!');
    }
  } catch (error) {
    console.error('Error in openEditCouponModal:', error);
    alert('حدث خطأ أثناء فتح نافذة تعديل الكوبون: ' + error.message);
  }
}

function closeCouponModal() {
  document.getElementById('coupon-modal-overlay').classList.remove('open');
}

function handleCouponSubmit(e) {
  e.preventDefault();

  const code = document.getElementById('coupon-code-field').value.trim();
  const type = document.getElementById('coupon-type-field').value;
  const value = parseFloat(document.getElementById('coupon-val-field').value);
  const minOrder = parseFloat(document.getElementById('coupon-min-field').value) || 0;
  const freeShipping = document.getElementById('coupon-free-shipping-field').checked;

  const restrictedTo = document.getElementById('coupon-restricted-to-field').value;
  const categoryId = document.getElementById('coupon-category-field').value;
  const checkedProds = document.querySelectorAll('input[name="coupon-product-checkbox"]:checked');
  const productIds = Array.from(checkedProds).map(cb => cb.value);

  const couponData = { code, type, value, minOrder, freeShipping, restrictedTo, categoryId, productIds };

  if (editingCouponId) {
    NasmaDB.CouponsDB.update(editingCouponId, couponData);
    // إذا كان الكوبون المطبق حالياً في جلسة العميل هو هذا الكوبون، نقوم بحذفه لضمان إعادة التحقق بشروطه الجديدة
    sessionStorage.removeItem('nasma_applied_coupon');
  } else {
    NasmaDB.CouponsDB.add(couponData);
  }

  closeCouponModal();
  loadCouponsList();
}

function toggleCoupon(id) {
  NasmaDB.CouponsDB.toggle(id);
  loadCouponsList();
}

function deleteCoupon(id) {
  if (confirm('هل أنت متأكد من حذف هذا الكوبون؟')) {
    NasmaDB.CouponsDB.delete(id);
    loadCouponsList();
  }
}

/* ===========================================
   مساعد: Toggle Checkbox بمظهر Switch
   =========================================== */
function toggleBannerCheckbox(checkboxId, uiId) {
  const cb = document.getElementById(checkboxId);
  const ui = document.getElementById(uiId);
  cb.checked = !cb.checked;
  applyToggleUI(ui, cb.checked);
}

function applyToggleUI(uiEl, isOn) {
  const knob = uiEl.querySelector('span');
  if (isOn) {
    uiEl.style.background = 'var(--color-primary, #C4A882)';
    knob.style.transform = 'translateX(-20px)';
  } else {
    uiEl.style.background = '#cbd5e1';
    knob.style.transform = 'translateX(0)';
  }
}

/* ===========================================
   5. إدارة أسعار الشحن
   =========================================== */
function loadShippingList() {
  const list = NasmaDB.ShippingDB.getAll();
  const tbody = document.getElementById('admin-shipping-list');
  
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8; padding:2rem;">لا توجد محافظات مسجلة</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td style="font-weight: 700;">${c.name}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 5px;">
          <input type="number" value="${c.cost}" id="ship-cost-${c.name}" class="checkout-input" style="width: 100px; height: 36px; text-align: center; padding: 4px; border: 1.5px solid #cbd5e1; border-radius: 6px;" min="0">
          <span style="font-weight: 600;">ج.م</span>
        </div>
      </td>
      <td>
        <button class="btn btn-primary" style="padding: 6px 14px; font-size: 13px; height: 36px; display: inline-flex; align-items: center; justify-content: center;" onclick="saveShippingCost('${c.name}')">حفظ 💾</button>
      </td>
    </tr>
  `).join('');
}

function saveShippingCost(cityName) {
  const inputEl = document.getElementById(`ship-cost-${cityName}`);
  if (!inputEl) return;
  const cost = parseFloat(inputEl.value);
  if (isNaN(cost) || cost < 0) {
    alert('الرجاء إدخال قيمة صحيحة للشحن.');
    return;
  }
  
  if (NasmaDB.ShippingDB.updateCost(cityName, cost)) {
    alert(`تم تحديث تكلفة الشحن لمحافظة ${cityName} إلى ${cost} ج.م`);
    loadShippingList();
  } else {
    alert('حدث خطأ أثناء حفظ التعديل.');
  }
}

/* ===========================================
   6. الإعدادات العامة والتصميم
   =========================================== */
let uploadedStoreLogo = null;
let uploadedHeroImage = null;

function loadStoreSettingsForm() {
  const settings = NasmaDB.SettingsDB.get();
  
  document.getElementById('setting-store-title').value = settings.storeName;
  document.getElementById('setting-store-desc').value = settings.storeDesc || '';
  document.getElementById('setting-store-phone').value = settings.storePhone || '';
  document.getElementById('setting-store-email').value = settings.storeEmail || '';
  document.getElementById('setting-free-shipping-min').value = settings.freeShippingMin || 200;
  document.getElementById('setting-announcement').value = settings.announcementBar || '';

  // ── وسائل التواصل الاجتماعي ──
  document.getElementById('setting-whatsapp').value = settings.whatsapp || '';
  document.getElementById('setting-instagram').value = settings.instagram || '';
  document.getElementById('setting-tiktok').value = settings.tiktok || '';
  document.getElementById('setting-snapchat').value = settings.snapchat || '';
  document.getElementById('setting-facebook').value = settings.facebook || '';

  // ── نصوص البانر الرئيسي ──
  document.getElementById('setting-hero-badge').value = settings.heroBadge || '';
  document.getElementById('setting-hero-title').value = settings.heroTitle || '';
  document.getElementById('setting-hero-desc').value = settings.heroDesc || '';

  // ── الألوان ──
  document.getElementById('setting-color-primary').value = settings.colorPrimary || '#C4A882';
  document.getElementById('setting-color-primary-hex').value = settings.colorPrimary || '#C4A882';
  
  document.getElementById('setting-color-secondary').value = settings.colorSecondary || '#E8D5B0';
  document.getElementById('setting-color-secondary-hex').value = settings.colorSecondary || '#E8D5B0';

  document.getElementById('setting-color-bg').value = settings.colorBg || '#FAF8F5';
  document.getElementById('setting-color-bg-hex').value = settings.colorBg || '#FAF8F5';

  document.getElementById('setting-color-text').value = settings.colorText || '#2C2C2C';
  document.getElementById('setting-color-text-hex').value = settings.colorText || '#2C2C2C';

  // ── الخطوط ──
  document.getElementById('setting-font-primary').value = settings.fontPrimary || 'Tajawal';
  document.getElementById('setting-font-display').value = settings.fontDisplay || 'Amiri';

  // ── الشعار ──
  if (settings.logoDataUrl) {
    uploadedStoreLogo = settings.logoDataUrl;
    showAdminLogoPreview(settings.logoDataUrl);
  } else {
    uploadedStoreLogo = null;
    hideAdminLogoPreview();
  }

  // ── البانر الرئيسي ──
  if (settings.heroImageDataUrl) {
    uploadedHeroImage = settings.heroImageDataUrl;
    showAdminHeroPreview(settings.heroImageDataUrl);
  } else {
    uploadedHeroImage = null;
    hideAdminHeroPreview();
  }

  // ── بانر شريط الإعلان العلوي ──
  const announcementEnabled = settings.announcementBarEnabled !== false; // افتراضي: مفعّل
  const cbAnn = document.getElementById('setting-announcement-enabled');
  cbAnn.checked = announcementEnabled;
  applyToggleUI(document.getElementById('toggle-announcement-ui'), announcementEnabled);

  // ── البنر الترويجي ──
  const promoEnabled = settings.promoBannerEnabled !== false;
  const cbPromo = document.getElementById('setting-promo-enabled');
  cbPromo.checked = promoEnabled;
  applyToggleUI(document.getElementById('toggle-promo-ui'), promoEnabled);

  document.getElementById('setting-promo-label').value    = settings.promoLabel    || '✦ عرض محدود';
  document.getElementById('setting-promo-title').value    = settings.promoTitle    || 'نهاية الموسم\nبأسعار لا تُصدَّق';
  document.getElementById('setting-promo-desc').value     = settings.promoDesc     || '';
  document.getElementById('setting-promo-discount').value = settings.promoDiscount || '40';
  document.getElementById('setting-promo-btn-text').value = settings.promoBtnText  || 'تسوقي العروض';
  document.getElementById('setting-promo-btn-link').value = settings.promoBtnLink  || 'products.html';

  // ── النشرة البريدية ──
  const newsletterEnabled = settings.newsletterEnabled !== false;
  const cbNewsletter = document.getElementById('setting-newsletter-enabled');
  cbNewsletter.checked = newsletterEnabled;
  applyToggleUI(document.getElementById('toggle-newsletter-ui'), newsletterEnabled);

  document.getElementById('setting-newsletter-title').value = settings.newsletterTitle || 'كوني أول من يعلم';
  document.getElementById('setting-newsletter-desc').value  = settings.newsletterDesc  || '';

  // ── بيانات الدخول للوحة التحكم ──
  document.getElementById('setting-admin-user').value = NasmaDB.AdminAuth.getUser();
  document.getElementById('setting-admin-pass-new').value = '';
  document.getElementById('setting-admin-pass-confirm').value = '';
  document.getElementById('setting-admin-settings-pass').value = '';
  document.getElementById('setting-admin-settings-pass-confirm').value = '';
}

function handleAdminLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    if (file.size < 300 * 1024) {
      uploadedStoreLogo = event.target.result;
      showAdminLogoPreview(event.target.result);
    } else {
      compressImageToWebP(event.target.result, 400, 400, 0.90, (compressed) => {
        uploadedStoreLogo = compressed;
        showAdminLogoPreview(compressed);
      });
    }
  };
  reader.readAsDataURL(file);
}

function showAdminLogoPreview(base64) {
  document.getElementById('admin-logo-upload-content').style.display = 'none';
  const preview = document.getElementById('admin-logo-preview');
  preview.style.display = 'flex';
  document.getElementById('admin-logo-preview-img').src = base64;
}

function hideAdminLogoPreview() {
  document.getElementById('admin-logo-upload-content').style.display = 'block';
  document.getElementById('admin-logo-preview').style.display = 'none';
  document.getElementById('setting-logo-file').value = '';
}

function removeAdminLogo() {
  uploadedStoreLogo = null;
  hideAdminLogoPreview();
}

function handleAdminHeroUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    if (file.size < 300 * 1024) {
      uploadedHeroImage = event.target.result;
      showAdminHeroPreview(event.target.result);
    } else {
      compressImageToWebP(event.target.result, 1200, 800, 0.88, (compressed) => {
        uploadedHeroImage = compressed;
        showAdminHeroPreview(compressed);
      });
    }
  };
  reader.readAsDataURL(file);
}

function showAdminHeroPreview(base64) {
  document.getElementById('admin-hero-upload-content').style.display = 'none';
  const preview = document.getElementById('admin-hero-preview');
  preview.style.display = 'flex';
  document.getElementById('admin-hero-preview-img').src = base64;
}

function hideAdminHeroPreview() {
  document.getElementById('admin-hero-upload-content').style.display = 'block';
  document.getElementById('admin-hero-preview').style.display = 'none';
  if (document.getElementById('setting-hero-file')) {
    document.getElementById('setting-hero-file').value = '';
  }
}

function removeAdminHero() {
  uploadedHeroImage = null;
  hideAdminHeroPreview();
}

function updateColorHex(pickerId, hexId) {
  const color = document.getElementById(pickerId).value;
  document.getElementById(hexId).value = color.toUpperCase();
}

function updateColorPicker(hexId, pickerId) {
  const hexVal = document.getElementById(hexId).value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(hexVal)) {
    document.getElementById(pickerId).value = hexVal;
  }
}

function saveStoreSettings(e) {
  e.preventDefault();

  const storeName      = document.getElementById('setting-store-title').value.trim();
  const storeDesc      = document.getElementById('setting-store-desc').value.trim();
  const storePhone     = document.getElementById('setting-store-phone').value.trim();
  const storeEmail     = document.getElementById('setting-store-email').value.trim();
  const freeShippingMin= parseFloat(document.getElementById('setting-free-shipping-min').value);
  const announcementBar= document.getElementById('setting-announcement').value.trim();

  // نصوص البانر الرئيسي
  const heroBadge      = document.getElementById('setting-hero-badge').value.trim();
  const heroTitle      = document.getElementById('setting-hero-title').value.trim();
  const heroDesc       = document.getElementById('setting-hero-desc').value.trim();

  const colorPrimary   = document.getElementById('setting-color-primary-hex').value.trim();
  const colorSecondary = document.getElementById('setting-color-secondary-hex').value.trim();
  const colorBg        = document.getElementById('setting-color-bg-hex').value.trim();
  const colorText      = document.getElementById('setting-color-text-hex').value.trim();

  const fontPrimary    = document.getElementById('setting-font-primary').value;
  const fontDisplay    = document.getElementById('setting-font-display').value;

  // ── البانرات ──
  const announcementBarEnabled = document.getElementById('setting-announcement-enabled').checked;
  const promoBannerEnabled     = document.getElementById('setting-promo-enabled').checked;
  const promoLabel             = document.getElementById('setting-promo-label').value.trim();
  const promoTitle             = document.getElementById('setting-promo-title').value.trim();
  const promoDesc              = document.getElementById('setting-promo-desc').value.trim();
  const promoDiscount          = document.getElementById('setting-promo-discount').value.trim();
  const promoBtnText           = document.getElementById('setting-promo-btn-text').value.trim();
  const promoBtnLink           = document.getElementById('setting-promo-btn-link').value.trim();
  const newsletterEnabled      = document.getElementById('setting-newsletter-enabled').checked;
  const newsletterTitle        = document.getElementById('setting-newsletter-title').value.trim();
  const newsletterDesc         = document.getElementById('setting-newsletter-desc').value.trim();

  const whatsapp       = document.getElementById('setting-whatsapp').value.trim();
  const instagram      = document.getElementById('setting-instagram').value.trim();
  const tiktok         = document.getElementById('setting-tiktok').value.trim();
  const snapchat       = document.getElementById('setting-snapchat').value.trim();
  const facebook       = document.getElementById('setting-facebook').value.trim();

  NasmaDB.SettingsDB.update({
    storeName, storeDesc, storePhone, storeEmail,
    freeShippingMin,
    announcementBar, announcementBarEnabled,
    colorPrimary, colorSecondary, colorBg, colorText,
    fontPrimary, fontDisplay,
    logoDataUrl: uploadedStoreLogo,
    heroImageDataUrl: uploadedHeroImage,
    // نصوص البانر الرئيسي
    heroBadge, heroTitle, heroDesc,
    // البانرات
    promoBannerEnabled, promoLabel, promoTitle, promoDesc,
    promoDiscount, promoBtnText, promoBtnLink,
    newsletterEnabled, newsletterTitle, newsletterDesc,
    // وسائل التواصل الاجتماعي
    whatsapp, instagram, tiktok, snapchat, facebook,
  });

  // تحديث لوحة التحكم فوراً بالألوان والخطوط الجديدة
  const settings = NasmaDB.SettingsDB.get();
  document.documentElement.style.setProperty('--color-primary', settings.colorPrimary);
  document.documentElement.style.setProperty('--color-secondary', settings.colorSecondary);

  alert('تم حفظ الإعدادات بنجاح وسيتم تطبيقها على كافة صفحات المتجر ✓');
}

function resetStoreSettingsToDefault() {
  if (confirm('هل أنتِ متأكدة من رغبتكِ في إعادة ضبط مظهر وإعدادات الموقع للمظهر الأصلي؟ سيتم استعادة الألوان والخطوط والشعارات والبانرات الافتراضية.')) {
    // حذف مفتاح الإعدادات من local storage ليعود للافتراضي الأصلي
    localStorage.removeItem('nasma_settings');
    
    alert('تم إعادة ضبط مظهر وإعدادات الموقع للمظهر الأصلي بنجاح!');
    
    // إعادة تحميل الصفحة لتطبيق الإعدادات الجديدة الافتراضية
    location.reload();
  }
}

/* ===========================================
   تعديل بيانات الدخول للوحة التحكم
   =========================================== */
function saveAdminAuthSettings(e) {
  e.preventDefault();

  const newUser             = document.getElementById('setting-admin-user').value.trim();
  const newPass             = document.getElementById('setting-admin-pass-new').value;
  const confirmPass         = document.getElementById('setting-admin-pass-confirm').value;
  const settingsPass        = document.getElementById('setting-admin-settings-pass').value;
  const settingsPassConfirm = document.getElementById('setting-admin-settings-pass-confirm').value;

  // التحقق من اسم المستخدم
  if (!newUser) {
    alert('⚠️ يرجى إدخال اسم المستخدم الجديد.');
    return;
  }

  // إذا أُدخلت كلمة مرور جديدة للوحة التحكم — التحقق من التطابق والطول
  if (newPass) {
    if (newPass.length < 6) {
      alert('⚠️ كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (newPass !== confirmPass) {
      alert('❌ كلمة المرور الجديدة وتأكيدها غير متطابقتين. يرجى المراجعة.');
      document.getElementById('setting-admin-pass-confirm').value = '';
      document.getElementById('setting-admin-pass-confirm').focus();
      return;
    }
    // تغيير كلمة المرور
    NasmaDB.AdminAuth.changePassword(newPass);
  }

  // إذا أُدخلت كلمة مرور إعدادات الموقع الجديدة — التحقق من التطابق والطول
  if (settingsPass) {
    if (settingsPass.length < 6) {
      alert('⚠️ كلمة مرور إعدادات الموقع الجديدة يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (settingsPass !== settingsPassConfirm) {
      alert('❌ كلمة مرور إعدادات الموقع وتأكيدها غير متطابقتين. يرجى المراجعة.');
      document.getElementById('setting-admin-settings-pass-confirm').value = '';
      document.getElementById('setting-admin-settings-pass-confirm').focus();
      return;
    }
    // تغيير كلمة مرور إعدادات الموقع
    NasmaDB.AdminAuth.changeSettingsPassword(settingsPass);
  }

  // تغيير اسم المستخدم
  NasmaDB.AdminAuth.setUser(newUser);

  // مسح الحقول الحساسة
  document.getElementById('setting-admin-pass-new').value = '';
  document.getElementById('setting-admin-pass-confirm').value = '';
  document.getElementById('setting-admin-settings-pass').value = '';
  document.getElementById('setting-admin-settings-pass-confirm').value = '';
  document.getElementById('setting-admin-user').value = newUser;

  alert(`✅ تم حفظ بيانات الدخول وإعدادات الاسترجاع بنجاح!\n\nاسم المستخدم: ${newUser}${newPass ? '\nكلمة المرور: تم تغييرها' : '\nكلمة المرور: لم تتغير'}${settingsPass ? '\nكلمة مرور إعدادات الموقع: تم تغييرها' : ''}`);
}

/* ===========================================
   استعادة بيانات الدخول للوحة التحكم
   =========================================== */
function openRecoveryModal(e) {
  if (e) e.preventDefault();
  document.getElementById('recovery-settings-pass').value = '';
  document.getElementById('recovery-new-user').value = '';
  document.getElementById('recovery-new-pass').value = '';
  document.getElementById('recovery-new-pass-confirm').value = '';
  document.getElementById('recovery-error-msg').style.display = 'none';
  document.getElementById('recovery-modal-overlay').classList.add('open');
}

function closeRecoveryModal() {
  document.getElementById('recovery-modal-overlay').classList.remove('open');
}

function handleRecoverySubmit(e) {
  e.preventDefault();
  const settingsPass = document.getElementById('recovery-settings-pass').value;
  const newUser = document.getElementById('recovery-new-user').value.trim();
  const newPass = document.getElementById('recovery-new-pass').value;
  const newPassConfirm = document.getElementById('recovery-new-pass-confirm').value;
  const errorEl = document.getElementById('recovery-error-msg');

  // التحقق من كلمة مرور إعدادات الموقع
  if (!NasmaDB.AdminAuth.verifySettingsPass(settingsPass)) {
    errorEl.textContent = '❌ كلمة مرور إعدادات الموقع غير صحيحة!';
    errorEl.style.display = 'block';
    return;
  }

  // التحقق من المدخلات الجديدة
  if (!newUser) {
    errorEl.textContent = '⚠️ يرجى إدخال اسم المستخدم الجديد.';
    errorEl.style.display = 'block';
    return;
  }
  if (newPass.length < 6) {
    errorEl.textContent = '⚠️ كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.';
    errorEl.style.display = 'block';
    return;
  }
  if (newPass !== newPassConfirm) {
    errorEl.textContent = '❌ كلمة المرور وتأكيدها غير متطابقتين.';
    errorEl.style.display = 'block';
    return;
  }

  // تحديث البيانات
  NasmaDB.AdminAuth.setUser(newUser);
  NasmaDB.AdminAuth.changePassword(newPass);

  alert('✅ تم تحديث بيانات الدخول للوحة التحكم بنجاح! يمكنك الآن تسجيل الدخول بالبيانات الجديدة.');
  closeRecoveryModal();

  // ملء المدخلات تلقائياً لتسهيل الدخول
  document.getElementById('admin-username').value = newUser;
  document.getElementById('admin-password').value = newPass;
}

/* ===========================================
   قسم صفحات الهبوط — Landing Pages Generator
   =========================================== */

function loadLandingPageTab() {
  const select = document.getElementById('lp-product-select');
  if (!select) return;
  const products = NasmaDB.ProductsDB.getActive();
  select.innerHTML = '<option value="">— اختر منتجاً —</option>';
  products.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    select.appendChild(opt);
  });
  
  // إعادة تعيين الحقول
  document.getElementById('lp-headline').value = '';
  document.getElementById('lp-subheadline').value = '';
  document.getElementById('lp-urgency').value = '';
  document.getElementById('lp-cta-btn').value = 'اطلبي الآن — الدفع عند الاستلام ✓';
  document.getElementById('lp-badge-text').value = '';
  document.getElementById('lp-features').value = '';
  document.getElementById('lp-testimonials').value = '';
  document.getElementById('lp-theme').value = 'gold';

  const box = document.getElementById('lp-product-preview-box');
  if (box) box.style.display = 'none';

  const linkSec = document.getElementById('lp-link-section');
  if (linkSec) linkSec.style.display = 'none';

  renderLandingPagesList();
}

function onLandingProductChange() {
  const pid = document.getElementById('lp-product-select').value;
  const box = document.getElementById('lp-product-preview-box');
  const linkSec = document.getElementById('lp-link-section');
  
  if (!pid) {
    if (box) box.style.display = 'none';
    if (linkSec) linkSec.style.display = 'none';
    return;
  }

  const p = NasmaDB.ProductsDB.getById(pid);
  if (!p) {
    if (box) box.style.display = 'none';
    if (linkSec) linkSec.style.display = 'none';
    return;
  }

  // عرض معاينة المنتج
  const previewImg = document.getElementById('lp-product-preview-img');
  if (p.images && p.images[0]) {
    previewImg.src = p.images[0];
    previewImg.style.display = 'block';
  } else {
    previewImg.style.display = 'none';
  }
  document.getElementById('lp-product-preview-name').textContent = p.name;
  document.getElementById('lp-product-preview-price').textContent = NasmaDB.formatPrice(p.price);
  if (box) box.style.display = 'flex';

  // جلب الإعدادات المخزنة إن وجدت
  const savedConfig = NasmaDB.LandingPagesDB.getByProductId(pid);
  if (savedConfig) {
    document.getElementById('lp-headline').value = savedConfig.headline || p.name;
    document.getElementById('lp-subheadline').value = savedConfig.subheadline || 'جودة فاخرة | شحن آمن لجميع المناطق | الدفع عند الاستلام';
    document.getElementById('lp-urgency').value = savedConfig.urgency || '';
    document.getElementById('lp-cta-btn').value = savedConfig.ctaBtn || 'اطلبي الآن — الدفع عند الاستلام ✓';
    document.getElementById('lp-badge-text').value = savedConfig.badgeText || '';
    document.getElementById('lp-features').value = (savedConfig.features || []).join('\n');
    document.getElementById('lp-testimonials').value = (savedConfig.testimonials || []).join('\n');
    document.getElementById('lp-theme').value = savedConfig.theme || 'gold';

    if (savedConfig.active) {
      const baseUrl = getStoreBaseUrl();
      const url = `${baseUrl}/landing.html?pid=${pid}`;
      document.getElementById('lp-link-display').value = url;
      if (linkSec) linkSec.style.display = 'block';
    } else {
      if (linkSec) linkSec.style.display = 'none';
    }
  } else {
    // ملء قيم افتراضية ذكية للمنتج الجديد
    document.getElementById('lp-headline').value = p.name;
    document.getElementById('lp-subheadline').value = 'جودة فاخرة | شحن آمن لجميع المناطق | الدفع عند الاستلام';
    document.getElementById('lp-urgency').value = '⚡ عرض لفترة محدودة — اطلبي الآن قبل نفاد المخزون!';
    document.getElementById('lp-cta-btn').value = 'اطلبي الآن — الدفع عند الاستلام ✓';
    document.getElementById('lp-badge-text').value = '✦ الأكثر مبيعاً';
    document.getElementById('lp-features').value = 'خامة فاخرة ذات جودة استثنائية\nتصميم عصري وفريد يناسب كل الأوقات\nتوصيل سريع لباب المنزل\nإمكانية المعاينة قبل الدفع';
    document.getElementById('lp-testimonials').value = 'فاطمة | العباية روعة روعة والخامة ممتازة جداً\nأميرة | الشنطة تجنن ووصلت مغلفة بشكل فاخر\nسارة | خدمة ممتازة وسريعة، والطلب وصل تاني يوم';
    document.getElementById('lp-theme').value = 'gold';
    if (linkSec) linkSec.style.display = 'none';
  }
}

function saveLandingPage() {
  const pid = document.getElementById('lp-product-select').value;
  if (!pid) { alert('⚠️ يرجى اختيار منتج أولاً.'); return; }

  const config = {
    headline:     document.getElementById('lp-headline').value.trim(),
    subheadline:  document.getElementById('lp-subheadline').value.trim(),
    urgency:      document.getElementById('lp-urgency').value.trim(),
    ctaBtn:       document.getElementById('lp-cta-btn').value.trim(),
    badgeText:    document.getElementById('lp-badge-text').value.trim(),
    features:     document.getElementById('lp-features').value.trim().split('\n').map(s=>s.trim()).filter(Boolean),
    testimonials: document.getElementById('lp-testimonials').value.trim().split('\n').map(s=>s.trim()).filter(Boolean),
    theme:        document.getElementById('lp-theme').value || 'gold',
    active:       true // التفعيل تلقائياً عند الحفظ
  };

  NasmaDB.LandingPagesDB.set(pid, config);
  
  // عرض الرابط المتولد
  const baseUrl = getStoreBaseUrl();
  const url = `${baseUrl}/landing.html?pid=${pid}`;
  document.getElementById('lp-link-display').value = url;
  document.getElementById('lp-link-section').style.display = 'block';

  alert('🚀 تم حفظ وتفعيل صفحة الهبوط للمنتج بنجاح!');
  renderLandingPagesList();
}

function copyLandingLink() {
  const input = document.getElementById('lp-link-display');
  if (!input || !input.value) return;
  navigator.clipboard.writeText(input.value).then(() => {
    const btn = document.getElementById('lp-copy-btn');
    const originalText = btn.textContent;
    btn.textContent = '✓ تم النسخ';
    btn.style.background = '#15803d';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 2000);
  });
}

function copyLandingPageUrl(productId) {
  const baseUrl = getStoreBaseUrl();
  const url = `${baseUrl}/landing.html?pid=${productId}`;
  navigator.clipboard.writeText(url).then(() => {
    alert('📋 تم نسخ رابط صفحة الهبوط إلى الحافظة!');
  });
}

function shareLandingPage(platform) {
  const input = document.getElementById('lp-link-display');
  if (!input || !input.value) return;
  shareProductLandingLink(input.value, platform);
}

function shareProductLanding(productId, platform) {
  const baseUrl = getStoreBaseUrl();
  const url = `${baseUrl}/landing.html?pid=${productId}`;
  shareProductLandingLink(url, platform);
}

function shareProductLandingLink(url, platform) {
  const message = `شاهدي هذا العرض الرائع من متجرنا المميز: ${url}`;
  
  if (platform === 'whatsapp') {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  } else if (platform === 'copy-instagram') {
    navigator.clipboard.writeText(`رابط المنتج في البايو: ${url}`).then(() => {
      alert('📋 تم نسخ النص المنسق لإنستقرام! يمكنك الآن لصقه في المنشور أو القصة.');
    });
  } else if (platform === 'copy-tiktok') {
    navigator.clipboard.writeText(`احصلي عليه الآن من هنا: ${url}`).then(() => {
      alert('📋 تم نسخ النص المنسق لتيك توك! يمكنك الآن لصقه في وصف الفيديو أو البايو.');
    });
  } else if (platform === 'copy-snap') {
    navigator.clipboard.writeText(url).then(() => {
      alert('📋 تم نسخ الرابط! يمكنك الآن إضافته كملصق رابط في قصة سناب شات.');
    });
  }
}

function toggleLandingPage(productId) {
  const active = NasmaDB.LandingPagesDB.toggle(productId);
  renderLandingPagesList();
  
  // إذا كان هذا هو المنتج المختار حالياً، قم بتحديث منطقة الرابط
  const currentPid = document.getElementById('lp-product-select').value;
  if (currentPid === productId) {
    const linkSec = document.getElementById('lp-link-section');
    if (active) {
      const baseUrl = getStoreBaseUrl();
      const url = `${baseUrl}/landing.html?pid=${productId}`;
      document.getElementById('lp-link-display').value = url;
      if (linkSec) linkSec.style.display = 'block';
    } else {
      if (linkSec) linkSec.style.display = 'none';
    }
  }
}

function editLandingPage(productId) {
  const select = document.getElementById('lp-product-select');
  if (select) {
    select.value = productId;
    onLandingProductChange();
    // تمرير الشاشة للنموذج بسلاسة
    document.getElementById('admin-section-landingpages').scrollIntoView({ behavior: 'smooth' });
  }
}

function deleteLandingPage(productId) {
  if (confirm('⚠️ هل أنت متأكد من رغبتك في حذف صفحة الهبوط هذه وإيقافها؟')) {
    NasmaDB.LandingPagesDB.delete(productId);
    
    // إذا كان هذا هو المنتج المختار حالياً، أعد تهيئة الواجهة
    const currentPid = document.getElementById('lp-product-select').value;
    if (currentPid === productId) {
      loadLandingPageTab();
    } else {
      renderLandingPagesList();
    }
  }
}

function renderLandingPagesList() {
  const container = document.getElementById('lp-pages-list');
  const countEl = document.getElementById('lp-pages-count');
  if (!container) return;

  const pages = NasmaDB.LandingPagesDB.getAll();
  const pageIds = Object.keys(pages);

  if (countEl) countEl.textContent = `(${pageIds.length})`;

  if (pageIds.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px; color:#94a3b8;">
        <div style="font-size:40px; margin-bottom:12px;">🚀</div>
        <p style="font-size:14px;">لم يتم إنشاء أي صفحة هبوط بعد.<br>اختر منتجاً من الأعلى واضغط "حفظ وتفعيل".</p>
      </div>
    `;
    return;
  }

  let html = `
    <div style="overflow-x:auto;">
      <table class="admin-table">
        <thead>
          <tr>
            <th>المنتج</th>
            <th>الحالة</th>
            <th>المشاهدات</th>
            <th>الرابط والإجراءات</th>
          </tr>
        </thead>
        <tbody>
  `;

  pageIds.forEach(id => {
    const page = pages[id];
    const p = NasmaDB.ProductsDB.getById(id);
    const productName = p ? p.name : 'منتج محذوف';
    const productImg = (p && p.images && p.images[0]) ? p.images[0] : '';
    
    const statusText = page.active ? 'مفعّلة' : 'معطّلة';
    const statusClass = page.active ? 'badge-delivered' : 'badge-cancelled'; // استخدام كلاسات الألوان الموجودة مسبقاً
    const toggleText = page.active ? 'تعطيل' : 'تفعيل';
    const toggleBtnStyle = page.active ? 'color: #ef4444; border-color: #fecaca; background: #fef2f2;' : 'color: #10b981; border-color: #a7f3d0; background: #ecfdf5;';

    html += `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            ${productImg ? `<img src="${productImg}" style="width:40px; height:40px; object-fit:cover; border-radius:6px; border:1px solid #e2e8f0;">` : '<div style="width:40px; height:40px; background:#f1f5f9; border-radius:6px; display:flex; align-items:center; justify-content:center;">🛍️</div>'}
            <span style="font-weight:700;">${productName}</span>
          </div>
        </td>
        <td>
          <span class="badge-status" style="background:${page.active ? '#d1fae5; color:#10b981' : '#fee2e2; color:#ef4444'};">
            ${statusText}
          </span>
        </td>
        <td>
          <strong style="font-size:14px; color:#475569;">👁️ ${page.views || 0}</strong>
        </td>
        <td>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            <button class="action-btn" onclick="toggleLandingPage('${id}')" style="font-size:11px; padding:4px 8px; border-radius:6px; font-weight:700; ${toggleBtnStyle}">
              ${toggleText}
            </button>
            <button class="action-btn" onclick="editLandingPage('${id}')" style="font-size:11px; padding:4px 8px; border-radius:6px; font-weight:700; color:#3b82f6; border-color:#bfdbfe; background:#eff6ff;">
              تعديل
            </button>
            <button class="action-btn" onclick="copyLandingPageUrl('${id}')" style="font-size:11px; padding:4px 8px; border-radius:6px; font-weight:700; color:#4b5563; border-color:#e5e7eb; background:#f9fafb;">
              نسخ الرابط
            </button>
            <div style="position:relative; display:inline-block;">
              <select onchange="if(this.value) { shareProductLanding('${id}', this.value); this.value=''; }" style="font-size:11px; padding:4px 8px; border-radius:6px; font-weight:700; color:#6b7280; border:1px solid #d1d5db; background:#fff; cursor:pointer; font-family:'Tajawal',sans-serif;">
                <option value="">📤 مشاركة</option>
                <option value="whatsapp">واتساب</option>
                <option value="copy-instagram">نسخ لـ انستقرام</option>
                <option value="copy-tiktok">نسخ لـ تيك توك</option>
                <option value="copy-snap">نسخ لـ سناب شات</option>
              </select>
            </div>
            <button class="action-btn" onclick="deleteLandingPage('${id}')" style="font-size:11px; padding:4px 8px; border-radius:6px; font-weight:700; color:#ef4444; border-color:#fca5a5; background:#fff5f5;">
              حذف
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;
  container.innerHTML = html;
}

function previewAndOpenLandingPage() {
  const pid = document.getElementById('lp-product-select').value;
  if (!pid) { alert('⚠️ يرجى اختيار منتج أولاً.'); return; }
  const product = NasmaDB.ProductsDB.getById(pid);
  if (!product) { alert('❌ المنتج غير موجود.'); return; }
  const settings = NasmaDB.SettingsDB.get();

  const config = {
    headline:     document.getElementById('lp-headline').value.trim()     || product.name,
    subheadline:  document.getElementById('lp-subheadline').value.trim()  || 'جودة فاخرة | شحن سريع | الدفع عند الاستلام',
    urgency:      document.getElementById('lp-urgency').value.trim(),
    ctaBtn:       document.getElementById('lp-cta-btn').value.trim()      || 'اطلبي الآن — الدفع عند الاستلام ✓',
    badgeText:    document.getElementById('lp-badge-text').value.trim(),
    features:     document.getElementById('lp-features').value.trim().split('\n').map(s=>s.trim()).filter(Boolean),
    testimonials: document.getElementById('lp-testimonials').value.trim().split('\n').map(s=>s.trim()).filter(Boolean),
    theme:        document.getElementById('lp-theme').value || 'gold',
  };

  const html = buildLandingPageHTML(product, config, settings);
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

/* ─── ألوان الثيمات ─── */
function getLandingTheme(theme) {
  const themes = {
    gold:  { primary: '#C4A882', dark: '#9E7E57', bg: '#FAF8F5', bgDark: '#F2EDE6', text: '#2C2C2C', accent: '#7C5C3A', heroGrad: 'linear-gradient(135deg,#1a1008 0%,#3d2b12 50%,#1a1008 100%)', heroBadge: '#C4A882' },
    dark:  { primary: '#E5C97E', dark: '#B89A42', bg: '#12120F', bgDark: '#1C1C17', text: '#F0EDE8', accent: '#E5C97E', heroGrad: 'linear-gradient(135deg,#0a0a08 0%,#1e1e18 50%,#0a0a08 100%)', heroBadge: '#E5C97E' },
    rose:  { primary: '#D4829A', dark: '#A85672', bg: '#FFF5F7', bgDark: '#FCEEF1', text: '#2C1A22', accent: '#8B3A56', heroGrad: 'linear-gradient(135deg,#2a0d18 0%,#5c1e35 50%,#2a0d18 100%)', heroBadge: '#D4829A' },
    teal:  { primary: '#5BA6A0', dark: '#3C7E79', bg: '#F4FAFA', bgDark: '#E8F5F4', text: '#142525', accent: '#2A5C59', heroGrad: 'linear-gradient(135deg,#051a1a 0%,#0f3535 50%,#051a1a 100%)', heroBadge: '#5BA6A0' },
    navy:  { primary: '#5C78C0', dark: '#3855A0', bg: '#F4F6FB', bgDark: '#E9EDF7', text: '#141C35', accent: '#2A3B80', heroGrad: 'linear-gradient(135deg,#080d24 0%,#141c40 50%,#080d24 100%)', heroBadge: '#7B9BDD' },
  };
  return themes[theme] || themes.gold;
}

/* ─── مولّد HTML صفحة الهبوط ─── */
function buildLandingPageHTML(product, config, settings) {
  const t = getLandingTheme(config.theme);
  const storeName = settings.storeTitle || settings.storeName || 'نسما ستور';
  const storePhone = settings.storePhone || '';
  const freeMin = settings.freeShippingMin || 0;
  const shippingFee = settings.shippingFee || 0;

  const imgSrc  = (product.images && product.images[0]) ? product.images[0] : '';
  const img2Src = (product.images && product.images[1]) ? product.images[1] : imgSrc;

  const priceStr    = NasmaDB.formatPrice(product.price);
  const oldPriceStr = product.priceOld > product.price ? NasmaDB.formatPrice(product.priceOld) : '';
  const discount    = (product.priceOld > product.price) ? Math.round((1 - product.price / product.priceOld) * 100) : 0;

  const sizesHTML = product.sizes && product.sizes.length
    ? `<div class="opt-group"><p class="opt-label">الحجم</p><div class="opt-btns" id="size-btns">
        ${product.sizes.map((s,i) => `<button type="button" class="opt-btn${i===0?' selected':''}" onclick="selectOpt(this,'size-btns')">${s}</button>`).join('')}
       </div></div>` : '';

  const colorsHTML = product.colors && product.colors.length
    ? `<div class="opt-group"><p class="opt-label">اللون</p><div class="opt-btns" id="color-btns">
        ${product.colors.map((c,i) => `<button type="button" class="opt-btn${i===0?' selected':''}" onclick="selectOpt(this,'color-btns')">${c}</button>`).join('')}
       </div></div>` : '';

  const featuresHTML = config.features.length
    ? config.features.map(f => `<li class="feat-item"><span class="feat-check">✓</span>${f}</li>`).join('')
    : '';

  const testimonialsHTML = config.testimonials.length
    ? config.testimonials.map(item => {
        const parts = item.split('|');
        const tName = parts[0] ? parts[0].trim() : 'عميلة';
        const tText = parts[1] ? parts[1].trim() : item;
        return `<div class="testi-card">
          <div class="testi-stars">⭐⭐⭐⭐⭐</div>
          <span class="testi-name">— ${tName}</span>
          <p class="testi-text">"${tText}"</p>
        </div>`;
      }).join('')
    : '';

  const urgencyBar  = config.urgency ? `<div class="urgency-bar">${config.urgency}</div>` : '';
  const badgePill   = config.badgeText ? `<span class="hero-badge-pill">${config.badgeText}</span>` : '';
  const discountPill = discount > 0 ? `<span class="price-discount-pill">خصم ${discount}%</span>` : '';

  const storeDataJSON = JSON.stringify({
    productId: product.id,
    productName: product.name,
    productPrice: product.price,
    shippingFee: shippingFee,
    freeMin: freeMin,
    storePhone: storePhone,
    shippingCities: NasmaDB.ShippingDB.getAll(),
    coupons: NasmaDB.CouponsDB.getAll()
  }).replace(/<\/script>/gi, '<\\/script>');

  /* ─── hero عنوان مع تلوين أول كلمتين ─── */
  const words = config.headline.trim().split(' ');
  const highlighted = words.slice(0, Math.min(2, words.length)).join(' ');
  const rest = words.slice(Math.min(2, words.length)).join(' ');
  const heroTitleHTML = `<span style="color:${t.primary};">${highlighted}</span>${rest ? ' ' + rest : ''}`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.headline} — ${storeName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--primary:${t.primary};--primary-dark:${t.dark};--bg:${t.bg};--bg-dark:${t.bgDark};--text:${t.text};--accent:${t.accent};--hero-grad:${t.heroGrad}}
    html{scroll-behavior:smooth}
    body{font-family:'Tajawal',sans-serif;background:var(--bg);color:var(--text);direction:rtl}
    /* Announcement */
    .announce-bar{background:var(--primary);color:#fff;text-align:center;padding:10px 20px;font-size:13px;font-weight:700}
    /* Urgency */
    .urgency-bar{background:#111;color:#FFD700;text-align:center;padding:12px 20px;font-size:14px;font-weight:800;letter-spacing:.5px;animation:pulse 2s ease-in-out infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.8}}
    /* Hero */
    .hero{background:var(--hero-grad);min-height:95vh;display:flex;align-items:center;justify-content:center;padding:40px 24px;}
    @media(max-width:768px){.hero{min-height:auto;padding:60px 0 20px 0;}}
    .hero-container{width:100%;max-width:1200px;display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:40px;}
    @media(max-width:768px){.hero-container{grid-template-columns:1fr;gap:20px;}}
    .hero-content{padding:60px 50px;color:#fff}
    @media(max-width:768px){.hero-content{padding:40px 24px;order:2}}
    .hero-badge-pill{display:inline-block;background:${t.heroBadge}22;border:1.5px solid var(--primary);color:var(--primary);border-radius:50px;padding:5px 16px;font-size:12px;font-weight:800;letter-spacing:1px;margin-bottom:18px;text-transform:uppercase}
    .hero-title{font-family:'Amiri',serif;font-size:clamp(1.8rem,4.5vw,3rem);font-weight:700;line-height:1.3;margin-bottom:14px;color:#fff}
    .hero-subtitle{font-size:14px;color:rgba(255,255,255,.7);margin-bottom:28px;line-height:1.7}
    .hero-price-row{display:flex;align-items:center;gap:14px;margin-bottom:28px;flex-wrap:wrap}
    .hero-price{font-size:2.2rem;font-weight:900;color:var(--primary)}
    .hero-price-old{font-size:1rem;color:rgba(255,255,255,.4);text-decoration:line-through}
    .price-discount-pill{background:#ef4444;color:#fff;border-radius:50px;padding:4px 12px;font-size:11px;font-weight:800}
    .hero-cta{display:inline-flex;align-items:center;justify-content:center;background:var(--primary);color:#fff;font-size:16px;font-weight:800;padding:16px 36px;border-radius:50px;border:none;cursor:pointer;width:100%;max-width:380px;transition:all .3s;box-shadow:0 8px 30px rgba(196,168,130,.35);margin-bottom:12px;font-family:'Tajawal',sans-serif;text-decoration:none}
    .hero-cta:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(196,168,130,.5)}
    .hero-trust{display:flex;gap:18px;font-size:12px;color:rgba(255,255,255,.55);flex-wrap:wrap;margin-top:8px}
    .hero-trust span::before{content:'✓  ';color:var(--primary)}
    .hero-img-wrap{display:flex;align-items:center;justify-content:center;padding:30px;min-height:500px}
    @media(max-width:768px){.hero-img-wrap{min-height:280px;padding:20px;order:1}}
    .hero-img{width:100%;max-width:460px;height:520px;object-fit:cover;border-radius:20px;box-shadow:0 40px 80px rgba(0,0,0,.6);border:3px solid ${t.heroBadge}44}
    @media(max-width:768px){.hero-img{height:280px;max-width:100%}}
    .hero-img-placeholder{width:100%;max-width:460px;height:520px;border-radius:20px;background:${t.heroBadge}18;border:2px dashed ${t.heroBadge}44;display:flex;align-items:center;justify-content:center;color:var(--primary);font-size:80px}
    /* Trust strip */
    .trust-strip{background:var(--bg-dark);padding:20px;display:flex;justify-content:center;gap:40px;flex-wrap:wrap;border-bottom:1px solid ${t.primary}22}
    .trust-item{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700}
    .trust-icon{font-size:20px}
    /* Section */
    .section{padding:70px 24px;max-width:1100px;margin:0 auto}
    .section-title{font-family:'Amiri',serif;font-size:clamp(1.5rem,3.5vw,2.2rem);font-weight:700;text-align:center;margin-bottom:40px}
    .section-title span{color:var(--primary)}
    /* Features */
    .feat-list{list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
    .feat-item{background:var(--bg-dark);border-radius:14px;padding:18px 22px;display:flex;align-items:flex-start;gap:12px;font-size:14px;font-weight:600;border:1px solid ${t.primary}22;transition:all .25s}
    .feat-item:hover{border-color:var(--primary);transform:translateY(-2px)}
    .feat-check{color:var(--primary);font-size:18px;flex-shrink:0}
    /* Product section */
    .product-section{background:var(--bg-dark);border-radius:20px;padding:40px;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start;border:1px solid ${t.primary}18}
    @media(max-width:768px){.product-section{grid-template-columns:1fr;gap:24px;padding:24px}}
    .prod-img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.12)}
    .prod-info{display:flex;flex-direction:column;gap:18px}
    .prod-name{font-family:'Amiri',serif;font-size:1.6rem;font-weight:700;line-height:1.3}
    .prod-desc{font-size:14px;line-height:1.8;color:rgba(0,0,0,.6)}
    .prod-price-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .prod-price{font-size:2rem;font-weight:900;color:var(--primary-dark)}
    .prod-price-old{font-size:1rem;text-decoration:line-through;color:#9CA3AF}
    .opt-group{display:flex;flex-direction:column;gap:8px}
    .opt-label{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b}
    .opt-btns{display:flex;gap:8px;flex-wrap:wrap}
    .opt-btn{padding:7px 16px;border:1.5px solid #cbd5e1;border-radius:8px;background:#fff;font-family:'Tajawal',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
    .opt-btn.selected,.opt-btn:hover{border-color:var(--primary);background:${t.primary}15;color:var(--primary-dark)}
    .qty-row{display:flex;align-items:center;gap:12px}
    .qty-label{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b}
    .qty-ctrl{display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:10px;overflow:hidden}
    .qty-btn{width:38px;height:38px;background:#f8fafc;border:none;font-size:18px;cursor:pointer;font-weight:700;color:var(--primary-dark);transition:background .2s;font-family:'Tajawal',sans-serif}
    .qty-btn:hover{background:${t.primary}22}
    .qty-val{width:44px;text-align:center;font-size:15px;font-weight:700}
    .prod-cta{width:100%;padding:16px;background:var(--primary-dark);color:#fff;border:none;border-radius:12px;font-family:'Tajawal',sans-serif;font-size:16px;font-weight:800;cursor:pointer;transition:all .3s;box-shadow:0 6px 20px rgba(0,0,0,.15)}
    .prod-cta:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,.2)}
    /* Order Form */
    .order-form-section{background:var(--hero-grad);padding:70px 24px}
    .order-form-wrap{max-width:560px;margin:0 auto;background:rgba(255,255,255,.06);backdrop-filter:blur(10px);border:1px solid ${t.heroBadge}33;border-radius:24px;padding:40px}
    @media(max-width:768px){.order-form-wrap{padding:24px}}
    .order-form-title{font-family:'Amiri',serif;font-size:1.8rem;color:#fff;text-align:center;margin-bottom:8px}
    .order-form-sub{text-align:center;color:rgba(255,255,255,.6);font-size:13px;margin-bottom:28px}
    .form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    @media(max-width:520px){.form-row{grid-template-columns:1fr}}
    .form-group{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
    .form-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.6)}
    .form-input{width:100%;padding:13px 16px;background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-family:'Tajawal',sans-serif;font-size:14px;outline:none;transition:border-color .2s}
    .form-input::placeholder{color:rgba(255,255,255,.3)}
    .form-input:focus{border-color:var(--primary);background:rgba(255,255,255,.12)}
    .order-summary{background:rgba(255,255,255,.06);border-radius:12px;padding:16px;margin-bottom:20px}
    .order-summary-row{display:flex;justify-content:space-between;font-size:13px;color:rgba(255,255,255,.7);margin-bottom:8px}
    .order-summary-total{display:flex;justify-content:space-between;font-size:17px;font-weight:900;color:#fff;border-top:1px solid rgba(255,255,255,.15);padding-top:12px;margin-top:4px}
    .order-summary-total span:last-child{color:var(--primary)}
    .submit-btn{width:100%;padding:17px;background:var(--primary);color:#fff;border:none;border-radius:12px;font-family:'Tajawal',sans-serif;font-size:17px;font-weight:900;cursor:pointer;transition:all .3s;box-shadow:0 8px 30px rgba(0,0,0,.3);letter-spacing:.5px}
    .submit-btn:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,.4)}
    .submit-btn:disabled{opacity:.6;cursor:not-allowed;transform:none}
    .form-note{text-align:center;font-size:12px;color:rgba(255,255,255,.4);margin-top:14px;line-height:1.7}
    /* Success */
    .success-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(6px);z-index:9999;display:none;align-items:center;justify-content:center}
    .success-overlay.show{display:flex}
    .success-card{background:#fff;border-radius:24px;padding:50px 40px;max-width:440px;width:90%;text-align:center}
    @media(max-width:480px){.success-card{padding:32px 24px}}
    .success-icon{font-size:64px;margin-bottom:16px}
    .success-title{font-family:'Amiri',serif;font-size:1.8rem;color:#0f172a;margin-bottom:10px}
    .success-sub{font-size:13px;color:#64748b;line-height:1.7;margin-bottom:20px}
    .success-order-num{display:inline-block;background:#f1f5f9;color:#0f172a;border-radius:8px;padding:10px 24px;font-size:1.1rem;font-weight:800;letter-spacing:1px}
    /* Testimonials */
    .testi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}
    .testi-card{background:var(--bg-dark);border-radius:16px;padding:24px;border:1px solid ${t.primary}18}
    .testi-stars{font-size:15px;margin-bottom:10px}
    .testi-text{font-size:14px;line-height:1.7;color:rgba(0,0,0,.65);margin-bottom:0;font-style:italic}
    .testi-name{font-size:12px;font-weight:700;color:var(--primary-dark);display:block;margin-bottom:8px}
    /* Footer CTA */
    .footer-cta{background:var(--bg-dark);border-top:1px solid ${t.primary}22;padding:50px 24px;text-align:center}
    .footer-cta-title{font-family:'Amiri',serif;font-size:1.8rem;margin-bottom:20px}
    .footer-brand{font-size:12px;color:#94a3b8;margin-top:30px}
    /* Sticky mobile */
    .sticky-cta{position:fixed;bottom:0;left:0;right:0;background:var(--primary-dark);color:#fff;display:none;align-items:center;justify-content:center;gap:10px;padding:14px 24px;z-index:500;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 -4px 20px rgba(0,0,0,.25);border:none;width:100%;font-family:'Tajawal',sans-serif}
    @media(max-width:768px){.sticky-cta{display:flex}}
    /* Animations */
    .fade-up{opacity:0;transform:translateY(30px);transition:all .7s ease}
    .fade-up.visible{opacity:1;transform:translateY(0)}
    ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--primary);border-radius:3px}
    /* Back button style */
    .back-store-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:rgba(255,255,255,0.12);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);color:#fff !important;border-radius:50px;text-decoration:none;font-size:13px;font-weight:700;transition:all 0.3s;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
    .back-store-btn:hover{background:var(--primary);border-color:var(--primary);color:#fff !important;transform:translateY(-2px)}
  </style>
</head>
<body>

  <div class="success-overlay" id="success-overlay">
    <div class="success-card">
      <div class="success-icon">🎉</div>
      <h2 class="success-title">تم تأكيد طلبكِ!</h2>
      <p class="success-sub">شكراً لثقتكِ بـ <strong>${storeName}</strong>.<br>سيتواصل معكِ فريقنا خلال 24 ساعة لتأكيد التوصيل.</p>
      <div class="success-order-num" id="success-order-num">جاري التأكيد...</div>
      <p style="margin-top:12px;font-size:12px;color:#94a3b8">رقم طلبكِ للمتابعة</p>
    </div>
  </div>

  <div class="announce-bar">🌸 ${freeMin > 0 ? `شحن مجاني للطلبات فوق ${product.price >= freeMin ? '✅ أنتِ مؤهلة للشحن المجاني!' : NasmaDB.formatPrice(freeMin)}` : 'شحن مجاني لجميع الطلبات'} | الدفع عند الاستلام ✓</div>

  ${urgencyBar}

  <!-- Header returning to store -->
  <header style="background:transparent; padding:15px 5%; display:flex; justify-content:space-between; align-items:center; position:absolute; left:0; right:0; z-index:100;">
    <div></div>
    <a href="index.html" class="back-store-btn">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      الذهاب للمتجر
    </a>
  </header>

  <section class="hero">
    <div class="hero-container">
      <div class="hero-content fade-up">
      ${badgePill}
      <h1 class="hero-title">${heroTitleHTML}</h1>
      <p class="hero-subtitle">${config.subheadline}</p>
      <div class="hero-price-row">
        <span class="hero-price">${priceStr}</span>
        ${oldPriceStr ? `<span class="hero-price-old">${oldPriceStr}</span>` : ''}
        ${discountPill}
      </div>
      <button class="hero-cta" onclick="scrollToOrder()">${config.ctaBtn}</button>
      <div class="hero-trust">
        <span>الدفع عند الاستلام</span>
        <span>شحن سريع وآمن</span>
        <span>استبدال واسترجاع سهل</span>
      </div>
    </div>
      <div class="hero-img-wrap fade-up">
        ${imgSrc ? `<img class="hero-img" src="${imgSrc}" alt="${product.name}">` : `<div class="hero-img-placeholder">🛍️</div>`}
      </div>
    </div>
  </section>

  <div class="trust-strip">
    <div class="trust-item"><span class="trust-icon">🚚</span> شحن لجميع المناطق</div>
    <div class="trust-item"><span class="trust-icon">💳</span> الدفع عند الاستلام</div>
    <div class="trust-item"><span class="trust-icon">↩️</span> استبدال واسترجاع سهل</div>
    <div class="trust-item"><span class="trust-icon">🔒</span> ضمان أصالة المنتج</div>
  </div>

  ${featuresHTML ? `
  <div class="section fade-up">
    <h2 class="section-title">لماذا <span>تختارين</span> هذا المنتج؟</h2>
    <ul class="feat-list">${featuresHTML}</ul>
  </div>` : ''}

  <div class="section">
    <div class="product-section fade-up">
      <div>${imgSrc ? `<img class="prod-img" src="${img2Src || imgSrc}" alt="${product.name}">` : `<div class="prod-img" style="background:${t.heroBadge}18;display:flex;align-items:center;justify-content:center;font-size:80px;border-radius:14px;">🛍️</div>`}</div>
      <div class="prod-info">
        <h2 class="prod-name">${product.name}</h2>
        ${product.description ? `<p class="prod-desc">${product.description}</p>` : ''}
        <div class="prod-price-row">
          <span class="prod-price">${priceStr}</span>
          ${oldPriceStr ? `<span class="prod-price-old">${oldPriceStr}</span>` : ''}
          ${discountPill}
        </div>
        ${sizesHTML}
        ${colorsHTML}
        <div class="qty-row">
          <span class="qty-label">الكمية</span>
          <div class="qty-ctrl">
            <button class="qty-btn" onclick="changeQty(-1)">−</button>
            <span class="qty-val" id="qty-display">1</span>
            <button class="qty-btn" onclick="changeQty(1)">+</button>
          </div>
        </div>
        <button class="prod-cta" onclick="scrollToOrder()">${config.ctaBtn}</button>
      </div>
    </div>
  </div>

  ${testimonialsHTML ? `
  <div class="section fade-up">
    <h2 class="section-title">ماذا تقول <span>عميلاتنا</span>؟</h2>
    <div class="testi-grid">${testimonialsHTML}</div>
  </div>` : ''}

  <div class="order-form-section" id="order-section">
    <div class="order-form-wrap fade-up">
      <h2 class="order-form-title">أكملي طلبكِ الآن</h2>
      <p class="order-form-sub">أدخلي بياناتكِ وسنتواصل معكِ لتأكيد التوصيل</p>

      <div class="order-summary">
        <div class="order-summary-row"><span>${product.name}</span><span id="lp-item-price">${priceStr}</span></div>
        <div class="order-summary-row"><span>الكمية</span><span id="lp-qty-summary">× 1</span></div>
        <div class="order-summary-row" id="lp-discount-row" style="display:none; color:#ef4444;"><span>خصم الكوبون</span><span id="lp-discount-display">-0 ج.م</span></div>
        <div class="order-summary-row"><span>الشحن</span><span id="lp-shipping-display">سيُحدد بعد اختيار المحافظة</span></div>
        <div class="order-summary-total"><span>الإجمالي</span><span id="lp-total-display">${priceStr}</span></div>
      </div>

      <form id="lp-order-form" onsubmit="submitLandingOrder(event)">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">الاسم الكامل *</label>
            <input type="text" class="form-input" id="lp-name" placeholder="اسمكِ الكريم" required>
          </div>
          <div class="form-group">
            <label class="form-label">رقم الهاتف *</label>
            <input type="tel" class="form-input" id="lp-phone" placeholder="01XXXXXXXXX" pattern="^01[0125][0-9]{8}$" title="يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقم يبدأ بـ 01" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">المحافظة *</label>
          <select class="form-input" id="lp-city" onchange="calcTotal()" required style="height:48px; color:#fff; background:rgba(255,255,255,.08); border:1.5px solid rgba(255,255,255,.15); border-radius:10px; font-family:'Tajawal',sans-serif; font-size:14px; outline:none; transition:border-color .2s;">
            <option value="" style="color:#0f172a;">— اختر المحافظة —</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">العنوان التفصيلي *</label>
          <input type="text" class="form-input" id="lp-address" placeholder="الحي، الشارع، رقم المبنى..." required>
        </div>

        ${sizesHTML ? `<div class="form-group" id="lp-size-group">
          <label class="form-label">الحجم المختار</label>
          <input type="text" class="form-input" id="lp-selected-size" readonly placeholder="اختاري الحجم من الأعلى">
        </div>` : ''}
        ${colorsHTML ? `<div class="form-group" id="lp-color-group">
          <label class="form-label">اللون المختار</label>
          <input type="text" class="form-input" id="lp-selected-color" readonly placeholder="اختاري اللون من الأعلى">
        </div>` : ''}
        <div class="form-group">
          <label class="form-label">كود الخصم (إن وجد)</label>
          <div style="display:flex; gap:8px;">
            <input type="text" class="form-input" id="lp-coupon" placeholder="أدخلي كود الخصم هنا" style="text-transform:uppercase;">
            <button type="button" class="prod-cta" onclick="applyCouponCode()" style="width:auto; padding:10px 24px; white-space:nowrap; border-radius:10px;">تطبيق</button>
          </div>
          <div id="lp-coupon-msg" style="font-size:12px; margin-top:6px; font-weight:700; display:none;"></div>
        </div>
        <div class="form-group">
          <label class="form-label">ملاحظات (اختياري)</label>
          <input type="text" class="form-input" id="lp-notes" placeholder="أي تفاصيل إضافية...">
        </div>
        <button type="submit" class="submit-btn" id="lp-submit-btn">${config.ctaBtn}</button>
        <p class="form-note">🔒 بياناتكِ محمية ولن تُشارك مع أي جهة<br>📦 الدفع عند الاستلام — لا حاجة لبطاقة بنكية</p>
      </form>
    </div>
  </div>

  <div class="footer-cta fade-up">
    <h2 class="footer-cta-title">لا تترددي — الفرصة لن تعود</h2>
    <button class="hero-cta" style="max-width:340px;margin:0 auto;display:flex;" onclick="scrollToOrder()">${config.ctaBtn}</button>
    <p class="footer-brand">${storeName} — ${new Date().getFullYear()} © جميع الحقوق محفوظة</p>
  </div>

  <button class="sticky-cta" onclick="scrollToOrder()">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    ${config.ctaBtn}
  </button>

  <script>
    var SD = ${storeDataJSON};
    var currentQty = 1;
    var unitPrice = SD.productPrice;
    var shippingCost = 0;
    var appliedCoupon = null;
    var discountAmount = 0;

    function formatP(n) { return n.toLocaleString('ar-EG') + ' ج.م'; }

    function calcTotal() {
      var sub = unitPrice * currentQty;
      
      var select = document.getElementById('lp-city');
      var selectedCityName = select ? select.value : '';
      
      if (selectedCityName) {
        try {
          var rawCities = localStorage.getItem('nasma_shipping');
          var cities = rawCities ? JSON.parse(rawCities) : [];
          var city = cities.find(function(c) { return c.name === selectedCityName; });
          var baseCost = city ? city.cost : 0;
          
          if (SD.freeMin > 0 && sub >= SD.freeMin) {
            shippingCost = 0;
            document.getElementById('lp-shipping-display').textContent = 'مجاني 🎁';
          } else {
            shippingCost = baseCost;
            document.getElementById('lp-shipping-display').textContent = formatP(shippingCost);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        shippingCost = 0;
        document.getElementById('lp-shipping-display').textContent = 'سيُحدد بعد اختيار المحافظة';
      }

      if (appliedCoupon) {
        if (sub < appliedCoupon.minOrder) {
          appliedCoupon = null;
          discountAmount = 0;
          var msg = document.getElementById('lp-coupon-msg');
          msg.style.display = 'block';
          msg.style.color = '#EF4444';
          msg.textContent = '❌ تم إلغاء الخصم لأن مجموع المنتجات أقل من الحد الأدنى للكود (' + formatP(appliedCoupon.minOrder) + ')';
          document.getElementById('lp-discount-row').style.display = 'none';
        } else {
          if (appliedCoupon.type === 'percent') {
            discountAmount = (sub * appliedCoupon.value) / 100;
          } else {
            discountAmount = appliedCoupon.value;
          }
          document.getElementById('lp-discount-display').textContent = '-' + formatP(discountAmount);
          document.getElementById('lp-discount-row').style.display = 'flex';
        }
      }

      var tot = sub + shippingCost - discountAmount;
      document.getElementById('lp-total-display').textContent = formatP(tot);
      document.getElementById('lp-qty-summary').textContent = '× ' + currentQty;
    }

    function populateCities() {
      var select = document.getElementById('lp-city');
      if (!select) return;
      try {
        var cities = SD.shippingCities || [];
        if (cities.length === 0) {
          var rawCities = localStorage.getItem('nasma_shipping');
          cities = rawCities ? JSON.parse(rawCities) : [];
        }
        cities.forEach(function(city) {
          var opt = document.createElement('option');
          opt.value = city.name;
          opt.textContent = city.name + ' (' + formatP(city.cost) + ')';
          opt.style.color = '#0f172a';
          select.appendChild(opt);
        });
      } catch(e) {
        console.error('Error loading cities', e);
      }
    }

    function changeQty(d) {
      currentQty = Math.max(1, Math.min(99, currentQty + d));
      document.getElementById('qty-display').textContent = currentQty;
      calcTotal();
    }

    function applyCouponCode() {
      var codeInput = document.getElementById('lp-coupon').value.trim().toUpperCase();
      var msg = document.getElementById('lp-coupon-msg');
      if (!codeInput) {
        msg.style.display = 'block';
        msg.style.color = '#EF4444';
        msg.textContent = '⚠️ يرجى إدخال الكود أولاً';
        return;
      }

      try {
        var coupons = SD.coupons || [];
        if (coupons.length === 0) {
          var rawCoupons = localStorage.getItem('nasma_coupons');
          coupons = rawCoupons ? JSON.parse(rawCoupons) : [];
        }
        var coupon = coupons.find(function(c) { return c.code === codeInput && c.active; });
        
        if (!coupon) {
          msg.style.display = 'block';
          msg.style.color = '#EF4444';
          msg.textContent = '❌ الكود غير صحيح أو غير فعال';
          appliedCoupon = null;
          discountAmount = 0;
          document.getElementById('lp-discount-row').style.display = 'none';
          calcTotal();
          return;
        }

        if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
          msg.style.display = 'block';
          msg.style.color = '#EF4444';
          msg.textContent = '❌ انتهت صلاحية استخدام هذا الكود';
          return;
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          msg.style.display = 'block';
          msg.style.color = '#EF4444';
          msg.textContent = '❌ انتهت صلاحية هذا الكود';
          return;
        }

        var sub = unitPrice * currentQty;
        if (sub < coupon.minOrder) {
          msg.style.display = 'block';
          msg.style.color = '#EF4444';
          msg.textContent = '❌ الحد الأدنى لتفعيل هذا الكود هو ' + formatP(coupon.minOrder);
          return;
        }

        appliedCoupon = coupon;
        msg.style.display = 'block';
        msg.style.color = '#4CAF50';
        msg.textContent = '✅ تم تطبيق الكوبون! خصم بقيمة ' + (coupon.type === 'percent' ? coupon.value + '%' : formatP(coupon.value));
        calcTotal();

      } catch(err) {
        msg.style.display = 'block';
        msg.style.color = '#EF4444';
        msg.textContent = '⚠️ حدث خطأ أثناء معالجة الكود';
      }
    }

    function selectOpt(btn, groupId) {
      document.querySelectorAll('#' + groupId + ' .opt-btn').forEach(function(b){ b.classList.remove('selected'); });
      btn.classList.add('selected');
      if (groupId === 'size-btns') {
        var sf = document.getElementById('lp-selected-size');
        if (sf) sf.value = btn.textContent;
      }
      if (groupId === 'color-btns') {
        var cf = document.getElementById('lp-selected-color');
        if (cf) cf.value = btn.textContent;
      }
    }

    function scrollToOrder() {
      document.getElementById('order-section').scrollIntoView({ behavior: 'smooth' });
      setTimeout(function(){ var n = document.getElementById('lp-name'); if(n) n.focus(); }, 600);
    }

    function submitLandingOrder(e) {
      e.preventDefault();
      var btn = document.getElementById('lp-submit-btn');
      btn.disabled = true;
      btn.textContent = '⏳ جاري تأكيد الطلب...';

      var name    = document.getElementById('lp-name').value.trim();
      var phone   = document.getElementById('lp-phone').value.trim();
      var city    = document.getElementById('lp-city').value.trim();
      var address = document.getElementById('lp-address').value.trim();
      var notes   = document.getElementById('lp-notes').value.trim();
      var sizeEl  = document.getElementById('lp-selected-size');
      var colorEl = document.getElementById('lp-selected-color');
      var size  = sizeEl  ? sizeEl.value  : '';
      var color = colorEl ? colorEl.value : '';
      var subtotal = unitPrice * currentQty;
      var total    = subtotal + shippingCost;

      try {
        var raw = localStorage.getItem('nasma_orders');
        var orders = raw ? JSON.parse(raw) : [];
        var saved = {
          id:            'ORD-' + Date.now(),
          orderNumber:   'N-' + Math.floor(10000 + Math.random() * 90000),
          items:         [{ productId: SD.productId, name: SD.productName, price: unitPrice, qty: currentQty, size: size, color: color }],
          customer:      { name: name, phone: phone, city: city, address: address, email: '' },
          subtotal:      subtotal,
          discount:      discountAmount,
          shipping:      shippingCost,
          total:         total - discountAmount,
          couponCode:    appliedCoupon ? appliedCoupon.code : '',
          paymentMethod: 'الدفع عند الاستلام',
          status:        'pending',
          notes:         (notes ? notes + ' | ' : '') + 'مصدر: صفحة هبوط' + (appliedCoupon ? ' | كود: ' + appliedCoupon.code : ''),
          source:        'landing_page',
          createdAt:     new Date().toISOString(),
          updatedAt:     new Date().toISOString(),
        };

        if (appliedCoupon) {
          var rawCoupons = localStorage.getItem('nasma_coupons');
          if (rawCoupons) {
            var coupons = JSON.parse(rawCoupons);
            var updatedCoupons = coupons.map(function(c) {
              if (c.code === appliedCoupon.code) {
                c.usedCount = (c.usedCount || 0) + 1;
              }
              return c;
            });
            localStorage.setItem('nasma_coupons', JSON.stringify(updatedCoupons));
          }
        }

        orders.unshift(saved);
        localStorage.setItem('nasma_orders', JSON.stringify(orders));
        document.getElementById('success-order-num').textContent = saved.orderNumber;
        document.getElementById('success-overlay').classList.add('show');
      } catch(err) {
        alert('⚠️ حدث خطأ أثناء حفظ الطلب. يرجى المحاولة مرة أخرى.');
        btn.disabled = false;
        btn.textContent = '${config.ctaBtn.replace(/'/g, "\\'")}';
      }
    }

    /* Scroll animations */
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach(function(el){ obs.observe(el); });

    /* Init default selections */
    (function(){
      populateCities();
      calcTotal();
      var fs = document.querySelector('#size-btns .opt-btn');
      if (fs) selectOpt(fs, 'size-btns');
      var fc = document.querySelector('#color-btns .opt-btn');
      if (fc) selectOpt(fc, 'color-btns');
    })();
  </script>
</body>
</html>`;
}


/* ===========================================
   قسم التسويق الرقمي — البيكسل وكتالوج المنتجات
   =========================================== */

const PIXEL_STORAGE_KEY = 'nasma_pixel_settings';

function getPixelSettings() {
  try {
    const raw = localStorage.getItem(PIXEL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { fbPixelId: '', fbAccessToken: '', tiktokPixelId: '', snapPixelId: '' };
  } catch { return { fbPixelId: '', fbAccessToken: '', tiktokPixelId: '', snapPixelId: '' }; }
}

function savePixelSettingsToStorage(settings) {
  localStorage.setItem(PIXEL_STORAGE_KEY, JSON.stringify(settings));
}

function loadMarketingTab() {
  const settings = getPixelSettings();
  const fbField = document.getElementById('fb-pixel-id');
  const fbToken = document.getElementById('fb-access-token');
  const ttField = document.getElementById('tiktok-pixel-id');
  const snapField = document.getElementById('snap-pixel-id');
  if (fbField) fbField.value = settings.fbPixelId || '';
  if (fbToken) fbToken.value = settings.fbAccessToken || '';
  if (ttField) ttField.value = settings.tiktokPixelId || '';
  if (snapField) snapField.value = settings.snapPixelId || '';
  updatePixelStatusBadge(settings);
  loadFeedCatalogStats();
}

function updatePixelStatusBadge(settings) {
  const badge = document.getElementById('pixel-status-badge');
  if (!badge) return;
  const isActive = settings.fbPixelId || settings.tiktokPixelId || settings.snapPixelId;
  if (isActive) {
    const parts = [];
    if (settings.fbPixelId) parts.push('Meta');
    if (settings.tiktokPixelId) parts.push('TikTok');
    if (settings.snapPixelId) parts.push('Snapchat');
    badge.textContent = '✅ مفعّل — ' + parts.join(' + ');
    badge.style.background = '#dcfce7';
    badge.style.color = '#166534';
  } else {
    badge.textContent = 'غير مفعّل';
    badge.style.background = '#fee2e2';
    badge.style.color = '#ef4444';
  }
}

function savePixelSettings() {
  const fbPixelId = (document.getElementById('fb-pixel-id').value || '').trim();
  const fbAccessToken = (document.getElementById('fb-access-token').value || '').trim();
  const tiktokPixelId = (document.getElementById('tiktok-pixel-id').value || '').trim();
  const snapPixelId = (document.getElementById('snap-pixel-id').value || '').trim();

  if (!fbPixelId && !tiktokPixelId && !snapPixelId) {
    alert('⚠️ يرجى إدخال معرّف بيكسل واحد على الأقل (Meta أو TikTok أو Snapchat).');
    return;
  }

  const settings = { fbPixelId, fbAccessToken, tiktokPixelId, snapPixelId };
  savePixelSettingsToStorage(settings);
  updatePixelStatusBadge(settings);
  injectPixels(settings);

  alert('✅ تم حفظ إعدادات البيكسل وتفعيله بنجاح!\n\nالبيكسل سيعمل تلقائياً على جميع صفحات المتجر عند فتحها من المتصفح.');
}

function clearPixelSettings() {
  if (!confirm('هل أنت متأكد من مسح جميع إعدادات البيكسل؟')) return;
  localStorage.removeItem(PIXEL_STORAGE_KEY);
  document.getElementById('fb-pixel-id').value = '';
  document.getElementById('fb-access-token').value = '';
  document.getElementById('tiktok-pixel-id').value = '';
  document.getElementById('snap-pixel-id').value = '';
  updatePixelStatusBadge({});
  alert('تم مسح إعدادات البيكسل بنجاح.');
}

function testPixelFire() {
  const settings = getPixelSettings();
  if (!settings.fbPixelId && !settings.tiktokPixelId && !settings.snapPixelId) {
    alert('⚠️ لا يوجد بيكسل مفعّل. يرجى حفظ إعدادات البيكسل أولاً.');
    return;
  }
  if (settings.fbPixelId && typeof fbq !== 'undefined') {
    fbq('track', 'PageView');
    fbq('trackCustom', 'AdminTest', { source: 'nasma_admin', pixelId: settings.fbPixelId });
  }
  if (settings.tiktokPixelId && typeof ttq !== 'undefined') {
    ttq.track('ViewContent', { content_name: 'Admin Test', content_id: 'test_001' });
  }
  if (settings.snapPixelId && typeof snaptr !== 'undefined') {
    snaptr('track', 'PAGE_VIEW');
    snaptr('track', 'VIEW_CONTENT', { item_ids: ['test_001'] });
  }
  let msg = '🧪 تم إرسال حدث اختباري!\n\n';
  if (settings.fbPixelId) {
    msg += `✅ Meta Pixel (${settings.fbPixelId}): تم إطلاق PageView\n   → تحقق في Facebook Events Manager → Test Events.\n\n`;
  }
  if (settings.tiktokPixelId) {
    msg += `✅ TikTok Pixel (${settings.tiktokPixelId}): تم إطلاق ViewContent\n   → تحقق في TikTok Ads Manager → Events.\n\n`;
  }
  if (settings.snapPixelId) {
    msg += `✅ Snapchat Pixel (${settings.snapPixelId}): تم إطلاق PAGE_VIEW + VIEW_CONTENT\n   → تحقق في Snapchat Ads Manager → Event Manager.\n`;
  }
  if ((settings.fbPixelId && typeof fbq === 'undefined') || (settings.tiktokPixelId && typeof ttq === 'undefined') || (settings.snapPixelId && typeof snaptr === 'undefined')) {
    msg += '\n💡 بعض المكتبات لم يتم تحميلها بعد في هذه الصفحة. سيتم إطلاقها تلقائياً على صفحة العميل.';
  }
  alert(msg);
}

function injectPixels(settings) {
  if (settings.fbPixelId && !document.getElementById('nasma-meta-pixel')) {
    const script = document.createElement('script');
    script.id = 'nasma-meta-pixel';
    script.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${settings.fbPixelId}');fbq('track','PageView');`;
    document.head.appendChild(script);
  }
  if (settings.tiktokPixelId && !document.getElementById('nasma-tiktok-pixel')) {
    const script = document.createElement('script');
    script.id = 'nasma-tiktok-pixel';
    script.innerHTML = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=i+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('${settings.tiktokPixelId}');ttq.page();}(window,document,'ttq');`;
    document.head.appendChild(script);
  }
  if (settings.snapPixelId && !document.getElementById('nasma-snap-pixel')) {
    const script = document.createElement('script');
    script.id = 'nasma-snap-pixel';
    script.innerHTML = `(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s=t.createElement(n);s.async=!0;s.src="https://sc-static.net/scevent.min.js";var r=t.getElementsByTagName(n)[0];r.parentNode.insertBefore(s,r)})(window,document,"script");snaptr("init","${settings.snapPixelId}");snaptr("track","PAGE_VIEW");`;
    document.head.appendChild(script);
  }
}

/* دوال التتبع (تُستدعى من store.js / checkout.html / product-detail.html) */
window.nasmaTrackViewContent = function(product) {
  const s = getPixelSettings();
  if (!s.fbPixelId && !s.tiktokPixelId && !s.snapPixelId) return;
  if (s.fbPixelId && typeof fbq !== 'undefined') fbq('track', 'ViewContent', { content_ids:[product.id], content_type:'product', content_name:product.name, value:product.price, currency:'EGP' });
  if (s.tiktokPixelId && typeof ttq !== 'undefined') ttq.track('ViewContent', { content_id:product.id, content_name:product.name, value:product.price, currency:'EGP' });
  if (s.snapPixelId && typeof snaptr !== 'undefined') snaptr('track', 'VIEW_CONTENT', { item_ids:[product.id], price:product.price, currency:'EGP', item_category:product.categoryId });
};
window.nasmaTrackAddToCart = function(product, qty) {
  const s = getPixelSettings();
  if (!s.fbPixelId && !s.tiktokPixelId && !s.snapPixelId) return;
  if (s.fbPixelId && typeof fbq !== 'undefined') fbq('track', 'AddToCart', { content_ids:[product.id], content_type:'product', content_name:product.name, value:product.price*(qty||1), currency:'EGP', num_items:(qty||1) });
  if (s.tiktokPixelId && typeof ttq !== 'undefined') ttq.track('AddToCart', { content_id:product.id, content_name:product.name, value:product.price*(qty||1), currency:'EGP', quantity:(qty||1) });
  if (s.snapPixelId && typeof snaptr !== 'undefined') snaptr('track', 'ADD_CART', { item_ids:[product.id], price:product.price, currency:'EGP', number_items:(qty||1) });
};
window.nasmaTrackInitiateCheckout = function(total, items) {
  const s = getPixelSettings();
  if (!s.fbPixelId && !s.tiktokPixelId && !s.snapPixelId) return;
  const ids = (items||[]).map(i=>i.productId||i.id);
  if (s.fbPixelId && typeof fbq !== 'undefined') fbq('track', 'InitiateCheckout', { content_ids:ids, content_type:'product', num_items:(items||[]).length, value:total, currency:'EGP' });
  if (s.tiktokPixelId && typeof ttq !== 'undefined') ttq.track('InitiateCheckout', { value:total, currency:'EGP' });
  if (s.snapPixelId && typeof snaptr !== 'undefined') snaptr('track', 'START_CHECKOUT', { price:total, currency:'EGP', item_ids:ids, number_items:(items||[]).length });
};
window.nasmaTrackPurchase = function(order) {
  const s = getPixelSettings();
  if (!s.fbPixelId && !s.tiktokPixelId && !s.snapPixelId) return;
  const ids = (order.items||[]).map(i=>i.productId);
  if (s.fbPixelId && typeof fbq !== 'undefined') fbq('track', 'Purchase', { content_ids:ids, content_type:'product', value:order.total, currency:'EGP', num_items:(order.items||[]).length, order_id:order.id });
  if (s.tiktokPixelId && typeof ttq !== 'undefined') ttq.track('CompletePayment', { value:order.total, currency:'EGP', content_id:ids[0]||'', quantity:(order.items||[]).length });
  if (s.snapPixelId && typeof snaptr !== 'undefined') snaptr('track', 'PURCHASE', { price:order.total, currency:'EGP', item_ids:ids, transaction_id:order.id });
};
window.nasmaTrackSearch = function(query) {
  const s = getPixelSettings();
  if (!s.fbPixelId && !s.tiktokPixelId && !s.snapPixelId) return;
  if (s.fbPixelId && typeof fbq !== 'undefined') fbq('track', 'Search', { search_string:query });
  if (s.tiktokPixelId && typeof ttq !== 'undefined') ttq.track('Search', { query });
  if (s.snapPixelId && typeof snaptr !== 'undefined') snaptr('track', 'SEARCH', { search_string:query });
};
window.nasmaTrackAddToWishlist = function(product) {
  const s = getPixelSettings();
  if (!s.fbPixelId && !s.tiktokPixelId && !s.snapPixelId) return;
  if (s.fbPixelId && typeof fbq !== 'undefined') fbq('track', 'AddToWishlist', { content_ids:[product.id], content_name:product.name, value:product.price, currency:'EGP' });
  if (s.snapPixelId && typeof snaptr !== 'undefined') snaptr('track', 'ADD_TO_WISHLIST', { item_ids:[product.id] });
};

/* تشغيل البيكسل تلقائياً عند فتح صفحة admin */
(function() {
  const s = getPixelSettings();
  if (s.fbPixelId || s.tiktokPixelId || s.snapPixelId) injectPixels(s);
})();

/* ═══════════════ Product Feed ═══════════════ */

function getStoreBaseUrl() {
  return window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
}

function populateFeedUrls() {
  const base = getStoreBaseUrl();
  const metaUrl = `${base}/feed.html?platform=meta`;
  const tiktokUrl = `${base}/feed.html?platform=tiktok`;
  const googleUrl = `${base}/feed.html?platform=google`;
  const snapUrl = `${base}/feed.html?platform=snapchat`;

  const metaEl = document.getElementById('meta-feed-url');
  const tiktokEl = document.getElementById('tiktok-feed-url');
  const googleEl = document.getElementById('google-feed-url');
  const snapEl = document.getElementById('snapchat-feed-url');

  if (metaEl) metaEl.textContent = metaUrl;
  if (tiktokEl) tiktokEl.textContent = tiktokUrl;
  if (googleEl) googleEl.textContent = googleUrl;
  if (snapEl) snapEl.textContent = snapUrl;
}

function copyFeedUrlToClipboard(platform, btn) {
  const base = getStoreBaseUrl();
  const url = `${base}/feed.html?platform=${platform}`;
  navigator.clipboard.writeText(url).then(() => {
    const originalText = btn.textContent;
    btn.textContent = '✓ تم النسخ';
    btn.style.background = '#dcfce7';
    btn.style.color = '#15803d';
    btn.style.borderColor = '#bbf7d0';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 2000);
  });
}

function openFeedUrl(platform) {
  const base = getStoreBaseUrl();
  const url = `${base}/feed.html?platform=${platform}`;
  window.open(url, '_blank');
}

function loadFeedCatalogStats() {
  populateFeedUrls();
  const el = document.getElementById('feed-catalog-stats');
  if (!el) return;
  const products = NasmaDB.ProductsDB.getAll();
  const active = products.filter(p => p.active !== false);
  const withImage = active.filter(p => p.images && p.images.length > 0);
  const outOfStock = active.filter(p => p.stock <= 0);
  el.innerHTML = [
    { label: 'منتج نشط', val: active.length, color: '#0f172a' },
    { label: 'لديه صور', val: withImage.length, color: '#10b981' },
    { label: 'نفد مخزونه', val: outOfStock.length, color: '#ef4444' },
    { label: 'غير نشط', val: products.length - active.length, color: '#6366f1' },
  ].map(s => `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:14px;text-align:center;"><div style="font-size:24px;font-weight:800;color:${s.color};">${s.val}</div><div style="font-size:11px;color:#64748b;margin-top:2px;">${s.label}</div></div>`).join('');
}

function exportProductFeed(platform) {
  const products = NasmaDB.ProductsDB.getAll().filter(p => p.active !== false);
  const settings = NasmaDB.SettingsDB.get();
  const storeName = settings.storeName || 'نسما ستور';
  const baseUrl = getStoreBaseUrl();
  if (!products.length) { alert('لا توجد منتجات نشطة للتصدير.'); return; }
  if (platform === 'meta') exportMetaFeed(products, storeName, baseUrl);
  else if (platform === 'tiktok') exportTikTokFeed(products, storeName, baseUrl);
  else if (platform === 'google') exportGoogleFeed(products, storeName, baseUrl);
  else if (platform === 'snapchat') exportSnapchatFeed(products, storeName, baseUrl);
}

function escapeCSV(val) { return `"${String(val||'').replace(/"/g,'""')}"`; }
function escapeXml(val) { return String(val||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function exportMetaFeed(products, storeName, baseUrl) {
  const headers = ['id','title','description','availability','condition','price','link','image_link','brand','google_product_category','sale_price'];
  const rows = products.map(p => {
    const avail = p.stock > 0 ? 'in stock' : 'out of stock';
    const img = (p.images && p.images[0]) || '';
    const link = `${baseUrl}/product-detail.html?id=${p.id}`;
    const hasDiscount = p.priceOld && p.priceOld > p.price;
    const listPrice = `${(hasDiscount ? p.priceOld : p.price || 0).toFixed(2)} EGP`;
    const salePrice = hasDiscount ? `${(p.price||0).toFixed(2)} EGP` : '';
    return [escapeCSV(p.id),escapeCSV(p.name),escapeCSV((p.description||'').substring(0,5000)),escapeCSV(avail),escapeCSV('new'),escapeCSV(listPrice),escapeCSV(link),escapeCSV(img),escapeCSV(storeName),escapeCSV('Apparel & Accessories'),escapeCSV(salePrice)].join(',');
  });
  downloadFile('\uFEFF' + [headers.join(','),...rows].join('\n'), 'meta_catalog.csv', 'text/csv;charset=utf-8;');
  alert(`✅ تم تصدير ${products.length} منتج!\n\nارفع الملف على:\nMeta Business Suite → Commerce Manager → Catalog → Add Items → Use Data Feeds`);
}

function exportTikTokFeed(products, storeName, baseUrl) {
  const headers = ['sku_id','title','description','price','currency','main_image','product_detail_url','availability','condition','brand'];
  const rows = products.map(p => {
    const avail = p.stock > 0 ? 'in stock' : 'out of stock';
    const img = (p.images && p.images[0]) || '';
    const link = `${baseUrl}/product-detail.html?id=${p.id}`;
    return [p.sku||p.id, p.name, (p.description||'').substring(0,2000), (p.price||0).toFixed(2), 'EGP', img, link, avail, 'new', storeName].map(v=>String(v||'').replace(/\t/g,' ')).join('\t');
  });
  downloadFile('\uFEFF' + [headers.join('\t'),...rows].join('\n'), 'tiktok_catalog.tsv', 'text/tab-separated-values;charset=utf-8;');
  alert(`✅ تم تصدير ${products.length} منتج!\n\nارفع الملف على:\nTikTok Ads Manager → Assets → Catalog → Add Products → Upload File`);
}

function exportGoogleFeed(products, storeName, baseUrl) {
  const items = products.map(p => {
    const avail = p.stock > 0 ? 'in stock' : 'out of stock';
    const img = (p.images && p.images[0]) || '';
    const link = `${baseUrl}/product-detail.html?id=${p.id}`;
    const hasDiscount = p.priceOld && p.priceOld > p.price;
    const listPrice = `${(hasDiscount ? p.priceOld : p.price||0).toFixed(2)} EGP`;
    const salePriceTag = hasDiscount ? `<g:sale_price>${(p.price||0).toFixed(2)} EGP</g:sale_price>` : '';
    return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml((p.description||'').substring(0,5000))}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      ${img ? `<g:image_link>${escapeXml(img)}</g:image_link>` : ''}
      <g:availability>${avail}</g:availability>
      <g:condition>new</g:condition>
      <g:price>${listPrice}</g:price>
      ${salePriceTag}
      <g:brand>${escapeXml(storeName)}</g:brand>
      <g:google_product_category>Apparel &amp; Accessories</g:google_product_category>
      ${p.sku ? `<g:mpn>${escapeXml(p.sku)}</g:mpn>` : ''}
    </item>`;
  }).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n  <channel>\n    <title>${escapeXml(storeName)}</title>\n    <link>${escapeXml(baseUrl)}</link>\n    <description>${escapeXml(storeName + ' — كتالوج المنتجات')}</description>\n${items}\n  </channel>\n</rss>`;
  downloadFile(xml, 'google_feed.xml', 'application/xml;charset=utf-8;');
  alert(`✅ تم تصدير ${products.length} منتج!\n\nارفع الملف على:\nGoogle Merchant Center → Products → Feeds → Add feed`);
}

function exportSnapchatFeed(products, storeName, baseUrl) {
  const headers = ['id','title','description','availability','condition','price','link','image_url','brand'];
  const rows = products.map(p => {
    const avail = p.stock > 0 ? 'in stock' : 'out of stock';
    const img = (p.images && p.images[0]) || '';
    const link = `${baseUrl}/product-detail.html?id=${p.id}`;
    return [escapeCSV(p.id),escapeCSV(p.name),escapeCSV((p.description||'').substring(0,2000)),escapeCSV(avail),escapeCSV('new'),escapeCSV(`${(p.price||0).toFixed(2)} EGP`),escapeCSV(link),escapeCSV(img),escapeCSV(storeName)].join(',');
  });
  downloadFile('\uFEFF' + [headers.join(','),...rows].join('\n'), 'snapchat_catalog.csv', 'text/csv;charset=utf-8;');
  alert(`✅ تم تصدير ${products.length} منتج!\n\nارفع الملف على:\nSnapchat Ads Manager → Catalog → Add Products → Upload via file`);
}

// تحديث لوحة التحكم تلقائياً عند مزامنة الطلبات من Supabase
window.addEventListener('nasma:orders-synced', () => {
  if (typeof NasmaDB !== 'undefined' && NasmaDB.AdminAuth.isLoggedIn()) {
    const activeBtn = document.querySelector('.admin-menu-btn.active');
    if (activeBtn) {
      const tab = activeBtn.dataset.tab;
      if (tab === 'orders' && typeof loadOrdersList === 'function') loadOrdersList();
      if (tab === 'dashboard' && typeof loadDashboardStats === 'function') loadDashboardStats();
    }
  }
});
