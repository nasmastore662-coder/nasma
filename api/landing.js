const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://uwqextowpsmqoxclznon.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cWV4dG93cHNtcW94Y2x6bm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNTE0NjksImV4cCI6MjA5OTkyNzQ2OX0.9fdSvZgz9CyJe-SKuMFWUCBIxUIhHoZz82UlUIwsxaU';

module.exports = async (req, res) => {
  const { pid } = req.query;

  // 1. قراءة ملف landing.html الاستاتيكي
  const filePath = path.join(process.cwd(), 'landing.html');
  let html = fs.readFileSync(filePath, 'utf8');

  if (!pid) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 2. جلب المنتج وصفحة الهبوط بالتوازي
    const [lpRes, prodRes] = await Promise.all([
      supabase.from('landing_pages').select('*').eq('product_id', pid).maybeSingle(),
      supabase.from('products').select('*').eq('id', pid).maybeSingle()
    ]);

    const row = lpRes.data;
    const p = prodRes.data;

    if (p) {
      const headline = (row && row.headline) || p.name;
      const subheadline = (row && row.subheadline) || p.description || 'اكتشفي هذا العرض الرائع من متجر نسما';
      const imgUrl = (p.images && p.images[0]) || '';

      // 3. حقن وسوم الميتا (Open Graph) بشكل ديناميكي
      const metaTags = `
  <title>${headline}</title>
  <meta name="description" content="${subheadline}">
  <meta property="og:title" content="${headline}">
  <meta property="og:description" content="${subheadline}">
  <meta property="og:image" content="${imgUrl}">
  <meta property="og:url" content="https://nasma-store.vercel.app/landing.html?pid=${pid}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${headline}">
  <meta name="twitter:description" content="${subheadline}">
  <meta name="twitter:image" content="${imgUrl}">
      `;

      // استبدال وسم العنوان الاستاتيكي بالوسوم الديناميكية لكي يراها الـ Crawler الخاص بالواتساب
      html = html.replace('<title>جاري التحميل...</title>', metaTags);
    }
  } catch (error) {
    console.error('Error rendering dynamic meta tags:', error);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
};
