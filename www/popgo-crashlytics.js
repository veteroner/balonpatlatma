/**
 * PopGo — çökme ve hata raporlama (Firebase Crashlytics, native SDK).
 *
 * Neden var: Capacitor oyununda gerçek çökmelerin neredeyse tamamı JS
 * tarafında olur ve WKWebView/WebView içindeki bir JS hatası native süreci
 * ÇÖKERTMEZ. Yani yalnız SDK'yı kurmak Crashlytics panelini boş bırakır.
 * Bu modül JS hatalarını yakalayıp `recordException` ile ölümcül-olmayan
 * kayıt olarak gönderir — panelde görünen şey budur.
 *
 *     popgoRecordError(err, { yer: 'shootBubble' });
 *
 * Tasarım kararları:
 *  - Tarayıcıda (npm/Netlify önizlemesi) eklenti yok — hatalar yalnızca
 *    konsola yazılır, hiçbir çağrı patlamaz.
 *  - **Kısma (throttle) şart:** oyun döngüsü saniyede 60 kare çalışıyor;
 *    döngü içindeki tek bir hata kısmasız binlerce kayıt üretir, ağı ve
 *    Crashlytics kotasını doldurur. Aynı imzalı hata SIGNATURE_TTL boyunca
 *    bir kez, toplamda da oturum başına MAX_PER_SESSION kez gönderilir.
 *  - Bağlam olarak bölüm/oyun durumu özel anahtar (custom key) yazılır ki
 *    panelde "hangi bölümde patlıyor" görülebilsin.
 *  - Handler'ın kendi içindeki hata yutulur; raporlama asla oyunu bozmamalı.
 */
