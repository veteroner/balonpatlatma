/**
 * PopGo — günlük hatırlatma bildirimleri (Firebase Cloud Messaging).
 *
 * Neden var: oyuncuyu geri getiren en ucuz kanal. Bilgoo ve Novalingo'daki
 * sistemin aynısı: bildirimleri sunucu değil GitHub Actions cron'u gönderir
 * (.github/workflows/popgo-notifications.yml). FCM gönderimi Firebase Spark
 * planında ücretsizdir; ücretli olan yalnızca Cloud Functions zamanlayıcısıdır.
 *
 * Tasarım kararları:
 *  - Token saklanmaz. PopGo'da hesap ve veritabanı yok; cihaz `popgo_daily`
 *    konusuna (topic) abone olur, gönderici o konuya tek mesaj atar. Geçersiz
 *    token temizliği gibi işleri FCM kendisi yapar.
 *  - İzin açılışta DEĞİL, 2. bölüm bitince istenir. İlk saniyede sorulan izin
 *    çoğunlukla reddedilir ve iOS bir daha sormaya izin vermez.
 *  - İzin verilmişse her açılışta konuya yeniden abone olunur (idempotent).
 *    Uygulama yeniden kurulunca ya da token yenilenince abonelik böylece kendini onarır.
 *  - Tarayıcıda eklenti yok — modül sessizce hiçbir şey yapmaz.
 */
(function () {
    'use strict';

    const TOPIC = 'popgo_daily';
    const CHANNEL_ID = 'popgo_reminders';
    const STORAGE_KEY = 'popgo_push_state';
    const ASK_AFTER_COMPLETED_LEVELS = 2;

    function readState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : { completed: 0, asked: false };
        } catch (_) {
            return { completed: 0, asked: false };
        }
    }

    function writeState(state) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (_) { /* depolama kapalıysa izin bir sonraki açılışta yeniden sorulabilir */ }
    }

    function plugin() {
        try {
            if (!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) return null;
            return (window.Capacitor.Plugins && window.Capacitor.Plugins.FirebaseMessaging) || null;
        } catch (_) {
            return null;
        }
    }

    function platform() {
        try {
            return window.Capacitor.getPlatform();
        } catch (_) {
            return 'web';
        }
    }

    function track(name, params) {
        if (typeof window.popgoTrack === 'function') window.popgoTrack(name, params || {});
    }

    /**
     * Konuya abone olur. iOS'ta abonelik APNs token'ı gelmeden çalışmaz;
     * getToken() hem FCM token'ını hem de APNs kaydını tamamlatır.
     */
    async function subscribe(Messaging) {
        try {
            await Messaging.getToken();
            await Messaging.subscribeToTopic({ topic: TOPIC });
            console.log('🔔 [PUSH] ' + TOPIC + ' konusuna abone olundu');
            return true;
        } catch (error) {
            console.warn('⚠️ [PUSH] Abonelik başarısız:', error && error.message);
            return false;
        }
    }

    async function init() {
        const Messaging = plugin();
        if (!Messaging) return;

        // Android 8+: bildirimler bir kanala bağlı olmalı. Gönderici aynı
        // channelId'yi kullanıyor; kanal yoksa Android varsayılan kanala düşer.
        if (platform() === 'android') {
            try {
                await Messaging.createChannel({
                    id: CHANNEL_ID,
                    name: 'Günlük hatırlatmalar',
                    description: 'Oyuna dönmen için günlük hatırlatmalar',
                    importance: 3,
                    visibility: 1
                });
            } catch (_) { /* kanal zaten varsa ya da desteklenmiyorsa sorun değil */ }
        }

        try {
            await Messaging.addListener('notificationActionPerformed', function (event) {
                const data = (event && event.notification && event.notification.data) || {};
                track('push_open', { slot: String(data.slot || 'unknown') });
            });
        } catch (_) { /* dinleyici olmadan da bildirim uygulamayı açar */ }

        try {
            const status = await Messaging.checkPermissions();
            if (status && status.receive === 'granted') await subscribe(Messaging);
        } catch (error) {
            console.warn('⚠️ [PUSH] İzin durumu okunamadı:', error && error.message);
        }
    }

    /**
     * Bölüm tamamlandığında çağrılır. Yeterli bölüm bittiyse ve izin daha önce
     * sorulmadıysa sistem izin penceresini açar.
     */
    async function maybeAskForPermission() {
        const state = readState();
        state.completed = (state.completed || 0) + 1;
        writeState(state);

        const Messaging = plugin();
        if (!Messaging || state.asked) return;
        if (state.completed < ASK_AFTER_COMPLETED_LEVELS) return;

        try {
            const current = await Messaging.checkPermissions();
            if (current && current.receive === 'granted') {
                state.asked = true;
                writeState(state);
                await subscribe(Messaging);
                return;
            }
            // 'denied' ise sistem pencere göstermez; tekrar denemenin anlamı yok.
            if (current && current.receive === 'denied') {
                state.asked = true;
                writeState(state);
                return;
            }
        } catch (_) { /* durum okunamazsa doğrudan istemeyi dene */ }

        // Bölüm tamamlama modalı otursun diye kısa gecikme.
        setTimeout(async function () {
            try {
                const result = await Messaging.requestPermissions();
                const granted = !!(result && result.receive === 'granted');
                state.asked = true;
                writeState(state);
                track('push_permission', { granted: granted ? 1 : 0, completed_levels: state.completed });
                if (granted) await subscribe(Messaging);
            } catch (error) {
                console.warn('⚠️ [PUSH] İzin isteği başarısız:', error && error.message);
            }
        }, 1500);
    }

    window.popgoMaybeAskForPush = maybeAskForPermission;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
