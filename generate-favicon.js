const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// محتوى الـ SVG الجديد مع كتابة كلمة "نسما" بخلفية متدرجة ذهبية راقية
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D5BE9E"/>
      <stop offset="100%" stop-color="#A68962"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="24" fill="url(#bgGrad)"/>
  <text x="50%" y="54%" 
        font-family="'Amiri', 'Cairo', 'Tajawal', 'Segoe UI', 'Tahoma', sans-serif" 
        font-size="34" 
        font-weight="bold" 
        fill="#FAF8F5" 
        text-anchor="middle" 
        dominant-baseline="middle">نسما</text>
</svg>`;

// دالة لإنشاء ملف ICO حقيقي من صور PNG
async function createRealIco(inputSvgBuffer, outputPath) {
  // إنشاء صور PNG بأحجام ICO القياسية
  const sizes = [16, 32, 48];
  const pngBuffers = [];
  
  for (const size of sizes) {
    const buf = await sharp(inputSvgBuffer)
      .resize(size, size)
      .png()
      .toBuffer();
    pngBuffers.push({ size, buf });
  }
  
  // حساب الحجم الكلي
  const headerSize = 6; // ICO header
  const dirEntrySize = 16; // لكل صورة في الـ directory
  const dirSize = dirEntrySize * sizes.length;
  let totalImageSize = 0;
  for (const { buf } of pngBuffers) totalImageSize += buf.length;
  
  const totalSize = headerSize + dirSize + totalImageSize;
  const ico = Buffer.alloc(totalSize);
  
  // ICO Header
  ico.writeUInt16LE(0, 0);       // Reserved
  ico.writeUInt16LE(1, 2);       // Type: 1 = ICO
  ico.writeUInt16LE(sizes.length, 4); // Count
  
  // Directory entries + image data
  let dirOffset = headerSize;
  let imageOffset = headerSize + dirSize;
  
  for (const { size, buf } of pngBuffers) {
    // Directory entry (16 bytes)
    ico.writeUInt8(size === 256 ? 0 : size, dirOffset);     // Width
    ico.writeUInt8(size === 256 ? 0 : size, dirOffset + 1); // Height
    ico.writeUInt8(0, dirOffset + 2);  // Color count (0 = no palette)
    ico.writeUInt8(0, dirOffset + 3);  // Reserved
    ico.writeUInt16LE(1, dirOffset + 4); // Color planes
    ico.writeUInt16LE(32, dirOffset + 6); // Bits per pixel
    ico.writeUInt32LE(buf.length, dirOffset + 8); // Image size
    ico.writeUInt32LE(imageOffset, dirOffset + 12); // Offset to image data
    
    // Copy image data
    buf.copy(ico, imageOffset);
    
    dirOffset += dirEntrySize;
    imageOffset += buf.length;
  }
  
  fs.writeFileSync(outputPath, ico);
  console.log(`✓ Real ICO created: ${path.basename(outputPath)} (${ico.length} bytes)`);
}

async function main() {
  const svgBuffer = Buffer.from(svgContent);
  const imagesDir = path.join(__dirname, 'assets', 'images');
  
  // التأكد من وجود مجلد الصور
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // 1. حفظ ملف favicon.svg المحدث
  fs.writeFileSync(path.join(imagesDir, 'favicon.svg'), svgContent);
  console.log('✓ Updated assets/images/favicon.svg');
  
  // 2. إنشاء ملف favicon.ico في الجذر
  await createRealIco(svgBuffer, path.join(__dirname, 'favicon.ico'));
  
  // 3. إنشاء وتوليد جميع أحجام الـ PNG المطلوبة للأجهزة وشاشات الريتينا والـ PWA
  const pngSizes = {
    'favicon-16.png': 16,
    'favicon-32.png': 32,
    'favicon-48.png': 48,
    'favicon-64.png': 64,
    'favicon-128.png': 128,
    'favicon-180.png': 180,
    'favicon-192.png': 192,
    'favicon-512.png': 512,
    'apple-touch-icon.png': 180
  };
  
  for (const [filename, size] of Object.entries(pngSizes)) {
    const outputPath = path.join(imagesDir, filename);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated: assets/images/${filename} (${size}x${size})`);
  }
  
  console.log('\n🎉 All favicons and touch icons generated successfully with "نسما"!');
}

main().catch(console.error);
