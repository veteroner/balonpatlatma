# PopGo — Reklamla Oyuncu Kazanma Planı

**Tarih:** 14 Eylül 2026 · **Durum:** Play'de 3 kurulum / 4 aylık aktif cihaz, 0 puan · iOS 8.9.0 (build 25)

Bu plan, Bilgoo için Temmuz–Ağustos'ta hazırladığım iki dokümanın
(`BUYUME_PLANI.md`, `GOOGLE_ADS_KAMPANYA_KURULUMU.md`) PopGo'ya uyarlanmış
hâli. Sıra aynı: **önce ölçüm, sonra bedava kanallar, en son para.**
Bilgoo'da ASO'yu atlayıp reklama gitmek istemiştik, hangi kanalın çalıştığını
ayırt edememe riski yüzünden araya bir hafta koyduk — burada da aynısı geçerli.

---

## 1. Bugünkü gerçek durum

| Konu | Durum | Kaynak |
|---|---|---|
| Play kurulum | 3 (28 gün), 4 aylık aktif cihaz | Play Console |
| Play puan | Yok ("–") | Play Console |
| Android paket | `com.teknova.popgo`, versionCode 40, 8.9.0 | `android/app/build.gradle` |
| iOS bundle | `com.popgo.game` ⚠️ | `ios/App/App.xcodeproj` |
| AdMob | Canlı (banner + geçiş + ödüllü), publisher `ca-app-pub-7610338885240453` | `www/app.js:557` |
| Reklam sıklığı | 90 sn global kapı, ilk 2 bölüm reklamsız, öne-gelme reklamı kaldırıldı | son commit |
| **Firebase Analytics** | ✅ **Kuruldu** (14 Eyl) — `@capacitor-firebase/analytics`, olay şeması `popgo-analytics.js` | Faz 0 |
| Uygulama içi puan istemi | ✅ **Kuruldu** (14 Eyl) — `popgo-rating.js`, 5. bölüm sonrası, sürüm başına bir kez | Faz 0 |
| Mağaza metinleri / ekran görüntüleri | **YOK** (`store-assets/` klasörü yok, ASO dokümanı yok) | tarandı |
| Öne çıkan görsel | Var: `feature_graphic_1024x500.png` | depo kökü |
| Dil | Yalnız Türkçe (`<html lang="tr">`) | `www/index.html` |

**Paket adları (düzeltme):** İlk taramada `com.popgo.game` / `com.teknova.popgo`
ikiliğini hata sanmıştım; değil. Firebase projesi `popgo-1c34f` içinde **iki uygulama
da kayıtlı**: Android `com.teknova.popgo`, iOS `com.popgo.game`. Yani yapı tutarlı.
Tek dikkat noktası: Google Ads'te kampanya açarken **Android için
`com.teknova.popgo`** seçilmeli.

---

## 2. Önce acı matematik — reklam parası geri dönmez

Bunu baştan netleştirelim, çünkü kararın tamamı buna bağlı:

| | Değer |
|---|---|
| TR'de oyun kategorisi kurulum maliyeti (Android) | ~5–15 TL |
| Ödüllü/geçiş eCPM (TR, gerçekçi) | ~30–100 TL |
| Kullanıcı başına günlük gösterim (90 sn kapıyla) | ~2–4 |
| Kullanıcı başına günlük gelir | ~0,15–0,40 TL |
| 7 gün kalan bir kullanıcının toplam getirisi | ~1–3 TL |

**Sonuç:** 5–15 TL'ye aldığın kullanıcı sana 1–3 TL kazandırır. Reklam harcaması
**reklam geliriyle kendini ödemez.** Bu PopGo'ya özgü bir kusur değil; kullanıcı
başına geliri düşük casual oyunlarda normaldir.

O hâlde reklam parası ne için harcanır? Üç şey için:

