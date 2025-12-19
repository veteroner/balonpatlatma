const sharp = require('sharp');
const fs = require('fs');

// Feature graphic SVG dosyasını oku
const svgContent = fs.readFileSync('feature_graphic.svg');

async function generateFeatureGraphic() {
  console.log('Özellik grafiği oluşturuluyor...');
  
  try {
    await sharp(svgContent)
      .resize(1024, 500)
      .png({ quality: 100, compressionLevel: 0 })
      .toFile('feature_graphic_1024x500.png');
    
    console.log('✓ feature_graphic_1024x500.png (1024x500) oluşturuldu');
    
    // JPEG versiyonu da oluşturalım (daha küçük dosya boyutu için)
    await sharp(svgContent)
      .resize(1024, 500)
      .jpeg({ quality: 95 })
      .toFile('feature_graphic_1024x500.jpg');
    
    console.log('✓ feature_graphic_1024x500.jpg (1024x500) oluşturuldu');
    
    console.log('\nÖzellik grafiği başarıyla oluşturuldu!');
    console.log('\nGoogle Play Console için:');
    console.log('- feature_graphic_1024x500.png veya .jpg dosyasını "Özellik grafiği" olarak yükleyin');
    console.log('- Boyut: 1024x500 piksel');
    console.log('- Format: PNG veya JPEG');
    console.log('- Maksimum dosya boyutu: 15 MB');
    
  } catch (error) {
    console.error('✗ Özellik grafiği oluşturulurken hata:', error.message);
  }
}

generateFeatureGraphic().catch(console.error);
