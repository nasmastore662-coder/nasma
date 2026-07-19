/**
 * نسما ستور — طبقة البيانات المركزية
 * Nasma Store — Central Data Layer
 *
 * يدير جميع البيانات عبر localStorage:
 * - المنتجات    nasma_products
 * - التصنيفات   nasma_categories
 * - الطلبات     nasma_orders
 * - السلة       nasma_cart
 * - المفضلة     nasma_wishlist
 * - الكوبونات   nasma_coupons
 * - الإعدادات   nasma_store_settings
 */

'use strict';

/* ===========================================
   دوال تحويل الحقول لتطابق Supabase (camelCase <-> snake_case)
   =========================================== */
function toSnakeCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // تحويل الأحرف الكبيرة إلى شرطة سفلية وحرف صغير (مثال: priceOld -> price_old)
      // هذا التحويل سطحي (shallow) لضمان عدم تغيير الحقول المتداخلة مثل JSONB (items, customer)
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = obj[key];
    }
  }
  return newObj;
}

function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // تحويل الشرطة السفلية وحرف بعدها إلى حرف كبير (مثال: price_old -> priceOld)
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      newObj[camelKey] = obj[key];
    }
  }
  return newObj;
}

/* ===========================================
   ثوابت مفاتيح التخزين
   =========================================== */
const DB_KEYS = {
  PRODUCTS:      'nasma_products',
  CATEGORIES:    'nasma_categories',
  ORDERS:        'nasma_orders',
  CART:          'nasma_cart',
  WISHLIST:      'nasma_wishlist',
  COUPONS:       'nasma_coupons',
  SETTINGS:      'nasma_store_settings',
  ADMIN_PASS:    'nasma_admin_pass',
  SHIPPING:      'nasma_shipping_cities',
  LANDING_PAGES: 'nasma_landing_pages',
};

/* ===========================================
   أدوات عامة
   =========================================== */
const DB = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch { return false; }
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};

/* ===========================================
   التصنيفات
   =========================================== */
const CategoriesDB = {
  getAll() {
    return DB.get(DB_KEYS.CATEGORIES, []);
  },
  save(categories) {
    const success = DB.set(DB_KEYS.CATEGORIES, categories);
    if (success && window.supabaseClient) {
      window.supabaseClient.from('categories').upsert(categories.map(toSnakeCase)).then(({ error }) => {
        if (error) console.error('❌ Supabase error categories upsert:', error);
      });
    }
    return success;
  },
  add(category) {
    const list = this.getAll();
    const newCat = {
      id:    Date.now().toString(),
      name:  category.name || '',
      slug:  slugify(category.name || ''),
      icon:  category.icon || '🛍️',
      order: list.length,
      createdAt: new Date().toISOString(),
    };
    list.push(newCat);
    this.save(list);
    return newCat;
  },
  update(id, data) {
    const list = this.getAll();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...data, id };
    this.save(list);
    return true;
  },
  delete(id) {
    const list = this.getAll().filter(c => c.id !== id);
    this.save(list);
    if (window.supabaseClient) {
      window.supabaseClient.from('categories').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('❌ Supabase error category delete:', error);
      });
    }
  },
  getById(id) {
    return this.getAll().find(c => c.id === id) || null;
  },
};

/* ===========================================
   المنتجات
   =========================================== */
const ProductsDB = {
  getAll() {
    return DB.get(DB_KEYS.PRODUCTS, []);
  },
  save(products) {
    const success = DB.set(DB_KEYS.PRODUCTS, products);
    if (success && window.supabaseClient) {
      window.supabaseClient.from('products').upsert(products.map(toSnakeCase)).then(({ error }) => {
        if (error) console.error('❌ Supabase error products upsert:', error);
      });
    }
    return success;
  },
  add(product) {
    const list = this.getAll();
    const newProduct = {
      id:          Date.now().toString(),
      name:        product.name || '',
      description: product.description || '',
      price:       parseFloat(product.price) || 0,
      priceOld:    parseFloat(product.priceOld) || 0,
      categoryId:  product.categoryId || '',
      images:      product.images || [],   // array of base64 or URLs
      badge:       product.badge || '',    // 'new' | 'sale' | 'sold_out' | ''
      stock:       parseInt(product.stock) || 0,
      sizes:       product.sizes || [],    // e.g. ['S','M','L','XL']
      colors:      product.colors || [],   // e.g. ['أسود','بيج','كحلي']
      rating:      parseFloat(product.rating) || 5,
      reviewCount: parseInt(product.reviewCount) || 0,
      featured:    product.featured || false,
      active:      product.active !== false,
      sku:         product.sku || `SKU-${Date.now()}`,
      soldCount:   parseInt(product.soldCount) || 0,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    };
    list.push(newProduct);
    this.save(list);
    return newProduct;
  },
  update(id, data) {
    const list = this.getAll();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...data, id, updatedAt: new Date().toISOString() };
    this.save(list);
    return list[idx];
  },
  delete(id) {
    const list = this.getAll().filter(p => p.id !== id);
    this.save(list);
    if (window.supabaseClient) {
      window.supabaseClient.from('products').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('❌ Supabase error product delete:', error);
      });
    }
  },
  sellProduct(id, qty) {
    const list = this.getAll();
    const idx = list.findIndex(p => p.id === id);
    if (idx !== -1) {
      const p = list[idx];
      p.stock = Math.max(0, p.stock - qty);
      p.soldCount = (p.soldCount || 0) + qty;
      p.updatedAt = new Date().toISOString();
      this.save(list);
      return p;
    }
    return null;
  },
  restoreProductStock(id, qty) {
    const list = this.getAll();
    const idx = list.findIndex(p => p.id === id);
    if (idx !== -1) {
      const p = list[idx];
      p.stock = p.stock + qty;
      p.soldCount = Math.max(0, (p.soldCount || 0) - qty);
      p.updatedAt = new Date().toISOString();
      this.save(list);
      return p;
    }
    return null;
  },
  getById(id) {
    return this.getAll().find(p => p.id === id) || null;
  },
  getByCategory(categoryId) {
    return this.getAll().filter(p => p.categoryId === categoryId && p.active);
  },
  getFeatured() {
    return this.getAll().filter(p => p.featured && p.active);
  },
  getActive() {
    return this.getAll().filter(p => p.active);
  },
  search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return this.getActive();
    return this.getActive().filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  },
  filter({ categoryId, minPrice, maxPrice, minRating, sortBy } = {}) {
    let list = this.getActive();
    if (categoryId)              list = list.filter(p => p.categoryId === categoryId);
    if (minPrice !== undefined)  list = list.filter(p => p.price >= minPrice);
    if (maxPrice !== undefined)  list = list.filter(p => p.price <= maxPrice);
    if (minRating !== undefined) list = list.filter(p => p.rating >= minRating);

    switch (sortBy) {
      case 'price_asc':    list.sort((a,b) => a.price - b.price);       break;
      case 'price_desc':   list.sort((a,b) => b.price - a.price);       break;
      case 'rating':       list.sort((a,b) => b.rating - a.rating);     break;
      case 'newest':       list.sort((a,b) => b.createdAt.localeCompare(a.createdAt)); break;
      case 'popular':      list.sort((a,b) => b.reviewCount - a.reviewCount); break;
      default:             list.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    }
    return list;
  },
};

