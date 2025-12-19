# Google AdMob Entegrasyonu Tamamlandı

Bu dokümantasyon, balon patlatma oyununa Google AdMob geçiş reklamlarının nasıl entegre edildiğini açıklar.

## Yapılan Değişiklikler

### 1. Android Build Gradle (android/app/build.gradle)
- Google Mobile Ads SDK eklendi: `com.google.android.gms:play-services-ads:23.5.0`

### 2. AndroidManifest.xml
- AdMob Application ID eklendi: `ca-app-pub-7610338852404534~4318740468`
- `<meta-data>` etiketi ile uygulama ID'si tanımlandı

### 3. MainActivity.java
- Mobile Ads SDK başlatma kodu eklendi
- Interstitial ad yükleme ve gösterme fonksiyonları eklendi
- Capacitor plugin olarak AdMob desteği eklendi
- Ad ID kullanılıyor: `ca-app-pub-7610338852404534/1658037266`

### 4. JavaScript AdManager Sınıfı (app.js ve www/app.js)
- Capacitor ortam kontrolü eklendi
- Native AdMob ve web AdSense desteği
- Asenkron reklam gösterimi
- Ad hazır olma kontrolü

### 5. google-services.json
- Firebase/AdMob konfigürasyon dosyası oluşturuldu
- Test ve prodüksiyon reklam ID'leri tanımlandı

## Reklam Gösterim Mantığı

### Oyun Bittiğinde
- Her 3 oyunda bir geçiş reklamı gösterilir
- 2 saniye gecikme ile gösterilir

### Seviye Tamamlandığında  
- Her 5 seviyede bir geçiş reklamı gösterilir
- 3 saniye gecikme ile gösterilir

### Minimum Aralık
- Reklamlar arasında minimum 2 dakika (120 saniye) aralık vardır

## Kurulum Adımları

### 1. Projeyi Temizle ve Yeniden İnşa Et
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
npx cap build android
```

### 2. Android Studio ile Aç
```bash
npx cap open android
```

### 3. Gerçek Google Services Dosyası
`android/app/google-services.json` dosyasını Firebase Console'dan indirilen gerçek dosya ile değiştirin.

### 4. Test Etme
- Geliştirme aşamasında test reklam ID'leri kullanılır
- Prodüksiyon için gerçek reklam ID'lerini kullanın

## Önemli Notlar

1. **Test Reklamları**: Geliştirme sırasında test reklam ID'lerini kullanın
2. **Prodüksiyon**: Canlıya almadan önce gerçek reklam ID'lerini kullanın
3. **İzinler**: INTERNET ve ACCESS_NETWORK_STATE izinleri zaten mevcut
4. **Minimum SDK**: Android API 21+ gereklidir (zaten destekleniyor)

## Reklam ID'leri

### Test ID'leri (Geliştirme için)
- Interstitial: `ca-app-pub-3940256099942544/1033173712`

### Prodüksiyon ID'leri (Canlı için)
- Application ID: `ca-app-pub-7610338852404534~4318740468`
- Interstitial: `ca-app-pub-7610338852404534/1658037266`

## Sorun Giderme

### Reklam Gösterilmiyor
1. Internet bağlantısını kontrol edin
2. Reklam ID'lerinin doğru olduğundan emin olun
3. AdMob hesabının aktif olduğunu doğrulayın
4. Google Services dosyasının doğru olduğunu kontrol edin

### Konsol Logları
- `AdMob interstitial ad shown`: Reklam başarıyla gösterildi
- `Ad not ready`: Reklam henüz yüklenmedi
- `Failed to show AdMob interstitial`: Reklam gösterme hatası

## Web Desteği
Capacitor ortamında değilken (web'de çalışırken) otomatik olarak AdSense fallback'i kullanılır.
