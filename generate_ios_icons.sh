#!/bin/bash

# iOS Icon Generator Script
# PopGo - Balon Patlatma Oyunu

echo "🍎 iOS icon'ları oluşturuluyor..."

# Ana icon dosyasından farklı boyutlarda icon'lar oluştur
ICON_SOURCE="icon.svg"
IOS_ICONS_DIR="ios/App/App/Assets.xcassets/AppIcon.appiconset"

if [ ! -f "$ICON_SOURCE" ]; then
    echo "❌ Hata: $ICON_SOURCE dosyası bulunamadı!"
    exit 1
fi

# Node.js ile icon'ları oluştur
node -e "
const sharp = require('sharp');
const fs = require('fs');

const sizes = [
    { name: 'AppIcon-20x20@1x.png', size: 20 },
    { name: 'AppIcon-20x20@2x.png', size: 40 },
    { name: 'AppIcon-20x20@3x.png', size: 60 },
    { name: 'AppIcon-29x29@1x.png', size: 29 },
    { name: 'AppIcon-29x29@2x.png', size: 58 },
    { name: 'AppIcon-29x29@3x.png', size: 87 },
    { name: 'AppIcon-40x40@1x.png', size: 40 },
    { name: 'AppIcon-40x40@2x.png', size: 80 },
    { name: 'AppIcon-40x40@3x.png', size: 120 },
    { name: 'AppIcon-60x60@2x.png', size: 120 },
    { name: 'AppIcon-60x60@3x.png', size: 180 },
    { name: 'AppIcon-76x76@1x.png', size: 76 },
    { name: 'AppIcon-76x76@2x.png', size: 152 },
    { name: 'AppIcon-83.5x83.5@2x.png', size: 167 },
    { name: 'AppIcon-512@2x.png', size: 1024 }
];

async function generateIcons() {
    for (const icon of sizes) {
        try {
      // App Store requires icons to be fully opaque (no alpha / transparency).
      // We composite the SVG onto a solid background and output an RGB PNG.
      await sharp('$ICON_SOURCE')
        .resize(icon.size, icon.size)
        // Merge any transparency with an opaque background (white by default)
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        // Ensure 24-bit RGB PNG output (no alpha channel)
        .png({ force: true })
        .toFile('$IOS_ICONS_DIR/' + icon.name);
            console.log('✅ ' + icon.name + ' oluşturuldu');
        } catch (error) {
            console.error('❌ ' + icon.name + ' oluşturulamadı:', error.message);
        }
    }
}

generateIcons();
"

# Contents.json dosyasını güncelle
cat > "$IOS_ICONS_DIR/Contents.json" << 'EOF'
{
  "images" : [
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "20x20",
      "filename" : "AppIcon-20x20@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "20x20",
      "filename" : "AppIcon-20x20@3x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "29x29",
      "filename" : "AppIcon-29x29@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "29x29",
      "filename" : "AppIcon-29x29@3x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "40x40",
      "filename" : "AppIcon-40x40@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "40x40",
      "filename" : "AppIcon-40x40@3x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "60x60",
      "filename" : "AppIcon-60x60@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "60x60",
      "filename" : "AppIcon-60x60@3x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "20x20",
      "filename" : "AppIcon-20x20@1x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "20x20",
      "filename" : "AppIcon-20x20@2x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "29x29",
      "filename" : "AppIcon-29x29@1x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "29x29",
      "filename" : "AppIcon-29x29@2x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "40x40",
      "filename" : "AppIcon-40x40@1x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "40x40",
      "filename" : "AppIcon-40x40@2x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "76x76",
      "filename" : "AppIcon-76x76@1x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "76x76",
      "filename" : "AppIcon-76x76@2x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "83.5x83.5",
      "filename" : "AppIcon-83.5x83.5@2x.png"
    },
    {
      "idiom" : "ios-marketing",
      "scale" : "1x",
      "size" : "1024x1024",
      "filename" : "AppIcon-512@2x.png"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF

echo "✅ iOS icon'ları başarıyla oluşturuldu!"
echo "📁 Icon'lar şu klasörde: $IOS_ICONS_DIR"

# Basit doğrulama: 1024px (ios-marketing) ikonunda alfa kanalı olmadığını kontrol et
if command -v sips >/dev/null 2>&1; then
  MARKETING_ICON="$IOS_ICONS_DIR/AppIcon-512@2x.png"
  if [ -f "$MARKETING_ICON" ]; then
    HAS_ALPHA=$(sips -g hasAlpha "$MARKETING_ICON" | awk '/hasAlpha/ {print $2}')
    if [ "$HAS_ALPHA" = "yes" ]; then
      echo "❌ Uyarı: $MARKETING_ICON dosyasında alpha kanalı bulundu. Lütfen tekrar oluşturmayı deneyin."
      exit 2
    else
      echo "🧪 Doğrulama: $MARKETING_ICON alfa kanalı içermiyor."
    fi
  fi
fi
