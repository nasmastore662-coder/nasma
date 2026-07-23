/**
 * نسما ستور — الدوال المشتركة
 * Nasma Store — Shared Store Utilities
 *
 * يُضمَّن في جميع صفحات المتجر بعد data.js
 * يوفر:
 * - بناء الهيدر والفوتر ديناميكياً
 * - بناء بطاقات المنتجات
 * - تهيئة السلة والمفضلة
 */

'use strict';

/* ===========================================
   بناء الهيدر ديناميكياً
   =========================================== */
function buildHeader(activePage = '') {
  const settings = NasmaDB.SettingsDB.get();
  const cartCount = NasmaDB.CartDB.count();

  const logoHTML = settings.logoDataUrl
    ? `<img id="logo-img" class="logo-image" src="${settings.logoDataUrl}" alt="شعار ${settings.storeName}">`
    : `<span id="logo-text" class="logo-text">${settings.storeName}</span>`;

  // روابط ثابتة
  const fixedNavLinks = [
    { href: 'index.html',    label: 'الرئيسية',      key: 'home' },
    { href: 'products.html', label: 'جميع المنتجات', key: 'products' },
  ];

  // التصنيفات من قاعدة البيانات (ديناميكية)
  const categories = NasmaDB.CategoriesDB.getAll();
  const catNavLinks = categories.map(cat => ({
    href: `products.html?cat=${cat.slug || cat.id}`,
    label: `${cat.icon || ''} ${cat.name}`.trim(),
    key: cat.slug || cat.id,
  }));

  const navLinks = [...fixedNavLinks, ...catNavLinks];

  // روابط الديسكتوب (بدون الأيقونات)
  const linksHTML = navLinks.map(l =>
    `<li><a href="${l.href}" class="nav-link${activePage === l.key ? ' active' : ''}">${l.label}</a></li>`
  ).join('');

  // روابط المنيو الجانبي (موبايل) مع إيموجي التصنيفات
  const mobileLinksHTML = navLinks.map(l =>
    `<li><a href="${l.href}" class="mobile-nav-link">${l.label}</a></li>`
  ).join('');


  const headerHTML = `
<div class="announcement-bar" id="announcement-bar" style="${settings.announcementBarEnabled === false ? 'display:none;' : ''}">
  ${settings.announcementBar || `🌸 شحن مجاني للطلبات فوق ${NasmaDB.formatPrice(settings.freeShippingMin)}`}
</div>
<header class="header" id="site-header">
  <div class="container">
    <nav class="nav" role="navigation" aria-label="القائمة الرئيسية">
      <a href="index.html" class="nav-logo" id="logo-link">
        ${logoHTML}
      </a>
      <ul class="nav-menu">${linksHTML}</ul>
      <div class="nav-actions">
        <button id="search-open" class="nav-icon-btn" aria-label="بحث" title="بحث">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
        <a href="wishlist.html" class="nav-icon-btn" aria-label="المفضلة" title="المفضلة">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </a>
        <a href="cart.html" class="nav-icon-btn" aria-label="السلة" title="السلة" style="position:relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span id="cart-badge" class="cart-badge cart-badge-count" style="display:${cartCount > 0 ? 'flex' : 'none'}">${cartCount}</span>
        </a>
        <button class="hamburger" id="hamburger" aria-label="القائمة">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  </div>
</header>
<!-- موبايل -->
<div class="mobile-menu-overlay" id="mobile-overlay" style="display:none;"></div>
<nav class="mobile-menu" id="mobile-menu" aria-label="القائمة الجانبية">
  <div class="mobile-menu-header">
    <span class="logo-text">${settings.storeName}</span>
    <button class="mobile-menu-close" id="mobile-close" aria-label="إغلاق">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  </div>
  <ul>${mobileLinksHTML}</ul>
  <div class="mobile-menu-footer">
    <a href="cart.html" class="mobile-footer-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      السلة
    </a>
    <a href="wishlist.html" class="mobile-footer-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
      المفضلة
    </a>
  </div>
</nav>
<!-- بحث -->
<div class="search-overlay" id="search-overlay">
  <button class="search-overlay-close" id="search-close">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
  </button>
  <div class="search-box">
    <p class="search-label">ابحثي عما تريدين</p>
    <div class="search-input-wrapper">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input id="search-field" class="search-field" type="search" placeholder="عبايات، شنط، إكسسوارات...">
    </div>
    <div id="search-results" class="search-results" style="margin-top:1.5rem;"></div>
  </div>
</div>
`;
  document.getElementById('nasma-header').innerHTML = headerHTML;
  initHeaderEvents();
  applySettingsToDOM(settings);
}

/* ===========================================
   بناء الفوتر ديناميكياً
   =========================================== */
