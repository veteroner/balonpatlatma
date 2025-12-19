#!/bin/bash

# iOS AppStore Release Build Script
# PopGo - Balon Patlatma Oyunu

echo "🍎 iOS AppStore Build başlatılıyor..."

# Web assets'i güncelle
echo "📁 Web assets'leri kopyalıyorum..."
cp -r ./* www/ 2>/dev/null || true

# iOS projesini senkronize et
echo "🔄 iOS projesini senkronize ediyorum..."
npx cap sync ios

# iOS projesini Xcode'da aç
echo "🚀 Xcode'da iOS projesini açıyorum..."
npx cap open ios

echo ""
echo "✅ iOS projesi hazır!"
echo ""
echo "📱 App Store'a yüklemek için:"
echo "1. Xcode'da proje açıldığında 'Product' menüsünden 'Archive' seçin"
echo "2. Archive başarılı olduktan sonra 'Distribute App' butonuna tıklayın"
echo "3. 'App Store Connect' seçeneğini seçin"
echo "4. 'Upload' seçeneğini seçin ve yükleme işlemini tamamlayın"
echo ""
echo "🎯 Önemli Notlar:"
echo "- Apple Developer hesabınızın aktif olduğundan emin olun"
echo "- Bundle ID'nizin (com.teknova.popgo) Apple Developer Portal'da kayıtlı olduğundan emin olun"
echo "- Gerekli provisioning profile'ların güncel olduğundan emin olun"
echo ""
