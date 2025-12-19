# 📥 Google Services Dosyalarını İndirme - Adım Adım

## 🔴 ŞU ANDA EKRANINIZDAKI SAYFADA:

### 1. **Android için google-services.json:**

Ekranınızda görebiliyorum:
- ✅ PopGo Android uygulaması seçili
- ✅ Uygulama Kimliği: `ca-app-pub-7610338885240453~4318740068` (doğru!)
- ✅ Onay durumu: "Hazır" (yeşil)

**ŞİMDİ YAPACAKLAR:**

1. **Bağlı hizmetler** kısmına inin (sayfayı aşağı kaydırın)
2. **"Bağlı hizmetleri yönetin"** butonuna tıklayın
3. **Firebase** altında **"google-services.json indir"** butonunu bulun
4. Dosyayı indirin

**VEYA ALTERNATİF:**
1. Sol menüden **"Uygulama ayarları"** → **"Uygulama bilgisi"** 
2. **Android app** sekmesine gidin
3. **"google-services.json indir"** butonuna tıklayın

### 2. **iOS için GoogleService-Info.plist:**

Aynı sayfada:
1. **"iOS app"** sekmesine geçin (Android'in yanında)
2. **"GoogleService-Info.plist indir"** butonuna tıklayın

## 📁 İndirdikten Sonra Dosyaları Nereye Koyacağınız:

```
android/app/google-services.json          ← Android dosyası
ios/App/App/GoogleService-Info.plist      ← iOS dosyası
```

## 🚀 İndirme Sonrası:

```bash
# Projenizde çalıştırın:
npx cap sync android
npx cap sync ios
npx cap build android
npx cap build ios
```

## ❗ Eğer Bulamıyorsanız:

1. Sol menüden **"Uygulamalar"** → **"Tüm uygulamalar"**
2. **PopGo** uygulamasını seçin
3. ⚙️ **Ayarlar** simgesine tıklayın
4. **"Uygulama ayarları"** → **"Firebase ayarları"**
5. **"Config dosyalarını indir"** kısmından indirin

**Dosyaları indirdikten sonra bana haber verin, yerleştirilmesine yardım ederim!**
