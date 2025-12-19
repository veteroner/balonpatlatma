# 🔄 iOS ATT İzinlerini Sıfırlama Rehberi

## Adım 1: Mevcut Durumu Kontrol Et
```
Ayarlar > Gizlilik ve Güvenlik > Takip
- "Uygulamaların Takip İzni İstemesine İzin Ver" AÇIK mı?
- PopGo listede var mı?
```

## Adım 2: PopGo'yu Tamamen Sil
1. Ana ekranda PopGo ikonuna uzun basın
2. "Uygulamayı Sil" seçin
3. "Sil" onaylayın

## Adım 3: iOS Ayarlarını Sıfırla (İsteğe Bağlı)
```
Ayarlar > Genel > Transfer veya iPhone'u Sıfırla > Sıfırla
"Konum ve Gizlilik Ayarlarını Sıfırla"
```
⚠️ Bu tüm uygulamaların gizlilik izinlerini sıfırlar

## Adım 4: Yeni Build Yükle
1. Xcode'dan temiz build yapın
2. iOS cihaza yükleyin
3. İlk açılışta ATT popup'ı gelmeli

## Adım 5: Debug Logları
Xcode Console'da şu logları arayın:
```
🔍 ATT Status at launch: 0  (0 = notDetermined)
🚀 Requesting ATT permission from native iOS...
✅ ATT Permission result: [1,2,3]  (1=denied, 2=restricted, 3=authorized)
```

## Adım 6: Test Senaryoları

### Senaryo A: İlk Kurulum
- Uygulama ilk kez açıldığında popup gelir
- Kullanıcı "İzin Ver" veya "İzin Verme" seçer

### Senaryo B: Önceki İzin Var
- Popup bir daha gelmez
- Ayarlardan manuel değiştirilebilir

### Senaryo C: Sistem Seviyesi Kapalı
- Hiçbir uygulama izin isteyemez
- "Uygulamaların Takip İzni İstemesine İzin Ver" AÇIK yapın

## 🚨 Eğer Hala Çalışmıyorsa

1. iOS sürümü 14+ olduğundan emin olun
2. Gerçek cihaz kullanın (Simulator değil)
3. AdMob hesabında Test Mode açık mı kontrol edin
4. Bundle ID doğru mu kontrol edin
