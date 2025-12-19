# PopGo - Balon Patlatma Oyunu

Modern ve eğlenceli balon patlatma oyunu. Üç farklı oyun modu ile keyifli vakit geçirin!

## Özellikler

- 🎯 **3 Oyun Modu**: Klasik, Strateji, Arcade
- ⚡ **6 Güç Balonu**: Bomba, Lazer, Gökkuşağı, Ateş Topu, Şimşek, Dondurucu
- 🏆 **Başarı Sistemi**: 8 farklı başarı
- 📊 **İstatistik Takibi**: Detaylı oyuncu istatistikleri
- 🎵 **Ses & Müzik**: Profesyonel ses efektleri
- 📱 **Mobil Uyumlu**: Responsive tasarım
- 💾 **Veri Saklama**: LocalStorage ile kayıt

## Google Ads Entegrasyonu

Oyunda hem banner hem de tam ekran reklam desteği bulunmaktadır.

### Kurulum Adımları:

1. **Google AdSense Hesabı Oluşturun**
   - https://www.google.com/adsense/ adresinden hesap açın
   - Sitenizi AdSense'e ekleyin ve onay alın

2. **Publisher ID'nizi Alın**
   - AdSense panelinden `ca-pub-XXXXXXXXXXXXXXXX` formatındaki ID'nizi kopyalayın

3. **Kodu Güncelleyin**
   ```html
   <!-- index.html dosyasında XXXXXXXXXXXXXXXX yerine kendi ID'nizi yazın -->
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
        crossorigin="anonymous"></script>
   ```

4. **Reklam Slot ID'lerini Ayarlayın**
   - AdSense'de yeni reklam birimleri oluşturun
   - Banner ve Interstitial slot ID'lerini HTML'deki `data-ad-slot="XXXXXXXXXX"` alanlarına yazın

### Reklam Türleri ve Gelir Karşılaştırması:

#### 📊 Banner Reklamlar
- **RPM**: $0.50 - $2.00 (1000 görüntüleme başına)
- **Avantajlar**: 
  - Sürekli görünür
  - Oyunu kesintiye uğratmaz
  - Yüksek görüntüleme sayısı
- **Dezavantajlar**:
  - Düşük tıklama oranı (%0.5-1.5)
  - Düşük gelir per görüntüleme

#### 💰 Tam Ekran (Interstitial) Reklamlar
- **RPM**: $3.00 - $8.00 (1000 görüntüleme başına)
- **Avantajlar**:
  - Yüksek tıklama oranı (%2-5)
  - Yüksek gelir per görüntüleme
  - Dikkat çekici
- **Dezavantajlar**:
  - Oyunu kesintiye uğratır
  - Kullanıcı deneyimini etkileyebilir
  - Daha az görüntüleme fırsatı

### 🎯 Önerilen Strateji:
**Hibrit Yaklaşım** (Mevcut implementasyon):
- Banner reklamlar sürekli aktif (üst/alt)
- Tam ekran reklamlar stratejik zamanlarda:
  - Her 3 oyun bitiminde
  - Her 5 seviye tamamlandığında
  - Minimum 2 dakika aralıkla

### 💡 Gelir Optimizasyonu:
1. **A/B Test Yapın**: Farklı reklam pozisyonlarını test edin
2. **Frekans Ayarı**: Çok sık reklam kullanıcı kaybına neden olur
3. **Mobil Optimizasyon**: Mobil reklamlar genelde daha yüksek gelir getirir
4. **Coğrafi Hedefleme**: Batı ülkeleri daha yüksek RPM sağlar

### 📈 Beklenen Gelir (Aylık):
- **1,000 aktif kullanıcı**: $50-150
- **10,000 aktif kullanıcı**: $500-1,500  
- **100,000 aktif kullanıcı**: $5,000-15,000

*Not: Gelir tahminleri sektör ortalamasına dayanmaktadır ve gerçek sonuçlar değişiklik gösterebilir.*

## Teknolojiler

- Google AdSense
- Service Worker (PWA)

## Kurulum

### Web Tarayıcısında
1. Dosyaları bir HTTP sunucusuna kurun
2. `index.html` dosyasını açın
3. Oyun modunu seçin ve oynamaya başlayın

### PWA Olarak
1. Destekleyen tarayıcılarda "Ana ekrana ekle" seçin
2. Uygulama simgesi ana ekranınıza eklenir
3. Çevrimdışı oynayabilirsiniz

### AdSense Ayarları
`index.html` içindeki `data-ad-client="ca-pub-XXXXXXXXXXXXXXX"` kısmını kendi reklam istemci kimliğinizle değiştirin.

## 🚀 Performans

- **Optimized Canvas Rendering**: 60 FPS sabit performans
- **Memory Management**: Etkili bellek kullanımı
- **Particle Pooling**: Performanslı particle sistemi
- **Device Pixel Ratio**: Retina ekran desteği
- **Smooth Animations**: Yumuşak geçişler ve animasyonlar

## 📊 Skor Sistemi

- **Normal Balon**: 10 puan x kombo
- **Power-up Kullanımı**: 100+ puan x kombo  
- **Combo Bonusu**: Her başarılı atış skoru artırır
- **Streak Bonusu**: Art arda başarılı atışlarda bonus
- **Başarı Bonusu**: Her rozet için 500 puan
- **Düşen Balon**: 50 puan x kombo (kovalara düşenler)

## 🎨 Grafik Detayları

- **3D Balon Görünümü**: Highlight ve gölge efektleri
- **Animasyonlu Power-up'lar**: Her power-up özel animasyonlu
- **Particle Efektleri**: Patlamalar, parıltılar, izler
- **Gradient Arka Plan**: Modern gradient tasarım
- **Smooth Transitions**: Yumuşak geçiş animasyonları

## 🔧 Geliştirici Bilgileri

Bu oyun modern web teknolojileri kullanılarak geliştirilmiştir:

- **ES6+ JavaScript**: Modern kod yapısı
- **Canvas API**: Hardware accelerated rendering
- **Web APIs**: PWA, Service Worker, Local Storage
- **CSS3**: Advanced animations ve transitions
- **Responsive Design**: Mobile-first approach

## 📄 Lisans

MIT Lisansı ile dağıtılmaktadır. Ticari kullanım için serbesttir.

---

*Web'deki en iyi balon oyunlarından esinlenilerek, profesyonel seviyede kodlama kalitesi ile geliştirilmiştir.* 