function buildFooter() {
  const settings = NasmaDB.SettingsDB.get();
  const year = new Date().getFullYear();
  const html = `
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <span class="logo-text" style="font-size:1.75rem;display:block;margin-bottom:1rem;">${settings.storeName}</span>
        <p class="footer-desc">${settings.storeDesc || ''}</p>
        <div class="social-links">
          ${settings.facebook  ? `<a href="${settings.facebook}"  class="social-link" target="_blank" rel="noopener" aria-label="فيسبوك"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>` : ''}
          ${settings.instagram ? `<a href="${settings.instagram}" class="social-link" target="_blank" rel="noopener" aria-label="انستقرام"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>` : ''}
          ${settings.tiktok   ? `<a href="${settings.tiktok}"   class="social-link" target="_blank" rel="noopener" aria-label="تيك توك"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg></a>` : ''}
          ${settings.snapchat ? `<a href="${settings.snapchat}" class="social-link" target="_blank" rel="noopener" aria-label="سناب شات"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2C8.5 2 6 4.5 6 8v1.5c-.7.2-1.5.5-2 1 0 .8.6 1.4 1.3 1.5-.4 1.1-1.3 2.5-3.3 3 .5.6 2 1 4 1.5.2.7.6 1.5 1 2 .4.2.7.2 1 .1.5-.2 1.3-.5 2-.5.8 0 1.5.3 2 .5.4.1.7.1 1-.1.4-.5.8-1.3 1-2 2-.5 3.5-.9 4-1.5-2-.5-2.9-1.9-3.3-3 .7-.1 1.3-.7 1.3-1.5-.5-.5-1.3-.8-2-1V8c0-3.5-2.5-6-6-6z"/></svg></a>` : ''}
          ${settings.whatsapp ? `<a href="https://wa.me/${settings.whatsapp}" class="social-link" target="_blank" rel="noopener" aria-label="واتساب"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></a>` : ''}
        </div>
      </div>
      <div>
        <h3 class="footer-heading">تصفحي</h3>
        <ul class="footer-links">
          <li><a href="index.html"    class="footer-link">الرئيسية</a></li>
          <li><a href="products.html" class="footer-link">جميع المنتجات</a></li>
          <li><a href="wishlist.html" class="footer-link">المفضلة</a></li>
          <li><a href="cart.html"     class="footer-link">سلة التسوق</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer-heading">خدمة العملاء</h3>
        <ul class="footer-links">
          <li><a href="#" class="footer-link">الأسئلة الشائعة</a></li>
          <li><a href="#" class="footer-link">سياسة الشحن</a></li>
          <li><a href="#" class="footer-link">الإرجاع والاستبدال</a></li>
          <li><a href="#" class="footer-link">سياسة الخصوصية</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer-heading">تواصلي معنا</h3>
        <ul class="footer-links" style="gap: 10px; display: flex; flex-direction: column;">
          ${settings.storePhone ? `<li><a href="tel:${settings.storePhone}" class="footer-link" style="display:inline-flex; align-items:center; gap:8px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${settings.storePhone}</a></li>` : ''}
          ${settings.storeEmail ? `<li><a href="mailto:${settings.storeEmail}" class="footer-link" style="display:inline-flex; align-items:center; gap:8px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>${settings.storeEmail}</a></li>` : ''}
        </ul>
        ${(settings.instagram || settings.tiktok || settings.snapchat || settings.whatsapp || settings.facebook) ? `
        <div class="social-links" style="margin-top: 15px; display: flex; gap: 10px;">
          ${settings.facebook  ? `<a href="${settings.facebook}"  class="social-link" target="_blank" rel="noopener" aria-label="فيسبوك"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>` : ''}
          ${settings.instagram ? `<a href="${settings.instagram}" class="social-link" target="_blank" rel="noopener" aria-label="انستقرام"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>` : ''}
          ${settings.tiktok   ? `<a href="${settings.tiktok}"   class="social-link" target="_blank" rel="noopener" aria-label="تيك توك"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg></a>` : ''}
          ${settings.snapchat ? `<a href="${settings.snapchat}" class="social-link" target="_blank" rel="noopener" aria-label="سناب شات"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2C8.5 2 6 4.5 6 8v1.5c-.7.2-1.5.5-2 1 0 .8.6 1.4 1.3 1.5-.4 1.1-1.3 2.5-3.3 3 .5.6 2 1 4 1.5.2.7.6 1.5 1 2 .4.2.7.2 1 .1.5-.2 1.3-.5 2-.5.8 0 1.5.3 2 .5.4.1.7.1 1-.1.4-.5.8-1.3 1-2 2-.5 3.5-.9 4-1.5-2-.5-2.9-1.9-3.3-3 .7-.1 1.3-.7 1.3-1.5-.5-.5-1.3-.8-2-1V8c0-3.5-2.5-6-6-6z"/></svg></a>` : ''}
          ${settings.whatsapp ? `<a href="https://wa.me/${settings.whatsapp}" class="social-link" target="_blank" rel="noopener" aria-label="واتساب"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></a>` : ''}
        </div>
        ` : ''}
      </div>
    </div>
    <div class="footer-bottom">
      <p class="footer-copy">© ${year} ${settings.storeName}. جميع الحقوق محفوظة.</p>
      <div class="footer-payments">
        <span class="payment-badge">الدفع عند الاستلام</span>
        <span class="payment-badge">مدى</span>
        <span class="payment-badge">Visa</span>
      </div>
    </div>
  </div>
</footer>`;
  const el = document.getElementById('nasma-footer');
  if (el) el.innerHTML = html;
}

/* ===========================================
   تطبيق الإعدادات على الصفحة
   =========================================== */
function applySettingsToDOM(settings) {
  if (!settings) settings = NasmaDB.SettingsDB.get();
  const root = document.documentElement;
  root.style.setProperty('--color-primary',    settings.colorPrimary    || '#C4A882');
  root.style.setProperty('--color-secondary',  settings.colorSecondary  || '#E8D5B0');
  root.style.setProperty('--color-bg',         settings.colorBg         || '#FAF8F5');
  root.style.setProperty('--color-text',       settings.colorText       || '#2C2C2C');
  root.style.setProperty('--font-primary',     `'${settings.fontPrimary || 'Tajawal'}', sans-serif`);
  root.style.setProperty('--font-display',     `'${settings.fontDisplay || 'Amiri'}', serif`);
  document.body.style.fontFamily = `'${settings.fontPrimary || 'Tajawal'}', sans-serif`;
  if (settings.storeName) document.title = `${settings.storeName} — متجر إلكتروني`;

  // تحديث الأيقونة المفضلة (Favicon) بشكل ديناميكي فقط في حال وجود شعار مخصص مرفوع من المستخدم
  if (settings.logoDataUrl) {
    let favicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
    if (favicons.length > 0) {
      favicons.forEach(fav => {
        fav.href = settings.logoDataUrl;
      });
    } else {
      const newFav = document.createElement('link');
      newFav.rel = 'icon';
      newFav.type = 'image/png';
      newFav.href = settings.logoDataUrl;
      document.head.appendChild(newFav);
    }

    const appleTouch = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleTouch) {
      appleTouch.href = settings.logoDataUrl;
    }
  }

  // مزامنة عناصر الهوية في الصفحة (الشعار والاسم)
  const logoImg  = document.getElementById('logo-img');
  const logoText = document.getElementById('logo-text');
  if (settings.logoDataUrl) {
    if (logoImg)  { logoImg.src = settings.logoDataUrl; logoImg.style.display = 'block'; }
    if (logoText) { logoText.style.display = 'none'; }
  } else {
    if (logoImg)  { logoImg.style.display = 'none'; }
    if (logoText) { logoText.style.display = 'block'; logoText.textContent = settings.storeName || 'نسما'; }
  }
  const footerName = document.getElementById('footer-store-name');
  if (footerName) footerName.textContent = settings.storeName;
  const storeDisplay = document.getElementById('store-name-display');
  if (storeDisplay) storeDisplay.textContent = settings.storeName;
}

