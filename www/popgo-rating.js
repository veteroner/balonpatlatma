/**
 * PopGo — uygulama içi puanlama istemi.
 *
 * Neden var: Play'de puan sayısı 0. Puan, mağaza sıralamasının en ağır
 * sinyallerinden biri; reklamla kullanıcı getirsen bile puansız listeleme
 * organik olarak görünmez kalır.
 *
 * Kural: native pencere (Google Play In-App Review / StoreKit) kullanıcıya
 * yılda sınırlı sayıda gösterilebilir. Bu yüzden istem SADECE iyi giden bir
 * anda ve sürüm başına bir kez açılır:
 *   - en az 5 bölüm tamamlanmış olmalı (oyunu beğendiğine dair ilk işaret)
 *   - bölüm tamamlama modalının hemen ardından (kayıp anında asla)
 *   - aynı sürümde tekrar sorulmaz
 *
 * Not: Pencerenin gerçekten açılıp açılmadığını işletim sistemi belirler ve
 * geri bildirim vermez — bu beklenen davranıştır, hata değildir.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'popgo_rating_state';
    const MIN_COMPLETED_LEVELS = 5;

    function readState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : { completed: 0, askedVersion: null };
        } catch (_) {
            return { completed: 0, askedVersion: null };
        }
    }

    function writeState(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (_) { /* depolama kapalıysa istem bir daha sorulmaz, sorun değil */ }
    }

    function isNative() {
        try {
            return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
        } catch (_) {
            return false;
        }
    }

    async function currentVersion() {
        try {
            const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
            if (!App || !App.getInfo) return 'unknown';
            const info = await App.getInfo();
            return info && info.version ? String(info.version) : 'unknown';
        } catch (_) {
            return 'unknown';
        }
    }

    /**
     * Bölüm tamamlandığında çağrılır. Koşullar uygunsa native puanlama
     * penceresini açar. Koşul uymuyorsa sessizce hiçbir şey yapmaz.
     */
    async function maybeAskForRating() {
        const state = readState();
        state.completed = (state.completed || 0) + 1;
        writeState(state);

        if (!isNative()) return;
        if (state.completed < MIN_COMPLETED_LEVELS) return;

        const version = await currentVersion();
        if (state.askedVersion === version) return;

        const InAppReview = window.Capacitor.Plugins.InAppReview;
        if (!InAppReview || !InAppReview.requestReview) {
            console.warn('⚠️ [RATING] InAppReview eklentisi yok — istem atlandı');
            return;
        }

        // Bölüm tamamlama modalı ve patlama efekti otursun diye kısa gecikme.
        setTimeout(async () => {
            try {
                await InAppReview.requestReview();
                state.askedVersion = version;
                writeState(state);
                if (typeof window.popgoTrack === 'function') {
                    window.popgoTrack('rating_prompt_shown', { completed_levels: state.completed });
                }
                console.log('⭐ [RATING] Puanlama istemi açıldı');
            } catch (error) {
                console.warn('⚠️ [RATING] requestReview başarısız:', error && error.message);
            }
        }, 1200);
    }

    window.popgoMaybeAskForRating = maybeAskForRating;
})();
