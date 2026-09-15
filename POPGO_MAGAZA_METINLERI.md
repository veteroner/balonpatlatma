# PopGo — Mağaza Metinleri (ASO)

**Tarih:** 15 Eylül 2026 · Faz 1 (kareler aynı gün arayüz Türkçeleştirmesinden
sonra yeniden üretildi). Tüm metinler Türkçe pazar için, karakter limitleri
sayılarak doğrulandı (aşağıdaki tablo).

Oyunda gerçekten var olmayan hiçbir şey yazılmadı: altı güç (bomba, lazer,
dikey lazer, gökkuşağı, ateş topu, dondurucu), 8 başarım, günlük bonus, kombo
sistemi ve çevrimdışı oynanabilirlik koddan doğrulandı. Bölüm sayısı sabit
değil — bölümler prosedürel üretiliyor, bu yüzden "1000 bölüm" gibi sayı
vermek yerine "sonu olmayan bölümler" dendi.

---

## Play Console

### Uygulama adı (maks. 30)
```
PopGo: Balon Patlatma Oyunu
```

### Kısa açıklama (maks. 80)
Aramada başlığın hemen altında görünür; en önemli 80 karakter burası.
```
Renkli balonları eşleştir ve patlat! Bomba, lazer, gökkuşağı güçleriyle oyna.
```

### Tam açıklama (maks. 4000)
İlk iki satır "devamını oku" öncesi görünen kısım — anahtar kelimeler orada.
```
Balon patlatma oyunlarını seviyorsan PopGo tam sana göre. Renkli balonları eşleştir, patlat ve giderek zorlaşan bölümlerde ilerle.

🎯 NASIL OYNANIR
Aynı renkteki üç veya daha fazla balonu birleştir, patlat ve ekranı temizle. Tek dokunuşla oynanır, kuralları öğrenmek on saniye sürer. Nişan çizgisi yön bulmayı kolaylaştırır; duvardan sektirerek zor köşelere de ulaşabilirsin.

💥 ALTI FARKLI GÜÇ
• Bomba — çevresindeki tüm balonları havaya uçurur
• Lazer — bir satırı baştan sona temizler
• Dikey lazer — sütunu yukarıdan aşağı siler
• Gökkuşağı — istediğin rengin yerine geçer
• Ateş topu — çarptığı yeri eritir
• Dondurucu — süreyi yavaşlatır, rahat nişan alırsın

🎮 ÖZELLİKLER
• Üç oyun modu: Klasik (sınırsız hamle), Strateji (60 hamle), Arcade (5 dakika)
• Sonu olmayan bölümler: her bölüm bir öncekinden biraz daha zor
• Kombo sistemi: arka arkaya patlatınca puan katlanır
• 8 başarım: keskin nişancıdan kombo ustasına
• Günlük bonus: her gün giriş yap, güç kazan
• İnternet olmadan da oynanır — metroda, uçakta, kırsalda
• Üyelik yok, giriş yok: aç ve oyna
• Tamamen ücretsiz

🧠 HEM RAHATLATICI HEM ZORLU
İlk bölümler sakin başlar; ilerledikçe balon sıraları hızlanır ve doğru gücü doğru anda kullanmak zorunlu hâle gelir. Kısa molalarda bir bölüm, uzun yolculuklarda saatlerce.

👨‍👩‍👧 HER YAŞA UYGUN
Şiddet yok, zaman baskısı dayatmayan sakin bir tempo var. Çocuklar renk eşleştirme, yetişkinler strateji tarafını sever.

Balonları patlatmaya başla — ilk bölümler reklamsız.
```

### Yenilikler / sürüm notu (maks. 500)
```
• Reklamlar seyreltildi: ilk iki bölüm tamamen reklamsız, uygulama açılışında artık reklam yok
• Bölüm ekranı artık her cihazda simetrik; çentikli ekranlarda üst kısım kesilmiyor
• Reklam sonrası arayüz kaymaları giderildi
• Performans iyileştirmeleri
```