1. **Mağaza sıralamasının çalışmaya başlaması için gereken ilk kütle.** 3 kurulumla
   Play algoritmasında hiçbir sinyalin yok. 300–500 kurulum ve 20+ puan, organik
   görünürlüğün kapısını açar.
2. **Ölçüm.** 3 kullanıcıyla D1 elde tutma oranın istatistiksel olarak anlamsız.
   Oyunun gerçekten tutup tutmadığını ancak birkaç yüz kullanıcıda görürsün.
3. **Gelirin asıl kaynağı için hazırlık.** Uzun vadede para, reklam alarak değil,
   organik + elde tutma + (varsa) reklam kaldırma satın alması ile gelir.

**Karar:** Reklam bütçesini "yatırım getirisi" olarak değil, **ölçülebilir bir test
ve tohumlama gideri** olarak planla. Bilgoo'da da böyle kurgulamıştık.

---

## 3. Faz 0 — Ölçüm altyapısı ✅ (14 Eyl'de uygulandı)

> Kod tarafı bitti. Kalan iki adım panel işi ve sende.

### Yapıldı (kod)

| Ne | Nerede |
|---|---|
| Firebase Analytics eklentisi | `@capacitor-firebase/analytics@7` + `@capacitor-community/in-app-review@7` |
| Merkezi olay modülü | `popgo-analytics.js` — `popgoTrack(ad, params)`; eklenti hazır değilken kuyruğa alır, tarayıcıda yalnız konsola yazar |
| Olay bağlantıları | `app.js` içinde 10 nokta (aşağıdaki şema) |
| Puanlama istemi | `popgo-rating.js` — 5. bölüm tamamlanınca, sürüm başına bir kez, kayıp anında asla |
| iOS Firebase başlatma | `AppDelegate.swift` → `FirebaseApp.configure()` |
| iOS yapılandırma dosyası | `GoogleService-Info.plist` **Xcode hedefine eklendi** — dosya diskte duruyordu ama projeye dahil değildi, bu hâliyle Analytics hiç çalışmazdı |
| Servis çalışanı | `popgo-cache-v6`, yeni dosyalar önbellek listesinde |
| Çift ağaç | kök + `www/` eşitlendi |

### Olay şeması

| Olay | Ne zaman | Parametreler |
|---|---|---|
| `first_open` | otomatik (Firebase) | — |
| `game_start` | oyun açılışında | `level`, `fresh_start` |
| `level_start` | her yeni bölümde | `level` |
| `level_complete` | bölüm bitince | `level`, `score`, `duration_sec` |
| `game_over` | kayıpta | `level`, `score`, `reason` |
| `ad_interstitial_shown` / `ad_interstitial_load_failed` | geçiş reklamı | `level` / `code` |
| `ad_rewarded_shown` / `ad_rewarded_completed` / `ad_rewarded_dismissed` / `ad_rewarded_load_failed` | ödüllü reklam | `level` / `code` |
| `rating_prompt_shown` | puanlama penceresi açılınca | `completed_levels` |

