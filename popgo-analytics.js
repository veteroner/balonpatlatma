/**
 * PopGo — merkezi olay izleme (Firebase Analytics, native SDK).
 *
 * Neden var: reklam kampanyası açılmadan önce "kurulan kaç kişi oyunu açtı,
 * kaç bölüm oynadı, ödüllü reklamı gerçekten gördü mü" sorularının cevabı
 * gerekiyor. Bu modül tek giriş noktası sağlar:
 *
 *     popgoTrack('level_complete', { level: 7, score: 12400 });
 *
 * Tasarım kararları:
 *  - Native SDK kullanılır (@capacitor-firebase/analytics). Google Ads
 *    kampanyası kurulum ilişkilendirmesini native `first_open` olayından
 *    okur; web SDK'si bunu sağlamaz.
 *  - Tarayıcıda (npm/Netlify önizlemesi) eklenti yok — olaylar yalnızca
 *    konsola yazılır, hiçbir çağrı patlamaz.
 *  - Eklenti hazır olmadan tetiklenen olaylar kuyrukta bekler; hazır olunca
 *    sırayla gönderilir. Oyunun ilk saniyelerindeki olaylar bu yüzden kayboluyordu.
 *
 * Firebase olay adı kuralları: en fazla 40 karakter, harf/rakam/alt tire,
 * `firebase_` `google_` `ga_` önekleri yasak. Parametre değeri string ise
 * en fazla 100 karakter.
 */
(function () {
    'use strict';

    const MAX_QUEUE = 50;

    const state = {
        plugin: null,
        ready: false,
        native: false,
        disabled: false,
        queue: []
    };

    /**
     * Ölçüm günlüğü. app.js `console.log`'u üretimde bastırdığı için (bkz.
     * DEBUG_FLAGS/ORIGINAL_CONSOLE) yazdırmayı doğrudan orijinal konsola yapıyoruz;
     * aksi hâlde bayrağı açsan bile hiçbir şey görünmez.
     */
    function log(...args) {
        try {
            if (typeof DEBUG_FLAGS === 'undefined' || !DEBUG_FLAGS || !DEBUG_FLAGS.analytics) return;
            const sink = (typeof ORIGINAL_CONSOLE !== 'undefined' && ORIGINAL_CONSOLE && ORIGINAL_CONSOLE.log) || console.log;
            sink('📊 [ANALYTICS]', ...args);
        } catch (_) { /* günlükleme asla oyunu bozmamalı */ }
    }

    function isNative() {
        try {
            return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
        } catch (_) {
            return false;
        }
    }

    async function init() {
        state.native = isNative();

        if (!state.native) {
            log('Tarayıcı ortamı — olaylar yalnızca konsola yazılacak');
            state.ready = true;
            flush();
            return;
        }

        const plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FirebaseAnalytics;
        if (!plugin) {
            console.warn('⚠️ [ANALYTICS] FirebaseAnalytics eklentisi bulunamadı — ölçüm kapalı');
            state.disabled = true;
            state.queue.length = 0;
            return;
        }

        state.plugin = plugin;

        try {
            await plugin.setEnabled({ enabled: true });
            state.ready = true;
            log('Firebase Analytics hazır');
            flush();
        } catch (error) {
            console.warn('⚠️ [ANALYTICS] setEnabled başarısız:', error && error.message);
            // Yine de göndermeyi dene; setEnabled bazı sürümlerde zaten varsayılan açık.
            state.ready = true;
            flush();
        }
    }

    function send(name, params) {
        if (!state.native) {
            log(name, params || {});
            return;
        }
        try {
            state.plugin.logEvent({ name: name, params: params || {} })
                .catch((error) => console.warn('⚠️ [ANALYTICS] logEvent hatası:', name, error && error.message));
            log(name, params || {});
        } catch (error) {
            console.warn('⚠️ [ANALYTICS] logEvent fırlattı:', name, error && error.message);
        }
    }

    function flush() {
        const pending = state.queue.splice(0, state.queue.length);
        pending.forEach((event) => send(event.name, event.params));
    }

    /**
     * Olayı gönderir; eklenti hazır değilse kuyruğa alır.
     * @param {string} name   snake_case olay adı (maks. 40 karakter)
     * @param {object} [params] olay parametreleri
     */
    function track(name, params) {
        if (state.disabled) return;
        if (typeof name !== 'string' || !name) return;

        if (!state.ready) {
            if (state.queue.length < MAX_QUEUE) {
                state.queue.push({ name: name, params: params });
            }
            return;
        }
        send(name, params);
    }

    /** Kullanıcı özelliği (ör. ulaşılan en yüksek bölüm) — segment kırılımı için. */
    function setUserProperty(key, value) {
        if (state.disabled || !state.native || !state.ready || !state.plugin) return;
        try {
            state.plugin.setUserProperty({ key: key, value: String(value) }).catch(() => {});
        } catch (_) { /* yok say */ }
    }

    window.popgoTrack = track;
    window.popgoSetUserProperty = setUserProperty;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
