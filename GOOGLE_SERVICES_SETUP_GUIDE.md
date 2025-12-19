# 🚀 Google Services Dosyaları Kurulum Rehberi

## ❗ Kritik Eksik Dosyalar

Reklam entegrasyonunuzun tam olarak çalışması için aşağıdaki dosyalar **mutlaka** eklenmeli:

### 📱 Android için:
```
❌ android/app/google-services.json
```

### 🍎 iOS için:
```
❌ ios/App/App/GoogleService-Info.plist
```

## 📋 Nasıl Alınır?

### 1. Google AdMob Console'a gidin:
- https://apps.admob.com/
- Uygulamanızı seçin (PopGo)

### 2. Android için:
1. **App settings** → **App information** → **Android app**
2. **Download google-services.json** butonuna tıklayın
3. İndirilen dosyayı şu konuma yerleştirin:
   ```
   /android/app/google-services.json
   ```

### 3. iOS için:
1. **App settings** → **App information** → **iOS app** 
2. **Download GoogleService-Info.plist** butonuna tıklayın
3. İndirilen dosyayı şu konuma yerleştirin:
   ```
   /ios/App/App/GoogleService-Info.plist
   ```

## ⚡ Kurulum Sonrası:

### Android:
```bash
npx cap sync android
npx cap build android
```

### iOS:
```bash
npx cap sync ios  
npx cap build ios
```

## 🎯 Bu Dosyalar Neden Gerekli?

- **AdMob SDK** tam yapılandırması için
- **Analytics** entegrasyonu için
- **Firebase** bağlantısı için
- **Production reklamları** için

## ⚠️ Önemli Notlar:

1. Bu dosyalar olmadan reklamlar "No ad to show" hatası verebilir
2. Test reklamları çalışsa bile production reklamları çalışmayabilir
3. Her platform için ayrı dosya gereklidir
4. Dosyalar **tam olarak belirtilen konumlara** yerleştirilmeli

## ✅ Kurulum Tamamlandıktan Sonra:
- Uygulamayı yeniden build edin
- Test edin
- AdMob Console'da reklam gösterimlerini kontrol edin

**Bu dosyaları ekledikten sonra reklam sorunlarının büyük kısmı çözülecektir!**
