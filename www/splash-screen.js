/* Teknova Splash Screen JavaScript - Tamamen Login.html'den Alınmış Kodlar */
/* Resimde görülen tasarımı uygular */

// Splash Screen Sınıfı
class TeknovaSplashScreen {
    constructor(options = {}) {
        this.options = {
            duration: options.duration || 5000,        // Toplam gösterme süresi (ms)
            logoText: options.logoText || 'Teknova',   // Ana logo metni
            subtitle: options.subtitle || 'Game Labs', // Alt yazı
            icon: options.icon || 'fa-flask',          // FontAwesome ikon
            onComplete: options.onComplete || null,    // Tamamlandığında çalışacak fonksiyon
            particleCount: options.particleCount || 18, // Parçacık sayısı
            particleColors: options.particleColors || [
                'rgba(58,141,222,0.1)',
                'rgba(123,31,162,0.1)', 
                'rgba(0,234,255,0.1)',
                'rgba(255,255,255,0.1)'
            ]
        };
        
        this.isInitialized = false;
        this.progressTimer = null;
    }
    
    // Splash screen'i başlat
    init() {
        if (this.isInitialized) return;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initSplashScreens();
            });
        } else {
            // DOM zaten yüklenmiş, hemen başlat
            this.initSplashScreens();
        }
        
        this.isInitialized = true;
    }
    
    // Login.html'den alınan splash screen başlatma fonksiyonu
    initSplashScreens() {
        const splashScreen = document.getElementById('splash-screen');
        
        if (!splashScreen) {
            return;
        }
        
        // Splash screen animasyonları için gerekli CSS sınıflarını uygula
        if (splashScreen) {
            // İlk ekran logosu için animasyonları başlat
            this.createSplashParticles();
            this.animateCircuitNodes();
            this.updateLoaderPercentage();
        }

        // Splash ekranı belirtilen süre sonra kapat
        setTimeout(() => {
            splashScreen.classList.add('fade-out');
            setTimeout(() => {
                splashScreen.style.display = 'none';
                // Oyun başlatma callback'ini çağır
                if (this.options.onComplete) {
                    this.options.onComplete();
                }
            }, 500); // Geçiş animasyonu için süre
        }, this.options.duration);
    }
    
    // Login.html'den alınan parçacık oluşturma fonksiyonu
    createSplashParticles() {
        const container = document.querySelector('.splash-bg-particles');
        if (!container) return;
        
        const colors = this.options.particleColors;
        const count = this.options.particleCount;
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = Math.random() * 60 + 40;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.left = `${Math.random() * 95}%`;
            p.style.top = `${Math.random() * 90}%`;
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            p.style.animationDelay = `${Math.random() * 8}s`;
            p.style.animationDuration = `${10 + Math.random() * 6}s`;
            container.appendChild(p);
        }
    }

    // Login.html'den alınan devre düğümlerini animasyonla gösterme
    animateCircuitNodes() {
        const nodes = document.querySelectorAll('.circuit-node');
        nodes.forEach((node, index) => {
            node.style.setProperty('--i', index);
        });
    }

    // Login.html'den alınan yükleme çubuğu güncelleme fonksiyonu
    updateLoaderPercentage() {
        // DOM elementlerini güvenli bir şekilde bul
        const findElements = () => {
            return {
                bar: document.querySelector('.splash-loader-bar'),
                percent: document.querySelector('.loader-percentage'),
                loaderContainer: document.querySelector('.modern-loader')
            };
        };
        
        // Elementler hazır olana kadar bekle
        const waitForElements = (callback, maxAttempts = 50) => {
            let attempts = 0;
            const checkElements = () => {
                const elements = findElements();
                
                if (elements.bar && elements.percent && elements.loaderContainer) {
                    console.log('✅ Splash screen elementleri bulundu');
                    callback(elements);
                } else {
                    attempts++;
                    console.log(`⏳ Splash elementleri aranıyor... (${attempts}/${maxAttempts})`);
                    
                    if (attempts < maxAttempts) {
                        setTimeout(checkElements, 100); // 100ms bekle ve tekrar dene
                    } else {
                        console.error('❌ Splash screen elementleri bulunamadı');
                    }
                }
            };
            checkElements();
        };
        
        // Elementler hazır olduğunda progress animasyonunu başlat
        waitForElements((elements) => {
            const { bar, percent, loaderContainer } = elements;
            
            console.log('🚀 Progress bar animasyonu başlatılıyor...');
            
            let progress = 0;
            const duration = this.options.duration - 500; // Son 500ms'yi geçiş için ayır
            const interval = 50; // Daha sık güncelleme (daha yumuşak animasyon)
            const steps = duration / interval;
            const increment = 100 / steps;
            
            // Container genişliğini hesapla
            const containerRect = loaderContainer.getBoundingClientRect();
            const maxBarWidth = Math.max(containerRect.width - 32, 200); // Minimum 200px
            
            // CSS animasyonunu devre dışı bırak
            bar.style.animation = 'none';
            bar.style.transition = 'width 0.1s ease-out';
            
            // İlk değerleri ayarla
            percent.textContent = '%0';
            percent.style.display = 'block';
            percent.style.visibility = 'visible';
            percent.style.opacity = '1';
            bar.style.width = '0px';
            
            console.log(`📊 Progress tracking başladı - Duration: ${duration}ms, Steps: ${steps}, Increment: ${increment.toFixed(2)}%`);
            
            const timer = setInterval(() => {
                progress += increment;
                
                // Progress'i %100'de sınırla
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(timer);
                    console.log('✅ Progress bar %100 tamamlandı');
                }
                
                // Yüzde metnini güncelle
                const currentPercent = Math.round(progress);
                percent.textContent = `%${currentPercent}`;
                
                // Bar genişliğini hesapla ve maksimum değerde sınırla
                const barWidth = Math.min((progress / 100) * maxBarWidth, maxBarWidth);
                bar.style.width = `${barWidth}px`;
                
                // Her %10'da log yaz
                if (currentPercent % 10 === 0 && currentPercent > 0) {
                    console.log(`📈 Progress: %${currentPercent} - Bar width: ${barWidth}px`);
                }
            }, interval);
            
            // Backup timer - eğer bir şey ters giderse progress'i zorla tamamla
            setTimeout(() => {
                if (progress < 100) {
                    console.warn('⚠️ Progress backup timer çalıştı');
                    clearInterval(timer);
                    progress = 100;
                    percent.textContent = '%100';
                    bar.style.width = `${maxBarWidth}px`;
                }
            }, duration + 1000);
        });
    }
    
    // Manuel olarak splash screen'i gizle
    hide() {
        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen) {
            splashScreen.classList.add('fade-out');
            setTimeout(() => {
                splashScreen.style.display = 'none';
                if (this.options.onComplete) {
                    this.options.onComplete();
                }
            }, 500);
        }
    }
    
    // Splash screen'in gösterilip gösterilmediğini kontrol et
    isVisible() {
        const splashScreen = document.getElementById('splash-screen');
        return splashScreen && splashScreen.style.display !== 'none';
    }
}

// Global window nesnesine ekle
window.TeknovaSplashScreen = TeknovaSplashScreen;
