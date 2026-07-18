# مهام تنفيذ خطة التحسين — نسما ستور

## المرحلة 1 — تحسين الصور ✅
- [x] تثبيت مكتبة `sharp` عبر npm
- [x] تحويل 6 صور PNG → WebP (توفير 85-93%)
- [x] تحويل 6 صور PNG → AVIF (توفير 88-94%)
- [x] استبدال `<img>` بـ `<picture>` مع AVIF/WebP/PNG في index.html
- [x] وضع هياكل المنتجات بشكل افتراضي في `products.html` وتحديث منطق التحميل والاستماع لحدث المزامنةأحداث في `store.js`
- [x] إضافة `width` و `height` لمنع CLS في جميع الصور
- [x] `loading="lazy"` على جميع صور المنتجات والتصنيفات
- [x] `fetchpriority="high"` و `loading="eager"` على Hero Image فقط
- [x] `decoding="async"` على جميع الصور

## المرحلة 2 — تحسين CSS ✅
- [x] إزالة `@import` من style.css (إزالة Render Blocking)
- [x] الخطوط تُحمَّل من `<link>` في HTML مع `display=swap`

## المرحلة 3 — تحسينات HTML ✅
- [x] إضافة `dns-prefetch` لـ Google Fonts في كل الصفحات
- [x] إضافة `preload` لـ Hero Image (LCP) في index.html
- [x] إضافة `<link rel="manifest">` في جميع الصفحات
- [x] إضافة `theme-color` meta tag في جميع الصفحات
- [x] إضافة `og:image` في index.html
- [x] إضافة مستمع لـ `nasma:supabase-synced` في `wishlist.html` لإعادة الرسم التلقائية
- [x] إضافة مستمع لـ `nasma:supabase-synced` في `checkout.html` لتحديث بيانات الشحن والأسعار المزامنة تلقائياً

## المرحلة 4 — Service Worker ✅
- [x] إنشاء `sw.js` مع Cache First للصور/CSS/JS
- [x] Network First للصفحات HTML
- [x] تسجيل SW في: index, products, cart, checkout, product-detail

## المرحلة 5 — Web App Manifest ✅
- [x] إنشاء `manifest.json` كامل (اسم عربي، RTL، ألوان نسما)

## نتائج ضغط الصور
| الصورة | PNG | WebP | AVIF |
|--------|-----|------|------|
| hero.png | 619 KB | 66 KB (89%↓) | 55 KB (91%↓) |
| cat-abaya.png | 650 KB | 71 KB (89%↓) | 56 KB (91%↓) |
| cat-accessories.png | 615 KB | 69 KB (89%↓) | 59 KB (90%↓) |
| cat-bags.png | 606 KB | 93 KB (85%↓) | 72 KB (88%↓) |
| prod-1.png | 554 KB | 40 KB (93%↓) | 31 KB (94%↓) |
| prod-2.png | 545 KB | 64 KB (88%↓) | 48 KB (91%↓) |
| **المجموع** | **~3.6 MB** | **~403 KB** | **~321 KB** |

## التحسين الإجمالي
- **الصور**: من 3.6 MB → 321 KB (AVIF) — توفير **91%**
- **Render Blocking**: إزالة `@import` من CSS
- **LCP**: preload للـ Hero Image
- **Cache**: Service Worker يخزّن الأصول مؤقتاً
- **PWA**: manifest.json جاهز
