const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG dosyasını oku
const svgContent = fs.readFileSync('android_app_icon.svg');

// Google Play Console için gerekli boyutlar
const sizes = [
  { size: 512, name: 'app_icon_512x512.png' },     // Uygulama simgesi (512x512)
  { size: 192, name: 'app_icon_192x192.png' },     // Adaptive icon (192x192)
  { size: 108, name: 'app_icon_108x108.png' },     // Adaptive icon foreground (108x108)
  { size: 72, name: 'app_icon_72x72.png' },        // HDPI
  { size: 48, name: 'app_icon_48x48.png' },        // MDPI
  { size: 96, name: 'app_icon_96x96.png' },        // XHDPI
  { size: 144, name: 'app_icon_144x144.png' },     // XXHDPI
];

async function generateIcons() {
  console.log('SVG\'den PNG simgeler oluşturuluyor...');
  
  for (const { size, name } of sizes) {
    try {
      await sharp(svgContent)
        .resize(size, size)
        .png({ quality: 100, compressionLevel: 0 })
        .toFile(name);
      
      console.log(`✓ ${name} (${size}x${size}) oluşturuldu`);
    } catch (error) {
      console.error(`✗ ${name} oluşturulurken hata:`, error.message);
    }
  }
  
  console.log('\nTüm simgeler başarıyla oluşturuldu!');
  console.log('\nGoogle Play Console için:');
  console.log('- app_icon_512x512.png dosyasını "Uygulama simgesi" olarak yükleyin');
  console.log('- Boyut: 512x512 piksel');
  console.log('- Format: PNG veya JPEG');
  console.log('- Maksimum dosya boyutu: 1 MB');
}

generateIcons().catch(console.error);
