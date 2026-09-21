/**
 * PopGo — zamanlanmış hatırlatma göndericisi (GitHub Actions'tan çalışır).
 *
 * Bilgoo/Novalingo ile aynı yaklaşım: Firebase Cloud Functions zamanlayıcısı
 * Blaze planı ister, FCM gönderimi ise Spark'ta ücretsizdir. Bu betik Admin SDK
 * ile `popgo_daily` konusuna tek bir mesaj atar; uygulama (popgo-push.js)
 * bildirim izni verildiğinde bu konuya abone olur.
 *
 * Ortam değişkenleri:
 *   FIREBASE_SERVICE_ACCOUNT  hizmet hesabı JSON'u (popgo-1c34f projesi)
 *   SLOT                      'noon' | 'evening'
 *   DRY_RUN                   'true' ise gönderilmez, yalnızca loglanır
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

const TOPIC = 'popgo_daily';
const CHANNEL_ID = 'popgo_reminders';

const MESSAGES = {
    noon: [
        { title: 'Öğle arası 🎈', body: 'Beş dakikan var mı? Balonlar seni bekliyor!' },
        { title: 'Kısa bir mola ver 🍀', body: 'Birkaç balon patlat, kafanı dağıt.' },
        { title: 'Balonlar birikti! 🎈', body: 'Ekran doldu taştı, patlatacak birine ihtiyaç var.' },
        { title: 'Günün serisi seni bekliyor 🔥', body: 'Bugünkü rekorunu kırmaya ne dersin?' },
        { title: 'Pop pop pop! 💥', body: 'Parmaklarını ısıt, yeni bölüm hazır.' }
    ],
    evening: [
        { title: 'Günün yorgunluğunu at 🌙', body: 'Birkaç tur PopGo ile rahatla.' },
        { title: 'Rekorun hâlâ ayakta mı? 🏆', body: 'Bu akşam onu geçmeyi dene!' },
        { title: 'Akşam turu başladı 🎈', body: 'Renkli balonlar seni bekliyor, hadi bir tur!' },
        { title: 'Bir bölüm daha? 😄', body: 'Uyumadan önce son bir balon yağmuru.' },
        { title: 'Yeni bölümler açıldı mı? 🔓', body: 'Nerede kaldığını hatırlıyor musun? Devam et!' }
    ]
};

function pick(list) {
    // Gün bazlı döngü: art arda iki gün aynı metin gitmez, rastgelelik yok.
    const day = Math.floor(Date.now() / 86_400_000);
    return list[day % list.length];
}

async function main() {
    const slot = process.env.SLOT || 'evening';
    const dryRun = String(process.env.DRY_RUN).toLowerCase() === 'true';
    const pool = MESSAGES[slot];
    if (!pool) throw new Error(`Bilinmeyen SLOT: ${slot}`);

    const { title, body } = pick(pool);
    const message = {
        topic: TOPIC,
        notification: { title, body },
        data: { type: 'daily_reminder', slot },
        android: {
            priority: 'high',
            notification: { channelId: CHANNEL_ID, sound: 'default' }
        },
        apns: {
            payload: { aps: { sound: 'default' } }
        }
    };

    console.log(`Slot: ${slot} | Konu: ${TOPIC} | "${title}" — ${body}`);

    if (dryRun) {
        console.log('DRY_RUN: gönderilmedi.');
        return;
    }

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT tanımlı değil (GitHub Environment secret).');

    initializeApp({ credential: cert(JSON.parse(raw)) });
    const id = await getMessaging().send(message);
    console.log(`Gönderildi: ${id}`);
}

main().catch((error) => {
    console.error('Gönderim başarısız:', error.message);
    process.exit(1);
});
