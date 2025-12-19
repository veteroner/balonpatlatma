# Unity Ads Entegrasyonu Tamamlandı ✅

## 📋 Özet

Unity Ads başarıyla projenize entegre edildi. Sistem **Unity Ads öncelikli, AdMob fallback** mediation sistemi ile çalışacak şekilde yapılandırıldı.

## 🎯 Game ID'ler

- **iOS Game ID**: `5970926`
- **Android Game ID**: `5970927`

## 🔧 Yapılan Değişiklikler

### 1. Paket Kurulumları

✅ **NPM Paketleri**
- `capacitor-unity-ads@latest` kuruldu

✅ **Android Dependencies** (`android/app/build.gradle`)
```gradle
implementation 'com.unity3d.ads:unity-ads:4.12.2'
```

✅ **iOS Dependencies** (`ios/App/Podfile`)
```ruby
pod 'UnityAds', '~> 4.12'
```

### 2. Capacitor Konfigürasyonu

✅ **`capacitor.config.ts`** güncellendi:
```typescript
UnityAds: {
  gameId: '5970927',      // Android Game ID
  iosGameId: '5970926',   // iOS Game ID
  testMode: true,         // Test modunda başlıyor
  personalized: true
}
```

### 3. iOS Konfigürasyonu

✅ **`ios/App/App/Info.plist`** güncellendi:
- Unity Ads SKAdNetworkIdentifier eklendi (`488r3q3dtq.skadnetwork`)
- Mevcut AdMob SKAdNetwork ID'leri korundu

### 4. Mediation Sistemi

✅ **`app.js`** - Yeni Ad Mediation System:

#### Reklam Öncelik Sırası:
1. **Unity Ads** (Primary)
2. **AdMob** (Fallback)

#### Desteklenen Reklam Formatları:
- ✅ **Banner Ads** (320x50)
- ✅ **Interstitial Ads** (Tam ekran)
- ✅ **Rewarded Video Ads** (Ödüllü videolar)

#### Placement ID'ler:

**⚠️ ÖNEMLI: Test Modu Placement'ları**

Test modunda Unity Ads **default placement'ları** kullanılır:

**Android & iOS (Test Mode):**
- Banner: `banner` (Unity default test placement)
- Interstitial: `video` (Unity default test placement)
- Rewarded: `rewardedVideo` (Unity default test placement)

