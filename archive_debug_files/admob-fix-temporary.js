// GEÇICI ADMOB DÜZELTME - TEST MODU
// AdMob kısıtlaması kalkana kadar kullanın

// app.js dosyasında aşağıdaki değişiklikleri yapın:

// 1. AdMob Initialize kısmını değiştirin:
/*
await AdMob.initialize({ 
    initializeForTesting: true, // ← GEÇICI TEST MODU
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
    maxAdContentRating: 'General'
});
*/

// 2. Banner AD ID'lerini test ID'leri ile değiştirin:
/*
// iOS Banner Test ID
const bannerAdId = 'ca-app-pub-3940256099942544/2435281174';
const isTesting = true;

// Android Banner Test ID  
const bannerAdId = 'ca-app-pub-3940256099942544/6300978111';
const isTesting = true;
*/

// 3. Interstitial AD ID'lerini test ID'leri ile değiştirin:
/*
// iOS Interstitial Test ID
const interstitialId = 'ca-app-pub-3940256099942544/4411468910';
const isTesting = true;

// Android Interstitial Test ID
const interstitialId = 'ca-app-pub-3940256099942544/1033173712';  
const isTesting = true;
*/

// 4. App ID'yi test ID ile değiştirin:
/*
// Test App ID (hem iOS hem Android için)
const testAppId = 'ca-app-pub-3940256099942544~3347511713';
*/

console.log('🧪 GEÇICI TEST MODU AKTIF - AdMob kısıtlaması kalkınca production ID\'lere geri dönün');
