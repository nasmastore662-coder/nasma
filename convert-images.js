/**
 * سكريبت تحويل الصور إلى WebP باستخدام sharp
 * يحتفظ بالجودة العالية مع ضغط الحجم بنسبة 60-80%
 */
const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const INPUT_DIR  = path.join(__dirname, 'assets', 'images');
const OUTPUT_DIR = path.join(__dirname, 'assets', 'images');

// إعدادات الجودة — تحافظ على الجودة البصرية مع تقليل الحجم
const WEBP_QUALITY  = 88;   // جودة عالية جداً (max=100)
const AVIF_QUALITY  = 72;   // AVIF أكفأ لذا جودة أقل قليلاً تعطي نفس المظهر

async function convertImage(filename) {
  const inputPath  = path.join(INPUT_DIR, filename);
  const baseName   = path.basename(filename, path.extname(filename));
  const webpPath   = path.join(OUTPUT_DIR, `${baseName}.webp`);
  const avifPath   = path.join(OUTPUT_DIR, `${baseName}.avif`);

  const originalSize = fs.statSync(inputPath).size;

  // --- تحويل إلى WebP ---
  await sharp(inputPath)
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toFile(webpPath);
  const webpSize = fs.statSync(webpPath).size;

  // --- تحويل إلى AVIF ---
  await sharp(inputPath)
    .avif({ quality: AVIF_QUALITY, effort: 6 })
    .toFile(avifPath);
  const avifSize = fs.statSync(avifPath).size;

  const webpSaving = (((originalSize - webpSize) / originalSize) * 100).toFixed(1);
  const avifSaving = (((originalSize - avifSize) / originalSize) * 100).toFixed(1);

  console.log(`✅ ${filename}`);
  console.log(`   PNG  : ${(originalSize / 1024).toFixed(1)} KB`);
  console.log(`   WebP : ${(webpSize   / 1024).toFixed(1)} KB  (توفير ${webpSaving}%)`);
  console.log(`   AVIF : ${(avifSize   / 1024).toFixed(1)} KB  (توفير ${avifSaving}%)`);
  console.log('');
}

async function main() {
  console.log('🚀 جاري تحويل الصور...\n');

  const files = fs.readdirSync(INPUT_DIR).filter(f => /\.(png|jpg|jpeg)$/i.test(f));

  if (files.length === 0) {
    console.log('لم يُعثر على صور PNG/JPG في مجلد assets/images');
    return;
  }

  for (const file of files) {
    await convertImage(file);
  }

  console.log('🎉 تم تحويل جميع الصور بنجاح!');
}

main().catch(err => {
  if (err.code === 'MODULE_NOT_FOUND') {
    console.error('❌ مكتبة sharp غير مثبتة.');
    console.error('   شغّل: npm install sharp');
  } else {
    console.error('❌ خطأ:', err.message);
  }
  process.exit(1);
});