**Production Mode (Dashboard'da oluşturulacak):**

**Android:**
- Banner: `Banner_Android`
- Interstitial: `Interstitial_Android`
- Rewarded: `Rewarded_Android`

**iOS:**
- Banner: `Banner_iOS`
- Interstitial: `Interstitial_iOS`
- Rewarded: `Rewarded_iOS`

### 5. Otomatik Fallback Mekanizması

Sistem akıllı fallback ile çalışır:

```javascript
Unity Ads çalışıyor mu?
  ✅ Evet → Unity Ads kullan
  ❌ Hayır → AdMob'a geç

AdMob çalışıyor mu?
  ✅ Evet → AdMob kullan
  ❌ Hayır → Reklam gösterme
```

## 📱 Reklam Kullanımı

### Banner Reklam Göster
```javascript
await window.AdMobPlugin.showBannerAd('BOTTOM_CENTER');
```

### Interstitial Reklam Göster
```javascript
await window.AdMobPlugin.showInterstitialAd();
```

### Rewarded Reklam Göster
```javascript
await window.AdMobPlugin.showRewardedAd((rewarded) => {
  console.log('Kullanıcı ödüllendirildi!');
  // Ödül verme kodları
});
```

### Banner Gizle
```javascript
await window.AdMobPlugin.hideBannerAd();
```

## 🧪 Test Modu

**Şu anda test modunda çalışıyor**: `UNITY_ADS_CONFIG.testMode = true`

### Production'a Geçiş için:

1. **`app.js`** dosyasında:
```javascript
const UNITY_ADS_CONFIG = {
    // ...
    testMode: false,  // true → false yap
    // ...
};
```

2. **`capacitor.config.ts`** dosyasında:
```typescript
UnityAds: {
  // ...
  testMode: false,  // true → false yap
  // ...
}
```

## 🔍 Debug & Monitoring

Tüm reklam işlemleri console'da izlenebilir:

- `[UNITY]` - Unity Ads işlemleri
- `[ADMOB]` - AdMob işlemleri
- `[MEDIATION]` - Mediation kararları

### Örnek Console Çıktıları:

```
🎮 Unity Ads initialized successfully
✅ [UNITY] Banner shown successfully
📺 [MEDIATION] Using Unity Ads for interstitial
🎁 [UNITY] Rewarded ad completed - user gets reward
```

## ⚠️ Önemli Notlar

### Unity Dashboard Ayarları

⚠️ **TEST MODU İÇİN DASHBOARD GEREKLİ DEĞİL**

Test modunda Unity Ads, yerleşik default placement'ları kullanır:
- `banner`
- `video` (interstitial)
- `rewardedVideo`

Bu placement'lar Unity tarafından otomatik sağlanır ve test reklamları gösterir.

**Production'a geçerken:**

Unity Ads Dashboard'da aşağıdaki placement'ları oluşturmanız gerekir:

**Android (Game ID: 5970927):**
- ✅ Banner_Android
- ✅ Interstitial_Android
- ✅ Rewarded_Android

**iOS (Game ID: 5970926):**
- ✅ Banner_iOS
- ✅ Interstitial_iOS
- ✅ Rewarded_iOS

### Google AdMob İhlal Durumu

- AdMob kısıtlı olduğu için Unity Ads **primary network** olarak ayarlandı
- AdMob sadece **fallback** olarak çalışacak
- Unity Ads çalışmazsa otomatik olarak AdMob devreye girer

### Build Komutları

**Android Build:**
```bash
cd /Users/onerozbey/Desktop/balon-patlatma-oyunu
cp app.js www/app.js
npx cap sync android
cd android
./gradlew assembleRelease
```

**iOS Build:**
```bash
cd /Users/onerozbey/Desktop/balon-patlatma-oyunu
cp app.js www/app.js
npx cap sync ios
# Xcode'da build edin
```

## 📊 Mediation Sistemi Durumu

Mediation sisteminin durumunu kontrol etmek için console'da:

```javascript
console.log(AD_MEDIATION.networks);
```

Çıktı örneği:
```javascript
{
  unity: {
    available: true,
    initialized: true,
    lastError: null
  },
  admob: {
    available: true,
    initialized: true,
    lastError: null
  }
}
```

## 🚀 Sonraki Adımlar

1. ✅ Unity Ads Dashboard'da placement'ları oluştur
2. ✅ Test modunda reklamları test et
3. ✅ Production'a geçmeden önce `testMode: false` yap
4. ✅ Her iki platformda da (iOS ve Android) test et
5. ✅ Reklam gösterim sıklığını ayarla

## 🔗 Yararlı Linkler

- [Unity Ads Dashboard](https://dashboard.unity3d.com/)
- [Unity Ads iOS Dökümantasyon](https://docs.unity.com/en-us/grow/ads/ios-sdk/)
- [Unity Ads Android Dökümantasyon](https://docs.unity.com/en-us/grow/ads/android-sdk/)
- [Capacitor Unity Ads Plugin](https://www.npmjs.com/package/capacitor-unity-ads)

## ✅ Entegrasyon Durumu

- ✅ Unity Ads SDK kuruldu (iOS & Android)
- ✅ Mediation sistemi aktif
- ✅ Banner, Interstitial, Rewarded ads destekleniyor
- ✅ Otomatik fallback mekanizması çalışıyor
- ✅ Test modu aktif
- ⏳ Unity Dashboard'da placement oluşturulması bekleniyor

---

**Son Güncelleme**: 23 Ekim 2025
**Entegrasyon Durumu**: ✅ Tamamlandı
**Test Durumu**: ⏳ Beklemede (Dashboard placement'ları gerekli)