/* ===========================================
   السلة
   =========================================== */
const CartDB = {
  get() {
    return DB.get(DB_KEYS.CART, []);
  },
  save(cart) {
    DB.set(DB_KEYS.CART, cart);
    this._dispatch();
  },
  add(productId, qty = 1, options = {}) {
    const cart = this.get();
    const key = `${productId}__${options.size || ''}__${options.color || ''}`;
    const existing = cart.find(i => i.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      const product = ProductsDB.getById(productId);
      if (!product) return false;
      cart.push({
        key,
        productId,
        name:    product.name,
        price:   product.price,
        image:   product.images[0] || '',
        size:    options.size  || '',
        color:   options.color || '',
        qty,
      });
    }
    this.save(cart);

    // إطلاق حدث البيكسل للإضافة للسلة
    const product = ProductsDB.getById(productId);
    if (product && typeof window.nasmaTrackAddToCart === 'function') {
      window.nasmaTrackAddToCart(product, qty);
    }

    return true;
  },
  remove(key) {
    this.save(this.get().filter(i => i.key !== key));
  },
  updateQty(key, qty) {
    const cart = this.get();
    const item = cart.find(i => i.key === key);
    if (item) { item.qty = Math.max(1, qty); this.save(cart); }
  },
  clear() {
    this.save([]);
  },
  count() {
    return this.get().reduce((s, i) => s + i.qty, 0);
  },
  subtotal() {
    return this.get().reduce((s, i) => s + i.price * i.qty, 0);
  },
  total(discount = 0, shipping = 0) {
    return Math.max(0, this.subtotal() - discount + shipping);
  },
  _dispatch() {
    window.dispatchEvent(new CustomEvent('nasma:cart-updated', {
      detail: { count: this.count(), subtotal: this.subtotal() }
    }));
  },
};

/* ===========================================
   المفضلة
   =========================================== */
const WishlistDB = {
  get() {
    return DB.get(DB_KEYS.WISHLIST, []);
  },
  toggle(productId) {
    let list = this.get();
    if (list.includes(productId)) {
      list = list.filter(id => id !== productId);
    } else {
      list.push(productId);
      // إطلاق حدث البيكسل لإضافة المفضلة
      const product = ProductsDB.getById(productId);
      if (product && typeof window.nasmaTrackAddToWishlist === 'function') {
        window.nasmaTrackAddToWishlist(product);
      }
    }
    DB.set(DB_KEYS.WISHLIST, list);
    window.dispatchEvent(new CustomEvent('nasma:wishlist-updated', { detail: { list } }));
    return list.includes(productId);
  },
  has(productId) {
    return this.get().includes(productId);
  },
  clear() {
    DB.set(DB_KEYS.WISHLIST, []);
  },
  getProducts() {
    const ids = this.get();
    return ids.map(id => ProductsDB.getById(id)).filter(Boolean);
  },
};

/* ===========================================
   الطلبات
   =========================================== */
