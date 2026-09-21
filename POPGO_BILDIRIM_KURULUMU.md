# PopGo — Günlük Hatırlatma Bildirimleri

Bilgoo ve Novalingo'daki sistemin aynısı: bildirimleri **GitHub Actions cron'u**
gönderir, Firebase Cloud Functions kullanılmaz. FCM gönderimi Firebase Spark
planında ücretsizdir; ücretli olan yalnızca Cloud Functions zamanlayıcısıdır.

## Nasıl çalışır

```
Oyuncu 2. bölümü bitirir
  → popgo-push.js bildirim izni ister
  → izin verilirse cihaz FCM "popgo_daily" konusuna abone olur

GitHub Actions (her gün 13:00 ve 20:00 TR)
  → .github/scripts/send-popgo-notifications.mjs
  → "popgo_daily" konusuna tek mesaj
  → abone olan tüm cihazlara bildirim
```

**Novalingo'dan farkı:** PopGo'da hesap ve veritabanı yok. Bu yüzden cihaz
token'ları saklanmıyor; cihazlar ortak bir konuya (topic) abone oluyor. Geçersiz
token temizliğini FCM kendisi yapıyor.

| Parça | Dosya |
|---|---|
| İzin + abonelik (uygulama) | `popgo-push.js` (kök + `www/`) |
| Tetikleyici | `app.js` → `showLevelCompleteScreen()` → `popgoMaybeAskForPush()` |
| iOS APNs köprüsü | `ios/App/App/AppDelegate.swift` (3 metot) |
| iOS yetkisi | `ios/App/App/App.entitlements`, `Info.plist` → `UIBackgroundModes` |
| Android ikon/kanal | `AndroidManifest.xml`, `res/drawable/ic_stat_popgo.xml` |
| Zamanlama | `.github/workflows/popgo-notifications.yml` |
| Metinler | `.github/scripts/send-popgo-notifications.mjs` → `MESSAGES` |

Ölçüm olayları: `push_permission` (granted 0/1) ve `push_open` (slot).

## Bir kerelik kurulum (panel işleri)

### 1. APNs anahtarını Firebase'e yükle (iOS için şart)

Bilgoo ve Novalingo ile **aynı Apple ekibi** (`29D6U2Z923`). APNs anahtarları
ekip genelindedir, Bilgoo'da kullandığın `.p8` dosyası burada da geçerli.

Firebase Console → **popgo-1c34f** → ⚙️ Project settings → **Cloud Messaging**
→ Apple app configuration (`com.popgo.game`) → **APNs Authentication Key** →
Upload: `.p8` dosyası, **Key ID**, **Team ID** `29D6U2Z923`.

> Bu adım yapılmazsa Android'e bildirim gider, iOS'a hiç gitmez ve hata da
> görünmez.

### 2. Apple Developer'da push yetkisi

Xcode otomatik imzalama (`Automatic`) açık; `App.entitlements` içindeki
`aps-environment` sayesinde Xcode ilk arşivde App ID'ye Push Notifications
yeteneğini kendisi ekler. Hata verirse: developer.apple.com → Identifiers →
`com.popgo.game` → **Push Notifications** kutusunu işaretle.

### 3. Firebase hizmet hesabı anahtarı

Firebase Console → ⚙️ Project settings → **Service accounts** →
**Generate new private key** → JSON dosyası iner.

> Bu dosya projeye tam yetki verir. Depoya **commit etme**, kimseyle paylaşma.

### 4. GitHub'a secret olarak ekle

github.com/veteroner/balonpatlatma → Settings → **Environments** →
New environment → adı tam olarak **`FIREBASE_SERVICE_ACCOUNT`** →
Add environment secret → adı **`FIREBASE_SERVICE_ACCOUNT`**, değeri JSON
dosyasının **tüm içeriği**.

(Novalingo'da da secret bir Environment'ın içinde; workflow bu ortamı adıyla
istiyor.)

### 5. Deneme

Actions → **PopGo Notifications** → Run workflow:

1. `dry_run` işaretli → hangi metnin gideceğini loglar, göndermez.
2. `dry_run` işaretsiz → gerçekten gönderir. Log'da `Gönderildi: projects/...`
   görmelisin.

Bildirimin cihaza ulaşması için o cihazda uygulamanın **bu sürümünün** kurulu
olması ve izin verilmiş olması gerekir.

### 6. Yeni sürümü yayınla

Bildirim kodu yalnızca yeni sürümde var. Build numarasını artırıp (iOS build,
Android `versionCode`) mağazalara gönder.

## Bilinen sınırlar

- GitHub zamanlanmış işleri yoğunlukta birkaç dakika geciktirebilir.
- Depoda **60 gün** hiç commit olmazsa GitHub cron'u otomatik durdurur.
  Actions sekmesinde uyarı çıkar, tek tıkla yeniden açılır.
- İzin bir kez reddedilirse iOS bir daha sormaz; kullanıcı Ayarlar'dan açmalı.
- Saat ve metin değiştirmek için yalnızca workflow/betik dosyası düzenlenir,
  uygulamayı yeniden yayınlamak gerekmez.