/* ===========================================
   بناء بطاقة منتج هيكلية مؤقتة (Skeleton Card)
   =========================================== */
function buildProductSkeletonCard() {
  return `
<article class="product-card skeleton-card">
  <div class="product-image-wrapper">
    <div class="skeleton-image"></div>
  </div>
  <div class="product-info skeleton-info">
    <div class="skeleton-text skeleton-title"></div>
    <div class="skeleton-text skeleton-rating"></div>
    <div class="skeleton-text skeleton-price"></div>
  </div>
</article>`;
}

/* ===========================================
   بناء بطاقة منتج
   =========================================== */
function buildProductCard(product, index = 0) {
  const isWished = NasmaDB.WishlistDB.has(product.id);
  const cat = NasmaDB.CategoriesDB.getById(product.categoryId);
  const catName = cat ? cat.name : '';
  const delay = index % 4;

  let badgeHTML = '';
  const badgeInfo = (NasmaDB && NasmaDB.getProductBadgeInfo) ? NasmaDB.getProductBadgeInfo(product) : { type: product.badge, text: product.badge || '', color: '' };
  if (badgeInfo.text) {
    const badgeClass = badgeInfo.type === 'new' ? 'product-badge new' : (badgeInfo.type === 'sale' ? 'product-badge sale' : 'product-badge');
    const colorStyle = badgeInfo.color ? `background:${badgeInfo.color}; color:#ffffff; font-weight:700;` : '';
    badgeHTML = `<span class="${badgeClass}" style="${colorStyle}">${badgeInfo.text}</span>`;
  }

  let imgHTML = '';
  if (product.images && product.images[0]) {
    const imgSrc = product.images[0];
    if (imgSrc.startsWith('assets/images/') && (imgSrc.endsWith('.png') || imgSrc.endsWith('.jpg') || imgSrc.endsWith('.jpeg'))) {
      const baseName = imgSrc.replace(/\.(png|jpe?g)$/i, '');
      imgHTML = `<picture>
        <source srcset="${baseName}.avif" type="image/avif">
        <source srcset="${baseName}.webp" type="image/webp">
        <img src="${imgSrc}" alt="${product.name}" loading="lazy" decoding="async" width="600" height="700">
      </picture>`;
    } else {
      imgHTML = `<img src="${imgSrc}" alt="${product.name}" loading="lazy" decoding="async">`;
    }
  } else {
    imgHTML = `<div class="product-placeholder-img">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="0.8" opacity="0.4" width="60" height="60">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 9 4-4 4 4 4-4 4 4"/><circle cx="8.5" cy="13.5" r="1.5"/>
        </svg>
      </div>`;
  }

  const oldPriceHTML = product.priceOld > product.price
    ? `<span class="product-price-old">${NasmaDB.formatPrice(product.priceOld)}</span>`
    : '';

  const isSoldOut = product.badge === 'sold_out' || product.stock === 0;

  return `
<article class="product-card animate-on-scroll animate-delay-${delay}" data-product-id="${product.id}">
  <div class="product-image-wrapper">
    <a href="product-detail.html?id=${product.id}">
      ${imgHTML}
    </a>
    ${badgeHTML}
    <div class="product-actions">
      <button
        class="product-action-btn wishlist-btn${isWished ? ' active' : ''}"
        data-product-id="${product.id}"
        aria-label="${isWished ? 'إزالة من المفضلة' : 'أضف للمفضلة'}"
        title="مفضلة"
      >
        <svg viewBox="0 0 24 24" fill="${isWished ? 'var(--color-primary)' : 'none'}" stroke="${isWished ? 'var(--color-primary)' : 'currentColor'}" stroke-width="1.7">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      <a href="product-detail.html?id=${product.id}" class="product-action-btn" title="عرض التفاصيل">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      </a>
    </div>
    ${!isSoldOut ? `
    <button class="product-add-btn add-to-cart-btn" data-product-id="${product.id}" aria-label="أضف للسلة">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
      أضف للسلة
    </button>` : `
    <div class="product-add-btn" style="background:#9CA3AF;cursor:not-allowed;opacity:1;">نفدت الكمية</div>`}
  </div>
  <div class="product-info">
    ${catName ? `<p class="product-category-tag">${catName}</p>` : ''}
    <h3 class="product-name">
      <a href="product-detail.html?id=${product.id}" style="color:inherit;">${product.name}</a>
    </h3>
    <div class="product-rating">
      <div class="stars">${NasmaDB.starsHTML(product.rating)}</div>
      <span class="rating-count">(${product.reviewCount})</span>
    </div>
    <div class="product-price-row">
      <span class="product-price">${NasmaDB.formatPrice(product.price)}</span>
      ${oldPriceHTML}
    </div>
  </div>
</article>`;
}

