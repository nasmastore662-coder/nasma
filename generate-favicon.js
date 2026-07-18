const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// دالة لإنشاء ملف ICO حقيقي من صور PNG
// تنسيق ICO: header + directory + image data
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

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#C4A882"/>
  <path d="M 20 58 L 20 38 Q 20 18 50 18 Q 80 18 80 38 L 80 58" 
        stroke="#FAF8F5" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 20 58 Q 20 72 32 72 L 68 72 Q 80 72 80 58"
        stroke="#FAF8F5" stroke-width="11" fill="none" stroke-linecap="round"/>
  <circle cx="50" cy="87" r="6" fill="#FAF8F5"/>
</svg>`;

async function main() {
  const svgBuffer = Buffer.from(svgContent);
  
  // إنشاء ملف ICO حقيقي
  await createRealIco(svgBuffer, path.join(__dirname, 'favicon.ico'));
  
  // التحقق
  const icoSize = fs.statSync(path.join(__dirname, 'favicon.ico')).size;
  console.log(`favicon.ico size: ${icoSize} bytes`);
  
  // قراءة أول 4 bytes للتحقق من التوقيع
  const buf = fs.readFileSync(path.join(__dirname, 'favicon.ico'));
  console.log(`ICO signature bytes: ${buf[0]},${buf[1]},${buf[2]},${buf[3]} (should be 0,0,1,0)`);
}

main().catch(console.error);
