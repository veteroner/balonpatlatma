/**
 * Mağaza ekran görüntülerini üretir.
 * Kaynak: iPhone 17 Pro Max simülatöründen alınmış gerçek oynanış kareleri (1320x2868).
 * Çıktı: App Store 1290x2796 ve Play 1080x1920 pazarlama kareleri.
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SHOTS = process.argv[2];
const OUT = process.argv[3];

const STATUS_BAR = 132;           // üstteki saat/pil şeridi kırpılır
const SRC_W = 1320, SRC_H = 2868;

const FRAMES = [
    { file: '01-oynanis.png', title: 'Eşleştir, patlat,\nbölümü temizle', sub: 'Tek dokunuşla oynanır' },
    { file: '03-ates.png',    title: 'Ateş topu\nyolunu açar',           sub: 'Sıkıştığın bölümü aç' },
    { file: '04-bomba.png',   title: 'Bomba tüm bölgeyi\ntemizler',      sub: 'Doğru gücü doğru anda kullan' },
    { file: '02-aksiyon.png', title: 'İnternetsiz de\noynanır',           sub: 'Metroda, uçakta, her yerde' },
    { file: '05-menu.png',    title: 'Üç oyun modu',                     sub: 'Klasik · Strateji · Arcade' },
    { type: 'powers',         title: 'Altı farklı güç\nsenin elinde',    sub: '' },
];

const SIZES = [
    { name: 'appstore', w: 1290, h: 2796, shotW: 1000, shotTop: 430, titleTop: 120, titleSize: 66, subSize: 38, radius: 44 },
    { name: 'play',     w: 1080, h: 1920, shotW: 740,  shotTop: 330, titleTop: 86,  titleSize: 52, subSize: 30, radius: 34 },
];

function bgSvg(w, h) {
    return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="#0B1030"/>
      <stop offset="55%" stop-color="#1A1247"/>
      <stop offset="100%" stop-color="#2A1050"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="${Math.round(h * 0.42)}" r="60%">
      <stop offset="0%" stop-color="#4A2BFF" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#4A2BFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <ellipse cx="${w / 2}" cy="${h * 0.42}" rx="${w * 0.75}" ry="${h * 0.34}" fill="url(#glow)"/>
</svg>`);
}

async function textImg(text, size, color, maxWidth) {
    const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return sharp({
        text: {
            text: `<span foreground="${color}">${esc}</span>`,
            font: `Helvetica Bold ${size}`,
            rgba: true,
            width: maxWidth,
            align: 'center',
            spacing: Math.round(size * 0.25),
        },
    }).png().toBuffer({ resolveWithObject: true });
}

/** Köşeleri yuvarlatılmış, ince kenarlıklı ekran görüntüsü. */
async function roundedShot(buf, w, h, radius) {
    const mask = Buffer.from(
        `<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`);
    const border = Buffer.from(
        `<svg width="${w}" height="${h}"><rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="${radius}" ry="${radius}" fill="none" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="3"/></svg>`);
    return sharp(buf)
        .resize(w, h, { fit: 'fill' })
        .composite([{ input: mask, blend: 'dest-in' }, { input: border }])
        .png().toBuffer();
}

async function powersPanel(width) {
    const bar = await sharp(path.join(SHOTS, '01-oynanis.png'))
        .extract({ left: 0, top: 2660, width: SRC_W, height: 200 })
        .resize(width)
        .toBuffer();
    const h = Math.round(200 * width / SRC_W);
    const mask = Buffer.from(`<svg width="${width}" height="${h}"><rect width="${width}" height="${h}" rx="28" fill="#fff"/></svg>`);
    return { buf: await sharp(bar).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer(), h };
}

(async () => {
    for (const size of SIZES) {
        const dir = path.join(OUT, size.name);
        fs.mkdirSync(dir, { recursive: true });

        for (let i = 0; i < FRAMES.length; i++) {
            const f = FRAMES[i];
            const layers = [];

            const title = await textImg(f.title, size.titleSize, '#FFFFFF', Math.round(size.w * 0.86));
            layers.push({ input: title.data, top: size.titleTop, left: Math.round((size.w - title.info.width) / 2) });

            let contentTop = size.titleTop + title.info.height;
            if (f.sub) {
                const subTop = contentTop + Math.round(size.titleSize * 0.55);
                const sub = await textImg(f.sub, size.subSize, '#9BB0E8', Math.round(size.w * 0.84));
                layers.push({ input: sub.data, top: subTop, left: Math.round((size.w - sub.info.width) / 2) });
                contentTop = subTop + sub.info.height;
            }

            if (f.type === 'powers') {
                const panelW = Math.round(size.w * 0.92);
                const panel = await powersPanel(panelW);

                const names = [
                    'Bomba — çevreyi havaya uçurur',
                    'Lazer — bir satırı siler',
                    'Ateş topu — çarptığı yeri eritir',
                    'Dikey lazer — sütunu temizler',
                    'Dondurucu — süreyi yavaşlatır',
                    'Gökkuşağı — her renge uyar',
                ].join('\n');
                const list = await textImg(names, Math.round(size.subSize * 1.55), '#E8EDFF', Math.round(size.w * 0.92));

                // Çubuk + liste tek blok olarak, başlığın altındaki alanda dikey ortalanır.
                const gap = Math.round(size.h * 0.07);
                const groupH = panel.h + gap + list.info.height;
                const areaTop = contentTop + Math.round(size.h * 0.03);
                const areaBottom = size.h - Math.round(size.h * 0.06);
                const top = areaTop + Math.max(0, Math.round((areaBottom - areaTop - groupH) / 2));

                layers.push({ input: panel.buf, top, left: Math.round((size.w - panelW) / 2) });
                layers.push({ input: list.data, top: top + panel.h + gap, left: Math.round((size.w - list.info.width) / 2) });
            } else {
                const srcH = SRC_H - STATUS_BAR;
                const shotH = Math.round(size.shotW * srcH / SRC_W);
                const cropped = await sharp(path.join(SHOTS, f.file))
                    .extract({ left: 0, top: STATUS_BAR, width: SRC_W, height: srcH })
                    .toBuffer();
                const shot = await roundedShot(cropped, size.shotW, shotH, size.radius);
                layers.push({ input: shot, top: size.shotTop, left: Math.round((size.w - size.shotW) / 2) });
            }

            const out = path.join(dir, `${String(i + 1).padStart(2, '0')}-popgo.png`);
            await sharp(bgSvg(size.w, size.h)).composite(layers).png({ quality: 95 }).toFile(out);
            const meta = await sharp(out).metadata();
            console.log(`${size.name}/${path.basename(out)} → ${meta.width}x${meta.height}`);
        }
    }
})();
