// QUICK BANNER DEBUG FIX

// Replace the entire showBannerAd function with this enhanced version
const enhancedShowBannerAd = async (position = 'TOP_CENTER') => {
    try {
        console.log('🎯 [BANNER] ==================== START ====================');
        console.log('🎯 [BANNER] Position:', position, '| Time:', new Date().toISOString());
        console.log('🎯 [BANNER] Platform:', window.Capacitor?.getPlatform(), '| User-Agent:', navigator.userAgent);
        console.log('🎯 [BANNER] AdMob Available:', !!window.AdMob, '| Capacitor:', !!window.Capacitor);

        // Get AdMob reference
        let AdMob = window.AdMob;
        if (!AdMob) {
            try {
                console.log('🎯 [BANNER] Importing AdMob SDK...');
                const { AdMob: ImportedAdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');
                AdMob = ImportedAdMob;
                window.AdMob = AdMob;
                window.BannerAdSize = BannerAdSize;
                window.BannerAdPosition = BannerAdPosition;
                console.log('✅ [BANNER] SDK imported. Sizes:', Object.keys(BannerAdSize), 'Positions:', Object.keys(BannerAdPosition));
            } catch (e) {
                console.error('❌ [BANNER] Import failed:', e.name, e.message);
                return false;
            }
        }
        
        // Platform detection
        const isIOS = window.Capacitor && window.Capacitor.getPlatform() === 'ios';
        const isAndroid = window.Capacitor && window.Capacitor.getPlatform() === 'android';
        const isSimulator = isIOS && (navigator.userAgent.includes('iPhone Simulator') || navigator.userAgent.includes('iPad Simulator'));
        
        console.log('🎯 [BANNER] Platform Detection - iOS:', isIOS, 'Android:', isAndroid, 'Simulator:', isSimulator);

        let bannerAdId, isTesting;
        if (isSimulator) {
            bannerAdId = 'ca-app-pub-3940256099942544/2435281174'; // iOS test banner ID
            isTesting = true;
            console.log('🧪 [BANNER] Using iOS Simulator TEST ID:', bannerAdId);
        } else if (isIOS) {
            // GERÇEK PRODUCTION ID - AdMob Console'dan doğrulandı
            bannerAdId = 'ca-app-pub-7610338885240453/2144790251'; // iOS production
            isTesting = false; // Production modu
            console.log('📱 [BANNER] Using iOS PRODUCTION ID:', bannerAdId, '(isTesting: false)');
        } else if (isAndroid) {
            // GEÇICI: Test ID kullan (gerçek ID'niz henüz hazır değil)  
            bannerAdId = 'ca-app-pub-3940256099942544/6300978111'; // Android test banner ID
            isTesting = true; // Test modu aktif
            console.log('🤖 [BANNER] Using Android TEST ID:', bannerAdId, '(temporary)');
        } else {
            console.error('❌ [BANNER] Unknown platform, cannot determine Ad Unit ID');
            throw new Error('Unsupported platform for banner ads');
        }

        // Check ATT status on iOS
        if (isIOS && AdMob.trackingAuthorizationStatus) {
            try {
                const attStatus = await AdMob.trackingAuthorizationStatus();
                console.log('🎯 [BANNER] iOS ATT Status:', attStatus.status);
                if (attStatus.status === 'notDetermined') {
                    console.warn('⚠️ [BANNER] ATT not determined - may affect ad delivery');
                }
            } catch (e) {
                console.warn('⚠️ [BANNER] Could not check ATT:', e.message);
            }
        }

        const options = {
            adId: bannerAdId,
            adSize: window.BannerAdSize?.BANNER || 'BANNER',
            position: position === 'TOP_CENTER' ? 
                (window.BannerAdPosition?.TOP_CENTER || 'TOP_CENTER') : 
                (window.BannerAdPosition?.BOTTOM_CENTER || 'BOTTOM_CENTER'),
            margin: 0,
            isTesting: isTesting
        };
        
        console.log('🔥 [BANNER] Options:', JSON.stringify(options, null, 2));
        console.log('🚀 [BANNER] Calling AdMob.showBanner()...');
        
        const startTime = performance.now();
        await AdMob.showBanner(options);
        const loadTime = performance.now() - startTime;
        
        console.log('✅ [BANNER] SUCCESS! Load time:', loadTime.toFixed(2), 'ms');
        
        // Verify banner presence after 2 seconds
        setTimeout(() => {
            const bannerElements = document.querySelectorAll('[id*="banner"], [class*="banner"], [id*="admob"], [class*="admob"], iframe');
            console.log('🔍 [BANNER] Post-load verification - Found', bannerElements.length, 'potential banner elements');
            bannerElements.forEach((el, i) => {
                const rect = el.getBoundingClientRect();
                console.log(`🔍 [BANNER] Element ${i+1}: ${el.tagName} ${el.id} ${el.className} - Size: ${rect.width}x${rect.height}, Visible: ${rect.width > 0 && rect.height > 0}`);
            });
        }, 2000);
        
        console.log('🎯 [BANNER] ==================== COMPLETE ====================');
        return true;
        
    } catch (error) {
        console.error('❌ [BANNER] ==================== FAILED ====================');
        console.error('❌ [BANNER] Error:', error.name, '-', error.message);
        console.error('❌ [BANNER] Code:', error.code, '| Stack:', error.stack);
        console.error('❌ [BANNER] Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        
        // Quick error diagnosis
        if (error.message?.includes('No fill')) {
            console.error('💡 [BANNER] DIAGNOSIS: No ad inventory - normal during testing');
        } else if (error.message?.includes('Invalid ad unit')) {
            console.error('💡 [BANNER] DIAGNOSIS: Invalid Ad Unit ID - check AdMob console');
        } else if (error.message?.includes('Network')) {
            console.error('💡 [BANNER] DIAGNOSIS: Network issue - check connectivity');
        } else if (error.message?.includes('Not initialized')) {
            console.error('💡 [BANNER] DIAGNOSIS: AdMob not initialized - check setup');
        }
        
        console.error('❌ [BANNER] ==================== END ERROR ====================');
        return false;
    }
};

// Override the existing function
if (window.AdMobPlugin) {
    window.AdMobPlugin.showBannerAd = enhancedShowBannerAd;
    console.log('✅ Enhanced banner debug system activated!');
}

// Make it globally available for manual testing
window.testBannerAdvanced = enhancedShowBannerAd;
window.testBannerBottom = () => enhancedShowBannerAd('BOTTOM_CENTER');
window.testBannerTop = () => enhancedShowBannerAd('TOP_CENTER');

console.log('🎯 [BANNER DEBUG] Enhanced system ready!');
console.log('🎯 [BANNER DEBUG] Use: testBannerAdvanced(), testBannerBottom(), testBannerTop()');