const OrdersDB = {
  getAll() {
    return DB.get(DB_KEYS.ORDERS, []);
  },
  save(orders) {
    DB.set(DB_KEYS.ORDERS, orders);
  },
  create(orderData) {
    const orders = this.getAll();
    const order = {
      id:         `ORD-${Date.now()}`,
      orderNumber: `N-${Math.floor(10000 + Math.random() * 90000)}`,
      items:      orderData.items || [],
      customer:   orderData.customer || {},
      subtotal:   orderData.subtotal || 0,
      discount:   orderData.discount || 0,
      shipping:   orderData.shipping || 0,
      total:      orderData.total || 0,
      couponCode: orderData.couponCode || '',
      paymentMethod: 'الدفع عند الاستلام',
      status:     'pending',   // pending | processing | shipped | delivered | cancelled
      notes:      orderData.notes || '',
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    };
    orders.unshift(order);
    this.save(orders);

    if (order.couponCode) {
      CouponsDB.use(order.couponCode);
    }

    // رفع الطلب مباشرة إلى Supabase
    if (window.supabaseClient) {
      window.supabaseClient.from('orders').insert([toSnakeCase(order)]).then(({ error }) => {
        if (error) console.error('❌ Supabase error order insert:', error);
      });
    }

    // إطلاق حدث البيكسل للشراء الناجح
    if (typeof window.nasmaTrackPurchase === 'function') {
      window.nasmaTrackPurchase(order);
    }

    return order;
  },
  updateStatus(id, status) {
    const orders = this.getAll();
    const order = orders.find(o => o.id === id);
    if (order) {
      const oldStatus = order.status;
      order.status = status;
      order.updatedAt = new Date().toISOString();
      this.save(orders);

      // تحديث الحالة في Supabase
      if (window.supabaseClient) {
        window.supabaseClient.from('orders')
          .update(toSnakeCase({ status: status, updatedAt: order.updatedAt }))
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error('❌ Supabase error order status update:', error);
          });
      }

      // الحالات التي تعتبر "منفذة" أو جاري تنفيذها
      const executedStatuses = ['processing', 'shipped', 'delivered'];
      const isOldExecuted = executedStatuses.includes(oldStatus);
      const isNewExecuted = executedStatuses.includes(status);

      if (!isOldExecuted && isNewExecuted) {
        // تحول من حالة غير منفذة (معلق أو ملغي) إلى حالة منفذة -> نخفض المخزن ونزيد المبيعات
        order.items.forEach(item => {
          ProductsDB.sellProduct(item.productId, item.qty);
        });
      } else if (isOldExecuted && !isNewExecuted) {
        // تحول من حالة منفذة إلى حالة غير منفذة (معلق أو ملغي) -> نرجع المنتجات للمخزن وننقص المبيعات
        order.items.forEach(item => {
          ProductsDB.restoreProductStock(item.productId, item.qty);
        });
      }

      return true;
    }
    return false;
  },
  getById(id) {
    return this.getAll().find(o => o.id === id) || null;
  },
  delete(id) {
    const orders = this.getAll();
    const index = orders.findIndex(o => o.id === id);
    if (index > -1) {
      const order = orders[index];
      // استعادة كميات المخزن إذا كان الطلب بحالة منفذة
      const executedStatuses = ['processing', 'shipped', 'delivered'];
      if (executedStatuses.includes(order.status)) {
        order.items.forEach(item => {
          ProductsDB.restoreProductStock(item.productId, item.qty);
        });
      }
      orders.splice(index, 1);
      this.save(orders);

      // حذف الطلب من Supabase
      if (window.supabaseClient) {
        window.supabaseClient.from('orders')
          .delete()
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error('❌ Supabase error order delete:', error);
          });
      }

      return true;
    }
    return false;
  },
  update(id, updatedData) {
    const orders = this.getAll();
    const order = orders.find(o => o.id === id);
    if (order) {
      if (updatedData.customer) {
        order.customer = {
          ...order.customer,
          ...updatedData.customer
        };
      }
      if (updatedData.total !== undefined) order.total = updatedData.total;
      if (updatedData.subtotal !== undefined) order.subtotal = updatedData.subtotal;
      if (updatedData.discount !== undefined) order.discount = updatedData.discount;
      if (updatedData.shipping !== undefined) order.shipping = updatedData.shipping;
      if (updatedData.notes !== undefined) order.notes = updatedData.notes;
      order.updatedAt = new Date().toISOString();
      this.save(orders);

      // تحديث البيانات في Supabase
      if (window.supabaseClient) {
        window.supabaseClient.from('orders')
          .update(toSnakeCase({
            customer: order.customer,
            total: order.total,
            subtotal: order.subtotal,
            discount: order.discount,
            shipping: order.shipping,
            notes: order.notes,
            updatedAt: order.updatedAt
          }))
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error('❌ Supabase error order update:', error);
          });
      }

      return true;
    }
    return false;
  },
  getStats() {
    const orders = this.getAll();
    const revenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((s, o) => s + o.total, 0);
    const byStatus = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});
    return {
      total:      orders.length,
      revenue,
      pending:    byStatus.pending    || 0,
      processing: byStatus.processing || 0,
      shipped:    byStatus.shipped    || 0,
      delivered:  byStatus.delivered  || 0,
      cancelled:  byStatus.cancelled  || 0,
    };
  },
};

/* ===========================================
   الكوبونات
   =========================================== */