### Görseller
| Varlık | Boyut | Durum |
|---|---|---|
| Öne çıkan görsel | 1024×500 | ✅ hazır: `feature_graphic_1024x500.png` |
| Telefon ekran görüntüsü | 1080×1920 (7 adet) | ✅ üretildi: `store-assets/play/01..07-popgo.png` |
| Uygulama simgesi | 512×512 | ✅ hazır: `app_icon_512x512.png` |

---

## App Store Connect

### Uygulama adı (maks. 30)
```
PopGo: Balon Patlatma
```

### Alt başlık (maks. 30)
```
Renkli balon eşleştirme oyunu
```

### Anahtar kelimeler (maks. 100, virgülle, boşluksuz)
Başlıkta ve alt başlıkta geçen kelimeleri burada tekrar etme — Apple ikisini
birleştirip indeksler, tekrar yer israfı olur.
```
balon,patlatma,bubble,shooter,eşleştirme,bulmaca,rahatlatıcı,çocuk,puzzle,ücretsiz,offline,renkli
```

### Promosyon metni (maks. 170)
Sürüm göndermeden değiştirilebilir; kampanya döneminde güncellenecek alan budur.
```
İlk bölümler reklamsız. Renkli balonları eşleştir, altı farklı güçle zorlaşan bölümleri aç. İnternetsiz de oynanır.
```

### Açıklama (maks. 4000)
Play'in tam açıklamasıyla aynı metin kullanılabilir (yukarıda).

### Görseller
| Varlık | Boyut | Durum |
|---|---|---|
| 6,9" ekran görüntüsü | 1290×2796 (7 adet) | ✅ üretildi: `store-assets/appstore/01..07-popgo.png` |

> **Önemli:** App Store'da uygulama adı, alt başlık ve anahtar kelimeler
> **yalnızca yeni sürüm gönderirken** değişir. Promosyon metni ve ekran
> görüntüleri sürümsüz güncellenebilir.

---

## Ekran görüntüsü başlıkları

Kareler `generate_store_screenshots.js` ile üretildi; kaynak, bu daldaki koddan
derlenen uygulamanın iPhone 17 Pro Max simülatöründeki **gerçek oynanış
kareleri** (1320×2868 ham çıktı).

| # | Başlık | Alt satır | Kare |
|---|---|---|---|
| 1 | Eşleştir, patlat, bölümü temizle | Tek dokunuşla oynanır | dolu renkli grid + nişan çizgisi, SEVİYE 2 / 8,8k |
| 2 | Bomba tüm bölgeyi temizler | Doğru gücü doğru anda kullan | bomba fırlatıcıda fitiliyle hazır |
| 3 | Ateş topu yolunu açar | Sıkıştığın bölümü aç | ateş topunun gridde açtığı dikey kanal |
| 4 | Sonu olmayan bölümler | Her bölüm biraz daha zor | seviye haritası: 1 ⭐⭐⭐, 2 MEVCUT |
| 5 | Her gün gir, güç kazan | Yedi günlük ödül döngüsü | günlük ödül: BUGÜN + 7 günlük kartlar |
| 6 | Üç oyun modu | Klasik · Strateji · Arcade | ana menü, en yüksek 28.390 |
| 7 | Altı farklı güç senin elinde | Her biri bölümü farklı açar | güç çubuğu + Türkçe açıklamalar |

4 ve 5 numaralı kareler bu turda eklendi: arayüz Türkçeleştirilmeden önce
seviye haritası (`UNLİMİTED`/`CURRENT`) ve günlük ödül ekranı (`TODAY`/`DAY n`)
İngilizce metin içerdiği için kullanılamıyordu.

Yeniden üretmek için:

```bash
node generate_store_screenshots.js <ham-kareler-klasörü> store-assets
```

---

## Karakter limiti doğrulaması