`level_start` ile `level_complete` arasındaki fark, **hangi bölümde oyuncu
kaybettiğini** gösterir — reklamla kullanıcı getirmeden önce bakılacak ilk huni.
`ad_rewarded_load_failed` yüksekse gelir sorunu kodda değil AdMob doluluğundadır
(Bilgoo'da tam olarak bu olmuştu).

### Kalan: derleme adımları

```bash
npx cap sync android   # ana checkout'ta (android/ klasörü orada)
```

Gradle düzenlemesi **gerekmiyor**: `google-services` eklentisi zaten uygulanmış,
`google-services.json` yerinde ve Firebase bağımlılığını eklentinin kendi
`build.gradle`'ı getiriyor. iOS tarafında `pod install` bu oturumda çalıştırıldı.

### Kalan: panel işi (sende)

1. Firebase Console → `popgo-1c34f` → ⚙ Proje ayarları → **Entegrasyonlar** →
   Google Ads → **Bağla** ("Uygulama dönüşümlerini içe aktar" açık kalsın)
2. Play Console → **Ayarlar → Bağlı hizmetler** → Firebase
3. Yeni sürümü mağazalara yayınla — **ölçüm ancak yayınlanmış sürümden veri toplar**
4. İlk verinin akması 24 saat sürer; DebugView ile gerçek cihazda anında doğrulanır:
   ```bash
   adb shell setprop debug.firebase.analytics.app com.teknova.popgo
   ```

### Ölü Unity kodu

`www/app.js` hâlâ Unity Ads çağrıları taşıyor ama sağlayıcı yalnız AdMob.
Kampanya için engel değil; yedek gerekirse Unity'yi geri eklemek yerine
**AdMob Mediation** kullan.

## 4. Faz 1 — ASO (bedava, en yüksek getirili adım, 1 gün)

3 kurulumun sebebi büyük ihtimalle bütçe değil, **listelemenin aranabilir olmaması.**
"PopGo" adını bilmeyen kimse seni bulamıyor.

### Play Console

| Alan | Değer | Limit |
|---|---|---|
| Uygulama adı | `PopGo: Balon Patlatma Oyunu` | 30 ✓ (27) |
| Kısa açıklama | `Renkli balonları eşleştir ve patlat! Bomba, lazer, gökkuşağı güçleriyle oyna.` | 80 ✓ (77) |
| Öne çıkan görsel | `feature_graphic_1024x500.png` — **zaten hazır, yüklenmemiş** | 1024×500 |
| Ekran görüntüsü | **6 kare, 1080×1920 — üretilmeli** | min 2 |

**Tam açıklama taslağı** (ilk 2 satır aramada görünür, anahtar kelimeleri oraya koy):

```
Balon patlatma oyunlarını seviyorsan PopGo tam sana göre! Renkli balonları
eşleştir, patlat ve yüzlerce bölümü tek tek geç.

🎯 NASIL OYNANIR
Aynı renkteki üç veya daha fazla balonu birleştir, patlat ve ekranı temizle.
Tek dokunuşla oynanır; kuralları öğrenmek 10 saniye sürer.

💥 GÜÇLER
Bomba, lazer, dikey lazer, gökkuşağı, ateş topu ve dondurucu ile sıkıştığın
bölümleri aç.

✨ ÖZELLİKLER
• Yüzlerce bölüm, giderek artan zorluk
• İnternet olmadan da oynanır
• Günlük bonuslar ve ödüller
• Tamamen ücretsiz
• Her yaşa uygun, şiddet içermez
```

### App Store Connect

| Alan | Değer | Limit |
|---|---|---|
| Uygulama adı | `PopGo: Balon Patlatma` | 30 ✓ (21) |
| Alt başlık | `Renkli balon eşleştirme oyunu` | 30 ✓ (29) |
| Anahtar kelimeler | `balon,patlatma,bubble,shooter,eşleştirme,bulmaca,rahatlatıcı,çocuk,puzzle,ücretsiz,offline,renkli` | 100 ✓ (97) |
| Ekran görüntüsü | 6 kare, 1290×2796 — üretilmeli | min 1 |

> Başlık, alt başlık ve anahtar kelimeler App Store'da **yalnızca yeni sürüm
> gönderirken** değişir. Promosyon metni sürümsüz değişir.

---

## 5. Faz 2 — İlk gerçek kütle (bedava, 1 hafta)

1. **Tanıdıklardan 10–20 gerçek indirme + dürüst puan.** Sahte puan alma; Apple
   ve Google ikisini de tespit ediyor, listelemeyi tamamen kaybedersin.
2. **Bilgoo ↔ PopGo çapraz tanıtımı.** İki oyun da senin, AdMob'da **house ad
   (kendi kampanyan)** ücretsiz. Bilgoo'nun kullanıcı tabanı küçük ama maliyeti sıfır.
3. Bir hafta bekle ve Play Console + GA4'te eğriyi not al. Bu senin **temel çizgin**;
   reklamın etkisini ancak buna kıyasla ölçebilirsin.

---

## 6. Faz 3 — Google Ads Uygulama Kampanyası (UAC)

### Kurulum

Google Ads → Yeni kampanya → **Uygulama tanıtımı** → **Uygulama yüklemeleri**

| Ayar | Değer |
|---|---|
| Uygulama | `com.teknova.popgo` (Android) — **yalnızca Android ile başla** |
| Konum | Türkiye |
| Dil | Türkçe (uygulama yalnız Türkçe) |
| Teklif | "Yükleme başına hedef maliyet" |
| Başlangıç hedef TBM | **8 TL** |
| Günlük bütçe | **100 TL/gün ≈ 3.000 TL/ay** |

Google, öğrenme aşaması için günlük bütçenin hedef TBM'in **en az 10 katı**
olmasını ister: 8 × 10 = 80 TL → 100 TL/gün uyumlu. iOS'ta TBM yaklaşık iki katı
ve SKAdNetwork yüzünden ölçüm çok daha kör; bu bütçede iOS kampanyası açma.

### Reklam metinleri

UAC'de başlıkları ve açıklamaları Google kendisi kombinler — her biri tek başına
anlamlı olmalı, birbirinin devamı gibi yazma.

**Başlıklar (maks. 30 karakter, 5 adet)**
```
Balon patlat, rahatla
Ücretsiz balon patlatma oyunu
Bomba ve lazerle patlat
Yüzlerce bölüm seni bekliyor
İnternetsiz de oynanır
```

**Açıklamalar (maks. 90 karakter, 5 adet)**
```
Renkli balonları eşleştir, patlat. Bomba, lazer ve gökkuşağı güçleriyle bölüm geç.
İnternet olmadan da oynanır. Ücretsiz indir, ilk bölümler reklamsız, hemen oyna.
Kolay başla, zorlaşan bölümlerle devam et. Her yaşa uygun ücretsiz balon oyunu.
Tek dokunuşla oynanır. Rahatlatıcı, keyifli, tamamen ücretsiz balon patlatma.
Günlük bonuslarla her gün yeni ödül. Skorunu kır, güçleri topla, bölüm atla.
```

**Görseller**
- Yatay 1200×628 — en az 1
- Kare 1200×1200 — en az 1
- Dikey 1200×1500 — opsiyonel, performansı artırır
- **Video 9:16, 15–30 sn** — basit bir oynanış ekran kaydı yeterli. Video
  koymazsan Google mağaza görsellerinden otomatik video üretir ve kalitesi düşük
  olur; ham ekran kaydı bile ondan iyidir.

### İlk 2 hafta kuralı

**Hiçbir şeye dokunma.** Öğrenme aşaması 7–14 gün. Günlük değil haftalık bak.
Tek izlenecek metrik: **kurulum başına maliyet.** Her bütçe/teklif değişikliği
öğrenmeyi sıfırlar.

| Durum | Aksiyon |
|---|---|
| TBM hedefin çok altında | Bütçeyi %20 artır, hedefi değiştirme |
| TBM hedefin 2 katı üstünde | Hedef TBM'i %20 **yükselt** (düşürme — gösterim alamazsın) |
| Hiç gösterim yok | Hedef TBM çok düşük, %50 artır |
| Kurulum var, açılış yok | Mağaza sayfasının vaadi oyunla örtüşmüyor → ekran görüntülerini değiştir |
| Açılış var, ikinci gün yok | Sorun reklamda değil oyunda → elde tutma (Faz 4) |

### Beklenti

3.000 TL/ay ile TR'de Android: **~200–600 kurulum/ay.** Reklam durunca kurulum da
durur. Kalıcı büyüme ASO + organikten gelir.

---

## 7. Ölçüm — kampanyadan ÖNCE not al

Yoksa etkisini ölçemezsin:

- [ ] Play Console → mevcut haftalık kurulum: **___**
- [ ] Play Console → mevcut aylık aktif cihaz: **4**
- [ ] Play Console → puan sayısı: **0**
- [ ] Firebase → günlük aktif kullanıcı: **___**
- [ ] AdMob → günlük gösterim / eCPM: **___**

**Başarı kriterleri (kampanyanın 4. haftası sonunda):**

| Metrik | Hedef | Anlamı |
|---|---|---|
| Kurulum başına maliyet | ≤ 10 TL | Kampanya verimli |
| Kurulum → ilk açılış | ≥ %80 | Mağaza sayfası dürüst |
| D1 elde tutma | ≥ %25 | Oyun tutuyor |
| D7 elde tutma | ≥ %10 | Ölçeklemeye değer |
| Puan sayısı | ≥ 20 | ASO çalışmaya başlar |

D1 %15'in altındaysa **bütçeyi artırma** — delik kovaya su taşımış olursun.
Önce elde tutmayı düzelt.

---

## 8. Faz 4 — Elde tutma (reklamla gelen kullanıcıyı kaybetme)

Kurulum getirmek pahalı; geleni kaybetmek onu boşa harcamak. Bilgoo'da 50
kurulumdan 9'u kalmıştı.

**Zaten yapıldı (son commit'ler):** 90 saniyelik global reklam kapısı, ilk 2 bölüm
reklamsız, öne-gelme reklamının kaldırılması. Bunlar doğru yöndeki hamleler —
ama etkilerini **ancak analytics varken** görebilirsin (Faz 0).

**Kampanya sonrası bakılacak:** hangi bölümde oyuncu kaybediyorsun. `level_start`
ve `level_complete` olaylarıyla huniyi çıkarınca, terk edilen bölümün zorluğunu
dengelemek en ucuz elde tutma kazancıdır.

---

## 9. Takvim

| Hafta | Yapılacak | Kim |
|---|---|---|
| 1 | Faz 0: Firebase Analytics + olaylar + puan istemi, bundle id doğrulaması | Ben (kod) |
| 1 | Firebase↔Ads ve Play↔Firebase bağlantıları | Sen (panel) |
| 1 | **Yeni sürüm yayını** (analytics'siz sürüme reklam vermek parayı körlemesine harcamaktır) | Sen |
| 2 | Faz 1: ASO metinleri + 6 ekran görüntüsü + öne çıkan görsel | Metin/görsel bende, yükleme sende |
| 2 | Faz 2: tanıdıklardan indirme + puan, Bilgoo çapraz tanıtımı | Sen |
| 3 | Bekle ve temel çizgiyi not al | — |
| 4 | Faz 3: Android kampanyasını başlat, 100 TL/gün, 8 TL hedef TBM | Sen |
| 5–6 | Dokunma, haftalık bak | — |
| 7 | Karar tablosuna göre ayarla; D1 iyiyse bütçeyi %20 artır | Sen |

---

## 10. Ben ne yapabilirim, ne yapamam

**Yapabilirim:** Firebase Analytics entegrasyonu ve olay şeması, uygulama içi
puanlama istemi, mağaza ekran görüntüsü üretimi, tüm metinler, kampanya rehberi,
elde tutma düzeltmeleri, bundle id tutarsızlığının giderilmesi.

**Yapamam:** Play Console / App Store Connect / Google Ads / Firebase panellerine
erişimim yok. Metin ve görselleri oraya sen yapıştıracak, kampanyayı sen
başlatacaksın. Ödeme yöntemi zaten sende.

---

## Şimdi tek bir karar

Bütçeyi onaylamadan önce şunu söyle: **Faz 0'ı (analytics + puan istemi) başlatayım mı?**
Bu, reklam kararından bağımsız olarak her senaryoda gerekli ve tamamen kod tarafı —
bugün başlayabilirim.
