# iOS App Store Yükleme Rehberi - PopGo

## ✅ Hazırlanmış Olan:

1. **iOS Projesi Hazır**: Capacitor ile iOS projesi oluşturuldu
2. **Icon'lar Oluşturuldu**: Tüm iOS icon boyutları oluşturuldu
3. **Splash Screen Güncellendi**: iOS splash screen dosyaları güncellendi
4. **AdMob Entegrasyonu**: AdMob iOS v7.0.3 desteği yapılandırıldı
5. **AdMob Hatalar Düzeltildi**: Güncel AdMob API'si ile uyumlu hale getirildi

## 🛠 AdMob Hatalarını Çözdüm:

1. **AdMob Plugin Güncellendi**: v6.0.0'dan v7.0.3'e güncellendi
2. **API Değişiklikleri Uygulandı**: Yeni AdMob API'sine uygun yapılandırma
3. **Info.plist Güncellendi**: AdMob için gerekli ayarlar eklendi
4. **Cache Temizlendi**: iOS pod ve build cache'i temizlendi

## 🚀 App Store'a Yükleme Adımları:

### 1. Xcode'da Projeyi Açın
```bash
./build_ios_appstore.sh
```
veya manuel olarak:
```bash
npx cap open ios
```

### 2. Apple Developer Hesabı Ayarları
- Apple Developer Portal'da (developer.apple.com):
  - Bundle ID: `com.teknova.popgo` kayıtlı olmalı
  - App Store Connect'te uygulama oluşturulmalı
  - Gerekli sertifikalar ve provisioning profile'lar hazır olmalı

### 3. Xcode'da Build Ayarları
1. **Signing & Capabilities** sekmesinde:
   - Team: Apple Developer hesabınızı seçin
   - Bundle Identifier: `com.teknova.popgo` olarak ayarlayın
   - Signing Certificate: Distribution sertifikası seçin

2. **Info** sekmesinde:
   - Version: `1.2.7` (package.json'dan otomatik gelir)
   - Build: App Store Connect'te kullanılmayan bir sayı

### 4. AdMob iOS Setup (Gerekirse)
1. AdMob Console'da iOS App ID alın
2. `capacitor.config.ts`'te iOS AdMob ID'yi güncelleyin:
```typescript
AdMob: {
  applicationId: 'ca-app-pub-XXXX~YYYY', // iOS App ID
  // ... diğer ayarlar
}
```

### 5. Archive ve Upload
1. **Product → Archive** (⌘ + Shift + B ile build edin, hata yoksa archive edin)
2. Archive tamamlandığında **Distribute App** butonuna tıklayın
3. **App Store Connect** seçeneğini seçin
4. **Upload** seçeneğini seçin
5. Upload işlemini tamamlayın

### 6. App Store Connect'te
1. TestFlight'ta test edin
2. App Review'a gönderin
3. Metadata, screenshots vb. ekleyin

## 📱 Önemli Dosyalar:

- `ios/App/App.xcworkspace` - Ana Xcode projesi
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/` - App icon'ları
- `ios/App/App/Assets.xcassets/Splash.imageset/` - Splash screen
- `ios/App/App/Info.plist` - App bilgileri
- `capacitor.config.ts` - Capacitor ayarları

## 🛠 Build Script'leri:

- `./build_ios_appstore.sh` - iOS build ve Xcode açma
- `./fix_ios_admob.sh` - AdMob hatalarını düzeltme
- `./generate_ios_icons.sh` - iOS icon'larını yeniden oluşturma
- `npm run ios:open` - Xcode'da proje açma
- `npm run ios:sync` - iOS projesini senkronize etme

## 🆘 AdMob Hatası Aldıysanız:

```bash
./fix_ios_admob.sh
```

Bu script:
- AdMob plugin'ini güncel sürüme günceller
- iOS cache'ini temizler
- Projeyi yeniden senkronize eder
- Xcode cache'ini temizler

## 🎯 Bundle ID: com.teknova.popgo
Bu ID'nin Apple Developer Portal'da kayıtlı olması gerekir.

## ⚠️ Önemli Notlar:

1. **Apple Developer Program** üyeliği gereklidir (yıllık $99)
2. **Mac bilgisayar** ve **Xcode** gereklidir
3. **Bundle ID** benzersiz olmalı ve Apple'da kayıtlı olmalı
4. **AdMob iOS App ID** alıp capacitor.config.ts'te güncellemeyi unutmayın
5. **Privacy Policy** ve **Terms of Service** linkleriniz çalışır durumda olmalı

## 🆘 Sorun Giderme:

### Build Hataları:
- Xcode'da Clean Build Folder (⌘ + Shift + K)
- `npx cap sync ios` ile projeyi yeniden senkronize edin

### Signing Hataları:
- Apple Developer Portal'da Bundle ID kontrolü
- Xcode'da doğru Team seçimi
- Provisioning Profile kontrolü

### AdMob Hataları:
- iOS AdMob App ID kontrolü
- Info.plist'te GADApplicationIdentifier kontrolü