| Alan | Uzunluk | Durum |
|---|---|---|
| Play — Uygulama adı | 27 / 30 | ✓ |
| Play — Kısa açıklama | 77 / 80 | ✓ |
| Play — Tam açıklama | 1401 / 4000 | ✓ |
| Play — Yenilikler | 251 / 500 | ✓ |
| App Store — Uygulama adı | 21 / 30 | ✓ |
| App Store — Alt başlık | 29 / 30 | ✓ |
| App Store — Anahtar kelimeler | 97 / 100 | ✓ |
| App Store — Promosyon metni | 115 / 170 | ✓ |
| Ekran görüntüsü başlığı 1 | 32 / 40 | ✓ |
| Ekran görüntüsü başlığı 2 | 26 / 40 | ✓ |
| Ekran görüntüsü başlığı 3 | 21 / 40 | ✓ |
| Ekran görüntüsü başlığı 4 | 21 / 40 | ✓ |
| Ekran görüntüsü başlığı 5 | 22 / 40 | ✓ |
| Ekran görüntüsü başlığı 6 | 12 / 40 | ✓ |
| Ekran görüntüsü başlığı 7 | 28 / 40 | ✓ |

---

## Arayüzdeki İngilizce kalıntılar — çözüldü

Ekran görüntülerini alırken çıkmıştı; hepsi Türkçeleştirildi ve kareler
Türkçe arayüzle yeniden üretildi:

| Nerede | Önce | Şimdi |
|---|---|---|
| Oyun içi sağ şerit | `STREAK` | `SERİ` ✅ |
| Oyun içi HUD | `LEVEL n` | `SEVİYE n` ✅ |
| Günlük görev çubuğu | `Pop 200 bubbles!` | `200 balon patlat!` ✅ |
| Günlük ödül kartları | `TODAY`, `DAY 2…7` | `BUGÜN`, `2. GÜN…` ✅ |
| Seviye haritası | `UNLİMİTED`, `CURRENT` | `SINIRSIZ`, `MEVCUT` ✅ |
| Seviye haritası | `SHOP`, `MAP`, `Level n` | `MAĞAZA`, `HARİTA`, `Seviye n` ✅ |
| Seviye tamamlandı | `LEVEL n COMPLETED!`, `FINAL SCORE`, `TAP TO OPEN!`, `NEXT LEVEL` | `SEVİYE n TAMAMLANDI!`, `TOPLAM SKOR`, `AÇMAK İÇİN DOKUN!`, `SONRAKİ SEVİYE` ✅ |
| Oyun içi menü | `GÜÇ-UPS`, `Rainbow`, `Fireball` | `GÜÇLER`, `Gökkuşağı`, `Ateş Topu` ✅ |
| Oyundan çıkış onayı | native `Cancel` / `Ok` | oyunun kendi modalı: `Vazgeç` / `Çık` ✅ |

> **Önemli:** bir önceki kare setinde bu metinler göründüğü için o kareler
> kullanılamaz durumdaydı — `STREAK` ve `LEVEL 1` her oynanış karesinde
> ekrandaydı. Mevcut `store-assets/` içeriği Türkçeleştirme **sonrasında**
> üretilmiştir; eski kareleri mağazaya yüklemeyin.

---

## Yükleme sırası

1. **Play Console** → Ana mağaza girişi: ad, kısa/tam açıklama, öne çıkan
   görsel, 7 ekran görüntüsü → Kaydet → İncelemeye gönder
2. **App Store Connect** → yeni sürüm oluştur → ad, alt başlık, anahtar
   kelimeler, açıklama, promosyon metni, 7 ekran görüntüsü
3. İki mağazada da yayına girdikten sonra **bir hafta bekle** ve kurulum
   eğrisini not al — reklam kampanyası ancak bu temel çizgi alındıktan sonra
   başlar (bkz. `POPGO_BUYUME_PLANI.md`).