const CouponsDB = {
  getAll() {
    return DB.get(DB_KEYS.COUPONS, []);
  },
  save(coupons) {
    const success = DB.set(DB_KEYS.COUPONS, coupons);
    if (success && window.supabaseClient) {
      window.supabaseClient.from('coupons').upsert(coupons.map(toSnakeCase)).then(({ error }) => {
        if (error) console.error('❌ Supabase error coupons upsert:', error);
      });
    }
    return success;
  },
  add(coupon) {
    const list = this.getAll();
    const newCoupon = {
      id:           Date.now().toString(),
      code:         coupon.code.toUpperCase(),
      type:         coupon.type || 'percent',   // 'percent' | 'fixed'
      value:        parseFloat(coupon.value) || 0,
      minOrder:     parseFloat(coupon.minOrder) || 0,
      freeShipping: !!coupon.freeShipping,
      maxUses:      parseInt(coupon.maxUses) || 0,
      usedCount:    0,
      active:       true,
      expiresAt:    coupon.expiresAt || null,
      createdAt:    new Date().toISOString(),
      restrictedTo: coupon.restrictedTo || 'none', // 'none' | 'category' | 'products'
      categoryId:   coupon.categoryId || '',
      productIds:   coupon.productIds || [],
    };
    list.push(newCoupon);
    this.save(list);
    return newCoupon;
  },
  update(id, data) {
    const list = this.getAll();
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        code:         data.code.toUpperCase(),
        type:         data.type || 'percent',
        value:        parseFloat(data.value) || 0,
        minOrder:     parseFloat(data.minOrder) || 0,
        freeShipping: !!data.freeShipping,
        restrictedTo: data.restrictedTo || 'none',
        categoryId:   data.categoryId || '',
        productIds:   data.productIds || [],
        updatedAt:    new Date().toISOString(),
      };
      this.save(list);
      return list[idx];
    }
    return null;
  },
  validate(code, cartSubtotal) {
    const coupon = this.getAll().find(
      c => c.code === code.toUpperCase() && c.active
    );
    if (!coupon) return { valid: false, error: 'الكود غير صحيح' };
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)
      return { valid: false, error: 'انتهت استخدامات هذا الكود' };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
      return { valid: false, error: 'انتهت صلاحية هذا الكود' };
    if (cartSubtotal < coupon.minOrder)
      return { valid: false, error: `الحد الأدنى للطلب ${formatPrice(coupon.minOrder)}` };

    let eligibleSubtotal = cartSubtotal;

    if (coupon.restrictedTo === 'category') {
      const cart = CartDB.get();
      const eligibleItems = cart.filter(item => {
        const prod = ProductsDB.getById(item.productId);
        return prod && prod.categoryId === coupon.categoryId;
      });
      if (eligibleItems.length === 0) {
        const cat = CategoriesDB.getById(coupon.categoryId);
        const catName = cat ? cat.name : 'التصنيف المحدد';
        return { valid: false, error: `هذا الكوبون صالح فقط لمنتجات من تصنيف: (${catName})` };
      }
      eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    } else if (coupon.restrictedTo === 'products') {
      const cart = CartDB.get();
      const eligibleItems = cart.filter(item => {
        return coupon.productIds && coupon.productIds.includes(item.productId);
      });
      if (eligibleItems.length === 0) {
        return { valid: false, error: 'هذا الكوبون غير صالح للمنتجات الحالية في السلة' };
      }
      eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    }

    const discount = coupon.type === 'percent'
      ? (eligibleSubtotal * coupon.value / 100)
      : coupon.value;

    return { valid: true, coupon, discount: Math.min(discount, eligibleSubtotal) };
  },
  use(code) {
    const list = this.getAll();
    const c = list.find(c => c.code === code.toUpperCase());
    if (c) { c.usedCount++; this.save(list); }
  },
  delete(id) {
    this.save(this.getAll().filter(c => c.id !== id));
    if (window.supabaseClient) {
      window.supabaseClient.from('coupons').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('❌ Supabase error coupon delete:', error);
      });
    }
  },
  toggle(id) {
    const list = this.getAll();
    const c = list.find(c => c.id === id);
    if (c) { c.active = !c.active; this.save(list); }
  },
};

/* ===========================================
   الشحن للمحافظات
   =========================================== */
const ShippingDB = {
  getAll() {
    return DB.get(DB_KEYS.SHIPPING, []);
  },
  save(cities) {
    const success = DB.set(DB_KEYS.SHIPPING, cities);
    if (success && window.supabaseClient) {
      window.supabaseClient.from('shipping_cities').upsert(cities.map(toSnakeCase)).then(({ error }) => {
        if (error) console.error('❌ Supabase error shipping_cities upsert:', error);
      });
    }
    return success;
  },
  updateCost(name, cost) {
    const list = this.getAll();
    const city = list.find(c => c.name === name);
    if (city) {
      city.cost = parseFloat(cost) || 0;
      this.save(list);
      return true;
    }
    return false;
  },
  getCost(name) {
    const city = this.getAll().find(c => c.name === name);
    return city ? city.cost : 0;
  }
};

/* ===========================================
   صفحات الهبوط — Landing Pages
   =========================================== */
