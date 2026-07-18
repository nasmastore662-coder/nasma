/**
 * نسما ستور — تهيئة اتصال Supabase
 * Nasma Store — Supabase Client Setup
 */

const SUPABASE_URL_CONFIG = 'https://uwqextowpsmqoxclznon.supabase.co';
const SUPABASE_ANON_KEY_CONFIG = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cWV4dG93cHNtcW94Y2x6bm9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNTE0NjksImV4cCI6MjA5OTkyNzQ2OX0.9fdSvZgz9CyJe-SKuMFWUCBIxUIhHoZz82UlUIwsxaU';

// 2. أو سيقوم الكود بالتحقق من وجودها في التخزين المحلي (مفيد للتهيئة السريعة):
const SUPABASE_URL = SUPABASE_URL_CONFIG || localStorage.getItem('nasma_supabase_url') || '';
const SUPABASE_ANON_KEY = SUPABASE_ANON_KEY_CONFIG || localStorage.getItem('nasma_supabase_anon_key') || '';

let supabaseClient = null;

if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ تم تهيئة اتصال Supabase بنجاح.');
  } catch (error) {
    console.error('❌ فشل تهيئة اتصال Supabase:', error);
  }
} else {
  console.warn('⚠️ بيانات الاتصال بـ Supabase غير مكتملة. المزامنة السحابية معطلة حالياً. يرجى تهيئة البيانات في supabase.js');
}

// تصدير العميل للنافذة العامة
window.supabaseClient = supabaseClient;