/* ===========================================
   حالة "لا توجد منتجات"
   =========================================== */
function buildEmptyState(msg = 'لم يتم إضافة منتجات بعد') {
  return `
<div class="empty-state">
  <div class="empty-state-icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1" width="64" height="64">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  </div>
  <p class="empty-state-msg">${msg}</p>
  <a href="products.html" class="btn btn-primary" style="margin-top:1rem;">تصفح المنتجات</a>
</div>`;
}

/* ===========================================
   أحداث الهيدر
   =========================================== */
let headerEventsInitialized = false;
function initHeaderEvents() {
  if (headerEventsInitialized) return;
  headerEventsInitialized = true;
  // موبايل
  const ham     = document.getElementById('hamburger');
  const menu    = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-overlay');
  const close   = document.getElementById('mobile-close');

  if (ham && menu) {
    const open = () => {
      ham.classList.add('active');
      menu.classList.add('open');
      overlay.style.display = 'block';
      setTimeout(() => overlay.classList.add('open'), 10);
      document.body.style.overflow = 'hidden';
    };
    const closeMenu = () => {
      ham.classList.remove('active');
      menu.classList.remove('open');
      overlay.classList.remove('open');
      setTimeout(() => overlay.style.display = 'none', 400);
      document.body.style.overflow = '';
    };
    ham.addEventListener('click', open);
    close?.addEventListener('click', closeMenu);
    overlay?.addEventListener('click', closeMenu);
  }

  // بحث
  const searchOpen  = document.getElementById('search-open');
  const searchClose = document.getElementById('search-close');
  const searchOvl   = document.getElementById('search-overlay');
  const searchField = document.getElementById('search-field');

  if (searchOpen && searchOvl) {
    searchOpen.addEventListener('click', () => {
      searchOvl.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => searchField?.focus(), 200);
    });
    const closeSearch = () => {
      searchOvl.classList.remove('open');
      document.body.style.overflow = '';
    };
    searchClose?.addEventListener('click', closeSearch);
    searchOvl?.addEventListener('click', e => { if (e.target === searchOvl) closeSearch(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && searchOvl.classList.contains('open')) closeSearch();
    });

    // بحث فوري
    searchField?.addEventListener('input', debounce(e => {
      const q = e.target.value.trim();
      const resultsEl = document.getElementById('search-results');
      if (!resultsEl) return;
      if (!q) { resultsEl.innerHTML = ''; return; }
      
      // تتبع حدث البحث للبيكسلات
      if (typeof window.nasmaTrackSearch === 'function') {
        window.nasmaTrackSearch(q);
      }

      const results = NasmaDB.ProductsDB.search(q).slice(0, 6);
      if (!results.length) {
        resultsEl.innerHTML = `<p style="text-align:center;color:var(--color-text-light);">لا نتائج لـ "${q}"</p>`;
        return;
      }
      resultsEl.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.75rem;">
        ${results.map(p => `
          <a href="product-detail.html?id=${p.id}" style="text-decoration:none;color:inherit;">
            <div style="background:var(--color-bg-alt);border-radius:var(--radius-lg);overflow:hidden;">
              ${p.images[0]
                ? `<img src="${p.images[0]}" alt="${p.name}" style="width:100%;aspect-ratio:1;object-fit:cover;">`
                : `<div style="width:100%;aspect-ratio:1;background:var(--color-bg-alt);display:flex;align-items:center;justify-content:center;font-size:2rem;">🛍️</div>`}
              <div style="padding:.5rem;">
                <p style="font-size:.8rem;font-weight:600;margin-bottom:.25rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${p.name}</p>
                <p style="font-size:.85rem;font-weight:700;color:var(--color-primary-dark);">${NasmaDB.formatPrice(p.price)}</p>
              </div>
            </div>
          </a>`).join('')}
      </div>`;
    }, 300));
  }

  // scroll header
  const header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
  }
}

/* ===========================================
   أحداث السلة والمفضلة (تفويض)
   =========================================== */
let storeEventsInitialized = false;
function initStoreEvents() {
  if (storeEventsInitialized) return;
  storeEventsInitialized = true;
  // أضف للسلة
  document.addEventListener('click', e => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (!btn) return;
    const pid = btn.dataset.productId;
    if (!pid) return;
    NasmaDB.CartDB.add(pid, 1);
    NasmaStore.showCartNotification(pid, 1);
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg> تمت الإضافة!`;
    btn.style.background = '#4CAF50';
    NasmaDB.updateCartBadge();
    setTimeout(() => {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> أضف للسلة`;
      btn.style.background = '';
    }, 2000);
  });

  // مفضلة
  document.addEventListener('click', e => {
    const btn = e.target.closest('.wishlist-btn');
    if (!btn) return;
    const pid = btn.dataset.productId;
    if (!pid) return;
    const isNow = NasmaDB.WishlistDB.toggle(pid);
    const svg = btn.querySelector('svg');
    if (svg) {
      svg.style.fill   = isNow ? 'var(--color-primary)' : 'none';
      svg.style.stroke = isNow ? 'var(--color-primary)' : 'currentColor';
    }
    btn.classList.toggle('active', isNow);
  });

  // scroll-to-top
  const scrollBtn = document.getElementById('scroll-top');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // scroll animations
  initScrollAnimations();
}

/* ===========================================
   Intersection Observer للأنيماشن
   =========================================== */
function initScrollAnimations() {
  const els = document.querySelectorAll('.animate-on-scroll');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('animated'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

/* ===========================================
   Debounce
   =========================================== */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ===========================================
   Toast إشعار
   =========================================== */
function showToast(msg, type = 'success') {
  let toast = document.getElementById('store-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'store-toast';
    toast.className = 'settings-toast';
    toast.innerHTML = '<span id="store-toast-msg"></span>';
    document.body.appendChild(toast);
  }
  toast.querySelector('#store-toast-msg').textContent = msg;
  toast.style.background = type === 'error' ? '#EF4444' : '#2C2C2C';
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

let notificationTimer = null;

function showCartNotification(productId, qty = 1) {
  const products = NasmaDB.ProductsDB.getAll();
  const p = products.find(prod => prod.id === productId) || {};
  
  const title = p.name || 'منتج مميز';
  const priceFormatted = NasmaDB.formatPrice(p.price || 0);
  const imageSrc = (p.images && p.images[0]) || 'assets/images/hero.png';
  
  const htmlContent = `
    <div class="notification-progress" id="notification-progress-bar"></div>
    <div class="notification-header">
      <div class="notification-title-row">
        <span class="notification-success-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
        <span class="notification-msg">تمت الإضافة إلى سلة التسوق</span>
      </div>
      <button class="notification-close" onclick="NasmaStore.closeNotificationToast()">&times;</button>
    </div>
    <div class="notification-body">
      <img class="notification-img" src="${imageSrc}" alt="${title}">
      <div class="notification-details">
        <h4 class="notification-item-title">${title}</h4>
        <p class="notification-item-desc">الكمية: ${qty}</p>
        <p class="notification-item-price">${priceFormatted}</p>
      </div>
    </div>
    <div class="notification-actions">
      <a href="cart.html" class="notification-btn notification-btn-outline">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        عرض السلة
      </a>
      <a href="checkout.html" class="notification-btn notification-btn-solid">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        إتمام الطلب
      </a>
    </div>
  `;
  
  displayNotificationToast(htmlContent);
}

function showOrderNotification(order) {
  const orderNum = order.orderNumber || '';
  const totalFormatted = NasmaDB.formatPrice(order.total || 0);
  
  const htmlContent = `
    <div class="notification-progress" id="notification-progress-bar"></div>
    <div class="notification-header">
      <div class="notification-title-row">
        <span class="notification-success-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        </span>
        <span class="notification-msg">تم تأكيد طلبكِ بنجاح! 🎉</span>
      </div>
      <button class="notification-close" onclick="NasmaStore.closeNotificationToast()">&times;</button>
    </div>
    <div class="notification-body">
      <div class="notification-icon-fallback">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
      </div>
      <div class="notification-details">
        <h4 class="notification-item-title">رقم الطلب: #${orderNum}</h4>
        <p class="notification-item-desc">سنتواصل معكِ قريباً لتأكيد تفاصيل التوصيل.</p>
        <p class="notification-item-price">المجموع: ${totalFormatted}</p>
      </div>
    </div>
    <div class="notification-actions">
      <a href="index.html" class="notification-btn notification-btn-outline">
        العودة للرئيسية
      </a>
      <a href="products.html" class="notification-btn notification-btn-solid">
        متابعة التسوق
      </a>
    </div>
  `;
  
  displayNotificationToast(htmlContent);
}

function displayNotificationToast(htmlContent) {
  let toast = document.getElementById('nasma-notification-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'nasma-notification-toast';
    document.body.appendChild(toast);
  }
  
  toast.innerHTML = htmlContent;
  toast.classList.remove('show');
  
  // Force reflow
  void toast.offsetWidth;
  
  toast.classList.add('show');
  
  const progressBar = document.getElementById('notification-progress-bar');
  if (progressBar) {
    progressBar.style.animation = 'none';
    void progressBar.offsetWidth;
    progressBar.style.animation = 'shrinkBar 5s linear forwards';
  }
  
  clearTimeout(notificationTimer);
  notificationTimer = setTimeout(() => {
    closeNotificationToast();
  }, 5000);
}

function closeNotificationToast() {
  const toast = document.getElementById('nasma-notification-toast');
  if (toast) {
    toast.classList.remove('show');
  }
  clearTimeout(notificationTimer);
}

/* ===========================================
   تهيئة الصفحة الكاملة
   =========================================== */
function initPage(activePage = '') {
  applySettingsToDOM();
  buildHeader(activePage);
  buildFooter();
  initStoreEvents();
}

/* ===========================================
   CSS إضافي للعناصر المشتركة
   =========================================== */
(function injectSharedStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .product-placeholder-img {
      width:100%;height:100%;
      display:flex;align-items:center;justify-content:center;
      background:linear-gradient(135deg,var(--color-bg-alt) 0%,var(--color-border) 100%);
    }
    .empty-state {
      text-align:center;padding:var(--space-20) var(--space-6);
    }
    .empty-state-icon {
      width:80px;height:80px;
      background:var(--color-secondary);
      border-radius:var(--radius-full);
      display:flex;align-items:center;justify-content:center;
      margin:0 auto var(--space-5);
    }
    .empty-state-msg {
      font-size:var(--text-lg);
      color:var(--color-text-secondary);
      font-family:var(--font-display);
    }
    .wishlist-btn.active svg { transition: all .2s ease; }
    .search-results { max-height: 60vh; overflow-y: auto; }

    /* Premium Notification Toast */
    #nasma-notification-toast {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(-150px);
      width: 90%;
      max-width: 420px;
      background: #ffffff;
      border-radius: var(--radius-xl);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
      border: 1px solid var(--color-border);
      z-index: 100000;
      overflow: hidden;
      direction: rtl;
      opacity: 0;
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity 0.4s ease;
      font-family: var(--font-primary);
    }
    #nasma-notification-toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    .notification-progress {
      position: absolute;
      top: 0;
      right: 0;
      height: 4px;
      background-color: #10B981;
      width: 100%;
    }
    @keyframes shrinkBar {
      from { width: 100%; }
      to { width: 0%; }
    }
    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4) var(--space-4) var(--space-2);
    }
    .notification-title-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .notification-success-badge {
      width: 22px;
      height: 22px;
      background-color: #10B981;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .notification-success-badge svg {
      width: 12px;
      height: 12px;
      stroke-width: 3;
    }
    .notification-msg {
      font-size: var(--text-sm);
      font-weight: 700;
      color: var(--color-text);
    }
    .notification-close {
      background: none;
      border: none;
      font-size: var(--text-lg);
      color: var(--color-text-light);
      cursor: pointer;
      line-height: 1;
      padding: var(--space-1);
    }
    .notification-close:hover {
      color: var(--color-text);
    }
    .notification-body {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-2) var(--space-4) var(--space-4);
      border-bottom: 1px solid var(--color-border-light);
    }
    .notification-img {
      width: 64px;
      height: 64px;
      object-fit: cover;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-light);
    }
    .notification-icon-fallback {
      width: 64px;
      height: 64px;
      background: var(--color-bg-alt);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary-dark);
    }
    .notification-icon-fallback svg {
      width: 32px;
      height: 32px;
    }
    .notification-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }
    .notification-item-title {
      font-size: var(--text-sm);
      font-weight: 700;
      color: var(--color-text);
      margin: 0;
      line-height: 1.4;
    }
    .notification-item-desc {
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      margin: 0;
    }
    .notification-item-price {
      font-size: var(--text-sm);
      font-weight: 700;
      color: var(--color-text);
      margin: 0;
    }
    .notification-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3);
      padding: var(--space-4);
    }
    .notification-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: 10px var(--space-3);
      font-size: var(--text-sm);
      font-weight: 700;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
      text-decoration: none;
    }
    .notification-btn-solid {
      background-color: var(--color-primary-dark, #B8956F);
      color: #ffffff;
      border: none;
    }
    .notification-btn-solid:hover {
      background-color: var(--color-primary, #C4A882);
    }
    .notification-btn-outline {
      background-color: #ffffff;
      color: var(--color-text);
      border: 1.5px solid var(--color-border);
    }
    .notification-btn-outline:hover {
      background-color: var(--color-bg);
      border-color: var(--color-text-light);
    }
  `;
  document.head.appendChild(style);
})();

window.NasmaStore = {
  buildHeader,
  buildFooter,
  buildProductCard,
  buildEmptyState,
  applySettingsToDOM,
  initPage,
  initScrollAnimations,
  showToast,
  debounce,
  showCartNotification,
  showOrderNotification,
  closeNotificationToast,
};

/* ===========================================
   بيكسل التتبع للتسويق الرقمي (Meta, TikTok, Snapchat)
   =========================================== */
(function autoInitStorePixels() {
  try {
    const raw = localStorage.getItem('nasma_pixel_settings');
    if (!raw) return;
    const settings = JSON.parse(raw);
    if (!settings) return;

    // Meta Pixel
    if (settings.fbPixelId && !document.getElementById('nasma-meta-pixel')) {
      const script = document.createElement('script');
      script.id = 'nasma-meta-pixel';
      script.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${settings.fbPixelId}');fbq('track','PageView');`;
      document.head.appendChild(script);
    }
    // TikTok Pixel
    if (settings.tiktokPixelId && !document.getElementById('nasma-tiktok-pixel')) {
      const script = document.createElement('script');
      script.id = 'nasma-tiktok-pixel';
      script.innerHTML = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=i+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('${settings.tiktokPixelId}');ttq.page();}(window,document,'ttq');`;
      document.head.appendChild(script);
    }
    // Snapchat Pixel
    if (settings.snapPixelId && !document.getElementById('nasma-snap-pixel')) {
      const script = document.createElement('script');
      script.id = 'nasma-snap-pixel';
      script.innerHTML = `(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s=t.createElement(n);s.async=!0;s.src="https://sc-static.net/scevent.min.js";var r=t.getElementsByTagName(n)[0];r.parentNode.insertBefore(s,r)})(window,document,"script");snaptr("init","${settings.snapPixelId}");snaptr("track","PAGE_VIEW");`;
      document.head.appendChild(script);
    }
  } catch (err) {
    console.error('Nasma Pixel init error:', err);
  }
})();

// دوال تتبع الأحداث لصفحات المستخدم
window.nasmaTrackViewContent = function(product) {
  try {
    const raw = localStorage.getItem('nasma_pixel_settings');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s) return;
    if (s.fbPixelId && typeof fbq !== 'undefined') fbq('track', 'ViewContent', { content_ids:[product.id], content_type:'product', content_name:product.name, value:product.price, currency:'EGP' });
    if (s.tiktokPixelId && typeof ttq !== 'undefined') ttq.track('ViewContent', { content_id:product.id, content_name:product.name, value:product.price, currency:'EGP' });
    if (s.snapPixelId && typeof snaptr !== 'undefined') snaptr('track', 'VIEW_CONTENT', { item_ids:[product.id], price:product.price, currency:'EGP', item_category:product.categoryId });
  } catch (e) {}
};
window.nasmaTrackAddToCart = function(product, qty) {
  try {
    const raw = localStorage.getItem('nasma_pixel_settings');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s) return;
    if (s.fbPixelId && typeof fbq !== 'undefined') fbq('track', 'AddToCart', { content_ids:[product.id], content_type:'product', content_name:product.name, value:product.price*(qty||1), currency:'EGP', num_items:(qty||1) });
    if (s.tiktokPixelId && typeof ttq !== 'undefined') ttq.track('AddToCart', { content_id:product.id, content_name:product.name, value:product.price*(qty||1), currency:'EGP', quantity:(qty||1) });
    if (s.snapPixelId && typeof snaptr !== 'undefined') snaptr('track', 'ADD_CART', { item_ids:[product.id], price:product.price, currency:'EGP', number_items:(qty||1) });
  } catch (e) {}
};
window.nasmaTrackInitiateCheckout = function(total, items) {
  try {
    const raw = localStorage.getItem('nasma_pixel_settings');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s) return;
    const ids = (items||[]).map(i=>i.productId||i.id);
    if (s.fbPixelId && typeof fbq !== 'undefined') fbq('track', 'InitiateCheckout', { content_ids:ids, content_type:'product', num_items:(items||[]).length, value:total, currency:'EGP' });
    if (s.tiktokPixelId && typeof ttq !== 'undefined') ttq.track('InitiateCheckout', { value:total, currency:'EGP' });
    if (s.snapPixelId && typeof snaptr !== 'undefined') snaptr('track', 'START_CHECKOUT', { price:total, currency:'EGP', item_ids:ids, number_items:(items||[]).length });
  } catch (e) {}
};
window.nasmaTrackPurchase = function(order) {
  try {
    const raw = localStorage.getItem('nasma_pixel_settings');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s) return;
    const ids = (order.items||[]).map(i=>i.productId);
    if (s.fbPixelId && typeof fbq !== 'undefined') fbq('track', 'Purchase', { content_ids:ids, content_type:'product', value:order.total, currency:'EGP', num_items:(order.items||[]).length, order_id:order.id });
    if (s.tiktokPixelId && typeof ttq !== 'undefined') ttq.track('CompletePayment', { value:order.total, currency:'EGP', content_id:ids[0]||'', quantity:(order.items||[]).length });
    if (s.snapPixelId && typeof snaptr !== 'undefined') snaptr('track', 'PURCHASE', { price:order.total, currency:'EGP', item_ids:ids, transaction_id:order.id });
  } catch (e) {}
};
window.nasmaTrackSearch = function(query) {
  try {
    const raw = localStorage.getItem('nasma_pixel_settings');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s) return;
    if (s.fbPixelId && typeof fbq !== 'undefined') fbq('track', 'Search', { search_string:query });
    if (s.tiktokPixelId && typeof ttq !== 'undefined') ttq.track('Search', { query });
    if (s.snapPixelId && typeof snaptr !== 'undefined') snaptr('track', 'SEARCH', { search_string:query });
  } catch (e) {}
};
window.nasmaTrackAddToWishlist = function(product) {
  try {
    const raw = localStorage.getItem('nasma_pixel_settings');
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s) return;
    if (s.fbPixelId && typeof fbq !== 'undefined') fbq('track', 'AddToWishlist', { content_ids:[product.id], content_name:product.name, value:product.price, currency:'EGP' });
    if (s.snapPixelId && typeof snaptr !== 'undefined') snaptr('track', 'ADD_TO_WISHLIST', { item_ids:[product.id] });
  } catch (e) {}
};