const LandingPagesDB = {
  getAll() {
    return DB.get(DB_KEYS.LANDING_PAGES, {});
  },
  save(pages) {
    const success = DB.set(DB_KEYS.LANDING_PAGES, pages);
    return success;
  },
  getByProductId(productId) {
    const pages = this.getAll();
    return pages[productId] || null;
  },
  set(productId, config) {
    const pages = this.getAll();
    const existing = pages[productId] || {};
    pages[productId] = {
      ...existing,
      ...config,
      productId,
      updatedAt: new Date().toISOString(),
      createdAt: existing.createdAt || new Date().toISOString(),
      views: existing.views || 0,
    };
    this.save(pages);
    // ─── مزامنة مع Supabase ───
    if (window.supabaseClient) {
      const row = this._toRow(pages[productId]);
      window.supabaseClient.from('landing_pages').upsert([row], { onConflict: 'product_id' }).then(({ error }) => {
        if (error) console.error('❌ Supabase landing_pages upsert error:', error);
        else console.log('☁️ landing_pages synced to Supabase for product:', productId);
      });
    }
    return pages[productId];
  },
  activate(productId) {
    const pages = this.getAll();
    if (pages[productId]) {
      pages[productId].active = true;
      pages[productId].updatedAt = new Date().toISOString();
      this.save(pages);
      if (window.supabaseClient) {
        window.supabaseClient.from('landing_pages').update({ active: true, updated_at: pages[productId].updatedAt }).eq('product_id', productId).then(({ error }) => {
          if (error) console.error('❌ Supabase landing_pages activate error:', error);
        });
      }
    }
  },
  deactivate(productId) {
    const pages = this.getAll();
    if (pages[productId]) {
      pages[productId].active = false;
      pages[productId].updatedAt = new Date().toISOString();
      this.save(pages);
      if (window.supabaseClient) {
        window.supabaseClient.from('landing_pages').update({ active: false, updated_at: pages[productId].updatedAt }).eq('product_id', productId).then(({ error }) => {
          if (error) console.error('❌ Supabase landing_pages deactivate error:', error);
        });
      }
    }
  },
  toggle(productId) {
    const pages = this.getAll();
    if (pages[productId]) {
      pages[productId].active = !pages[productId].active;
      pages[productId].updatedAt = new Date().toISOString();
      this.save(pages);
      const newActive = pages[productId].active;
      if (window.supabaseClient) {
        window.supabaseClient.from('landing_pages').update({ active: newActive, updated_at: pages[productId].updatedAt }).eq('product_id', productId).then(({ error }) => {
          if (error) console.error('❌ Supabase landing_pages toggle error:', error);
        });
      }
      return newActive;
    }
    return false;
  },
  incrementViews(productId) {
    const pages = this.getAll();
    if (pages[productId]) {
      pages[productId].views = (pages[productId].views || 0) + 1;
      this.save(pages);
      if (window.supabaseClient) {
        window.supabaseClient.from('landing_pages').update({ views: pages[productId].views }).eq('product_id', productId).then(({ error }) => {
          if (error) console.error('❌ Supabase landing_pages views update error:', error);
        });
      }
    }
  },
  delete(productId) {
    const pages = this.getAll();
    delete pages[productId];
    this.save(pages);
    if (window.supabaseClient) {
      window.supabaseClient.from('landing_pages').delete().eq('product_id', productId).then(({ error }) => {
        if (error) console.error('❌ Supabase landing_pages delete error:', error);
      });
    }
  },
  isActive(productId) {
    const page = this.getByProductId(productId);
    return page && page.active === true;
  },
  // ─── تحويل الكائن الداخلي إلى صف Supabase ───
  _toRow(page) {
    return {
      product_id:   page.productId,
      headline:     page.headline     || '',
      subheadline:  page.subheadline  || '',
      urgency:      page.urgency      || '',
      cta_btn:      page.ctaBtn       || '',
      badge_text:   page.badgeText    || '',
      features:     page.features     || [],
      testimonials: page.testimonials || [],
      theme:        page.theme        || 'gold',
      active:       page.active       !== false,
      views:        page.views        || 0,
      created_at:   page.createdAt    || new Date().toISOString(),
      updated_at:   page.updatedAt    || new Date().toISOString(),
    };
  },
  // ─── تحويل صف Supabase إلى الكائن الداخلي ───
  _fromRow(row) {
    return {
      productId:    row.product_id,
      headline:     row.headline     || '',
      subheadline:  row.subheadline  || '',
      urgency:      row.urgency      || '',
      ctaBtn:       row.cta_btn      || '',
      badgeText:    row.badge_text   || '',
      features:     Array.isArray(row.features)     ? row.features     : [],
      testimonials: Array.isArray(row.testimonials) ? row.testimonials : [],
      theme:        row.theme        || 'gold',
      active:       row.active       !== false,
      views:        row.views        || 0,
      createdAt:    row.created_at   || new Date().toISOString(),
      updatedAt:    row.updated_at   || new Date().toISOString(),
    };
  },
};

/* ===========================================
   الإعدادات
   =========================================== */
const SettingsDB = {
  get() {
    return DB.get(DB_KEYS.SETTINGS, {
      storeName:      'نسما',
      storeDesc:      'متجر متخصص في العبايات والشنط والإكسسوارات النسائية الراقية',
      storePhone:     '',
      storeEmail:     '',
      storeAddress:   '',
      instagram:      '',
      tiktok:         '',
      snapchat:       '',
      whatsapp:       '',
      facebook:       '',
      shippingFee:    0,
      freeShippingMin:2000,
      fontPrimary:    'Tajawal',
      fontDisplay:    'Amiri',
      colorPrimary:   '#C4A882',
      colorSecondary: '#E8D5B0',
      colorBg:        '#FAF8F5',
      colorText:      '#2C2C2C',
      logoDataUrl:    null,
      heroBadge:      '✦ كولكشن صيف 2025',
      heroTitle:      'أناقة تعبّر <span>عنكِ</span>',
      heroDesc:       'اكتشفي تشكيلة نسما الحصرية من العبايات الفاخرة والشنط العصرية والإكسسوارات الأنيقة. أسلوب يجمع بين الأصالة والمعاصرة.',
      announcementBar:'🌸 شحن آمن لجميع المناطق والمحافظات في أسرع وقت',
      // ── بانرات صفحة المستخدم ──
      promoBannerEnabled:  true,
      promoLabel:          '✦ عرض محدود',
      promoTitle:          'نهاية الموسم\nبأسعار لا تُصدَّق',
      promoDesc:           'احصلي على أجمل قطع الكولكشن بخصومات تصل حتى 40% على مختارات فاخرة من عبايات وشنط وإكسسوارات نسما.',
      promoDiscount:       '40',
      promoBtnText:        'تسوقي العروض',
      promoBtnLink:        'products.html',
      // ── النشرة البريدية ──
      newsletterEnabled:   true,
      newsletterTitle:     'كوني أول من يعلم',
      newsletterDesc:      'اشتركي في نشرتنا البريدية لتصلكِ أحدث التصاميم والعروض الحصرية قبل الجميع.',
    });
  },
  set(settings) {
    DB.set(DB_KEYS.SETTINGS, settings);
    if (window.supabaseClient) {
      const payload = { ...settings, id: 'settings' };
      window.supabaseClient.from('store_settings').upsert([toSnakeCase(payload)]).then(({ error }) => {
        if (error) console.error('❌ Supabase error store_settings upsert:', error);
      });
    }
  },
  update(partial) {
    this.set({ ...this.get(), ...partial });
  },
};

