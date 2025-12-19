// IMMEDIATE BANNER TEST SCRIPT
// iOS Simulator Console'da çalıştır:

console.log('🎯 BANNER TEST BAŞLIYOR...');

// 1. Test banner function override
if (window.AdMobPlugin) {
    window.testBannerNow = async () => {
        console.log('🚀 Testing banner NOW...');
        try {
            await window.AdMobPlugin.showBannerAd('BOTTOM_CENTER');
            console.log('✅ Banner test SUCCESS!');
        } catch (e) {
            console.error('❌ Banner test FAILED:', e);
        }
    };
}

// 2. Direct AdMob test
window.testDirectBanner = async () => {
    console.log('🚀 Direct AdMob banner test...');
    try {
        const { AdMob } = await import('@capacitor-community/admob');
        const options = {
            adId: 'ca-app-pub-7610338885240453/2144790251', // iOS production
            adSize: 'BANNER',
            position: 'BOTTOM_CENTER',
            margin: 0,
            isTesting: false
        };
        console.log('Options:', options);
        await AdMob.showBanner(options);
        console.log('✅ Direct banner SUCCESS!');
    } catch (e) {
        console.error('❌ Direct banner FAILED:', e);
    }
};

// 3. Test with Google test ID
window.testGoogleBanner = async () => {
    console.log('🚀 Google test banner...');
    try {
        const { AdMob } = await import('@capacitor-community/admob');
        const options = {
            adId: 'ca-app-pub-3940256099942544/2435281174', // Google test
            adSize: 'BANNER',
            position: 'BOTTOM_CENTER',
            margin: 0,
            isTesting: true
        };
        console.log('Test Options:', options);
        await AdMob.showBanner(options);
        console.log('✅ Google test banner SUCCESS!');
    } catch (e) {
        console.error('❌ Google test banner FAILED:', e);
    }
};

console.log('📋 Available tests:');
console.log('  testBannerNow() - Test current system');
console.log('  testDirectBanner() - Test production ID directly');
console.log('  testGoogleBanner() - Test Google test ID');

// Auto-run Google test banner in 3 seconds
setTimeout(() => {
    console.log('🚀 AUTO-TESTING Google banner...');
    window.testGoogleBanner();
}, 3000);