(function () {
    'use strict';

    const SIGNATURE_TTL = 60000;   // aynı hata için en fazla 1 kayıt / 60 sn
    const MAX_PER_SESSION = 25;    // oturum başı üst sınır
    const MAX_MESSAGE = 400;       // Crashlytics mesajını makul tut
    const MAX_QUEUE = 10;          // eklenti hazır olmadan biriken hatalar

    const state = {
        plugin: null,
        ready: false,
        native: false,
        sent: 0,
        seen: new Map(),           // imza -> son gönderim zamanı
        queue: []                  // hazır olmadan gelen hatalar
    };

    /**
     * Ölçüm günlüğü. app.js `console.log`'u üretimde bastırdığı için
     * (bkz. DEBUG_FLAGS/ORIGINAL_CONSOLE) doğrudan orijinal konsola yazıyoruz.
     */
    function log(...args) {
        try {
            if (typeof DEBUG_FLAGS === 'undefined' || !DEBUG_FLAGS || !DEBUG_FLAGS.analytics) return;
            const sink = (typeof ORIGINAL_CONSOLE !== 'undefined' && ORIGINAL_CONSOLE && ORIGINAL_CONSOLE.log) || console.log;
            sink('🧨 [CRASHLYTICS]', ...args);
        } catch (_) { /* günlükleme asla oyunu bozmamalı */ }
    }

    function isNative() {
        try {
            return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
        } catch (_) {
            return false;
        }
    }

    /** Kısma kararı: bu imza şu an gönderilebilir mi? */
    function allow(signature) {
        if (state.sent >= MAX_PER_SESSION) return false;

        const now = Date.now();
        const last = state.seen.get(signature);
        if (last && now - last < SIGNATURE_TTL) return false;

        state.seen.set(signature, now);
        // Map'in sınırsız büyümesini engelle
        if (state.seen.size > 100) {
            for (const [k, t] of state.seen) {
                if (now - t > SIGNATURE_TTL) state.seen.delete(k);
            }
        }
        return true;
    }

    /**
     * Hata benzeri mi? `instanceof Error` KULLANILMAZ: farklı realm'den gelen
     * hatalarda (iframe, eklenti köprüsü, worker) false döner ve hata
     * `JSON.stringify` ile "{}" olur — o zaman bütün hatalar aynı imzaya
     * düşer ve kısma ilk kayıttan sonrasını yutar. Ördek tiplemesi ve
     * cross-realm güvenli toString kontrolü yapılır.
     */
    function isErrorLike(e) {
        if (!e || typeof e !== 'object') return false;
        if (typeof e.message === 'string') return true;
        try { return Object.prototype.toString.call(e) === '[object Error]'; } catch (_) { return false; }
    }

    /** Hata nesnesini mesaj + imzaya indir. */
    function describe(err, context) {
        let message;
        let stack = '';

        if (isErrorLike(err)) {
            message = (err.name || 'Error') + ': ' + (err.message || '');
            stack = String(err.stack || '');
        } else if (err && typeof err === 'object') {
            try {
                const j = JSON.stringify(err);
                // "{}" bilgi taşımaz (ör. serileşmeyen nesneler); String()'e düş
                message = (j && j !== '{}') ? j : String(err);
            } catch (_) {
                message = String(err);
            }
        } else {
            message = String(err);
        }

        if (context) {
            try { message += ' | ' + JSON.stringify(context); } catch (_) { /* yok say */ }
        }
        if (message.length > MAX_MESSAGE) message = message.slice(0, MAX_MESSAGE);

        // İmza: mesajın ilk satırı + yığının ilk karesi. Satır numarası
        // değişse bile aynı hatayı aynı kabul etmek için kabaca normalize edilir.
        const firstFrame = (stack.split('\n')[1] || '').replace(/:\d+:\d+/g, '');
        return { message: message, signature: (message.split('|')[0] + firstFrame).slice(0, 200) };
    }

    /** Oyun bağlamını özel anahtar olarak yaz — panelde kırılım sağlar. */
    function setKey(key, value, type) {
        if (!state.ready || !state.plugin) return;
        try {
            state.plugin.setCustomKey({ key: key, value: value, type: type }).catch(() => {});
        } catch (_) { /* yok say */ }
    }

    function currentContext() {
        const out = [];
        try {
            if (typeof currentLevel !== 'undefined' && currentLevel != null) {
                out.push({ key: 'seviye', value: Number(currentLevel) || 0, type: 'int' });
            }
            if (typeof gameState !== 'undefined' && gameState != null) {
                out.push({ key: 'oyun_durumu', value: String(gameState), type: 'string' });
            }
            if (typeof gameMode !== 'undefined' && gameMode != null) {
                out.push({ key: 'oyun_modu', value: String(gameMode), type: 'string' });
            }
        } catch (_) { /* app.js henüz yüklenmemiş olabilir */ }
        return out;
    }

    /** Tek bir kaydı native tarafa gönder. */
    function send(entry) {
        try {
            state.sent++;
            state.plugin.recordException(entry).catch(() => {});
            log('gönderildi', entry.message);
        } catch (_) { /* yok say */ }
    }

    /** Ölümcül olmayan hata kaydı. Her yerden güvenle çağrılabilir. */
    function record(err, context) {
        try {
            const d = describe(err, context);

            if (!state.native) {
                log('(tarayıcı, gönderilmedi)', d.message);
                return;
            }
            if (!allow(d.signature)) {
                log('(kısıldı)', d.message);
                return;
            }

            // Eklenti henüz hazır değilse kuyruğa al. Açılış sırasındaki
            // hatalar en değerlileri; onları kaybetmek Crashlytics'i anlamsız kılar.
            if (!state.ready || !state.plugin) {
                if (state.queue.length < MAX_QUEUE) {
                    state.queue.push({ message: d.message, keysAndValues: currentContext() });
                    log('(kuyrukta)', d.message);
                }
                return;
            }

            send({ message: d.message, keysAndValues: currentContext() });
        } catch (_) { /* raporlamanın kendi hatası yutulur */ }
    }

    /** Crashlytics'e serbest metin iz bırak (çökmeden önceki adımlar). */
    function breadcrumb(message) {
        if (!state.native || !state.ready || !state.plugin) return;
        try {
            state.plugin.log({ message: String(message).slice(0, MAX_MESSAGE) }).catch(() => {});
        } catch (_) { /* yok say */ }
    }

    function installHandlers() {
        window.addEventListener('error', function (e) {
            // Kaynak yükleme hatalarında (img/script) e.error yoktur
            record(e.error || (e.message + ' @ ' + (e.filename || '?') + ':' + (e.lineno || 0)));
        });

        window.addEventListener('unhandledrejection', function (e) {
            record(e.reason || 'unhandledrejection (sebep yok)');
        });
    }

    async function init() {
        state.native = isNative();

        if (!state.native) {
            log('tarayıcı ortamı — hatalar yalnızca konsola yazılacak');
            return;
        }

        try {
            const plugin = window.Capacitor && window.Capacitor.Plugins
                && window.Capacitor.Plugins.FirebaseCrashlytics;
            if (!plugin) {
                log('FirebaseCrashlytics eklentisi bulunamadı');
                return;
            }

            state.plugin = plugin;
            await plugin.setEnabled({ enabled: true });
            state.ready = true;
            log('hazır');

            // Açılışta biriken hataları sırayla gönder
            const bekleyen = state.queue.splice(0, state.queue.length);
            for (const entry of bekleyen) send(entry);

            // Önceki açılışta çöktüyse bunu bir kez olay olarak işaretle;
            // Analytics tarafında "çökme sonrası dönen kullanıcı" ayrılabilsin.
            try {
                const res = await plugin.didCrashOnPreviousExecution();
                if (res && res.crashed) {
                    log('önceki oturum çökmeyle kapanmış');
                    if (typeof window.popgoTrack === 'function') {
                        window.popgoTrack('previous_run_crashed', {});
                    }
                }
            } catch (_) { /* yok say */ }
        } catch (e) {
            log('kurulum hatası', e);
        }
    }

    window.popgoRecordError = record;
    window.popgoBreadcrumb = breadcrumb;
    window.popgoSetCrashKey = setKey;

    // Dinleyiciler HEMEN kurulur (init'i beklemeden): app.js yüklenirken veya
    // oyunun ilk saniyelerinde atılan hatalar en değerli olanlar. init'e
    // bırakılsaydı DOMContentLoaded'a kadar olan her şey kaçardı.
    // Not: app.js de kendi 'error'/'unhandledrejection' dinleyicilerini kuruyor;
    // ikisi de eklemeli olduğu için çakışmaz (preventDefault yayılımı durdurmaz).
    installHandlers();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