/* ===========================================
   لوحة التحكم — كلمة المرور
   =========================================== */
const AdminAuth = {
  DEFAULT_USER: 'admin',
  DEFAULT_PASS: 'nasma2025',
  DEFAULT_SETTINGS_PASS: 'settings123',

  getUser() {
    return DB.get('nasma_admin_user', this.DEFAULT_USER);
  },
  getHash() {
    return DB.get(DB_KEYS.ADMIN_PASS, this._hash(this.DEFAULT_PASS));
  },
  getSettingsPassHash() {
    return DB.get('nasma_settings_pass_hash', this._hash(this.DEFAULT_SETTINGS_PASS));
  },
  _hash(str) {
    // hash بسيط (ليس للإنتاج الحقيقي)
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return h.toString(36);
  },
  verify(user, pass) {
    return user === this.getUser() && this._hash(pass) === this.getHash();
  },
  verifySettingsPass(pass) {
    return this._hash(pass) === this.getSettingsPassHash();
  },
  changePassword(newPass) {
    DB.set(DB_KEYS.ADMIN_PASS, this._hash(newPass));
    return true;
  },
  changeSettingsPassword(newPass) {
    DB.set('nasma_settings_pass_hash', this._hash(newPass));
    return true;
  },
  setUser(newUser) {
    DB.set('nasma_admin_user', newUser);
  },
  isLoggedIn() {
    return sessionStorage.getItem('nasma_admin_session') === 'true';
  },
  login(user, pass) {
    if (this.verify(user, pass)) {
      sessionStorage.setItem('nasma_admin_session', 'true');
      return true;
    }
    return false;
  },
  logout() {
    sessionStorage.removeItem('nasma_admin_session');
  },
};

/* ===========================================
   أدوات مساعدة مشتركة
   =========================================== */
function formatPrice(amount, currency = 'ج.م') {
  return `${parseFloat(amount || 0).toLocaleString('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })} ${currency}`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF-]/g, '')
    .replace(/--+/g, '-')
    .trim();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60)  return `منذ ${mins} دقيقة`;
  if (hours < 24)  return `منذ ${hours} ساعة`;
  return `منذ ${days} يوم`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function orderStatusLabel(status) {
  const map = {
    pending:    { label: 'معلق',          color: '#F59E0B' },
    processing: { label: 'قيد التنفيذ',   color: '#3B82F6' },
    shipped:    { label: 'تم الشحن',      color: '#8B5CF6' },
    delivered:  { label: 'تم التسليم',    color: '#10B981' },
    cancelled:  { label: 'ملغي',          color: '#EF4444' },
  };
  return map[status] || { label: status, color: '#9CA3AF' };
}

