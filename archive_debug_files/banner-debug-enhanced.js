// ENHANCED BANNER AD DEBUGGING SYSTEM
// Based on Google's Official iOS AdMob Banner Documentation
// https://developers.google.com/admob/ios/banner?hl=tr

window.BannerDebugger = {
    // Enhanced banner ad function with complete logging
    showBannerAdEnhanced: async (position = 'TOP_CENTER') => {
        try {
            // ENHANCED BANNER DEBUGGING - Following Google's iOS Banner Documentation
            console.log('🎯 [BANNER DEBUG] ==================== BANNER AD LOAD START ====================');
            console.log('🎯 [BANNER DEBUG] Position requested:', position);
            console.log('🎯 [BANNER DEBUG] Current timestamp:', new Date().toISOString());
            console.log('🎯 [BANNER DEBUG] User agent:', navigator.userAgent);
            console.log('🎯 [BANNER DEBUG] Window dimensions:', window.innerWidth, 'x', window.innerHeight);
            console.log('🎯 [BANNER DEBUG] Device pixel ratio:', window.devicePixelRatio);
            console.log('🎯 [BANNER DEBUG] Capacitor available:', !!window.Capacitor);
            console.log('🎯 [BANNER DEBUG] AdMob global reference:', !!window.AdMob);

            // Get AdMob reference (try global first, then import)
            let AdMob = window.AdMob;
            if (!AdMob) {
                try {
                    console.log('🎯 [BANNER DEBUG] Importing AdMob SDK from @capacitor-community/admob...');
                    const startImport = performance.now();
                    const { AdMob: ImportedAdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');
                    const importTime = performance.now() - startImport;
                    
                    AdMob = ImportedAdMob;
                    window.AdMob = AdMob;
                    window.BannerAdSize = BannerAdSize;
                    window.BannerAdPosition = BannerAdPosition;
                    
                    console.log('✅ [BANNER DEBUG] AdMob SDK imported successfully in', importTime.toFixed(2), 'ms');
                    console.log('✅ [BANNER DEBUG] Available BannerAdSizes:', Object.keys(BannerAdSize || {}));
                    console.log('✅ [BANNER DEBUG] Available BannerAdPositions:', Object.keys(BannerAdPosition || {}));
                } catch (e) {
                    console.error('❌ [BANNER DEBUG] AdMob SDK import FAILED:', e);
                    console.error('❌ [BANNER DEBUG] Import error name:', e.name);
                    console.error('❌ [BANNER DEBUG] Import error message:', e.message);
                    console.error('❌ [BANNER DEBUG] Import error stack:', e.stack);
                    return false;
                }
            }

            // Enhanced platform detection
            const platform = window.Capacitor?.getPlatform() || 'web';
            const isIOS = platform === 'ios';
            const isAndroid = platform === 'android';
            const isWeb = platform === 'web';
            const isSimulator = isIOS && (navigator.userAgent.includes('iPhone Simulator') || navigator.userAgent.includes('iPad Simulator'));
            
            console.log('🎯 [BANNER DEBUG] Enhanced platform detection:');
            console.log('🎯 [BANNER DEBUG] - Platform string:', platform);
            console.log('🎯 [BANNER DEBUG] - Is iOS:', isIOS);
            console.log('🎯 [BANNER DEBUG] - Is Android:', isAndroid);
            console.log('🎯 [BANNER DEBUG] - Is Web:', isWeb);
            console.log('🎯 [BANNER DEBUG] - Is iOS Simulator:', isSimulator);
            console.log('🎯 [BANNER DEBUG] - User agent details:', navigator.userAgent);

            // AdMob SDK status check
            console.log('🎯 [BANNER DEBUG] AdMob SDK Object Analysis:');
            console.log('🎯 [BANNER DEBUG] - AdMob type:', typeof AdMob);
            console.log('🎯 [BANNER DEBUG] - AdMob constructor:', AdMob.constructor?.name);
            console.log('🎯 [BANNER DEBUG] - AdMob methods:', Object.getOwnPropertyNames(AdMob));
            console.log('🎯 [BANNER DEBUG] - showBanner available:', typeof AdMob.showBanner === 'function');
            console.log('🎯 [BANNER DEBUG] - hideBanner available:', typeof AdMob.hideBanner === 'function');

            // Platform-specific Banner IDs following Google's documentation
            let bannerAdId, isTesting;
            if (isSimulator) {
                bannerAdId = 'ca-app-pub-3940256099942544/2435281174'; // iOS test banner ID from Google docs
                isTesting = true;
                console.log('🧪 [BANNER DEBUG] Using GOOGLE TEST banner ID for iOS Simulator');
                console.log('🧪 [BANNER DEBUG] Google test ID from documentation: ca-app-pub-3940256099942544/2435281174');
            } else if (isIOS) {
                // VERIFIED PRODUCTION ID from AdMob Console
                bannerAdId = 'ca-app-pub-7610338885240453/2144790251'; // iOS production
                isTesting = false; // Production mode
                console.log('📱 [BANNER DEBUG] Using VERIFIED iOS production banner ID: 2144790251');
                console.log('📱 [BANNER DEBUG] Full production ID: ca-app-pub-7610338885240453/2144790251');
                console.log('📱 [BANNER DEBUG] Production mode: isTesting = false');
            } else if (isAndroid) {
                // TEMPORARY: Test ID (real Android ID not ready yet)  
                bannerAdId = 'ca-app-pub-3940256099942544/6300978111'; // Android test banner ID from Google docs
                isTesting = true; // Test mode active
                console.log('🤖 [BANNER DEBUG] Using GOOGLE TEST banner ID for Android (temporary)');
                console.log('🤖 [BANNER DEBUG] Google Android test ID: ca-app-pub-3940256099942544/6300978111');
            } else {
                console.error('❌ [BANNER DEBUG] Unknown platform - cannot determine banner ID');
                console.error('❌ [BANNER DEBUG] Platform detected:', platform);
                throw new Error('Platform not supported for banner ads: ' + platform);
            }
            
            console.log('🎯 [BANNER DEBUG] Banner Configuration:');
            console.log('🎯 [BANNER DEBUG] - Selected Ad Unit ID:', bannerAdId);
            console.log('🎯 [BANNER DEBUG] - Testing mode enabled:', isTesting);
            console.log('🎯 [BANNER DEBUG] - Target position:', position);

            // Check Capacitor network status
            try {
                if (window.Capacitor?.Plugins?.Network) {
                    const networkStatus = await window.Capacitor.Plugins.Network.getStatus();
                    console.log('🎯 [BANNER DEBUG] Network Status:', networkStatus);
                } else {
                    console.log('🎯 [BANNER DEBUG] Network plugin not available - assuming online');
                }
            } catch (e) {
                console.warn('⚠️ [BANNER DEBUG] Could not check network status:', e.message);
            }

            // Check ATT status for iOS (following Apple's requirements)
            if (isIOS && AdMob.trackingAuthorizationStatus) {
                try {
                    console.log('🎯 [BANNER DEBUG] Checking iOS ATT (App Tracking Transparency) status...');
                    const attStatus = await AdMob.trackingAuthorizationStatus();
                    console.log('🎯 [BANNER DEBUG] ATT Status:', attStatus.status);
                    console.log('🎯 [BANNER DEBUG] ATT Status details:', JSON.stringify(attStatus, null, 2));
                    
                    // Detailed ATT status analysis
                    switch (attStatus.status) {
                        case 'notDetermined':
                            console.warn('⚠️ [BANNER DEBUG] ATT permission not determined - ads might have limited targeting');
                            console.warn('⚠️ [BANNER DEBUG] Consider requesting ATT permission before showing ads');
                            break;
                        case 'denied':
                            console.warn('⚠️ [BANNER DEBUG] ATT permission denied - limited ad tracking');
                            console.warn('⚠️ [BANNER DEBUG] Ads will show but with reduced personalization');
                            break;
                        case 'authorized':
                            console.log('✅ [BANNER DEBUG] ATT permission authorized - full ad tracking available');
                            console.log('✅ [BANNER DEBUG] Personalized ads can be shown');
                            break;
                        case 'restricted':
                            console.warn('⚠️ [BANNER DEBUG] ATT permission restricted - check device restrictions');
                            break;
                        default:
                            console.warn('⚠️ [BANNER DEBUG] Unknown ATT status:', attStatus.status);
                    }
                } catch (e) {
                    console.warn('⚠️ [BANNER DEBUG] Could not check ATT status:', e.message);
                }
            }

            // Check AdMob initialization status
            if (AdMob.getInitializationStatus) {
                try {
                    console.log('🎯 [BANNER DEBUG] Checking AdMob initialization status...');
                    const initStatus = await AdMob.getInitializationStatus();
                    console.log('🎯 [BANNER DEBUG] AdMob initialization status:', initStatus);
                } catch (e) {
                    console.warn('⚠️ [BANNER DEBUG] Could not check initialization status:', e.message);
                }
            }

            // Prepare banner options following Google's banner documentation
            const options = {
                adId: bannerAdId,
                adSize: window.BannerAdSize?.BANNER || 'BANNER',
                position: position === 'TOP_CENTER' ? 
                    (window.BannerAdPosition?.TOP_CENTER || 'TOP_CENTER') : 
                    (window.BannerAdPosition?.BOTTOM_CENTER || 'BOTTOM_CENTER'),
                margin: 0,
                isTesting: isTesting
            };
            
            console.log('🔥 [BANNER DEBUG] Final banner options prepared:');
            console.log('🔥 [BANNER DEBUG]', JSON.stringify(options, null, 2));
            console.log('🔥 [BANNER DEBUG] Target platform:', isSimulator ? 'iOS Simulator' : isIOS ? 'iOS Device' : isAndroid ? 'Android Device' : 'Unknown');

            // Pre-banner DOM state capture
            console.log('🔍 [BANNER DEBUG] Pre-banner DOM state:');
            const preBannerElements = document.querySelectorAll('[id*="banner"], [class*="banner"], [id*="admob"], [class*="admob"]');
            console.log('🔍 [BANNER DEBUG] Pre-banner elements found:', preBannerElements.length);

            // Execute banner ad display
            console.log('🚀 [BANNER DEBUG] Calling AdMob.showBanner() NOW...');
            const bannerStartTime = performance.now();
            
            try {
                await AdMob.showBanner(options);
                
                const bannerLoadTime = performance.now() - bannerStartTime;
                console.log('✅ [BANNER DEBUG] AdMob.showBanner() completed successfully!');
                console.log('✅ [BANNER DEBUG] Banner load time:', bannerLoadTime.toFixed(2), 'ms');
                console.log('✅ [BANNER DEBUG] Banner should now be visible on screen');
                
                // Immediate post-banner checks
                setTimeout(() => {
                    BannerDebugger.verifyBannerPresence();
                }, 1000);
                
                // Extended verification
                setTimeout(() => {
                    BannerDebugger.verifyBannerPresence();
                }, 3000);
                
            } catch (bannerError) {
                const bannerLoadTime = performance.now() - bannerStartTime;
                console.error('❌ [BANNER DEBUG] AdMob.showBanner() FAILED after', bannerLoadTime.toFixed(2), 'ms');
                throw bannerError;
            }

            // Add banner event listeners if available (following Google's documentation)
            try {
                if (AdMob.addListener) {
                    console.log('🎯 [BANNER DEBUG] Setting up banner event listeners...');
                    
                    // Banner received (equivalent to iOS bannerViewDidReceiveAd)
                    AdMob.addListener('bannerReceived', (info) => {
                        console.log('🎉 [BANNER EVENT] bannerReceived (iOS: bannerViewDidReceiveAd):', info);
                        console.log('🎉 [BANNER EVENT] Banner successfully loaded and displayed');
                    });
                    
                    // Banner failed to load (equivalent to iOS didFailToReceiveAdWithError)
                    AdMob.addListener('bannerFailedToLoad', (error) => {
                        console.error('❌ [BANNER EVENT] bannerFailedToLoad (iOS: didFailToReceiveAdWithError):', error);
                        BannerDebugger.diagnoseBannerError(error);
                    });
                    
                    // Banner opened (equivalent to iOS bannerViewWillPresentScreen)
                    AdMob.addListener('bannerOpened', (info) => {
                        console.log('🔓 [BANNER EVENT] bannerOpened (iOS: bannerViewWillPresentScreen):', info);
                        console.log('🔓 [BANNER EVENT] User tapped banner, full-screen ad will present');
                    });
                    
                    // Banner closed (equivalent to iOS bannerViewDidDismissScreen)
                    AdMob.addListener('bannerClosed', (info) => {
                        console.log('🔒 [BANNER EVENT] bannerClosed (iOS: bannerViewDidDismissScreen):', info);
                        console.log('🔒 [BANNER EVENT] User returned from full-screen ad');
                    });
                    
                    // Banner clicked (equivalent to iOS bannerViewDidRecordClick)
                    AdMob.addListener('bannerClicked', (info) => {
                        console.log('👆 [BANNER EVENT] bannerClicked (iOS: bannerViewDidRecordClick):', info);
                        console.log('👆 [BANNER EVENT] Banner interaction recorded');
                    });
                    
                    // Banner impression (equivalent to iOS bannerViewDidRecordImpression)
                    AdMob.addListener('bannerImpression', (info) => {
                        console.log('👁️ [BANNER EVENT] bannerImpression (iOS: bannerViewDidRecordImpression):', info);
                        console.log('👁️ [BANNER EVENT] Banner impression recorded for monetization');
                    });
                    
                    console.log('✅ [BANNER DEBUG] Banner event listeners registered successfully');
                } else {
                    console.warn('⚠️ [BANNER DEBUG] AdMob.addListener not available - events will not be captured');
                }
            } catch (e) {
                console.warn('⚠️ [BANNER DEBUG] Could not set up event listeners:', e.message);
            }
            
            console.log('🎯 [BANNER DEBUG] ==================== BANNER AD LOAD COMPLETE ====================');
            return true;
            
        } catch (error) {
            console.error('❌ [BANNER DEBUG] ==================== BANNER AD LOAD FAILED ====================');
            console.error('❌ [BANNER DEBUG] Banner ad failed with error:', error);
            console.error('❌ [BANNER DEBUG] Error name:', error.name);
            console.error('❌ [BANNER DEBUG] Error message:', error.message);
            console.error('❌ [BANNER DEBUG] Error code:', error.code);
            console.error('❌ [BANNER DEBUG] Error stack trace:', error.stack);
            
            // Enhanced error diagnosis
            BannerDebugger.diagnoseBannerError(error);
            
            console.error('❌ [BANNER DEBUG] ==================== BANNER AD DIAGNOSIS COMPLETE ====================');
            return false;
        }
    },

    // Verify banner presence in DOM
    verifyBannerPresence: () => {
        console.log('🔍 [BANNER VERIFY] === BANNER PRESENCE VERIFICATION ===');
        console.log('🔍 [BANNER VERIFY] Timestamp:', new Date().toISOString());
        
        // Check for banner-related elements
        const bannerSelectors = [
            '[id*="banner"]',
            '[class*="banner"]', 
            '[id*="admob"]',
            '[class*="admob"]',
            '[id*="google"]',
            '[class*="google"]',
            '[id*="gads"]',
            '[class*="gads"]'
        ];
        
        let totalElements = 0;
        bannerSelectors.forEach((selector, index) => {
            const elements = document.querySelectorAll(selector);
            console.log(`🔍 [BANNER VERIFY] Selector ${index + 1} "${selector}": ${elements.length} elements`);
            totalElements += elements.length;
            
            elements.forEach((el, elIndex) => {
                const rect = el.getBoundingClientRect();
                console.log(`🔍 [BANNER VERIFY] Element ${elIndex + 1}:`, {
                    id: el.id,
                    className: el.className,
                    tagName: el.tagName,
                    display: el.style.display,
                    visibility: el.style.visibility,
                    width: el.offsetWidth,
                    height: el.offsetHeight,
                    position: {
                        top: rect.top,
                        left: rect.left,
                        bottom: rect.bottom,
                        right: rect.right
                    },
                    visible: rect.width > 0 && rect.height > 0
                });
            });
        });
        
        // Check for iframes (common for banner ads)
        const iframes = document.querySelectorAll('iframe');
        console.log('🔍 [BANNER VERIFY] Total iframes found:', iframes.length);
        iframes.forEach((iframe, index) => {
            const rect = iframe.getBoundingClientRect();
            console.log(`🔍 [BANNER VERIFY] Iframe ${index + 1}:`, {
                src: iframe.src,
                width: iframe.width || iframe.offsetWidth,
                height: iframe.height || iframe.offsetHeight,
                display: iframe.style.display,
                position: {
                    top: rect.top,
                    left: rect.left,
                    bottom: rect.bottom,
                    right: rect.right
                },
                visible: rect.width > 0 && rect.height > 0
            });
        });
        
        // Check viewport and scroll
        console.log('🔍 [BANNER VERIFY] Viewport info:', {
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            documentHeight: document.documentElement.scrollHeight
        });
        
        console.log('🔍 [BANNER VERIFY] Total banner-related elements:', totalElements);
        console.log('🔍 [BANNER VERIFY] === VERIFICATION COMPLETE ===');
    },

    // Enhanced error diagnosis
    diagnoseBannerError: (error) => {
        console.error('❌ [BANNER DIAGNOSIS] ==================== ERROR DIAGNOSIS START ====================');
        console.error('❌ [BANNER DIAGNOSIS] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        
        if (error.message) {
            const message = error.message.toLowerCase();
            
            if (message.includes('no fill') || message.includes('no ad')) {
                console.error('❌ [BANNER DIAGNOSIS] NO FILL ERROR - No ad inventory available');
                console.error('❌ [BANNER DIAGNOSIS] Possible causes:');
                console.error('❌ [BANNER DIAGNOSIS] 1. Geographic restrictions (ads not available in your region)');
                console.error('❌ [BANNER DIAGNOSIS] 2. Ad inventory exhausted (try again later)');
                console.error('❌ [BANNER DIAGNOSIS] 3. App/Ad Unit not approved yet');
                console.error('❌ [BANNER DIAGNOSIS] 4. Testing too frequently (AdMob has request limits)');
                
            } else if (message.includes('invalid ad unit') || message.includes('invalid adunitid')) {
                console.error('❌ [BANNER DIAGNOSIS] INVALID AD UNIT ID');
                console.error('❌ [BANNER DIAGNOSIS] Action required:');
                console.error('❌ [BANNER DIAGNOSIS] 1. Verify Ad Unit ID exists in AdMob console');
                console.error('❌ [BANNER DIAGNOSIS] 2. Check if Ad Unit is active (not paused)');
                console.error('❌ [BANNER DIAGNOSIS] 3. Ensure Ad Unit type is Banner (not Interstitial/Rewarded)');
                
            } else if (message.includes('network') || message.includes('connection')) {
                console.error('❌ [BANNER DIAGNOSIS] NETWORK ERROR');
                console.error('❌ [BANNER DIAGNOSIS] Check:');
                console.error('❌ [BANNER DIAGNOSIS] 1. Internet connectivity');
                console.error('❌ [BANNER DIAGNOSIS] 2. Firewall/proxy settings');
                console.error('❌ [BANNER DIAGNOSIS] 3. DNS resolution');
                
            } else if (message.includes('not initialized') || message.includes('initialization')) {
                console.error('❌ [BANNER DIAGNOSIS] INITIALIZATION ERROR');
                console.error('❌ [BANNER DIAGNOSIS] Required fixes:');
                console.error('❌ [BANNER DIAGNOSIS] 1. Call AdMob.initialize() before showBanner()');
                console.error('❌ [BANNER DIAGNOSIS] 2. Wait for initialization to complete');
                console.error('❌ [BANNER DIAGNOSIS] 3. Check App ID in capacitor.config.ts');
                
            } else if (message.includes('timeout')) {
                console.error('❌ [BANNER DIAGNOSIS] TIMEOUT ERROR');
                console.error('❌ [BANNER DIAGNOSIS] Possible solutions:');
                console.error('❌ [BANNER DIAGNOSIS] 1. Retry after delay');
                console.error('❌ [BANNER DIAGNOSIS] 2. Check network speed');
                console.error('❌ [BANNER DIAGNOSIS] 3. Verify AdMob server status');
                
            } else if (message.includes('permission') || message.includes('tracking')) {
                console.error('❌ [BANNER DIAGNOSIS] PERMISSION ERROR');
                console.error('❌ [BANNER DIAGNOSIS] iOS specific:');
                console.error('❌ [BANNER DIAGNOSIS] 1. Request ATT permission first');
                console.error('❌ [BANNER DIAGNOSIS] 2. Check Info.plist settings');
                console.error('❌ [BANNER DIAGNOSIS] 3. Verify SKAdNetwork entries');
                
            } else {
                console.error('❌ [BANNER DIAGNOSIS] UNKNOWN ERROR TYPE');
                console.error('❌ [BANNER DIAGNOSIS] Error message:', error.message);
                console.error('❌ [BANNER DIAGNOSIS] Check Google AdMob documentation for this error');
            }
        }
        
        // Additional diagnostic info
        console.error('❌ [BANNER DIAGNOSIS] Environment info:');
        console.error('❌ [BANNER DIAGNOSIS] - Platform:', window.Capacitor?.getPlatform());
        console.error('❌ [BANNER DIAGNOSIS] - User agent:', navigator.userAgent);
        console.error('❌ [BANNER DIAGNOSIS] - Online status:', navigator.onLine);
        console.error('❌ [BANNER DIAGNOSIS] - Timestamp:', new Date().toISOString());
        
        console.error('❌ [BANNER DIAGNOSIS] ==================== ERROR DIAGNOSIS END ====================');
    },

    // Test banner with different positions
    testAllPositions: async () => {
        console.log('🧪 [BANNER TEST] Testing all banner positions...');
        const positions = ['TOP_CENTER', 'BOTTOM_CENTER'];
        
        for (const position of positions) {
            console.log(`🧪 [BANNER TEST] Testing position: ${position}`);
            try {
                await BannerDebugger.showBannerAdEnhanced(position);
                console.log(`✅ [BANNER TEST] Position ${position} - SUCCESS`);
                
                // Wait before next test
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // Hide banner before next test
                if (window.AdMob?.hideBanner) {
                    await window.AdMob.hideBanner();
                }
                
            } catch (e) {
                console.error(`❌ [BANNER TEST] Position ${position} - FAILED:`, e.message);
            }
        }
        
        console.log('🧪 [BANNER TEST] All position tests completed');
    }
};

// Make debugging functions globally available
window.testBanner = () => BannerDebugger.showBannerAdEnhanced('BOTTOM_CENTER');
window.testBannerTop = () => BannerDebugger.showBannerAdEnhanced('TOP_CENTER');
window.testAllBannerPositions = BannerDebugger.testAllPositions;
window.verifyBanner = BannerDebugger.verifyBannerPresence;

console.log('🎯 [BANNER DEBUG] Enhanced banner debugging system loaded');
console.log('🎯 [BANNER DEBUG] Available functions: testBanner(), testBannerTop(), testAllBannerPositions(), verifyBanner()');
