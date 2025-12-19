#!/bin/bash

# iOS AdMob Build Fix Script
# PopGo - Balon Patlatma Oyunu

echo "🛠 iOS AdMob hatalarını düzeltiyorum..."

# 1. AdMob plugin'ini güncel sürüme güncelle
echo "📦 AdMob plugin'ini güncelliyorum..."
npm uninstall @capacitor-community/admob
npm install @capacitor-community/admob@latest

# 2. iOS pod cache'ini temizle
echo "🧹 iOS cache'ini temizliyorum..."
rm -rf ios/App/Pods
rm -rf ios/App/Podfile.lock
rm -rf ios/App/.build

# 3. iOS projesini yeniden senkronize et
echo "🔄 iOS projesini senkronize ediyorum..."
npx cap sync ios

# 4. Xcode derived data'yı temizle
echo "🗑 Xcode cache'ini temizliyorum..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*

echo "✅ iOS AdMob düzeltmeleri tamamlandı!"
echo ""
echo "🚀 Xcode'da yapmanız gerekenler:"
echo "1. Product → Clean Build Folder (⌘ + Shift + K)"
echo "2. Product → Build (⌘ + B)"
echo "3. Hatalar düzeldiyse Product → Archive yapın"
echo ""
echo "💡 Eğer hala hata alıyorsanız:"
echo "- Xcode'u kapatıp tekrar açın"
echo "- iOS Deployment Target'ı 11.0 veya üzeri yapın"
echo "- Bundle ID'nin Apple Developer'da kayıtlı olduğundan emin olun"