function starsHTML(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function generateOrderId() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/* ===========================================
   تحديث شارة السلة في الهيدر
   =========================================== */
function updateCartBadge() {
  const count = CartDB.count();
  document.querySelectorAll('#cart-badge, .cart-badge-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

// ===========================================
// تهيئة تلقائية لقاعدة البيانات (Initial Database Seeding)
// ===========================================
function initDatabase() {
  // 1. تهيئة التصنيفات الافتراضية
  const cats = localStorage.getItem(DB_KEYS.CATEGORIES);
  if (!cats) {
    const defaultCats = [
      { id: 'abaya', name: 'عبايات', slug: 'abaya', icon: '🧥', order: 0, createdAt: new Date().toISOString() },
      { id: 'bags', name: 'شنط', slug: 'bags', icon: '👜', order: 1, createdAt: new Date().toISOString() },
      { id: 'accessories', name: 'إكسسوارات', slug: 'accessories', icon: '✨', order: 2, createdAt: new Date().toISOString() }
    ];
    localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(defaultCats));
  }

  // 2. تهيئة الكوبونات الافتراضية
  const coupons = localStorage.getItem(DB_KEYS.COUPONS);
  if (!coupons) {
    const defaultCoupons = [
      { id: 'c1', code: 'NASMA10', type: 'percent', value: 10, minOrder: 100, freeShipping: false, maxUses: 1000, usedCount: 0, active: true, expiresAt: null, createdAt: new Date().toISOString() },
      { id: 'c2', code: 'WELCOME', type: 'fixed', value: 50, minOrder: 300, freeShipping: true, maxUses: 500, usedCount: 0, active: true, expiresAt: null, createdAt: new Date().toISOString() }
    ];
    localStorage.setItem(DB_KEYS.COUPONS, JSON.stringify(defaultCoupons));
  }

  // 3. تهيئة المنتجات الافتراضية (يمكن تعديلها أو حذفها بالكامل من لوحة التحكم)
  const prods = localStorage.getItem(DB_KEYS.PRODUCTS);
  if (!prods) {
    const defaultProds = [
      {
        id: 'p1',
        name: 'عباية كلاسيكية فاخرة',
        description: 'عباية صيفية سوداء منسوجة من الحرير الطبيعي الفاخر بتصميم كلاسيكي ناعم يناسب كافة المناسبات.',
        price: 350,
        priceOld: 480,
        categoryId: 'abaya',
        images: ['assets/images/prod-1.png'],
        badge: 'sale',
        stock: 12,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['أسود'],
        rating: 4.8,
        reviewCount: 24,
        featured: true,
        active: true,
        sku: 'AB-CLASSIC-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'p2',
        name: 'حقيبة كتف جلدية راقية',
        description: 'حقيبة يد نسائية مصنوعة من الجلد الطبيعي بلون كشميري هادئ وتصميم عصري عملي.',
        price: 280,
        priceOld: 280,
        categoryId: 'bags',
        images: ['assets/images/prod-2.png'],
        badge: 'new',
        stock: 8,
        sizes: ['S', 'M', 'L'],
        colors: ['كشميري', 'بيج'],
        rating: 4.9,
        reviewCount: 18,
        featured: true,
        active: true,
        sku: 'BG-LUX-02',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(defaultProds));
  }

  // 4. تهيئة محافظات الشحن الافتراضية
  const shippingCities = localStorage.getItem(DB_KEYS.SHIPPING);
  if (!shippingCities) {
    const defaultCities = [
      { name: 'القاهرة', cost: 50 },
      { name: 'الجيزة', cost: 50 },
      { name: 'الإسكندرية', cost: 60 },
      { name: 'القليوبية', cost: 55 },
      { name: 'الدقهلية', cost: 65 },
      { name: 'الغربية', cost: 65 },
      { name: 'المنوفية', cost: 65 },
      { name: 'الشرقية', cost: 65 },
      { name: 'البحيرة', cost: 70 },
      { name: 'دمياط', cost: 70 },
      { name: 'كفر الشيخ', cost: 70 },
      { name: 'بورسعيد', cost: 70 },
      { name: 'الإسماعيلية', cost: 70 },
      { name: 'السويس', cost: 70 },
      { name: 'الفيوم', cost: 75 },
      { name: 'بني سويف', cost: 75 },
      { name: 'المنيا', cost: 80 },
      { name: 'أسيوط', cost: 80 },
      { name: 'سوهاج', cost: 85 },
      { name: 'قنا', cost: 85 },
      { name: 'الأقصر', cost: 90 },
      { name: 'أسوان', cost: 95 },
      { name: 'البحر الأحمر', cost: 90 },
      { name: 'الوادي الجديد', cost: 100 },
      { name: 'مطروح', cost: 100 },
      { name: 'شمال سيناء', cost: 100 },
      { name: 'جنوب سيناء', cost: 100 }
    ];
    localStorage.setItem(DB_KEYS.SHIPPING, JSON.stringify(defaultCities));
  }
}

// ===========================================
// المزامنة مع Supabase (Supabase Background Synchronization)
// ===========================================
async function syncWithSupabase() {
  if (!window.supabaseClient) {
    console.log('ℹ️ المزامنة مع Supabase غير نشطة لعدم توفر المفاتيح.');
    return;
  }

  const path = location.pathname;
  const isAdmin = path.includes('admin.html');
  const isCheckoutOrCart = path.includes('checkout.html') || path.includes('cart.html');

  // تحديد ما إذا كان يجب مزامنة كل جدول حسب الصفحة الحالية لتوفير الطاقة والشبكة
  const isLanding = path.includes('landing.html');
  const syncCats = true;
  const syncProds = true;
  const syncSettings = true;
  const syncCoupons = isAdmin || isCheckoutOrCart;
  const syncShipping = isAdmin || isCheckoutOrCart || isLanding;
  const syncOrders = isAdmin;
  const syncLandingPages = isAdmin || isLanding;

  console.log(`🔄 جاري المزامنة بالتوازي مع Supabase (التحميل المخصص للمسار: ${path})...`);

  try {
    const promises = [];
    const keys = [];

    if (syncCats) {
      promises.push(window.supabaseClient.from('categories').select('*').order('order', { ascending: true }));
      keys.push('categories');
    }
    if (syncProds) {
      promises.push(window.supabaseClient.from('products').select('*'));
      keys.push('products');
    }
    if (syncCoupons) {
      promises.push(window.supabaseClient.from('coupons').select('*'));
      keys.push('coupons');
    }
    if (syncShipping) {
      promises.push(window.supabaseClient.from('shipping_cities').select('*'));
      keys.push('shipping_cities');
    }
    if (syncSettings) {
      promises.push(window.supabaseClient.from('store_settings').select('*').eq('id', 'settings').maybeSingle());
      keys.push('store_settings');
    }
    if (syncOrders) {
      promises.push(window.supabaseClient.from('orders').select('*').order('created_at', { ascending: false }));
      keys.push('orders');
    }
    if (syncLandingPages) {
      promises.push(window.supabaseClient.from('landing_pages').select('*'));
      keys.push('landing_pages');
    }

    const results = await Promise.all(promises);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const { data, error } = results[i];

      if (error) {
        console.error(`❌ Supabase sync error for ${key}:`, error);
        continue;
      }

      if (key === 'categories' && data) {
        if (data.length > 0) {
          localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(data.map(toCamelCase)));
        } else {
          const localCats = CategoriesDB.getAll();
          if (localCats.length > 0) {
            await window.supabaseClient.from('categories').insert(localCats.map(toSnakeCase));
          }
        }
      }

      if (key === 'products' && data) {
        if (data.length > 0) {
          localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(data.map(toCamelCase)));
        } else {
          const localProds = ProductsDB.getAll();
          if (localProds.length > 0) {
            await window.supabaseClient.from('products').insert(localProds.map(toSnakeCase));
          }
        }
      }

      if (key === 'coupons' && data) {
        if (data.length > 0) {
          localStorage.setItem(DB_KEYS.COUPONS, JSON.stringify(data.map(toCamelCase)));
        } else {
          const localCoupons = CouponsDB.getAll();
          if (localCoupons.length > 0) {
            await window.supabaseClient.from('coupons').insert(localCoupons.map(toSnakeCase));
          }
        }
      }

      if (key === 'shipping_cities' && data) {
        if (data.length > 0) {
          localStorage.setItem(DB_KEYS.SHIPPING, JSON.stringify(data.map(toCamelCase)));
        } else {
          const localCities = ShippingDB.getAll();
          if (localCities.length > 0) {
            await window.supabaseClient.from('shipping_cities').insert(localCities.map(toSnakeCase));
          }
        }
      }

      if (key === 'store_settings') {
        if (data) {
          localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(toCamelCase(data)));
        } else {
          const s = SettingsDB.get();
          const settingsPayload = {
            id: 'settings',
            store_name:           s.storeName        || 'نسما',
            store_desc:           s.storeDesc        || '',
            store_phone:          s.storePhone       || '',
            store_email:          s.storeEmail       || '',
            store_address:        s.storeAddress     || '',
            instagram:            s.instagram        || '',
            tiktok:               s.tiktok           || '',
            snapchat:             s.snapchat         || '',
            whatsapp:             s.whatsapp         || '',
            facebook:             s.facebook         || '',
            shipping_fee:         s.shippingFee      || 0,
            free_shipping_min:    s.freeShippingMin  || 2000,
            font_primary:         s.fontPrimary      || 'Tajawal',
            font_display:         s.fontDisplay      || 'Amiri',
            color_primary:        s.colorPrimary     || '#C4A882',
            color_secondary:      s.colorSecondary   || '#E8D5B0',
            color_bg:             s.colorBg          || '#FAF8F5',
            color_text:           s.colorText        || '#2C2C2C',
            logo_data_url:        s.logoDataUrl      || null,
            hero_badge:           s.heroBadge        || '',
            hero_title:           s.heroTitle        || '',
            hero_desc:            s.heroDesc         || '',
            announcement_bar:     s.announcementBar  || '',
            promo_banner_enabled: s.promoBannerEnabled !== false,
            promo_label:          s.promoLabel       || '',
            promo_title:          s.promoTitle       || '',
            promo_desc:           s.promoDesc        || '',
            promo_discount:       s.promoDiscount    || '',
            promo_btn_text:       s.promoBtnText     || '',
            promo_btn_link:       s.promoBtnLink     || '',
            newsletter_enabled:   s.newsletterEnabled !== false,
            newsletter_title:     s.newsletterTitle  || '',
            newsletter_desc:      s.newsletterDesc   || '',
          };
          const { error: insertErr } = await window.supabaseClient.from('store_settings').upsert([settingsPayload], { onConflict: 'id' });
          if (insertErr) console.error('❌ Supabase store_settings upsert error:', JSON.stringify(insertErr));
        }
      }

      if (key === 'orders' && data) {
        localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(data.map(toCamelCase)));
        window.dispatchEvent(new CustomEvent('nasma:orders-synced'));
      }

      if (key === 'landing_pages' && data) {
        if (data.length > 0) {
          // تحويل صفوف Supabase إلى كائنات داخلية وتخزينها بالمفتاح (productId)
          const pagesMap = {};
          data.forEach(row => {
            const page = LandingPagesDB._fromRow(row);
            pagesMap[page.productId] = page;
          });
          localStorage.setItem(DB_KEYS.LANDING_PAGES, JSON.stringify(pagesMap));
          console.log(`✅ تم تحميل ${data.length} صفحة هبوط من Supabase.`);
        } else {
          // إذا كانت Supabase فارغة — رفع البيانات المحلية إليها
          const localPages = LandingPagesDB.getAll();
          const localArr = Object.values(localPages);
          if (localArr.length > 0) {
            const rows = localArr.map(p => LandingPagesDB._toRow(p));
            await window.supabaseClient.from('landing_pages').upsert(rows, { onConflict: 'product_id' });
            console.log(`☁️ تم رفع ${localArr.length} صفحة هبوط محلية إلى Supabase.`);
          }
        }
      }
    }

    console.log('✅ اكتملت مزامنة Supabase بنجاح بالتوازي.');
    updateCartBadge();
    
    // إطلاق حدث عام يدل على اكتمال المزامنة لإعادة رسم الصفحات إذا كانت هناك حاجة
    window.dispatchEvent(new CustomEvent('nasma:supabase-synced'));
  } catch (err) {
    console.error('❌ خطأ غير متوقع أثناء المزامنة مع Supabase:', err);
  }
}

// تشغيل التهيئة
initDatabase();

// تشغيل المزامنة مع Supabase
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncWithSupabase);
} else {
  syncWithSupabase();
}

window.addEventListener('nasma:cart-updated', updateCartBadge);
document.addEventListener('DOMContentLoaded', updateCartBadge);

/* ===========================================
   تصدير للاستخدام العام
   =========================================== */
window.NasmaDB = {
  DB,
  DB_KEYS,
  CategoriesDB,
  ProductsDB,
  CartDB,
  WishlistDB,
  OrdersDB,
  CouponsDB,
  SettingsDB,
  ShippingDB,
  LandingPagesDB,
  AdminAuth,
  formatPrice,
  slugify,
  timeAgo,
  formatDate,
  orderStatusLabel,
  starsHTML,
  updateCartBadge,
  syncWithSupabase,
};
