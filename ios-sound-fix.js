// iOS Ses Düzeltme Script'i
// Bu script'i app.js'in başında çalıştırın

class IOSSoundManager {
    constructor() {
        this.audioContext = null;
        // backgroundMusic kaldırıldı - app.js bgmManager kullanılacak
        this.soundEffects = {};
        this.isUnlocked = false;
        this.volume = 0.5;
        
        console.log('🍎 iOS Ses Yöneticisi başlatılıyor - SADECE SES EFEKTLERİ...');
        this.initialize();
    }
    
    async initialize() {
        // iOS için özel ses sistemi - SADECE SES EFEKTLERİ İÇİN
        try {
            // Web Audio API context oluştur
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            console.log('🎵 iOS AudioContext oluşturuldu:', this.audioContext.state);
            
            // İlk kullanıcı dokunuşunda sesi aç
            this.setupUserGestureUnlock();
            
            // Background müzik KALDIRILDI - app.js'teki bgmManager kullanılacak
            
        } catch (error) {
            console.error('❌ iOS ses sistemi başlatılamadı:', error);
            this.createFallbackSounds();
        }
    }
    
    setupUserGestureUnlock() {
        const unlockAudio = async () => {
            if (this.isUnlocked) return;
            
            try {
                // AudioContext'i resume et
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                    console.log('✅ AudioContext resume edildi');
                }
                
                // Test sesi çal
                this.playTestSound();
                
                this.isUnlocked = true;
                console.log('🔓 iOS ses kilidi açıldı - SADECE SES EFEKTLERİ');
                
                // Background müzik KALDIRILDI - app.js bgmManager kullanılacak
                
                // Event listener'ları kaldır
                document.removeEventListener('touchstart', unlockAudio, true);
                document.removeEventListener('touchend', unlockAudio, true);
                document.removeEventListener('mousedown', unlockAudio, true);
                document.removeEventListener('keydown', unlockAudio, true);
                
            } catch (error) {
                console.error('❌ Ses kilidi açılamadı:', error);
            }
        };
        
        // Birden fazla event'e listener ekle
        document.addEventListener('touchstart', unlockAudio, true);
        document.addEventListener('touchend', unlockAudio, true);
        document.addEventListener('mousedown', unlockAudio, true);
        document.addEventListener('keydown', unlockAudio, true);
    }
    
    playTestSound() {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.type = 'sine';
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
            
            console.log('🔊 Test sesi çalındı');
        } catch (error) {
            console.error('❌ Test sesi çalınamadı:', error);
        }
    }
    
    // Background müzik fonksiyonları KALDIRILDI
    // app.js'teki bgmManager kullanılacak
    
    // Ses efektleri için optimize edilmiş fonksiyonlar
    playPopSound() {
        this.createAndPlayTone(800, 200, 0.1, 'sine');
    }
    
    playShootSound() {
        this.createAndPlayTone(400, 600, 0.05, 'square');
    }
    
    playComboSound() {
        // Akor çal
        const frequencies = [523, 659, 784]; // C, E, G
        frequencies.forEach((freq, i) => {
            setTimeout(() => {
                this.createAndPlayTone(freq, freq, 0.3, 'triangle');
            }, i * 100);
        });
    }
    
    createAndPlayTone(startFreq, endFreq, duration, type = 'sine') {
        if (!this.audioContext || !this.isUnlocked) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
            if (startFreq !== endFreq) {
                oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
            }
            
            gainNode.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.type = type;
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
        } catch (error) {
            console.error('❌ Ses efekti çalınamadı:', error);
        }
    }
    
    createFallbackSounds() {
        // Web Audio API çalışmıyorsa basit fallback
        console.log('🔇 Fallback ses sistemi aktif');
        
        this.playPopSound = () => console.log('🎵 Pop!');
        this.playShootSound = () => console.log('🎵 Shoot!');
        this.playComboSound = () => console.log('🎵 Combo!');
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        console.log('🔊 Ses seviyesi:', this.volume);
    }
}

// Global iOS ses yöneticisini oluştur
window.iosSoundManager = new IOSSoundManager();

// Mevcut soundManager'ın iOS fonksiyonlarını override et
if (window.soundManager) {
    const originalPlay = window.soundManager.play;
    window.soundManager.play = function(soundName) {
        // iOS özel ses çalma
        if (window.iosSoundManager && window.iosSoundManager.isUnlocked) {
            switch(soundName) {
                case 'pop':
                    window.iosSoundManager.playPopSound();
                    break;
                case 'shoot':
                    window.iosSoundManager.playShootSound();
                    break;
                case 'combo':
                    window.iosSoundManager.playComboSound();
                    break;
                default:
                    break;
            }
        }
        
        // Orijinal fonksiyonu da çağır
        if (originalPlay) {
            originalPlay.call(this, soundName);
        }
    };
}

// Background müzik kontrolü KALDIRILDI
// app.js'teki bgmManager orijinal haliyle çalışacak

console.log('🍎 iOS ses duzeltme scripti yuklendi - SADECE SES EFEKTLERİ');
