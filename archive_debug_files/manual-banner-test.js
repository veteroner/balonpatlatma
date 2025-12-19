// MANUAL BANNER TESTING COMMANDS
// iOS Console'da bu komutları çalıştırın

console.log('🎯 [MANUAL TEST] Banner testing commands loaded');

// Test production banner ID
window.testProductionBanner = async () => {
    console.log('🚀 [PRODUCTION TEST] Testing production banner...');
    try {
        const { AdMob } = await import('@capacitor-community/admob');
        const options = {
            adId: 'ca-app-pub-7610338885240453/2144790251', // iOS production
            adSize: 'BANNER',
            position: 'BOTTOM_CENTER',
            margin: 0,
            isTesting: false
        };
        console.log('🔥 [PRODUCTION TEST] Options:', JSON.stringify(options, null, 2));
        await AdMob.showBanner(options);
        console.log('✅ [PRODUCTION TEST] SUCCESS!');
    } catch (e) {
        console.error('❌ [PRODUCTION TEST] FAILED:', e);
        console.error('❌ [PRODUCTION TEST] Error details:', JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
    }
};

// Test Google test banner ID
window.testGoogleBanner = async () => {
    console.log('🧪 [GOOGLE TEST] Testing Google test banner...');
    try {
        const { AdMob } = await import('@capacitor-community/admob');
        const options = {
            adId: 'ca-app-pub-3940256099942544/2435281174', // Google iOS test
            adSize: 'BANNER',
            position: 'BOTTOM_CENTER',
            margin: 0,
            isTesting: true
        };
        console.log('🔥 [GOOGLE TEST] Options:', JSON.stringify(options, null, 2));
        await AdMob.showBanner(options);
        console.log('✅ [GOOGLE TEST] SUCCESS!');
    } catch (e) {
        console.error('❌ [GOOGLE TEST] FAILED:', e);
        console.error('❌ [GOOGLE TEST] Error details:', JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
    }
};

// Hide banner
window.hideBanner = async () => {
    console.log('🙈 [HIDE] Hiding banner...');
    try {
        const { AdMob } = await import('@capacitor-community/admob');
        await AdMob.hideBanner();
        console.log('✅ [HIDE] Banner hidden');
    } catch (e) {
        console.error('❌ [HIDE] Failed to hide:', e);
    }
};

// Check ATT status
window.checkATT = async () => {
    console.log('🔍 [ATT] Checking ATT status...');
    try {
        const { AdMob } = await import('@capacitor-community/admob');
        const status = await AdMob.trackingAuthorizationStatus();
        console.log('✅ [ATT] Status:', status);
    } catch (e) {
        console.error('❌ [ATT] Failed to check:', e);
    }
};

// Check AdMob status
window.checkAdMob = () => {
    console.log('🔍 [ADMOB] AdMob status check:');
    console.log('- Global AdMob:', !!window.AdMob);
    console.log('- AdMobPlugin:', !!window.AdMobPlugin);
    console.log('- Capacitor:', !!window.Capacitor);
    console.log('- Platform:', window.Capacitor?.getPlatform());
    console.log('- User Agent:', navigator.userAgent);
};

// DOM banner check
window.checkBannerDOM = () => {
    console.log('🔍 [DOM] Checking for banner elements...');
    const selectors = ['[id*="banner"]', '[class*="banner"]', '[id*="admob"]', '[class*="admob"]', 'iframe'];
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`- ${selector}: ${elements.length} elements`);
        elements.forEach((el, i) => {
            const rect = el.getBoundingClientRect();
            console.log(`  Element ${i+1}: ${el.tagName} - ${rect.width}x${rect.height}, Visible: ${rect.width > 0 && rect.height > 0}`);
        });
    });
};

console.log('📋 [MANUAL TEST] Available commands:');
console.log('  testProductionBanner() - Test real production banner');
console.log('  testGoogleBanner() - Test Google test banner');
console.log('  hideBanner() - Hide current banner');
console.log('  checkATT() - Check ATT permission status');
console.log('  checkAdMob() - Check AdMob plugin status');
console.log('  checkBannerDOM() - Check DOM for banner elements');

// Auto-run status checks
setTimeout(() => {
    console.log('🔄 [AUTO] Running automatic checks...');
    window.checkAdMob();
    window.checkATT();
}, 2000);
