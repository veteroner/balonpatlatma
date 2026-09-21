'use strict';

// Minimal toast fallback to avoid runtime errors if showToast is not defined
if (typeof window !== 'undefined' && typeof window.showToast !== 'function') {
    window.showToast = function(message, type) {
        const tag = type ? String(type).toUpperCase() : 'INFO';
        try {
            console.log(`[TOAST:${tag}] ${message}`);
        } catch(_) {}
    };
}

// Global error handlers to avoid crashes from unhandled errors in rendering/async flows
if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
        try {
            console.error('🌐 Global JS error:', e?.message, e?.error || '');
        } catch (_) {}
    });
    window.addEventListener('unhandledrejection', (e) => {
        try {
            console.error('🌐 Global unhandled promise rejection:', e?.reason);
        } catch (_) {}
        if (typeof e?.preventDefault === 'function') e.preventDefault();
    });
}

// 🎯 UNITY ADS CONFIGURATION (PRIORITY AD NETWORK)
const UNITY_ADS_CONFIG = {
    // Game IDs
    gameId: {
        ios: '5970926',
        android: '5970927'
    },
    
    // Ad Unit IDs (Placement IDs)
    // Production modda dashboard'dan oluşturulan custom placement'lar
    placements: {
        interstitial: 'Interstitial_Android',
        interstitialIOS: 'Interstitial_iOS',
        rewarded: 'Rewarded_Android',
        rewardedIOS: 'Rewarded_iOS'
    },
    
    // Test mode - PRODUCTION MODE: false
    testMode: false,
    
    // Helper: Get game ID based on platform
    getGameId(platform) {
        return this.gameId[platform] || this.gameId.android;
    },
    
    // Helper: Get placement ID based on type and platform
    getPlacementId(type, platform) {
        const key = platform === 'ios' ? `${type}IOS` : type;
        return this.placements[key] || this.placements[type];
    }
};

// 🎯 AD MEDIATION SYSTEM - AdMob only (Unity Ads kaldırıldı)
window.AD_MEDIATION = {
    primaryNetwork: 'admob',
    fallbackNetwork: 'admob',
    currentNetwork: 'admob',
    networks: {
        // Unity Ads projeden kaldırıldı; asla "available" işaretlenmez.
        unity: { available: false, initialized: false, errors: [] },
        admob: { available: false, initialized: false, errors: [] }
    },

    // Auto-detect availability of native bridges/plugins
    autoDetectNetworks() {
        let changed = false;

        try {
            if (typeof window !== 'undefined') {
                // Unity Ads kaldırıldı — yalnızca AdMob tespit edilir.
                const cap = window.Capacitor;
                const admobPlugin = window.AdMobPlugin || cap?.Plugins?.AdMob;
                if (admobPlugin && !this.networks.admob.available) {
                    this.markAvailable('admob', true);
                    changed = true;
                }
            }
        } catch (autoError) {
            console.warn('⚠️ [MEDIATION] Auto-detect warning:', autoError);
        }

        return changed;
    },

    // Helper to choose preferred network without logging
    getPreferredNetwork() {
        if (this.networks.unity.available) {
            return 'unity';
        }
        if (this.networks.admob.available) {
            return 'admob';
        }
        return null;
    },

    async waitForNetwork(adType, maxAttempts = 3, delayMs = 120) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            this.autoDetectNetworks();
            const preferred = this.getPreferredNetwork();
            if (preferred) {
                if (attempt > 0) {
                    console.log(`⏳ [MEDIATION] ${adType} network resolved after wait attempt ${attempt + 1}: ${preferred}`);
                }
                return preferred;
            }

            if (attempt < maxAttempts - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        return null;
    },
    
    // Network availability management
    markAvailable(network, available) {
        this.networks[network].available = available;
        if (available) {
            console.log(`✅ ${network.toUpperCase()} network available`);
        } else {
            console.log(`❌ ${network.toUpperCase()} network unavailable`);
        }
    },
    
    // Mark network as initialized
    markInitialized(network, initialized) {
        if (!this.networks[network]) return;
        this.networks[network].initialized = initialized;
        console.log(`🔧 ${network.toUpperCase()} initialized: ${initialized}`);
    },
    
    // Error logging
    logError(network, error) {
        this.networks[network].errors.push({
            timestamp: Date.now(),
            error: error.message || error
        });
        console.error(`❌ ${network.toUpperCase()} error:`, error);
    },
    
    // Get best available network
    getBestNetwork() {
        if (this.networks.unity.available) {
            this.currentNetwork = 'unity';
            return 'unity';
        } else if (this.networks.admob.available) {
            this.currentNetwork = 'admob';
            return 'admob';
        }
        return null;
    },
    
    // Switch to fallback network
    switchToFallback() {
        if (this.currentNetwork === 'unity' && this.networks.admob.available) {
            console.log('🔄 Switching from Unity Ads to AdMob fallback');
            this.currentNetwork = 'admob';
            return 'admob';
        }
        return null;
    },
    
    // Get active network for ad type
    getActiveNetwork(adType) {
        this.autoDetectNetworks();

        const status = {
            unity: { available: this.networks.unity.available },
            admob: { available: this.networks.admob.available }
        };
        console.log(`🔍 [MEDIATION] Checking networks for ${adType}:`, status);

        const preferred = this.getPreferredNetwork();
        if (preferred === 'unity') {
            console.log(`🎮 [MEDIATION] Using Unity Ads for ${adType}`);
        } else if (preferred === 'admob') {
            console.log(`📱 [MEDIATION] Using AdMob fallback for ${adType}`);
        }

        return preferred;
    },
    
    // Show ad with fallback
    async showAdWithFallback(adType, options = {}) {
        console.log(`🚀 [MEDIATION] ==================== START ${adType.toUpperCase()} ====================`);
        console.log(`🚀 [MEDIATION] Options:`, options);
        console.log(`🚀 [MEDIATION] Current networks status:`, {
            unity: { available: this.networks.unity.available, errors: this.networks.unity.errors.length },
            admob: { available: this.networks.admob.available, errors: this.networks.admob.errors.length }
        });
        
        let network = this.getActiveNetwork(adType);
        console.log(`🚀 [MEDIATION] Selected network for ${adType}:`, network);
        
        if (!network) {
            console.log(`⏳ [MEDIATION] Waiting briefly for ${adType} network availability...`);
            network = await this.waitForNetwork(adType);
            if (network) {
                console.log(`🚀 [MEDIATION] Network resolved for ${adType}:`, network);
            }
        }

        if (!network) {
            console.error(`❌ [MEDIATION] No network available for ${adType}`);
            throw new Error(`No ad network available for ${adType}`);
        }
        
        try {
            console.log(`🎯 [MEDIATION] Attempting to show ${adType} with ${network}...`);
            if (network === 'unity') {
                const result = await this.showUnityAd(adType, options);
                console.log(`✅ [MEDIATION] Unity ${adType} success:`, result);
                return result;
            } else if (network === 'admob') {
                const result = await this.showAdMobAd(adType, options);
                console.log(`✅ [MEDIATION] AdMob ${adType} success:`, result);
                return result;
            }
        } catch (error) {
            console.error(`❌ [MEDIATION] ${network} failed for ${adType}:`, error);
            this.logError(network, error);
            
            // Try fallback
            const fallbackNetwork = this.switchToFallback();
            console.log(`🔄 [MEDIATION] Primary ${network} failed, trying ${fallbackNetwork} fallback for ${adType}`);
            
            if (fallbackNetwork) {
                try {
                    if (fallbackNetwork === 'unity') {
                        const result = await this.showUnityAd(adType, options);
                        console.log(`✅ [MEDIATION] Unity fallback ${adType} success:`, result);
                        return result;
                    } else if (fallbackNetwork === 'admob') {
                        const result = await this.showAdMobAd(adType, options);
                        console.log(`✅ [MEDIATION] AdMob fallback ${adType} success:`, result);
                        return result;
                    }
                } catch (fallbackError) {
                    console.error(`❌ [MEDIATION] Fallback ${fallbackNetwork} also failed:`, fallbackError);
                    this.logError(fallbackNetwork, fallbackError);
                    throw new Error(`Both ad networks failed for ${adType}`);
                }
            }
            throw error;
        }
    },
    
    // Unity Ads show function
    async showUnityAd(adType, options) {
        console.log(`🎮 [UNITY] ==================== START ${adType.toUpperCase()} ====================`);
        const platform = window.Capacitor?.getPlatform() || 'web';
        const placementId = UNITY_ADS_CONFIG.getPlacementId(adType, platform);
        
        console.log('🔍 [UNITY DEBUG] Platform:', platform);
        console.log('🔍 [UNITY DEBUG] Placement ID:', placementId);
        console.log('🔍 [UNITY DEBUG] Capacitor plugins:', Object.keys(window.Capacitor?.Plugins || {}));
        
        // Use npm package "Unityads" plugin
        const UnityPlugin = window.Capacitor?.Plugins?.Unityads;
        
        if (!UnityPlugin) {
            console.error('❌ [UNITY] Unity Ads plugin not available');
            throw new Error('Unity Ads plugin not found');
        }
        
        console.log(`🎯 [UNITY] Using npm package for ${adType}`);
        
        try {
            if (adType === 'interstitial') {
                console.log(`🎯 [UNITY] Attempting to show interstitial...`);
                
                // 🔒 Reklam gösterilmeden önce oyun state'ini kaydet
                if (typeof saveGameStateBeforeAd === 'function') {
                    saveGameStateBeforeAd();
                    console.log('💾 [UNITY] Game state saved before interstitial');
                }
                
                // 🔥 BACKUP: Unity event'leri çalışmazsa 5 saniye sonra otomatik restore
                const backupRestoreTimeout = setTimeout(() => {
                    console.log('⚠️ [UNITY BACKUP] No event received in 5s, forcing restore...');
                    if (typeof restoreGameStateAfterAd === 'function') {
                        restoreGameStateAfterAd();
                    }
                }, 5000);
                
                // Event gelirse backup'ı iptal et
                const originalRestore = window.restoreGameStateAfterAd;
                window._backupRestoreTimeout = backupRestoreTimeout;
                
                try {
                    // Önce göster - eğer yüklü değilse SDK hata dönecek, o zaman yükle
                    console.log(`📺 [UNITY] Trying to show interstitial directly with placement: ${placementId}...`);
                    try {
                        const result = await UnityPlugin.showInterstitial({ placementId });
                        console.log(`✅ [UNITY] Interstitial show request sent:`, result);
                        return { success: true };
                    } catch (directShowError) {
                        console.warn(`⚠️ [UNITY] Direct show failed, loading first:`, directShowError.message);
                        
                        // Reklam yüklü değilse, önce yükle
                        console.log(`📦 [UNITY] Loading interstitial...`);
                        window._pendingUnityShow = { type: 'interstitial', placementId };
                        await UnityPlugin.loadInterstitial({ placementId });
                        console.log(`✅ [UNITY] Interstitial load request sent`);
                        
                        // Safety: attempt show after a short wait; onAdLoaded will also trigger
                        console.log(`⏳ [UNITY] Waiting briefly before safety show...`);
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time
                        try {
                            const result = await UnityPlugin.showInterstitial({ placementId });
                            console.log(`✅ [UNITY] Interstitial show request sent after load:`, result);
                            return { success: true };
                        } catch (e) {
                            console.warn('⚠️ [UNITY] Safety interstitial show after load failed, relying on onAdLoaded auto-show:', e.message);
                            return { success: true, deferred: true };
                        }
                    }
                } catch (error) {
                    console.error(`❌ [UNITY] Interstitial error:`, error);
                    throw error;
                }
                
            } else if (adType === 'rewarded') {
                console.log(`🎯 [UNITY] Attempting to show rewarded video...`);
                
                // 🔒 Reklam gösterilmeden önce oyun state'ini kaydet
                if (typeof saveGameStateBeforeAd === 'function') {
                    saveGameStateBeforeAd();
                    console.log('💾 [UNITY] Game state saved before rewarded video');
                }
                
                // Store reward callback globally for event listener
                if (options.onRewarded && typeof options.onRewarded === 'function') {
                    window._pendingRewardCallback = options.onRewarded;
                    console.log('🎁 [UNITY] Reward callback stored');
                }
                
                try {
                    // Önce göster - eğer yüklü değilse SDK hata dönecek, o zaman yükle
                    console.log(`📺 [UNITY] Trying to show rewarded video directly with placement: ${placementId}...`);
                        try {
                            // Try with placementId first
                            let result;
                            try {
                                result = await UnityPlugin.showRewardedVideo({ placementId });
                                console.log(`✅ [UNITY] Rewarded video completed (with placement):`, result);
                            } catch (paramError) {
                                console.warn('⚠️ [UNITY] showRewardedVideo with placementId failed, trying without:', paramError.message);
                                // Fallback: try without placementId parameter
                                result = await UnityPlugin.showRewardedVideo();
                                console.log(`✅ [UNITY] Rewarded video completed (without placement):`, result);
                            }

                            // Unity Ads promise resolve = ad completed successfully
                            // If it throws an error, it would be caught in catch block
                            // So if we reach here, ad was shown and completed -> grant reward
                            console.log('🎁 [UNITY] Ad completed successfully, granting reward');
                            if (window._pendingRewardCallback) {
                                console.log('🎁 [UNITY] Calling reward callback NOW');
                                try { 
                                    window._pendingRewardCallback(); 
                                    console.log('✅ [UNITY] Reward callback executed');
                                } catch (cbErr) {
                                    console.error('❌ [UNITY] Reward callback error:', cbErr);
                                }
                                window._pendingRewardCallback = null;
                            } else {
                                console.warn('⚠️ [UNITY] No pending reward callback found!');
                            }
                            return { success: true, rewarded: true, network: 'unity' };

                        } catch (directShowError) {
                        console.warn(`⚠️ [UNITY] Direct show failed, loading first:`, directShowError.message);
                        
                        // Reklam yüklü değilse, önce yükle
                        console.log(`📦 [UNITY] Loading rewarded video...`);
                        // Mark pending show so that onAdLoaded can auto-show it
                        window._pendingUnityShow = { type: 'rewarded', placementId };
                        await UnityPlugin.loadRewardedVideo({ placementId });
                        console.log(`✅ [UNITY] Rewarded video load request sent`);
                        
                        // Reklamın yüklenmesini bekle (event callback gelene kadar)
                        console.log(`⏳ [UNITY] Waiting for ad to load...`);
                        await new Promise((resolve, reject) => {
                            const loadTimeout = setTimeout(() => {
                                reject(new Error('Rewarded video load timeout'));
                            }, 10000);
                            
                            const checkInterval = setInterval(() => {
                                // Ad loaded event will trigger, but we can also try showing after delay
                                clearInterval(checkInterval);
                                clearTimeout(loadTimeout);
                                resolve();
                            }, 3000);
                        });
                        
                        // Tekrar göster (safety) - onAdLoaded will also attempt show
                        console.log(`📺 [UNITY] Attempting rewarded show after load (safety) with placement: ${placementId}...`);
                        try {
                            // Wait longer for SDK state update (critical!)
                            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds wait
                            
                            // Try with placementId first
                            try {
                                await UnityPlugin.showRewardedVideo({ placementId });
                                console.log(`✅ [UNITY] Rewarded video show request sent after load`);
                            } catch (paramError) {
                                console.warn('⚠️ [UNITY] showRewardedVideo with placementId failed, trying without param:', paramError.message);
                                // Fallback: try without placementId
                                await UnityPlugin.showRewardedVideo();
                                console.log(`✅ [UNITY] Rewarded video show request sent (without placementId)`);
                            }
                        } catch (e) {
                            console.warn('⚠️ [UNITY] Safety show after load failed, relying on onAdLoaded auto-show:', e.message);
                        }
                        
                        // After load, the show call resolves upon completion; honor result
                        try {
                            let result;
                            try {
                                result = await UnityPlugin.showRewardedVideo({ placementId });
                            } catch (_) {
                                result = await UnityPlugin.showRewardedVideo();
                            }
                            // Unity Ads promise resolve = ad completed successfully (after load path)
                            console.log('🎁 [UNITY] Ad completed successfully after load, granting reward');
                            if (window._pendingRewardCallback) {
                                console.log('🎁 [UNITY] Calling reward callback (after load path)');
                                try { window._pendingRewardCallback(); } catch (_) {}
                                window._pendingRewardCallback = null;
                            }
                            return { success: true, rewarded: true };
                        } catch (showErr) {
                            window._pendingRewardCallback = null;
                            throw showErr;
                        }
                    }
                } catch (error) {
                    console.error(`❌ [UNITY] Rewarded video error:`, error);
                    window._pendingRewardCallback = null;
                    throw error;
                }
            }
        } catch (error) {
            console.error(`❌ [UNITY] npm package error for ${adType}:`, error);
            throw error;
        }
    },
    
    // AdMob show function
    async showAdMobAd(adType, options) {
        console.log(`📱 [ADMOB] ==================== START ${adType.toUpperCase()} ====================`);
        console.log(`📱 [ADMOB] Options:`, options);
        
        const platform = window.Capacitor?.getPlatform() || 'web';
        const adId = ADMOB_CONFIG.getAdId(adType, platform);
        
        console.log(`📱 [ADMOB] Platform: ${platform}`);
        console.log(`📱 [ADMOB] Ad ID: ${adId}`);
        console.log(`📱 [ADMOB] Test Mode: ${ADMOB_CONFIG.testMode}`);
        console.log(`📱 [ADMOB] AdMobPlugin available:`, !!AdMobPlugin);
        
        // ÖNEMLİ: Burada window.AdMobPlugin sarmalayıcısı KASITLI OLARAK
        // kullanılmıyor. O sarmalayıcının showInterstitialAd/showRewardedAd
        // metodları KENDİLERİ AD_MEDIATION.showAdWithFallback(...)'ı çağırıyor
        // — showAdMobAd zaten showAdWithFallback tarafından çağrıldığı için bu
        // sonsuz özyinelemeye (RangeError: Maximum call stack size exceeded)
        // yol açıyordu: showAdWithFallback → showAdMobAd → AdMobPlugin.showX →
        // showAdWithFallback → ... Bu yüzden burada doğrudan ham AdMob
        // eklentisi çağrılıyor, mediation katmanına asla geri dönülmüyor.
        if (AdMob) {
            if (adType === 'interstitial') {
                // 🚀 Ön yüklüyse doğrudan göster (anında). Değilse hazırla.
                if (!AD_PRELOAD.isFresh('interstitial')) {
                    console.log(`📱 [ADMOB] interstitial ön yüklü değil -> prepare`);
                    await AdMob.prepareInterstitial({ adId, isTesting: ADMOB_CONFIG.testMode });
                } else {
                    console.log(`⚡ [ADMOB] interstitial ÖN YÜKLÜ -> anında göster`);
                }
                try {
                    await AdMob.showInterstitial();
                } catch (showErr) {
                    // Ön yükleme bayat/tüketilmiş olabilir -> yeniden hazırla ve tekrar dene
                    console.warn('⚠️ [ADMOB] interstitial show hatası, yeniden hazırlanıyor:', showErr?.message || showErr);
                    AD_PRELOAD.mark('interstitial', false);
                    await AdMob.prepareInterstitial({ adId, isTesting: ADMOB_CONFIG.testMode });
                    await AdMob.showInterstitial();
                }
                AD_PRELOAD.mark('interstitial', false);
                AD_GATE.noteShown('interstitial');
                setTimeout(() => { preloadAd('interstitial'); }, 1500); // sonrakini hazırla
                console.log(`📱 [ADMOB] Interstitial success`);
                return { success: true };
            } else if (adType === 'rewarded') {
                // 🚀 Ön yüklüyse doğrudan göster (anında). Değilse hazırla.
                if (!AD_PRELOAD.isFresh('rewarded')) {
                    console.log(`📱 [ADMOB] rewarded ön yüklü değil -> prepare`);
                    await AdMob.prepareRewardVideoAd({ adId, isTesting: ADMOB_CONFIG.testMode });
                } else {
                    console.log(`⚡ [ADMOB] rewarded ÖN YÜKLÜ -> anında göster`);
                }
                let result;
                try {
                    result = await AdMob.showRewardVideoAd();
                } catch (showErr) {
                    console.warn('⚠️ [ADMOB] rewarded show hatası, yeniden hazırlanıyor:', showErr?.message || showErr);
                    AD_PRELOAD.mark('rewarded', false);
                    await AdMob.prepareRewardVideoAd({ adId, isTesting: ADMOB_CONFIG.testMode });
                    result = await AdMob.showRewardVideoAd();
                }
                AD_PRELOAD.mark('rewarded', false);
                // Ödüllü reklam kullanıcının kendi isteğiyle açılır; kapıdan
                // ETKİLENMEZ ama sayacı sıfırlar -> hemen ardından interstitial gelmez.
                AD_GATE.noteShown('rewarded');
                setTimeout(() => { preloadAd('rewarded'); }, 1500); // sonrakini hazırla
                const rewarded = !!result;
                console.log(`📱 [ADMOB] Rewarded result:`, rewarded);

                if (rewarded && options.onRewarded && typeof options.onRewarded === 'function') {
                    console.log('✅ [ADMOB] Calling reward callback');
                    options.onRewarded();
                }

                return { success: true, rewarded };
            }
        }
        console.error(`❌ [ADMOB] AdMob not available for ${adType}`);
        throw new Error('AdMob not available');
    }
};

// Unity Ads Plugin Reference
let UnityAds = null;

// 🎯 ADMOB CONFIGURATION - PRODUCTION MODE (NO TEST ADS)
const ADMOB_CONFIG = {
    // 🚀 PRODUCTION MODE - Always use real ads
    get testMode() {
        // PRODUCTION: Always return false - no test ads
        const useTestMode = false; // PRODUCTION MODE - Real Ads Only
        
        console.log(`� [PRODUCTION] Test Mode: ${useTestMode ? 'ENABLED (Test Ads)' : 'DISABLED (Production Ads)'}`);
        console.log(`🚀 [PRODUCTION] Using REAL AdMob Ad Units`);
        
        return useTestMode;
    },
    
    // Interstitial Ad IDs - PRODUCTION ONLY
    interstitial: {
        ios: 'ca-app-pub-7610338885240453/1948257164',
        android: 'ca-app-pub-7610338885240453/1658037266'
    },
    
    // Rewarded Video Ad IDs - PRODUCTION ONLY
    rewarded: {
        ios: 'ca-app-pub-7610338885240453/7754600699',
        android: 'ca-app-pub-7610338885240453/8081903756'
    },
    
    // Ad frequency settings
    settings: {
        interstitialInterval: 2, // Her 2 level'de bir gösterilsin
    },
    
    // Helper function: Get ad ID based on platform - PRODUCTION ONLY
    getAdId(type, platform) {
        // PRODUCTION: Always use real ad IDs
        return this[type][platform] || this[type].ios;
    }
};

/* =========================================================================
 * 🚀 REKLAM ÖN YÜKLEME (PRELOAD)
 * Sorun: showAdMobAd her seferinde prepare -> show yapıyordu; reklam ancak
 * butona basıldıktan SONRA indirilmeye başlıyor, kullanıcı bekliyordu.
 * Çözüm: reklamı önceden hazırla; gösterim anında doğrudan show çağrılır.
 * Güvenlik: ön yükleme bayat/tüketilmişse show hata verir -> otomatik olarak
 * prepare+show'a geri düşülür (reklam geliri riske girmez).
 * ========================================================================= */
const AD_PRELOAD = {
    interstitial: { ready: false, at: 0 },
    rewarded: { ready: false, at: 0 },
    TTL_MS: 30 * 60 * 1000, // AdMob reklamları zamanla bayatlar (~1sa); 30dk sonra yenile
    isFresh(type) {
        const s = this[type];
        return !!(s && s.ready && (Date.now() - s.at) < this.TTL_MS);
    },
    mark(type, ready) {
        const s = this[type];
        if (s) { s.ready = !!ready; s.at = ready ? Date.now() : 0; }
    }
};

// Reklamı önceden hazırla (non-blocking kullanılmalı)
async function preloadAd(type) {
    try {
        if (!AdMob) return false;
        if (type !== 'interstitial' && type !== 'rewarded') return false;
        if (AD_PRELOAD.isFresh(type)) return true;

        const platform = window.Capacitor?.getPlatform?.();
        const adId = ADMOB_CONFIG.getAdId(type, platform);
        const isTesting = ADMOB_CONFIG.testMode;

        if (type === 'interstitial') {
            await AdMob.prepareInterstitial({ adId, isTesting });
        } else {
            await AdMob.prepareRewardVideoAd({ adId, isTesting });
        }
        AD_PRELOAD.mark(type, true);
        console.log(`✅ [PRELOAD] ${type} hazır (anında gösterilebilir)`);
        return true;
    } catch (e) {
        AD_PRELOAD.mark(type, false);
        console.warn(`⚠️ [PRELOAD] ${type} hazırlanamadı (non-blocking):`, e?.message || e);
        return false;
    }
}
window.preloadAd = preloadAd;

/* =========================================================================
 * ⏱️ REKLAM SIKLIK KAPISI (tek kaynak)
 *
 * ÖNCEKİ DURUM: iki ayrı interstitial yolu vardı ve birbirinden habersizdi:
 *   1) Level tetikleyicisi -> AD_MEDIATION.showAdWithFallback (doğrudan)
 *   2) adManager.showInterstitialAd (kendi 60sn kontrolü)
 * lastInterstitialTime YALNIZCA (2)'de güncelleniyordu. Yani 60sn koruması
 * gerçekte global değildi: level reklamından veya ÖDÜLLÜ reklamdan hemen
 * sonra araya bir interstitial daha girebiliyordu (reklam üstüne reklam).
 *
 * ARTIK: her tam ekran reklam (ödüllü dahil) buraya kaydedilir ve tüm
 * interstitial'lar tek kapıdan geçer. Ödüllü reklamlar kullanıcının kendi
 * isteğiyle açıldığı için kapıdan ETKİLENMEZ, sadece sayacı sıfırlar.
 * ========================================================================= */
const AD_GATE = {
    MIN_GAP_MS: 90 * 1000,   // iki tam ekran reklam arası en az 90 saniye
    FIRST_AD_MIN_LEVEL: 3,   // ilk 2 level reklamsız (yeni oyuncu tanışma dönemi)
    lastAdShownAt: 0,

    // Herhangi bir tam ekran reklam gösterildiğinde çağrılır (ödüllü dahil)
    noteShown(type) {
        this.lastAdShownAt = Date.now();
        console.log(`⏱️ [AD GATE] ${type} gösterildi -> sonraki interstitial için ${this.MIN_GAP_MS / 1000}sn bekleme`);
    },

    canShowInterstitial(reason) {
        if (typeof currentLevel === 'number' && currentLevel < this.FIRST_AD_MIN_LEVEL) {
            console.log(`⏭️ [AD GATE] Level ${currentLevel}: yeni oyuncu dönemi, interstitial yok (${reason})`);
            return false;
        }
        const since = Date.now() - this.lastAdShownAt;
        if (this.lastAdShownAt > 0 && since < this.MIN_GAP_MS) {
            console.log(`⏭️ [AD GATE] Son reklamdan ${Math.round(since / 1000)}sn geçti (<${this.MIN_GAP_MS / 1000}sn), atlanıyor (${reason})`);
            return false;
        }
        return true;
    }
};
window.AD_GATE = AD_GATE;

// AdMob Plugin Integration - Global Reference
let AdMobPlugin = null;
let AdMob = null;

// Early safe no-op fallbacks to avoid ReferenceError before real defs load
window.updateStatsDisplay = window.updateStatsDisplay || function(){ /* deferred */ };
window.updatePowerUpDisplay = window.updatePowerUpDisplay || function(){ /* deferred */ };
window.onResize = window.onResize || function(){ /* deferred */ };
// Provide early stubs for input handlers to avoid ReferenceError when logging
window.onMouseMove = window.onMouseMove || function(){};
window.onMouseDown = window.onMouseDown || function(){};
window.onTouchStart = window.onTouchStart || function(){};
window.onTouchMove = window.onTouchMove || function(){};
window.onTouchEnd = window.onTouchEnd || function(){};
window.handleCanvasClick = window.handleCanvasClick || function(){};

// Initialize AdMob Reference (Production Compatible)
try {
    if (window.Capacitor?.Plugins?.AdMob) {
        AdMob = window.Capacitor.Plugins.AdMob;
    }
} catch (e) {
    // Silent fail - production safe
}

// iOS Toast-like Alert System (disabled for production)
const showIOSToast = (title, message, type = 'info') => {
    // No-op in production: suppress all toast popups
    return;
};

// Capacitor Status Bar Control and AdMob Setup
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 [TEST] App.js DOMContentLoaded event fired!');
    
    // 🔥 CRITICAL: Reklam sonrası WebView yeniden başlatıldıysa state'i geri yükle
    try {
        const savedStateStr = localStorage.getItem('_initialGameState');
        if (savedStateStr) {
            const savedState = JSON.parse(savedStateStr);
            console.log('🔄 [BOOT] Found saved state in localStorage, will use for restore:', savedState);
            // Global değişkene ata - restoreGameStateAfterAd kullanabilsin
            window._restoredStateFromStorage = savedState;
        }
    } catch (e) { console.warn('localStorage read on boot failed:', e); }
    
    console.log('🔧 [TEST] window.UnityAdsBridge exists:', !!window.UnityAdsBridge);
    console.log('🔧 [TEST] window.Capacitor exists:', !!window.Capacitor);
    console.log('🔧 [TEST] AD_MEDIATION exists:', !!window.AD_MEDIATION);
    
    // Test: JavaScript çalışıyor mu?
    console.log('🔧 [TEST] JavaScript is working! UnityAdsBridge: ' + !!window.UnityAdsBridge);
    
    // Test: AD_MEDIATION sistemi çalışıyor mu?
    if (window.AD_MEDIATION) {
        console.log('🔧 [TEST] AD_MEDIATION sistemi çalışıyor!');
        console.log('🔧 [TEST] Primary network:', window.AD_MEDIATION.primaryNetwork);
        console.log('🔧 [TEST] Current network:', window.AD_MEDIATION.currentNetwork);
        console.log('🔧 [TEST] Unity available:', window.AD_MEDIATION.networks.unity.available);
        console.log('🔧 [TEST] AdMob available:', window.AD_MEDIATION.networks.admob.available);
    } else {
        console.error('❌ [TEST] AD_MEDIATION sistemi bulunamadı!');
    }
    
    // Tag document with platform class for platform-specific styling
    try {
        const rootEl = (document.documentElement || document.body);
        const plt = window.Capacitor?.getPlatform?.();
        let platformClassApplied = false;
        if (plt === 'android') {
            rootEl.classList.add('platform-android');
            platformClassApplied = true;
        } else if (plt === 'ios') {
            rootEl.classList.add('platform-ios');
            platformClassApplied = true;
        }
        // Fallback: if not running under Capacitor, detect via userAgent (PWA/Browser on Android)
        if (!platformClassApplied) {
            const ua = navigator.userAgent || '';
            if (/Android/i.test(ua)) {
                rootEl.classList.add('platform-android');
            } else if (/(iPhone|iPad|iPod)/i.test(ua)) {
                rootEl.classList.add('platform-ios');
            }
        }
    } catch (_) { /* no-op */ }

    // Post-load handler availability check
    setTimeout(() => {
        console.log('🔎 Post-load handler check:', {
            onMouseMove: typeof onMouseMove,
            onMouseDown: typeof onMouseDown,
            onTouchStart: typeof onTouchStart,
            onTouchMove: typeof onTouchMove,
            onTouchEnd: typeof onTouchEnd,
            handleCanvasClick: typeof handleCanvasClick,
            onResize: typeof onResize
        });
    }, 1500);
    // Açılışta otomatik interstitial devre dışı (policy-safe)
    // Not: Açılışta reklam gösterimi, geçersiz trafik riskini artırır. Sadece doğal duraklarda tetiklenecek.
    
    try {
        // Capacitor should be globally available from Capacitor bridge
        if (typeof window.Capacitor === 'undefined') {
            console.warn('⚠️ Capacitor not found, trying dynamic import...');
            // Try dynamic import as fallback
            const { Capacitor: CapacitorImport } = await import('@capacitor/core');
            window.Capacitor = CapacitorImport;
        }
        
        const Capacitor = window.Capacitor;
        
        // Setup AdMob Plugin for native platform
        if (Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
            console.log('🔄 Native platform detected, setting up ad networks...');
            
            const platform = Capacitor.getPlatform ? Capacitor.getPlatform() : 'web';
            
            // ℹ️ Unity Ads projeden tamamen kaldırıldı (native SDK, pod, gradle ve
            // plugin dahil). Buradaki init bloğu ölü koddu ve her açılışta
            // "Unity Ads Capacitor Plugin not found" uyarıları basıyordu -> kaldırıldı.
            // NOT: Uygulamada hâlâ Unity reklamı görünüyorsa, bu AdMob panelindeki
            // (admob.google.com) MEDIATION grubundan gelir; sunucu tarafı ayardır.
            console.log('📺 [INIT] AdMob: tek reklam ağı');
            
            // AdMob'u fallback olarak işaretle
            AD_MEDIATION.markAvailable('admob', true);
            
            // 🎯 ADMOB INITIALIZATION (FALLBACK AD NETWORK)
            console.log('🔄 Initializing AdMob as fallback...');
            // iOS: Request App Tracking Transparency before any ad activity
            try {
                if (platform === 'ios') {
                    // Use global AdMob reference instead of import
                    if (!AdMob) {
                        try {
                            const { AdMob: ImportedAdMob } = await import('@capacitor-community/admob');
                            AdMob = ImportedAdMob;
                        } catch (e) {
                            console.warn('⚠️ AdMob import failed:', e);
                        }
                    }
                    
                    // Global ATT request function
                    window.requestATTPermission = async () => {
                        try {
                            console.log('🚀 FORCING ATT permission request...');
                            const beforeStatus = await AdMob.trackingAuthorizationStatus();
                            console.log('� ATT Status before request:', beforeStatus.status);
                            
                            if (beforeStatus.status === 'notDetermined') {
                                console.log('⏳ Requesting ATT permission now...');
                                await AdMob.requestTrackingAuthorization();
                                
                                // Wait a moment then check again
                                setTimeout(async () => {
                                    const afterStatus = await AdMob.trackingAuthorizationStatus();
                                    console.log('✅ ATT Status after request:', afterStatus.status);
                                }, 1000);
                            } else {
                                console.log('ℹ️ ATT already determined:', beforeStatus.status);
                            }
                        } catch (e) {
                            console.error('❌ ATT request error:', e);
                        }
                    };
                    
                    // ATT request - Required by Apple Review Guidelines
                    // Request immediately when app loads
                    try { 
                        await window.requestATTPermission(); 
                    } catch(e) {
                        console.warn('⚠️ ATT request failed:', e);
                    }
                    
                    // Initialize AdMob after ATT attempt
                    try {
                        await AdMob.initialize({ 
                            initializeForTesting: ADMOB_CONFIG.testMode,
                            tagForChildDirectedTreatment: false,
                            tagForUnderAgeOfConsent: false,
                            maxAdContentRating: 'General'
                        });
                        const modeText = ADMOB_CONFIG.testMode ? 'TEST MODE' : 'PRODUCTION MODE';
                        console.log(`✅ AdMob initialized successfully (${modeText})`);
                        
                        // Mark AdMob as available in mediation system
                        AD_MEDIATION.markAvailable('admob', true);
                        
                        // iOS Simulator için test cihazı yapılandırması
                        const isSimulator = navigator.userAgent.includes('iPhone Simulator') || 
                                          navigator.userAgent.includes('iPad Simulator') ||
                                          navigator.userAgent.includes('iPod Simulator');
                        
                        if (isSimulator) {
                            // iOS Simulatörler otomatik test cihazı olarak tanınır
                            console.log('📱 iOS Simulator tespit edildi - Test reklamları aktif');
                        }
                        
                        // 🚀 SAFE: Reklamları ÖNCEDEN hazırla (non-blocking, gecikmeli)
                        // Böylece butona basıldığında reklam anında açılır.
                        // Hem interstitial hem rewarded (powerball "reklam izle") ön yüklenir.
                        setTimeout(() => {
                            preloadAd('interstitial').then(ok => {
                                if (ok) interstitialAdLoaded = true;
                            }).catch(() => {});
                        }, 4000); // WebView hazır olsun diye gecikme
                        setTimeout(() => {
                            preloadAd('rewarded').catch(() => {});
                        }, 6000); // rewarded'ı biraz sonra hazırla (ağı tıkamasın)
                    } catch (e) {
                        console.warn('⚠️ AdMob initialization warning:', e);
                        AD_MEDIATION.logError('admob', e);
                        AD_MEDIATION.markAvailable('admob', false);
                    }
                    
                    // Debug helpers
                    window.debugATT = async () => {
                        const st = await AdMob.trackingAuthorizationStatus();
                        console.log('Debug ATT Status:', st.status);
                        alert('ATT Status: ' + st.status);
                    };
                    
                    window.forceATT = window.requestATTPermission;
                }
            } catch (e) {
                console.warn('⚠️ ATT/AdMob setup failed:', e);
            }

            // ATT TRIGGERS DISABLED - prevents repeated popups
            // Multiple fallback triggers for ATT
            if (false && Capacitor.getPlatform() === 'ios') {
                const triggerATT = async () => {
                    try {
                        if (window.requestATTPermission) {
                            console.log('🔁 Fallback ATT trigger');
                            await window.requestATTPermission();
                        }
                    } catch (e) {
                        console.warn('Fallback ATT failed:', e);
                    }
                };
                
                // Trigger on various events
                setTimeout(triggerATT, 2000); // 2 seconds after load
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden) triggerATT();
                });
                window.addEventListener('focus', triggerATT);
                ['touchstart', 'pointerdown', 'click'].forEach(evt => {
                    document.addEventListener(evt, triggerATT, { once: true });
                });
            }
            
            // AndroidBridge ile native metodları çağır
            window.AdMobPlugin = {
                showSplashAd: async () => {
                    // Devre dışı: Splash sırasında interstitial tetiklenmeyecek
                    console.log('ℹ️ showSplashAd çağrısı politika gereği devre dışı');
                    return;
                },

                // 🎯 UNIFIED INTERSTITIAL AD - Unity Primary, AdMob Fallback
                showInterstitialAd: async () => {
                    try {
                        console.log('🚀 [INTERSTITIAL] ==================== START (MEDIATION) ====================');
                        
                        // Use the new mediation system
                        return await AD_MEDIATION.showAdWithFallback('interstitial');
                        
                    } catch (error) {
                        console.error('❌ [INTERSTITIAL] Failed to show interstitial:', error);
                        // Fallback to old system if mediation fails
                        try {
                            const activeNetwork = AD_MEDIATION.getActiveNetwork('interstitial');
                        
                        if (activeNetwork === 'unity') {
                                // Unity Ads Interstitial - Native SDK
                            try {
                                const platform = window.Capacitor?.getPlatform?.();
                                    const placementId = UNITY_ADS_CONFIG.getPlacementId('interstitial', platform);
                                
                                    console.log(`📺 [UNITY] Showing interstitial: ${placementId}`);
                                
                                // Call native Unity Ads bridge
                                if (window.UnityAdsBridge) {
                                        await window.UnityAdsBridge.showInterstitial(placementId);
                                        console.log('✅ [UNITY] Interstitial shown successfully');
                                } else {
                                    throw new Error('Unity Ads Bridge not available');
                                }
                                
                                return;
                            } catch (error) {
                                    console.error('❌ [UNITY] Interstitial failed:', error);
                                AD_MEDIATION.logError('unity', error);
                                // Fall through to AdMob
                            }
                        }
                        
                            // AdMob Fallback
                            if (activeNetwork === 'admob' || !activeNetwork) {
                                if (window.AndroidBridge) {
                                    window.AndroidBridge.showInterstitialAd();
                                    console.log('✅ [ADMOB] Interstitial call sent (Android native)');
                                } else if (AdMob) {
                                    const platform = window.Capacitor?.getPlatform?.();
                                    const adId = ADMOB_CONFIG.getAdId('interstitial', platform);
                                    const isTesting = ADMOB_CONFIG.testMode;
                                    
                                    await AdMob.showInterstitial({
                                        adId: adId,
                                        isTesting: isTesting
                                    });
                                    console.log('✅ [ADMOB] Interstitial shown');
                                } else {
                                    console.warn('⚠️ No ad network available for interstitial');
                                }
                            }
                        } catch (fallbackError) {
                            console.error('❌ [INTERSTITIAL] Fallback also failed:', fallbackError);
                        }
                    }
                },
                
                // 🎯 UNIFIED REWARDED AD - Unity Primary, AdMob Fallback
                showRewardedAd: async (onRewarded) => {
                    try {
                        console.log('🎁 [REWARDED] ==================== START (MEDIATION) ====================');
                        console.log('🎁 [REWARDED] Callback available:', !!onRewarded);
                        console.log('🎁 [REWARDED] AD_MEDIATION available:', !!AD_MEDIATION);
                        console.log('🎁 [REWARDED] showAdWithFallback available:', !!AD_MEDIATION.showAdWithFallback);
                        
                        // Use the new mediation system
                        const result = await AD_MEDIATION.showAdWithFallback('rewarded', { onRewarded });
                        console.log('🎁 [REWARDED] Mediation result:', result);
                        
                        // Check if user completed the ad
                        if (result && result.rewarded) {
                            console.log('✅ [REWARDED] Ad completed - user gets reward');
                            if (onRewarded && typeof onRewarded === 'function') {
                                console.log('🎁 [REWARDED] Calling reward callback...');
                                onRewarded();
                            }
                        } else {
                            console.log('ℹ️ [REWARDED] Ad not completed - no reward');
                        }
                        
                        return result;
                        
                    } catch (error) {
                        console.error('❌ [REWARDED] Failed to show rewarded ad:', error);
                        console.error('❌ [REWARDED] Error details:', error.message, error.stack);
                        // Fallback to old system if mediation fails
                        try {
                            const activeNetwork = AD_MEDIATION.getActiveNetwork('rewarded');
                            
                            if (activeNetwork === 'unity') {
                                // Unity Ads Rewarded - Native SDK
                                try {
                                    const platform = window.Capacitor?.getPlatform?.();
                                    const placementId = UNITY_ADS_CONFIG.getPlacementId('rewarded', platform);
                                    
                                    console.log(`🎁 [UNITY] Showing rewarded: ${placementId}`);
                                    
                                    // Call native Unity Ads bridge
                                    if (window.UnityAdsBridge) {
                                        const result = await window.UnityAdsBridge.showRewarded(placementId);
                                        
                                        // Check if user completed the ad
                                        if (result && result.rewarded) {
                                            console.log('✅ [UNITY] Rewarded ad completed - user gets reward');
                                            if (onRewarded && typeof onRewarded === 'function') {
                                                onRewarded();
                                            }
                                        } else {
                                            console.log('ℹ️ [UNITY] Rewarded ad not completed - no reward');
                                        }
                                    } else {
                                        throw new Error('Unity Ads Bridge not available');
                                    }
                                    
                                    return;
                                } catch (error) {
                                    console.error('❌ [UNITY] Rewarded ad failed:', error);
                                    AD_MEDIATION.logError('unity', error);
                                    // Fall through to AdMob
                                }
                            }
                            
                            // AdMob Fallback
                            if (activeNetwork === 'admob' || !activeNetwork) {
                                if (AdMob) {
                                    const platform = window.Capacitor?.getPlatform?.();
                                    const adId = ADMOB_CONFIG.getAdId('rewarded', platform);
                                    const isTesting = ADMOB_CONFIG.testMode;

                                    // ÖNEMLİ: gerçek metod isimleri prepareRewardVideoAd/
                                    // showRewardVideoAd'dir (showRewardedVideo eklentide yok).
                                    await AdMob.prepareRewardVideoAd({
                                        adId: adId,
                                        isTesting: isTesting
                                    });
                                    const result = await AdMob.showRewardVideoAd();

                                    if (result) {
                                        console.log('✅ [ADMOB] Rewarded ad completed');
                                        if (onRewarded && typeof onRewarded === 'function') {
                                            onRewarded();
                                        }
                                    }
                                } else {
                                    console.warn('⚠️ No ad network available for rewarded ad');
                                }
                            }
                        } catch (fallbackError) {
                            console.error('❌ [REWARDED] Fallback also failed:', fallbackError);
                        }
                    }
                }
            };
            
            // Local değişkene de ata
            AdMobPlugin = window.AdMobPlugin;
            
            // Plugin yüklendi mesajı
            console.log('🧪 AdMob plugin yüklendi');
            console.log('✅ AdMob plugin test successful!');
        } else {
            console.log('AdMob Plugin sadece native platformlarda çalışır');
        }
        
        // Hide status bar for full screen experience
        await StatusBar.hide();
        
        // HEMEN native splash screen'i gizle (custom splash için)
        console.log('🚀 Native splash screen hemen gizleniyor...');
        await SplashScreen.hide();
        
        // Custom splash screen DOM'da zaten başlayacak
        console.log('✅ Native splash gizlendi, custom splash başlayabilir');

        // Hızlı teşhis için global debug fonksiyonu
        window.debugAdEnv = async () => {
            try {
                const { Device } = await import('@capacitor/device');
                const { Network } = await import('@capacitor/network');
                const di = await Device.getInfo();
                const ns = await Network.getStatus();
                const msg = `Platform: ${window.Capacitor?.getPlatform?.()}
isVirtual: ${di?.isVirtual}
Model: ${di?.model}
OS: ${di?.operatingSystem} ${di?.osVersion}
Network: ${ns?.connected ? 'Connected' : 'Disconnected'} (${ns?.connectionType})`;
                console.log('[AdDebug]\n' + msg);
                alert(msg);
            } catch (e) {
                console.log('debugAdEnv error', e);
                alert('debugAdEnv error: ' + e.message);
            }
        };
        
    } catch (error) {
        console.log('Capacitor plugins not available:', error);
    }
});

// Balon Patlatma Oyunu
// Profesyonel kodlama kalitesi ile yazılmıştır.
// Herhangi bir kullanıcı verisi toplanmaz veya saklanmaz.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 🔥 Canvas context loss protection - reklam sonrası context kaybına karşı
canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    console.warn('⚠️ [CANVAS] WebGL context lost! (reklam sonrası olası)');
});

canvas.addEventListener('webglcontextrestored', () => {
    console.log('✅ [CANVAS] WebGL context restored!');
    // Context restore sonrası yeniden boyutlandır ve çiz
    if (typeof onResize === 'function') onResize();
    if (gameState === 'playing' || gameState === 'ready') {
        requestAnimationFrame(gameLoop);
    }
});

// 2D context kontrolü
if (!ctx) {
    console.error('❌ Canvas 2D context alınamadı!');
} else {
    console.log('✅ Canvas 2D context hazır');
}

// --- OYUN AYARLARI ---
// Ekran boyutuna göre dinamik balon ve grid ayarları
// --- BORDER CONSTANTS ---
// NOT: Bu sabitler calculateGameDimensions()'ın ÜSTÜNDE tanımlı olmak ZORUNDA.
// Grid geometrisi FRAME_PADDING'i yan boşluk olarak kullanıyor ve
// calculateGameDimensions modül yüklenirken (const gameDimensions = ...) hemen
// çağrılıyor. Aşağıda tanımlı kalsalardı 'Cannot access before initialization'
// (temporal dead zone) hatası tüm app.js'in çalışmasını durdururdu.
const BORDER_THICKNESS = 6;               // drawBorder line width
const FRAME_PADDING   = BORDER_THICKNESS + 2; // ekstra tampon (= 8)

function calculateGameDimensions() {
    const screenWidth = window.innerWidth || 800;
    const screenHeight = window.innerHeight || 600;
    
    // 🎯 GEOMETRİ: yarıçap SÜTUN SAYISINDAN türetilir (tersi değil).
    // Grid'in gerçek genişliği hex kaydırması dahil R*(2*COLS+1)'dir. Sütun
    // sayısı hedef balon çapından seçilip yarıçap bu genişliğe göre çözülünce:
    //   - iki yan boşluk BİREBİR eşit olur (asimetri biter)
    //   - artan ölü boşluk en aza iner (grid ekranı doldurur)
    //   - grid asla ekrandan taşmaz (sağ kenarda gizli top olmaz)
    // Eskiden R sabit bir yüzdeden geliyor, sütunlar "sığdığı kadar" seçiliyor
    // ve 30-40px artan boşluk kullanılmadan kalıyordu.
    const SIDE = FRAME_PADDING;                        // topun sekme sınırıyla aynı hiza
    const available = Math.max(80, screenWidth - 2 * SIDE);

    // Hedef balon çapı (telefonda iri, tablette orantılı olarak daha büyük)
    let targetDiameter = 40;
    if (screenWidth >= 1000) targetDiameter = 56;
    else if (screenWidth >= 768) targetDiameter = 52;

    // R*(2C+1) = available ve 2R ≈ targetDiameter  ->  C = (available/R - 1)/2
    let cols = Math.round((available / (targetDiameter / 2) - 1) / 2);
    cols = Math.max(7, Math.min(18, cols));

    // Tam sayı yarıçap: sprite'lar keskin kalsın (drawPlainBubbleCached yarıçapı
    // yuvarlıyor). Artan birkaç piksel gridOffsetX'te simetrik dağıtılır.
    const radius = Math.max(12, Math.floor(available / (2 * cols + 1)));

    // Satır sayısı ekran yüksekliğine göre (nihai yarıçapa göre)
    const rows = Math.floor((screenHeight * 0.4) / (radius * 1.732)); // Ekranın üst %40'ı
    const safeRows = Math.max(8, Math.min(18, rows));

    return {
        radius: radius,
        rows: safeRows,
        cols: cols
    };
}

const gameDimensions = calculateGameDimensions();
let COLS = gameDimensions.cols;
let ROWS = gameDimensions.rows;
let BUBBLE_RADIUS = gameDimensions.radius;
let ROW_HEIGHT = BUBBLE_RADIUS * 1.732; // Yükseklik için 2 * sin(60)

// NOT: Resize listener kaldırıldı - onResize() içinde zaten calculateGameDimensions() çağrılıyor
// Bu gereksiz duplicate listener ekran titremesine neden oluyordu
const COLORS = { // Modern neon renkler
    blue:   '#00D4FF', // Neon mavi
    yellow: '#FFE53B', // Neon sarı
    red:    '#FF1744', // Neon kırmızı
    green:  '#00E676', // Neon yeşil
    purple: '#D500F9', // Neon mor
    orange: '#FF9100'  // Neon turuncu
};

// 🎨 LEVEL PATTERN SİSTEMİ - Her bölümde farklı şekil dizilişi
const LEVEL_PATTERNS = {
    // Pattern türleri
    PYRAMID_UP: 'pyramid_up',       // Yukarı bakan piramit
    PYRAMID_DOWN: 'pyramid_down',   // Aşağı bakan piramit
    DIAMOND: 'diamond',             // Elmas (baklava)
    HEART: 'heart',                 // Kalp
    STAR: 'star',                   // Yıldız
    V_SHAPE: 'v_shape',             // V şekli
    WAVE: 'wave',                   // Dalga
    ARROW_DOWN: 'arrow_down',       // Aşağı ok
    CIRCLE: 'circle',               // Daire
    CROSS: 'cross'                  // Artı işareti
};

// Renk sırası (level bazlı döngü)
const COLOR_CYCLE = ['blue', 'green', 'yellow', 'red', 'purple', 'orange'];

// Pattern sırası (level bazlı döngü)
const PATTERN_CYCLE = [
    LEVEL_PATTERNS.PYRAMID_DOWN,
    LEVEL_PATTERNS.DIAMOND,
    LEVEL_PATTERNS.HEART,
    LEVEL_PATTERNS.STAR,
    LEVEL_PATTERNS.V_SHAPE,
    LEVEL_PATTERNS.WAVE,
    LEVEL_PATTERNS.ARROW_DOWN,
    LEVEL_PATTERNS.CIRCLE,
    LEVEL_PATTERNS.CROSS,
    LEVEL_PATTERNS.PYRAMID_UP
];

// Level için pattern ve renk belirle
function getLevelPatternInfo(level) {
    const patternIndex = (level - 1) % PATTERN_CYCLE.length;
    const colorIndex = (level - 1) % COLOR_CYCLE.length;
    
    return {
        pattern: PATTERN_CYCLE[patternIndex],
        mainColorName: COLOR_CYCLE[colorIndex],
        mainColor: COLORS[COLOR_CYCLE[colorIndex]]
    };
}

// Şekil hücrelerini hesapla
function calculateShapeCells(pattern, rows, cols, centerCol) {
    const shapeCells = new Set();
    
    switch(pattern) {
        case LEVEL_PATTERNS.PYRAMID_DOWN:
            // Aşağı bakan piramit - üstte geniş, aşağı daralır
            for (let row = 0; row < rows; row++) {
                const halfWidth = Math.max(0, Math.floor((rows - 1 - row) / 1.5) + 1);
                for (let col = Math.max(1, centerCol - halfWidth); col <= Math.min(cols - 1, centerCol + halfWidth); col++) {
                    shapeCells.add(`${row},${col}`);
                }
            }
            break;
            
        case LEVEL_PATTERNS.PYRAMID_UP:
            // Yukarı bakan piramit - üstte dar, aşağı genişler
            for (let row = 0; row < rows; row++) {
                const halfWidth = Math.min(Math.floor(row / 1.5) + 1, Math.floor(cols / 3));
                for (let col = Math.max(1, centerCol - halfWidth); col <= Math.min(cols - 1, centerCol + halfWidth); col++) {
                    shapeCells.add(`${row},${col}`);
                }
            }
            break;
            
        case LEVEL_PATTERNS.DIAMOND:
            // Elmas şekli - ortada geniş, kenarlarda dar
            const diamondCenterRow = Math.floor(rows / 2);
            const maxHalfWidth = Math.floor(cols / 4);
            for (let row = 0; row < rows; row++) {
                const distFromCenter = Math.abs(row - diamondCenterRow);
                const halfWidth = Math.max(0, maxHalfWidth - distFromCenter);
                for (let col = Math.max(1, centerCol - halfWidth); col <= Math.min(cols - 1, centerCol + halfWidth); col++) {
                    shapeCells.add(`${row},${col}`);
                }
            }
            break;
            
        case LEVEL_PATTERNS.HEART:
            // Kalp şekli
            const heartPattern = [
                '  XX XX  ',
                ' XXXXXXX ',
                'XXXXXXXXX',
                'XXXXXXXXX',
                ' XXXXXXX ',
                '  XXXXX  ',
                '   XXX   ',
                '    X    '
            ];
            const heartStartCol = Math.max(1, centerCol - 4);
            for (let rowIdx = 0; rowIdx < Math.min(heartPattern.length, rows); rowIdx++) {
                const patternRow = heartPattern[rowIdx];
                for (let colOffset = 0; colOffset < patternRow.length; colOffset++) {
                    if (patternRow[colOffset] === 'X') {
                        const col = heartStartCol + colOffset;
                        if (col >= 1 && col < cols) {
                            shapeCells.add(`${rowIdx},${col}`);
                        }
                    }
                }
            }
            break;
            
        case LEVEL_PATTERNS.STAR:
            // Yıldız şekli
            const starPattern = [
                '    X    ',
                '   XXX   ',
                'XXXXXXXXX',
                ' XXXXXXX ',
                '  XXXXX  ',
                ' XXX XXX ',
                ' XX   XX ',
                'XX     XX'
            ];
            const starStartCol = Math.max(1, centerCol - 4);
            for (let rowIdx = 0; rowIdx < Math.min(starPattern.length, rows); rowIdx++) {
                const patternRow = starPattern[rowIdx];
                for (let colOffset = 0; colOffset < patternRow.length; colOffset++) {
                    if (patternRow[colOffset] === 'X') {
                        const col = starStartCol + colOffset;
                        if (col >= 1 && col < cols) {
                            shapeCells.add(`${rowIdx},${col}`);
                        }
                    }
                }
            }
            break;
            
        case LEVEL_PATTERNS.V_SHAPE:
            // V şekli - kuş kanadı
            for (let row = 0; row < rows; row++) {
                const leftCol = Math.max(1, centerCol - row);
                const rightCol = Math.min(cols - 1, centerCol + row);
                // Sol kol
                for (let c = leftCol; c <= Math.min(leftCol + 1, cols - 1); c++) {
                    shapeCells.add(`${row},${c}`);
                }
                // Sağ kol
                for (let c = Math.max(1, rightCol - 1); c <= rightCol; c++) {
                    shapeCells.add(`${row},${c}`);
                }
            }
            break;
            
        case LEVEL_PATTERNS.WAVE:
            // Dalga şekli - sinüs dalgası
            for (let row = 0; row < rows; row++) {
                const waveOffset = Math.floor(2 * Math.sin(row * 0.8));
                const waveCenter = centerCol + waveOffset;
                const waveWidth = 2;
                for (let col = Math.max(1, waveCenter - waveWidth); col <= Math.min(cols - 1, waveCenter + waveWidth); col++) {
                    shapeCells.add(`${row},${col}`);
                }
            }
            break;
            
        case LEVEL_PATTERNS.ARROW_DOWN:
            // Aşağı ok şekli
            for (let row = 0; row < rows; row++) {
                // Ok gövdesi (ortada dikey çizgi)
                if (row < rows - 3) {
                    for (let c = centerCol - 1; c <= centerCol + 1; c++) {
                        if (c >= 1 && c < cols) shapeCells.add(`${row},${c}`);
                    }
                }
                // Ok başı (altta genişleyen üçgen)
                if (row >= rows - 4) {
                    const arrowRow = row - (rows - 4);
                    const halfWidth = arrowRow + 1;
                    for (let col = Math.max(1, centerCol - halfWidth); col <= Math.min(cols - 1, centerCol + halfWidth); col++) {
                        shapeCells.add(`${row},${col}`);
                    }
                }
            }
            break;
            
        case LEVEL_PATTERNS.CIRCLE:
            // Daire şekli
            const circleCenterRow = Math.floor(rows / 2);
            const radius = Math.min(Math.floor(rows / 2) - 1, Math.floor(cols / 4));
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const dy = row - circleCenterRow;
                    const dx = col - centerCol;
                    if (Math.sqrt(dx * dx + dy * dy) <= radius) {
                        shapeCells.add(`${row},${col}`);
                    }
                }
            }
            break;
            
        case LEVEL_PATTERNS.CROSS:
            // Artı işareti
            for (let row = 0; row < rows; row++) {
                // Yatay çizgi (ortada)
                if (row >= Math.floor(rows / 2) - 1 && row <= Math.floor(rows / 2) + 1) {
                    for (let col = Math.max(1, centerCol - 3); col <= Math.min(cols - 1, centerCol + 3); col++) {
                        shapeCells.add(`${row},${col}`);
                    }
                }
                // Dikey çizgi
                for (let col = centerCol - 1; col <= centerCol + 1; col++) {
                    if (col >= 1 && col < cols) {
                        shapeCells.add(`${row},${col}`);
                    }
                }
            }
            break;
    }
    
    return shapeCells;
}

// Level için pattern'li grid oluştur
function createPatternGrid(level, rows, cols) {
    const patternInfo = getLevelPatternInfo(level);
    const centerCol = Math.floor(cols / 2);
    const shapeCells = calculateShapeCells(patternInfo.pattern, rows, cols, centerCol);
    
    console.log(`🎨 Level ${level}: Pattern=${patternInfo.pattern}, MainColor=${patternInfo.mainColorName}, ShapeCells=${shapeCells.size}`);
    
    const newGrid = [];
    for (let r = 0; r < ROWS; r++) {
        newGrid[r] = new Array(COLS).fill(null);
    }
    
    // Grid'i doldur
    for (let r = 0; r < rows; r++) {
        // 0. sütun DAHİL: eski geometride 'cols' bir fazla hesaplanıp
        // (floor(...)+1) en soldaki sütun kasten boş bırakılıyordu. COLS artık
        // gerçekten sığan sütun sayısı olduğu için c=1'den başlamak soldaki
        // sütunu ölü boşluğa çeviriyor ve grid sağa kaymış görünüyordu.
        for (let c = 0; c < cols; c++) {
            const cellKey = `${r},${c}`;
            if (shapeCells.has(cellKey)) {
                // Şekil içi - ana renk
                newGrid[r][c] = { color: patternInfo.mainColor, type: 'normal' };
            } else {
                // Şekil dışı - rastgele renk (ana renk HARİÇ)
                newGrid[r][c] = { color: getRandomColorExcept(patternInfo.mainColorName), type: 'normal' };
            }
        }
    }
    
    return newGrid;
}

// Belirli renk hariç rastgele renk seç
function getRandomColorExcept(excludeColorName) {
    const availableColors = Object.keys(COLORS).filter(c => c !== excludeColorName);
    const randomColorName = availableColors[Math.floor(Math.random() * availableColors.length)];
    return COLORS[randomColorName];
}

// Lightweight debug switches to silence noisy logs in production.
const DEBUG_FLAGS = Object.freeze({
    touch: false,
    clicks: false,
    ads: false,
    gameplay: false,
    stats: false,
    haptics: false,
    system: false,
    // Ölçüm olaylarını konsola yazdırır (popgo-analytics.js). Üretimde kapalı;
    // gerçek cihazda doğrulama için Firebase DebugView tercih edilir.
    analytics: false
});

const ORIGINAL_CONSOLE = {
    log: console.log.bind(console),
    info: console.info ? console.info.bind(console) : null
};

const debugLog = (flag, ...args) => {
    if (DEBUG_FLAGS[flag]) {
        ORIGINAL_CONSOLE.log(...args);
    }
};

console.log = (...args) => {
    if (DEBUG_FLAGS.system) {
        ORIGINAL_CONSOLE.log(...args);
    }
};

if (ORIGINAL_CONSOLE.info) {
    console.info = (...args) => {
        if (DEBUG_FLAGS.system) {
            ORIGINAL_CONSOLE.info(...args);
        }
    };
}

// --- BAŞARILAR SİSTEMİ ---
const ACHIEVEMENTS = {
    'first_shot': { name: 'İlk Atış', description: 'İlk balonu patlattın!', unlocked: false },
    'big_cluster': { name: 'Büyük Patlama', description: '5+ balon aynı anda patladı!', unlocked: false },
    'combo_master': { name: 'Kombo Ustası', description: '5x kombo yaptın!', unlocked: false },
    'level_complete': { name: 'Seviye Tamamı', description: 'Bir seviyeyi tamamladın!', unlocked: false },
    'milestone': { name: 'Kilometre Taşı', description: '5\'in katı seviyeye ulaştın!', unlocked: false },
    'power_collector': { name: 'Güç Toplayıcısı', description: '10 güç balonu kullandın!', unlocked: false },
    'sharpshooter': { name: 'Keskin Nişancı', description: '90% isabetli atış!', unlocked: false },
    'speedster': { name: 'Hızlı Oyuncu', description: 'Bir seviyeyi 60 saniyede bitirdin!', unlocked: false }
};

// === HIZ AYARLARI ===
// Simplified speed settings for stable performance
const SHOOTER_SPEED = 3000; // Base shooting speed
const AIM_DOTS = 25;
const BUCKET_SCORES = [100, 250, 500, 250, 100];
const GRAVITY = 1200; // Base gravity
const SHIFT_THRESHOLD = 5; // Üst üste 5 başarısız atışta ızgara aşağı kayar
const POWERUP_PROB = 0.15;  // %15 ihtimalle güç balonu

// --- STABILIZED FRAME TIMING ---
// Simplified frame timing to prevent speed fluctuations
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS; // 16.67ms per frame
let lastFrameTime = 0;
let deltaTime = 1/60; // Simple delta time, no smoothing
let realDeltaTime = 1/60; // Kısıtlanmamış gerçek kare süresi (mermi hareketi için)
let _shotAccumulator = 0; // Sabit-adım fizik birikimcisi (mermi)
let _fallAccumulator = 0; // Sabit-adım fizik birikimcisi (düşen toplar)
let gameLoopRunning = false; // Prevent multiple game loops

// Simplified speed multipliers
let CURRENT_SHOOTER_SPEED = SHOOTER_SPEED;
let CURRENT_GRAVITY = GRAVITY;

// Mouse/Touch koordinatları (GLOBAL)
let mouseX = 0;
let mouseY = 0;

// Hız takip değişkenleri
let lastCursorTime = 0;
let lastCursorX = 0;
let lastCursorY = 0;
let speedLogInterval = 0;

// iOS çentik/Dynamic Island yüksekliğini (env(safe-area-inset-top)) JS'ten oku.
// Android'de 0 döner -> davranış değişmez. Sabit 53px'lik gridOffsetY bu alanı
// hesaba katmadığı için iPhone'da grid'in 0. sırası saat/wifi ikonlarının ve
// Dynamic Island'ın ALTINDA kalıyordu (içerik "yukarı kaymış" görünüyordu).
// Değer resize başına bir kez ölçülür, cache'lenir.
let _safeAreaTopCache = null;
function getSafeAreaTop() {
    if (_safeAreaTopCache !== null) return _safeAreaTopCache;
    let v = 0;
    try {
        const probe = document.createElement('div');
        probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;' +
            'padding-top:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none;';
        document.body.appendChild(probe);
        v = parseFloat(getComputedStyle(probe).paddingTop) || 0;
        probe.remove();
    } catch (_) { v = 0; }
    _safeAreaTopCache = Math.max(0, Math.min(80, Math.round(v)));
    return _safeAreaTopCache;
}

// Grid ÇİZİM ofsetleri. Grid dizisini (COLS/satırlar) DEĞİŞTİRMEZ, yalnızca
// nereye çizileceğini belirler -> her an güvenle yeniden hesaplanabilir.
// Eskiden bunlar SADECE onResize'ın normal yolunda hesaplanıyordu; oyun
// oynanırken o yol bloklandığı için (early return) reklam sonrası resume veya
// WebView reload'unda bir daha hesaplanmıyordu. Üstüne getSafeAreaTop() layout
// hazır olmadan ölçülürse 0 dönüyor ve gridOffsetY 53'te kalıyordu ->
// grid'in ilk sırası iOS çentiğinin/Dynamic Island'ın altında kalıyordu.
function recomputeGridOffsets(reason) {
    try {
        _safeAreaTopCache = null; // her seferinde yeniden ölç (nadiren çağrılır)
        const safeTop = getSafeAreaTop();
        gridOffsetY = FRAME_PADDING + 45 + safeTop;

        // Grid'in gerçek sınırları (getBubbleCoords'a göre):
        //   sol kenar  = gridOffsetX - R          (çift satır, c=0)
        //   sağ kenar  = gridOffsetX + COLS*2R    (tek satır, c=COLS-1, +R kayma)
        //   genişlik   = COLS*2R + R = R*(2*COLS+1)
        // Ortalamak için sol kenar (lw - genişlik)/2 olmalı -> gridOffsetX buna
        // R eklenerek bulunur. Eskiden '+ hexOffset/2' yazıyordu; bu yüzden grid
        // yarım balon (R/2) sola kaçıktı ve yanlar asimetrik görünüyordu.
        const gridW = COLS * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS;
        gridOffsetX = Math.round((logicalWidth - gridW) / 2 + BUBBLE_RADIUS);
    } catch (_) {}
}

// --- YENİ POWERUP TİPLERİ ---
const POWERUP_TYPES = {
    BOMB: 'bomb',
    LASER: 'laser', 
    VERTICAL_LASER: 'verticalLaser',
    RAINBOW: 'rainbow',
    FIREBALL: 'fireball',
    FREEZE: 'freeze'
};

const BOMB_COLOR  = '#FF1744';    // Neon kırmızı bomba
const LASER_COLOR = '#00D4FF';    // Neon mavi lazer (yatay)
const VERTICAL_LASER_COLOR = '#00eaff'; // Cyan/mavi ton (dikey)
const RAINBOW_COLOR = '#D500F9';  // Neon mor gökkuşağı
const FIREBALL_COLOR = '#FF9100'; // Neon turuncu ateş topu

// BOTTOM_MARGIN - Sabit değer (tüm koşullarda 150 döndürüyordu, gereksiz hesaplama kaldırıldı)
// NOT: Resize listener kaldırıldı - onResize() içinde BOTTOM_MARGIN zaten güncelleniyor
const BOTTOM_MARGIN_DEFAULT = 150;
let BOTTOM_MARGIN = BOTTOM_MARGIN_DEFAULT;

// .power-ball-bar (DOM) canvas'ın ALT kısmını kapatıyor: 'position: fixed;
// bottom: 0'. Canvas artık tüm viewport'u kapladığı için alta yaslı çizimlerin
// (shooter, zemin, kovalar, LEVEL/SKOR) bu barın ÜSTÜNDE kalması gerekiyor;
// aksi halde barın arkasına girip görünmez oluyorlar. Barın gerçek yüksekliğini
// DOM'dan ölç -> CSS değişirse otomatik uyum sağlar.
function getPowerBarHeight() {
    try {
        const pb = document.getElementById('powerBallBar');
        if (pb) {
            const h = Math.round(pb.getBoundingClientRect().height);
            if (h > 10 && h < 300) return h;
        }
    } catch (_) {}
    return 80; // CSS varsayılanı (.power-ball-bar height: 80px)
}

// --- 🌌 NEBULA + YÜZEN PARÇACIKLAR ARKA PLAN SİSTEMİ ---

// Nebula bulutları - yavaş hareket eden renkli bulutlar
const nebulaClouds = [];
const NEBULA_COUNT = 5;

function initNebulaClouds() {
    nebulaClouds.length = 0;
    for (let i = 0; i < NEBULA_COUNT; i++) {
        nebulaClouds.push({
            x: Math.random() * (logicalWidth || 800),
            y: Math.random() * (logicalHeight || 600),
            radius: 100 + Math.random() * 150,
            color: getNebulaColor(i),
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.2,
            opacity: 0.08 + Math.random() * 0.07,
            pulseSpeed: 0.5 + Math.random() * 0.5,
            pulsePhase: Math.random() * Math.PI * 2
        });
    }
}

function getNebulaColor(index) {
    const colors = [
        { r: 138, g: 43, b: 226 },   // Mor (BlueViolet)
        { r: 0, g: 191, b: 255 },    // Açık mavi (DeepSkyBlue)
        { r: 255, g: 20, b: 147 },   // Pembe (DeepPink)
        { r: 0, g: 206, b: 209 },    // Turkuaz (DarkTurquoise)
        { r: 255, g: 140, b: 0 }     // Turuncu (DarkOrange)
    ];
    return colors[index % colors.length];
}

// Yüzen parçacıklar - farklı yönlerde hareket eden küçük ışıklar
const floatingParticles = [];
const FLOATING_PARTICLE_COUNT = 25;

function initFloatingParticles() {
    floatingParticles.length = 0;
    for (let i = 0; i < FLOATING_PARTICLE_COUNT; i++) {
        floatingParticles.push(createFloatingParticle());
    }
}

function createFloatingParticle() {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.2 + Math.random() * 0.4;
    return {
        x: Math.random() * (logicalWidth || 800),
        y: Math.random() * (logicalHeight || 600),
        size: 1 + Math.random() * 2.5,
        opacity: 0.3 + Math.random() * 0.4,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        color: getParticleColor(),
        life: 1,
        maxLife: 1
    };
}

function getParticleColor() {
    const colors = ['#00D4FF', '#D500F9', '#FFE53B', '#00E676', '#FF9100', '#FFFFFF'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Arka plan sistemini başlat
function initBackgroundSystem() {
    initNebulaClouds();
    initFloatingParticles();
    console.log('🌌 Nebula + Parçacık arka plan sistemi başlatıldı');
}

// Nebula bulutlarını güncelle ve çiz
function updateAndDrawNebula() {
    const currentTime = Date.now() / 1000;
    
    nebulaClouds.forEach(cloud => {
        // Hareket
        cloud.x += cloud.speedX;
        cloud.y += cloud.speedY;
        
        // Ekran sınırlarında wrap-around
        if (cloud.x < -cloud.radius) cloud.x = logicalWidth + cloud.radius;
        if (cloud.x > logicalWidth + cloud.radius) cloud.x = -cloud.radius;
        if (cloud.y < -cloud.radius) cloud.y = logicalHeight + cloud.radius;
        if (cloud.y > logicalHeight + cloud.radius) cloud.y = -cloud.radius;
        
        // Nabız efekti (boyut değişimi)
        const pulse = Math.sin(currentTime * cloud.pulseSpeed + cloud.pulsePhase) * 0.15 + 1;
        const currentRadius = cloud.radius * pulse;
        
        // Radyal gradient ile bulut çizimi
        const gradient = ctx.createRadialGradient(
            cloud.x, cloud.y, 0,
            cloud.x, cloud.y, currentRadius
        );
        
        const { r, g, b } = cloud.color;
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${cloud.opacity})`);
        gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${cloud.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Yüzen parçacıkları güncelle ve çiz
function updateAndDrawFloatingParticles() {
    floatingParticles.forEach((p, index) => {
        // Hareket
        p.x += p.speedX;
        p.y += p.speedY;
        
        // Ekran dışına çıkınca yeniden oluştur
        if (p.x < -10 || p.x > logicalWidth + 10 || 
            p.y < -10 || p.y > logicalHeight + 10) {
            // Ekranın kenarından yeniden gir
            const side = Math.floor(Math.random() * 4);
            if (side === 0) { p.x = -5; p.y = Math.random() * logicalHeight; }
            else if (side === 1) { p.x = logicalWidth + 5; p.y = Math.random() * logicalHeight; }
            else if (side === 2) { p.x = Math.random() * logicalWidth; p.y = -5; }
            else { p.x = Math.random() * logicalWidth; p.y = logicalHeight + 5; }
            
            // Yeni yön ve renk
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.2 + Math.random() * 0.4;
            p.speedX = Math.cos(angle) * speed;
            p.speedY = Math.sin(angle) * speed;
            p.color = getParticleColor();
            p.opacity = 0.3 + Math.random() * 0.4;
        }
        
        // Parçacık çizimi - yumuşak glow efekti
        ctx.save();
        ctx.globalAlpha = p.opacity;
        
        // Glow
        const glowGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        glowGradient.addColorStop(0, p.color);
        glowGradient.addColorStop(0.3, p.color);
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Merkez nokta
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
}

// Tüm arka planı çiz
function drawAnimatedBackground() {
    // Koyu gradient arka plan
    const bgGradient = ctx.createLinearGradient(0, 0, 0, logicalHeight);
    bgGradient.addColorStop(0, '#0a0a1a');      // Üst - çok koyu mavi
    bgGradient.addColorStop(0.5, '#12122a');    // Orta - koyu mor-mavi
    bgGradient.addColorStop(1, '#0a0a1a');      // Alt - çok koyu mavi
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    
    // Nebula bulutları
    updateAndDrawNebula();
    
    // Yüzen parçacıklar
    updateAndDrawFloatingParticles();
}

// Eski stars dizisi - uyumluluk için tutuyoruz ama kullanmıyoruz
const stars = [];
for (let i = 0; i < 50; i++) {
    stars.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01
    });
}

// --- POWER-UP AÇIKLAMALARI ---
const POWERUP_DESCRIPTIONS = {
    [POWERUP_TYPES.BOMB]: {
        title: '💥 Bomba',
        description: 'Çevresindeki 8 balonu patlatır'
    },
    [POWERUP_TYPES.LASER]: {
        title: '⚡ Lazer',
        description: 'Düz çizgide tüm balonları patlatır'
    },
    [POWERUP_TYPES.RAINBOW]: {
        title: '🌈 Gökkuşağı',
        description: 'Herhangi bir renkle eşleşir'
    },
    [POWERUP_TYPES.FIREBALL]: {
        title: '🔥 Ateş Topu',
        description: 'Rotası boyunca tüm topları düşürür!'
    },
    [POWERUP_TYPES.VERTICAL_LASER]: {
        title: '⚡ Dikey Lazer',
        description: 'Dikey sütundaki 2 sütunu temizler'
    },
    [POWERUP_TYPES.FREEZE]: {
        title: '❄️ Dondurucu',
        description: '3 saniye yavaş hareket modu'
    }
};

// --- SES SİSTEMİ ---
// Debug mute flag to silence audio on emulators or when host has no audio device
const __DEBUG_MUTE_KEY = 'popgo_debugMuteAudio';
window.__debugMuteAudio = (localStorage.getItem(__DEBUG_MUTE_KEY) === 'true');
window.setDebugMuteAudio = (flag) => {
    const on = !!flag;
    window.__debugMuteAudio = on;
    try { localStorage.setItem(__DEBUG_MUTE_KEY, String(on)); } catch(_) {}
    try { if (on) { bgmManager?.setEnabled(false); } } catch(_) {}
    console.log(`[AUDIO] Debug mute set to ${on}`);
};
class SoundManager {
    constructor() {
        this.sounds = {};
        this.soundVolume = 0.7;
        this.musicVolume = 0.5;
        this.audioContext = null;
    this.lastHapticTime = 0;
    this.hapticCooldownMs = 50; // Reduced cooldown for better throttling
        this.hapticsDisabled = false; // Flag to disable haptics on problematic devices
        this.loadSounds();
    }

    async loadSounds() {
        // Web Audio API kullanarak gerçekçi ses efektleri oluştur
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Ses efektlerini oluştur
            this.sounds = {
                pop: () => this.createBubblePopSound(),
                shoot: () => this.createShootSound(),
                combo: () => this.createComboSound(),
                powerup: () => this.createPowerupSound(),
                explosion: () => this.createExplosionSound(),
                achievement: () => this.createAchievementSound(),
                gameOver: () => this.createGameOverSound(),
                levelUp: () => this.createLevelUpSound()
            };
        } catch (e) {
            console.warn('Web Audio API desteklenmiyor:', e);
            this.createFallbackSounds();
        }
    }

    createBubblePopSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(this.soundVolume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.type = 'sine';
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    createShootSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(this.soundVolume * 0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        
        oscillator.type = 'square';
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    createComboSound() {
        if (!this.audioContext) return;
        
        const frequencies = [523, 659, 784]; // C, E, G majör akor
        frequencies.forEach((freq, i) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * 0.1);
            gainNode.gain.setValueAtTime(this.soundVolume * 0.15, this.audioContext.currentTime + i * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.3);
            
            oscillator.type = 'triangle';
            oscillator.start(this.audioContext.currentTime + i * 0.1);
            oscillator.stop(this.audioContext.currentTime + i * 0.1 + 0.3);
        });
    }

    createPowerupSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(this.soundVolume * 0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.type = 'sawtooth';
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    createExplosionSound() {
        if (!this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.setValueAtTime(this.soundVolume * 0.5, this.audioContext.currentTime);
        
        source.start();
    }

    createAchievementSound() {
        if (!this.audioContext) return;
        
        const frequencies = [523, 659, 784, 1047]; // C major arpeggio
        frequencies.forEach((freq, i) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * 0.15);
            gainNode.gain.setValueAtTime(this.soundVolume * 0.3, this.audioContext.currentTime + i * 0.15);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.15 + 0.4);
            
            oscillator.type = 'sine';
            oscillator.start(this.audioContext.currentTime + i * 0.15);
            oscillator.stop(this.audioContext.currentTime + i * 0.15 + 0.4);
        });
    }

    createGameOverSound() {
        if (!this.audioContext) return;
        
        const frequencies = [523, 493, 466, 440]; // Descending sad melody
        frequencies.forEach((freq, i) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * 0.3);
            gainNode.gain.setValueAtTime(this.soundVolume * 0.4, this.audioContext.currentTime + i * 0.3);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.3 + 0.6);
            
            oscillator.type = 'triangle';
            oscillator.start(this.audioContext.currentTime + i * 0.3);
            oscillator.stop(this.audioContext.currentTime + i * 0.3 + 0.6);
        });
    }

    createLevelUpSound() {
        if (!this.audioContext) return;
        
        const frequencies = [440, 554, 659, 880]; // Ascending melody
        frequencies.forEach((freq, i) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + i * 0.1);
            gainNode.gain.setValueAtTime(this.soundVolume * 0.3, this.audioContext.currentTime + i * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.4);
            
            oscillator.type = 'sine';
            oscillator.start(this.audioContext.currentTime + i * 0.1);
            oscillator.stop(this.audioContext.currentTime + i * 0.1 + 0.4);
        });
    }

    createFallbackSounds() {
        // Web Audio API desteklenmiyorsa basit sesler
        this.sounds = {
            pop: () => console.log('🎵 Pop!'),
            shoot: () => console.log('🎵 Shoot!'),
            combo: () => console.log('🎵 Combo!'),
            powerup: () => console.log('🎵 PowerUp!'),
            explosion: () => console.log('🎵 Explosion!'),
            achievement: () => console.log('🎵 Achievement!'),
            gameOver: () => console.log('🎵 Game Over!'),
            levelUp: () => console.log('🎵 Level Up!')
        };
    }

    play(soundName) {
        if (window.__debugMuteAudio) { return; }
        if (this.sounds[soundName] && typeof this.sounds[soundName] === 'function') {
            this.sounds[soundName]();
        }
        
        // Enhanced Vibration support with Capacitor Haptics
        this.playVibration(soundName);
    }
    
    async playVibration(soundName) {
        try {
            // 🚫 CRITICAL: Check if haptics are globally disabled first
            if (this.hapticsDisabled) {
                return;
            }

            // 🎯 iOS Simulator Detection - EARLY CHECK
            const userAgent = navigator.userAgent || '';
            const isIOSSimulator = userAgent.includes('Simulator') || 
                                   userAgent.includes('x86_64') ||
                                   userAgent.includes('iPhone Simulator') ||
                                   userAgent.includes('iPad Simulator');
            
            if (isIOSSimulator) {
                if (!this.hapticsDisabled) {
                    console.warn('🚫 Haptics DISABLED on iOS Simulator (prevents crashes)');
                    this.hapticsDisabled = true;
                }
                return; // Exit immediately on simulator
            }

            const vibrationCheckbox = document.getElementById('vibrationEnabled');
            const isVibrationEnabled = vibrationCheckbox ? vibrationCheckbox.checked : 
                localStorage.getItem('popgo_vibration') !== 'false';
            const now = (typeof performance !== 'undefined' && performance.now)
                ? performance.now()
                : Date.now();

            if (now - this.lastHapticTime < this.hapticCooldownMs) {
                debugLog('haptics', `⏱️ Haptic skipped (cooldown) for: ${soundName}`);
                return;
            }
            
            if (!isVibrationEnabled) {
                debugLog('haptics', '❌ Vibration disabled by user');
                return;
            }
            
            // Try Capacitor Haptics first (for native apps)
            if (window.Capacitor?.Plugins?.Haptics) {
                debugLog('haptics', '📳 Using Capacitor Haptics API for:', soundName);
                
                const { Haptics } = window.Capacitor.Plugins;
                
                const hapticPatterns = {
                    pop: () => Haptics.impact({ style: 'LIGHT' }),
                    shoot: () => Haptics.impact({ style: 'LIGHT' }),
                    score: () => Haptics.impact({ style: 'LIGHT' }),
                    bounce: () => Haptics.impact({ style: 'MEDIUM' }),
                    combo: async () => {
                        await Haptics.impact({ style: 'MEDIUM' });
                        await new Promise(resolve => setTimeout(resolve, 100));
                        await Haptics.impact({ style: 'LIGHT' });
                        await new Promise(resolve => setTimeout(resolve, 100));
                        await Haptics.impact({ style: 'MEDIUM' });
                    },
                    powerup: () => Haptics.impact({ style: 'HEAVY' }),
                    explosion: () => Haptics.impact({ style: 'HEAVY' }),
                    achievement: async () => {
                        for (let i = 0; i < 3; i++) {
                            await Haptics.impact({ style: 'MEDIUM' });
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    },
                    gameOver: () => Haptics.impact({ style: 'HEAVY' }),
                    levelUp: async () => {
                        await Haptics.impact({ style: 'HEAVY' });
                        await new Promise(resolve => setTimeout(resolve, 100));
                        await Haptics.impact({ style: 'LIGHT' });
                        await new Promise(resolve => setTimeout(resolve, 100));
                        await Haptics.impact({ style: 'HEAVY' });
                    }
                };
                
                if (hapticPatterns[soundName]) {
                    this.lastHapticTime = now;
                    await hapticPatterns[soundName]();
                    debugLog('haptics', '✅ Capacitor haptic feedback sent for:', soundName);
                } else {
                    debugLog('haptics', '⚠️ No haptic pattern for sound:', soundName);
                }
            }
            // Fallback to navigator.vibrate for web
            else if (navigator.vibrate) {
                debugLog('haptics', '📳 Using navigator.vibrate for:', soundName);
                
                const vibrationPatterns = {
                    pop: [30],
                    shoot: [20],
                    combo: [50, 30, 50],
                    powerup: [100],
                    explosion: [200],
                    achievement: [50, 50, 50, 50],
                    gameOver: [500],
                    levelUp: [100, 50, 100]
                };
                
                if (vibrationPatterns[soundName]) {
                    debugLog('haptics', '📳 Vibrating with pattern:', vibrationPatterns[soundName]);
                    this.lastHapticTime = now;
                    navigator.vibrate(vibrationPatterns[soundName]);
                } else {
                    debugLog('haptics', '⚠️ No vibration pattern for sound:', soundName);
                }
            } else {
                debugLog('haptics', '❌ No vibration API available');
            }
        } catch (error) {
            console.error('❌ Vibration error:', error);
            console.error('❌ Vibration error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            // iOS Simulator'da vibrasyon desteklenmez - sessizce devam et
            if (error.message && error.message.includes('not supported')) {
                debugLog('haptics', 'ℹ️ Vibration not supported on this device - continuing without vibration');
            }
        }
    }

    setSoundVolume(volume) {
        this.soundVolume = volume / 100;
    }

    setMusicVolume(volume) {
        this.musicVolume = volume / 100;
    }
}

// Global ses yöneticisi
const soundManager = new SoundManager();

// --- ARKA PLAN MÜZİK YÖNETİCİSİ ---
class BgmManager {
    constructor(soundMgr) {
        this.soundMgr = soundMgr;
        this.ctx = null;
        this.gain = null;
        this.source = null;
        this.buffer = null;
        this.enabled = JSON.parse(localStorage.getItem('popgo_musicEnabled') ?? 'true');
        // Varsayılan %25 ses
        const stored = localStorage.getItem('popgo_musicVolume');
        this.baseVolume = ((stored ? Number(stored) : 25) / 100);
        console.log('[BGM] Manager created', { enabled: this.enabled, baseVolume: this.baseVolume });
    }

    getContext() {
        if (this.ctx) return this.ctx;
        this.ctx = this.soundMgr.audioContext || new (window.AudioContext || window.webkitAudioContext)();
        if (!this.soundMgr.audioContext) this.soundMgr.audioContext = this.ctx;
        this.gain = this.ctx.createGain();
        this.gain.gain.value = this.baseVolume;
        this.gain.connect(this.ctx.destination);
        console.log('[BGM] getContext()', { state: this.ctx.state });
        return this.ctx;
    }

    async loadOnce(url = 'arkaplan.mp3') {
        if (this.buffer) return;
        const ctx = this.getContext();
        console.log('[BGM] loadOnce() fetching', url);
        try {
            const res = await fetch(url);
            const arr = await res.arrayBuffer();
            this.buffer = await ctx.decodeAudioData(arr);
            console.log('[BGM] decode success', { duration: this.buffer.duration });
        } catch (e) {
            console.error('[BGM] load/decode failed', e);
            throw e;
        }
    }

    play() {
        if (window.__debugMuteAudio) { console.warn('[BGM] muted by debug flag'); return; }
        if (!this.enabled || !this.buffer) return;
        const ctx = this.getContext();
        if (this.source) {
            try { this.source.stop(); } catch (e) {}
        }
        this.source = ctx.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.loop = true; // Seamless loop
        this.source.playbackRate.value = 0.8; // Normal hız
        this.source.connect(this.gain);
        this.source.start(0);
        console.log('[BGM] play()', { rate: this.source.playbackRate.value, enabled: this.enabled, ctxState: ctx.state });
    }

    async ensureStarted() {
        console.log('[BGM] ensureStarted()');
        if (window.__debugMuteAudio) { console.warn('[BGM] ensureStarted skipped (debug mute)'); return; }
        await this.loadOnce();
        const ctx = this.getContext();
        if (ctx.state === 'suspended') { try { await ctx.resume(); console.log('[BGM] context resumed'); } catch (e) { console.warn('[BGM] resume failed', e); } }
        if (this.enabled) { this.play(); } else { console.log('[BGM] not playing, disabled'); }
    }

    setEnabled(flag) {
        this.enabled = !!flag;
        localStorage.setItem('popgo_musicEnabled', JSON.stringify(this.enabled));
        if (this.enabled) {
            this.ensureStarted();
        } else {
            try { this.source?.stop(); } catch (e) {}
        }
        this.updateButtonUI();
        console.log('[BGM] setEnabled', { enabled: this.enabled });
    }

    setVolume(percent) {
        const pct = Math.max(0, Math.min(100, Number(percent)));
        this.baseVolume = pct / 100;
        localStorage.setItem('popgo_musicVolume', String(pct));
        if (this.gain && this.ctx) {
            this.gain.gain.setTargetAtTime(this.baseVolume, this.ctx.currentTime, 0.01);
        }
        console.log('[BGM] setVolume', { percent: pct });
    }

    updateIntensity(ratio) {
        // Dinamik hız değişimi devre dışı
        return;
    }

    createButton() {
        // Artık ayrı bir buton oluşturmuyoruz; ayarlar menüsü kullanılacak
        return;
    }

    updateButtonUI() {
        // UI güncellemesi ayarlar menüsündeki slider üzerinden yapılır
    }
}

const bgmManager = new BgmManager(soundManager);
// Konsolda hata ayıklamak için global erişim
window.bgmManager = bgmManager;
console.log('[BGM] window.bgmManager hazır');

// İlk kullanıcı etkileşiminde BGM başlat
// İlk kullanıcı etkileşiminde hızlı başlat (click/touch/mouse/keydown)
const startBgmOnce = async () => {
    console.log('[BGM] Unlock attempt via user gesture');
    try { await bgmManager.ensureStarted(); } catch (e) { console.warn('[BGM] ensureStarted error after gesture', e); }
    window.removeEventListener('pointerdown', startBgmOnce, true);
    window.removeEventListener('keydown', startBgmOnce, true);
    window.removeEventListener('mousedown', startBgmOnce, true);
    window.removeEventListener('touchstart', startBgmOnce, true);
};
// Not: Artık startGame içinde otomatik başlatıyoruz; aşağıdaki tetikleyiciler sadece yedek
window.addEventListener('pointerdown', startBgmOnce, true);
window.addEventListener('keydown', startBgmOnce, true);
window.addEventListener('mousedown', startBgmOnce, true);
window.addEventListener('touchstart', startBgmOnce, true);

// Sekme görünürlüğü değişince performans için suspend/resume
document.addEventListener('visibilitychange', async () => {
    const ctx = bgmManager.getContext();
    
    if (document.hidden) {
        // Uygulama arka plana gitti
        if (ctx) {
            try { await ctx.suspend(); } catch (e) {}
        }
    } else {
        // 🔥 Uygulama ön plana geldi - REKLAM SONRASI RESTORE!
        console.log('👁️ [VISIBILITY] App became visible, checking ad state...');
        console.log('👁️ [VISIBILITY] _isAdCurrentlyShowing:', _isAdCurrentlyShowing);
        
        // Reklam gösteriliyordu, şimdi görünür olduk = reklam kapandı
        if (_isAdCurrentlyShowing) {
            console.log('🔄 [VISIBILITY] Ad was showing, restoring state...');
            setTimeout(() => {
                if (typeof restoreGameStateAfterAd === 'function') {
                    restoreGameStateAfterAd();
                    console.log('✅ [VISIBILITY] State restored after ad via visibilitychange');
                }
            }, 200);
        }
        
        // BGM resume
        if (ctx && bgmManager.enabled) {
            try { await ctx.resume(); } catch (e) {}
        }
    }
});

// --- YENİ OYUN MODLARı ---
const GAME_MODES = {
    CLASSIC: 'classic',
    STRATEGY: 'strategy', 
    ARCADE: 'arcade',
    SURVIVAL: 'survival'
};

// Oyun Durumu Değişkenleri
let grid = [];
let currentBubble, nextBubble;
let fallingBubbles = [];
let buckets = [];
let score = 0;
let gameState = 'idle'; // idle, playing, gameover, win
let logicalWidth, logicalHeight;
let gridOffsetX, gridOffsetY, shooterX, shooterY;

// Normalized speed system - independent of screen size
const BASE_SCREEN_WIDTH = 800; // Reference screen width
let screenSpeedFactor = 1; // Will be calculated based on screen size
let STABLE_SPEED_MULTIPLIER = 1; // Screen-based speed normalization multiplier

let combo = 1;
let shotsSinceShift = 0;
let aimPath = [];
let aimDotOffset = 0;
let aimDotFrame = 0;
const aimDotSpeed = 1; // Deprecated: kept for backward-compat (no longer frame-based)
// Aim dots animation is now time-based for consistent speed across FPS
let aimDotOffsetFloat = 0; // fractional offset accumulator
const AIM_DOT_SHIFT_PER_SEC = 60; // shift rate equivalent to 1 step per 1/60s
const AIM_DOT_SPACING = 5; // Dot spacing used both for draw and the independent animator

// Simplified aim animation - integrated with game loop
let aimAnimationRunning = false;
let aimAnimationStartTime = 0;

function startAimAnimation() {
    if (!aimAnimationRunning) {
        console.log('🎯 AIM ANIMATION: Starting (integrated with game loop)');
        aimAnimationRunning = true;
        aimAnimationStartTime = performance.now();
    }
}

function stopAimAnimation() {
    console.log('🛑 AIM ANIMATION: Stopping');
    aimAnimationRunning = false;
}

// Update aim animation within game loop (no separate RAF)
function updateAimAnimation(currentTime) {
    if (!aimAnimationRunning) return;
    
    const elapsedSeconds = (currentTime - aimAnimationStartTime) / 1000;
    const totalShift = elapsedSeconds * AIM_DOT_SHIFT_PER_SEC;
    aimDotOffset = Math.floor(totalShift) % AIM_DOT_SPACING;
    aimDotOffsetFloat = totalShift % 1;
}
let streakCount = 0; // Art arda başarılı atış sayısı
let lavaStock = 0;   // Elde edilen lava balonu sayısı

// --- YENİ OYUN SİSTEMLERİ ---
let currentLevel = 1;
    // --- GEÇİŞ REKLAMI SAYAÇLARI --- 
let interstitialAdCounter = 0;
let interstitialAdLoaded = false;
let gameMode = GAME_MODES.CLASSIC;
let shotsRemaining = 60; // Strategy mode için
let timeRemaining = 300; // Arcade mode için (saniye)
let gameStartTime = 0;
let particles = []; // Particle effects
let floatingScores = []; // Yüzen skor popupları için havuz
const MAX_PARTICLES = 25; // 🔥 FURTHER REDUCED: 50 -> 25 for optimal performance  
const MAX_FLOATING_SCORES = 5; // Maksimum yüzen skor limiti (reduced)
let achievements = []; // Başarılar
let playerCoins = 0; // Oyuncu coinleri
let currentChapter = 'chapter1'; // Sabit klasik mod
let dailyLoginStreak = 0; // Günlük giriş serisi
let unlockedChapters = ['chapter1'];
let dailyLoginData = {
    currentStreak: 0,
    lastLoginDate: null,
    totalLogins: 0,
    claimedRewards: []
};
let adManager = null; // Başlangıçta null, sonra initialize edilecek
let powerUpStock = {
    bomb: 1,         // Başlangıçta 1 bomba
    laser: 1,        // Başlangıçta 1 lazer (yatay)
    rainbow: 1,      // Başlangıçta 1 gökkuşağı
    fireball: 1,     // Başlangıçta 1 ateş topu
    verticalLaser: 1, // Başlangıçta 1 dikey lazer
    freeze: 1        // Başlangıçta 1 dondurucu
};
// Alt barda çizilen power-up ikonlarının tıklama bölgeleri
let bottomPowerUpIconHitboxes = [];
let freezeTimeLeft = 0; // Freeze power-up süresi
let multishot = 1; // Multi-shot powerup
let isSlowMotion = false;
let slowMotionTimeLeft = 0;
let hasClaimedChestReward = false; // Level sonrası sandık ödülü alındı mı?
let canContinueWithAd = false; // Reklam izleyerek devam edilebilir mi?
let savedGameState = null; // Oyun durumu kaydı (devam etmek için)
// Çarpışma sonrası doğru yuvaya yerleştirmek için ipucu
let lastCollisionHint = null; // { r, c, dirX, dirY }
// UI güncellemelerini pahalı DOM yazımlarından korumak için throttle
let uiLastUpdateTime = 0; // ms cinsinden animation frame time
function ensureGridRow(rowIndex) {
    if (rowIndex < 0) rowIndex = 0;
    if (rowIndex >= ROWS) rowIndex = ROWS - 1;
    if (!grid[rowIndex] || !Array.isArray(grid[rowIndex])) {
        grid[rowIndex] = new Array(COLS).fill(null);
        grid[rowIndex].parity = rowIndex % 2; // Yeni oluşturulan satır, o anki index'in hizasını alır
    } else if (grid[rowIndex].length < COLS) {
        grid[rowIndex].length = COLS;
        for (let i = 0; i < COLS; i++) {
            if (typeof grid[rowIndex][i] === 'undefined') {
                grid[rowIndex][i] = null;
            }
        }
    }
    if (typeof grid[rowIndex].parity !== 'number') grid[rowIndex].parity = rowIndex % 2;
    return grid[rowIndex];
}

// --- TOOLTIP SİSTEMİ ---
let tooltipVisible = false;
let tooltipTimeout = null;
const tooltipElement = document.getElementById('powerupTooltip');
const tooltipTitle = document.getElementById('tooltipTitle');
const tooltipDescription = document.getElementById('tooltipDescription');

// --- İLERLEME KAYIT SİSTEMİ ---
let playerStats = {
    totalScore: 0,
    highScore: 0,
    maxLevel: 1,
    totalGamesPlayed: 0,
    totalBubblesPopped: 0,
    totalPowerUpsUsed: 0,
    averageAccuracy: 0,
    totalPlayTime: 0,
    favoriteGameMode: GAME_MODES.CLASSIC,
    achievements: {},
    dailyStreak: 0,
    lastPlayDate: null,
    levelsCompleted: {
        classic: 0,
        strategy: 0,
        arcade: 0
    }
};

// Local Storage anahtarları
const STORAGE_KEYS = {
    PLAYER_STATS: 'bubbleGame_playerStats',
    POWERUP_STOCK: 'bubbleGame_powerUpStock',
    GAME_SETTINGS: 'bubbleGame_settings',
    ACHIEVEMENTS: 'bubbleGame_achievements'
};

// --- VERİ KAYIT/YÜKLEME SİSTEMİ ---
// 🔥 PERFORMANCE: Throttle localStorage writes to prevent slowdown
let lastSaveTime = 0;
let pendingSave = false;
const SAVE_THROTTLE_MS = 2000; // Save at most once every 2 seconds

function savePlayerStats() {
    try {
        const now = Date.now();
        
        // If recently saved, schedule a delayed save instead
        if (now - lastSaveTime < SAVE_THROTTLE_MS) {
            if (!pendingSave) {
                pendingSave = true;
                setTimeout(() => {
                    localStorage.setItem(STORAGE_KEYS.PLAYER_STATS, JSON.stringify(playerStats));
                    lastSaveTime = Date.now();
                    pendingSave = false;
                    debugLog('stats', '📊 İstatistikler kaydedildi (throttled):', playerStats);
                }, SAVE_THROTTLE_MS - (now - lastSaveTime));
            }
            return;
        }
        
        // Save immediately if enough time has passed
        localStorage.setItem(STORAGE_KEYS.PLAYER_STATS, JSON.stringify(playerStats));
        lastSaveTime = now;
        debugLog('stats', '📊 İstatistikler kaydedildi:', playerStats);
    } catch (error) {
        console.error('❌ İstatistik kaydetme hatası:', error);
    }
}

function loadPlayerStats() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.PLAYER_STATS);
        if (saved) {
            const loadedStats = JSON.parse(saved);
            // Mevcut playerStats'a yükle, eksik alanları koru
            Object.assign(playerStats, loadedStats);
            debugLog('stats', '📊 İstatistikler yüklendi:', playerStats);
            return true;
        }
    } catch (error) {
        console.error('❌ İstatistik yükleme hatası:', error);
    }
    return false;
}

function savePowerUpStock() {
    try {
        localStorage.setItem(STORAGE_KEYS.POWERUP_STOCK, JSON.stringify(powerUpStock));
        debugLog('stats', '⚡ Power-up stoğu kaydedildi:', powerUpStock);
    } catch (error) {
        console.error('❌ Power-up kaydetme hatası:', error);
    }
}

function loadPowerUpStock() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.POWERUP_STOCK);
        if (saved) {
            const loadedStock = JSON.parse(saved);
            Object.assign(powerUpStock, loadedStock);
            debugLog('stats', '⚡ Power-up stoğu yüklendi:', powerUpStock);
            updatePowerUpDisplay();
            return true;
        }
    } catch (error) {
        console.error('❌ Power-up yükleme hatası:', error);
    }
    return false;
}

function updatePlayerStats(updates) {
    Object.assign(playerStats, updates);
    savePlayerStats();
}

function addPowerUp(type, amount = 1) {
    console.log(`⚡ [addPowerUp] BAŞLANGIÇ: type=${type}, amount=${amount}, mevcut=${powerUpStock[type]}`);
    if (powerUpStock.hasOwnProperty(type)) {
        powerUpStock[type] += amount;
        console.log(`✅ [addPowerUp] Stok güncellendi: ${type}=${powerUpStock[type]}`);
        savePowerUpStock();
        // Güvenli updatePowerUpDisplay çağrısı
        setTimeout(() => {
            try {
                updatePowerUpDisplay?.();
            } catch (e) {
                console.warn('Power-up display update deferred');
            }
        }, 10);
        // Power Ball Bar'ı güncelle
        console.log(`🔄 [addPowerUp] syncPowerBallBar çağrılıyor...`);
        if (typeof syncPowerBallBar === 'function') {
            syncPowerBallBar();
        } else {
            console.error(`❌ [addPowerUp] syncPowerBallBar bulunamadı!`);
        }
        debugLog('stats', `⚡ ${type} power-up +${amount}, toplam: ${powerUpStock[type]}`);
    } else {
        console.warn(`⚠️ [addPowerUp] Geçersiz tip: ${type}`);
    }
}

function usePowerUp(type) {
    if (powerUpStock[type] > 0) {
        powerUpStock[type]--;
        savePowerUpStock();
        // Güvenli updatePowerUpDisplay çağrısı
        setTimeout(() => {
            try {
                updatePowerUpDisplay?.();
            } catch (e) {
                console.warn('Power-up display update deferred');
            }
        }, 10);
        // Power Ball Bar'ı güncelle
        if (typeof syncPowerBallBar === 'function') {
            syncPowerBallBar();
        }
        console.log(`⚡ ${type} power-up kullanıldı, kalan: ${powerUpStock[type]}`);
        return true;
    }
    return false;
}

// DOM Elementleri
const scoreSpan = document.getElementById('score');
const startBtn = document.getElementById('startButton');
const restartBtn = document.getElementById('restartButton');
const endScreen = document.getElementById('endScreen');
const endTitle = document.getElementById('endTitle');
const endSubtitle = document.getElementById('endSubtitle');
const endRestartButton = document.getElementById('endRestartButton');
const statsModal = document.getElementById('statsModal');
const statsDetails = document.getElementById('statsDetails');
const exportDataButton = document.getElementById('exportDataButton');
const resetDataButton = document.getElementById('resetDataButton');
const closeStatsButton = document.getElementById('closeStatsButton');

// --- OLAY DİNLEYİCİLER ---
// Oyun modu seçimi
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        // Enhanced vibration with Capacitor Haptics
        try {
            const vibrationCheckbox = document.getElementById('vibrationEnabled');
            const isVibrationEnabled = vibrationCheckbox ? vibrationCheckbox.checked : 
                localStorage.getItem('popgo_vibration') !== 'false';
            
            if (isVibrationEnabled) {
                // Try Capacitor Haptics first
                if (window.Capacitor?.Plugins?.Haptics) {
                    const { Haptics } = window.Capacitor.Plugins;
                    await Haptics.impact({ style: 'LIGHT' });
                    console.log('📳 Mode button haptic feedback (Capacitor)');
                } else if (navigator.vibrate) {
                    navigator.vibrate([30]);
                    console.log('📳 Mode button vibration (navigator)');
                }
            }
        } catch (error) {
            console.error('❌ Mode button vibration error:', error);
        }
        
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameMode = btn.dataset.mode;
    });
});

startBtn.addEventListener('click', async () => {
    // Enhanced vibration with Capacitor Haptics
    try {
        const vibrationCheckbox = document.getElementById('vibrationEnabled');
        const isVibrationEnabled = vibrationCheckbox ? vibrationCheckbox.checked : 
            localStorage.getItem('popgo_vibration') !== 'false';
        
        if (isVibrationEnabled) {
            // Try Capacitor Haptics first
            if (window.Capacitor?.Plugins?.Haptics) {
                const { Haptics } = window.Capacitor.Plugins;
                await Haptics.impact({ style: 'MEDIUM' });
                setTimeout(() => Haptics.impact({ style: 'LIGHT' }), 100);
                setTimeout(() => Haptics.impact({ style: 'MEDIUM' }), 200);
                console.log('📳 Start button haptic feedback (Capacitor)');
            } else if (navigator.vibrate) {
                navigator.vibrate([60, 30, 60]);
                console.log('📳 Start button vibration (navigator)');
            }
        }
    } catch (error) {
        console.error('❌ Start button vibration error:', error);
    }
    
    document.getElementById('startScreen').style.display = 'none';
    try { window.forceUnblockOverlays?.(); } catch(_) {}
    // Auto-unblock geçici olarak devre dışı
    // try { window.startAutoUnblock?.(); } catch(_) {}
    
    // Hamburger menüyü göster
    const gameHUD = document.getElementById('gameHUD');
    if (gameHUD) {
        gameHUD.style.display = 'block';
    }
    
    startGame(true); // true = fresh start from main menu
    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
});

restartBtn.addEventListener('click', async () => {
    // Enhanced vibration with Capacitor Haptics
    try {
        const vibrationCheckbox = document.getElementById('vibrationEnabled');
        const isVibrationEnabled = vibrationCheckbox ? vibrationCheckbox.checked : 
            localStorage.getItem('popgo_vibration') !== 'false';
        
        if (isVibrationEnabled) {
            // Try Capacitor Haptics first
            if (window.Capacitor?.Plugins?.Haptics) {
                const { Haptics } = window.Capacitor.Plugins;
                await Haptics.impact({ style: 'HEAVY' });
                console.log('📳 Restart button haptic feedback (Capacitor)');
            } else if (navigator.vibrate) {
                navigator.vibrate([80]);
                console.log('📳 Restart button vibration (navigator)');
            }
        }
    } catch (error) {
        console.error('❌ Restart button vibration error:', error);
    }
    
    // Hamburger menüyü göster
    const gameHUD = document.getElementById('gameHUD');
    if (gameHUD) {
        gameHUD.style.display = 'block';
    }
    
    restartGame();
    restartBtn.style.display = 'none';
});

endRestartButton.addEventListener('click', async () => {
    try { console.log('👉 endRestartButton clicked'); } catch (_) {}
    // Enhanced vibration with Capacitor Haptics
    try {
        const vibrationCheckbox = document.getElementById('vibrationEnabled');
        const isVibrationEnabled = vibrationCheckbox ? vibrationCheckbox.checked : 
            localStorage.getItem('popgo_vibration') !== 'false';
        
        if (isVibrationEnabled) {
            // Try Capacitor Haptics first
            if (window.Capacitor?.Plugins?.Haptics) {
                const { Haptics } = window.Capacitor.Plugins;
                await Haptics.impact({ style: 'MEDIUM' });
                setTimeout(() => Haptics.impact({ style: 'LIGHT' }), 100);
                setTimeout(() => Haptics.impact({ style: 'MEDIUM' }), 200);
                console.log('📳 End restart button haptic feedback (Capacitor)');
            } else if (navigator.vibrate) {
                navigator.vibrate([60, 30, 60]);
                console.log('📳 End restart button vibration (navigator)');
            }
        }
    } catch (error) {
        console.error('❌ End restart button vibration error:', error);
    }

    // Bu buton seviyeyi BAŞTAN başlatmalı; kaldığı yerden devam ETMEMELİ.
    // Devam akışını devre dışı bırak ve tam yeniden başlat.
    try { savedGameState = null; } catch (_) {}
    try { canContinueWithAd = false; } catch (_) {}
    try { currentBubble = null; nextBubble = null; } catch (_) {}
    
    // Oyun sonu ekranını güvenli kapat ve tam sıfırlama ile başlat
    try {
        window.__suppressAdsOnce = true;   // Reklam akışlarını bastır
        window.__fastRestartOnce = true;   // Hızlı temiz başlangıç
        restartGame();                     // currentLevel korunur, level baştan kurulur
    } catch (e) {
        console.error('❌ restartGame hata verdi, fallback startGame çalıştırılıyor:', e);
        try { forceHideEndScreen(); } catch (_) {}
        try { gameState = 'idle'; } catch (_) {}
        window.__suppressAdsOnce = true;
        window.__fastRestartOnce = true;
        startGame();
    }
});

// Menü butonları için event listener'lar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 DOMContentLoaded - Hamburger menü başlatılıyor...');
    
    // Titreşim test fonksiyonu - Capacitor Haptics desteği ile
    async function testVibration(pattern = [50]) {
        try {
            const vibrationCheckbox = document.getElementById('vibrationEnabled');
            const isVibrationEnabled = vibrationCheckbox ? vibrationCheckbox.checked : 
                localStorage.getItem('popgo_vibration') !== 'false';
            
            if (!isVibrationEnabled) {
                console.log('❌ Menu vibration disabled by user');
                return false;
            }
            
            // Try Capacitor Haptics first (for native apps)
            if (window.Capacitor?.Plugins?.Haptics) {
                console.log('📳 Using Capacitor Haptics for menu');
                
                const { Haptics } = window.Capacitor.Plugins;
                
                // Light impact for menu interactions
                await Haptics.impact({ style: 'LIGHT' });
                console.log('✅ Menu haptic feedback sent');
                return true;
            }
            // Fallback to navigator.vibrate
            else if (navigator.vibrate) {
                navigator.vibrate(pattern);
                console.log('📳 Menu vibration:', pattern);
                return true;
            }
        } catch (error) {
            console.error('❌ Menu vibration error:', error);
        }
        return false;
    }
    
    // Ana menü butonları
    const menuToggle = document.getElementById('menuToggle');
    const closeMenu = document.getElementById('closeMenu');
    const overlayMenu = document.getElementById('overlayMenu');
    const startGameBtn = document.getElementById('startGameBtn');
    const restartButton = document.getElementById('restartButton');

    // Tüm buton elementlerini kontrol et
    const allButtons = document.querySelectorAll('button[id]');
    console.log('🔍 Sayfadaki tüm butonlar:', Array.from(allButtons).map(btn => ({
        id: btn.id,
        text: btn.textContent.trim(),
        visible: btn.offsetParent !== null,
        disabled: btn.disabled
    })));

    console.log('🔍 Menü elementleri:', {
        menuToggle: !!menuToggle,
        closeMenu: !!closeMenu,
        overlayMenu: !!overlayMenu,
        startGameBtn: !!startGameBtn,
        restartButton: !!restartButton
    });

    // Çıkış butonu oluştur ve ekle
    const exitGameBtn = document.createElement('button');
    exitGameBtn.textContent = 'Oyundan Çık';
    exitGameBtn.className = 'menu-btn danger';
    exitGameBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Oyundan Çık';
    
    // Game Mode Selection butonu ekle
    const gameModeBtn = document.createElement('button');
    gameModeBtn.textContent = 'Oyun Modu';
    gameModeBtn.className = 'menu-btn secondary';
    gameModeBtn.innerHTML = '<i class="fas fa-gamepad"></i> Oyun Modu';
    gameModeBtn.addEventListener('click', () => {
        console.log('🎮 Game Mode butonu tıklandı');
        showGameModeSelection();
        toggleMenu();
    });
    
    // Menü section'a ekle
    const menuSection = document.querySelector('.menu-section');
    if (menuSection) {
        menuSection.appendChild(gameModeBtn);
        menuSection.appendChild(exitGameBtn);
        console.log('✅ Yeni menü butonları eklendi');
    }

    // iOS güvenli: Başlangıç ekranını görünür ve etkileşimli hale getiren yardımcı
    function showStartScreenSafely() {
        try {
            const startScreen = document.getElementById('startScreen');
            const gameHUD = document.getElementById('gameHUD');
            const overlayMenu = document.getElementById('overlayMenu');
            const menuToggle = document.getElementById('menuToggle');
            const levelSel = document.getElementById('levelSelectionOverlay');
            const gameModeOverlay = document.getElementById('gameModeOverlay');
            const endScreenEl = document.getElementById('endScreen');

            // Kalan overlayleri kapat/temizle
            if (overlayMenu) overlayMenu.classList.remove('open');
            document.body.classList.remove('menu-open');
            if (menuToggle) {
                menuToggle.classList.remove('active');
                menuToggle.style.display = '';
            }
            if (levelSel) levelSel.remove();
            if (gameModeOverlay) gameModeOverlay.remove();
            if (endScreenEl) {
                endScreenEl.style.display = 'none';
                endScreenEl.classList.remove('show');
                endScreenEl.style.pointerEvents = 'none';
                endScreenEl.style.visibility = 'hidden';
                endScreenEl.style.opacity = '0';
            }

            // HUD'ı gizle, başlangıç ekranını göster ve stilini sıfırla
            if (gameHUD) gameHUD.style.display = 'none';
            if (startScreen) {
                startScreen.style.display = 'flex';
                // forceUnblockOverlays yan etkilerini temizle
                try {
                    startScreen.style.removeProperty('opacity');
                    startScreen.style.removeProperty('z-index');
                    startScreen.style.removeProperty('pointer-events');
                    startScreen.style.removeProperty('visibility');
                } catch (_) {}
                startScreen.style.opacity = '';
                startScreen.style.zIndex = '';
                startScreen.style.pointerEvents = 'auto';
                startScreen.style.visibility = 'visible';
            }

            // Başla/tekrar butonlarını doğru ayarla
            if (typeof startBtn !== 'undefined' && startBtn) startBtn.style.display = 'block';
            if (typeof restartBtn !== 'undefined' && restartBtn) restartBtn.style.display = 'none';

            // Oyun durumunu sıfırla
            try { gameState = 'idle'; } catch (_) {}
            
            // Canvas'ı tamamen temizle - oyun ekranında kalan görüntüleri sil
            try { 
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                console.log('🧹 Canvas ana ekrana dönerken temizlendi');
            } catch (e) {
                console.warn('⚠️ Canvas temizlenirken hata:', e);
            }
        } catch (e) {
            console.warn('⚠️ showStartScreenSafely failed:', e?.message || e);
        }
    }
    
    // Menü toggle fonksiyonu
    function toggleMenu() {
        console.log('🍔 toggleMenu çağrıldı');
        if (menuToggle) {
            menuToggle.classList.toggle('active');
            console.log('🔄 menuToggle active:', menuToggle.classList.contains('active'));
        }
        if (overlayMenu) {
            overlayMenu.classList.toggle('open');
            const isOpen = overlayMenu.classList.contains('open');
            console.log('🔄 overlayMenu open:', isOpen);

            // Menü açıkken hamburger butonunu gizle, böylece ekranda tek bir kapat butonu kalır
            if (menuToggle) {
                menuToggle.style.display = isOpen ? 'none' : '';
            }

            // Body class, z-index and pointer-events hardening
            try {
                document.body.classList.toggle('menu-open', isOpen);
                if (isOpen) {
                    overlayMenu.style.zIndex = '1600';
                    overlayMenu.style.pointerEvents = 'auto';
                    // ensure it stays on top of canvas/HUD
                    if (canvas) canvas.style.zIndex = '1000';
                }
            } catch(_) {}
        }
    }
    
    // Event listener'lar
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🍔 Hamburger buton tıklandı');
            testVibration([30]); // Kısa titreşim
            toggleMenu();
        });
        console.log('✅ menuToggle event listener eklendi');
    } else {
        console.error('❌ menuToggle bulunamadı!');
    }
    
    if (closeMenu) {
        closeMenu.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('❌ Close buton tıklandı');
            testVibration([20]); // Kısa titreşim
            toggleMenu();
        });
        console.log('✅ closeMenu event listener eklendi');
    } else {
        console.error('❌ closeMenu bulunamadı!');
    }
    
    if (overlayMenu) {
        overlayMenu.addEventListener('click', function(e) {
            if (e.target === overlayMenu) {
                console.log('🎯 Overlay dışına tıklandı');
                toggleMenu();
            }
        });
        console.log('✅ overlayMenu event listener eklendi');
    } else {
        console.error('❌ overlayMenu bulunamadı!');
    }
    
    // Range inputlar için gerçek zamanlı değer güncelleme
    const soundVolume = document.getElementById('soundVolume');
    const soundValue = document.getElementById('soundValue');
    const musicVolume = document.getElementById('musicVolume');
    const musicValue = document.getElementById('musicValue');
    
    if (soundVolume && soundValue) {
        soundVolume.addEventListener('input', function() {
            soundValue.textContent = this.value;
            soundManager.setSoundVolume(this.value);
        });
    }
    
    if (musicVolume && musicValue) {
        musicVolume.addEventListener('input', function() {
            musicValue.textContent = this.value;
            soundManager.setMusicVolume(this.value);
        });
    }
    
    // Oyun kontrol butonları
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            console.log('🎮 Start Game butonu tıklandı');
            testVibration([50, 30, 50]); // Başlama titreşimi
            
            // Start screen'i gizle
            const startScreen = document.getElementById('startScreen');
            if (startScreen) startScreen.style.display = 'none';
            
            // Game HUD'ı göster
            const gameHUD = document.getElementById('gameHUD');
            if (gameHUD) {
                gameHUD.style.display = 'block';
                console.log('✅ Game HUD gösterildi');
            }
            
            // Restart butonunu göster
            if (restartButton) {
                restartButton.style.display = 'block';
                console.log('✅ Restart butonu gösterildi');
            }
            
            startGame(true); // main menu start => fresh start from Level 1
            toggleMenu();
        });
    }
    
    if (restartButton) {
        restartButton.addEventListener('click', async () => {
            const onaylandi = await askConfirm({
                icon: '🔄',
                title: 'Yeniden Başlat',
                message: 'Mevcut oyun sıfırlanacak. Yeniden başlatmak istediğinize emin misiniz?',
                cancelText: 'Vazgeç',
                okText: 'Yeniden Başlat'
            });
            if (onaylandi) {
                console.log('🔄 Oyun yeniden başlatılıyor');
                testVibration([80]); // Yeniden başlatma titreşimi
                startGame(true); // user confirmed restart from menu -> treat as fresh start
                toggleMenu();
            }
        });
    }
    
    // Nasıl oynanır butonu
    const howToPlayBtn = document.getElementById('howToPlayBtn');
    if (howToPlayBtn) {
        howToPlayBtn.addEventListener('click', () => {
            console.log('❓ Nasıl oynanır butonu tıklandı');
            testVibration([40]); // Orta titreşim
            showHowToPlay();
            toggleMenu();
        });
    }
    
    // Çıkış butonu
    if (exitGameBtn) {
        exitGameBtn.addEventListener('click', async () => {
            const onaylandi = await askConfirm({
                icon: '🚪',
                title: 'Oyundan Çık',
                message: 'Oyundan çıkmak istediğinize emin misiniz? Mevcut oyun sıfırlanır, seviye ilerlemeniz korunur.',
                cancelText: 'Vazgeç',
                okText: 'Çık'
            });
            if (onaylandi) {
                console.log('🚪 Oyundan çıkılıyor');
                testVibration([100, 50, 100]); // Güçlü çıkış titreşimi
                
                // 🔄 Mevcut oyun oturumunu sıfırla (level ilerlemesi korunur)
                console.log('🔄 Mevcut oyun oturumu sıfırlanıyor...');
                try {
                    savedGameState = null; // Kayıtlı oyun durumunu temizle
                    gameState = 'idle';    // Oyun durumunu sıfırla
                    grid = [];             // Oyun tahtasını temizle
                    fallingBubbles = [];   // Düşen balonları temizle
                    particles = [];        // Parçacıkları temizle
                    currentBubble = null;  // Mevcut balonu temizle
                    nextBubble = null;     // Sonraki balonu temizle
                    
                    // Canvas'ı tamamen temizle
                    try {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        console.log('🧹 Canvas temizlendi');
                    } catch (e) {
                        console.warn('⚠️ Canvas temizlenirken hata:', e);
                    }
                    
                    console.log('✅ Oyun oturumu temizlendi - yeni oyuna hazır');
                } catch (error) {
                    console.warn('⚠️ Oyun durumu temizlenirken hata:', error);
                }
                
                // Ana menü (başlangıç) ekranına güvenli dönüş
                showStartScreenSafely();
                toggleMenu();
            }
        });
    }
    
    console.log('🎉 Hamburger menü kurulumu tamamlandı');
});

// --- ONAY KUTUSU ---
// index.html'deki #cfmOverlay modal'ını kullanır (native confirm() yerine:
// düğmeleri İngilizce "Cancel/Ok" geliyordu ve pencere oyunun görsel diline
// uymuyordu). Modal herhangi bir sebeple yüklenmemişse native confirm'e düşer.
function askConfirm(opts) {
    if (typeof window.showConfirm === 'function') {
        return window.showConfirm(opts);
    }
    return Promise.resolve(confirm(opts.message || opts.title || 'Emin misiniz?'));
}

// Nasıl oynanır fonksiyonu
// NOT: showHowToPlay() burada tanımlanmıyor artık — index.html'deki inline
// script (bkz. "NASIL OYNANIR: çirkin alert() yerine stilli modal" bloğu)
// sayfa yüklenince window.showHowToPlay'i kendi cam-panel modal'ıyla
// (#htpOverlay) değiştiriyor. O yüzden burada ikinci bir tanım tutmak sadece
// asla çalışmayacak ölü kod olurdu.

// İstatistik modal event listeners - artık mobil tab menüden erişiliyor

closeStatsButton?.addEventListener('click', () => {
    statsModal.style.display = 'none';
});

exportDataButton?.addEventListener('click', () => {
    exportPlayerData();
});

resetDataButton?.addEventListener('click', async () => {
    const onaylandi = await askConfirm({
        icon: '⚠️',
        title: 'Verileri Sıfırla',
        message: 'Tüm ilerleme verileri silinecek. Bu işlem geri alınamaz.',
        cancelText: 'Vazgeç',
        okText: 'Sil'
    });
    if (onaylandi) {
        resetPlayerData();
        if (statsModal) statsModal.style.display = 'none';
    }
});

// Modal dışına tıklayınca kapat
statsModal?.addEventListener('click', (e) => {
    if (e.target === statsModal) {
        statsModal.style.display = 'none';
    }
});

// Güvenli event listener bağlama: handler fonksiyonları tanımlandıktan sonra bağla
// Bind immediately to stable wrapper handlers that call real impls when available
(function safeBindCanvasEvents(){
    try {
        const mm = (e) => { try { if (typeof onMouseMove === 'function') return onMouseMove(e); } catch(_){} };
        const md = (e) => { try { if (typeof onMouseDown === 'function') return onMouseDown(e); } catch(_){} };
    const ts = (e) => { 
        try { 
            debugLog('touch', '🔁 fwd:touchstart typeof onTouchStart=', typeof onTouchStart); 
            if (typeof onTouchStart === 'function') {
                console.log('✅ Calling onTouchStart NOW');
                const result = onTouchStart(e);
                console.log('✅ onTouchStart returned:', result);
                return result;
            } else {
                console.error('❌ onTouchStart is NOT a function!');
            }
        } catch(err){ 
            console.error('❌ fwd ts err', err); 
        } 
    };
    const tm = (e) => { 
        try { 
            if (typeof onTouchMove === 'function') {
                return onTouchMove(e);
            }
        } catch(err){ 
            console.error('❌ fwd tm err', err); 
        } 
    };
    const te = (e) => { 
        try { 
            // Drop duplicate cascades within a very short window (from both pointer and touch forwarders)
            const nowTs = Date.now();
            if (window.__lastTeTs && (nowTs - window.__lastTeTs) < 40) {
                return; // suppress duplicate
            }
            window.__lastTeTs = nowTs;

            debugLog('touch', '🔁 fwd:touchend typeof onTouchEnd=', typeof onTouchEnd); 
            if (typeof onTouchEnd === 'function') {
                console.log('✅ Calling onTouchEnd NOW');
                const result = onTouchEnd(e);
                console.log('✅ onTouchEnd returned:', result);
                return result;
            } else if (typeof onMouseDown === 'function') {
                // Only force-fire when no handler is available at all
                console.log('🧨 Fallback fire from wrapper (no onTouchEnd)');
                try { onMouseDown(); } catch (_) {}
            }
        } catch(err){ 
            console.error('❌ fwd te err', err); 
        } 
    };
        let lastClickAt = 0;
        const ck = (e) => { 
            const now = Date.now();
            if (now - lastClickAt < 200) return; // debounce
            lastClickAt = now;
            try { if (typeof handleCanvasClick === 'function') return handleCanvasClick(e); } catch(_){} 
        };
        const rz = () => { try { if (typeof onResize === 'function') return onResize(); } catch(_){} };

        canvas.addEventListener('mousemove', mm, { passive: true });
        canvas.addEventListener('mousedown', md, { passive: false });
        canvas.addEventListener('mouseleave', () => { try { hidePowerUpTooltip(); } catch(_){} });
        canvas.addEventListener('touchstart', ts, { passive: false, capture: true });
        canvas.addEventListener('touchmove', tm, { passive: false, capture: true });
        canvas.addEventListener('touchend', te, { passive: false, capture: true });
        canvas.addEventListener('click', ck, { passive: false });
        window.addEventListener('resize', rz);
        // iOS: reklam/status-bar sonrası viewport değişimini anında yakala.
        // 'resize' bazen tetiklenmiyor; visualViewport daha güvenilir. Sadece
        // canvas kutusunu senkronlar (grid geometrisine dokunmaz).
        // iOS'ta env(safe-area-inset-top) sayfa açılışından hemen sonra 0
        // ölçülebiliyor (layout/viewport-fit henüz uygulanmamış). Kısa
        // gecikmelerle grid ofsetlerini bir kez daha hesapla -> grid ilk sırası
        // çentiğin/Dynamic Island'ın altına insin.
        [400, 1200, 2500].forEach((ms) => setTimeout(() => {
            try { recomputeGridOffsets('delayed-' + ms); } catch (_) {}
        }, ms));

        // Canvas'ın GERÇEK kutusu her ne sebeple değişirse (reklam, status bar,
        // safe area, rotasyon) anında yakala. En güvenilir mekanizma bu.
        try {
            if (window.ResizeObserver) {
                const ro = new ResizeObserver(() => {
                    try {
                        const r = canvas.getBoundingClientRect();
                        if (Math.abs(Math.round(r.width) - logicalWidth) > 1 ||
                            Math.abs(Math.round(r.height) - logicalHeight) > 1) {
                            syncCanvasToWindow('resizeObserver');
                        }
                    } catch (_) {}
                });
                ro.observe(canvas);
            }
        } catch (_) {}
        try {
            if (window.visualViewport) {
                const vv = () => { try { syncCanvasToWindow('visualViewport'); } catch(_){} };
                window.visualViewport.addEventListener('resize', vv);
                window.visualViewport.addEventListener('scroll', vv);
            }
        } catch(_) {}
        console.log('✅ Canvas event listeners bound (wrapper mode)');
        const missing = {
            onMouseMove: typeof onMouseMove,
            onMouseDown: typeof onMouseDown,
            onTouchStart: typeof onTouchStart,
            onTouchMove: typeof onTouchMove,
            onTouchEnd: typeof onTouchEnd,
            handleCanvasClick: typeof handleCanvasClick,
            onResize: typeof onResize
        };
        console.log('ℹ️ Current handler availability:', missing);

        // Global forwarding (capture) in case an overlay intercepts canvas events
        const withinCanvas = (x, y) => {
            const r = canvas.getBoundingClientRect();
            return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        };
    const fwdTouch = (e, kind) => {
            try {
                const t = e.touches?.[0] || e.changedTouches?.[0] || e;
                if (!t) return;
                // If top element is menu button, overlay menu, or modal, do not forward into canvas
                try {
                    const topEl = document.elementFromPoint(t.clientX, t.clientY);
                    if (topEl && (
                        topEl.id === 'menuToggle' || 
                        topEl.id === 'endRestartButton' || 
                        topEl.classList?.contains('continue-btn') ||
                        topEl.closest?.('#overlayMenu') ||
                        topEl.closest?.('#endScreen') ||
                        topEl.closest?.('#statsModal')
                    )) {
                        console.log('🛡️ [FWD-SKIP] Skipping forward for:', topEl.id || topEl.className);
                        return;
                    }
                } catch(_) {}
                if (!withinCanvas(t.clientX, t.clientY)) return;
        console.log('🛰️ [GLOBAL-FWD]', kind, 'at', t.clientX, t.clientY);
                if (kind === 'start') ts(e);
                else if (kind === 'move') tm(e);
                else te(e);
            } catch(_) {}
        };
        document.addEventListener('touchstart', (e)=>fwdTouch(e,'start'), true);
        document.addEventListener('touchmove',  (e)=>fwdTouch(e,'move'),  true);
        document.addEventListener('touchend',   (e)=>fwdTouch(e,'end'),   true);
        // Pointer fallback to synthesize touch-like calls
        const fwdPointer = (e, kind) => {
            try {
                try {
                    const topEl = document.elementFromPoint(e.clientX, e.clientY);
                    if (topEl && (
                        topEl.id === 'menuToggle' || 
                        topEl.id === 'endRestartButton' || 
                        topEl.classList?.contains('continue-btn') ||
                        topEl.closest?.('#overlayMenu') ||
                        topEl.closest?.('#endScreen') ||
                        topEl.closest?.('#statsModal')
                    )) {
                        console.log('🛡️ [PTR-SKIP] Skipping pointer forward for:', topEl.id || topEl.className);
                        return;
                    }
                } catch(_) {}
                if (!withinCanvas(e.clientX, e.clientY)) return;
                const faux = { 
                    touches: kind==='end'?[]:[{ clientX: e.clientX, clientY: e.clientY }], 
                    changedTouches: [{ clientX: e.clientX, clientY: e.clientY }], 
                    preventDefault: ()=>{ try{ e.preventDefault(); }catch(_){} },
                    stopPropagation: ()=>{ try{ e.stopPropagation(); }catch(_){} }
                };
                console.log('🛰️ [GLOBAL-PTR-FWD]', kind, 'at', e.clientX, e.clientY);
                if (kind === 'start') ts(faux);
                else if (kind === 'move') tm(faux);
                else {
                    // Try normal path; wrapper will only fallback if handler truly missing
                    return te(faux);
                }
            } catch(_) {}
        };
        document.addEventListener('pointerdown', (e)=>fwdPointer(e,'start'), true);
        document.addEventListener('pointermove', (e)=>fwdPointer(e,'move'),  true);
        document.addEventListener('pointerup',   (e)=>fwdPointer(e,'end'),   true);
    } catch (e) {
        console.error('❌ Failed to bind canvas wrapper events:', e?.message || e);
    }
})();

// --- TOUCH INSPECTOR & OVERLAY UNBLOCKER (diagnostic) ---
(function installTouchInspector(){
    try {
        const getChain = (el) => {
            const chain = [];
            let cur = el;
            while (cur && chain.length < 8) {
                const cs = window.getComputedStyle(cur);
                chain.push({
                    tag: cur.tagName,
                    id: cur.id || '',
                    class: (cur.className || '').toString(),
                    pe: cs.pointerEvents,
                    z: cs.zIndex,
                    disp: cs.display,
                    vis: cs.visibility,
                    op: cs.opacity
                });
                cur = cur.parentElement;
            }
            return chain;
        };

        const logTouch = (e, label) => {
            try {
                const t = e.touches?.[0] || e.changedTouches?.[0] || e;
                const x = t.clientX, y = t.clientY;
                const topEl = document.elementFromPoint(x, y);
                const chain = getChain(topEl);
                const rect = canvas.getBoundingClientRect();
                const inCanvas = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
                console.log(`🛰️ [TOUCH-INSPECTOR] ${label} @(${Math.round(x)},${Math.round(y)}) inCanvas=${inCanvas}`, {
                    topElement: { tag: topEl?.tagName, id: topEl?.id, class: (topEl?.className||'').toString() },
                    chain
                });
            } catch(_) { /* no-op */ }
        };

        document.addEventListener('touchstart', (e) => logTouch(e, 'touchstart'), true);
        document.addEventListener('pointerdown', (e) => logTouch(e, 'pointerdown'), true);

        // Expose a helper to disable common overlay blockers
        // IMPORTANT: Do NOT touch the in-game hamburger menu (#overlayMenu)
        window.forceUnblockOverlays = () => {
            const selectors = [
                /* '#overlayMenu', */ // never mutate menu; it must remain visible when opened
                '.overlay', '.modal', '.ad-container',
                // iOS: startScreen asla burada gizlenmemeli
                '#interstitialContainer', '.splash',
                '#native-splash', '.popgo-splash'
            ];
            selectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    // Skip if element is or is inside the overlay menu just in case
                    if (el.id === 'overlayMenu' || el.closest?.('#overlayMenu')) return;
                    el.style.pointerEvents = 'none';
                    // startScreen dokunma: geri dönüş akışını bozmasın diye işlem yapma
                    if (el.id === 'startScreen') return;
                    el.style.opacity = '0';
                    el.style.zIndex = '0';
                });
            });
            try { if (canvas) { canvas.style.pointerEvents = 'auto'; canvas.style.zIndex = '100'; } } catch(_) {}
            console.log('🪄 forceUnblockOverlays applied');
        };
        console.log('✅ Touch inspector installed');
    } catch (e) {
        console.warn('⚠️ Touch inspector install failed:', e?.message || e);
    }
})();

// Aggressive auto-unblock watchdog: periodically disable pointer-events on any element covering the canvas
window.startAutoUnblock = () => {
    try {
        if (window._autoUnblockTimer) return;
        const scan = () => {
            try {
                const rect = canvas.getBoundingClientRect();
                const points = [
                    { x: rect.left + rect.width/2, y: rect.top + rect.height*0.25 },
                    { x: rect.left + rect.width/2, y: rect.top + rect.height*0.5 },
                    { x: rect.left + rect.width/2, y: rect.top + rect.height*0.8 },
                ];
                const overlayMenuEl = document.getElementById('overlayMenu');
                const isMenuOpen = !!overlayMenuEl && overlayMenuEl.classList.contains('open');
                if (isMenuOpen) {
                    // keep menu on top and interactive
                    overlayMenuEl.style.zIndex = '2000';
                    overlayMenuEl.style.pointerEvents = 'auto';
                    return;
                }
                // Respect level complete and game over modals
                const endScreenModal = document.getElementById('endScreen');
                const statsModal = document.getElementById('statsModal');
                const dailyOverlay = document.getElementById('dailyBonusOverlay');
                const levelCompleteOverlay = document.getElementById('levelCompleteOverlay');
                
                // Check if modals are visible (display !== 'none')
                const isEndScreenVisible = endScreenModal && (endScreenModal.style.display !== 'none' || getComputedStyle(endScreenModal).display !== 'none');
                const isStatsVisible = statsModal && statsModal.style.display !== 'none';
                const isDailyVisible = dailyOverlay && (dailyOverlay.classList?.contains('show') || getComputedStyle(dailyOverlay).display !== 'none');
                const isLevelCompleteVisible = levelCompleteOverlay && (levelCompleteOverlay.classList?.contains('show') || getComputedStyle(levelCompleteOverlay).display !== 'none');
                
                if (isEndScreenVisible || isStatsVisible || isDailyVisible || isLevelCompleteVisible) {
                    // Eğer oyun state'i gameover değilse veya idle ise, yanlışlıkla açık kalan endScreen'i kapat
                    // AUTO-UNBLOCK DİSABLED - Bu kodu devre dışı bırakıyoruz
                    /*
                    if (isEndScreenVisible && typeof gameState !== 'undefined' && (gameState !== 'gameover' || gameState === 'idle')) {
                        try {
                            endScreenModal.style.display = 'none';
                            endScreenModal.classList.remove('show');
                            endScreenModal.style.pointerEvents = 'none';
                            endScreenModal.style.visibility = 'hidden';
                            endScreenModal.style.opacity = '0';
                            console.log('🛡️ [AUTO-UNBLOCK] endScreen force-hidden (state!=gameover or idle)');
                        } catch (_) {}
                    } else {
                        console.log('🛡️ [AUTO-UNBLOCK] Modal aktif, watchdog durduruldu');
                        return; // Modal açıkken hiçbir şeye dokunma
                    }
                    */
                    console.log('🛡️ [AUTO-UNBLOCK] Modal kontrolü devre dışı');
                    return; // Modal açıkken hiçbir şeye dokunma
                }
                
                for (const p of points) {
                    const topEl = document.elementFromPoint(p.x, p.y);
                    if (!topEl) continue;
                    if (topEl === canvas || canvas.contains(topEl)) continue;
                    // Skip HUD, controls, game modals, and menu elements
                    if (topEl.id === 'menuToggle' || topEl.closest?.('#gameHUD')) continue;
                    if (topEl.id === 'overlayMenu' || topEl.closest?.('#overlayMenu')) continue;
                    if (topEl.id === 'endScreen' || topEl.closest?.('#endScreen')) continue;
                    if (topEl.id === 'statsModal' || topEl.closest?.('#statsModal')) continue;
                    if (topEl.id === 'dailyBonusOverlay' || topEl.closest?.('#dailyBonusOverlay') || topEl.closest?.('.game-daily-overlay')) continue;
                    if (topEl.id === 'levelCompleteOverlay' || topEl.closest?.('#levelCompleteOverlay') || topEl.closest?.('.level-complete-modal-new')) continue;
                    // Disable pointer events on blocker
                    topEl.style.pointerEvents = 'none';
                    // Lower z-index if it has huge stacking
                    const cs = getComputedStyle(topEl);
                    if ((parseInt(cs.zIndex,10) || 0) > 100) topEl.style.zIndex = '0';
                    console.log('🛠️ [AUTO-UNBLOCK] Disabled pointer-events for', topEl.tagName, topEl.id || topEl.className || '(no id)');
                }
            } catch(_) {}
        };
        window._autoUnblockTimer = setInterval(scan, 500);
        console.log('✅ Auto-unblock watchdog started');
    } catch(_) {}
};

window.stopAutoUnblock = () => { try { clearInterval(window._autoUnblockTimer); window._autoUnblockTimer = null; } catch(_) {} };

// Ses ayarları event listeners
document.getElementById('soundVolume')?.addEventListener('input', (e) => {
    soundManager.setSoundVolume(e.target.value);
    localStorage.setItem('popgo_soundVolume', e.target.value);
});

document.getElementById('musicVolume')?.addEventListener('input', (e) => {
    const val = e.target.value;
    soundManager.setMusicVolume(val);
    // BGM sesini anlık uygula (yalnız ayarlardan kontrol edilecek)
    try { bgmManager.setVolume(val); } catch (err) {}
    localStorage.setItem('popgo_musicVolume', val);
});

document.getElementById('vibrationEnabled')?.addEventListener('change', async (e) => {
    const isEnabled = e.target.checked;
    localStorage.setItem('popgo_vibration', isEnabled);
    console.log('📳 Vibration setting changed to:', isEnabled);
    
    // Test vibration immediately when enabled
    if (isEnabled) {
        console.log('🧪 Testing vibration immediately...');
        try {
            // Try Capacitor Haptics first
            if (window.Capacitor?.Plugins?.Haptics) {
                const { Haptics } = window.Capacitor.Plugins;
                await Haptics.impact({ style: 'MEDIUM' });
                setTimeout(async () => {
                    await Haptics.impact({ style: 'LIGHT' });
                }, 100);
                setTimeout(async () => {
                    await Haptics.impact({ style: 'MEDIUM' });
                }, 200);
                console.log('✅ Test haptic sequence sent successfully (Capacitor)');
            } else if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
                console.log('✅ Test vibration sent successfully (navigator)');
            }
        } catch (error) {
            console.error('❌ Test vibration failed:', error);
        }
    }
});

// Ayarları yükle
function loadSettings() {
    const soundVolume = localStorage.getItem('popgo_soundVolume') || '70';
    const musicVolume = localStorage.getItem('popgo_musicVolume') || '50';
    const vibration = localStorage.getItem('popgo_vibration') !== 'false';
    
    console.log('⚙️ Loading settings:', {
        soundVolume,
        musicVolume,
        vibration,
        navigator_vibrate: !!navigator.vibrate
    });
    
    const soundVolumeEl = document.getElementById('soundVolume');
    const musicVolumeEl = document.getElementById('musicVolume');
    const vibrationEl = document.getElementById('vibrationEnabled');
    
    if (soundVolumeEl) {
        soundVolumeEl.value = soundVolume;
        document.getElementById('soundValue').textContent = soundVolume;
    }
    if (musicVolumeEl) {
        musicVolumeEl.value = musicVolume;
        document.getElementById('musicValue').textContent = musicVolume;
    }
    if (vibrationEl) {
        vibrationEl.checked = vibration;
    debugLog('haptics', '✅ Vibration checkbox set to:', vibration);
    }
    
    soundManager.setSoundVolume(soundVolume);
    soundManager.setMusicVolume(musicVolume);
    try { bgmManager.setVolume(musicVolume); } catch (err) {}
    
    // Test vibration on load if enabled
    if (vibration) {
        console.log('🧪 Testing vibration on settings load...');
        setTimeout(async () => {
            try {
                // Try Capacitor Haptics first
                if (window.Capacitor?.Plugins?.Haptics) {
                    const { Haptics } = window.Capacitor.Plugins;
                    await Haptics.impact({ style: 'MEDIUM' });
                    console.log('📳 Test haptic feedback sent (Capacitor)');
                } else if (navigator.vibrate) {
                    navigator.vibrate([50]);
                    console.log('📳 Test vibration sent (navigator)');
                }
            } catch (error) {
                console.error('❌ Test vibration failed:', error);
            }
        }, 1000);
    }
}

// Hızlı mute butonunu kaldır: kontrol ayarlar menüsünden yapılacak
window.addEventListener('load', () => {
    try { bgmManager?.loadOnce?.('arkaplan.mp3'); } catch (e) {}
    
    // Kaydedilen verileri yükle
    initializeGameData();
});

// --- OYUN VERİSİ YÜKLEMESİ ---
function initializeGameData() {
    console.log('🔄 Oyun verisi yükleniyor...');
    
    // İstatistikleri yükle
    const statsLoaded = loadPlayerStats();
    if (statsLoaded) {
        console.log('✅ İstatistikler yüklendi');
    } else {
        console.log('📊 Yeni oyuncu - varsayılan istatistikler kullanılıyor');
    }
    
    // Power-up stoğunu yükle
    let powerupsLoaded = false;
    try { powerupsLoaded = loadPowerUpStock(); } catch(e){ console.error('❌ Power-up yükleme hatası:', e?.message || e); }
    if (powerupsLoaded) {
        console.log('✅ Power-up stoğu yüklendi');
    } else {
        console.log('⚡ Yeni oyuncu - varsayılan power-up stoğu kullanılıyor');
        // İlk oyuncular için başlangıç power-upları ver
        addPowerUp('rainbow', 2);
        addPowerUp('fireball', 1);
    }
    
    // UI'ı güncelle (güvenli)
    try { typeof updateStatsDisplay === 'function' ? updateStatsDisplay() : console.warn('⚠️ updateStatsDisplay not ready yet'); } catch(e){ console.warn('⚠️ updateStatsDisplay deferred'); }
    try { typeof updatePowerUpDisplay === 'function' ? updatePowerUpDisplay() : console.warn('⚠️ updatePowerUpDisplay not ready yet'); } catch(e){ console.warn('⚠️ updatePowerUpDisplay deferred'); }
    
    console.log('🎮 Oyun verisi yükleme tamamlandı');
}

// Dokunmatik kontroller için ek ayarlar (eski tab menü için - şimdi kullanılmıyor)
// Bu kodlar eski tab menü sistemi için kalıntılar, güvenli hale getirildi
const tabMenu = document.getElementById('mobileTabMenu'); // Artık var olmayabilir
const isTabMenuOpen = false; // Kullanılmıyor

if (tabMenu) {
    let touchStartY = 0;
    tabMenu.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });

    tabMenu.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - touchStartY;
        
        // Bu kod artık kullanılmıyor ama güvenlik için bırakıldı
        if (deltaY > 50 && isTabMenuOpen) {
            tabMenu.classList.remove('open');
        }
    });
}

// Canvas dokunma olaylarında menüyü kapat - eski tab menü için (şimdi kullanılmıyor)
// Kod güvenlik için bırakıldı ama artık aktif değil

// --- BAŞLATMA VE BOYUTLANDIRMA ---
try { onResize?.(); } catch(_) {}
// İlerleme verilerini yükle - güvenli çağrı
setTimeout(() => {
    try {
        if (typeof loadPlayerData === 'function') loadPlayerData();
        if (typeof loadSettings === 'function') loadSettings();
    } catch (e) {
        console.error('Player data loading error:', e);
    }
}, 10);

// Power-up display güncelleme - güvenli çağrı  
setTimeout(() => {
    try {
        updatePowerUpDisplay?.();
    } catch (e) {
        console.warn('Power-up display update deferred');
    }
}, 50);

// --- POWERUP KULLANMA FONKSİYONLARI ---
function usePowerup(type) {
    if (powerUpStock[type] && powerUpStock[type] > 0) {
        powerUpStock[type]--;
        
        switch(type) {
            case 'bomb':
                // Bomb powerup: Çevresindeki balonları patlatır
                if (currentBubble) {
                    currentBubble.type = POWERUP_TYPES.BOMB;
                    currentBubble.color = BOMB_COLOR;
                }
                break;
                
            case 'laser':
                // Laser powerup: Yatay çizgide tüm balonları patlatır
                if (currentBubble) {
                    currentBubble.type = POWERUP_TYPES.LASER;
                    currentBubble.color = LASER_COLOR;
                }
                break;
            
            case 'verticalLaser':
                // Vertical Laser powerup: Dikey sütundaki 2 sütunu temizler
                if (currentBubble) {
                    currentBubble.type = POWERUP_TYPES.VERTICAL_LASER;
                    currentBubble.color = '#00eaff'; // Cyan/mavi ton
                }
                trackPowerUpUsage('verticalLaser');
                break;
                
            case 'rainbow':
                // Rainbow powerup: Sonraki balon herhangi bir renkle eşleşir
                if (currentBubble) {
                    currentBubble.type = POWERUP_TYPES.RAINBOW;
                    currentBubble.color = RAINBOW_COLOR;
                }
                trackPowerUpUsage('rainbow');
                break;
                
            case 'fireball':
                // Fireball powerup: Patlatma gücü artırılmış balon
                if (currentBubble) {
                    currentBubble.type = POWERUP_TYPES.FIREBALL;
                    currentBubble.color = FIREBALL_COLOR;
                }
                trackPowerUpUsage('fireball');
                break;
                
            case 'freeze':
                // Freeze powerup: 3 saniye slow motion
                freezeTimeLeft = 3;
                isSlowMotion = true;
                trackPowerUpUsage('freeze');
                break;
        }
        
        soundManager.play('powerup');
        updateMobileUI();
        return true; // Başarıyla kullanıldı
    } else {
        // Stokta yok, hiçbir şey yapma
        console.log(`❌ Power-up ${type} stokta yok!`);
        return false;
    }
}

function onResize() {
    // 🔥 CRITICAL: Oyun sırasında veya reklam gösterilirken resize olursa grid değerlerini DEĞİŞTİRME!
    // Reklam kapandığında iOS resize eventi tetikliyor - bu grid'i bozuyor
    if (gameState === 'playing' || gameState === 'ready' || _isAdCurrentlyShowing) {
        console.log('⚠️ [onResize] BLOCKED - Oyun aktif veya reklam gösteriliyor, grid korunuyor');
        
        // 🎯 Bayat localStorage snapshot'ı GERİ YÜKLEME. Canvas'ı canlı pencereden
        // tazele (grid değerlerine dokunma -> oyun bozulmaz). Reklam viewport'u
        // değiştirmediği için logicalWidth aynı kalır, grid/HUD kaymaz.
        syncCanvasToWindow('resize-guard');
        return; // Grid değerlerini değiştirme!
    }
    
    const dpr = window.devicePixelRatio || 1;

    // Canvas kutusunu ve backing store'u TEK yerden kur (CSS kutusu = doğruluk
    // kaynağı). Böylece canvas, 'fixed; bottom:0' olan .power-ball-bar ile aynı
    // koordinat uzayında olur; iOS'ta innerHeight vs 100vh ayrışması HUD'u kaydırmaz.
    if (!syncCanvasToWindow('onResize')) {
        // Kutu henüz geçersiz (layout oturmamış) -> bu tur atla, sonraki frame düzeltir
        console.log('⚠️ onResize: canvas kutusu hazır değil, atlanıyor');
        return;
    }
    canvas.style.zIndex = '1'; // Canvas body üstünde, modalların altında

    console.log(`🖼️ Canvas configured: logical=${logicalWidth}x${logicalHeight}, backing=${canvas.width}x${canvas.height}, dpr=${dpr}`);
    
    // Yeni dinamik boyutlandırma sistemini kullan
    const newDimensions = calculateGameDimensions();
    BUBBLE_RADIUS = newDimensions.radius;
    COLS = newDimensions.cols;
    // ROWS zaten const, ama güncellenmesi gerekirse:
    // ROWS = newDimensions.rows;
    ROW_HEIGHT = BUBBLE_RADIUS * 1.732;
    
    console.log(`🎮 Grid: cols=${COLS}, bubbleRadius=${BUBBLE_RADIUS}, rows=${ROWS}`);
    
    // BOTTOM_MARGIN = sabit rezerv (150px) + DOM power barın yüksekliği.
    // Canvas tüm viewport'u kapladığı için barın kapattığı alan da rezerve
    // edilmeli; yoksa LEVEL/SKOR ve kovalar barın arkasına giriyor.
    BOTTOM_MARGIN = BOTTOM_MARGIN_DEFAULT + getPowerBarHeight();
    
    // Speed normalization
    screenSpeedFactor = BASE_SCREEN_WIDTH / Math.max(logicalWidth, BASE_SCREEN_WIDTH);
    STABLE_SPEED_MULTIPLIER = screenSpeedFactor;
    CURRENT_SHOOTER_SPEED = SHOOTER_SPEED * STABLE_SPEED_MULTIPLIER;
    CURRENT_GRAVITY = GRAVITY * STABLE_SPEED_MULTIPLIER;
    
    // Grid çizim ofsetleri (yatay ortalama + iOS üst güvenli alan) tek yerden
    recomputeGridOffsets('onResize');
    
    shooterX = logicalWidth / 2;
    shooterY = logicalHeight - BOTTOM_MARGIN - 35; // Daha yukarı çıkarıldı
    
    // Buckets
    const bucketWidth = logicalWidth / BUCKET_SCORES.length;
    buckets = BUCKET_SCORES.map((score, i) => ({
        x: i * bucketWidth,
        width: bucketWidth,
        score
    }));
    
    // Reinitialize stars
    stars.length = 0;
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random() * logicalWidth,
            y: Math.random() * logicalHeight,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.3,
            twinkleSpeed: Math.random() * 0.02 + 0.01
        });
    }
    
    console.log(`✅ onResize COMPLETE: ${logicalWidth}x${logicalHeight}`);
}

// İlk oyun başlangıcı kontrolü (günlük bonus kontrolü sadece ilk başlangıçta yapılsın diye)
let isFirstGameStartThisSession = false;

function startGame(freshStart = false) {
    console.log(`🚀 startGame() çağrıldı! ${freshStart ? '(fresh start - Level 1)' : '(continue)'} lavaStock sıfırlanıyor.`);
    console.log(`🔍 startGame BAŞLANGIÇ: gameState="${gameState}", grid.length=${grid.length}, currentBubble=${!!currentBubble}`);
    // Toast mesajları üretimde devre dışı
    
    // 🌌 Arka plan sistemini başlat
    initBackgroundSystem();
    
    // Game state'i sıfırla ve eski durumları temizle
    gameState = 'playing';
    savedGameState = null;
    canContinueWithAd = false;
    console.log(`✅ gameState değişti: "${gameState}"`);
    
    // Fresh start ise Level 1'den başla
    if (freshStart) {
        currentLevel = 1;
        console.log('🔄 Fresh start: currentLevel = 1 olarak sıfırlandı');
    }

    // 📊 Ölçüm (bkz. popgo-analytics.js)
    window.__popgoLevelStartedAt = Date.now();
    window.popgoTrack?.('game_start', { level: currentLevel, fresh_start: freshStart ? 1 : 0 });
    
    // End screen'i kesinlikle gizle
    try { forceHideEndScreen(); } catch(_) {}
    
    // Menü ve overlay'i kapat (hangi akıştan gelinirse gelinsin)
    try {
        const overlayMenuEl = document.getElementById('overlayMenu');
        const menuToggleEl = document.getElementById('menuToggle');
        if (overlayMenuEl) {
            overlayMenuEl.classList.remove('open');
            overlayMenuEl.style.pointerEvents = 'none';
            overlayMenuEl.style.zIndex = '0';
        }
        if (menuToggleEl) {
            menuToggleEl.classList.remove('active');
            menuToggleEl.style.display = '';
        }
        document.body.classList.remove('menu-open');
        console.log('🍔 Overlay menu force-closed for gameplay');
    } catch(_) {}

    // Güncel olarak overlay engellerini de temizle (ihtiyaten)
    try { window.forceUnblockOverlays?.(); } catch(_) {}
    // Auto-unblock geçici olarak devre dışı  
    // try { window.startAutoUnblock?.(); } catch(_) {}

    // Hızlı başlatma: Reklam ve ağır init beklemeden oyunu hemen görünür başlat
    if (window.__fastRestartOnce) {
        try { window.__fastRestartOnce = false; } catch(_) {}
        try { forceHideEndScreen(); } catch(_) {}
        try { window.__shootLock = false; } catch(_) {}
        // Temel reset
        streakCount = 0;
        lavaStock = Math.max(lavaStock, 3);
        score = 0;
        combo = 1;
        shotsSinceShift = 0;
        fallingBubbles = [];
        particles = [];
        shotsRemaining = gameMode === GAME_MODES.STRATEGY ? 60 : Infinity;
        timeRemaining = gameMode === GAME_MODES.ARCADE ? 300 : Infinity;
        gameStartTime = Date.now();
        
        // 🎨 PATTERN SİSTEMİ: Level'e göre şekilli grid oluştur
        const baseRows = 6;
        const levelBonus = Math.floor((currentLevel - 1) / 3);
        const initialRows = Math.min(baseRows + levelBonus, 12);
        grid = createPatternGrid(currentLevel, initialRows, COLS);
        
        updateScore();
        spawnBubbles();
        try { console.log('🎯 fast-start currentBubble exists:', !!currentBubble); } catch(_) {}
        gameState = 'playing';
        requestAnimationFrame(gameLoop);
        console.log('🎮 Game loop başlatıldı (fast)');
        try { startAimAnimation(); } catch(_) {}
        return;
    }

    // Daily bonus kontrolü yap - SADECE İLK BAŞLATMADA!
    if (isFirstGameStartThisSession === false) {
        // İlk defa oyun başlatılıyor, daily bonus kontrolü yap
        try {
            checkDailyBonusAvailable();
        } catch (e) {
            console.warn('⚠️ Daily bonus check failed:', e);
        }
    }
    
    endScreen.style.display = 'none';
    
    // LEVEL İLERLEMESİ: Oyuncu kaldığı yerden devam etsin
    // currentLevel zaten loadPlayerData() ile yüklenmiş durumda
    console.log(`🎯 Oyun başlıyor - Kaldığı Level: ${currentLevel}`);
    
    // Oyun durumunu sıfırla ama level'ı ve birikimlerini koru
    streakCount = 0;
    lavaStock = Math.max(lavaStock, 3); // En az 3 lava ile başla, birikimi varsa koru
    score = 0;
    combo = 1;
    shotsSinceShift = 0;
    fallingBubbles = [];
    particles = [];
    
    // KRİTİK: Bubble state'ini temizle - bu oyunun kilitleneye çözümü!
    currentBubble = null;
    nextBubble = null;
    
    // currentLevel değiştirme! Oyuncu kaldığı yerden devam etsin
    shotsRemaining = gameMode === GAME_MODES.STRATEGY ? 60 : Infinity;
    timeRemaining = gameMode === GAME_MODES.ARCADE ? 300 : Infinity;
    gameStartTime = Date.now();
    
    // Power-up stoklarını koru (sıfırlama!)
    // powerUpStock değişkenini dokunma, oyuncu birikimlerini kaybetmesin
    
    // Production'da power-up'lar sadece oyunda kazanılacak
    
    // Canvas will be cleared in gameLoop - no need to clear here
    
    // Grid'i sıfırla
    grid = [];
    for (let r = 0; r < ROWS; r++) {
        grid[r] = new Array(COLS).fill(null);
    }
    console.log(`🧹 Grid sıfırlandı: ${ROWS} satır x ${COLS} kolon`);

    // 🎨 PATTERN SİSTEMİ: Level'e göre şekilli grid oluştur
    const baseRows = 6; // Minimum başlangıç satırı
    const levelBonus = Math.floor((currentLevel - 1) / 3); // Her 3 levelde +1 satır
    const initialRows = Math.min(baseRows + levelBonus, 12); // Maksimum 12 satır
    
    console.log(`📋 Level ${currentLevel} için ${initialRows} satır doldurulacak (${baseRows} + ${levelBonus})`);
    
    // Pattern'li grid oluştur
    grid = createPatternGrid(currentLevel, initialRows, COLS);

    updateScore();
    spawnBubbles();
    gameState = 'playing';
    
    // Level bilgisini UI'de göster
    console.log(`✅ Oyun başarıyla başlatıldı - Level: ${currentLevel}, Lava Stok: ${lavaStock}, Power-ups:`, powerUpStock);
    console.log(`🔍 startGame BİTİŞ: gameState="${gameState}", grid satır sayısı=${grid.filter(r => r.some(b => b)).length}`);
    console.log(`🔧 Bubble state temizlendi - currentBubble: ${currentBubble}, nextBubble: ${nextBubble}`);
    
    // Reklam butonunu göster
    showAdRewardButton();
    
    // Power Ball Bar'ı başlat ve senkronize et
    initPowerBallBar();
    
    // 🔥 CRITICAL: İlk oyun state'ini HEMEN kaydet (reklam sonrası geri yüklemek için)
    // setTimeout KULLANMA - reklam çok hızlı yüklenebilir!
    if (typeof saveInitialGameState === 'function') {
        saveInitialGameState();
        console.log('💾 [START] Initial game state saved immediately');
    }
    
    // Splash sonrası oyun başlar başlamaz müziği başlat
    try { bgmManager.ensureStarted(); } catch (e) { console.warn(e); }
    
    // Game loop'u başlat
    requestAnimationFrame(gameLoop);
    console.log('🎮 Game loop başlatıldı');
    // Start aim animation (now integrated with game loop)
    try { startAimAnimation(); } catch(_) {}
}

// Oyun sonu veya menüden güvenli yeniden başlatma
function restartGame() {
    try {
        console.log('🔄 restartGame() called');
    } catch (_) {}
    
    // ÖNCE gameState'i değiştir ki auto-unblock sistemi müdahale etmesin
    try { gameState = 'idle'; } catch (_) {}
    
    // Oyun durumu temizle
    try { savedGameState = null; } catch (_) {}
    try { canContinueWithAd = false; } catch (_) {}
    
    try { forceHideEndScreen(); } catch (_) {}
    try { const startScreen = document.getElementById('startScreen'); if (startScreen) startScreen.style.display = 'none'; } catch (_) {}
    try {
        const levelOverlay = document.getElementById('levelCompleteOverlay');
        if (levelOverlay) { levelOverlay.remove(); console.log('🧹 levelCompleteOverlay removed'); }
    } catch (_) {}
    
    // Efekt ve geçici durumları sıfırla
    try { freezeTimeLeft = 0; } catch (_) {}
    try { isSlowMotion = false; } catch (_) {}
    try { aimPath = []; } catch (_) {}
    try { fallingBubbles = []; } catch (_) {}
    try { particles = []; } catch (_) {}
    
    // HUD görünür olsun
    try { const gameHUD = document.getElementById('gameHUD'); if (gameHUD) { gameHUD.style.display = 'block'; console.log('🎛️ HUD shown'); } } catch (_) {}
    
    try { console.log('🚀 calling startGame() from restartGame'); } catch (_) {}
    startGame();
}

// Game over sonrası aynı oyunu anında sürdür (grid ve skor korunur)
function resumeAfterGameOver() {
    try { console.log('⏯️ resumeAfterGameOver() called'); } catch (_) {}
    try { forceHideEndScreen(); } catch (_) {}
    try { canContinueWithAd = false; } catch (_) {}
    // Eğer balonlar mevcut değilse atış için yeni balon üret
    try {
        if (!currentBubble || !nextBubble) {
            spawnBubbles();
            console.log('🎯 spawnBubbles() called for resume');
        }
    } catch (_) {}
    try { gameState = 'playing'; } catch (_) {}
    try { requestAnimationFrame(gameLoop); console.log('🎮 Game loop resumed'); } catch (_) {}
    return true;
}

// End ekranını kesin olarak gizle/kaldır
function forceHideEndScreen() {
    try {
        const endScreen = document.getElementById('endScreen');
        if (!endScreen) {
            console.log('🧹 endScreen element not found');
            return;
        }
        
        // Agresif gizleme - ama DOM'dan kaldırma
        endScreen.style.display = 'none';
        endScreen.classList.remove('show');
        endScreen.style.pointerEvents = 'none';
        endScreen.style.visibility = 'hidden';
        endScreen.style.opacity = '0';
        endScreen.style.zIndex = '-1';
        
        console.log('🧹 endScreen aggressively hidden');
        
        // DOM'dan kaldırmak yerine sadece gizle
        // setTimeout(() => {
        //     try {
        //         const cs = getComputedStyle(endScreen);
        //         if (cs.display !== 'none' || cs.pointerEvents !== 'none') {
        //             endScreen.remove();
        //             console.log('🧹 endScreen removed (forced)');
        //         }
        //     } catch (_) {}
        // }, 50);
    } catch (e) {
        console.log('🧹 forceHideEndScreen error:', e);
    }
}

function initializeNextLevel() {
    console.log(`🎮 [LEVEL] Initializing level ${currentLevel}...`);
    
    // 🔥 HER LEVEL BAŞINDA CANVAS'I CANLI PENCEREDEN TAZELE
    // (Bayat _initialGameState snapshot'ı KULLANMA -> çözünürlük düşmesi/HUD kayması yok.)
    if (_initialGameState) {
        // Grid layout değerlerini bellek state'inden geri yükle (reklam boyutu değiştirmez)
        // 🚫 Snapshot'tan boyut yazılmıyor (restoreGameStateAfterAd ile aynı sebep):
        // sync erken çıkarsa bayat değerler yerinde kalıp HUD'u kaydırıyordu.
        // Canvas kutusu tek gerçek kaynak.
        syncCanvasToWindow('level-start');
        _isAdCurrentlyShowing = false;
        console.log(`✅ [LEVEL] Canvas synced: ${logicalWidth}x${logicalHeight}, BUBBLE_RADIUS=${BUBBLE_RADIUS}, COLS=${COLS}`);
    }
    
    // Yeni seviye için grid'i temizle ve yeniden doldur
    grid = [];
    for (let r = 0; r < ROWS; r++) {
        grid[r] = new Array(COLS).fill(null);
    }

    // KRİTİK: Bubble state'ini temizle
    currentBubble = null;
    nextBubble = null;

    // 🎨 PATTERN SİSTEMİ: Seviyeye göre şekilli grid oluştur
    const initialRows = Math.min(6 + Math.floor(currentLevel / 3), 10);
    grid = createPatternGrid(currentLevel, initialRows, COLS);
    
    // Oyun durumunu sıfırla ama seviyeyi koru
    combo = 1;
    shotsSinceShift = 0;
    fallingBubbles = [];
    particles = [];
    
    // Canvas will be cleared in gameLoop
}

// Seviye geçiş ekranı
function showLevelCompleteScreen() {
    gameState = 'levelcomplete';

    // 📊 Ölçüm: bölüm hunisinin çıkışı. level_start ile birlikte hangi
    // bölümde oyuncu kaybedildiğini gösterir.
    const levelDurationSec = window.__popgoLevelStartedAt
        ? Math.round((Date.now() - window.__popgoLevelStartedAt) / 1000)
        : 0;
    window.popgoTrack?.('level_complete', {
        level: currentLevel,
        score: score,
        duration_sec: levelDurationSec
    });
    window.popgoSetUserProperty?.('max_level', currentLevel);
    window.popgoMaybeAskForRating?.();
    window.popgoMaybeAskForPush?.();
    
    // Seviye tamamlama ses efekti
    try {
        soundManager.play('levelComplete');
    } catch(e) {
        console.log('Level complete sound not available');
    }
    
    // Policy-safe: Interstitial hazırlığı sadece natural break'ler için, zamanla yapılacak
    // AdMob sınırlaması nedeniyle seviye bitişinde otomatik hazırlık kaldırıldı
    
    // Büyük patlama efekti
    // PERFORMANS: Level complete parçacık sayısını daha da azalt (20+15+10=45 -> 8+6+4=18)
    createParticles(logicalWidth / 2, logicalHeight / 2, '#FFD700', 8, 'explosion');
    createParticles(logicalWidth / 2, logicalHeight / 2, '#FF8C00', 6, 'explosion');
    createParticles(logicalWidth / 2, logicalHeight / 2, '#FFFFFF', 4, 'explosion');
    
    // Yeni level complete modal'ını göster
    showNewLevelCompleteModal();
    hasClaimedChestReward = false; // yeni ödül turu başlıyor

    // Güvenli geçiş: Kullanıcı etkileşimi engellenirse otomatik devam et
    // Modal 1.5s içinde kapanmazsa bir sonraki seviyeye ilerle
    setTimeout(() => {
        if (gameState === 'levelcomplete') {
            try { closeLevelCompleteModal(); } catch (e) { startNextLevelImmediate(); }
        }
    }, 3000);
}

// Yeni level complete modal'ı - özel tasarım
function showNewLevelCompleteModal() {
    // Her seviyede 3 yıldız ver (standart)
    const stars = 3;
    
    // Tamamlanan level (currentLevel zaten artırılmış, bu yüzden -1)
    const completedLevel = currentLevel - 1;
    
    // Skoru formatla (11.1k gibi)
    const formattedScore = formatScoreShort(score);
    
    // Mevcut overlay'i kaldır
    const existingOverlay = document.getElementById('levelCompleteOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Yeni overlay oluştur
    const overlay = document.createElement('div');
    overlay.id = 'levelCompleteOverlay';
    overlay.className = 'level-complete-overlay-new';
    overlay.innerHTML = `
        <div class="level-complete-modal-new">
            <div class="celebration-header">
                <h1 class="level-title-new">SEVİYE ${completedLevel} TAMAMLANDI!</h1>
                <button class="close-btn-new" onclick="closeLevelCompleteModal()">×</button>
            </div>
            
            <div class="stars-display">
                <div class="star-item">⭐</div>
                <div class="star-item">⭐</div>
                <div class="star-item">⭐</div>
            </div>
            
            <div class="score-section">
                <div class="score-label-new">TOPLAM SKOR</div>
                <div class="score-value-new">
                    <span class="score-icon">⚡</span>
                    <span class="score-text">${formattedScore}</span>
                </div>
            </div>
            
            <div class="reward-chest-container">
                <div class="chest-wrapper">
                    <div class="treasure-chest ${Math.random() > 0.5 ? 'golden' : 'silver'}" onclick="openTreasureChest(this)">
                        <svg class="chest-svg" viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <defs>
                                <linearGradient id="chestBodyGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#b36b1c"/>
                                    <stop offset="100%" stop-color="#6b3a0c"/>
                                </linearGradient>
                                <linearGradient id="chestLidGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#c67922"/>
                                    <stop offset="100%" stop-color="#7a4312"/>
                                </linearGradient>
                                <linearGradient id="metalGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#ffe28a"/>
                                    <stop offset="100%" stop-color="#caa243"/>
                                </linearGradient>
                            </defs>
                            <!-- Kasa -->
                            <g class="box">
                                <rect x="20" y="55" width="160" height="65" rx="14" fill="url(#chestBodyGrad)" stroke="#e0b159" stroke-width="5"/>
                                <rect x="20" y="55" width="160" height="18" rx="10" fill="#8b4e14" opacity="0.35"/>
                            </g>
                            <!-- Kapak (animasyonlu) -->
                            <g class="lid">
                                <rect x="20" y="25" width="160" height="40" rx="12" fill="url(#chestLidGrad)" stroke="#e0b159" stroke-width="5"/>
                                <rect x="20" y="25" width="160" height="10" rx="8" fill="#ffefc2" opacity="0.15"/>
                            </g>
                            <!-- Metal şerit ve kilit -->
                            <g class="metal">
                                <rect x="95" y="25" width="10" height="95" fill="url(#metalGrad)"/>
                                <rect x="88" y="78" width="24" height="18" rx="6" fill="url(#metalGrad)" stroke="#9c7a26" stroke-width="2"/>
                                <circle cx="100" cy="87" r="3" fill="#6a540f"/>
                            </g>
                        </svg>
                        <div class="chest-glow"></div>
                    </div>
                    <div class="chest-label">AÇMAK İÇİN DOKUN!</div>
                </div>
            </div>
            
            <div class="action-buttons">
                <button class="next-level-btn" onclick="goToNextLevel()">
                    <span class="btn-icon">▶</span>
                    <span class="btn-text">SONRAKİ SEVİYE</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Debug log
    console.log('✅ Level complete modal oluşturuldu:', {
        modalExists: !!document.getElementById('levelCompleteOverlay'),
        modalClassList: overlay.classList.toString(),
        zIndex: overlay.style.zIndex || getComputedStyle(overlay).zIndex
    });
    
    // Animasyon için CSS sınıfını ekle
    setTimeout(() => {
        overlay.classList.add('show');
        console.log('🎯 Level complete modal gösterildi, show class eklendi');
    }, 100);
}

// Sandık açma animasyonu
function openTreasureChest(chestElement) {
    if (chestElement.classList.contains('opened')) return;
    if (hasClaimedChestReward) return; // her levelde tek ödül
    
    chestElement.classList.add('opened');
    
    // Altın parçacık animasyonu
    createGoldParticles(chestElement);
    
    // Ses efekti (varsa)
    if (typeof playSound === 'function') {
        playSound('chestOpen');
    }
    
    // Ödül göster
    setTimeout(() => {
        showChestReward(chestElement);
    }, 500);
}

// Global scope'a export et (inline onclick için gerekli)
window.openTreasureChest = openTreasureChest;

// Altın parçacık efekti
function createGoldParticles(centerElement) {
    const rect = centerElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'gold-particle';
        particle.innerHTML = '💰';
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        
        const angle = (i / 12) * Math.PI * 2;
        const distance = 100 + Math.random() * 50;
        const endX = centerX + Math.cos(angle) * distance;
        const endY = centerY + Math.sin(angle) * distance;
        
        particle.style.setProperty('--endX', (endX - centerX) + 'px');
        particle.style.setProperty('--endY', (endY - centerY) + 'px');
        
        document.body.appendChild(particle);
        
        // Animasyon başlat
        setTimeout(() => {
            particle.style.animation = 'goldExplosion 1s ease-out forwards';
        }, i * 50);
        
        // Temizle
        setTimeout(() => {
            particle.remove();
        }, 1500);
    }
}

// Sandık ödülünü göster
function showChestReward(chestElement) {
    // Rastgele bir powerball ver (bomb, laser, fireball, verticalLaser, freeze, rainbow)
    const powerTypes = ['bomb', 'laser', 'fireball', 'verticalLaser', 'freeze', 'rainbow'];
    const type = powerTypes[Math.floor(Math.random() * powerTypes.length)];
    powerUpStock[type] = (powerUpStock[type] || 0) + 1;
    hasClaimedChestReward = true;

    const iconMap = {
        bomb: '💣 Bomba',
        laser: '🔵 Yatay Lazer',
        verticalLaser: '⚡ Dikey Lazer',
        fireball: '🔥 Ateş Topu',
        freeze: '❄️ Dondurucu',
        rainbow: '🌈 Gökkuşağı'
    };
    const reward = iconMap[type] + ' +1';
    
    const rewardDisplay = document.createElement('div');
    rewardDisplay.className = 'chest-reward-display';
    rewardDisplay.innerHTML = `
        <div class="reward-popup">
            <div class="reward-text">+${reward}</div>
        </div>
    `;
    
    chestElement.appendChild(rewardDisplay);
    
    // 2 saniye sonra kaldır
    setTimeout(() => {
        rewardDisplay.remove();
    }, 2000);

    // Alt UI anında güncellensin
    if (typeof drawBottomUI === 'function') {
        // bir frame sonra yeniden çiz
        requestAnimationFrame(() => drawBottomUI());
    }
}

// Skoru kısa formatta göster (11.1k gibi)
function formatScoreShort(score) {
    if (score >= 1000000) {
        return (score / 1000000).toFixed(1) + 'M';
    } else if (score >= 1000) {
        return (score / 1000).toFixed(1) + 'k';
    }
    return score.toString();
}

// Sandık seçimi
function selectChest(index) {
    // Tüm sandıkların seçimini kaldır
    document.querySelectorAll('.chest-item').forEach(chest => {
        chest.classList.remove('selected');
    });
    
    // Seçilen sandığı işaretle
    const selectedChest = document.querySelectorAll('.chest-item')[index];
    if (selectedChest) {
        selectedChest.classList.add('selected');
    }
}

// Yıldızları generate et
function generateStarsHTML(starCount) {
    let html = '';
    for (let i = 1; i <= 3; i++) {
        const filled = i <= starCount;
        html += `<div class="star ${filled ? 'filled' : 'empty'}">${filled ? '⭐' : '☆'}</div>`;
    }
    return html;
}

// Ödül sandıklarını generate et
function generateChestRewards(stars) {
    const rewards = [];
    
    // İlk sandık (her zaman var)
    rewards.push({
        type: 'basic',
        label: '💰',
        coins: 50 * stars
    });
    
    // İkinci sandık (2+ yıldızda)
    if (stars >= 2) {
        rewards.push({
            type: 'special',
            label: '🏆',
            coins: 100
        });
    }
    
    return rewards;
}

// Level complete modal'ını kapat
function closeLevelCompleteModal() {
    debugLog('gameplay', '🔄 closeLevelCompleteModal çağrıldı');
    const overlay = document.getElementById('levelCompleteOverlay');
    if (overlay) {
        debugLog('gameplay', '✅ Level complete overlay bulundu, kapatılıyor');
        overlay.classList.remove('show');
        // Sandık tıklanmadıysa otomatik powerball hediye et
        if (!hasClaimedChestReward) {
            const types = ['bomb','laser','verticalLaser','fireball','freeze','rainbow'];
            const t = types[Math.floor(Math.random() * types.length)];
            powerUpStock[t] = (powerUpStock[t] || 0) + 1;
            hasClaimedChestReward = true;
            debugLog('gameplay', `🎁 Otomatik ödül: ${t} +1`);
        }
        // Modaldan SONRA yeni seviye başlat
        setTimeout(async () => {
            overlay.remove();
            
            // ❌ REKLAM KONTROLÜ KALDIRILDI
            // Reklam kontrolü startNextLevelImmediate() içinde yapılıyor
            // Burada tekrar kontrol yapmaya gerek yok
            
            console.log(`✅ Level complete modal kapatıldı, yeni seviye başlatılıyor...`);
            
            // Eski reklam sistemi temizlendi
            if (typeof adManager !== 'undefined') {
                adManager.pendingInterstitialAfterModal = false;
            }
            
            // Yeni seviyeyi başlat (reklam kontrolü orada yapılacak)
            startNextLevelImmediate();
        }, 150);
    } else {
        // Overlay yoksa da güvenli geçiş yap
        if (!hasClaimedChestReward) {
            const types = ['bomb','laser','verticalLaser','fireball','freeze','rainbow'];
            const t = types[Math.floor(Math.random() * types.length)];
            powerUpStock[t] = (powerUpStock[t] || 0) + 1;
            hasClaimedChestReward = true;
            console.log(`🎁 Otomatik ödül: ${t} +1`);
        }
        
        (async () => {
            // Reklam göstermeyi dene ama oyun akışını bloklamadan
            if (typeof adManager !== 'undefined' && adManager.pendingInterstitialAfterModal) {
                console.log('🎯 Modal sonrası interstitial tetikleniyor (interval korunur) ...');
                try {
                    await adManager.showInterstitialAd();
                } catch (e) {
                    if (DEBUG_FLAGS.ads) {
                        console.error('❌ Modal sonrası interstitial gösterilemedi:', e);
                    }
                } finally {
                    adManager.pendingInterstitialAfterModal = false;
                }
            }
            
            // Reklam başarılı olsun veya olmasın, oyun devam etmeli
            startNextLevelImmediate();
        })();
    }
}

// Sonraki seviyeye git
function goToNextLevel() {
    // Ödülleri topla (görsel)
    const chests = document.querySelectorAll('.reward-chest');
    chests.forEach(chest => {
        const coins = chest.classList.contains('basic') ? 50 : 100;
        showCoinReward(coins);
    });
    // Anında yeni seviyeye geç
    closeLevelCompleteModal();
}

// Global scope'a export et (inline onclick için gerekli)
window.goToNextLevel = goToNextLevel;

// Seviye geçişini beklemeden, anında başlat
function startNextLevelImmediate() {
    // Önce canvas'ı temizle (eski frame'in kalmaması için)
    try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    } catch (e) {}
    
    // 🎯 Interstitial Ad Logic - Her 2 levelde bir göster
    const interval = (ADMOB_CONFIG && ADMOB_CONFIG.settings && ADMOB_CONFIG.settings.interstitialInterval) ? ADMOB_CONFIG.settings.interstitialInterval : 2;
    const shouldShowInterstitial = interval > 0 && (currentLevel % interval === 0)
        && AD_GATE.canShowInterstitial('level-' + currentLevel);
    
    if (shouldShowInterstitial && window.AD_MEDIATION) {
        console.log(`🎯 [INTERSTITIAL] Level ${currentLevel} - Showing interstitial ad...`);
        
        // Asenkron olarak reklam göster, ama level geçişini engelleme
        AD_MEDIATION.showAdWithFallback('interstitial').catch(err => {
            console.warn('⚠️ [INTERSTITIAL] Failed to show, continuing:', err);
        });
    } else {
        console.log(`⏭️ [INTERSTITIAL] Level ${currentLevel} - Skipping interstitial`);
    }
    
    // NOT: currentLevel zaten level geçiş kontrolünde artırıldı, burada tekrar artırma!
    
    // Grid ve state'i yeni seviyeye hazırla
    initializeNextLevel();
    spawnBubbles();
    updateScore();
    gameState = 'playing';
    
    // Game loop'u yeniden başlat (eğer durmuşsa)
    requestAnimationFrame(gameLoop);
    debugLog('gameplay', '🎮 Yeni seviye başlatıldı - Level:', currentLevel);

    // 📊 Ölçüm: bölüm hunisinin girişi
    window.__popgoLevelStartedAt = Date.now();
    window.popgoTrack?.('level_start', { level: currentLevel });
}

// Coin ödülü animasyonu
function showCoinReward(amount) {
    // Basit coin kazanma animasyonu
    console.log(`💰 ${amount} coin kazandınız!`);
    // Burada coin sayısını artırabilirsiniz
}

// ========== DAILY BONUS SİSTEMİ ==========

// Daily bonus verilerini local storage'dan al veya varsayılan oluştur
function getDailyBonusData() {
    const saved = localStorage.getItem('dailyBonusData');
    if (saved) {
        return JSON.parse(saved);
    }
    
    // Varsayılan daily bonus verisi
    return {
        lastClaimDate: null,
        currentDay: 1,
        consecutiveDays: 0,
        claimedToday: false,
        totalCoins: 0
    };
}

// Daily bonus verisini kaydet
function saveDailyBonusData(data) {
    localStorage.setItem('dailyBonusData', JSON.stringify(data));
}

// 7 günlük bonus çizelgesi (tek hediye, oyunda var olan power-up'lar)
// type: 'powerup' | 'lava'
const DAILY_REWARDS = [
    { day: 1, type: 'powerup', key: 'bomb',      icon: '💣',   title: 'Bomba +1' },
    { day: 2, type: 'powerup', key: 'laser',     icon: '🔷',   title: 'Lazer +1' },
    { day: 3, type: 'powerup', key: 'freeze',    icon: '❄️',   title: 'Dondurucu +1' },
    { day: 4, type: 'powerup', key: 'rainbow',   icon: '🌈',   title: 'Gökkuşağı +1' },
    { day: 5, type: 'powerup', key: 'verticalLaser', icon: '⚡',   title: 'Dikey Lazer +1' },
    { day: 6, type: 'powerup', key: 'fireball',  icon: '🔥',   title: 'Ateş Topu +1' },
    { day: 7, type: 'lava',                      icon: '🌋',   title: 'Lava Balonu +1' }
];

// Daily bonus ekranını göster - resim stiline uygun
function showDailyBonusScreen() {
    const data = getDailyBonusData();
    const levelData = getLevelSelectionData(); // Progress bar için
    const today = new Date().toDateString();
    
    // Günlük kontrol - eğer yeni gün ise sıfırla
    if (data.lastClaimDate !== today) {
        if (data.lastClaimDate) {
            const lastDate = new Date(data.lastClaimDate);
            const currentDate = new Date(today);
            const dayDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (dayDiff === 1) {
                // Ardışık gün
                data.consecutiveDays++;
                data.currentDay = Math.min(data.currentDay + 1, 7);
            } else if (dayDiff > 1) {
                // Seri koptu, sıfırla
                data.consecutiveDays = 0;
                data.currentDay = 1;
            }
        } else {
            // İlk kez
            data.consecutiveDays = 0;
            data.currentDay = 1;
        }
        data.claimedToday = false;
    }
    
    // Mevcut overlay'i kaldır
    const existingOverlay = document.getElementById('dailyBonusOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Yeni overlay oluştur
    const overlay = document.createElement('div');
    overlay.id = 'dailyBonusOverlay';
    overlay.className = 'game-daily-overlay';
    overlay.innerHTML = `
        <div class="game-daily-modal">
            <!-- Progress Bar Üstte -->
            <div class="daily-progress-header">
                <div class="progress-bubbles">
                    <span class="bubble red">🔴</span>
                    <span class="bubble yellow">🟡</span>
                </div>
                <div class="progress-text">200 balon patlat!</div>
                <div class="progress-reward">💰</div>
            </div>
            
            <!-- Daily Bonus Title -->
            <div class="daily-title-section">
                <div class="daily-bonus-title">Günlük Ödül</div>
            </div>
            
            <!-- 2x3 Grid (6 gün) -->
            <div class="daily-rewards-grid">
                ${generateDailyRewardsHTML(data, false)}
            </div>
            
            <!-- Day 7 Special -->
            <div class="daily-day7">
                ${generateDay7HTML(data)}
            </div>
            
            <!-- Main Claim Buttons -->
            <div class="main-claim-section">
                <button class="main-claim-btn normal-claim ${!data.claimedToday && data.currentDay <= 7 ? '' : 'disabled'}" 
                        onclick="claimDailyBonus(false)" 
                        ${data.claimedToday || data.currentDay > 7 ? 'disabled' : ''}>
                    <span class="btn-icon">🎁</span>
                    <span class="btn-text">ÖDÜLÜ AL</span>
                </button>
                
                <button class="main-claim-btn ad-claim ${!data.claimedToday && data.currentDay <= 7 ? '' : 'disabled'}" 
                        onclick="claimDailyBonus(true)" 
                        ${data.claimedToday || data.currentDay > 7 ? 'disabled' : ''}>
                    <span class="btn-icon">📹</span>
                    <span class="btn-text">2X REKLAM İZLE</span>
                    <span class="btn-badge">+%100</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Animasyon için CSS sınıfını ekle
    setTimeout(() => overlay.classList.add('show'), 100);
}

// Daily rewards grid HTML generate et (ilk 6 gün)
function generateDailyRewardsHTML(data, includeDay7 = false) {
    let html = '';
    const endDay = includeDay7 ? 7 : 6;
    
    for (let i = 0; i < endDay; i++) {
        const reward = DAILY_REWARDS[i];
        const dayNum = i + 1;
        const isToday = dayNum === data.currentDay;
        const isClaimed = dayNum < data.currentDay || (isToday && data.claimedToday);
        
        let dayClass = 'daily-reward-item';
        let dayLabel = '';
        
        if (isToday && !data.claimedToday) {
            dayClass += ' today';
            dayLabel = 'BUGÜN';
        } else {
            dayClass += ' normal';
            dayLabel = `${dayNum}. GÜN`;
        }
        
        if (isClaimed) {
            dayClass += ' claimed';
        }
        
        html += `
            <div class="${dayClass}">
                <div class="day-header">${dayLabel}</div>
                <div class="reward-icon">${reward.icon}</div>
                <div class="reward-amount">${reward.title}</div>
            </div>
        `;
    }
    
    return html;
}

// Day 7 özel HTML
function generateDay7HTML(data) {
    const reward = DAILY_REWARDS[6]; // Day 7
    const isToday = data.currentDay === 7;
    const isClaimed = data.currentDay > 7 || (isToday && data.claimedToday);
    
    let dayClass = 'daily-day7-item';
    let dayLabel = '7. GÜN';
    
    if (isToday && !data.claimedToday) {
        dayClass += ' today';
        dayLabel = 'BUGÜN';
    }
    
    if (isClaimed) {
        dayClass += ' claimed';
    }
    
    return `
        <div class="${dayClass}">
            <div class="day7-header">${dayLabel}</div>
            <div class="day7-rewards">
                <div class="day7-item">${reward.icon}</div>
                <div class="day7-title">${reward.title}</div>
            </div>
        </div>
    `;
}

// Reward video göster
async function showRewardVideo(rewardCallback) {
    try {
        console.log('📹 Reward video gösteriliyor...');
        
        // Store callback globally for Unity event listeners
        if (rewardCallback && typeof rewardCallback === 'function') {
            window._pendingRewardCallback = rewardCallback;
            console.log('🎁 [REWARD] Callback stored globally for Unity events');
        }
        
        // Use AD_MEDIATION system for unified reward video handling
        if (window.AD_MEDIATION) {
            console.log('🎯 [REWARD] Using AD_MEDIATION system...');
            
            // Define reward callback
            let rewardGranted = false;
            const onRewarded = () => {
                console.log('✅ [REWARD] User earned reward!');
                rewardGranted = true;
                // Call external reward callback if provided
                if (rewardCallback && typeof rewardCallback === 'function') {
                    try {
                        rewardCallback();
                    } catch (e) {
                        console.error('❌ Reward callback error:', e);
                    }
                }
            };
            
            try {
                // 🔥 Unity event listener'ı Promise wrapper içinde bekle
                const unityEventPromise = new Promise((resolve) => {
                    const unityEventHandler = (event) => {
                        console.log('🎯 [UNITY EVENT] unityRewardedComplete fired:', event.detail);
                        if (event.detail && event.detail.rewarded) {
                            onRewarded();
                        }
                        // Listener'ı temizle
                        window.removeEventListener('unityRewardedComplete', unityEventHandler, true);
                        resolve(true);
                    };
                    // 🔥 Capture phase kullan (3. parametre = true) - global listener'dan ÖNCE çalışır
                    window.addEventListener('unityRewardedComplete', unityEventHandler, true);
                    
                    // 10 saniye timeout
                    setTimeout(() => {
                        window.removeEventListener('unityRewardedComplete', unityEventHandler, true);
                        resolve(false);
                    }, 10000);
                });
                
                // Try to show rewarded ad with Unity → AdMob fallback
                const result = await AD_MEDIATION.showAdWithFallback('rewarded', { onRewarded });
                console.log('✅ [REWARD] Ad mediation result:', result);
                
                // Unity kullanıldıysa event'i bekle
                if (result && result.network === 'unity') {
                    console.log('⏳ [UNITY] Waiting for reward event...');
                    await unityEventPromise;
                }
                
                // Check if reward was granted
                return result && (result.success || result.rewarded || rewardGranted);
                
            } catch (mediationError) {
                console.warn('⚠️ [REWARD] Mediation failed, trying direct methods:', mediationError);
                // Fall through to direct methods
            }
        }
        
        // Fallback: Try Unity Ads via Bridge
        if (window.UnityAdsBridge && window.UnityAdsBridge.isNativeReady) {
            try {
                console.log('🎮 [UNITY] Attempting Unity Ads via Bridge...');
                
                const platform = window.Capacitor?.getPlatform?.() === 'ios' ? 'ios' : 'android';
                const placementId = platform === 'ios' ? 'Rewarded_iOS' : 'Rewarded_Android';
                
                // 🔥 Bridge üzerinden git ki event dispatch çalışsın
                const result = await window.UnityAdsBridge.showRewarded(placementId);
                console.log('✅ [UNITY] Bridge reward result:', result);
                
                // Bridge her zaman { success: true, rewarded: true } döner ve event dispatch eder
                return true;
            } catch (unityError) {
                console.warn('⚠️ [UNITY] Bridge call failed, trying AdMob:', unityError);
                // Fall through to AdMob
            }
        }
        
        // Last resort: Try AdMob directly
        const AdMob = window.Capacitor?.Plugins?.AdMob;
        
        if (!AdMob) {
            console.error('❌ No ad network available for reward video');
            return false;
        }
        
        console.log('📺 [ADMOB] Showing reward video as last resort');
        
        const isIOS = window.Capacitor?.getPlatform?.() === 'ios';
        const platform = isIOS ? 'ios' : 'android';
        const rewardedAdId = ADMOB_CONFIG.getAdId('rewarded', platform);
        const isTesting = ADMOB_CONFIG.testMode;
        
        console.log(`📹 Reward video ID: ${rewardedAdId}`);
        console.log(`📱 Platform: ${platform}`);
        
        try {
            // ÖNEMLİ: @capacitor-community/admob'un gerçek metod isimleri
            // prepareRewardVideoAd/showRewardVideoAd'dir (prepareRewardedAd/
            // showRewardedAd DEĞİL — bu isimler eklentide yok, bu yüzden
            // "is not a function" hatası veriyordu).
            await AdMob.prepareRewardVideoAd({
                adId: rewardedAdId,
                isTesting: isTesting
            });

            console.log('✅ AdMob reward video prepared');

            const result = await AdMob.showRewardVideoAd();
            console.log('✅ AdMob reward video shown:', result);
            
            // Reklam gösterildikten sonra bir sonraki için yükle
            setTimeout(() => preloadRewardVideo(), 2000);
            
            return true;
        } catch (adError) {
            console.error('❌ AdMob reward video error:', adError);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Reward video hatası:', error);
        return false;
    } finally {
        // Her durumda sonraki reklam için yükle
        setTimeout(() => preloadRewardVideo(), 3000);
    }
}

// Show interstitial ad (geçiş reklamı)
async function showInterstitialAd() {
    try {
        console.log('📺 Interstitial reklam gösteriliyor...');
        
        // Get AdMob from Capacitor Plugins
        const AdMob = window.Capacitor?.Plugins?.AdMob;
        
        if (!AdMob) {
            console.error('❌ AdMob SDK bulunamadı!');
            console.error('🔍 Capacitor:', !!window.Capacitor);
            console.error('🔍 Plugins:', !!window.Capacitor?.Plugins);
            console.error('🔍 Available plugins:', Object.keys(window.Capacitor?.Plugins || {}));
            return false;
        }
        
        console.log('✅ AdMob plugin bulundu');
        
        const platform = window.Capacitor?.getPlatform?.();
        const adId = ADMOB_CONFIG.getAdId('interstitial', platform);
        const isTesting = ADMOB_CONFIG.testMode;
        
        console.log(`📺 Platform: ${platform}, Interstitial ID: ${adId}, Test: ${isTesting}`);
        
        try {
            // Prepare interstitial
            console.log('🔄 Preparing interstitial...');
            await AdMob.prepareInterstitial({
                adId: adId,
                isTesting: isTesting
            });
            
            console.log('✅ Interstitial prepared');
            
            // Show interstitial
            console.log('📺 Showing interstitial...');
            const result = await AdMob.showInterstitial();
            console.log('✅ Interstitial shown:', result);
            
            return true;
        } catch (adError) {
            console.error('❌ Interstitial ad error:', adError);
            console.error('Error details:', adError.message, adError.code);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Interstitial hatası:', error);
        return false;
    }
}

// Daily bonus'u claim et (GLOBAL SCOPE)
window.claimDailyBonus = async function(watchAd = false) {
    const data = getDailyBonusData();
    const today = new Date().toDateString();
    
    if (data.claimedToday) {
        console.log('Bugün zaten ödül alındı!');
        return;
    }
    
    const reward = DAILY_REWARDS[data.currentDay - 1];
    if (!reward) return;
    
    let multiplier = 1;
    
    // Reklam izleme seçeneği
    if (watchAd && window.Capacitor?.isNativePlatform?.()) {
        console.log('📹 Bonus 2x için reklam gösteriliyor...');
        const adShown = await showRewardVideo();
        
        if (adShown) {
            multiplier = 2;
            console.log('✅ Reklam izlendi, bonus 2x!');
        } else {
            console.warn('⚠️ Reklam gösterilemedi, normal bonus veriliyor');
        }
    }
    
    // Ödülü ver (sadece oyunda var olan power-uplar ve lava)
    if (reward.type === 'powerup') {
        const key = reward.key;
        powerUpStock[key] = (powerUpStock[key] || 0) + (1 * multiplier);
    } else if (reward.type === 'lava') {
        lavaStock += (1 * multiplier);
    }
    
    data.claimedToday = true;
    data.lastClaimDate = today;
    
    // Veritabanını güncelle
    saveDailyBonusData(data);
    
    // Ödül animasyonu göster
    showDailyRewardAnimation(reward, multiplier);
    
    // Modal'ı güncelle
    setTimeout(() => {
        closeDailyBonusModal();
    }, 1500);
    
    console.log(`🎉 Gün ${data.currentDay} ödülü verildi: ${reward.title} x${multiplier}`);
};

// Daily reward animasyonu
window.showDailyRewardAnimation = function(reward, totalCoins) {
    const claimButton = document.querySelector('.claim-button');
    if (claimButton) {
        claimButton.textContent = 'TOPLANDI!';
        claimButton.disabled = true;
        claimButton.classList.add('claimed');
        
        // Basit ikon animasyonu
        showCoinBurstAnimation(claimButton, 6);
    }
};

// Coin patlaması animasyonu
window.showCoinBurstAnimation = function(element, amount) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Çoklu coin animasyonu oluştur
    for (let i = 0; i < 8; i++) {
        const coin = document.createElement('div');
        coin.className = 'coin-animation';
        coin.innerHTML = '💰';
        coin.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY}px;
            font-size: 24px;
            pointer-events: none;
            z-index: 10000;
            animation: coinFly 1s ease-out forwards;
            animation-delay: ${i * 0.1}s;
        `;
        
        // Random yön
        const angle = (360 / 8) * i;
        const distance = 100 + Math.random() * 50;
        const x = Math.cos(angle * Math.PI / 180) * distance;
        const y = Math.sin(angle * Math.PI / 180) * distance;
        
        coin.style.setProperty('--endX', `${x}px`);
        coin.style.setProperty('--endY', `${y}px`);
        
        document.body.appendChild(coin);
        
        // Temizle
        setTimeout(() => coin.remove(), 1000 + (i * 100));
    }
};

// Daily bonus modal'ını kapat
window.closeDailyBonusModal = function() {
    const overlay = document.getElementById('dailyBonusOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
};

// Günlük ödül sistemi senaryosu
function implementRewardSystem() {
    // Günlük ödüller:
    // 1. Coin ödülleri - oyunculara ekstra coin verir
    // 2. Bomb ödülleri - bombalar inventory'e eklenir  
    // 3. Mystery Box ödülleri - random özel öğeler
    // 4. Day 7 özel ödül - 3x mystery box (mega ödül)
    
    console.log('🎁 Günlük ödül sistemi aktif');
    console.log('📋 Ödül senaryosu:');
    console.log('- Gün 1-2: Coin ödülleri (oyuncuya ekstra para)');
    console.log('- Gün 3: Bomb + coin (özel güç)');
    console.log('- Gün 4: Daha fazla coin');
    console.log('- Gün 5-6: Mystery box (rastgele ödül sandıkları)');
    console.log('- Gün 7: 3x Mystery box (mega haftalık ödül)');
}

// ========== GAME MODE SELECTION ==========

// Oyun modu seçim ekranını göster
function showGameModeSelection() {
    // Mevcut overlay'i kaldır
    const existingOverlay = document.getElementById('gameModeOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Yeni overlay oluştur
    const overlay = document.createElement('div');
    overlay.id = 'gameModeOverlay';
    overlay.className = 'game-mode-overlay';
    overlay.innerHTML = `
        <div class="game-mode-modal">
            <div class="mode-header">
                <h2 class="mode-title">Oyun Modu Seçin</h2>
            </div>
            
            <div class="mode-options">
                <div class="mode-card classic" onclick="selectGameMode('classic')">
                    <div class="mode-icon">🎯</div>
                    <div class="mode-name">Klasik Mod</div>
                    <div class="mode-desc">Standart balon patlatma oyunu</div>
                </div>
                
                <div class="mode-card challenge" onclick="selectGameMode('challenge')">
                    <div class="mode-icon">⚡</div>
                    <div class="mode-name">Meydan Okuma</div>
                    <div class="mode-desc">Zor seviyeler ve özel hedefler</div>
                </div>
                
                <div class="mode-card endless" onclick="selectGameMode('endless')">
                    <div class="mode-icon">∞</div>
                    <div class="mode-name">Sonsuz Mod</div>
                    <div class="mode-desc">Hiç bitmeyen balon eğlencesi</div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Animasyon için CSS sınıfını ekle
    setTimeout(() => overlay.classList.add('show'), 100);
}

// Oyun modu seç
function selectGameMode(mode) {
    console.log(`🎮 Seçilen oyun modu: ${mode}`);
    
    // Mode'u kaydet
    localStorage.setItem('selectedGameMode', mode);
    
    // Game mode modal'ını kapat
    const overlay = document.getElementById('gameModeOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.remove();
            console.log(`🗺️ Level selection açılıyor...`);
            // Level selection'ı göster
            showLevelSelectionScreen();
        }, 400); // Biraz daha uzun süre ver
    } else {
        console.log(`⚠️ Game mode overlay bulunamadı!`);
        // Doğrudan level selection'ı aç
        showLevelSelectionScreen();
    }
}

// Oyun başlangıcında daily bonus kontrolü yap
function checkDailyBonusAvailable() {
    const data = getDailyBonusData();
    const today = new Date().toDateString();
    
    if (data.lastClaimDate !== today && !data.claimedToday) {
        // Yeni bonus mevcut - direkt tam ekran modal aç
        setTimeout(() => {
            showDailyBonusScreen();
        }, 500); // kısa gecikme ile aç
    }
}

// Daily bonus bildirimi göster
function showDailyBonusNotification() {
    // Bildirim gösterme yerine direkt tam ekran modal aç
    showDailyBonusScreen();
}

// ========== LEVEL SELECTION SCREEN ==========

// Level selection verisini al veya oluştur
function getLevelSelectionData() {
    const saved = localStorage.getItem('levelSelectionData');
    if (saved) {
        return JSON.parse(saved);
    }
    
    return {
        maxLevel: 1,
        bubblesPopped: 0,
        totalCoins: 320,
        livesRemaining: 'unlimited'
    };
}

// Level selection verisini kaydet
function saveLevelSelectionData(data) {
    localStorage.setItem('levelSelectionData', JSON.stringify(data));
}

// Level selection ekranını göster
function showLevelSelectionScreen() {
    console.log(`🗺️ showLevelSelectionScreen() çağrıldı`);
    const data = getLevelSelectionData();
    console.log(`📊 Level selection data:`, data);
    
    // Mevcut overlay'i kaldır
    const existingOverlay = document.getElementById('levelSelectionOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Yeni overlay oluştur
    const overlay = document.createElement('div');
    overlay.id = 'levelSelectionOverlay';
    overlay.className = 'level-selection-overlay';
    overlay.innerHTML = `
        <div class="level-selection-screen">
            <!-- Üst Bar -->
            <div class="top-bar-selection">
                <div class="lives-display">
                    <span class="lives-icon">❤️</span>
                    <span class="lives-text">${data.livesRemaining === 'unlimited' ? 'SINIRSIZ' : data.livesRemaining}</span>
                </div>
                <div class="coins-display">
                    <span class="coins-icon">💰</span>
                    <span class="coins-amount">${data.totalCoins}</span>
                    <button class="add-coins-btn">+</button>
                </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="progress-section">
                <div class="progress-header">
                    <div class="progress-icons">
                        <span class="bubble-icon">🔴</span>
                        <span class="bubble-icon">🟡</span>
                    </div>
                    <div class="progress-text">200 balon patlat!</div>
                    <div class="progress-reward">
                        <span class="reward-icon">💰</span>
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(data.bubblesPopped / 200) * 100}%"></div>
                    </div>
                    <div class="progress-counter">${data.bubblesPopped}/200</div>
                </div>
                <div class="progress-timer">
                    <span class="timer-icon">⏰</span>
                    <span class="timer-text">05:59:02</span>
                </div>
            </div>
            
            <!-- Sol Sidebar -->
            <div class="left-sidebar">
                <button class="sidebar-btn shop-btn" onclick="showShopModal()">
                    <div class="btn-icon">🛒</div>
                    <div class="btn-label">MAĞAZA</div>
                </button>
                <button class="sidebar-btn map-btn" onclick="showMapModal()">
                    <div class="btn-icon">🗺️</div>
                    <div class="btn-label">HARİTA</div>
                </button>
                <button class="sidebar-btn daily-btn" onclick="showDailyBonusScreen()">
                    <div class="btn-icon">🎁</div>
                </button>
            </div>
            
            <!-- Sağ Sidebar -->
            <div class="right-sidebar">
                <button class="sidebar-btn special-btn">
                    <div class="btn-icon">🎲</div>
                </button>
                <button class="sidebar-btn treasure-btn">
                    <div class="btn-icon">📦</div>
                </button>
            </div>
            
            <!-- Level Grid -->
            <div class="level-grid-container">
                <div class="level-path">
                    ${generateLevelPath(data.maxLevel)}
                </div>
            </div>
            
            <!-- Alt Butonlar -->
            <div class="bottom-actions">
                <button class="play-button" onclick="startSelectedLevel()">
                    <span>Seviye ${currentLevel || 1}</span>
                </button>
                <button class="close-selection-btn" onclick="closeLevelSelectionModal()">
                    <span>×</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    console.log(`✅ Level selection overlay DOM'a eklendi, ID: ${overlay.id}`);
    
    // Animasyon için CSS sınıfını ekle
    setTimeout(() => {
        overlay.classList.add('show');
        console.log(`🎬 Level selection animasyonu başlatıldı`);
    }, 100);
}

// Level path'ini oluştur
function generateLevelPath(maxLevel) {
    let html = '';
    const totalLevels = Math.max(10, maxLevel + 3); // En az 10 level göster
    
    for (let i = 1; i <= totalLevels; i++) {
        const isUnlocked = i <= maxLevel;
        const isCurrent = i === currentLevel;
        const isCompleted = i < maxLevel;
        
        let buttonClass = 'level-button';
        let buttonStatus = '';
        
        if (isCurrent) {
            buttonClass += ' current';
            buttonStatus = 'current';
        } else if (isCompleted) {
            buttonClass += ' completed';
            buttonStatus = 'completed';
        } else if (isUnlocked) {
            buttonClass += ' unlocked';
            buttonStatus = 'unlocked';
        } else {
            buttonClass += ' locked';
            buttonStatus = 'locked';
        }
        
        // Seviye pozisyonu (zigzag pattern)
        const row = Math.floor((i - 1) / 3);
        const col = (i - 1) % 3;
        const isReversed = row % 2 === 1;
        const actualCol = isReversed ? 2 - col : col;
        
        html += `
            <div class="level-node ${buttonStatus}" 
                 style="grid-area: ${row + 1} / ${actualCol + 1};"
                 onclick="${isUnlocked ? `selectLevel(${i})` : ''}">
                <div class="${buttonClass}">
                    <div class="level-number">${i}</div>
                    ${isCompleted ? '<div class="level-stars">⭐⭐⭐</div>' : ''}
                    ${isCurrent ? '<div class="level-badge">MEVCUT</div>' : ''}
                    ${!isUnlocked ? '<div class="level-lock">🔒</div>' : ''}
                </div>
                ${i < totalLevels ? '<div class="level-connector"></div>' : ''}
            </div>
        `;
    }
    
    return html;
}

// Level seç
function selectLevel(levelNum) {
    const data = getLevelSelectionData();
    if (levelNum > data.maxLevel) {
        console.log('Bu level henüz kilidi açılmamış!');
        return;
    }
    
    currentLevel = levelNum;
    
    // Seçilen leveli vurgula
    document.querySelectorAll('.level-node').forEach(node => {
        node.classList.remove('selected');
    });
    
    const selectedNode = document.querySelector(`.level-node:nth-child(${levelNum})`);
    if (selectedNode) {
        selectedNode.classList.add('selected');
    }
    
    // Play button'u güncelle
    const playButton = document.querySelector('.play-button');
    if (playButton) {
        playButton.innerHTML = `<span>Seviye ${levelNum}</span>`;
    }
}

// Seçilen leveli başlat
function startSelectedLevel() {
    console.log('🎮 Selected level başlatılıyor: Level', currentLevel);
    closeLevelSelectionModal();
    setTimeout(() => {
        startGame(true); // level selection => fresh start at selected level
    }, 500);
}

// Shop modal göster
// Mağazadaki her power-up'ın coin fiyatı
const SHOP_PRICES = {
    bomb: 50,
    laser: 50,
    freeze: 50,
    rainbow: 70,
    verticalLaser: 70,
    fireball: 80
};

function renderShopModal() {
    const modal = document.querySelector('#shopOverlay .shop-modal');
    if (!modal) return;
    const data = getLevelSelectionData();
    const itemsHTML = Object.keys(SHOP_PRICES).map(type => {
        const price = SHOP_PRICES[type];
        const canAfford = data.totalCoins >= price;
        return `
            <div class="shop-item">
                <div class="shop-item-icon">${getPowerBallEmoji(type)}</div>
                <div class="shop-item-name">${getPowerBallName(type)}</div>
                <div class="shop-item-stock">Stok: ${powerUpStock[type] || 0}</div>
                <button class="shop-buy-btn" ${canAfford ? '' : 'disabled'} onclick="buyShopItem('${type}')">
                    💰 ${price}
                </button>
            </div>`;
    }).join('');

    modal.innerHTML = `
        <div class="shop-header">
            <h2>🛒 Mağaza</h2>
            <button class="shop-close" onclick="closeShopModal()" aria-label="Kapat">✕</button>
        </div>
        <div class="shop-coins"><span>💰</span> <b>${data.totalCoins}</b> coin</div>
        <div class="shop-grid">${itemsHTML}</div>
    `;
}

function buyShopItem(type) {
    const price = SHOP_PRICES[type];
    const data = getLevelSelectionData();
    if (!price || data.totalCoins < price) return;

    data.totalCoins -= price;
    saveLevelSelectionData(data);
    addPowerUp(type, 1);
    try { soundManager.play('combo'); } catch (_) {}

    renderShopModal();
    // Level seçim ekranındaki coin sayacı açıksa onu da güncelle
    const coinsAmountEl = document.querySelector('.coins-amount');
    if (coinsAmountEl) coinsAmountEl.textContent = data.totalCoins;
}

function showShopModal() {
    const existing = document.getElementById('shopOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'shopOverlay';
    overlay.className = 'shop-overlay';
    overlay.innerHTML = '<div class="shop-modal"></div>';
    document.body.appendChild(overlay);
    renderShopModal();
    setTimeout(() => overlay.classList.add('show'), 10);
}

function closeShopModal() {
    const overlay = document.getElementById('shopOverlay');
    if (!overlay) return;
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 300);
}

// Harita: ayrı bir ekran yerine level yolunu geçerli/aktif seviyeye kaydırır
// (level yolu zaten ana içerikte gösteriliyor — "harita" oradaki görünümdür)
function showMapModal() {
    const container = document.querySelector('.level-grid-container');
    const activeNode = container?.querySelector('.level-button.current')?.closest('.level-node')
        || container?.querySelector('.level-button.unlocked')?.closest('.level-node');
    if (!container || !activeNode) return;

    activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    activeNode.classList.add('map-highlight');
    setTimeout(() => activeNode.classList.remove('map-highlight'), 1200);
}

// Level selection modal'ını kapat
function closeLevelSelectionModal() {
    const overlay = document.getElementById('levelSelectionOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}

// Progress güncelle (bubblesPopped)
function updateBubblesProgress(count) {
    const data = getLevelSelectionData();
    data.bubblesPopped = Math.min(data.bubblesPopped + count, 200);
    saveLevelSelectionData(data);
    
    // Progress bar'ı güncelle
    const progressFill = document.querySelector('.progress-fill');
    const progressCounter = document.querySelector('.progress-counter');
    
    if (progressFill) {
        progressFill.style.width = `${(data.bubblesPopped / 200) * 100}%`;
    }
    
    if (progressCounter) {
        progressCounter.textContent = `${data.bubblesPopped}/200`;
    }
}

// Level tamamlandığında max level'ı güncelle
function updateMaxLevel(level) {
    const data = getLevelSelectionData();
    data.maxLevel = Math.max(data.maxLevel, level);
    saveLevelSelectionData(data);
}

// Seviye tamamlama animasyonu
function showLevelCompleteAnimation() {
    // Ekran genişliği 500px'den küçükse, metin ve grafik boyutlarını buna orantılı küçült
    const uiScale = Math.min(1.8, logicalWidth / 350); // Küçültüldü
    
    const levelCompleteAnimation = () => {
        // Canvas clear handled by main game loop
        
        // 🌌 Animasyonlu arka plan (nebula + parçacıklar)
        drawAnimatedBackground();
        
        // Parçacıkları güncelle ve render et
        updateParticles();
        drawParticles();
        
        // Arka plan bulanıklığı efekti
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(fadeAlpha, 0.7)})`;
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);
        
        if (animationStep === 'fadein') {
            fadeAlpha += 0.05;
            if (fadeAlpha >= 0.7) {
                animationStep = 'show';
                showDuration = 0;
            }
        } else if (animationStep === 'show') {
            showDuration += 1/60;
            
            // Parlayan arka plan gradienti
            const gradient = ctx.createRadialGradient(
                logicalWidth/2, logicalHeight/2, 0,
                logicalWidth/2, logicalHeight/2, logicalWidth/2
            );
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
            gradient.addColorStop(0.5, 'rgba(255, 140, 0, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, logicalWidth, logicalHeight);
            
            // Yıldız parçacıkları efekti
            for (let i = 0; i < 20; i++) {
                const angle = (Date.now() / 1000 + i * 0.3) % (Math.PI * 2);
                const radius = 150 + Math.sin(Date.now() / 500 + i) * 50;
                const x = logicalWidth/2 + Math.cos(angle) * radius;
                const y = logicalHeight/2 + Math.sin(angle) * radius;
                const size = 3 + Math.sin(Date.now() / 200 + i) * 2;
                
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Ana başlık - büyük ve parlak
            const titleScale = 1 + Math.sin(Date.now() / 300) * 0.1;
            ctx.save();
            ctx.translate(logicalWidth/2, logicalHeight/2 - 80 * uiScale);
            ctx.scale(titleScale, titleScale);
            
            // Glow efekti
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold ' + (48 * uiScale) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SEVİYE TAMAMLANDI!', 0, 0);
            
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('SEVİYE TAMAMLANDI!', 0, 0);
            ctx.restore();
            
            // Seviye numarası
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold ' + (36 * uiScale) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Seviye ${currentLevel}`, logicalWidth/2, logicalHeight/2 - 20 * uiScale);
            
            // Tebrik mesajı
            ctx.fillStyle = '#FFFFFF';
            ctx.font = (24 * uiScale) + 'px Arial';
            const congratsMessages = [
                'Harika iş!', 'Mükemmel!', 'Süper!', 
                'Fantastik!', 'Bravo!', 'Muhteşem!'
            ];
            const message = congratsMessages[(currentLevel - 1) % congratsMessages.length];
            ctx.fillText(message, logicalWidth/2, logicalHeight/2 + 20 * uiScale);
            
            // İlerleme çubuğu
            const progress = ((currentLevel - 1) % 5) / 5;
            const barWidth = 300 * uiScale;
            const barHeight = 20 * uiScale;
            const barX = logicalWidth/2 - barWidth/2;
            const barY = logicalHeight/2 + 60 * uiScale;
            
            // Çubuk arka planı
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // İlerleme
            const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
            progressGradient.addColorStop(0, '#FFD700');
            progressGradient.addColorStop(1, '#FF8C00');
            ctx.fillStyle = progressGradient;
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            
            // Çubuk çerçevesi
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            // "Devam etmek için dokunun" metni
            const blinkAlpha = 0.5 + Math.sin(Date.now() / 300) * 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`;
            ctx.font = (18 * uiScale) + 'px Arial';
            ctx.fillText('Devam etmek için dokunun', logicalWidth/2, logicalHeight/2 + 120 * uiScale);
            
            // 3 saniye sonra otomatik geçiş
            if (showDuration > 3) {
                animationStep = 'fadeout';
            }
        } else if (animationStep === 'fadeout') {
            fadeAlpha -= 0.05;
            if (fadeAlpha <= 0) {
                // Yeni seviyeye geç
                initializeNextLevel();
                spawnBubbles();
                gameState = 'playing';
                return;
            }
        }
        
        requestAnimationFrame(levelCompleteAnimation);
    };
    
    // Dokunma/tıklama ile erken geçiş
    const skipHandler = (e) => {
        e.preventDefault();
        if (animationStep === 'show') {
            animationStep = 'fadeout';
        }
        canvas.removeEventListener('click', skipHandler);
        canvas.removeEventListener('touchstart', skipHandler);
    };
    
    // Event listener'ları ekle
    setTimeout(() => {
        canvas.addEventListener('click', skipHandler);
        canvas.addEventListener('touchstart', skipHandler);
    }, 1000); // 1 saniye sonra aktif et
    
    levelCompleteAnimation();
}

function drawStars() {
    // Artık nebula + parçacık sistemi kullanılıyor
    // Bu fonksiyon uyumluluk için boş bırakıldı
    // Yeni sistem: drawAnimatedBackground() kullanır
}

// --- STABILIZED GAME LOOP ---
function gameLoop(currentTime = 0) {
    if (gameState !== 'playing' && gameState !== 'levelcomplete') return;
    
    // Prevent multiple loops running simultaneously
    if (gameLoopRunning) return;
    gameLoopRunning = true;
    let shouldContinue = true;
    
    try {
    
    // 🔥 Her frame'de canvas'ın CSS boyutu CANLI pencereyle uyumlu mu?
    // Referans DAİMA canlı pencere (window.innerWidth/Height) - bayat
    // _initialGameState DEĞİL. Eski kod bayat snapshot'a (ör. 878) karşı
    // karşılaştırıp canlı değeri (ör. 932) "bozuk" sanıyor ve her frame
    // restore çağırıyordu -> sonsuz çatışma + HUD kayması. Artık uyumsuzluk
    // varsa canvas canlı pencereye senkronlanır (kendi kendini iyileştirir).
    if (canvas) {
        // GERÇEK render kutusu (CSS ile %100 -> layout viewport) ile oyunun
        // kullandığı logicalWidth/Height hâlâ aynı mı? Kutu değiştiyse
        // (iOS'ta reklam/status-bar sonrası olabiliyor) yeniden senkronla.
        const boxW = canvas.clientWidth, boxH = canvas.clientHeight;
        if (boxW > 100 && boxH > 100 &&
            (Math.abs(boxW - logicalWidth) > 1 || Math.abs(boxH - logicalHeight) > 1)) {
            syncCanvasToWindow('gameloop-guard');
        }
    }

    // One-time first-frame diagnostics and visible marker
    if (!window.__firstLoopLogged) {
        window.__firstLoopLogged = true;
        try {
            console.log(`🎨 First frame: logical=${logicalWidth}x${logicalHeight}, backing=${canvas.width}x${canvas.height}, dpr=${window.devicePixelRatio||1}`);
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,0,0.8)';
            ctx.fillRect(Math.max(0, logicalWidth-12), 2, 10, 10);
            ctx.restore();
        } catch(e) { console.warn('First-frame marker failed:', e); }
    }

    // Simple delta time calculation - no complex smoothing
    if (lastFrameTime === 0) {
        lastFrameTime = currentTime;
        deltaTime = 1/60; // Use fixed timestep for first frame
        realDeltaTime = 1/60;
    } else {
        const rawSec = (currentTime - lastFrameTime) / 1000;
        deltaTime = Math.min(rawSec, 1/30); // Timers/efektler için kısıtlı (değişmedi)
        realDeltaTime = Math.min(rawSec, 0.25); // Mermi için GERÇEK süre (arka plandan dönüşte 0.25s tavan)
        lastFrameTime = currentTime;
    }

    // Level complete: skip simulation, just render frame
    if (gameState === 'levelcomplete') {
        return;
    }

    // Update game logic with simple delta time
    if (gameMode === GAME_MODES.ARCADE && timeRemaining > 0) {
        timeRemaining -= deltaTime;
        if (timeRemaining <= 0) {
            timeRemaining = 0;
            soundManager.play('gameOver');
            gameState = 'gameover';
            showEndScreen('lose');
            shouldContinue = false;
            return;
        }
    }

    // Update effects
    if (freezeTimeLeft > 0) {
        freezeTimeLeft -= deltaTime;
        if (freezeTimeLeft <= 0) isSlowMotion = false;
    }

    if (slowMotionTimeLeft > 0) {
        slowMotionTimeLeft -= deltaTime;
        if (slowMotionTimeLeft <= 0) isSlowMotion = false;
    }

    // Update aim animation (integrated in game loop)
    updateAimAnimation(currentTime);

    // Update game objects
    if (currentBubble && currentBubble.isMoving) {
        // 🚀 Sabit-adım birikimci: mermi HER fps'te gerçek hızda ilerler + tünelleme yok.
        // (Eski kod dt'yi 1/30'a kısıp düşük fps'te topu ağır çekime sokuyordu -> "havada asılı kalma")
        _shotAccumulator += realDeltaTime;
        const FIXED_STEP = 1/120;
        let _steps = 0;
        while (_shotAccumulator >= FIXED_STEP && currentBubble && currentBubble.isMoving && _steps < 60) {
            updateBubblePosition(FIXED_STEP);
            _shotAccumulator -= FIXED_STEP;
            _steps++;
        }

        // Reduced particle effects for better performance
        if (currentBubble && currentBubble.type === POWERUP_TYPES.FIREBALL && Math.random() < 0.3) {
            createTrailParticles(currentBubble.x, currentBubble.y, currentBubble.color);
        }
    }
    
    if (fallingBubbles.length > 0) {
        // 🚀 Sabit-adım: düşen toplar HER fps'te gerçek hızda düşer (yavaş cihazda takılmaz)
        _fallAccumulator += realDeltaTime;
        const FALL_STEP = 1/120;
        let _fsteps = 0;
        while (_fallAccumulator >= FALL_STEP && fallingBubbles.length > 0 && _fsteps < 60) {
            updateFallingBubbles(FALL_STEP);
            _fallAccumulator -= FALL_STEP;
            _fsteps++;
        }
    } else {
        _fallAccumulator = 0;
    }
    
    updateParticles();
    updateFloatingScores();

    // SINGLE CANVAS CLEAR - CRITICAL FOR PERFORMANCE
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    // 🌌 Yeni animasyonlu arka plan sistemi
    drawAnimatedBackground();

    // Core game rendering
    drawBorder();
    drawGrid();
    drawBottomUI();
    drawShooter();
    updateHudDom();   // LEVEL/SKOR artık DOM'da (canvas'a çizilmiyor)

    // Effects with reduced frequency
    if (particles.length > 0) drawParticles();
    if (floatingScores.length > 0) drawFloatingScores();

    // Throttled UI updates - much less frequent for performance
    if (!uiLastUpdateTime || currentTime - uiLastUpdateTime > 500) {
        updateMobileUI();
        uiLastUpdateTime = currentTime;
    }

    // Freeze overlay
    if (freezeTimeLeft > 0) {
        ctx.fillStyle = `rgba(173, 216, 230, ${0.3 * (freezeTimeLeft / 3)})`;
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    }

    } catch (err) {
        try { console.warn('⚠️ [GAMELOOP] Unhandled error:', err); } catch (_) {}
    } finally {
        gameLoopRunning = false;
        if (shouldContinue && (gameState === 'playing' || gameState === 'levelcomplete')) {
            try { requestAnimationFrame(gameLoop); } catch (_) {}
        }
    }
}

// Oyun bilgisi (LEVEL / SKOR / mod) artık canvas'a çizilmiyor, DOM'da tutuluyor.
// Sebep: canvas metni logicalHeight - BOTTOM_MARGIN hesabına bağlıydı; canvas ile
// DOM koordinat uzayı ayrıştığında power barın arkasına giriyordu. Ayrıca sağ
// üstteki mod bilgisi sabit y=55 kullandığı için iOS çentiğinin altında kalıyordu.
// Şimdi konumlandırmayı CSS yapıyor (#hudInfo power barın üstüne, #hudMode
// güvenli alan paylı üst barın içine).
// PERF: değer DEĞİŞMEDİYSE DOM'a yazılmaz -> kare başına maliyet yok.
function updateHudDom() {
    const lvl = document.getElementById('hudLevel');
    if (lvl) {
        const t = 'SEVİYE ' + currentLevel;
        if (lvl.textContent !== t) lvl.textContent = t;
    }

    const sc = document.getElementById('hudScore');
    if (sc) {
        const t = 'SKOR ' + formatScore(score);
        if (sc.textContent !== t) sc.textContent = t;
    }

    const md = document.getElementById('hudMode');
    if (md) {
        let t = '';
        if (gameMode === GAME_MODES.STRATEGY) {
            t = `🎯 Hamle: ${shotsRemaining}`;
        } else if (gameMode === GAME_MODES.ARCADE) {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = Math.floor(timeRemaining % 60);
            t = `⏰ ${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        if (md.textContent !== t) md.textContent = t;
    }
}

function drawBorder() {
    // Çerçeve artık tüm ekranı değil GERÇEK OYUN ALANINI sarar:
    //   sol/sağ = topun sekme sınırı (FRAME_PADDING) -> çerçeve gerçek duvarı gösterir
    //   üst     = tavan sırasının hemen üstü (iOS çentiğinin ALTINDA)
    //   alt     = zemin çizgisi (power barın ÜSTÜNDE)
    // Eskiden strokeRect(3, 3, lw-6, lh-6) ile ekranın tam kenarına çiziliyordu;
    // canvas viewport'u tamamen kapladığı için üstü çentiğin, altı power barın
    // arkasında kalıyor ve "oturmamış/kaymış" görünüyordu.
    const x = FRAME_PADDING;
    const w = logicalWidth - FRAME_PADDING * 2;
    const top = Math.max(FRAME_PADDING, (gridOffsetY || 0) - BUBBLE_RADIUS - 8);
    const bottom = logicalHeight - BOTTOM_MARGIN;
    const h = bottom - top;
    if (!(w > 0 && h > 0)) return;

    const r = Math.min(16, w / 2, h / 2);
    ctx.save();
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, top, w, h, r);
    } else {
        // iOS 15 gibi roundRect'i olmayan WebView'lar için yedek yol
        ctx.moveTo(x + r, top);
        ctx.arcTo(x + w, top,     x + w, top + h, r);
        ctx.arcTo(x + w, top + h, x,     top + h, r);
        ctx.arcTo(x,     top + h, x,     top,     r);
        ctx.arcTo(x,     top,     x + w, top,     r);
        ctx.closePath();
    }
    ctx.strokeStyle = 'rgba(90, 160, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(90, 160, 255, 0.35)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
}

function spawnBubbles() {
    currentBubble = { ...createBubble(shooterX, shooterY), isMoving: false, angle: -Math.PI / 2 };
    // Otomatik lava tüketimi kaldırıldı - oyuncu manuel seçecek
    nextBubble = createBubble(shooterX - BUBBLE_RADIUS * 3, shooterY);
    // İşaretçi yolunu hemen hesapla
    updateAimPath();
    tryApplyPendingShooterPowerup('spawn');
}

function createBubble(x, y) {
    return createShooterBubble(x, y); // Atış için power-up'lı balon
}

function createShooterBubble(x, y) {
    let type = 'normal';
    let color = getRandomColor();
    const rand = Math.random();
    
    // Yeni power-up dağılımı - sadece atış balonları için
    if (rand < POWERUP_PROB / 6) type = POWERUP_TYPES.RAINBOW;
    else if (rand < POWERUP_PROB / 5) type = POWERUP_TYPES.FIREBALL;
    else if (rand < POWERUP_PROB / 4) type = POWERUP_TYPES.VERTICAL_LASER;
    else if (rand < POWERUP_PROB / 3) type = POWERUP_TYPES.FREEZE;
    else if (rand < POWERUP_PROB / 2) type = POWERUP_TYPES.BOMB;
    else if (rand < POWERUP_PROB) type = POWERUP_TYPES.LASER;
    
    if (type === 'normal') {
        const availableColors = [...new Set(grid.flat().filter(b => b && b.type === 'normal').map(b => b.color))];
        if (availableColors.length === 0) {
            // Hiç renk kalmadıysa yardımcı bir balon ver
            type = POWERUP_TYPES.RAINBOW;
            color = RAINBOW_COLOR;
        } else {
            color = availableColors[Math.floor(Math.random() * availableColors.length)];
        }
    }
    
    // Power-up renkleri
    switch(type) {
        case POWERUP_TYPES.BOMB: color = BOMB_COLOR; break;
        case POWERUP_TYPES.LASER: color = LASER_COLOR; break;
        case POWERUP_TYPES.VERTICAL_LASER: color = VERTICAL_LASER_COLOR; break;
        case POWERUP_TYPES.RAINBOW: color = RAINBOW_COLOR; break;
        case POWERUP_TYPES.FIREBALL: color = FIREBALL_COLOR; break;
        case POWERUP_TYPES.FREEZE: color = '#87CEEB'; break;
    }
    
    return { x, y, color, radius: BUBBLE_RADIUS, type };
}

function createNormalBubble() {
    // Grid için sadece normal renkli balon oluştur
    return { 
        color: getRandomColor(), 
        type: 'normal' 
    };
}

function getRandomColor() {
    const colorNames = Object.keys(COLORS);
    return COLORS[colorNames[Math.floor(Math.random() * colorNames.length)]];
}

function formatScore(score) {
    if (score >= 1000000) {
        const millions = Math.floor(score / 1000000);
        const remainder = Math.floor((score % 1000000) / 100000);
        return remainder > 0 ? `⭐ ${millions}.${remainder}M` : `⭐ ${millions}M`;
    } else if (score >= 100000) {
        const hundreds = Math.floor(score / 100000);
        const remainder = Math.floor((score % 100000) / 10000);
        return remainder > 0 ? `🔥 ${hundreds}.${remainder}K` : `🔥 ${hundreds}K`;
    } else if (score >= 1000) {
        const thousands = Math.floor(score / 1000);
        const remainder = Math.floor((score % 1000) / 100);
        return remainder > 0 ? `⚡ ${thousands}.${remainder}k` : `⚡ ${thousands}k`;
    } else {
        return `🎯 ${score}`;
    }
}

function updateScore() {
    scoreSpan.textContent = formatScore(score);
    
    // Yüksek skoru güncelle ve kaydet
    if (score > playerStats.highScore) {
        playerStats.highScore = score;
        console.log(`🏆 Yeni rekor! ${score}`);
    }
    
    // Toplam skoru güncelle
    playerStats.totalScore += score;
    
    // Değişiklikleri kaydet
    savePlayerStats();
    
    // UI'da istatistikleri güncelle
    try { typeof updateStatsDisplay === 'function' && updateStatsDisplay(); } catch(_) {}
    
    // Skor animasyonu - Daha yumuşak
    scoreSpan.style.transform = 'scale(1.1)';
    scoreSpan.style.color = '#00D4FF';
    scoreSpan.style.textShadow = '0 0 15px #00D4FF';
    
    setTimeout(() => {
        scoreSpan.style.transform = 'scale(1)';
        scoreSpan.style.color = '#FFFFFF';
        scoreSpan.style.textShadow = 'none';
    }, 200);
}

// --- UI GÜNCELLEME FONKSİYONLARI ---
function updateStatsDisplay() {
    // Menüdeki istatistikleri güncelle
    const highScoreEl = document.getElementById('highScore');
    const totalPoppedEl = document.getElementById('totalPopped');
    
    if (highScoreEl) {
        highScoreEl.textContent = playerStats.highScore;
    }
    if (totalPoppedEl) {
        totalPoppedEl.textContent = playerStats.totalBubblesPopped;
    }
}

function updatePowerUpDisplay() {
    // Menüdeki power-up sayılarını güncelle
    const rainbowCount = document.getElementById('rainbowCount');
    const fireballCount = document.getElementById('fireballCount');
    
    if (rainbowCount) {
        rainbowCount.textContent = powerUpStock.rainbow;
    }
    if (fireballCount) {
        fireballCount.textContent = powerUpStock.fireball;
    }
    
    // Alt bardaki power-up sayılarını da güncelle
    try { updateBottomPowerUpCounts?.(); } catch(_) {}
}

function updateBottomPowerUpCounts() {
    // Alt barda power-up sayılarını göster
    console.log('🔄 Alt bar power-up sayıları güncellendi:', powerUpStock);
}

// --- İSTATİSTİK TAKIP FONKSİYONLARI ---
function trackBubblePop(count = 1) {
    playerStats.totalBubblesPopped += count;
    console.log(`💥 ${count} balon patlatıldı, toplam: ${playerStats.totalBubblesPopped}`);
    savePlayerStats();
}

function trackPowerUpUsage(type) {
    playerStats.totalPowerUpsUsed++;
    console.log(`⚡ ${type} power-up kullanıldı, toplam power-up kullanımı: ${playerStats.totalPowerUpsUsed}`);
    savePlayerStats();
}

function trackLevelComplete(mode) {
    playerStats.levelsCompleted[mode]++;
    if (currentLevel > playerStats.maxLevel) {
        playerStats.maxLevel = currentLevel;
    }
    console.log(`🏆 Level ${currentLevel} tamamlandı (${mode}), toplam: ${playerStats.levelsCompleted[mode]}`);
    savePlayerStats();
}

// --- TOOLTIP SİSTEMİ ---
function showPowerUpTooltip(x, y, powerType) {
    if (!POWERUP_DESCRIPTIONS[powerType] || !tooltipElement) return;
    
    const info = POWERUP_DESCRIPTIONS[powerType];
    tooltipTitle.textContent = info.title;
    tooltipDescription.textContent = info.description;
    
    // Tooltip pozisyonunu ayarla
    const rect = canvas.getBoundingClientRect();
    const tooltipX = rect.left + x;
    const tooltipY = rect.top + y - 80; // Balonun üstünde göster
    
    // Ekran sınırları içinde tut
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const finalX = Math.min(Math.max(10, tooltipX), window.innerWidth - tooltipRect.width - 10);
    const finalY = Math.max(10, tooltipY);
    
    tooltipElement.style.left = finalX + 'px';
    tooltipElement.style.top = finalY + 'px';
    tooltipElement.style.display = 'block';
    tooltipVisible = true;
}

function hidePowerUpTooltip() {
    if (tooltipElement) {
        tooltipElement.style.display = 'none';
        tooltipVisible = false;
    }
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
    }
}

function checkPowerUpHover(mouseX, mouseY) {
    // Oyun oynanırken tooltipleri gizle
    if (currentBubble && currentBubble.isMoving) {
        hidePowerUpTooltip();
        return;
    }
    
    let foundPowerUp = false;
    
    // Grid'deki power-up'ları kontrol et
    for (let r = 0; r < ROWS; r++) {
        const maxC = isOddRow(r) ? COLS - 2 : COLS - 1;
        for (let c = 0; c <= maxC; c++) {
            if (grid[r] && grid[r][c] && grid[r][c].type !== 'normal') {
                const { x: bubbleX, y: bubbleY } = getBubbleCoords(r, c);
                const distance = Math.sqrt((mouseX - bubbleX) ** 2 + (mouseY - bubbleY) ** 2);
                
                if (distance <= BUBBLE_RADIUS + 5) {
                    foundPowerUp = true;
                    if (!tooltipVisible) {
                        // 500ms bekle sonra tooltip göster
                        if (tooltipTimeout) clearTimeout(tooltipTimeout);
                        tooltipTimeout = setTimeout(() => {
                            showPowerUpTooltip(bubbleX, bubbleY, grid[r][c].type);
                        }, 500);
                    }
                    return;
                }
            }
        }
    }
    
    // Atış balonunu kontrol et
    if (currentBubble && !currentBubble.isMoving && currentBubble.type !== 'normal') {
        const distance = Math.sqrt((mouseX - currentBubble.x) ** 2 + (mouseY - currentBubble.y) ** 2);
        if (distance <= BUBBLE_RADIUS + 5) {
            foundPowerUp = true;
            if (!tooltipVisible) {
                if (tooltipTimeout) clearTimeout(tooltipTimeout);
                tooltipTimeout = setTimeout(() => {
                    showPowerUpTooltip(currentBubble.x, currentBubble.y, currentBubble.type);
                }, 500);
            }
            return;
        }
    }
    
    // Next bubble kontrol et
    if (nextBubble && nextBubble.type !== 'normal') {
        const distance = Math.sqrt((mouseX - nextBubble.x) ** 2 + (mouseY - nextBubble.y) ** 2);
        if (distance <= BUBBLE_RADIUS + 5) {
            foundPowerUp = true;
            if (!tooltipVisible) {
                if (tooltipTimeout) clearTimeout(tooltipTimeout);
                tooltipTimeout = setTimeout(() => {
                    showPowerUpTooltip(nextBubble.x, nextBubble.y, nextBubble.type);
                }, 500);
            }
            return;
        }
    }
    
    if (!foundPowerUp) {
        hidePowerUpTooltip();
    }
}

// --- PARTİKEL SİSTEMİ ---
function createParticles(x, y, color, count = 10, type = 'explosion') {
    // AGGRESSIVE PERFORMANCE PROTECTION: Skip if too many particles
    if (particles.length >= MAX_PARTICLES) {
        return; // Don't create new particles if at limit
    }
    
    // Drastically reduce particle count for stable FPS
    const optimizedCount = Math.min(count, 4); // 8 -> 4 (further reduction)
    
    for (let i = 0; i < optimizedCount; i++) {
        const angle = (Math.PI * 2 / optimizedCount) * i + Math.random() * 0.5;
        let speed, gravity, size;
        
        // Fire effect settings with screen-normalized speed
        if (type === 'fire') {
            speed = (30 + Math.random() * 60) * (screenSpeedFactor || 1);
            gravity = -0.3; // Fire rises upward
            size = 2 + Math.random() * 4;
        } else {
            speed = (50 + Math.random() * 100) * (screenSpeedFactor || 1);
            gravity = type === 'explosion' ? 0.5 : 0;
            size = 3 + Math.random() * 5;
        }
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            maxLife: 1.0,
            color: color,
            size: size,
            type: type,
            gravity: gravity
        });
    }
}

// Trail parçacık sayacı - performans için throttle
let trailParticleCounter = 0;

function createTrailParticles(x, y, color) {
    // PERFORMANS: Her 3 frame'de bir trail parçacık oluştur (60 FPS'te 20'ye düşer)
    trailParticleCounter++;
    if (trailParticleCounter % 3 !== 0) return;
    
    // Limit kontrolü
    if (particles.length >= MAX_PARTICLES) return;
    
    particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 0.5,
        maxLife: 0.5,
        color: color,
        size: 2 + Math.random() * 3,
        type: 'trail',
        gravity: 0
    });
}

function updateParticles() {
    // 🔥 PERFORMANCE: Aggressive particle cleanup to prevent memory leak
    if (particles.length > MAX_PARTICLES * 0.8) {
        // Remove oldest 30% when reaching 80% capacity
        const removeCount = Math.floor(particles.length * 0.3);
        particles.splice(0, removeCount);
        debugLog('performance', `🧹 Cleaned ${removeCount} old particles (total: ${particles.length})`);
    }
    
    // 🔥 PERFORMANCE: Hard cap at MAX_PARTICLES
    if (particles.length > MAX_PARTICLES) {
        particles.splice(0, particles.length - MAX_PARTICLES);
        debugLog('performance', `⚠️ Particle overflow! Capped at ${MAX_PARTICLES}`);
    }
    
    // ✅ FIXED TIME STEP - Tutarlı parçacık animasyonu için sabit delta time
    const dt = 1/60; // Sabit 60 FPS, çok smooth ve tutarlı
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // 🔥 PERFORMANCE: Remove off-screen particles immediately
        if (p.x < -100 || p.x > logicalWidth + 100 || p.y > logicalHeight + 100) {
            particles.splice(i, 1);
            continue;
        }
        
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt * 60; // gravity effect
        p.life -= dt * 3; // Yaşam süresini hızlandır (2 -> 3) - daha çabuk yok olur
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        // Guard against non-finite values that can crash Canvas on iOS
        let alpha = (p && typeof p.life === 'number' && typeof p.maxLife === 'number' && p.maxLife > 0)
            ? (p.life / p.maxLife)
            : 0;
        if (!Number.isFinite(alpha)) alpha = 0;
        // Clamp alpha to [0,1]
        alpha = Math.min(1, Math.max(0, alpha));

        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
            return; // skip invalid particle
        }

        const baseSize = Number.isFinite(p.size) ? p.size : 0;
        const radius = Math.max(0, baseSize * alpha);
        const smallRadius = Math.max(0, baseSize * alpha * 0.3);

        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (p.type === 'explosion') {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'trail') {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'fire') {
            // Ateş efekti - gradient ve flicker
            const safeRadius = Math.max(0.01, radius); // r1 must be positive and finite
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, safeRadius);
            gradient.addColorStop(0, '#FFD700'); // Altın sarısı merkez
            gradient.addColorStop(0.3, '#FF9100'); // Turuncu
            gradient.addColorStop(0.7, '#FF1744'); // Kırmızı
            gradient.addColorStop(1, 'rgba(255, 23, 68, 0)'); // Şeffaf kırmızı
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Ek parıltı efekti
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, smallRadius, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'star') {
            drawStar(p.x, p.y, radius, p.color);
        }
        
        ctx.restore();
    });
}

function drawStar(x, y, size, color) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(size) || size <= 0) {
        return; // avoid non-finite or invalid sizes
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5;
        const radius = i % 2 === 0 ? size : size * 0.5;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
}

// --- ÇİZİM FONKSİYONLARI ---
function drawBubble(x, y, radius, color, type) {
    // Parametrelerin geçerliliğini kontrol et - sessizce return et
    if (!isFinite(x) || !isFinite(y) || !isFinite(radius) || radius <= 0) {
        return;
    }
    
    ctx.save();
    
    if (type === POWERUP_TYPES.BOMB) {
        // Bombayı gerçek bomba şekliyle çiz
        const time = Date.now() * 0.005;
        const pulse = 1 + Math.sin(time) * 0.05;
        const bodyR = radius * 0.9 * pulse;

        // Gövde (koyu metalik)
        const bodyGrad = ctx.createRadialGradient(x - bodyR * 0.3, y - bodyR * 0.3, bodyR * 0.1, x, y, bodyR);
        bodyGrad.addColorStop(0, '#3b3b3b');
        bodyGrad.addColorStop(0.5, '#222');
        bodyGrad.addColorStop(1, '#0b0b0b');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(x, y, bodyR, 0, Math.PI * 2);
        ctx.fill();

        // Üst kapak halkası
        ctx.strokeStyle = '#6e6e6e';
        ctx.lineWidth = Math.max(2, radius * 0.12);
        ctx.beginPath();
        ctx.arc(x, y - bodyR * 0.65, bodyR * 0.3, Math.PI, 0);
        ctx.stroke();

        // Fitil
        const fuseStartX = x + bodyR * 0.5;
        const fuseStartY = y - bodyR * 0.7;
        const fuseEndX = fuseStartX + bodyR * 0.6;
        const fuseEndY = fuseStartY - bodyR * 0.4;
        ctx.strokeStyle = '#b77b2b';
        ctx.lineWidth = Math.max(2, radius * 0.1);
        ctx.beginPath();
        ctx.moveTo(fuseStartX, fuseStartY);
        ctx.quadraticCurveTo(x + bodyR * 0.8, y - bodyR * 1.0, fuseEndX, fuseEndY);
        ctx.stroke();

        // Kıvılcım (ateşleme)
        const sparkPulse = 1 + Math.sin(Date.now() * 0.02) * 0.2;
        const sparkR = radius * 0.22 * sparkPulse;
        const grad = ctx.createRadialGradient(fuseEndX, fuseEndY, 0, fuseEndX, fuseEndY, sparkR);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.4, '#FFE066');
        grad.addColorStop(0.7, '#FF8C00');
        grad.addColorStop(1, 'rgba(255,69,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(fuseEndX, fuseEndY, sparkR, 0, Math.PI * 2);
        ctx.fill();

        // Gövde highlight
        const highlight = ctx.createRadialGradient(x - bodyR * 0.4, y - bodyR * 0.4, 0, x - bodyR * 0.4, y - bodyR * 0.4, bodyR * 0.6);
        highlight.addColorStop(0, 'rgba(255,255,255,0.35)');
        highlight.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = highlight;
        ctx.beginPath();
        ctx.arc(x - bodyR * 0.4, y - bodyR * 0.4, bodyR * 0.6, 0, Math.PI * 2);
        ctx.fill();

    } else if (type === POWERUP_TYPES.RAINBOW) {
        // Gelişmiş gökkuşağı efekti - Dönen renkler
        const time = Date.now() * 0.003;
        
        // Dönen gökkuşağı katmanları
        for (let i = 0; i < 6; i++) {
            const colors = ['#FF0000', '#FF8000', '#FFFF00', '#00FF00', '#0080FF', '#8000FF'];
            const rotatedColors = [...colors.slice(Math.floor(time + i) % colors.length), ...colors.slice(0, Math.floor(time + i) % colors.length)];
            const currentRadius = radius * (1 - i * 0.12);
            
            const grad = ctx.createRadialGradient(x, y, 0, x, y, currentRadius);
            grad.addColorStop(0, rotatedColors[0]);
            grad.addColorStop(0.3, rotatedColors[1]);
            grad.addColorStop(0.6, rotatedColors[2]);
            grad.addColorStop(1, 'rgba(255,255,255,0.1)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Parlayan yıldızlar
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + time;
            const starX = x + Math.cos(angle) * radius * 0.8;
            const starY = y + Math.sin(angle) * radius * 0.8;
            const size = Math.sin(time * 2 + i) * 2 + 3;
            
            drawStar(starX, starY, size, '#FFFFFF');
        }
        
        // Merkez parlaklık
        const centerGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.3);
        centerGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        centerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = centerGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Dış renkli halka ve yörüngedeki küçük uydular
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = Math.max(1, radius * 0.08);
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.02, 0, Math.PI * 2);
        ctx.stroke();

        const orbitR = radius * 1.15;
        const orbitColors = ['#FF3B30','#FF9500','#FFCC00','#34C759','#007AFF','#AF52DE'];
        const t = Date.now() * 0.002;
        for (let i = 0; i < 6; i++) {
            const angle = t + (i / 6) * Math.PI * 2;
            const ox = x + Math.cos(angle) * orbitR;
            const oy = y + Math.sin(angle) * orbitR;
            ctx.fillStyle = orbitColors[i];
            ctx.beginPath();
            ctx.arc(ox, oy, radius * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        ctx.beginPath();
        ctx.arc(x - radius * 0.4, y - radius * 0.4, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
    } else if (type === POWERUP_TYPES.FIREBALL) {
        // Gelişmiş ateş topu efekti - Yanıcı animasyon
        const time = Date.now() * 0.008;
        const flameIntensity = Math.sin(time) * 0.3 + 0.7;
        
        // Ana ateş gradyanı
        const fireGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        fireGrad.addColorStop(0, '#FFFFFF');
        fireGrad.addColorStop(0.15, '#FFFF00');
        fireGrad.addColorStop(0.4, '#FF8000');
        fireGrad.addColorStop(0.7, '#FF4000');
        fireGrad.addColorStop(1, '#8B0000');
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Kuyruk efekti (alttan aşağı akış)
        ctx.save();
        const tailGrad = ctx.createLinearGradient(x, y + radius * 0.2, x, y + radius * 1.8);
        tailGrad.addColorStop(0, 'rgba(255,160,0,0.85)');
        tailGrad.addColorStop(1, 'rgba(255,64,0,0)');
        ctx.fillStyle = tailGrad;
        ctx.beginPath();
        ctx.ellipse(x, y + radius, radius * 0.55, radius * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Uçuş kıvılcımları
        const t2 = Date.now() * 0.01;
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + t2;
            const sx = x + Math.cos(a) * radius * 0.4;
            const sy = y + radius * 0.6 + Math.sin(a) * radius * 0.2;
            ctx.fillStyle = 'rgba(255,200,0,0.8)';
            ctx.beginPath();
            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        
        // Dış glow
        ctx.shadowColor = '#FF6000';
        ctx.shadowBlur = 20 * flameIntensity;
        ctx.strokeStyle = '#FF8000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Dinamik alev parçacıkları
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + time;
            const distance = radius * (0.8 + Math.sin(time * 3 + i) * 0.4);
            const flameX = x + Math.cos(angle) * distance;
            const flameY = y + Math.sin(angle) * distance;
            const flameSize = (Math.sin(time * 2 + i * 0.5) * 3 + 5) * flameIntensity;
            
            const flameColors = ['#FFD700', '#FF8000', '#FF4000'];
            ctx.fillStyle = flameColors[i % 3];
            ctx.beginPath();
            ctx.arc(flameX, flameY, flameSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // İç beyaz çekirdek
        const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.3);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        coreGrad.addColorStop(1, 'rgba(255, 255, 0, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
    } else if (type === POWERUP_TYPES.VERTICAL_LASER) {
        // Dikey lazer efekti - Cyan/mavi ton
        const time = Date.now() * 0.01;
        const laserIntensity = Math.sin(time * 2) * 0.5 + 0.5;
        
        // Ana lazer gradyanı
        const laserGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        laserGrad.addColorStop(0, '#FFFFFF');
        laserGrad.addColorStop(0.2, '#C0FFFF');
        laserGrad.addColorStop(0.5, '#00EAFF');
        laserGrad.addColorStop(0.8, '#0080FF');
        laserGrad.addColorStop(1, '#003080');
        ctx.fillStyle = laserGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Lazer glow
        ctx.shadowColor = '#00EAFF';
        ctx.shadowBlur = 25 * laserIntensity;
        ctx.strokeStyle = '#80F0FF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Dikey lazer çizgileri
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2 + laserIntensity * 2;
        ctx.shadowColor = '#00EAFF';
        ctx.shadowBlur = 10;
        
        // Dikey çizgiler çiz
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * 5, y - radius);
            ctx.lineTo(x + i * 5, y + radius);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        
        // Lazer çekirdeği
        const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.4);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        coreGrad.addColorStop(1, 'rgba(0, 234, 255, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
    } else if (type === POWERUP_TYPES.FREEZE) {
        // Gelişmiş buz efekti - Kristal yapısı
        const time = Date.now() * 0.002;
        const crystalPulse = Math.sin(time) * 0.2 + 0.8;
        
        // Ana buz gradyanı
        const iceGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        iceGrad.addColorStop(0, '#FFFFFF');
        iceGrad.addColorStop(0.3, '#E0F6FF');
        iceGrad.addColorStop(0.6, '#87CEEB');
        iceGrad.addColorStop(0.9, '#4682B4');
        iceGrad.addColorStop(1, '#191970');
        ctx.fillStyle = iceGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Buzlu kenar
        ctx.strokeStyle = 'rgba(176,224,230,0.9)';
        ctx.lineWidth = Math.max(2, radius * 0.12);
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.95, 0, Math.PI * 2);
        ctx.stroke();

        // Kar tanesi overlay
        ctx.strokeStyle = '#E0F6FF';
        ctx.lineWidth = Math.max(2, radius * 0.12);
        for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2;
            const ex = x + Math.cos(ang) * radius * 0.7;
            const ey = y + Math.sin(ang) * radius * 0.7;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            // küçük dallar
            const bx = x + Math.cos(ang) * radius * 0.45;
            const by = y + Math.sin(ang) * radius * 0.45;
            const side = ang + Math.PI / 6;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(side) * radius * 0.2, by + Math.sin(side) * radius * 0.2);
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(side - Math.PI / 3) * radius * 0.2, by + Math.sin(side - Math.PI / 3) * radius * 0.2);
            ctx.stroke();
        }
        
        // Buz glow
        ctx.shadowColor = '#87CEEB';
        ctx.shadowBlur = 15 * crystalPulse;
        ctx.strokeStyle = '#B0E0E6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Karmaşık kristal yapısı
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        
        // Ana kristal eksenleri
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * radius * 0.9, y + Math.sin(angle) * radius * 0.9);
            ctx.stroke();
            
            // Kristal dallanmaları
            for (let j = 0.3; j <= 0.7; j += 0.2) {
                const branchX = x + Math.cos(angle) * radius * j;
                const branchY = y + Math.sin(angle) * radius * j;
                const branchLength = radius * 0.2;
                
                ctx.beginPath();
                ctx.moveTo(branchX + Math.cos(angle + Math.PI/3) * branchLength, 
                          branchY + Math.sin(angle + Math.PI/3) * branchLength);
                ctx.lineTo(branchX + Math.cos(angle - Math.PI/3) * branchLength, 
                          branchY + Math.sin(angle - Math.PI/3) * branchLength);
                ctx.stroke();
            }
        }
        
        // Buz parçacıkları
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius * 0.8;
            const sparkX = x + Math.cos(angle) * distance;
            const sparkY = y + Math.sin(angle) * distance;
            const size = Math.random() * 2 + 1;
            
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Kristal çekirdek
        const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.3);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        coreGrad.addColorStop(1, 'rgba(135, 206, 235, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
    } else if (type === POWERUP_TYPES.LASER) {
        // Gelişmiş lazer efekti - Hologram görünümü
        const time = Date.now() * 0.008;
        const laserIntensity = Math.sin(time * 3) * 0.3 + 0.7;
        
        // Ana lazer gradyanı
        const laserGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        laserGrad.addColorStop(0, '#FFFFFF');
        laserGrad.addColorStop(0.1, '#E0FFFF');
        laserGrad.addColorStop(0.3, '#00FFFF');
        laserGrad.addColorStop(0.6, '#00E5FF');
        laserGrad.addColorStop(0.8, '#0080FF');
        laserGrad.addColorStop(1, '#000080');
        ctx.fillStyle = laserGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Lazer glow efekti
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 30 * laserIntensity;
        ctx.strokeStyle = '#80E0FF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Lazer ışınları (dört yön)
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3 * laserIntensity;
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 15;
        
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + time;
            const length = radius * 1.5;
            const startX = x + Math.cos(angle) * radius * 0.3;
            const startY = y + Math.sin(angle) * radius * 0.3;
            const endX = x + Math.cos(angle) * length;
            const endY = y + Math.sin(angle) * length;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Işın ucu parlaklığı
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(endX, endY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Çapraz lazer çizgileri
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time * 2;
            const innerRadius = radius * 0.4;
            const outerRadius = radius * 0.8;
            
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * innerRadius, y + Math.sin(angle) * innerRadius);
            ctx.lineTo(x + Math.cos(angle) * outerRadius, y + Math.sin(angle) * outerRadius);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        
        // Hologram dalgaları
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const waveRadius = radius * (0.2 + i * 0.2) + Math.sin(time * 4 + i) * radius * 0.1;
            ctx.beginPath();
            ctx.arc(x, y, waveRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Lazer çekirdeği
        const laserCore = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.3);
        laserCore.addColorStop(0, 'rgba(255, 255, 255, 1)');
        laserCore.addColorStop(0.5, 'rgba(0, 255, 255, 0.8)');
        laserCore.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.fillStyle = laserCore;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Üst parlaklık (hologram efekti)
        const hologramGrad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x - radius * 0.3, y - radius * 0.3, radius * 0.5);
        hologramGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        hologramGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = hologramGrad;
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Yatay ışık bandı (Laser'in yatay etkisini vurgula)
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.98, 0, Math.PI * 2);
        ctx.clip();
        const bandGrad = ctx.createLinearGradient(x - radius, y, x + radius, y);
        bandGrad.addColorStop(0, 'rgba(0,255,255,0)');
        bandGrad.addColorStop(0.5, 'rgba(0,255,255,0.9)');
        bandGrad.addColorStop(1, 'rgba(0,255,255,0)');
        ctx.fillStyle = bandGrad;
        ctx.fillRect(x - radius, y - radius * 0.2, radius * 2, radius * 0.4);
        ctx.restore();
        
    } else if (type === 'lava') {
        // Lava balonu efekti - Erimis magma görünümü
        const time = Date.now() * 0.006;
        const lavaIntensity = Math.sin(time) * 0.4 + 0.6;
        
        // Ana lava gradyanı
        const lavaGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        lavaGrad.addColorStop(0, '#FFFFFF');
        lavaGrad.addColorStop(0.1, '#FFFF00');
        lavaGrad.addColorStop(0.3, '#FF8000');
        lavaGrad.addColorStop(0.6, '#FF4500');
        lavaGrad.addColorStop(0.8, '#8B0000');
        lavaGrad.addColorStop(1, '#2F0000');
        ctx.fillStyle = lavaGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Lava glow efekti
        ctx.shadowColor = '#FF4500';
        ctx.shadowBlur = 20 * lavaIntensity;
        ctx.strokeStyle = '#FF6000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Magma kabarcıkları
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius * 0.8;
            const bubbleX = x + Math.cos(angle) * distance;
            const bubbleY = y + Math.sin(angle) * distance;
            const bubbleSize = Math.random() * 4 + 2;
            const bubbleTime = time + i * 0.3;
            const bubbleAlpha = (Math.sin(bubbleTime) + 1) * 0.5;
            
            ctx.save();
            ctx.globalAlpha = bubbleAlpha;
            ctx.fillStyle = '#FF8000';
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Lava yüzey dalgaları
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.save();
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 3; i++) {
            const waveRadius = radius * (0.3 + i * 0.2);
            const waveAlpha = Math.sin(time * 2 + i * Math.PI / 3) * 0.5 + 0.5;
            ctx.save();
            ctx.globalAlpha = waveAlpha * 0.4;
            ctx.beginPath();
            ctx.arc(x, y, waveRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
        
        // Beyaz ateş çekirdeği
        const fireCore = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.4);
        fireCore.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        fireCore.addColorStop(0.5, 'rgba(255, 255, 0, 0.6)');
        fireCore.addColorStop(1, 'rgba(255, 128, 0, 0)');
        ctx.fillStyle = fireCore;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
    } else {
        // 🚀 PERF: Normal balon sprite önbelleğinden çizilir.
        // Eski yol her karede 3 iç fonksiyon + 3 createRadialGradient +
        // shadowBlur(15) çalıştırıyordu (~26 balon × kare) — yazılım
        // render'da tek balon çizimi 97ms'e sıçrayabiliyordu. Artık
        // (renk|yarıçap) başına BİR KEZ offscreen'e çizilir, sonra drawImage.
        drawPlainBubbleCached(ctx, x, y, radius, color);
    }
    
    ctx.restore();
}

// ==== Normal balon sprite önbelleği (görsel birebir aynı) ====
const __plainBubbleCache = new Map();
const __PLAIN_BUBBLE_PAD = 18; // shadowBlur(15) taşması için pay

function drawPlainBubbleCached(targetCtx, x, y, radius, color) {
    const r = Math.max(1, Math.round(radius));
    const key = color + '|' + r;
    let sprite = __plainBubbleCache.get(key);
    if (!sprite) {
        if (__plainBubbleCache.size > 96) __plainBubbleCache.clear(); // sınırsız büyüme koruması
        const pad = __PLAIN_BUBBLE_PAD;
        const size = (r + pad) * 2;
        const dpr = window.devicePixelRatio || 1;
        const off = document.createElement('canvas');
        off.width = Math.ceil(size * dpr);
        off.height = Math.ceil(size * dpr);
        const g = off.getContext('2d');
        g.scale(dpr, dpr);
        __paintPlainBubble(g, r + pad, r + pad, r, color);
        sprite = { canvas: off, size: size, half: r + pad };
        __plainBubbleCache.set(key, sprite);
    }
    targetCtx.drawImage(sprite.canvas, x - sprite.half, y - sprite.half, sprite.size, sprite.size);
}

function __paintPlainBubble(ctx, x, y, radius, color) {
        // Normal balon - Gelişmiş 3D efekti (chroma olmadan)
        
        // Renk değerlerini parse et
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }
        
        function rgbToHex(r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        
        function adjustBrightness(hex, factor) {
            const rgb = hexToRgb(hex);
            if (!rgb) return hex;
            
            const r = Math.min(255, Math.max(0, Math.round(rgb.r * factor)));
            const g = Math.min(255, Math.max(0, Math.round(rgb.g * factor)));
            const b = Math.min(255, Math.max(0, Math.round(rgb.b * factor)));
            
            return rgbToHex(r, g, b);
        }
        
        // 🎨 DOYGUN BALON (beyaz yıkama katmanları kaldırıldı)
        // Eski çizim üst üste beyaz basıyordu: gradient merkezi '#FFFFFF',
        // 0.1 durağı brightness(2.0), ardından yarıçapın %70'ini kaplayan %90
        // alfa beyaz highlight, ardından beyaz kenar ışığı. Gerçek renk yalnızca
        // ince bir halkada kalıyor, balonlar soluk/donuk görünüyordu.
        // Artık: merkezde GERÇEK renk, üst-solda hafif açığı, kenarda koyusu;
        // tek küçük yumuşak parlama; ince koyu iç kenar.

        // 1) Hacim: ışık üst-soldan gelir, renk korunur
        const gx = x - radius * 0.28, gy = y - radius * 0.28;
        const mainGrad = ctx.createRadialGradient(gx, gy, radius * 0.05, x, y, radius);
        mainGrad.addColorStop(0.00, adjustBrightness(color, 1.45)); // açık ama BEYAZ değil
        mainGrad.addColorStop(0.45, color);                          // gerçek renk geniş alanda
        mainGrad.addColorStop(0.85, adjustBrightness(color, 0.62));
        mainGrad.addColorStop(1.00, adjustBrightness(color, 0.40));
        ctx.fillStyle = mainGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 2) Tek küçük spekülar parlama (yarıçapın ~%22'si, yumuşak)
        const hlR = radius * 0.22;
        const hlX = x - radius * 0.34, hlY = y - radius * 0.38;
        const hl = ctx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR * 2.1);
        hl.addColorStop(0.0, 'rgba(255,255,255,0.75)');
        hl.addColorStop(0.5, 'rgba(255,255,255,0.18)');
        hl.addColorStop(1.0, 'rgba(255,255,255,0)');
        ctx.fillStyle = hl;
        ctx.beginPath();
        ctx.ellipse(hlX, hlY, hlR * 1.5, hlR * 1.15, -0.5, 0, Math.PI * 2);
        ctx.fill();

        // 3) İnce koyu iç kenar: hacim ve balonlar arası ayrım (beyaz halka YOK)
        ctx.strokeStyle = adjustBrightness(color, 0.55);
        ctx.lineWidth = Math.max(1, radius * 0.07);
        ctx.beginPath();
        ctx.arc(x, y, radius - ctx.lineWidth * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        // 4) Zayıf renkli dış parıltı (neon his, boğmadan)
        ctx.shadowColor = color;
        ctx.shadowBlur = 7;
        ctx.strokeStyle = adjustBrightness(color, 1.15);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, radius - 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
}


// --- MOBİL UI FONKSİYONLARI ---
// ========== TAB MENÜ FONKSİYONLARI ==========
function initMobileTabMenu() {
    const tabMenu = document.getElementById('mobileTabMenu');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    // Tab menüyü görünür yap
    if (tabMenu) {
        tabMenu.style.display = 'block';
        tabMenu.style.visibility = 'visible';
        tabMenu.style.pointerEvents = 'auto';
    }
    
    // Tab butonlarına event listener ekle
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Tab button clicked:', this.dataset.tab);
            
            // Aktif tab butonunu güncelle
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Aktif paneli göster
            const targetPanel = this.dataset.tab;
            tabPanels.forEach(panel => {
                if (panel.id === targetPanel) {
                    panel.style.display = 'block';
                    panel.classList.add('active');
                } else {
                    panel.style.display = 'none';
                    panel.classList.remove('active');
                }
            });
            
            // Panel spesifik güncellemeler
            if (targetPanel === 'statsPanel') {
                updateStatsPanel();
            } else if (targetPanel === 'powerupsPanel') {
                updatePowerUpsPanel();
            }
        });
    });
    
    // Başlatma butonunu bağla (WEB-ONLY)
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', function() {
            // Native (iOS/Android) ortamda bu handler hiçbir şey yapmasın.
            // Asıl başlatma iOS/Android için yukarıdaki menü handler'ında yapılıyor.
            try {
                const platform = window.Capacitor?.getPlatform?.();
                if (platform === 'ios' || platform === 'android') {
                    console.log('⏭️ startGameBtn (tab) ignored on native platform');
                    return;
                }
            } catch (_) {}

            console.log('Start game button clicked (web)');
            // Start screen'i göster (web akışı)
            try { document.getElementById('splashScreen').style.display = 'none'; } catch(_) {}
            try { document.getElementById('startScreen').style.display = 'flex'; } catch(_) {}
            // Tab menüyü kapat
            try { tabMenu.classList.remove('open'); } catch(_) {}
        });
    }
    
    // Tab menüyü açmak için tıklama alanı
    const tabBar = document.querySelector('.tab-bar');
    if (tabBar) {
        tabBar.addEventListener('click', function(e) {
            if (e.target === tabBar || e.target.closest('.tab-btn')) {
                tabMenu.classList.toggle('open');
            }
        });
    }
}

function updatePowerUpsPanel() {
    // Power-up sayılarını güncelle
    const rainbowCountEl = document.getElementById('rainbowCount');
    const fireballCountEl = document.getElementById('fireballCount');
    
    if (rainbowCountEl) rainbowCountEl.textContent = powerUpStock.rainbow || 0;
    if (fireballCountEl) fireballCountEl.textContent = powerUpStock.fireball || 0;
}

function updateMobileUI() {
    updatePowerUpsPanel();
    updateStatsPanel();
}

function updateStatsPanel() {
    const statsContent = document.getElementById('statsContent');
    if (!statsContent) return;
    
    const statItems = statsContent.querySelectorAll('.stat-item .stat-value');
    if (statItems.length >= 4) {
        statItems[0].textContent = formatScore(playerStats.highScore);
        statItems[1].textContent = formatScore(playerStats.totalScore);
        statItems[2].textContent = playerStats.totalGamesPlayed;
        statItems[3].textContent = playerStats.totalBubblesPopped;
    }
}

// Power-up kullanma fonksiyonu - Global olarak erişilebilir (tek kaynaktan yönet)
// SONSUZ DÖNGÜ HATASI DÜZELTİLDİ: window.usePowerup kaldırıldı

function drawGrid() {
    // 🚀 PERFORMANCE: Offscreen culling - sadece görünür balonları çiz
    const margin = BUBBLE_RADIUS * 2; // Kenar toleransı
    const minX = -margin;
    const maxX = logicalWidth + margin;
    const minY = -margin;
    const maxY = logicalHeight + margin;
    
    grid.forEach((row, r) => {
        // 🐛 FIX: TÜM sütunları çiz. Eski kod odd satırlarda COLS-1'i atlıyordu
        // (maxC = COLS-2) ama grid dolumu oraya balon koyuyordu -> o balonlar
        // GÖRÜNMEZ kalıp "sağ kenarda gizli toplar" oluşturuyor, diğerlerini
        // asılı gösteriyordu. Viewport culling gerçek ekran-dışını zaten atlar.
        for (let c = 0; c < COLS; c++) {
            if (row[c]) {
                const coords = getBubbleCoords(r, c);
                // Viewport dışındaki balonları atla
                if (coords.x < minX || coords.x > maxX || coords.y < minY || coords.y > maxY) continue;
                drawBubble(coords.x, coords.y, BUBBLE_RADIUS, row[c].color, row[c].type);
            }
        }
    });
    
    // Düşen balonlar da offscreen culling ile
    fallingBubbles.forEach(b => {
        if (b.x >= minX && b.x <= maxX && b.y >= minY && b.y <= maxY) {
            drawBubble(b.x, b.y, b.radius, b.color, b.type);
        }
    });
}

// Yardımcı fonksiyonlar
function drawElectricSpark(x, y, width) {
    const sparkCount = 3 + Math.floor(Math.random() * 3);
    ctx.strokeStyle = '#00D4FF';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#00D4FF';
    ctx.shadowBlur = 5;
    
    for (let i = 0; i < sparkCount; i++) {
        const startX = x + (Math.random() - 0.5) * width;
        const startY = y + (Math.random() - 0.5) * 20;
        const endX = startX + (Math.random() - 0.5) * 15;
        const endY = startY + (Math.random() - 0.5) * 15;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
    ctx.shadowBlur = 0;
}

function drawEnergyPool(x, y, width, score) {
    const intensity = score / 500; // 0-1 arası
    const poolHeight = 8;
    
    // Enerji havuzu gradyanı
    const poolGrad = ctx.createLinearGradient(x, y, x, y + poolHeight);
    poolGrad.addColorStop(0, `rgba(0, 212, 255, ${0.8 * intensity})`);
    poolGrad.addColorStop(0.5, `rgba(213, 0, 249, ${0.6 * intensity})`);
    poolGrad.addColorStop(1, `rgba(0, 255, 127, ${0.4 * intensity})`);
    
    ctx.fillStyle = poolGrad;
    ctx.fillRect(x, y, width, poolHeight);
    
    // Kabarcık efekti
    const time = Date.now() / 1000;
    for (let i = 0; i < 3; i++) {
        const bubbleX = x + (width / 4) * (i + 1);
        const bubbleY = y + 2 + Math.sin(time * 2 + i) * 2;
        const bubbleSize = 1 + Math.sin(time * 3 + i) * 0.5;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * intensity})`;
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawMarioTubeGlow(x, y, width) {
    const glowCount = 2 + Math.floor(Math.random() * 3);
    const time = Date.now() / 1000;
    
    for (let i = 0; i < glowCount; i++) {
        const glowX = x + (Math.random() - 0.5) * (width - 10);
        const glowY = y + (Math.random() - 0.5) * 30;
        const glowSize = 3 + Math.random() * 4;
        
        // Yeşil glow efekti
        ctx.fillStyle = `rgba(76, 175, 80, ${0.6 + 0.4 * Math.sin(time * 4 + i)})`;
        ctx.shadowColor = '#4CAF50';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(glowX, glowY, glowSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function drawMarioEnergyBase(x, y, width, score) {
    const intensity = score / 500;
    const baseHeight = 12;
    
    // Mario tarzı yeşil enerji tabanı
    const baseGrad = ctx.createLinearGradient(x, y, x, y + baseHeight);
    baseGrad.addColorStop(0, `rgba(76, 175, 80, ${0.8 * intensity})`);
    baseGrad.addColorStop(0.5, `rgba(139, 195, 74, ${0.6 * intensity})`);
    baseGrad.addColorStop(1, `rgba(27, 94, 32, ${0.9 * intensity})`);
    
    ctx.fillStyle = baseGrad;
    ctx.fillRect(x, y, width, baseHeight);
    
    // Işıltı efekti
    const time = Date.now() / 1000;
    for (let i = 0; i < 4; i++) {
        const sparkleX = x + (width / 5) * (i + 1);
        const sparkleY = y + 3 + Math.sin(time * 2 + i * 0.5) * 3;
        const sparkleSize = 1 + Math.sin(time * 3 + i) * 0.8;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * intensity})`;
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Alt kenar çizgisi
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, baseHeight);
}

// Çukur/Delik Çizim Fonksiyonları
function drawHoleDepth(x, y, radius, colors, time, index) {
    // Ana çukur derinliği (3D görünüm)
    const depthLevels = 6;
    
    for (let i = 0; i < depthLevels; i++) {
        const levelRadius = radius - (i * 5);
        const levelY = y + (i * 3); // Derinlik hissi
        const alpha = 1 - (i / depthLevels) * 0.7;
        
        // Her seviye için renk koyulaştır
        const levelGrad = ctx.createRadialGradient(x, levelY, 0, x, levelY, levelRadius);
        levelGrad.addColorStop(0, colors[0] + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
        levelGrad.addColorStop(0.7, colors[1] + Math.floor(alpha * 180).toString(16).padStart(2, '0'));
        levelGrad.addColorStop(1, colors[2] + Math.floor(alpha * 100).toString(16).padStart(2, '0'));
        
        ctx.fillStyle = levelGrad;
        ctx.beginPath();
        ctx.arc(x, levelY, levelRadius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawHoleEdge(x, y, radius, colors) {
    // Çukur kenarı (yüzey seviyesi)
    const edgeWidth = 8;
    
    // Dış kenar (açık toprak)
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = edgeWidth;
    ctx.beginPath();
    ctx.arc(x, y, radius + edgeWidth/2, 0, Math.PI * 2);
    ctx.stroke();
    
    // İç kenar (koyu gölge)
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius - 2, 0, Math.PI * 2);
    ctx.stroke();
}

function drawHoleShadows(x, y, radius, colors, time, index) {
    // Çukur içinde sabit gölgeler (daha gerçekçi)
    const shadowCount = 3;
    
    for (let i = 0; i < shadowCount; i++) {
        // Sabit pozisyonlarda gölgeler (çukur derinliğine göre)
        const shadowAngle = (Math.PI * 2 * i) / shadowCount + index * 0.3; // Index ile hafif farklılık
        const shadowRadius = radius * (0.2 + i * 0.1); // Derinlik seviyelerine göre
        const shadowX = x + Math.cos(shadowAngle) * shadowRadius * 0.3;
        const shadowY = y + 5 + (i * 3); // Derinlik seviyesi
        
        const shadowSize = 2 + i * 1; // Derinlik arttıkça büyük gölge
        const alpha = 0.6 - (i * 0.15); // Derinlik arttıkça açık gölge
        
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(shadowX, shadowY, shadowSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Çukur merkezinde daha koyu sabit gölge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y + 15, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
}

function drawHoleParticles(x, y, radius, colors, time, index) {
    // Çukur etrafında sabit toprak/taş parçacıkları (rastgele saçılmış)
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
        // Sabit pozisyonlar (index ile seed oluştur)
        const seed = index * 100 + i;
        const angle = (seed * 0.1) % (Math.PI * 2);
        const distance = radius + 10 + (seed * 0.05) % 15;
        const particleX = x + Math.cos(angle) * distance;
        const particleY = y - 3 + (seed * 0.03) % 6;
        
        const size = 1 + (seed * 0.02) % 1.5;
        
        // Sabit renk (index ile belirlensin)
        const colorIndex = (seed + i) % colors.length;
        ctx.fillStyle = colors[colorIndex];
        ctx.beginPath();
        ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Alt kısımdaki delikleri gerçek çukur/delik gibi çiz
function drawCupBucket(centerX, floorY, radius, score, index) {
    // Gerçek delik görünümü için tasarım
    const innerRadius = radius - 3;
    const holeDepth = radius * 0.8; // Delik derinliği

    ctx.save();

    // Ana delik alanı - elips şeklinde (perspektif etkisi için)
    ctx.beginPath();
    ctx.ellipse(centerX, floorY, radius, radius * 0.6, 0, 0, Math.PI * 2);
    
    // Delik gradyanı - gerçek çukur gibi (üst koyu, merkez daha koyu, kenar açık)
    const holeGrad = ctx.createRadialGradient(centerX, floorY, 0, centerX, floorY, radius);
    holeGrad.addColorStop(0.0, '#000510'); // Merkez çok koyu (delik dibi)
    holeGrad.addColorStop(0.3, '#0a1530'); // İç kısım koyu
    holeGrad.addColorStop(0.6, '#1a2550'); // Orta kısım
    holeGrad.addColorStop(0.85, '#2a3570'); // Kenar yakını
    holeGrad.addColorStop(1.0, '#3a4590'); // En dış kenar açık

    ctx.fillStyle = holeGrad;
    ctx.fill();

    // Delik kenarında parlak çerçeve (zemin seviyesi)
    ctx.beginPath();
    ctx.ellipse(centerX, floorY, radius, radius * 0.6, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // İç delik gölgesi - daha derin görünüm için
    ctx.beginPath();
    ctx.ellipse(centerX, floorY + 2, innerRadius * 0.8, innerRadius * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fill();

    // Üst kenar vurgusu (gerçek delik etkisi)
    ctx.beginPath();
    ctx.ellipse(centerX, floorY - 1, radius * 0.9, radius * 0.54, 0, 0, Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Alt kenar koyu çizgi (derinlik etkisi)
    ctx.beginPath();
    ctx.ellipse(centerX, floorY + 1, radius * 0.9, radius * 0.54, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Skor etiketi (üstte, oyuk içinde) - Küçültülmüş
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(16 * (logicalWidth / 500))}px Arial`; // Daha da küçültüldü
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = 8;
    ctx.fillText(score, centerX, floorY - radius * 0.55);
    ctx.shadowBlur = 0;

    ctx.restore();
}

function drawBottomUI() {
    const floorY = logicalHeight - BOTTOM_MARGIN;
    // Arka plan barı
    ctx.fillStyle = '#11153c';
    ctx.fillRect(0, floorY, logicalWidth, BOTTOM_MARGIN);

    // Üst çizgi
    ctx.fillStyle = '#1E61FF';
    ctx.fillRect(0, floorY, logicalWidth, 6);

    // Alt kaplar (resimdeki gibi yarım daireler) - Balon boyutuna göre dinamik
    const holeRadius = Math.max(30, BUBBLE_RADIUS * 2.0); // Balon boyutunun 2 katı
    buckets.forEach((bucket, index) => {
        const cupX = bucket.x + bucket.width / 2;
        const cupY = floorY; // merkez zeminde; üstte yarım daire görünecek
        drawCupBucket(cupX, cupY, holeRadius, bucket.score, index);
    });

    // ----- Lava balonu stok ikonu -----
    // Lava ikonunu sağ tarafta, termometrenin biraz altına taşı (powerball menüsünün üstünde)
    const lavaIconX = (logicalWidth - 18) - (BUBBLE_RADIUS * 2.4);
    // Tablet yukarıda, telefon aşağıda
    const lavaYOffset = logicalWidth > 600 ? -4.5 : 3.2; // Tablet: daha yukarı, Telefon: eski pozisyon
    const lavaIconY = floorY + BUBBLE_RADIUS * lavaYOffset;
    drawBubble(lavaIconX, lavaIconY, BUBBLE_RADIUS * 1.2, '#FF4500', 'lava');

    // Stok göstergesi (küçük yuvarlak içinde sayı)
    const stockRadius = BUBBLE_RADIUS * 0.6;
    const stockX = lavaIconX + BUBBLE_RADIUS * 0.9;
    const stockY = lavaIconY + BUBBLE_RADIUS * 0.9;
    ctx.beginPath();
    ctx.arc(stockX, stockY, stockRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,150,130,0.85)';
    ctx.fill();
    ctx.font = 'bold ' + (stockRadius * 1.2) + 'px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const displayedStock = lavaStock;
    ctx.fillText(displayedStock, stockX, stockY + 1);

    // ----- Sonraki balon(lar) önizleme -----
    if (nextBubble) {
        const previewCenterX = logicalWidth / 2;
        const previewY = lavaIconY;
        // Büyük (next) balon
        drawBubble(previewCenterX + BUBBLE_RADIUS * 0.6, previewY, BUBBLE_RADIUS, nextBubble.color, nextBubble.type);
        // Küçük balon: Mevcut balon rengini küçük göstermek (sıradaki sonrakinin olmadığını varsayarak)
        if (currentBubble) {
            drawBubble(previewCenterX - BUBBLE_RADIUS, previewY + BUBBLE_RADIUS * 0.3, BUBBLE_RADIUS * 0.6, currentBubble.color, currentBubble.type);
        }
    }

    // ----- Streak Bonus: Termometre Şeklinde Düzenleme -----
    const thermoCenterX = logicalWidth - 28; // Daha sağ kenara
    const bulbRadius = Math.max(10, Math.floor(BUBBLE_RADIUS * 0.6)); // Biraz büyük ampul
    const tubeWidth = Math.max(8, Math.floor(BUBBLE_RADIUS * 0.35)); // Daha ince tüp (termometre gibi)
    
    // Klasik termometre oranları: uzun tüp, büyük ampul
    const tubeTopY = logicalHeight * 0.38 + 20; // Biraz yukarıya çıkar (20px aşağı kaydırıldı)
    const bulbCenterY = logicalHeight * 0.56 + 20; // Ampul konumu sabit (20px aşağı kaydırıldı)
    const tubeHeight = Math.max(25, bulbCenterY - bulbRadius - tubeTopY); // Daha uzun tüp
    
    // Daha hafif titreme animasyonu
    const shakeIntensity = Math.min(streakCount * 0.4, 1.5); // Maksimum 1.5px
    const shakeTime = Date.now() * 0.01;
    const shakeX = Math.sin(shakeTime * (1 + streakCount * 0.3)) * shakeIntensity;
    const shakeY = Math.cos(shakeTime * (1 + streakCount * 0.5)) * shakeIntensity * 0.5;
    
    // Titreme offset'lerini uygula
    const animatedThermoCenterX = thermoCenterX + shakeX;
    const animatedTubeTopY = tubeTopY + shakeY;
    const animatedBulbCenterY = bulbCenterY + shakeY;

    ctx.save();
    // Tüp arka planı (animasyonlu konumda)
    ctx.lineWidth = 3; // Kalın kenarlık
    ctx.strokeStyle = '#FFFFFF';
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(animatedThermoCenterX - tubeWidth / 2, animatedTubeTopY, tubeWidth, tubeHeight);
    ctx.strokeRect(animatedThermoCenterX - tubeWidth / 2, animatedTubeTopY, tubeWidth, tubeHeight);

    // Doluluk (alttan yukarı) - kabarcık efekti ile
    const fillRatio = Math.max(0, Math.min(1, streakCount / 4)); // 5'ten 4'e düşürüldü
    const fillHeight = tubeHeight * fillRatio;
    
    // Renk geçişi - daha canlı renkler
    const startHue = 200; // Daha canlı mavi
    const endHue = 0;     // Kırmızı
    const hue = startHue + (endHue - startHue) * fillRatio;
    const saturation = 90 + fillRatio * 10; // Daha doygun renkler
    const lightness = 55 + fillRatio * 10;
    
    const grad = ctx.createLinearGradient(0, animatedTubeTopY, 0, animatedBulbCenterY);
    grad.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness + 10}%)`);
    grad.addColorStop(1, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
    
    // Kabarcık efekti - streak yüksekse daha çok kabarcık
    const bubbleCount = Math.floor(fillRatio * 3) + 1;
    const bubbleTime = Date.now() * 0.005;
    
    ctx.fillStyle = grad;
    ctx.fillRect(
        animatedThermoCenterX - tubeWidth / 2 + 2,
        animatedTubeTopY + (tubeHeight - fillHeight),
        tubeWidth - 4,
        fillHeight
    );
    
    // Kabarcık animasyonu
    if (fillRatio > 0.2) {
        ctx.fillStyle = `hsla(${hue}, 100%, 80%, 0.6)`;
        for (let i = 0; i < bubbleCount; i++) {
            const bubbleOffset = (bubbleTime + i * 2) % 4;
            const bubbleY = animatedTubeTopY + tubeHeight - fillHeight + bubbleOffset * (fillHeight * 0.25);
            const bubbleSize = 1 + Math.sin(bubbleTime * 2 + i) * 0.5;
            
            ctx.beginPath();
            ctx.arc(
                animatedThermoCenterX + (Math.sin(bubbleTime * 1.5 + i) * 2),
                bubbleY,
                bubbleSize,
                0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    // Ampul kısmı (büyük ve animasyonlu)
    ctx.beginPath();
    ctx.arc(animatedThermoCenterX, animatedBulbCenterY, bulbRadius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Yüksek streak'te ampul etrafında parçacık efekti
    if (streakCount >= 3) {
        const particleCount = Math.floor((streakCount - 2) * 2);
        const particleTime = Date.now() * 0.008;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + particleTime;
            const distance = bulbRadius + 8 + Math.sin(particleTime * 3 + i) * 4;
            const particleX = animatedThermoCenterX + Math.cos(angle) * distance;
            const particleY = animatedBulbCenterY + Math.sin(angle) * distance;
            
            ctx.fillStyle = `hsl(${10 + Math.sin(particleTime * 2 + i) * 20}, 100%, 70%)`;
            ctx.beginPath();
            ctx.arc(particleX, particleY, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Başlık ve çarpan yazısı (küçük ve kompakt)
    ctx.font = 'bold 10px Arial'; // Küçük başlık
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('SERİ', animatedThermoCenterX, animatedTubeTopY - 3);

    // Combo yazısı - küçük ama okunabilir
    ctx.font = 'bold 18px Arial'; // Küçük combo
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    // Combo animasyonu - daha hafif
    const comboScale = combo > 3 ? 1 + Math.sin(Date.now() * 0.01) * 0.05 : 1;
    const comboColor = combo > 5 ? '#FFE53B' : '#FFFFFF';
    
    ctx.save();
    ctx.scale(comboScale, comboScale);
    ctx.fillStyle = comboColor;
    ctx.fillText(combo + 'x', (animatedThermoCenterX - tubeWidth / 2 - 12) / comboScale, animatedBulbCenterY / comboScale);
    ctx.restore();
    
    ctx.restore();

    // ----- Powerball stok ikonları (lava dışında) -----
    // ----- Power-up ikonları: CANVAS'TAN KALDIRILDI, HTML BAR KULLANILIYOR -----
    // Canvas'taki power-up çizimi kaldırıldı
    // Artık alttaki HTML Power Ball Bar kullanılıyor
    bottomPowerUpIconHitboxes = []; // Temizle
}

function drawShooter() {
    if (!currentBubble) {
        console.log('⚠️ DRAW SHOOTER: currentBubble yok!');
        return;
    }
    if (!currentBubble.isMoving) { // Aiming line
        ctx.save();
        const dotSpacing = AIM_DOT_SPACING;
        const dotRadius = 4;
        // Offsets are updated by an independent animator; just consume values here
        if (!Array.isArray(aimPath) || aimPath.length === 0) {
            console.log('⚠️ DRAW SHOOTER: aimPath boş! aimDotOffset=', aimDotOffset);
        }
        // Take a snapshot to avoid mid-loop mutations causing undefined entries
        const path = Array.isArray(aimPath) ? aimPath.slice() : [];
        for (let i = aimDotOffset; i < path.length; i += dotSpacing) {
            const point = path[i];
            if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
                continue;
            }
            const { x, y } = point;
            
            // Neon glow efekti
            ctx.shadowColor = currentBubble.color;
            ctx.shadowBlur = 12;
            
            // Ana nokta
            ctx.beginPath();
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = currentBubble.color;
            ctx.fill();
            
            // İç parlak nokta
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(x, y, dotRadius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }
        ctx.restore();
    }
    drawBubble(currentBubble.x, currentBubble.y, currentBubble.radius, currentBubble.color, currentBubble.type);
}

// --- HESAPLAMA VE YARDIMCI FONKSİYONLAR ---
function getBubbleCoords(r, c) {
    // Hexagonal grid: tek satırlar yarım balon mesafesi sağa kaydırılır
    const offsetX = isOddRow(r) ? BUBBLE_RADIUS : 0;
    const x = gridOffsetX + c * BUBBLE_RADIUS * 2 + offsetX;
    const y = gridOffsetY + r * ROW_HEIGHT;
    return { x, y };
}

function isOddRow(r) {
    // ÖNEMLİ: hizalama satırın DİZİ İNDEKSİNDEN değil, satırın kendi
    // `.parity` özelliğinden okunur. shiftGridDown() yeni satır eklerken
    // (grid[r] = grid[r-1]) tüm satırlar bir alt indekse kayar; hizalama
    // index'e bağlı olsaydı her kayışta hex düzeni bozulur, balonlar üst
    // üste biner ve komşuluk/eşleşme hesabı yanlış sonuç verirdi.
    if (grid[r] && typeof grid[r].parity === 'number') return grid[r].parity === 1;
    return r % 2 !== 0;
}

function getGridPosFromCoords(x, y) {
    const r = Math.round((y - gridOffsetY) / ROW_HEIGHT);
    // Hexagonal grid için doğru offset hesaplama
    const cOffset = isOddRow(r) ? BUBBLE_RADIUS : 0;
    const c = Math.round((x - gridOffsetX - cOffset) / (BUBBLE_RADIUS * 2));
    
    // Sınırları kontrol et ve güvenli değer döndür
    const safeR = Math.max(0, Math.min(ROWS - 1, r));
    const maxC = isOddRow(safeR) ? COLS - 2 : COLS - 1;
    const safeC = Math.max(0, Math.min(maxC, c));
    
    // Eğer hesaplanan c değeri geçerli maksimumdan büyükse, kesinlikle sınırla
    if (c > maxC) {
        console.log(`⚠️ Grid sütun sınırı aşıldı: c=${c} > maxC=${maxC}, safeC=${safeC} kullanılıyor`);
    }
    
    return { r: safeR, c: safeC };
}

function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;  // GLOBAL değişkeni güncelle
    mouseY = e.clientY - rect.top;   // GLOBAL değişkeni güncelle
    
    // İmleç hızı hesaplama ve loglama
    const currentTime = performance.now();
    if (lastCursorTime) {
        const timeDelta = currentTime - lastCursorTime;
        if (timeDelta > 0) {
            const deltaX = mouseX - lastCursorX;
            const deltaY = mouseY - lastCursorY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const cursorSpeed = distance / timeDelta * 1000; // pixel/saniye
            
            if (cursorSpeed > 50) { // Sadece hızlı hareketlerde logla
                debugLog('touch', `🖱️ İmleç hızı: ${cursorSpeed.toFixed(0)} px/s`);
            }
        }
    }
    lastCursorTime = currentTime;
    lastCursorX = mouseX;
    lastCursorY = mouseY;
    
    // Power-up hover kontrolü
    checkPowerUpHover(mouseX, mouseY);
    
    if (!currentBubble || currentBubble.isMoving) return;
    const angle = Math.atan2(mouseY - shooterY, mouseX - shooterX);
    currentBubble.angle = Math.max(-Math.PI * 0.9, Math.min(-Math.PI * 0.1, angle));
    updateAimPath();
}

function onMouseDown(e) {
    // Event yoksa (touch'dan geliyorsa) sadece atış yap
    if (!e) {
        if (!currentBubble || currentBubble.isMoving) return;
    } else {
        // Mouse event'i varsa lava kontrolü yap
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;  // GLOBAL değişkeni güncelle
        mouseY = e.clientY - rect.top;   // GLOBAL değişkeni güncelle

        // Lava ikonuna tıklandıysa önce lava dene
        if (tryUseLavaBubble(mouseX, mouseY)) {
            // Kullanım denemesi yapıldı, stok yoksa atış yapılmasın
            if (lavaStock < 0) lavaStock = 0; // güvenlik
            return;
        }

        // Ödül powerball ikonlarına tıklama ile kullanma
        debugLog('clicks', `🖱️ Mouse click at (${mouseX}, ${mouseY})`);
        debugLog('clicks', '📦 Power-up hitboxes:', bottomPowerUpIconHitboxes);
        
        for (const hb of bottomPowerUpIconHitboxes) {
            const distance = Math.hypot(mouseX - hb.x, mouseY - hb.y);
            debugLog('clicks', `🎯 Testing ${hb.type} at (${hb.x}, ${hb.y}) with radius ${hb.r}, distance: ${distance}`);
            
            if (distance <= hb.r * 1.5) { // Biraz daha büyük hitbox alanı
                // Eğer power-up stokta yoksa (0 ise), reklam izleterek kazan
                if (!powerUpStock[hb.type] || powerUpStock[hb.type] <= 0) {
                    debugLog('clicks', `📺 Power-up ${hb.type} stokta yok, reklam gösteriliyor...`);
                    // Reklam izlettir ve başarılıysa power-up'ı ekle
                    window._pendingPowerUpReward = hb.type;
                    // ÖNEMLİ: AD_MEDIATION'ın gerçek metod adı showAdWithFallback'dir
                    // (showRewardedAd diye bir metodu yok — "is not a function" hatası
                    // yüzünden reklam hiç gösterilmiyor ve power-up hiç kazanılmıyordu).
                    AD_MEDIATION.showAdWithFallback('rewarded', {
                        onRewarded: () => {
                            console.log(`🎁 Reklam izlendi, ${window._pendingPowerUpReward} power-up kazanıldı!`);
                            addPowerUp(window._pendingPowerUpReward, 1);
                            // Hemen kullan
                            usePowerup(window._pendingPowerUpReward);
                            window._pendingPowerUpReward = null;
                            drawBottomUI();
                        }
                    }).catch(err => {
                        console.error('❌ Reklam gösterilemedi:', err);
                        window._pendingPowerUpReward = null;
                    });
                    return; // atış yapma
                }
                
                debugLog('clicks', `✅ Using power-up: ${hb.type}`);
                usePowerup(hb.type);
                // Tükettikten sonra alt UI'yi hemen güncelle
                drawBottomUI();
                return; // atış yapma
            }
        }

        if (!currentBubble || currentBubble.isMoving) return;
    }
    // Reentrancy guard to avoid duplicate shots from cascaded events
    if (window.__shootLock) return;
    window.__shootLock = true;

    // Ses efekti - atış sesi
    soundManager.play('shoot');
    
    currentBubble.isMoving = true;
    _shotAccumulator = 0; // yeni atış: birikimciyi sıfırla
    currentBubble.vx = Math.cos(currentBubble.angle) * CURRENT_SHOOTER_SPEED;
    currentBubble.vy = Math.sin(currentBubble.angle) * CURRENT_SHOOTER_SPEED;
    
    // Atış hızı loglaması
    const shootSpeed = Math.sqrt(currentBubble.vx * currentBubble.vx + currentBubble.vy * currentBubble.vy);
    debugLog('gameplay', `🚀 Atış hızı: ${shootSpeed.toFixed(0)} px/s (${CURRENT_SHOOTER_SPEED} base)`);
    // Release shoot lock shortly after firing
    setTimeout(() => { window.__shootLock = false; }, 80);
    
    shotsSinceShift++;
    
    // Strateji modunda hamle sayımını azalt
    if (gameMode === GAME_MODES.STRATEGY && shotsRemaining > 0) {
        shotsRemaining--;
        
        // Hamle bittiğinde oyunu sonlandır
        if (shotsRemaining <= 0) {
            setTimeout(() => {
                gameState = 'gameover';
                showEndScreen('Hamle hakkınız bitti!', `Skorunuz: ${score}`);
            }, 1000); // 1 saniye gecikme ile
        }
    }
}

function getCanvasRelativePos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function onTouchMove(e) {
    try {
        // Oyun oynamıyorsa hiçbir şey yapma
        if (gameState !== 'playing') return;
        
    debugLog('touch', '👆 onTouchMove triggered!', { type: e.type, touches: e.touches?.length, pointers: e.clientX });
        e.preventDefault?.();
        
        // Pointer event veya touch event desteği
        let clientX, clientY;
        if (e.touches && e.touches[0]) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.clientX !== undefined) {
            // Pointer event
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            console.error('⚠️ No touch or pointer data in onTouchMove!', e);
            return;
        }
        
        const pos = getCanvasRelativePos(clientX, clientY);
    
    // GLOBAL değişkenleri güncelle
    mouseX = pos.x;
    mouseY = pos.y;
    
    // Touch hızı hesaplama ve loglama
    const currentTime = performance.now();
    if (lastCursorTime) {
        const timeDelta = currentTime - lastCursorTime;
        if (timeDelta > 0) {
            const deltaX = pos.x - lastCursorX;
            const deltaY = pos.y - lastCursorY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const touchSpeed = distance / timeDelta * 1000; // pixel/saniye
            
            if (touchSpeed > 50) { // Sadece hızlı hareketlerde logla
                debugLog('touch', `👆 Touch hızı: ${touchSpeed.toFixed(0)} px/s`);
            }
        }
    }
    lastCursorTime = currentTime;
    lastCursorX = pos.x;
    lastCursorY = pos.y;
    
    // Power-up hover kontrolü (touch için)
    checkPowerUpHover(pos.x, pos.y);
    
    if (!currentBubble || currentBubble.isMoving) return;
    const angle = Math.atan2(pos.y - shooterY, pos.x - shooterX);
    currentBubble.angle = Math.max(-Math.PI * 0.9, Math.min(-Math.PI * 0.1, angle));
    updateAimPath();
    } catch (err) {
        console.error('❌ onTouchMove error:', err);
    }
}

function onTouchStart(e) {
    // Oyun oynamıyorsa hiçbir şey yapma
    if (gameState !== 'playing') return;
    
    debugLog('touch', '👆 onTouchStart triggered!', e.touches?.length);
    onTouchMove(e); // Açı güncelle
}


// Basit click handler - hem mouse hem touch için çalışır
function handleCanvasClick(e) {
    e.preventDefault();
    
    let pos;
    if (e.type === 'click' && e.clientX !== undefined) {
        // Mouse click
        pos = getCanvasRelativePos(e.clientX, e.clientY);
    } else if (e.changedTouches && e.changedTouches.length > 0) {
        // Touch
        pos = getCanvasRelativePos(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    } else {
        return;
    }
    
    debugLog('clicks', `🎯 Simple click at: (${pos.x}, ${pos.y})`);
    
    // BASIT POWER-UP KONTROL - her power-up için tek tek
    for (const hb of bottomPowerUpIconHitboxes) {
        const distance = Math.hypot(pos.x - hb.x, pos.y - hb.y);
    debugLog('clicks', `🔍 ${hb.type}: distance=${distance}, threshold=${hb.r * 2.5}`);
        
        if (distance <= hb.r * 2.5) { // Çok büyük alan
            debugLog('clicks', `🎉 POWER-UP CLICKED: ${hb.type}`);
            
            // Stok kontrolü
            if (powerUpStock[hb.type] && powerUpStock[hb.type] > 0) {
                usePowerup(hb.type);
                soundManager.play('powerup');
                return true; // Başarılı
            } else {
                debugLog('clicks', `❌ ${hb.type} stokta yok!`);
                return false;
            }
        }
    }
    
    // Lava kontrol
    const floorY = logicalHeight - BOTTOM_MARGIN;
    const thermoCenterX = logicalWidth - 18;
    const lavaIconX = thermoCenterX - (BUBBLE_RADIUS * 2.4);
    const lavaYOffset = logicalWidth > 600 ? 2.5 : 3.2; // Telefonda daha aşağı
    const lavaIconY = floorY + BUBBLE_RADIUS * lavaYOffset;
    const lavaDistance = Math.hypot(pos.x - lavaIconX, pos.y - lavaIconY);
    
    debugLog('clicks', `🌋 Lava distance: ${lavaDistance}, threshold: ${BUBBLE_RADIUS * 2.5}`);
    
    if (lavaDistance <= BUBBLE_RADIUS * 2.5) {
    debugLog('clicks', '🌋 LAVA CLICKED!');
        if (lavaStock > 0) {
            tryUseLavaBubble(pos.x, pos.y);
            return true;
        } else {
            debugLog('clicks', '❌ Lava stokta yok!');
            return false;
        }
    }
    
    return false; // Power-up/lava tıklanmadı
}

function onTouchEnd(e) {
    try {
    // Oyun oynamıyorsa hiçbir şey yapma
    if (gameState !== 'playing') return;
    
    // Mark entry to signal wrapper that handler executed
    window._lastTouchEndAt = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    debugLog('touch', '👆 onTouchEnd triggered!', { type: e.type, changedTouches: e.changedTouches?.length, hasClientX: e.clientX !== undefined });
        e.preventDefault?.();

        // Touch koordinatlarını al - pointer event veya touch event
        let clientX, clientY;
        if (e.changedTouches && e.changedTouches[0]) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else if (e.clientX !== undefined) {
            // Pointer event
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            console.error('⚠️ No touch or pointer data in onTouchEnd!', e);
            return;
        }

        const pos = getCanvasRelativePos(clientX, clientY);

        // Debug için koordinatları logla
    debugLog('touch', `👆 Touch at screen: (${clientX}, ${clientY})`);
    debugLog('touch', `👆 Touch at canvas: (${pos.x}, ${pos.y})`);
    debugLog('touch', `📦 Canvas size: ${logicalWidth}x${logicalHeight}`);
    debugLog('touch', '📦 Power-up hitboxes:', bottomPowerUpIconHitboxes);
        
        // Lava ikonuna dokunulduysa lava kullan
        if (tryUseLavaBubble(pos.x, pos.y)) {
            console.log(`🌋 Lava bubble used!`);
            return; // Lava kullanıldı, atış yapma
        }

        // Alt power-up ikonlarına dokunulduysa kullan - daha büyük hitbox ile
        for (const hb of bottomPowerUpIconHitboxes) {
            const distance = Math.hypot(pos.x - hb.x, pos.y - hb.y);
            debugLog('touch', `🎯 Testing ${hb.type} at (${hb.x}, ${hb.y}) with radius ${hb.r}, distance: ${distance}`);
            
            // Hitbox alanını daha da büyüt (mobil için)
            const effectiveRadius = hb.r * 2.0; // 2x büyütülmüş alan
            
            if (distance <= effectiveRadius) {
                e.stopPropagation?.(); // Event yayılmasını durdur
                
                // Eğer power-up stokta yoksa (0 ise), reklam izleterek kazan
                if (!powerUpStock[hb.type] || powerUpStock[hb.type] <= 0) {
                    debugLog('touch', `📺 Power-up ${hb.type} stokta yok, reklam gösteriliyor...`);
                    // Reklam izlettir ve başarılıysa power-up'ı ekle
                    window._pendingPowerUpReward = hb.type;
                    // ÖNEMLİ: AD_MEDIATION'ın gerçek metod adı showAdWithFallback'dir
                    // (showRewardedAd diye bir metodu yok — "is not a function" hatası
                    // yüzünden reklam hiç gösterilmiyor ve power-up hiç kazanılmıyordu).
                    AD_MEDIATION.showAdWithFallback('rewarded', {
                        onRewarded: () => {
                            console.log(`🎁 Reklam izlendi, ${window._pendingPowerUpReward} power-up kazanıldı!`);
                            addPowerUp(window._pendingPowerUpReward, 1);
                            // Hemen kullan
                            usePowerup(window._pendingPowerUpReward);
                            window._pendingPowerUpReward = null;
                            drawBottomUI();
                        }
                    }).catch(err => {
                        console.error('❌ Reklam gösterilemedi:', err);
                        window._pendingPowerUpReward = null;
                    });
                    return; // atış yapma
                }
                
                debugLog('touch', `✅ Using power-up: ${hb.type}`);
                
                // Power-up kullan
                if (usePowerup(hb.type)) {
                    // Visual feedback
                    soundManager.play('powerup');
                    drawBottomUI();
                    return; // atış yapma
                }
            }
        }
        
        // Bottom UI alanında dokunma varsa atış yapma
        const bottomUIY = logicalHeight - BOTTOM_MARGIN;
        if (pos.y >= bottomUIY - 40) { // Biraz yukarıyı da kapsa
            // Ekstra sağlamlık: En yakın power-up ya da lava ikonunu bul ve uygula
            let best = { type: null, dist: Infinity };
            for (const hb of bottomPowerUpIconHitboxes) {
                const dx = Math.abs(pos.x - hb.x); // Y'yi yok say, sadece yatay mesafe
                if (dx < best.dist) best = { type: hb.type, dist: dx };
            }
            // Lava ikonunu da dahil et (yoksa)
            const thermoCenterX = logicalWidth - 18;
            const lavaIconX = thermoCenterX - (BUBBLE_RADIUS * 2.4);
            const lavaDx = Math.abs(pos.x - lavaIconX);
            if (lavaDx < best.dist) best = { type: 'lava', dist: lavaDx };

            const thresholdX = Math.max(BUBBLE_RADIUS * 4.0, 140); // Çok cömert yatay eşik
            debugLog('touch', '🧲 Bottom area nearest (X-only):', best, 'thresholdX=', thresholdX);
            if (best.type && best.dist <= thresholdX) {
                e.stopPropagation();
                if (best.type === 'lava') {
                    if (lavaStock > 0) {
                        tryUseLavaBubble(pos.x, pos.y);
                        console.log('🌋 Nearest-select: lava used');
                        return;
                    } else {
                        console.log('❌ Nearest-select: lava no stock');
                    }
                } else {
                    if (powerUpStock[best.type] && powerUpStock[best.type] > 0) {
                        usePowerup(best.type);
                        soundManager.play('powerup');
                        drawBottomUI();
                        console.log(`✅ Nearest-select power-up: ${best.type}`);
                        return;
                    } else {
                        console.log(`❌ Nearest-select: ${best.type} no stock`);
                    }
                }
            }
        console.log(`🚫 Touch in bottom UI area, ignoring shot`);
        return;
    }

    if (!currentBubble) { console.warn('⚠️ currentBubble yok, spawnBubbles()'); try { spawnBubbles(); } catch(_) {}; return; }
    if (currentBubble.isMoving) return;
    onMouseDown(); // Atışı gerçekleştir (event'siz)
    } catch (err) {
        console.error('❌ onTouchEnd error:', err);
        // Hata olsa bile, güvenli fallback: uygun durumdaysa atış yapmayı dene
        try {
            if (!currentBubble || currentBubble.isMoving) return;
            onMouseDown();
        } catch (fallbackErr) {
            console.error('❌ onTouchEnd fallback error:', fallbackErr);
        }
    }
}

// Ensure our real touch handlers are bound globally (override early stubs)
try {
    window.onTouchStart = onTouchStart;
    window.onTouchMove = onTouchMove;
    window.onTouchEnd = onTouchEnd;
    console.log('✅ Bound touch handlers to window');
} catch (_) { /* ignore */ }

function updateBubblePosition(stepDt) {
    if (!currentBubble || !currentBubble.isMoving) return;
    // ✅ SABİT ALT-ADIM: gameLoop birikimciden FIXED_STEP (1/120s) geçirir.
    // Böylece mermi gerçek hızda ilerler (fps'ten bağımsız) ve tünelleme olmaz.
    const dt = (typeof stepDt === 'number' && isFinite(stepDt) && stepDt > 0)
        ? stepDt
        : Math.min(Math.max((typeof deltaTime === 'number' && isFinite(deltaTime)) ? deltaTime : (1/60), 1/120), 1/30);

    currentBubble.x += currentBubble.vx * dt;
    currentBubble.y += currentBubble.vy * dt;

    // Sol duvar çarpışması - gerçekçi fizik
    if (currentBubble.x - BUBBLE_RADIUS <= FRAME_PADDING) {
        currentBubble.x = BUBBLE_RADIUS + FRAME_PADDING; // Pozisyonu düzelt
        currentBubble.vx = -currentBubble.vx; // Yatay hızı ters çevir (elastik çarpışma)
        currentBubble.preferredSide = 'left'; // Yerleştirme için taraf ipucu
        // Dikey hız korunur
    }
    // Sağ duvar çarpışması - gerçekçi fizik  
    else if (currentBubble.x + BUBBLE_RADIUS >= logicalWidth - FRAME_PADDING) {
        currentBubble.x = logicalWidth - BUBBLE_RADIUS - FRAME_PADDING; // Pozisyonu düzelt
        currentBubble.vx = -currentBubble.vx; // Yatay hızı ters çevir (elastik çarpışma)
        currentBubble.preferredSide = 'right'; // Yerleştirme için taraf ipucu
        // Dikey hız korunur
    }

    if (currentBubble.type === 'lava') {
        // Lava ball sürekli ilerlesin: geçtiği yol üzerindeki balonları düşür, tepeye gelince bitir
        if (!currentBubble._cleared) {
            currentBubble._cleared = new Set();
        }

        // PERFORMANS OPTİMİZASYONU: Step count'u azalt
        const prevX = currentBubble.x - currentBubble.vx * dt;
        const prevY = currentBubble.y - currentBubble.vy * dt;
        const travelDist = Math.hypot(currentBubble.vx * dt, currentBubble.vy * dt);
        const stepCount = Math.max(2, Math.ceil(travelDist / BUBBLE_RADIUS)); // 0.5 -> 1 (yarıya düştü)
        const stepX = (currentBubble.x - prevX) / stepCount;
        const stepY = (currentBubble.y - prevY) / stepCount;

        // PERFORMANS: Sadece görünür alandaki satırları kontrol et
        const minRow = Math.max(0, Math.floor((currentBubble.y - BUBBLE_RADIUS * 3) / ROW_HEIGHT));
        const maxRow = Math.min(ROWS - 1, Math.ceil((currentBubble.y + BUBBLE_RADIUS * 3) / ROW_HEIGHT));

        let newlyDestroyed = 0;
        for (let step = 0; step <= stepCount; step++) {
            const checkX = prevX + step * stepX;
            const checkY = prevY + step * stepY;

            // PERFORMANS: Sadece yakın satırlarda ara (tüm grid değil!)
            for (let r = minRow; r <= maxRow; r++) {
                // 🔥 Grid satır kontrolü - crash önleme
                if (!grid[r] || !Array.isArray(grid[r])) continue;
                
                for (let c = 0; c < COLS; c++) {
                    const cell = grid[r][c];
                    if (!cell || cell.state === 'falling') continue;
                    
                    // PERFORMANS: Önce basit AABB kontrolü (hızlı eleme)
                    const bubbleCoords = getBubbleCoords(r, c);
                    const dx = Math.abs(checkX - bubbleCoords.x);
                    const dy = Math.abs(checkY - bubbleCoords.y);
                    const threshold = BUBBLE_RADIUS * 2.5;
                    
                    // Hızlı eleme - mesafe hesaplamadan
                    if (dx > threshold || dy > threshold) continue;
                    
                    // Şimdi gerçek mesafe hesapla
                    const distance = Math.hypot(dx, dy);

                    // Lava geniş alan etkisi: 2.5R yarıçap
                    if (distance < threshold) {
                        const key = `${r}-${c}`;
                        if (!currentBubble._cleared.has(key)) {
                            currentBubble._cleared.add(key);
                            cell.state = 'falling';
                            newlyDestroyed++;
                            // PERFORMANS: Parçacık sayısını azalt (8 -> 3)
                            createParticles(bubbleCoords.x, bubbleCoords.y, '#FF4500', 3, 'explosion');
                            score += 20 * combo;
                        }
                    }
                }
            }
        }

        // PERFORMANS: Trail parçacık azalt (3 -> 1)
        createParticles(currentBubble.x, currentBubble.y, '#FF4500', 1, 'explosion');

        // Tepeye ulaştıysa atışı tamamla
        if (currentBubble.y <= FRAME_PADDING) {
            const total = currentBubble._cleared.size;
            createParticles(currentBubble.x, currentBubble.y, '#FF4500', 30, 'explosion');
            
            // Lava streak bonusu
            streakCount++;
            if (streakCount >= 4) {
                lavaStock++;
                if (streakCount >= 8) {
                    lavaStock++;
                }
                streakCount %= 4;
                if (typeof drawBottomUI === 'function') {
                    drawBottomUI();
                }
            }
            
            handleFloatingBubbles();
            updateScore && updateScore();
            shotsSinceShift = 0;
            updateBubblesProgress(1);
            advanceBubbles();
            return;
        }

        // Normal yerleştirme/snap davranışını atlamak için her framede erken çık
        return;
    } else if (currentBubble.type === POWERUP_TYPES.FIREBALL) {
        // Lava/Fireball: Her framede geçtiği güzergâh üzerindeki balonları düşür, tepeye ulaşınca bitir
        if (!currentBubble._cleared) {
            currentBubble._cleared = new Set();
        }

        // PERFORMANS OPTİMİZASYONU: Step count'u azalt
        const prevX = currentBubble.x - currentBubble.vx * dt;
        const prevY = currentBubble.y - currentBubble.vy * dt;
        const travelDist = Math.hypot(currentBubble.vx * dt, currentBubble.vy * dt);
        const stepCount = Math.max(2, Math.ceil(travelDist / BUBBLE_RADIUS)); // 0.5 -> 1 (yarıya düştü)
        const stepX = (currentBubble.x - prevX) / stepCount;
        const stepY = (currentBubble.y - prevY) / stepCount;

        // PERFORMANS: Sadece görünür alandaki satırları kontrol et
        const minRow = Math.max(0, Math.floor((currentBubble.y - BUBBLE_RADIUS * 4) / ROW_HEIGHT));
        const maxRow = Math.min(ROWS - 1, Math.ceil((currentBubble.y + BUBBLE_RADIUS * 4) / ROW_HEIGHT));

        let newlyDestroyed = 0;
        for (let step = 0; step <= stepCount; step++) {
            const checkX = prevX + step * stepX;
            const checkY = prevY + step * stepY;

            // PERFORMANS: Sadece yakın satırlarda ara (tüm grid değil!)
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = 0; c < COLS; c++) {
                    const cell = grid[r][c];
                    if (!cell || cell.state === 'falling') continue;
                    
                    // PERFORMANS: Önce basit AABB kontrolü (hızlı eleme)
                    const bubbleCoords = getBubbleCoords(r, c);
                    const dx = Math.abs(checkX - bubbleCoords.x);
                    const dy = Math.abs(checkY - bubbleCoords.y);
                    const threshold = BUBBLE_RADIUS * 3;
                    
                    // Hızlı eleme - mesafe hesaplamadan
                    if (dx > threshold || dy > threshold) continue;
                    
                    // Şimdi gerçek mesafe hesapla
                    const distance = Math.hypot(dx, dy);

                    // Geniş alan etkisi: 3R yarıçap
                    if (distance < threshold) {
                        const key = `${r}-${c}`;
                        if (!currentBubble._cleared.has(key)) {
                            currentBubble._cleared.add(key);
                            cell.state = 'falling';
                            newlyDestroyed++;
                            // PERFORMANS: Parçacık sayısını azalt (10 -> 4)
                            createParticles(bubbleCoords.x, bubbleCoords.y, FIREBALL_COLOR, 4, 'fire');
                            score += 25 * combo;
                        }
                    }
                }
            }
        }

        // Alev topu izi (görsel)
        createParticles(currentBubble.x, currentBubble.y, FIREBALL_COLOR, 2, 'fire');

        // Tepeye ulaştıysa atışı tamamla
        if (currentBubble.y <= FRAME_PADDING) {
            const total = currentBubble._cleared.size;
            createParticles(currentBubble.x, currentBubble.y, FIREBALL_COLOR, 40, 'explosion');
            handleFloatingBubbles();
            updateScore && updateScore();
            advanceBubbles();
            return;
        }

        // Normal yerleştirme/snap davranışını atlamak için her framede erken çık
        return;
        
    } else {
    // Normal balon çarpışma kontrolü - kesinlikle tunneling yok
        if (currentBubble.y < BUBBLE_RADIUS) {
            snapBubbleToGrid();
            return;
        }
        
        // Mutlak çarpışma tespiti - hiçbir top diğerinin içinden geçemez
        const prevX = currentBubble.x - currentBubble.vx * dt;
        const prevY = currentBubble.y - currentBubble.vy * dt;
        const collisionRadius = BUBBLE_RADIUS * 2;
        
        // Çok küçük adımlarla hareket yolunu kontrol et
        const stepCount = Math.max(8, Math.ceil(Math.hypot(currentBubble.vx * dt, currentBubble.vy * dt) / (BUBBLE_RADIUS * 0.5)));
        const stepX = (currentBubble.x - prevX) / stepCount;
        const stepY = (currentBubble.y - prevY) / stepCount;
        
        for (let step = 0; step <= stepCount; step++) {
            const checkX = prevX + step * stepX;
            const checkY = prevY + step * stepY;
            
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (grid[r][c]) {
                        const bubbleCoords = getBubbleCoords(r, c);
                        const dx = checkX - bubbleCoords.x;
                        const dy = checkY - bubbleCoords.y;
                        const distance = Math.hypot(dx, dy);
                        
                        if (distance < collisionRadius) {
                            // Çarpışma anında yerleştir - hiçbir geçiş yok
                            currentBubble.x = checkX;
                            currentBubble.y = checkY;
                            
                            lastCollisionHint = {
                                r,
                                c,
                                dirX: dx,
                                dirY: dy
                            };
                            snapBubbleToGrid();
                            return;
                        }
                    }
                }
            }
        }
    }

    if (currentBubble.y < BUBBLE_RADIUS) {
        snapBubbleToGrid();
        return;
    }
}

function snapBubbleToGrid() {
    currentBubble.isMoving = false;

    // ÖNEMLİ: çarpışma anında HANGİ balona değinildiği biliniyorsa
    // (lastCollisionHint), iniş hücresi o balonun BOŞ KOMŞULARINDAN seçilir.
    // Eskiden burada topun (x,y) konumundan bağımsız bir satır/sütun tahmini
    // yapılıyordu (getGridPosFromCoords) — bu tahmin, gerçekte çarpılan
    // balonla alakasız olabiliyor, özellikle duvardan sekme sonrası top
    // çarptığı balonun yanına değil uzak bir satır/sütuna yerleşebiliyordu
    // ("bir satır atlayıp" başka bir balonu patlatma hatası). Artık iniş
    // noktası her zaman gerçekten dokunulan balona bitişik oluyor.
    let r, c, usedHint = false;
    if (lastCollisionHint) {
        const hr = lastCollisionHint.r, hc = lastCollisionHint.c;
        let bestR = -1, bestC = -1, bestD = Infinity;
        for (const nb of getNeighbors(hr, hc)) {
            const maxCForNb = isOddRow(nb.r) ? COLS - 2 : COLS - 1;
            if (nb.c > maxCForNb || nb.c < 0) continue;
            const row = ensureGridRow(nb.r);
            if (row[nb.c]) continue;
            const coords = getBubbleCoords(nb.r, nb.c);
            const d = Math.hypot(currentBubble.x - coords.x, currentBubble.y - coords.y);
            if (d < bestD) { bestD = d; bestR = nb.r; bestC = nb.c; }
        }
        if (bestR !== -1) {
            r = bestR; c = bestC; usedHint = true;
            debugLog('gameplay', `🎯 snapBubbleToGrid: collision-hint kullanıldı, çarpılan=(${hr},${hc}) -> yerleşim=(${r},${c})`);
        }
    }
    if (!usedHint) {
        ({ r, c } = getGridPosFromCoords(currentBubble.x, currentBubble.y));
    }
    let rowRef = ensureGridRow(r);

    // Grid pozisyonu geçerli mi kontrol et - odd row'larda bir sütun daha az kullanılır
    const maxC = isOddRow(r) ? COLS - 2 : COLS - 1;
    
    debugLog('gameplay', `📍 snapBubbleToGrid: bubble pos=(${currentBubble.x.toFixed(1)}, ${currentBubble.y.toFixed(1)}), grid pos=(${r}, ${c}), maxC=${maxC}, isOdd=${isOddRow(r)}`);
    
    // Eğer hesaplanan pozisyon grid sınırları dışındaysa, daha akıllı bir düzeltme yap
    if (c > maxC) {
        debugLog('gameplay', `⚠️ Sağ sınır düzeltmesi: c=${c} -> ${maxC}, r=${r}`);
        // Önce sağ sınırda boş yer var mı kontrol et
        if (!rowRef[maxC]) {
            c = maxC;
        } else {
            // Sağ sınır doluysa, daha sol tarafta boş yer ara
            for (let testC = maxC - 1; testC >= 0; testC--) {
                if (!rowRef[testC]) {
                    debugLog('gameplay', `✅ Sağ sınır dolu, alternatif pozisyon bulundu: c=${testC}`);
                    c = testC;
                    break;
                }
            }
        }
    }
    if (c < 0) {
        debugLog('gameplay', `⚠️ Sol sınır düzeltmesi: c=${c} -> 0, r=${r}`);
        // Önce sol sınırda boş yer var mı kontrol et
        if (!rowRef[0]) {
            c = 0;
        } else {
            // Sol sınır doluysa, daha sağ tarafta boş yer ara
            for (let testC = 1; testC <= maxC; testC++) {
                if (!rowRef[testC]) {
                    debugLog('gameplay', `✅ Sol sınır dolu, alternatif pozisyon bulundu: c=${testC}`);
                    c = testC;
                    break;
                }
            }
        }
    }
    
    // Grid array'i sınırları da kontrol et
    if (!rowRef) {
        debugLog('gameplay', `❌ Grid satır hatası: r=${r}, grid[r]=${grid[r]}`);
        console.warn('⚠️ Grid bozuk, güvenli pozisyon seçiliyor...');
        r = Math.min(ROWS - 1, Math.max(0, r));
        c = Math.floor(COLS / 2);
        rowRef = ensureGridRow(r);
    }
    
    // Grid array sınırlarını kontrol et - ama odd row'larda daha az sütun kullanıldığını unutma
    if (c >= rowRef.length) {
        debugLog('gameplay', `❌ Grid sütun hatası: c=${c} >= grid[${r}].length=${rowRef.length}`);
        soundManager.play('gameOver');
        gameState = 'gameover';
        showEndScreen('lose');
        return;
    }
    
    // Eğer o pozisyon dolu ise, basit kural: aynı sütunda bir alt sıraya yerleştir
    if (rowRef[c]) {
        const maxCFor = (row) => (isOddRow(row) ? COLS - 2 : COLS - 1);
        const clampCol = (row, col) => Math.max(0, Math.min(col, maxCFor(row)));

        let targetR = Math.min(r + 1, ROWS - 1);
        let targetC = clampCol(targetR, c);

        // Eğer o hücre de doluysa, aynı satırda en yakın boş sütunu tara (sol/sağ)
        if (ensureGridRow(targetR)[targetC]) {
            let foundC = null;
            const maxC = maxCFor(targetR);
            for (let dc = 1; dc <= maxC; dc++) {
                const left = targetC - dc;
                const right = targetC + dc;
                if (left >= 0 && !ensureGridRow(targetR)[left]) { foundC = left; break; }
                if (right <= maxC && !ensureGridRow(targetR)[right]) { foundC = right; break; }
            }
            if (foundC !== null) {
                targetC = foundC;
            } else {
                // O satır tamamen doluysa, mevcut davranışı koru: aynı hücrede bırak (ileride game over tetiklenebilir)
                debugLog('gameplay', `⚠️ Alt satır tamamen dolu: r=${targetR}. Daha fazla arama yapılmadı.`);
            }
        }

        debugLog('gameplay', `⬇️ Dolu hücre, alt sıraya yerleştiriliyor: (${r},${c}) -> (${targetR},${targetC})`);
        r = targetR;
        c = targetC;
        rowRef = ensureGridRow(r);
    }
    
    debugLog('gameplay', `✅ Pozisyon boş, balon yerleştiriliyor: r=${r}, c=${c}`);

    // Balonu grid'e yerleştir - güvenlik kontrolü
    if (rowRef && Array.isArray(rowRef)) {
        rowRef[c] = { color: currentBubble.color, type: currentBubble.type, state: 'landed' };
    } else {
        console.error(`❌ Grid assignment failed: r=${r}, grid[r]=${grid[r]}`);
        resetCurrentBubble();
        return;
    }

    // Çarpışma ipucunu sıfırla
    lastCollisionHint = null;
    
    // Eğer pozisyon değiştirildiyse, görsel geri bildirim ver
    const originalPos = getGridPosFromCoords(currentBubble.x, currentBubble.y);
    if (originalPos.r !== r || originalPos.c !== c) {
        debugLog('gameplay', `🎯 Balon yeniden konumlandırıldı: (${originalPos.r}, ${originalPos.c}) -> (${r}, ${c})`);
        // Pozisyon değişikliği için özel efekt
        const coords = getBubbleCoords(r, c);
        createParticles(coords.x, coords.y, currentBubble.color, 5, 'explosion');
    }

    // Başarı durumu için lav topu sayacı
    let successfulShot = false;
    // Güç balonu mu?
    if (grid[r][c].type === POWERUP_TYPES.BOMB) {
        triggerBomb(r, c);
        combo++;
        successfulShot = true;
    } else if (grid[r][c].type === POWERUP_TYPES.LASER) {
        triggerLaser(r, c);
        combo++;
        successfulShot = true;
    } else if (grid[r][c].type === POWERUP_TYPES.VERTICAL_LASER) {
        triggerVerticalLaser(r, c);
        combo++;
        successfulShot = true;
    } else if (grid[r][c].type === POWERUP_TYPES.RAINBOW) {
        triggerRainbow(r, c);
        combo++;
        successfulShot = true;
    } else if (grid[r][c].type === POWERUP_TYPES.FIREBALL) {
        triggerFireball(r, c);
        combo++;
        successfulShot = true;
    } else if (grid[r][c].type === POWERUP_TYPES.FREEZE) {
        triggerFreeze();
        combo++;
        successfulShot = true;
    } else if (grid[r][c].type === 'lava') {
        triggerLava(r, c);
        combo++;
        successfulShot = true;
    } else {
        // Normal küme kontrolü
        const cluster = findCluster(r, c);
        if (cluster.length >= 3) {
            combo++;
            const points = cluster.length * 10 * combo;
            score += points;
            
            // Combo ses efekti
            if (combo > 1) {
                soundManager.play('combo');
            }
            
            cluster.forEach(({ r: cr, c: cc }) => {
                const bubbleCoords = getBubbleCoords(cr, cc);
                createParticles(bubbleCoords.x, bubbleCoords.y, grid[cr][cc].color, 8, 'explosion');
                soundManager.play('pop'); // Balon patlatma sesi
                grid[cr][cc] = null;
            });
            
            // İstatistik takibi - küme patlatma
            trackBubblePop(cluster.length);
            
            successfulShot = true;
            debugLog('gameplay', `🎯 Normal küme patladı: ${cluster.length} balon, successfulShot: ${successfulShot}`);
            
            // Combo bonusu kontrol
            if (cluster.length >= 5) {
                checkAchievement('big_cluster');
            }
            if (combo >= 5) {
                checkAchievement('combo_master');
            }
        } else {
            combo = 1;
        }
    }
    
    // Her balon yerleştirmesinden sonra asılı kalan balonları kontrol et
    handleFloatingBubbles();
    updateScore();
    
    // Tüm balonlar temizlendi mi?
    if (grid.flat().every(cell => cell === null)) {
        checkAchievement('level_complete');
        if (currentLevel % 5 === 0) {
            checkAchievement('milestone');
        }
        
        // 🔥 PERFORMANCE: Aggressive cleanup before level transition
        particles = [];
        fallingBubbles = [];
        floatingScores = [];
        debugLog('performance', '🧹 Level transition: Cleared all dynamic arrays');
        
        // İstatistikleri güncelle
        updatePlayerStats('win');
        
        currentLevel++;
        soundManager.play('levelUp');
        
        // Reklam kontrolü
        adManager.onLevelComplete(currentLevel);
        
        // Level progress'i güncelle
        updateMaxLevel(currentLevel);
        updateBubblesProgress(10); // Her level için 10 bubble progress ekle
        
        // Seviye geçiş ekranını göster
        showLevelCompleteScreen();
        return; // diğer işlemlere gerek yok
    }

    // Streak ve lava balonu stoğu güncelle
    if (successfulShot) {
        streakCount++;
        debugLog('gameplay', `✅ Başarılı atış! streakCount: ${streakCount}, lavaStock: ${lavaStock}`);
        if (streakCount >= 4) { // 5'ten 4'e düşürüldü
            // Birincil ödül: 4 ardışık isabet = 1 lava
            lavaStock++;
            debugLog('gameplay', `🔥 Lava balonu kazandınız! Yeni lavaStock: ${lavaStock}`);
            // Ek bonus: 8 ardışık isabet = +1 ek lava (toplam +2)
            if (streakCount >= 8) { // 10'dan 8'e düşürüldü
                lavaStock++;
                debugLog('gameplay', `🔥🔥 Bonus lava! Yeni lavaStock: ${lavaStock}`);
            }
            // Streaki devam ettirmek yerine 0 yerine kalan değeri koru (örn. 6 -> 2)
            streakCount %= 4; // 5'ten 4'e düşürüldü
            // Lava balonu simgesini anında güncelle
            if (typeof drawBottomUI === 'function') {
                drawBottomUI();
            }
        }
        // Başarılı atış, ızgara kaydırma sayacını sıfırla
        shotsSinceShift = 0;
        
        // Bubble progress güncelle (başarılı atışlarda)
        updateBubblesProgress(1);
    } else {
    debugLog('gameplay', '❌ Başarısız atış! streakCount sıfırlandı.');
        streakCount = 0;
    }

    // Izgara kaydırma kontrolü
    if (shotsSinceShift >= SHIFT_THRESHOLD) {
        shiftGridDown();
        shotsSinceShift = 0;
    }
    
    // ✨ YENİ: Koordinat bazlı oyun bitişi kontrolü
    // Grid'deki en alt balonun Y koordinatını bul
    let lowestBubbleY = 0;
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            if (grid[row][col]) {
                const coords = getBubbleCoords(row, col);
                const bubbleBottomY = coords.y + BUBBLE_RADIUS;
                if (bubbleBottomY > lowestBubbleY) {
                    lowestBubbleY = bubbleBottomY;
                }
            }
        }
    }
    
    // NOT: Bu Y-koordinat tabanlı eşik, ROWS küçük/bayat kaldığında (bazı
    // cihazlarda gerçek oluyor) başlangıç dolgusuyla bile yanlışlıkla
    // tetiklenebiliyordu. Asıl güvenilir "kaybettin" tetikleyicisi artık
    // shiftGridDown() içindeki kapasite-taşması güvenlik ağı — bu kontrol
    // kasıtlı olarak eskisi gibi pratikte erişilemez bırakıldı (zararsız).
    const gameOverThreshold = logicalHeight - BOTTOM_MARGIN - BUBBLE_RADIUS * 2;

    debugLog('gameplay', `🔍 Game Over Check: lowestBubbleY=${lowestBubbleY.toFixed(1)}, threshold=${gameOverThreshold.toFixed(1)}`);
    
    if (lowestBubbleY >= gameOverThreshold) {
        // Eğer oyun zaten bitmiş durumdaysa, tekrar işlem yapma
        if (gameState === 'gameover') {
            debugLog('gameplay', '⚠️ Game already over, skipping second game over trigger');
            return;
        }
        
        debugLog('gameplay', `🎮 GAME OVER TRIGGERED: lowestY=${lowestBubbleY.toFixed(1)} >= threshold=${gameOverThreshold.toFixed(1)}`);
        gameState = 'gameover';
        soundManager.play('gameOver'); // Oyun bitti sesi
        updatePlayerStats('lose'); // İstatistikleri güncelle
        if (adManager) adManager.onGameOver(); // Reklam göster
        showEndScreen('lose');
        restartBtn.style.display = 'none';
    } else {
        advanceBubbles();
    }
}

function findCluster(startR, startC) {
    const colorToMatch = grid[startR][startC].color;
    const stack = [{ r: startR, c: startC }];
    const visited = new Set([`${startR},${startC}`]);
    const cluster = [];

    while (stack.length > 0) {
        const { r, c } = stack.pop();
        cluster.push({r, c});
        
        getNeighbors(r, c).forEach(n => {
            const key = `${n.r},${n.c}`;
            if (!visited.has(key) && grid[n.r]?.[n.c]?.color === colorToMatch) {
                visited.add(key);
                stack.push(n);
            }
        });
    }
    return cluster;
}

function handleFloatingBubbles() {
    const connected = new Set();
    if (!grid || !grid[0]) return; // guard: tavan satırı yoksa çık
    for (let c = 0; c < COLS; c++) {
        if (grid[0][c] && grid[0][c].state !== 'falling') {
            const stack = [{r: 0, c}];
            connected.add(`0,${c}`);
            
            while(stack.length > 0) {
                const {r, c} = stack.pop();
                getNeighbors(r,c).forEach(n => {
                    const key = `${n.r},${n.c}`;
                    if (grid[n.r]?.[n.c] && grid[n.r][n.c].state !== 'falling' && !connected.has(key)) {
                        connected.add(key);
                        stack.push(n);
                    }
                });
            }
        }
    }
    
    let droppedCount = 0;
    for(let r=0; r<ROWS; r++) {
        if (!grid[r]) continue; // guard: eksik satırı atla (crash önleme)
        for(let c=0; c<COLS; c++) {
            const key = `${r},${c}`;
            if(grid[r][c] && (!connected.has(key) || grid[r][c]?.state === 'falling')) {
                const bubble = grid[r][c];
                grid[r][c] = null;
                
                // İstatistik takibi - düşen balonlar da sayılsın
                trackBubblePop(1);
                
                const { x, y } = getBubbleCoords(r, c);
                fallingBubbles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 50, // Daha yavaş yatay hareket
                    vy: 0, // ⚡ SABİT BAŞLANGIÇ HIZI - Tutarlı düşme için gravity belirlecek hızı
                    radius: BUBBLE_RADIUS,
                    color: bubble.color,
                    type: bubble.type,
                    floorBounceCount: 0
                });
                droppedCount++;
            }
        }
    }

    if (droppedCount > 0) {
        score += droppedCount * 50 * combo; // Düşürme için bonus puan
        updateScore();
    }
}

function updateFallingBubbles(stepDt) {
    // ✅ SABİT ALT-ADIM: gameLoop birikimciden FALL_STEP geçirir (gerçek hız, fps'ten bağımsız)
    // Eski sabit 1/60, düşük fps'te düşen topları ağır çekime sokuyordu -> "düşerken takılma"
    const dt = (typeof stepDt === 'number' && isFinite(stepDt) && stepDt > 0) ? stepDt : 1/60;
    
    // 🔥 PERFORMANCE: Aggressively clean off-screen bubbles
    if (fallingBubbles.length > 50) {
        const safeZone = logicalHeight + 200; // 200px margin below screen
        for (let i = fallingBubbles.length - 1; i >= 0; i--) {
            if (fallingBubbles[i].y > safeZone) {
                fallingBubbles.splice(i, 1);
            }
        }
    }
    
    for (let i = fallingBubbles.length - 1; i >= 0; i--) {
        const bubble = fallingBubbles[i];
        
        // 🔥 PERFORMANCE: Remove bubbles way off-screen
        if (bubble.y > logicalHeight + 500 || bubble.x < -200 || bubble.x > logicalWidth + 200) {
            fallingBubbles.splice(i, 1);
            continue;
        }
        
        // Tüp emilme modu kontrolü
        if (bubble.tubeMode) {
            updateTubeAbsorption(bubble, i);
            continue;
        }
        
        bubble.vy += CURRENT_GRAVITY * dt; // Screen-normalized gravity for consistent physics
        
        // Düşen top hızı loglaması (optimize edilmiş frekans + detay)
        if (Math.random() < 0.008) { // Daha az sıklık, daha iyi performans
            const fallSpeed = Math.sqrt(bubble.vx * bubble.vx + bubble.vy * bubble.vy);
            const ballCount = fallingBubbles ? fallingBubbles.length : 0;
            debugLog('gameplay', `⬇️ Düşen top hızı: ${fallSpeed.toFixed(0)} px/s (gravity: ${CURRENT_GRAVITY}, multiplier: ${STABLE_SPEED_MULTIPLIER.toFixed(3)}, base: ${GRAVITY}) [Toplar: ${ballCount}] FIXED-DT`);
        }
        
        bubble.x += bubble.vx * dt;
        bubble.y += bubble.vy * dt;
        
        // Duvarlardan sekme
        if (bubble.x - bubble.radius < 0 || bubble.x + bubble.radius > logicalWidth) {
            bubble.vx *= -0.8;
            bubble.x = Math.max(bubble.radius, Math.min(logicalWidth - bubble.radius, bubble.x));
            // ⚡ RASTGELE HIZ DEĞİŞİMİ KALDIRILDI - Tutarlı fizik için
        }

        // Çukur/Delik Çarpışma Kontrolü
        const HOLE_RADIUS = 35;
        const floorY = logicalHeight - BOTTOM_MARGIN;

        buckets.forEach((bucket, bucketIndex) => {
            const holeX = bucket.x + bucket.width / 2;
            const holeY = floorY;
            
            // Çukura olan mesafe
            const distanceToHole = Math.sqrt(
                Math.pow(bubble.x - holeX, 2) + 
                Math.pow(bubble.y - holeY, 2)
            );
            
            // Çukur düşme alanı kontrolü
            if (distanceToHole < HOLE_RADIUS && bubble.y > holeY - 10) {
                // Çukura düşme modunu başlat
                startHoleFallAbsorption(bubble, bucket, holeX, holeY);
                return;
            }
            
            // Çukur kenarına çarpma (yumuşak kayma)
            if (distanceToHole < HOLE_RADIUS + bubble.radius + 5 && bubble.y > holeY - 20) {
                // Çukur kenarında kayma kuvveti (çukura doğru çek)
                const pullAngle = Math.atan2(holeY - bubble.y, holeX - bubble.x);
                const pullForce = 30;
                
                bubble.vx += Math.cos(pullAngle) * pullForce * dt;
                bubble.vy += Math.sin(pullAngle) * pullForce * dt;
                
                // Toprak parçacık efekti
                if (Math.random() < 0.2) {
                    createHoleDustEffect(holeX, holeY, bucketIndex);
                }
            }
        });
        
        // Gelişmiş zemin kontrolü ve zıplama sistemi
        const bottomY = floorY + 30;
        if (bubble.y + bubble.radius > bottomY) {
            if ((bubble.floorBounceCount || 0) < 3) { // 3 zıplama hakkı ver
                // Zıplama fiziği - her zıplamada azal
                const bounceReduction = 0.7 - (bubble.floorBounceCount * 0.1);
                bubble.vy *= -bounceReduction; // Yukarı zıpla
                bubble.y = bottomY - bubble.radius; // Pozisyonu düzelt
                bubble.floorBounceCount = (bubble.floorBounceCount || 0) + 1;
                bubble.vx *= 0.85; // Yatay sürtünme
                
                // Zıplama efekti
                createParticles(bubble.x, bottomY, bubble.color, 3, 'dust');
                
                // Her zıplamada deliklere girme şansını kontrol et
                checkHoleEntry(bubble, i);
            } else {
                // 3 zıplamadan sonra son şans kontrol
                const bucket = buckets.find(b => 
                    bubble.x >= b.x - 20 && bubble.x <= b.x + b.width + 20
                );
                if (bucket) {
                    // Delik puanı göster
                    createTubeScore(bubble.x, bubble.y, bucket.score);
                    score += bucket.score;
                    updateScore();
                    
                    // Başarılı girme efekti
                    createParticles(bubble.x, bubble.y, '#FFD700', 8, 'explosion');
                    
                    debugLog('gameplay', `🎯 Top deliğe girdi! Puan: ${bucket.score}`);
                } else {
                    debugLog('gameplay', `💔 Top deliklere giremedi, kayboldu`);
                }
                fallingBubbles.splice(i, 1);
            }
        } else {
            // Havada iken de delik kontrolü yap
            checkHoleEntry(bubble, i);
        }
    }
}

// Delik girme kontrolü - her zıplamada ve havada iken çağrılır
function checkHoleEntry(bubble, bubbleIndex) {
    // floorY global değilse güvenli şekilde hesapla
    const floorYLocal = typeof floorY !== 'undefined' ? floorY : (logicalHeight - BOTTOM_MARGIN);
    
    for (let bucketIndex = 0; bucketIndex < buckets.length; bucketIndex++) {
        const bucket = buckets[bucketIndex];
        const holeX = bucket.x + bucket.width / 2;
        const holeY = floorYLocal + 20; // Delik Y pozisyonu
        const holeRadius = Math.max(20, BUBBLE_RADIUS * 1.0); // Delik yarıçapı - balon boyutuna orantılı
        
        // Topun deliğe yakınlığını kontrol et
        const distance = Math.hypot(bubble.x - holeX, bubble.y - holeY);
        
        if (distance < holeRadius + bubble.radius) {
            // Deliğe giriş animasyonu başlat
            debugLog('gameplay', `🎯 Top deliğe girmeye başladı! Bucket: ${bucketIndex}, Puan: ${bucket.score}`);
            
            // Delik puanını hemen göster
            createTubeScore(bubble.x, bubble.y, bucket.score);
            score += bucket.score;
            updateScore();
            
            // Girme efekti
            createParticles(holeX, holeY, '#FFD700', 12, 'explosion');
            createHoleDustEffect(holeX, holeY, bucketIndex);
            
            // Topu kaldır
            fallingBubbles.splice(bubbleIndex, 1);
            
            // Ses efekti (varsa)
            if (typeof soundManager !== 'undefined') {
                soundManager.play('score');
            }
            
            return true; // Başarılı giriş
        }
    }
    return false; // Giriş yok
}

function startTubeAbsorption(bubble, bucket, tubeCenterX, tubeTopY) {
    bubble.tubeMode = true;
    bubble.targetX = tubeCenterX;
    bubble.targetY = tubeTopY + 100; // Tüp içine
    bubble.absorptionSpeed = 0;
    bubble.bucket = bucket;
    bubble.originalRadius = bubble.radius;
    
    // Elektrik efekti
    createTubeElectric(tubeCenterX, tubeTopY);
    
    // "Zzzap" ses efekti (mevcut ses sistemini kullan)
    if (soundManager && soundManager.play) {
        soundManager.play('powerup');
    }
}

function startMarioTubeAbsorption(bubble, bucket, tubeCenterX, tubeTopY) {
    bubble.tubeMode = 'mario';
    bubble.targetX = tubeCenterX;
    bubble.targetY = tubeTopY + 120; // Daha derinlik
    bubble.absorptionSpeed = 0;
    bubble.bucket = bucket;
    bubble.originalRadius = bubble.radius;
    bubble.marioPhase = 'approach'; // approach -> enter -> absorb
    
    // Mario tarzı yeşil efekt
    createMarioTubeEffect(tubeCenterX, tubeTopY - 12);
    
    // Mario "pipe" sesi
    if (soundManager && soundManager.play) {
        soundManager.play('powerup');
    }
}

function startPortalVortexAbsorption(bubble, bucket, portalX, portalY) {
    bubble.tubeMode = 'portal';
    bubble.targetX = portalX;
    bubble.targetY = portalY;
    bubble.absorptionSpeed = 0;
    bubble.bucket = bucket;
    bubble.originalRadius = bubble.radius;
    bubble.portalPhase = 'approach'; // approach -> spiral -> absorb
    bubble.spiralAngle = Math.atan2(bubble.y - portalY, bubble.x - portalX);
    bubble.spiralRadius = Math.sqrt(Math.pow(bubble.x - portalX, 2) + Math.pow(bubble.y - portalY, 2));
    
    // Portal vortex efekti
    createPortalVortexEffect(portalX, portalY, bucket);
    
    // Portal "whoosh" sesi
    if (soundManager && soundManager.play) {
        soundManager.play('powerup');
    }
}

function startHoleFallAbsorption(bubble, bucket, holeX, holeY) {
    bubble.tubeMode = 'hole';
    bubble.targetX = holeX;
    bubble.targetY = holeY + 40; // Çukur derinliği
    bubble.absorptionSpeed = 0;
    bubble.bucket = bucket;
    bubble.originalRadius = bubble.radius;
    bubble.holePhase = 'fall'; // fall -> settle -> absorb
    bubble.fallRotation = 0;
    
    // Çukur toz bulutu efekti
    createHoleDustCloud(holeX, holeY, bucket);
    
    // "Thud" düşme sesi
    if (soundManager && soundManager.play) {
        soundManager.play('bounce');
    }
}

function updateTubeAbsorption(bubble, index) {
    if (bubble.tubeMode === 'mario') {
        updateMarioTubeAbsorption(bubble, index);
        return;
    }
    
    if (bubble.tubeMode === 'portal') {
        updatePortalVortexAbsorption(bubble, index);
        return;
    }
    
    if (bubble.tubeMode === 'hole') {
        updateHoleFallAbsorption(bubble, index);
        return;
    }
    
    bubble.absorptionSpeed += 0.02;
    const speed = Math.min(bubble.absorptionSpeed, 0.3);
    
    // Tüp merkezine çek
    const dx = bubble.targetX - bubble.x;
    const dy = bubble.targetY - bubble.y;
    
    bubble.x += dx * speed * dt; // ⚡ dt eklendi
    bubble.y += dy * speed * dt; // ⚡ dt eklendi
    
    // Küçülme efekti
    bubble.radius = bubble.originalRadius * (1 - speed * 0.8);
    
    // Tüpe tamamen girdi mi?
    if (Math.abs(dx) < 2 && Math.abs(dy) < 5) {
        // Puan ver ve kaldır
        createTubeScore(bubble.x, bubble.y, bubble.bucket.score);
        score += bubble.bucket.score;
        updateScore();
        
        // Enerji patlaması efekti
        createTubeEnergyBurst(bubble.targetX, bubble.targetY - 50);
        
        fallingBubbles.splice(index, 1);
    }
}

function updateMarioTubeAbsorption(bubble, index) {
    const dx = bubble.targetX - bubble.x;
    const dy = bubble.targetY - bubble.y;
    
    switch (bubble.marioPhase) {
        case 'approach':
            // Önce boru girişine yaklaş
            bubble.absorptionSpeed += 0.015;
            const approachSpeed = Math.min(bubble.absorptionSpeed, 0.25);
            
            bubble.x += dx * approachSpeed * dt; // ⚡ dt eklendi
            bubble.y += dy * approachSpeed * dt; // ⚡ dt eklendi
            
            // Boru girişine ulaştı mı?
            if (Math.abs(dx) < 8 && Math.abs(dy) < 15) {
                bubble.marioPhase = 'enter';
                bubble.absorptionSpeed = 0;
            }
            break;
            
        case 'enter':
            // Mario tarzı giriş - önce duraksa sonra hızla in
            bubble.absorptionSpeed += 0.03;
            const enterSpeed = Math.min(bubble.absorptionSpeed, 0.4);
            
            bubble.x += dx * enterSpeed * dt; // ⚡ dt eklendi
            bubble.y += dy * enterSpeed * dt; // ⚡ dt eklendi
            
            // Giriş sırasında hafif küçülme
            bubble.radius = bubble.originalRadius * (1 - enterSpeed * 0.3);
            
            // İçeri girdi mi?
            if (Math.abs(dx) < 3 && Math.abs(dy) < 8) {
                bubble.marioPhase = 'absorb';
                
                // Mario skorlama efekti
                createMarioScore(bubble.x, bubble.y, bubble.bucket.score);
                score += bubble.bucket.score;
                updateScore();
                
                // Mario tarzı enerji patlaması
                createMarioEnergyBurst(bubble.targetX, bubble.targetY - 60);
                
                fallingBubbles.splice(index, 1);
            }
            break;
    }
}

function updatePortalVortexAbsorption(bubble, index) {
    const dt = 1/60; // Sabit delta time
    const time = Date.now() / 1000;
    
    switch (bubble.portalPhase) {
        case 'approach':
            // Portala yaklaş
            bubble.absorptionSpeed += 0.01;
            const approachSpeed = Math.min(bubble.absorptionSpeed, 0.2);
            
            const dx = bubble.targetX - bubble.x;
            const dy = bubble.targetY - bubble.y;
            
            bubble.x += dx * approachSpeed * dt; // ⚡ dt eklendi
            bubble.y += dy * approachSpeed * dt; // ⚡ dt eklendi
            
            // Portal yakınına geldi mi?
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 60) {
                bubble.portalPhase = 'spiral';
                bubble.absorptionSpeed = 0;
            }
            break;
            
        case 'spiral':
            // Spiral hareketi
            bubble.absorptionSpeed += 0.025;
            const spiralSpeed = Math.min(bubble.absorptionSpeed, 0.4);
            
            // Spiral açısını artır
            bubble.spiralAngle += 0.3 + spiralSpeed;
            bubble.spiralRadius *= (1 - spiralSpeed * 0.02);
            
            // Yeni pozisyon hesapla
            bubble.x = bubble.targetX + Math.cos(bubble.spiralAngle) * bubble.spiralRadius;
            bubble.y = bubble.targetY + Math.sin(bubble.spiralAngle) * bubble.spiralRadius;
            
            // Küçülme efekti
            bubble.radius = bubble.originalRadius * (1 - spiralSpeed * 0.4);
            
            // Portal merkezine ulaştı mı?
            if (bubble.spiralRadius < 8) {
                bubble.portalPhase = 'absorb';
                
                // Portal skorlama efekti
                createPortalScore(bubble.x, bubble.y, bubble.bucket.score);
                score += bubble.bucket.score;
                updateScore();
                
                // Portal enerji patlaması
                createPortalEnergyBurst(bubble.targetX, bubble.targetY);
                
                fallingBubbles.splice(index, 1);
            }
            break;
    }
}

function updateHoleFallAbsorption(bubble, index) {
    const dt = 1/60; // Sabit delta time
    const time = Date.now() / 1000;
    
    switch (bubble.holePhase) {
        case 'fall':
            // Çukura düşme
            bubble.absorptionSpeed += 0.03;
            const fallSpeed = Math.min(bubble.absorptionSpeed, 0.5);
            
            const dx = bubble.targetX - bubble.x;
            const dy = bubble.targetY - bubble.y;
            
            // Hafif yatay hareket (gerçekçi düşme)
            bubble.x += dx * fallSpeed * 0.3 * dt; // ⚡ dt eklendi
            bubble.y += dy * fallSpeed * dt; // ⚡ dt eklendi
            
            // Düşerken dönme efekti
            bubble.fallRotation += 0.2;
            
            // Çukur tabanına ulaştı mı?
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 15) {
                bubble.holePhase = 'settle';
                bubble.absorptionSpeed = 0;
                
                // Düşme toz efekti
                createHoleImpactDust(bubble.targetX, bubble.targetY - 15);
            }
            break;
            
        case 'settle':
            // Çukur tabanında durma
            bubble.absorptionSpeed += 0.02;
            const settleSpeed = Math.min(bubble.absorptionSpeed, 0.3);
            
            // Hafif sallanma efekti
            const wobble = Math.sin(time * 8) * 2 * (1 - settleSpeed);
            bubble.x = bubble.targetX + wobble;
            
            // Yavaşça batma
            bubble.y += settleSpeed * 2 * dt; // ⚡ dt eklendi
            
            // Küçülme (toprak altına gömülme)
            bubble.radius = bubble.originalRadius * (1 - settleSpeed * 0.7);
            
            // Tamamen gömüldü mü?
            if (settleSpeed > 0.25) {
                bubble.holePhase = 'absorb';
                
                // Çukur skorlama efekti
                createHoleScore(bubble.x, bubble.y, bubble.bucket.score);
                score += bubble.bucket.score;
                updateScore();
                
                // Toprak altı patlaması
                createHoleUndergroundBurst(bubble.targetX, bubble.targetY);
                
                fallingBubbles.splice(index, 1);
            }
            break;
    }
}

function createTubeElectric(x, y) {
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const distance = 15 + Math.random() * 10;
        createParticles(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            '#00D4FF', 3, 'electric'
        );
    }
}

function createTubeScore(x, y, scoreValue) {
    // Yüzen skor popup'ı ekle
    floatingScores.push({
        x,
        y,
        value: scoreValue,
        opacity: 1,
        life: 1.2, // saniye
        vy: -40,   // px/sn yukarı hareket
        scale: 1
    });
    
    // Ek altın partikül efekti
    createParticles(x, y, '#FFD700', 8, 'score');
}

function updateFloatingScores() {
    // ✅ FIX: TDZ/başlatılmamış durumlar için koruma
    try { if (!Array.isArray(floatingScores)) { floatingScores = []; } } catch(_) { return; }
    
    // 🚀 PERFORMANCE: MAX_FLOATING_SCORES limiti - eski skorları otomatik temizle
    if (floatingScores.length > MAX_FLOATING_SCORES) {
        floatingScores.splice(0, floatingScores.length - MAX_FLOATING_SCORES);
    }
    
    // ✅ FIXED TIME STEP - Tutarlı floating score animasyonu için sabit delta time
    const dt = 1/60; // Sabit 60 FPS, çok smooth ve tutarlı
    for (let i = floatingScores.length - 1; i >= 0; i--) {
        const s = floatingScores[i];
        s.y += s.vy * dt;
        s.life -= dt;
        s.opacity = Math.max(0, s.life / 1.2);
        s.scale = 1 + (1 - s.opacity) * 0.2;
        if (s.life <= 0) floatingScores.splice(i, 1);
    }
}

function drawFloatingScores() {
    // ✅ FIX: TDZ/başlatılmamış durumlar ve ctx yoksa çizme
    try { if (!Array.isArray(floatingScores)) { floatingScores = []; } } catch(_) { return; }
    if (!ctx) return;
    floatingScores.forEach(s => {
        ctx.save();
        ctx.globalAlpha = s.opacity;
        ctx.translate(s.x, s.y);
        ctx.scale(s.scale, s.scale);
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Dış hat
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.strokeText('+' + s.value, 0, 0);
        // Altın renk
        ctx.fillStyle = '#FFD700';
        ctx.fillText('+' + s.value, 0, 0);
        ctx.restore();
    });
}

function createTubeEnergyBurst(x, y) {
    // Enerji patlaması efekti
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const distance = 20 + Math.random() * 15;
        createParticles(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            '#D500F9', 4, 'energy'
        );
    }
}

function createMarioTubeEffect(x, y) {
    // Mario tarzı yeşil halka efekti
    for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10;
        const distance = 25 + Math.random() * 15;
        createParticles(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            '#4CAF50', 6, 'mario_glow'
        );
    }
}

function createMarioScore(x, y, scoreValue) {
    // Mario tarzı skor gösterimi
    createParticles(x, y, '#FFD700', 8, 'mario_score');
    
    // Mario tarzı "coin" efekti
    for (let i = 0; i < 5; i++) {
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;
        createParticles(x + offsetX, y + offsetY, '#FFEB3B', 3, 'coin');
    }
}

function createMarioEnergyBurst(x, y) {
    // Mario tarzı yeşil enerji patlaması
    for (let i = 0; i < 15; i++) {
        const angle = (Math.PI * 2 * i) / 15;
        const distance = 30 + Math.random() * 20;
        createParticles(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            '#4CAF50', 5, 'mario_energy'
        );
    }
    
    // Ek sarı parıltılar
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const distance = 15 + Math.random() * 10;
        createParticles(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            '#FFEB3B', 3, 'sparkle'
        );
    }
}

// Portal Efekt Fonksiyonları
function createPortalVortexEffect(x, y, bucket) {
    // Portal aktivasyon efekti
    for (let i = 0; i < 16; i++) {
        const angle = (Math.PI * 2 * i) / 16;
        const distance = 35 + Math.random() * 20;
        createParticles(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            '#1E88E5', 8, 'portal_activation'
        );
    }
}

function createPortalEnergyPulse(x, y, bucketIndex) {
    // Portal kenarından enerji dalgası
    const pulseCount = 6;
    for (let i = 0; i < pulseCount; i++) {
        const angle = (Math.PI * 2 * i) / pulseCount;
        const distance = 40 + Math.random() * 15;
        createParticles(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            '#42A5F5', 4, 'portal_pulse'
        );
    }
}

function createPortalScore(x, y, scoreValue) {
    // Portal tarzı skor gösterimi
    createParticles(x, y, '#FFD700', 10, 'portal_score');
    
    // Portal enerjisi efekti
    for (let i = 0; i < 8; i++) {
        const offsetX = (Math.random() - 0.5) * 30;
        const offsetY = (Math.random() - 0.5) * 30;
        createParticles(x + offsetX, y + offsetY, '#64B5F6', 5, 'portal_energy');
    }
}

function createPortalEnergyBurst(x, y) {
    // Portal enerji patlaması
    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const distance = 40 + Math.random() * 25;
        createParticles(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            '#1E88E5', 6, 'portal_burst'
        );
    }
    
    // İç spiral efekti
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const distance = 20 + Math.random() * 15;
        createParticles(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            '#42A5F5', 4, 'portal_spiral'
        );
    }
}

// Çukur Efekt Fonksiyonları
function createHoleDustCloud(x, y, bucket) {
    // Çukur aktivasyon toz bulutu
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const distance = 25 + Math.random() * 15;
        createParticles(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            '#8D6E63', 6, 'dust_cloud'
        );
    }
}

function createHoleDustEffect(x, y, bucketIndex) {
    // Çukur kenarından toz dalgası
    const dustCount = 5;
    for (let i = 0; i < dustCount; i++) {
        const angle = (Math.PI * 2 * i) / dustCount;
        const distance = 30 + Math.random() * 12;
        createParticles(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            '#A1887F', 3, 'dust_particles'
        );
    }
}

function createHoleImpactDust(x, y) {
    // Çukur tabanına düşme toz efekti
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const distance = 15 + Math.random() * 10;
        createParticles(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            '#6D4C41', 4, 'impact_dust'
        );
    }
}

function createHoleScore(x, y, scoreValue) {
    // Çukur tarzı skor gösterimi
    createParticles(x, y, '#FFD700', 8, 'hole_score');
    
    // Toprak parçacık efekti
    for (let i = 0; i < 6; i++) {
        const offsetX = (Math.random() - 0.5) * 25;
        const offsetY = (Math.random() - 0.5) * 25;
        createParticles(x + offsetX, y + offsetY, '#8D6E63', 4, 'dirt_chunk');
    }
}

function createHoleUndergroundBurst(x, y) {
    // Toprak altı patlaması
    for (let i = 0; i < 15; i++) {
        const angle = (Math.PI * 2 * i) / 15;
        const distance = 35 + Math.random() * 20;
        createParticles(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            '#5D4037', 5, 'underground_burst'
        );
    }
    
    // Yeraltı kristal efekti
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const distance = 18 + Math.random() * 12;
        createParticles(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            '#FFEB3B', 3, 'crystal_sparkle'
        );
    }
}

function getNeighbors(r, c) {
    const odd = isOddRow(r);
    const directions = [
        { r: r, c: c - 1 }, { r: r, c: c + 1 }, // Sol, Sağ
        { r: r - 1, c: c }, { r: r + 1, c: c }, // Üst, Alt
        { r: r - 1, c: c + (odd ? 1 : -1) }, // Üst-Çapraz
        { r: r + 1, c: c + (odd ? 1 : -1) }  // Alt-Çapraz
    ];
    return directions.filter(d => d.r >= 0 && d.r < ROWS && d.c >= 0 && d.c < COLS);
}

function triggerBomb(r, c) {
    const bubbleCoords = getBubbleCoords(r, c);
    createParticles(bubbleCoords.x, bubbleCoords.y, BOMB_COLOR, 30, 'explosion');
    soundManager.play('explosion'); // Bomba patlatma sesi
    
    // 🔥 GÜÇLÜ BOMBA: 4 sıra derinliğinde komşuları patlatır
    const affected = new Set();
    const toProcess = [{r, c, depth: 0}];
    const processed = new Set();
    
    while (toProcess.length > 0) {
        const {r: currentR, c: currentC, depth} = toProcess.shift();
        const key = `${currentR},${currentC}`;
        
        if (processed.has(key) || depth > 4) continue;
        processed.add(key);
        
        // Bu pozisyonu etkilenen balonlara ekle
        if (grid[currentR]?.[currentC]) {
            affected.add(key);
        }
        
        // 4 sıra derinliğe kadar komşuları ekle
        if (depth < 4) {
            const neighbors = getNeighbors(currentR, currentC);
            neighbors.forEach(({r: nr, c: nc}) => {
                const nKey = `${nr},${nc}`;
                if (!processed.has(nKey)) {
                    toProcess.push({r: nr, c: nc, depth: depth + 1});
                }
            });
        }
    }
    
    // Etkilenen balonları patla
    affected.forEach(key => {
        const [rr, cc] = key.split(',').map(Number);
        if (grid[rr]?.[cc]) {
            const coords = getBubbleCoords(rr, cc);
            createParticles(coords.x, coords.y, grid[rr][cc].color, 5, 'explosion');
            grid[rr][cc].state = 'falling';
        }
    });
    
    handleFloatingBubbles();
    score += affected.size * 10 * combo;
    debugLog('gameplay', `💣 BOMBA! ${affected.size} balon patlatıldı (4 sıra derinlik)`);
}

function triggerLaser(r, c) {
    const center = getBubbleCoords(r, c);
    createParticles(center.x, center.y, LASER_COLOR, 20, 'explosion');

    // Yalnızca yatay çizgiyi temizler
    let removedCount = 0;
    for (let cc = 0; cc < COLS; cc++) {
        if (grid[r]?.[cc]) {
            grid[r][cc].state = 'falling';
            removedCount++;
        }
    }
    handleFloatingBubbles();
    score += removedCount * 10 * combo;
}

function triggerVerticalLaser(r, c) {
    const center = getBubbleCoords(r, c);
    createParticles(center.x, center.y, VERTICAL_LASER_COLOR, 20, 'explosion');

    // Dikey sütundaki 2 sütunu temizler (c ve c+1 veya c-1)
    let removedCount = 0;
    
    // İlk sütun (c)
    for (let rr = 0; rr < ROWS; rr++) {
        if (grid[rr]?.[c]) {
            grid[rr][c].state = 'falling';
            removedCount++;
        }
    }
    
    // İkinci sütun (c+1 veya c-1, hangisi varsa)
    const secondCol = (c + 1 < COLS) ? c + 1 : c - 1;
    if (secondCol >= 0) {
        for (let rr = 0; rr < ROWS; rr++) {
            if (grid[rr]?.[secondCol]) {
                grid[rr][secondCol].state = 'falling';
                removedCount++;
            }
        }
    }
    
    handleFloatingBubbles();
    score += removedCount * 10 * combo;
}

function triggerRainbow(r, c) {
    const bubbleCoords = getBubbleCoords(r, c);
    createParticles(bubbleCoords.x, bubbleCoords.y, RAINBOW_COLOR, 25, 'star');
    
    // Önce gökkuşağı balonunu kaldır
    grid[r][c] = null;
    
    // En yaygın rengi bul ve tüm o renkteki balonları yok et
    const colorCounts = {};
    grid.flat().forEach(bubble => {
        if (bubble && bubble.type === 'normal') {
            colorCounts[bubble.color] = (colorCounts[bubble.color] || 0) + 1;
        }
    });
    
    // Boş array kontrolü - hiç normal balon yoksa hiçbir şey yapma
    const colors = Object.keys(colorCounts);
    if (colors.length === 0) {
        return; // Hiç normal balon yok, sadece gökkuşağı balonunu kaldırdık
    }
    
    const mostCommonColor = colors.reduce((a, b) => 
        colorCounts[a] > colorCounts[b] ? a : b
    );
    
    let removedCount = 0;
    for(let rr = 0; rr < ROWS; rr++) {
        for(let cc = 0; cc < COLS; cc++) {
            if(grid[rr][cc] && grid[rr][cc].color === mostCommonColor) {
                grid[rr][cc].state = 'falling';
                removedCount++;
            }
        }
    }
    
    handleFloatingBubbles();
    score += removedCount * 25 * combo;
}

function triggerFireball(r, c) {
    const bubbleCoords = getBubbleCoords(r, c);
    createParticles(bubbleCoords.x, bubbleCoords.y, FIREBALL_COLOR, 30, 'explosion');
    
    // 3x3 alan yok et
    const affected = [];
    for (let rr = r - 1; rr <= r + 1; rr++) {
        for (let cc = c - 1; cc <= c + 1; cc++) {
            if (grid[rr]?.[cc]) {
                grid[rr][cc].state = 'falling';
                affected.push({ r: rr, c: cc });
            }
        }
    }
    
    handleFloatingBubbles();
    score += affected.length * 15 * combo;
}

function triggerFreeze() {
    // 3 saniye dondurucu efekt
    freezeTimeLeft = 3;
    isSlowMotion = true;
    
    // Tüm düşen balonları durdur
    fallingBubbles.forEach(bubble => {
        bubble.vx *= 0.1;
        bubble.vy *= 0.1;
    });
    
    score += 100 * combo;
}

function triggerLava(r, c) {
    const bubbleCoords = getBubbleCoords(r, c);
    createParticles(bubbleCoords.x, bubbleCoords.y, '#FF4500', 20, 'explosion');
    
    const affected = [];
    
    // LAVA AKIŞI - Çarpışma noktasından aşağı doğru akan lava
    for (let rr = r; rr < ROWS; rr++) {
        // Lava akışı aşağı doğru genişleyerek ilerler
        const spreadRadius = Math.floor((rr - r) / 2) + 1; // Her 2 satırda bir genişleme
        const minCol = Math.max(0, c - spreadRadius);
        const maxCol = Math.min(COLS - 1, c + spreadRadius);
        
        for (let cc = minCol; cc <= maxCol; cc++) {
            if (grid[rr]?.[cc]) {
                const bubble = grid[rr][cc];
                grid[rr][cc] = null; // Grid'den çıkar
                
                // Düşen balon olarak ekle
                const coords = getBubbleCoords(rr, cc);
                fallingBubbles.push({
                    x: coords.x, 
                    y: coords.y,
                    vx: (Math.random() - 0.5) * 60, // Orta hızda yatay hareket
                    vy: 0, // ⚡ SABİT BAŞLANGIÇ HIZI - Tutarlı düşme için gravity belirlecek hızı
                    radius: BUBBLE_RADIUS,
                    color: bubble.color,
                    type: bubble.type,
                    floorBounceCount: 0
                });
                
                affected.push({ r: rr, c: cc });
                createParticles(coords.x, coords.y, bubble.color, 6, 'explosion');
                // Lava efekti için ekstra kırmızı partiküller
                createParticles(coords.x, coords.y, '#FF4500', 3, 'explosion');
            }
        }
    }
    
    // Lava akışı görsel efekti
    createParticles(bubbleCoords.x, bubbleCoords.y, '#FF6600', 15, 'explosion');
    createParticles(bubbleCoords.x, bubbleCoords.y, '#FFAA00', 10, 'explosion');
    
    score += affected.length * 15 * combo;
    console.log(`🌋 Lava akışı ${affected.length} balonu düşürdü (çarpışma noktasından sona kadar)`);
}

function shiftGridDown() {
    // Eğer oyun zaten bitmiş durumdaysa, tekrar işlem yapma
    if (gameState === 'gameover') {
        debugLog('gameplay', '⚠️ Game already over, skipping shiftGridDown');
        return;
    }

    // Kapasite dolduğunda atılacak en alt satırı kaydırmadan ÖNCE yakala.
    // Aşağıdaki reachable eşik sayesinde normal oyunda bu satır zaten boş
    // olmalı; ama dolu çıkarsa balonları sessizce silmek yerine kaybettir
    // (güvenlik ağı — asıl app.js'te ROWS-1'i aşan satırlar başka türlü
    // hiç kontrol edilmeden kaybolabiliyordu).
    const discardedRow = grid[ROWS - 1];

    // Yeni üst satırın hizası: mevcut 0. satırın (kaydıktan sonra 1. satır
    // olacak) TERSİ olmalı — aksi halde hex örgüsü bir satır kayışta bozulur.
    const oldRow0Parity = (grid[0] && typeof grid[0].parity === 'number') ? grid[0].parity : 0;
    const newRowParity = oldRow0Parity === 1 ? 0 : 1;

    for(let r=ROWS-1; r>0; r--) {
        grid[r] = grid[r-1];
    }
    // Yeni satır oluştur - sadece normal balonlar
    const newRow = [];
    newRow.parity = newRowParity;
    const maxC = COLS - 1;
    for(let c=0;c<=maxC;c++) {
        // Yeni satırın hizası (index'ten değil, hesaplanan newRowParity'den)
        if(newRowParity === 1 && c===maxC) { newRow[c]=null; continue; }
        // Yukarıdan gelen balonlar sadece normal renk olmalı
        newRow[c] = {color:getRandomColor(),type:'normal'};
    }
    grid[0] = newRow;

    if (discardedRow && discardedRow.some(cell => !!cell)) {
        debugLog('gameplay', '⚠️ shiftGridDown: kapasite dolu, atılan satırda balon var — oyun bitiyor');
        gameState = 'gameover';
        soundManager.play('gameOver');
        showEndScreen('lose');
        restartBtn.style.display = 'inline-block';
        return;
    }

    // ✨ Koordinat bazlı oyun bitişi kontrolü
    // Grid'deki en alt balonun Y koordinatını bul
    let lowestBubbleY = 0;
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            if (grid[row][col]) {
                const coords = getBubbleCoords(row, col);
                const bubbleBottomY = coords.y + BUBBLE_RADIUS;
                if (bubbleBottomY > lowestBubbleY) {
                    lowestBubbleY = bubbleBottomY;
                }
            }
        }
    }

    // NOT: Bu Y-koordinat tabanlı kontrol pratikte erişilemez (zararsız) —
    // gerçek "kaybettin" tetikleyicisi yukarıdaki discardedRow güvenlik ağı.
    // ROWS bazı cihazlarda küçük/bayat kalabildiğinden, bunu "erişilebilir"
    // bir satıra bağlamaya çalışmak başlangıç dolgusuyla bile yanlış pozitif
    // (anında kaybetme) riski taşıyordu — bkz. yukarısı.
    const gameOverThreshold = logicalHeight - BOTTOM_MARGIN - BUBBLE_RADIUS * 2;

    if (lowestBubbleY >= gameOverThreshold) {
        debugLog('gameplay', `⚠️ shiftGridDown: Balonlar kritik seviyeye ulaştı! lowestY=${lowestBubbleY.toFixed(1)}, threshold=${gameOverThreshold.toFixed(1)}`);
        debugLog('gameplay', `🎮 Game over durumu: gameState=${gameState} -> gameover`);
        gameState='gameover';
        soundManager.play('gameOver');
        debugLog('gameplay', `🎮 showEndScreen('lose') çağrılıyor...`);
        showEndScreen('lose');
        restartBtn.style.display='inline-block';
        debugLog('gameplay', `🎮 Game over işlemi tamamlandı`);
        return;
    }
}

function advanceBubbles() {
    // Güvenlik kontrolü: nextBubble null olabilir
    if (!nextBubble) {
        console.error('❌ advanceBubbles: nextBubble is null! Creating new bubble...');
        nextBubble = createBubble(shooterX - BUBBLE_RADIUS * 4, shooterY);
    }
    
    currentBubble = nextBubble;
    currentBubble.x = shooterX;
    currentBubble.y = shooterY;
    currentBubble.isMoving = false;
    currentBubble.angle = -Math.PI * 0.5; // Default angle - ortaya doğru (yukarı)
    
    // Otomatik lava tüketimi kaldırıldı; oyuncu manuel seçecek
    nextBubble = createBubble(shooterX - BUBBLE_RADIUS * 4, shooterY);
    updateAimPath(true);
    tryApplyPendingShooterPowerup('advance');
}

let _aimPathLastCalcAt = 0;
let _aimPathLastAngle = null;
let _aimPathLastX = null;
let _aimPathLastY = null;

function updateAimPath(force = false) {
    if (!currentBubble) return;
    if (currentBubble.isMoving) return;

    // Throttle expensive recomputation (aimPath can be called from high-frequency move events)
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const angleNow = currentBubble.angle;
    const xNow = currentBubble.x;
    const yNow = currentBubble.y;
    if (!force && _aimPathLastCalcAt) {
        const dtMs = now - _aimPathLastCalcAt;
        const angleDiff = (_aimPathLastAngle === null) ? Infinity : Math.abs(angleNow - _aimPathLastAngle);
        const moved = (_aimPathLastX === null) ? Infinity : Math.hypot(xNow - _aimPathLastX, yNow - _aimPathLastY);
        // ~30fps throttle unless angle/pos changed meaningfully
        if (dtMs < 33 && angleDiff < 0.002 && moved < 0.75) {
            return;
        }
    }
    _aimPathLastCalcAt = now;
    _aimPathLastAngle = angleNow;
    _aimPathLastX = xNow;
    _aimPathLastY = yNow;

    aimPath = [];
    let x = currentBubble.x;
    let y = currentBubble.y;
    let vx = Math.cos(currentBubble.angle) * 10;
    let vy = Math.sin(currentBubble.angle) * 10;

    aimPath.push({x, y});

    for (let i = 0; i < 100; i++) {
        x += vx;
        y += vy;

        // Duvar çarpışma kontrolü - güvenlik marjıyla
        if (x - BUBBLE_RADIUS <= FRAME_PADDING) {
            x = BUBBLE_RADIUS + FRAME_PADDING;
            vx = Math.abs(vx);
        } else if (x + BUBBLE_RADIUS >= logicalWidth - FRAME_PADDING) {
            x = logicalWidth - BUBBLE_RADIUS - FRAME_PADDING;
            vx = -Math.abs(vx);
        }

        if (y < gridOffsetY) {
            aimPath.push({x, y});
            break;
        }

        let hit = false;
        // PERF: only scan nearby grid cells for collision
        const rApprox = Math.round((y - gridOffsetY) / ROW_HEIGHT);
        const rSafe = Math.max(0, Math.min(ROWS - 1, rApprox));
        const cOffset = isOddRow(rSafe) ? BUBBLE_RADIUS : 0;
        const cApprox = Math.round((x - gridOffsetX - cOffset) / (BUBBLE_RADIUS * 2));
        const maxCForRow = isOddRow(rSafe) ? (COLS - 2) : (COLS - 1);
        const cSafe = Math.max(0, Math.min(maxCForRow, cApprox));
        const rMin = Math.max(0, rSafe - 3);
        const rMax = Math.min(ROWS - 1, rSafe + 3);

        for (let r = rMin; r <= rMax; r++) {
            if (!grid[r]) continue;
            const maxC = isOddRow(r) ? (COLS - 2) : (COLS - 1);
            const cMin = Math.max(0, cSafe - 4);
            const cMax = Math.min(maxC, cSafe + 4);
            for (let c = cMin; c <= cMax; c++) {
                if (grid[r][c]) {
                    const bubbleCoords = getBubbleCoords(r, c);
                    if (Math.hypot(x - bubbleCoords.x, y - bubbleCoords.y) < BUBBLE_RADIUS * 2) {
                        hit = true;
                        break;
                    }
                }
            }
            if (hit) break;
        }
        
        aimPath.push({x, y});
        if (hit) break;
    }
}

function showEndScreen(result) {
    console.log(`🎮 showEndScreen çağrıldı: ${result}, gameState: ${gameState}`);
    try { stopAimAnimation(); } catch(_) {}
    
    const endScreen = document.getElementById('endScreen');
    if (!endScreen) {
        console.log('🧹 endScreen element not found in showEndScreen');
        return;
    }
    
    // Eğer gameState 'gameover' değilse ve endScreen zaten görünüyorsa, tekrar gösterme
    if (gameState !== 'gameover' && endScreen.style.display === 'flex') {
        console.log('⚠️ End screen already visible and game not over, skipping duplicate call');
        return;
    }
    
    // Oyun bittiğinde freeze efektini temizle
    freezeTimeLeft = 0;
    isSlowMotion = false;

    // 📊 Ölçüm: kayıp anı. `result` bazı çağrılarda 'lose', bazılarında
    // kullanıcıya gösterilen başlık metni; ham hâlini değil türünü gönderiyoruz.
    window.popgoTrack?.('game_over', {
        level: currentLevel,
        score: score,
        reason: result === 'lose' ? 'lose' : 'other'
    });
    
    // Kayıtlı oyun durumu varsa devam et seçeneği sunma
    if (result === 'lose' && !savedGameState) {
        // İlk kez kaybediyoruz, oyun durumunu kaydet
        savedGameState = {
            grid: JSON.parse(JSON.stringify(grid)),
            currentBubble: currentBubble ? JSON.parse(JSON.stringify(currentBubble)) : null,
            nextBubble: nextBubble ? JSON.parse(JSON.stringify(nextBubble)) : null,
            score: score,
            level: currentLevel,
            lavaStock: lavaStock,
            powerUpStock: JSON.parse(JSON.stringify(powerUpStock))
        };
        canContinueWithAd = true;
        console.log('💾 Game state saved for continue option');
    }
    
    const endTitle = document.getElementById('endTitle');
    const endSubtitle = document.getElementById('endSubtitle');
    
    if (endTitle) {
        endTitle.textContent = result === 'win' ? 'Tebrikler!' : 'Oyun Bitti';
    }
    
    // Reklam butonunu gizle
    hideAdRewardButton();
    
    let subtitle = result === 'win' ? 'Tüm balonları temizledin!<br/>' : 'Balonlar sınırı geçti.<br/>';
    subtitle += 'Skorunuz: <strong>' + formatScore(score) + '</strong><br/>';
    
    if (result === 'win') {
        subtitle += 'Sonraki Level: ' + currentLevel + '<br/>';
    }
    
    // "Devam Et" butonu ekle (sadece lose durumunda ve Capacitor ortamında)
    // Reward ad button removed - now using in-game lava ball reward button
    
    // İstatistik bilgileri ekle
    const rank = getPlayerRank();
    subtitle += `<br/>📊 <strong>İstatistikleriniz:</strong><br/>`;
    subtitle += `${rank.icon} Rütbe: <span style="color: ${rank.color}">${rank.rank}</span><br/>`;
    subtitle += `🏆 En Yüksek Skor: ${formatScore(playerStats.highScore)}<br/>`;
    subtitle += `📈 Max Level: ${playerStats.maxLevel}<br/>`;
    subtitle += `🎮 Toplam Oyun: ${playerStats.totalGamesPlayed}<br/>`;
    
    if (playerStats.dailyStreak > 1) {
        subtitle += `🔥 Günlük Seri: ${playerStats.dailyStreak} gün<br/>`;
    }
    
    // Yeni rekor kontrolü
    if (score === playerStats.highScore && score > 0) {
        subtitle += `<br/>🎉 <strong style="color: gold;">YENİ REKOR!</strong>`;
    }
    
    if (endSubtitle) {
        endSubtitle.innerHTML = subtitle;
    }
    console.log(`🎯 endScreen display ayarlanıyor: flex`);
    console.log(`🎯 endScreen element:`, endScreen);
    
    // End screen'i düzgün göster
    endScreen.style.display = 'flex';
    endScreen.style.pointerEvents = 'auto';
    endScreen.style.visibility = 'visible';
    endScreen.style.opacity = '1';
    endScreen.style.zIndex = '10001';
    endScreen.classList.add('show');
    
    console.log(`🎯 endScreen display sonrası:`, endScreen.style.display);
    console.log('🎮 Game over işlemi tamamlandı');
}

// ==========================================
// POWER BALL BAR FONKSİYONLARI
// ==========================================

// Power ball kullan veya reklam izle
async function usePowerBall(type) {
    console.log(`🎯 Power ball kullanılıyor: ${type}`);
    
    // Type mapping: bar'daki isimlerden game engine'deki isimlere
    const typeMap = {
        'bomb': 'bomb',
        'laser': 'laser',
        'verticalLaser': 'verticalLaser',
        'fireball': 'fireball',
        'freeze': 'freeze',
        'rainbow': 'rainbow'
    };
    
    const engineType = typeMap[type] || type;
    const currentCount = powerUpStock[engineType] || 0;
    
    // Eğer stok varsa kullan
    if (currentCount > 0) {
        console.log(`✅ ${type} kullanılıyor (stok: ${currentCount})`);
        
        // Mevcut power-up sistemini kullan
        usePowerup(engineType);
        
        // HTML stok göstergesini güncelle
        syncPowerBallBar();
        
        showToast(`${getPowerBallEmoji(type)} ${getPowerBallName(type)} aktif!`, 'success');
        
    } else {
        // Stok 0, modal göster
        console.log(`📺 ${type} için modal gösteriliyor...`);
        showPowerBallModal(type);
    }
}

// Power Ball Modal'ı göster
function showPowerBallModal(type) {
    const modal = document.getElementById('powerBallModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalAdBtn = document.getElementById('modalAdBtn');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    
    // Power ball bilgileri
    const powerBallInfo = {
        bomb: {
            icon: '💣',
            title: 'BOMBA',
            description: 'Çevresindeki tüm balonları patlatır'
        },
        laser: {
            icon: '🔵',
            title: 'YATAY LAZER',
            description: 'Yatay çizgide tüm balonları yok eder'
        },
        verticalLaser: {
            icon: '⚡',
            title: 'DİKEY LAZER',
            description: 'Dikey sütundaki 2 sütunu temizler'
        },
        fireball: {
            icon: '🔥',
            title: 'ATEŞ TOPU',
            description: 'Güçlü patlamalarla geniş alan temizler'
        },
        freeze: {
            icon: '❄️',
            title: 'DONDURUCU',
            description: 'Balonları dondurarak zaman kazandırır'
        },
        rainbow: {
            icon: '🌈',
            title: 'GÖKKUŞAĞI',
            description: 'Herhangi bir renk ile eşleşir'
        }
    };
    
    const info = powerBallInfo[type];
    
    // Modal içeriğini güncelle
    if (modalIcon) modalIcon.textContent = info.icon;
    if (modalTitle) modalTitle.textContent = info.title;
    if (modalDescription) modalDescription.textContent = info.description;
    
    // Bu modal için pending reward bilgisi ayarla
    window._pendingRewardPowerballType = type;
    window._hasGrantedRewardThisAd = false;

    // Reklam izle butonu
    modalAdBtn.onclick = async () => {
        console.log(`📺 ${type} için reklam gösteriliyor...`);

        // Butonu devre dışı bırak
        modalAdBtn.style.opacity = '0.5';
        modalAdBtn.style.pointerEvents = 'none';

        try {
            // ÖNEMLİ: Eskiden burada callback GÖNDERİLMİYORDU — sadece Unity
            // Ads Bridge'in ~1sn sonra dispatch ettiği varsayılan
            // "unityRewardedComplete" event'ine güveniliyordu. Ancak bu event
            // kod tabanının HİÇBİR YERİNDE dispatchEvent ile tetiklenmiyor —
            // Unity Ads projede yok, sadece AdMob var. Bu yüzden reklam
            // (AdMob üzerinden) başarıyla tamamlanıyor ama modal hiç
            // kapanmıyor, güç-topu hiç eklenmiyordu. Artık ödül doğrudan
            // callback ile veriliyor (empty power-up akışıyla aynı desen).
            console.log(`🎯 [MODAL] showRewardVideo çağrılıyor (doğrudan callback ile)...`);

            const adShown = await showRewardVideo(() => grantPendingPowerball(type, info));

            if (!adShown) {
                console.warn('⚠️ Reklam gösterilemedi');
                modalAdBtn.style.opacity = '1';
                modalAdBtn.style.pointerEvents = 'auto';
                showToast('❌ Reklam gösterilemedi', 'error');
            }
        } catch (error) {
            console.error('❌ Reklam hatası:', error);
            modalAdBtn.style.opacity = '1';
            modalAdBtn.style.pointerEvents = 'auto';
            showToast('❌ Bir hata oluştu', 'error');
        }
    };
    
    // Kapat butonu
    modalCloseBtn.onclick = () => {
        closePowerBallModal();
    };
    
    // Backdrop tıklama
    const backdrop = modal.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.onclick = () => {
            closePowerBallModal();
        };
    }
    
    // Modal'ı göster
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Power-up ödülünü atıcı balonuna aktarmadan önce kuyruklayalım
let pendingShooterPowerup = null;
let pendingPowerupWatcher = null;
let pendingPowerupWatcherTimeout = null;

// Ödül verme yardımcı fonksiyonu (çift ödülü engelle)
function grantPendingPowerball(engineType, info) {
    try {
        console.log(`🎁 [grantPendingPowerball] BAŞLANGIÇ: engineType=${engineType}, info=`, info);
        if (window._hasGrantedRewardThisAd) {
            console.warn(`⚠️ [grantPendingPowerball] Ödül zaten verildi, atlanıyor`);
            return; // zaten verildi
        }
        window._hasGrantedRewardThisAd = true;
        console.log(`✅ [grantPendingPowerball] Flag set: _hasGrantedRewardThisAd=true`);
        
        // 🔥 CRITICAL: Modalı KESINLIKLE kapat
        const modal = document.getElementById('powerBallModal');
        console.log(`🔍 [grantPendingPowerball] Modal element:`, modal, `display=${modal?.style.display}`);
        if (modal && modal.style.display !== 'none') {
            modal.style.display = 'none';
            console.log('✅ [CRITICAL] Modal kapatildi - grantPendingPowerball');
            
            // Modal kapatıldıktan sonra kayıtlı state'i geri yükle
            setTimeout(() => {
                if (typeof restoreGameStateAfterAd === 'function') {
                    restoreGameStateAfterAd();
                    console.log('✅ [REWARD] Modal kapatıldı, state geri yüklendi');
                }
            }, 100);
        }
        
        // 🎯 YENİ SİSTEM: Sadece stoğa ekle, otomatik kullanma
        console.log(`🔄 [grantPendingPowerball] addPowerUp çağrılıyor: ${engineType}`);
        addPowerUp(engineType, 1);
        console.log(`✅ [REWARD] ${engineType} stoğa eklendi - kullanıcı istediği zaman kullanabilir`);
        
        if (info) {
            showToast(`${info.icon} +1 ${info.title} stoğa eklendi!`, 'success');
        }
        
        // Power Ball Bar'ı güncelle
        console.log(`🔄 [grantPendingPowerball] syncPowerBallBar çağrılıyor...`);
        syncPowerBallBar();
        console.log(`✅ [grantPendingPowerball] syncPowerBallBar çağrıldı`);
        
        // Oyunu devam ettir
        try { resumeGameplayAfterReward(); } catch (_) {}
    } catch (e) {
        console.warn('⚠️ grantPendingPowerball error:', e?.message || e);
    } finally {
        // Pending bilgileri temizle
        window._pendingRewardPowerballType = null;
        // 2 saniye bekle (delayed event 1s sonra geliyor, ona müsait olsun)
        setTimeout(() => { 
            window._hasGrantedRewardThisAd = false; 
            console.log('🧹 [grantPendingPowerball] Flag reset: _hasGrantedRewardThisAd=false');
        }, 2000);
        console.log(`🧹 [grantPendingPowerball] Cleanup tamamlandı`);
    }
}

function queuePendingShooterPowerup(engineType, info) {
    pendingShooterPowerup = { type: engineType, info, queuedAt: Date.now() };
    console.log(`⏳ [REWARD] Pending shooter power-up queued: ${engineType}`);
    tryApplyPendingShooterPowerup('queue');
    startPendingPowerupWatcher();
}

function tryApplyPendingShooterPowerup(reason = 'manual') {
    if (!pendingShooterPowerup) return false;
    if (!currentBubble || currentBubble.isMoving) {
        console.log(`⏳ [REWARD] Shooter hazır değil (${reason}); beklemeye devam`);
        return false;
    }
    const applied = usePowerup(pendingShooterPowerup.type);
    if (applied) {
        console.log(`🎯 [REWARD] Pending power-up uygulandı (${pendingShooterPowerup.type}) reason=${reason}`);
        pendingShooterPowerup = null;
        stopPendingPowerupWatcher();
        syncPowerBallBar();
        resumeGameplayAfterReward();
        return true;
    }
    console.warn(`⚠️ [REWARD] Pending power-up uygulanamadı (${pendingShooterPowerup.type}), tekrar denenecek`);
    return false;
}

function startPendingPowerupWatcher() {
    if (pendingPowerupWatcher) return;
    pendingPowerupWatcher = setInterval(() => {
        if (!pendingShooterPowerup) {
            stopPendingPowerupWatcher();
            return;
        }
        tryApplyPendingShooterPowerup('watcher');
    }, 180);
    pendingPowerupWatcherTimeout = setTimeout(() => {
        if (pendingShooterPowerup) {
            console.warn('⏱️ [REWARD] Pending power-up zaman aşımına uğradı, stokta tutuluyor', pendingShooterPowerup);
            pendingShooterPowerup = null;
            showToast('⚠️ Güç topu hazır değil, stoğa eklendi.', 'warning');
        }
        stopPendingPowerupWatcher();
    }, 8000);
}

function stopPendingPowerupWatcher() {
    if (pendingPowerupWatcher) {
        clearInterval(pendingPowerupWatcher);
        pendingPowerupWatcher = null;
    }
    if (pendingPowerupWatcherTimeout) {
        clearTimeout(pendingPowerupWatcherTimeout);
        pendingPowerupWatcherTimeout = null;
    }
}

// 🔥 REKLAM ÖNCESİ/SONRASI STATE YÖNETİMİ
// Oyun başladığında state kaydedilir ve sürekli güncel tutulur
let _savedGameState = null;
let _initialGameState = null; // İlk başlangıç değerleri - asla değişmez
let _isAdCurrentlyShowing = false; // 🔒 Reklam gösterilirken true - resize engellenir

function saveGameStateBeforeAd() {
    _isAdCurrentlyShowing = true; // 🔒 Reklam başlıyor
    _savedGameState = {
        logicalWidth: logicalWidth,
        logicalHeight: logicalHeight,
        gridOffsetX: gridOffsetX,
        gridOffsetY: gridOffsetY,
        shooterX: shooterX,
        shooterY: shooterY,
        BUBBLE_RADIUS: BUBBLE_RADIUS,
        COLS: COLS,
        ROW_HEIGHT: ROW_HEIGHT,
        canvasWidth: canvas ? canvas.width : null,
        canvasHeight: canvas ? canvas.height : null
    };
    // 🔥 localStorage'a da kaydet - WebView crash durumunda korunur
    try {
        localStorage.setItem('_gameStateBeforeAd', JSON.stringify(_savedGameState));
    } catch (e) { console.warn('localStorage save failed:', e); }
    console.log('💾 [AD] Game state saved before ad:', _savedGameState);
}

// Oyun başladığında bir kez çağrılır - ilk değerleri saklar
function saveInitialGameState() {
    _initialGameState = {
        logicalWidth: logicalWidth,
        logicalHeight: logicalHeight,
        gridOffsetX: gridOffsetX,
        gridOffsetY: gridOffsetY,
        shooterX: shooterX,
        shooterY: shooterY,
        BUBBLE_RADIUS: BUBBLE_RADIUS,
        COLS: COLS,
        ROW_HEIGHT: ROW_HEIGHT,
        canvasWidth: canvas ? canvas.width : null,
        canvasHeight: canvas ? canvas.height : null
    };
    // 🔥 localStorage'a da kaydet - WebView crash durumunda korunur
    try {
        localStorage.setItem('_initialGameState', JSON.stringify(_initialGameState));
    } catch (e) { console.warn('localStorage save failed:', e); }
    console.log('💾 [INIT] Initial game state saved:', _initialGameState);
}

// 🎯 TEK DOĞRULUK KAYNAĞI: Canvas'ı CANLI pencereden boyutlandırır.
// Native reklam overlay'i gerçek viewport'u (innerWidth/Height/dpr) DEĞİŞTİRMEZ;
// bu yüzden reklam sonrası doğru davranış bayat snapshot geri yüklemek DEĞİL,
// canlı pencereden yeniden hesaplamaktır. Çözünürlük hep dpr oranında kalır ->
// "çözünürlük düşmesi" ve "HUD yukarı kayması" bu şekilde önlenir.
// WebView süreci yeniden başlarken innerWidth 0/çok küçük gelebilir -> DOKUNMAZ.
function syncCanvasToWindow(reason) {
    if (!canvas) return false;
    const dpr = window.devicePixelRatio || 1;

    // 1) Canvas'ın kutusunu CSS'e bıraktır: fixed + %100/%100.
    //    .power-ball-bar da 'position: fixed; bottom: 0' ile AYNI kutuya
    //    (layout viewport) yapışıyor. Böylece canvas ile DOM HUD tanım gereği
    //    aynı koordinat uzayında olur. Eskiden canvas'a px olarak
    //    window.innerHeight yazılıyordu; iOS'ta innerHeight (878) ile
    //    layout viewport / 100vh (932) ayrışabildiği için canvas'ın dibi ekran
    //    dibinden 54px yukarıda kalıyor ve canvas içindeki her şey (shooter,
    //    skor) alt bara göre yukarı kaymış görünüyordu.
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.right = '0';
    canvas.style.bottom = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.transform = 'none';
    canvas.style.webkitTransform = 'none';
    canvas.style.margin = '0';
    canvas.style.padding = '0';

    // 2) GERÇEK render edilen kutuyu geri oku (tek doğruluk kaynağı).
    //    Artık window.innerHeight'a güvenilmiyor.
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width), h = Math.round(rect.height);
    if (!w || !h || w < 100 || h < 100) {
        // Kutu henüz geçersiz. iOS'ta reklam kapandıktan hemen sonra WebView
        // görünür olmadan rect 0x0 dönebiliyor. SESSİZCE ÇIKMAK tehlikeli:
        // çağıran taraf bayat değerlerle kalıyordu. Kutu geçerli olana kadar
        // tekrar dene (~1sn, 60 frame).
        const n = (window.__canvasSyncRetries || 0) + 1;
        window.__canvasSyncRetries = n;
        if (n <= 60) {
            try { requestAnimationFrame(() => syncCanvasToWindow(reason + '-retry')); } catch (_) {}
        }
        console.log('⚠️ [CANVAS SYNC] Kutu hazır değil (' + w + 'x' + h + '), tekrar ' + n + ' (' + reason + ')');
        return false;
    }
    window.__canvasSyncRetries = 0;

    // 3) Backing store'u kutuya göre ayarla -> çözünürlük hep net (dpr).
    //    HAM rect kullanılır (önce yuvarlanmış w/h değil): aksi halde
    //    backing ile kutu 1px kayıp minik bir ölçekleme kalıyordu.
    const bw = Math.round(rect.width * dpr), bh = Math.round(rect.height * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
        console.log('🔧 [CANVAS SYNC] backing ' + canvas.width + 'x' + canvas.height +
                    ' -> ' + bw + 'x' + bh + ' (' + reason + ')');
        canvas.width = bw;
        canvas.height = bh;
    }

    logicalWidth = w;
    logicalHeight = h;
    // Yüksekliğe bağlı anchor'lar: kutu değişirse shooter/HUD doğru tabana otursun.
    try {
        BOTTOM_MARGIN = BOTTOM_MARGIN_DEFAULT + getPowerBarHeight();
        shooterX = logicalWidth / 2;
        shooterY = logicalHeight - BOTTOM_MARGIN - 35;
        // Grid çizim ofsetlerini de tazele: onResize'ın normal yolu oyun
        // sırasında bloklandığı için tek güvenilir yer burası.
        recomputeGridOffsets('sync-' + reason);
    } catch (_) {}

    if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr); }
    window.scrollTo(0, 0);
    return true;
}

function restoreGameStateAfterAd() {
    // 🔥 Backup timeout varsa iptal et (event düzgün geldi demektir)
    if (window._backupRestoreTimeout) {
        clearTimeout(window._backupRestoreTimeout);
        window._backupRestoreTimeout = null;
        console.log('✅ [AD] Backup timeout cancelled - event received properly');
    }
    
    // 🐛 KRİTİK GUARD: Bu fonksiyon native onResume'dan HER uygulama öne
    // gelişinde (açılış dahil) 5 kez çağrılıyor. Guard olmadan, gerçekte hiç
    // reklam gösterilmemişken ESKİ OTURUMA ait boyutları (localStorage) geri
    // yükleyip logicalWidth/BUBBLE_RADIUS/canvas.width'i eziyordu ->
    // HUD yukarı kayması + canvas backing store bozulması (çözünürlük düşmesi).
    // Artık yalnızca GERÇEKTEN reklam gösterildiyse boyut geri yüklenir.
    const _adWasShowing = (_isAdCurrentlyShowing === true) || !!_savedGameState;
    if (!_adWasShowing) {
        // Reklam yoktu: boyutlara DOKUNMA, sadece güvenli scroll/stil sıfırla
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        if (canvas) {
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.transform = 'none';
            canvas.style.webkitTransform = 'none';
        }
        return;
    }

    // Yalnızca bu oturumda reklam öncesi kaydedilen bellek state'i kullanılır.
    // (Bayat cross-session localStorage boyutları KASITLI olarak kullanılmıyor;
    //  WebView yeniden başladıysa doğru boyutu onResize hesaplar.)
    let stateToRestore = _savedGameState;
    
    if (!stateToRestore) {
        console.warn('⚠️ [AD] No saved state to restore - keeping current values');
        // Hiç state yoksa sadece scroll ve stil düzelt
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        if (canvas) {
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.transform = 'none';
            canvas.style.webkitTransform = 'none';
        }
        return;
    }
    
    console.log('🔄 [AD] Restoring game state after ad...', stateToRestore);
    console.log('🔄 [AD] Current values BEFORE restore:', {
        logicalWidth, logicalHeight, gridOffsetX, gridOffsetY, BUBBLE_RADIUS, COLS, ROW_HEIGHT
    });
    
    // 🚫 BOYUTLAR ARTIK SNAPSHOT'TAN GERİ YÜKLENMİYOR (kök neden buydu).
    // Eskiden buraya logicalWidth/logicalHeight/shooterY/BUBBLE_RADIUS/COLS...
    // snapshot'tan yazılıyordu. iOS'ta reklam kapandıktan hemen sonra web süreci
    // henüz görünür olmadığı için syncCanvasToWindow'un okuduğu kutu 0 dönüyor ve
    // fonksiyon erken çıkıyordu -> snapshot'tan yazılmış BAYAT değerler yerinde
    // kalıyor, HUD kayıyordu. (fixViewportAfterAd bunu resume'da 5 kez çağırıyor,
    // hepsi de kutu henüz hazır değilken.)
    // Reklam ne viewport'u ne grid'i değiştirdiği için geri yüklenecek bir şey de
    // yok: tek gerçek kaynak canvas'ın CANLI CSS kutusu.
    syncCanvasToWindow('ad-restore');

    // Scroll sıfırla - AGRESIF
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    console.log('✅ [AD] Game state restored:', {
        logicalWidth, logicalHeight, gridOffsetX, gridOffsetY, BUBBLE_RADIUS, COLS, ROW_HEIGHT
    });
    
    // Sadece ad-specific state'i sıfırla, initialGameState'i koru
    _savedGameState = null;
    _isAdCurrentlyShowing = false; // 🔓 Reklam bitti
    
    // 🔥 CRITICAL: Viewport meta tag'ı zorla yeniden ayarla
    // iOS'ta reklam sonrası viewport scale bozulabiliyor
    try {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
        }
    } catch (e) { console.warn('Viewport reset failed:', e); }
}

// 🔥 VIEWPORT FIX - Reklam sonrası viewport/scroll sorunlarını çöz (OPTİMİZE EDİLDİ)
function fixViewportAfterAd() {
    console.log('🔧 [VIEWPORT FIX] Reklam sonrası viewport düzeltiliyor...');
    
    // 🔥 Viewport meta tag'ı zorla yeniden ayarla
    try {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
        }
    } catch (e) { console.warn('Viewport reset failed:', e); }
    
    // Önce kayıtlı state'i geri yükle
    restoreGameStateAfterAd();
    
    console.log('✅ [VIEWPORT FIX] Tamamlandı');
}

// 🔥 iOS SAFE AREA RESET - Reklam sonrası viewport kaymasını düzelt (OPTİMİZE EDİLDİ)
// ⚠️ CRITICAL: Canvas boyutlarını DEĞİŞTİRME! Sadece stil düzeltmeleri yap
function resetViewportAndCanvas() {
    console.log('🔧 [VIEWPORT] Canvas pozisyonu resetleniyor...');
    console.log(`🔧 [VIEWPORT] Mevcut logicalWidth=${logicalWidth}, logicalHeight=${logicalHeight}`);
    
    // Canvas kutusunu TEK yerden kur. Buraya px yazmak canvas'ı bayat bir
    // yüksekliğe (ör. 878) kilitleyip DOM HUD'dan (fixed bottom:0 -> 932)
    // ayrıştırıyordu; artık CSS kutusu okunuyor.
    if (canvas) {
        syncCanvasToWindow('viewport-reset');
    }
    
    // Body/html scroll sıfırla
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    console.log('✅ [VIEWPORT] Canvas reset tamamlandı (boyutlar korundu)');
}

function resumeGameplayAfterReward() {
    console.log('🎮 [RESUME] resumeGameplayAfterReward started');
    try { window.__shootLock = false; } catch (_) {}
    
    // Canvas görünürlük ve etkileşimi geri yükle
    try {
        if (canvas) {
            canvas.style.pointerEvents = 'auto';
            canvas.style.opacity = '1';
        }
    } catch (_) {}
    
    // 🔥 CRITICAL: Kayıtlı state'i geri yükle
    if (typeof restoreGameStateAfterAd === 'function') {
        restoreGameStateAfterAd();
    }
    
    if (!gameLoopRunning && (gameState === 'playing' || gameState === 'ready')) {
        try {
            gameLoopRunning = false;
            requestAnimationFrame(gameLoop);
        } catch (err) {
            console.warn('⚠️ Game loop resume after reward failed:', err);
        }
    }
}

// Unity Ads tamamlanma eventi dinle ve pending ödülü ver
if (!window.__unityRewardedEventBound) {
    window.__unityRewardedEventBound = true;
    console.log('🔌 [INIT] Registering unityRewardedComplete event listener...');
    window.addEventListener('unityRewardedComplete', (ev) => {
        console.log('🎉 [EVENT] ===== unityRewardedComplete RECEIVED ===== ', ev);
        console.log('🎉 [EVENT] Event detail:', ev.detail);
        
        // 🔥 CRITICAL: Her zaman çalıştır, pending kontrolu yapma
        // Çünkü callback zaten reward'u vermiş olabilir
        let pending = window._pendingRewardPowerballType;
        console.log('🎉 [EVENT] Pending reward type:', pending);
        
        // Eğer pending yoksa, detail'den al
        if (!pending && ev.detail?.placementId) {
            // Rewarded_iOS -> default bomb
            pending = 'bomb';
            console.log('🎉 [EVENT] No pending, using default: bomb');
        }
        
        if (!pending) {
            console.warn('⚠️ [EVENT] No pending reward type and no detail, using bomb as fallback');
            pending = 'bomb';
        }
        
        // Tekrar ödül verilmesini engelle
        if (window._hasGrantedRewardThisAd) {
            console.warn('⚠️ [EVENT] Reward already granted (_hasGrantedRewardThisAd=true), skipping to prevent double reward');
            console.warn('⚠️ [EVENT] This usually means callback already processed the reward');
            return;
        }
        
        const typeMap = { bomb: 'bomb', laser: 'laser', fireball: 'fireball', verticalLaser: 'verticalLaser', freeze: 'freeze', rainbow: 'rainbow' };
        const engineType = typeMap[pending] || pending;
        const info = { icon: getPowerBallEmoji(pending), title: getPowerBallName(pending).toUpperCase() };
        console.log(`🎁 [EVENT] Mapped type: ${pending} -> ${engineType}`);
        console.log(`🎁 [EVENT] Info:`, info);
        console.log(`🎁 [EVENT] Calling grantPendingPowerball...`);
        grantPendingPowerball(engineType, info);
    });
    console.log('✅ [INIT] unityRewardedComplete event listener registered');
}

// Power Ball Modal'ı kapat
function closePowerBallModal() {
    console.log('🔴 [MODAL] closePowerBallModal çağrıldı');
    const modal = document.getElementById('powerBallModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('✅ [MODAL] Modal display = none yapıldı');
    } else {
        console.warn('⚠️ [MODAL] Modal elementi bulunamadı!');
    }
    
    // Butonu yeniden aktif hale getir (kullanıcı tekrar açıp izleyebilsin)
    const modalAdBtn = document.getElementById('modalAdBtn');
    if (modalAdBtn) {
        modalAdBtn.style.opacity = '1';
        modalAdBtn.style.pointerEvents = 'auto';
        console.log('✅ [MODAL] Reklam butonu yeniden aktif edildi');
    }
    
    // ✅ AGGRESSIVE FIX: Modal kapatıldıktan sonra viewport düzeltmesi
    console.log('🔧 [MODAL] ========== VIEWPORT FIX TRIGGERED (closePowerBallModal) ==========');
    if (typeof fixViewportAfterAd === 'function') {
        console.log('🔧 [MODAL] Calling fixViewportAfterAd()...');
        fixViewportAfterAd();
    } else {
        console.error('❌ [MODAL] fixViewportAfterAd function not found!');
    }
}

// Global olarak erişilebilir yap
window.showPowerBallModal = showPowerBallModal;
window.closePowerBallModal = closePowerBallModal;

// HTML Power Ball Bar'ı güncelle
function syncPowerBallBar() {
    // Type mapping: bar'daki isimler = engine'deki isimler
    const types = ['bomb', 'laser', 'fireball', 'verticalLaser', 'freeze', 'rainbow'];
    
    console.log('📊 [syncPowerBallBar] BAŞLANGIÇ - powerUpStock:', JSON.stringify(powerUpStock));
    
    types.forEach(type => {
        const count = powerUpStock[type] || 0;
        const countEl = document.getElementById(`${type}Count`);
        
        console.log(`📊 [syncPowerBallBar] ${type}: count=${count}, element=${!!countEl}, id=${type}Count`);
        
        if (countEl) {
            countEl.textContent = count;
            console.log(`✅ [syncPowerBallBar] ${type}Count güncellendi: ${count}`);
        } else {
            console.warn(`⚠️ [syncPowerBallBar] Element bulunamadı: ${type}Count`);
        }
        
        // Overlay'ler kaldırıldı - artık modal kullanıyoruz
    });
    
    console.log(`📊 [syncPowerBallBar] TAMAMLANDI`);
}

// Oyun başladığında bar'ı güncelle
function initPowerBallBar() {
    syncPowerBallBar();
    
    // Reward video'yu önceden yükle (ilk kullanımda hazır olsun)
    preloadRewardVideo();
    
    console.log('🎮 Power Ball Bar başlatıldı');
}

// Reward video'yu önceden yükle
async function preloadRewardVideo() {
    try {
        console.log('📺 Reward video önceden yükleniyor...');
        
        if (window.Capacitor?.isNativePlatform?.()) {
            const { Unityads } = window.Capacitor.Plugins;
            
            if (Unityads) {
                const placementId = window.Capacitor.getPlatform() === 'ios' 
                    ? 'Rewarded_iOS' 
                    : 'Rewarded_Android';
                
                await Unityads.loadRewardedVideo({ placementId });
                console.log('✅ Reward video yüklendi ve hazır');
            }
        }
    } catch (error) {
        console.warn('⚠️ Reward video pre-load hatası (normal):', error?.message || error);
    }
}

// Power ball sayısını güncelle (deprecated - syncPowerBallBar kullan)
function updatePowerBallCount(type, count) {
    syncPowerBallBar();
}

// Power ball aktifleştir (deprecated - usePowerup kullanılıyor)
function activatePowerBall(type) {
    const typeMap = {
        'bomb': 'bomb',
        'lava': 'fireball',
        'freeze': 'freeze'
    };
    const engineType = typeMap[type] || type;
    usePowerup(engineType);
}

// Yardımcı fonksiyonlar
function getPowerBallEmoji(type) {
    const emojis = { 
        bomb: '💣', 
        laser: '🔵',
        verticalLaser: '⚡',
        fireball: '🔥', 
        freeze: '❄️', 
        rainbow: '🌈' 
    };
    return emojis[type] || '⭐';
}

function getPowerBallName(type) {
    const names = { 
        bomb: 'Bomba', 
        laser: 'Yatay Lazer',
        verticalLaser: 'Dikey Lazer',
        fireball: 'Ateş Topu', 
        freeze: 'Dondurucu', 
        rainbow: 'Gökkuşağı' 
    };
    return names[type] || 'Güç Topu';
}

// Global olarak erişilebilir yap
window.usePowerBall = usePowerBall;

// ==========================================
// ESKI REKLAM FONKSİYONLARI (deprecated)
// ==========================================

// Reklam izleyerek lava ball kazan
async function earnLavaBallWithAd() {
    console.log('🎬 Lava ball kazanmak için reklam gösteriliyor...');
    
    // Butonu devre dışı bırak
    const adBtn = document.getElementById('adRewardBtn');
    if (adBtn) {
        adBtn.style.opacity = '0.5';
        adBtn.style.pointerEvents = 'none';
    }
    
    try {
        // Reward callback tanımla
        const onRewardGranted = () => {
            console.log('✅ Reklam izlendi, lava ball veriliyor...');
            
            // Lava ball ekle
            lavaStock = (lavaStock || 0) + 1;
            console.log(`🔥 Lava ball kazanıldı! Yeni stok: ${lavaStock}`);
            
            // UI'ı güncelle
            updateLavaStock();
            
            // Başarı animasyonu
            showToast('🔥 +1 Lava Ball kazandın!', 'success');
            
            // Butonu 30 saniye gizle (spam prevention)
            if (adBtn) {
                adBtn.style.display = 'none';
            }
            
            setTimeout(() => {
                if (adBtn && gameState === 'playing') {
                    adBtn.style.display = 'flex';
                    adBtn.style.opacity = '1';
                    adBtn.style.pointerEvents = 'auto';
                }
            }, 30000); // 30 saniye sonra tekrar göster
        };
        
        const adShown = await showRewardVideo(onRewardGranted);
        
        if (!adShown) {
            console.warn('⚠️ Reklam gösterilemedi');
            // Butonu tekrar aktif et
            if (adBtn) {
                adBtn.style.opacity = '1';
                adBtn.style.pointerEvents = 'auto';
            }
            showToast('❌ Reklam gösterilemedi', 'error');
        }
    } catch (error) {
        console.error('❌ Reklam hatası:', error);
        // Butonu tekrar aktif et
        if (adBtn) {
            adBtn.style.opacity = '1';
            adBtn.style.pointerEvents = 'auto';
        }
        showToast('❌ Bir hata oluştu', 'error');
    }
}

// Oyun başladığında reklam butonunu göster
function showAdRewardButton() {
    const adBtn = document.getElementById('adRewardBtn');
    if (adBtn && window.Capacitor?.isNativePlatform?.()) {
        adBtn.style.display = 'flex';
        console.log('✅ Ad reward button shown');
    }
}

// Oyun bittiğinde reklam butonunu gizle
function hideAdRewardButton() {
    const adBtn = document.getElementById('adRewardBtn');
    if (adBtn) {
        adBtn.style.display = 'none';
        console.log('🚫 Ad reward button hidden');
    }
}

// Global olarak erişilebilir yap
window.earnLavaBallWithAd = earnLavaBallWithAd;

// Reklam izleyerek aynı seviyeyi yeniden başlat (REMOVED - not used anymore)
async function restartLevelWithAd() {
    console.log('📹 Seviyeyi yeniden başlatmak için reklam gösteriliyor...');
    
    try {
        const adShown = await showRewardVideo();
        
        if (adShown) {
            console.log('✅ Reklam izlendi, seviye yeniden başlatılıyor...');
            
            // Oyun ekranını kapat
            const endScreen = document.getElementById('endScreen');
            if (endScreen) {
                endScreen.style.display = 'none';
            }
            
            // Aynı seviyeyi yeniden başlat (currentLevel'ı değiştirme)
            const levelToRestart = currentLevel;
            
            // TAMAMEN SIFIRLA - Skoru, hamleleri, tüm state'i
            score = 0;
            moves = 0;
            combo = 1;
            shotsSinceShift = 0;
            fallingBubbles = [];
            particles = [];
            
            // Grid'i tamamen sıfırla
            grid = [];
            for (let r = 0; r < ROWS; r++) {
                grid[r] = new Array(COLS).fill(null);
            }
            
            // Bubble state'ini sıfırla
            currentBubble = null;
            nextBubble = null;
            
            // Seviyeye göre initial bubbles oluştur
            const initialRows = Math.min(6 + Math.floor(currentLevel / 3), 10);
            for (let r = 0; r < initialRows; r++) {
                for (let c = 0; c < COLS; c++) {   // 0. sütun dahil (bkz. createPatternGrid)
                    grid[r][c] = createNormalBubble();
                }
            }
            
            // Yeni bubbles spawn et
            spawnBubbles();
            updateScore();
            
            // Canvas'ı temizle
            try { ctx.clearRect(0, 0, canvas.width, canvas.height); } catch (e) {}
            
            // Oyun durumunu playing'e çevir
            gameState = 'playing';
            
            console.log(`🎮 Level ${levelToRestart} TAMAMEN yeniden başlatıldı!`);
            
            // Game loop'u yeniden başlat
            requestAnimationFrame(gameLoop);
            
        } else {
            console.warn('⚠️ Reklam gösterilemedi');
            // Reklam gösterilemezse end screen'i tekrar göster
            const endScreen = document.getElementById('endScreen');
            if (endScreen) {
                endScreen.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('❌ Reklam hatası:', error);
        // Hata durumunda end screen'i tekrar göster
        const endScreen = document.getElementById('endScreen');
        if (endScreen) {
            endScreen.style.display = 'flex';
        }
    }
}

// Reklam izleyerek oyuna devam et (eski fonksiyon - continue için)
async function continueGameWithAd() {
    console.log('📹 Devam etmek için reklam gösteriliyor...');
    
    const adShown = await showRewardVideo();
    
    if (adShown && savedGameState) {
        console.log('✅ Reklam izlendi, oyun durumu geri yükleniyor...');
        
        // Oyun durumunu geri yükle
        grid = JSON.parse(JSON.stringify(savedGameState.grid));
        currentBubble = savedGameState.currentBubble ? JSON.parse(JSON.stringify(savedGameState.currentBubble)) : null;
        nextBubble = savedGameState.nextBubble ? JSON.parse(JSON.stringify(savedGameState.nextBubble)) : null;
        score = savedGameState.score;
        currentLevel = savedGameState.level;
        lavaStock = savedGameState.lavaStock;
        powerUpStock = JSON.parse(JSON.stringify(savedGameState.powerUpStock));
        
        // Üst 3 satırı temizle (ekstra yardım)
        for (let r = 0; r < Math.min(3, grid.length); r++) {
            for (let c = 0; c < grid[r].length; c++) {
                if (grid[r][c]) {
                    grid[r][c] = null;
                }
            }
        }
        
        // Devam et bayrağını kapat (bir kere kullanılabilir)
        canContinueWithAd = false;
        savedGameState = null;
        
        // Oyun ekranını kapat
        endScreen.style.display = 'none';
        
        // Oyun durumunu playing'e çevir
        gameState = 'playing';
        tryApplyPendingShooterPowerup('continue-ad');
        
        console.log('🎮 Oyun devam ediyor!');
    } else {
        console.warn('⚠️ Reklam gösterilemedi veya oyun durumu bulunamadı');
        alert('Reklam gösterilemedi. Lütfen tekrar deneyin.');
    }
}

// Global scope'a export et (inline onclick için gerekli)
window.continueGameWithAd = continueGameWithAd;
window.restartLevelWithAd = restartLevelWithAd;

// --- BAŞARI SİSTEMİ ---
function checkAchievement(achievementId) {
    if (ACHIEVEMENTS[achievementId] && !ACHIEVEMENTS[achievementId].unlocked) {
        ACHIEVEMENTS[achievementId].unlocked = true;
        showAchievementNotification(ACHIEVEMENTS[achievementId]);
        
        // Başarı bonusu
        score += 500;
        updateScore();
    }
}

function showAchievementNotification(achievement) {
    // Başarı bildirimi göster (basit alert yerine daha hoş bir UI yapmak için)
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-icon">🏆</div>
        <div class="achievement-text">
            <strong>${achievement.name}</strong><br>
            ${achievement.description}
        </div>
    `;
    document.body.appendChild(notification);
    
    // 3 saniye sonra kaldır
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// --- ENHANCED LOCAL STORAGE İLERLEME SİSTEMİ ---
function loadPlayerData() {
    try {
        // Oyuncu istatistiklerini yükle
        const savedStats = localStorage.getItem(STORAGE_KEYS.PLAYER_STATS);
        if (savedStats) {
            const parsedStats = JSON.parse(savedStats);
            playerStats = { ...playerStats, ...parsedStats };
            
            // Mevcut level'ı oyuncu verilerinden güncelle
            if (parsedStats.maxLevel && parsedStats.maxLevel > currentLevel) {
                currentLevel = parsedStats.maxLevel;
            }
        }
        
        // Başarıları yükle
        const savedAchievements = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
        if (savedAchievements) {
            const parsedAchievements = JSON.parse(savedAchievements);
            Object.keys(ACHIEVEMENTS).forEach(key => {
                if (parsedAchievements[key]) {
                    ACHIEVEMENTS[key].unlocked = true;
                }
            });
        }
        
        // Power-up stoklarını yükle (güvenli bir şekilde)
        const savedPowerUps = localStorage.getItem('playerPowerUps');
        if (savedPowerUps) {
            try {
                const parsedPowerUps = JSON.parse(savedPowerUps);
                powerUpStock = { ...powerUpStock, ...parsedPowerUps };
            } catch (e) {
                console.warn('Power-up verileri bozuk, varsayılan değerler kullanılıyor');
            }
        }
        
        // Lava stokunu yükle
        const savedLavaStock = localStorage.getItem('playerLavaStock');
        if (savedLavaStock) {
            lavaStock = Math.max(0, parseInt(savedLavaStock) || 0);
        }
        
        // Günlük giriş verilerini yükle
        const savedDailyLogin = localStorage.getItem('dailyLoginData');
        if (savedDailyLogin) {
            dailyLoginData = { ...dailyLoginData, ...JSON.parse(savedDailyLogin) };
        }
        
        // Coin ve bölüm verilerini yükle
        const savedGameData = localStorage.getItem('gameData');
        if (savedGameData) {
            const parsedData = JSON.parse(savedGameData);
            playerCoins = parsedData.coins || 0;
            currentChapter = parsedData.currentChapter || 'chapter1';
            unlockedChapters = parsedData.unlockedChapters || ['chapter1'];
            
            // Bölüm durumlarını güncelle
            unlockedChapters.forEach(chapter => {
                if (CHAPTERS[chapter]) {
                    CHAPTERS[chapter].unlocked = true;
                }
            });
        }
        
        // Oyun ayarlarını yükle
        const savedSettings = localStorage.getItem(STORAGE_KEYS.GAME_SETTINGS);
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            // Ayarları uygula
            if (settings.soundVolume !== undefined) {
                soundManager.setSoundVolume(settings.soundVolume);
            }
            if (settings.musicVolume !== undefined) {
                soundManager.setMusicVolume(settings.musicVolume);
            }
        }
        
        // Günlük streak kontrolü
        checkDailyStreak();
        
        // Günlük giriş kontrolü
        checkDailyLogin();
        
        console.log('✅ Tüm oyuncu verileri başarıyla yüklendi:', {
            currentLevel: currentLevel,
            maxLevel: playerStats.maxLevel,
            highScore: playerStats.highScore,
            totalGames: playerStats.totalGamesPlayed,
            powerUps: powerUpStock,
            lavaStock: lavaStock,
            coins: playerCoins
        });
    } catch (error) {
        console.error('❌ Oyuncu verileri yüklenirken hata:', error);
        // Hata durumunda varsayılan değerleri koru
        initializeDefaultPlayerData();
    }
}

// Varsayılan oyuncu verilerini başlat
function initializeDefaultPlayerData() {
    console.log('🔄 Varsayılan oyuncu verileri başlatılıyor...');
    currentLevel = 1;
    score = 0;
    lavaStock = 3; // Başlangıç lava stoku
    powerUpStock = {
        rainbow: 0,
        fireball: 0,
        verticalLaser: 0,
        freeze: 0,
        bomb: 0,
        laser: 0
    };
    console.log('✅ Varsayılan veriler ayarlandı');
}

function savePlayerData() {
    try {
        // Mevcut level'ı maxLevel ile güncelle
        if (currentLevel > playerStats.maxLevel) {
            playerStats.maxLevel = currentLevel;
        }
        
        // İstatistikleri kaydet
        localStorage.setItem(STORAGE_KEYS.PLAYER_STATS, JSON.stringify(playerStats));
        
        // Başarıları kaydet
        const achievementData = {};
        Object.keys(ACHIEVEMENTS).forEach(key => {
            achievementData[key] = ACHIEVEMENTS[key].unlocked;
        });
        localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievementData));
        
        // Power-up stoklarını kaydet
        localStorage.setItem('playerPowerUps', JSON.stringify(powerUpStock));
        
        // Lava stokunu kaydet
        localStorage.setItem('playerLavaStock', lavaStock.toString());
        
        // Günlük giriş verilerini kaydet
        localStorage.setItem('dailyLoginData', JSON.stringify(dailyLoginData));
        
        // Oyun verilerini kaydet
        const gameData = {
            coins: playerCoins,
            currentChapter: currentChapter,
            unlockedChapters: unlockedChapters,
            lastSaveDate: new Date().toISOString()
        };
        localStorage.setItem('gameData', JSON.stringify(gameData));
        
        // Oyun ayarlarını kaydet
        const gameSettings = {
            soundVolume: document.getElementById('soundVolume')?.value || 70,
            musicVolume: document.getElementById('musicVolume')?.value || 50,
            vibrationEnabled: document.getElementById('vibrationEnabled')?.checked || true,
            lastSaveTime: Date.now()
        };
        localStorage.setItem(STORAGE_KEYS.GAME_SETTINGS, JSON.stringify(gameSettings));
        
        console.log('✅ Tüm oyuncu verileri başarıyla kaydedildi:', {
            currentLevel: currentLevel,
            maxLevel: playerStats.maxLevel,
            highScore: playerStats.highScore,
            powerUps: powerUpStock,
            lavaStock: lavaStock
        });
    } catch (error) {
        console.error('❌ Veri kaydetme hatası:', error);
        // Kritik hata bildirimi
        try {
            alert('Oyun verileriniz kaydedilemedi! Lütfen tarayıcınızın depolama alanını kontrol edin.');
        } catch (e) {
            console.error('Alert bile gösterilemedi:', e);
        }
    }
}

function updatePlayerStats(gameResult) {
    const gameEndTime = Date.now();
    const playTime = (gameEndTime - gameStartTime) / 1000; // saniye cinsinden
    
    // Temel istatistikleri güncelle
    playerStats.totalGamesPlayed++;
    playerStats.totalPlayTime += playTime;
    playerStats.totalScore += score;
    
    if (score > playerStats.highScore) {
        playerStats.highScore = score;
        console.log(`🎉 YENİ REKOR! Eski: ${playerStats.highScore}, Yeni: ${score}`);
    }
    
    // Mevcut level ilerlemesi - EN ÖNEMLİ KISIM
    if (currentLevel > playerStats.maxLevel) {
        playerStats.maxLevel = currentLevel;
        console.log(`🚀 Yeni maksimum level: ${currentLevel}`);
    }
    
    // Oyun moduna göre istatistik
    if (gameResult === 'win') {
        playerStats.levelsCompleted[gameMode]++;
        
        // Level başarısı için bonus coin
        playerCoins += (currentLevel * 5); // Her level için 5x coin
        console.log(`💰 Level ${currentLevel} tamamlandı! +${currentLevel * 5} coin kazandınız`);
    }
    
    // En sevilen oyun modu
    if (!playerStats.favoriteGameMode || Math.random() < 0.1) {
        playerStats.favoriteGameMode = gameMode;
    }
    
    // Son oyun tarihi
    playerStats.lastPlayDate = new Date().toISOString().split('T')[0];
    
    // Doğruluk oranını güncelle (basitleştirilmiş)
    const accuracy = Math.min(100, Math.max(0, (score / 100) + 50));
    playerStats.averageAccuracy = accuracy;
    
    // Toplam patlayan balon sayısını tahmin et
    playerStats.totalBubblesPopped += Math.floor(score / 25); // Her 25 puana 1 balon
    
    // Verileri otomatik kaydet
    savePlayerData();
    
    console.log(`📊 İstatistikler güncellendi:`, {
        totalGames: playerStats.totalGamesPlayed,
        highScore: playerStats.highScore,
        maxLevel: playerStats.maxLevel,
        currentLevel: currentLevel,
        coins: playerCoins
    });
}

function checkDailyStreak() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (playerStats.lastPlayDate === yesterday) {
        // Dün oynadıysa streak devam ediyor
        playerStats.dailyStreak++;
    } else if (playerStats.lastPlayDate !== today) {
        // Bugün ilk defa oynuyorsa streak sıfırlanır
        playerStats.dailyStreak = 1;
    }
    // Bugün zaten oynadıysa streak değişmez
}

function getPlayerRank() {
    const score = playerStats.highScore;
    if (score >= 50000) return { rank: 'Efsane', icon: '👑', color: '#FFD700' };
    if (score >= 25000) return { rank: 'Usta', icon: '🥇', color: '#C0C0C0' };
    if (score >= 10000) return { rank: 'Uzman', icon: '🥈', color: '#CD7F32' };
    if (score >= 5000) return { rank: 'Yetenekli', icon: '🥉', color: '#4169E1' };
    if (score >= 1000) return { rank: 'Acemi', icon: '🎯', color: '#32CD32' };
    return { rank: 'Yeni Başlayan', icon: '🌟', color: '#FF69B4' };
}

function exportPlayerData() {
    // Oyuncu verilerini dışa aktarma (paylaşım için)
    const exportData = {
        stats: playerStats,
        achievements: Object.keys(ACHIEVEMENTS).filter(key => ACHIEVEMENTS[key].unlocked),
        exportDate: new Date().toISOString(),
        gameVersion: '2.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'balon_oyunu_ilerleme.json';
    link.click();
}

function resetPlayerData() {
    // Tüm verileri sıfırla
    localStorage.removeItem(STORAGE_KEYS.PLAYER_STATS);
    localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.GAME_SETTINGS);
    
    // Değişkenleri varsayılan değerlerine döndür
    playerStats = {
        totalScore: 0,
        highScore: 0,
        maxLevel: 1,
        totalGamesPlayed: 0,
        totalBubblesPopped: 0,
        totalPowerUpsUsed: 0,
        averageAccuracy: 0,
        totalPlayTime: 0,
        favoriteGameMode: GAME_MODES.CLASSIC,
        achievements: {},
        dailyStreak: 0,
        lastPlayDate: null,
        levelsCompleted: {
            classic: 0,
            strategy: 0,
            arcade: 0
        }
    };
    
    // Başarıları sıfırla
    Object.keys(ACHIEVEMENTS).forEach(key => {
        ACHIEVEMENTS[key].unlocked = false;
    });
    
    alert('Tüm veriler sıfırlandı!');
}

function showStatsModal() {
    const rank = getPlayerRank();
    
    // Toplam oyun süresi formatla
    const totalHours = Math.floor(playerStats.totalPlayTime / 3600);
    const totalMinutes = Math.floor((playerStats.totalPlayTime % 3600) / 60);
    const timeFormatted = totalHours > 0 ? 
        `${totalHours}s ${totalMinutes}d` : 
        `${totalMinutes} dakika`;
    
    // Ortalama doğruluk hesapla (basit tahmin)
    const avgAccuracy = playerStats.totalGamesPlayed > 0 ? 
        Math.min(100, Math.max(0, 70 + (playerStats.highScore / 1000) * 2)) : 0;
    
    const unlockedAchievements = Object.keys(ACHIEVEMENTS).filter(key => ACHIEVEMENTS[key].unlocked);
    
    statsDetails.innerHTML = `
        <div class="rank-display">
            <span class="rank-icon">${rank.icon}</span>
            <div class="rank-name" style="color: ${rank.color}">${rank.rank}</div>
            <div style="opacity: 0.8; font-size: 0.9em;">En Yüksek Skor: ${playerStats.highScore.toLocaleString()}</div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-item">
                <span class="stat-value">${playerStats.totalGamesPlayed}</span>
                <div class="stat-label">🎮 Toplam Oyun</div>
            </div>
            <div class="stat-item">
                <span class="stat-value">${playerStats.maxLevel}</span>
                <div class="stat-label">📈 En Yüksek Level</div>
            </div>
            <div class="stat-item">
                <span class="stat-value">${timeFormatted}</span>
                <div class="stat-label">⏱️ Toplam Süre</div>
            </div>
            <div class="stat-item">
                <span class="stat-value">${avgAccuracy.toFixed(1)}%</span>
                <div class="stat-label">🎯 Ortalama İsabet</div>
            </div>
            <div class="stat-item">
                <span class="stat-value">${playerStats.dailyStreak}</span>
                <div class="stat-label">🔥 Günlük Seri</div>
            </div>
            <div class="stat-item">
                <span class="stat-value">${unlockedAchievements.length}/${Object.keys(ACHIEVEMENTS).length}</span>
                <div class="stat-label">🏆 Başarılar</div>
            </div>
        </div>
        
        <div class="achievements-section">
            <h3 style="color: #FFD700; text-align: center; margin-bottom: 15px;">🏆 Başarılar</h3>
            <div class="achievement-grid">
                ${Object.entries(ACHIEVEMENTS).map(([key, achievement]) => `
                    <div class="achievement-item ${achievement.unlocked ? 'unlocked' : ''}">
                        <span class="achievement-icon">${achievement.unlocked ? '🏆' : '🔒'}</span>
                        <div class="achievement-name">${achievement.name}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; opacity: 0.7; font-size: 0.9em;">
            Son oyun: ${playerStats.lastPlayDate || 'Hiç'}<br/>
            Favori mod: ${playerStats.favoriteGameMode.toUpperCase()}
        </div>
    `;
    
    statsModal.style.display = 'flex';
} 

// --- SPLASH SCREEN FUNCTIONALITY ---
document.addEventListener('DOMContentLoaded', function() {
    const splashScreen = document.getElementById('splash-screen');
    const gameRoot = document.getElementById('game-root');
    
    // Tab menüyü başlat (varsa)
    try {
        if (typeof initMobileTabMenu === 'function') {
            initMobileTabMenu();
        } else {
            console.warn('initMobileTabMenu not available at DOMContentLoaded');
        }
    } catch (e) {
        console.warn('initMobileTabMenu failed:', e);
    }
    
    // Splash screen'ler için akış kontrolü
    function initSplashScreens() {
        // Splash screen animasyonları için gerekli CSS sınıflarını uygula
        if (splashScreen) {
            // İlk ekran logosu için animasyonları başlat
            createSplashParticles();
            animateCircuitNodes();
            updateLoaderPercentage();
        }

        // İlk splash ekranı 5 saniye sonra kapatıp oyunu başlat
        setTimeout(function() {
            splashScreen.classList.add('fade-out');
            setTimeout(function() {
                splashScreen.style.display = 'none';
                if (gameRoot) {
                    gameRoot.style.visibility = 'visible';
                }
                // Oyun modu seçim ekranını göster
                const startScreen = document.getElementById('startScreen');
                if (startScreen) {
                    startScreen.style.display = 'flex';
                }
            }, 500); // Geçiş animasyonu için süre
        }, 5000); // İlk splash screen gösterme süresi - 5 saniye
    }
    
    // Splash screen akışını başlat
    initSplashScreens();
    
    // Gerekli splash screen fonksiyonlarını tanımla
    function createSplashParticles() {
        const container = document.querySelector('.splash-bg-particles');
        if (!container) return;
        const colors = [
            'rgba(58,141,222,0.1)',
            'rgba(123,31,162,0.1)',
            'rgba(0,234,255,0.1)',
            'rgba(255,255,255,0.1)'
        ];
        const count = 18;
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = Math.random() * 60 + 40;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.left = `${Math.random() * 95}%`;
            p.style.top = `${Math.random() * 90}%`;
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            p.style.animationDelay = `${Math.random() * 8}s`;
            p.style.animationDuration = `${10 + Math.random() * 6}s`;
            container.appendChild(p);
        }
    }

    function animateCircuitNodes() {
        const nodes = document.querySelectorAll('.circuit-node');
        nodes.forEach((node, index) => {
            node.style.setProperty('--i', index);
        });
    }

    function updateLoaderPercentage() {
        const loadingFill = document.querySelector('.loading-fill');
        const loadingText = document.querySelector('.loading-text');
        let progress = 0;
        const duration = 4500; // ms - 5 saniyeye uygun olarak ayarlandı
        const interval = 20;
        const steps = duration / interval;
        const increment = 100 / steps;
        
        const timer = setInterval(() => {
            progress += increment;
            if (progress >= 100) {
                progress = 100;
                clearInterval(timer);
            }
            
            if (loadingText) {
                loadingText.textContent = `Yükleniyor... %${Math.round(progress)}`;
            }
            if (loadingFill) {
                loadingFill.style.width = `${progress}%`;
            }
        }, interval);
    }
});

// --- REKLAM YÖNETİMİ ---
class AdManager {
    constructor() {
        this.interstitialAdShown = false;
        this.gameCount = 0;
        this.lastInterstitialTime = 0;
        this.lastAppOpenTime = 0;
        this.minInterstitialInterval = 60000; // 60 saniye minimum aralık (policy-safe)
        this.minAppOpenInterval = 0;
        this.isCapacitorEnvironment = false;
        this.appOpenAdShown = false;
        this.pendingInterstitialAfterModal = false; // Level tamam ekranından sonra gösterilecek mi?
        this.admobInitialized = false; // AdMob'un zaten başlatılıp başlatılmadığını takip et
        this.failedInterstitialAttempts = 0;
        this.interstitialBackoffMs = 0;
        this.lastInterstitialPrepareTime = 0;
        this.isPreparingInterstitial = false;
        this.interstitialPrepareTimer = null;
        this.init();
    }

    isWebViewReady() {
        // Check if we're in a mobile WebView environment and if AdMob plugin is ready
        return this.isCapacitorEnvironment && 
               typeof window !== 'undefined' && 
               window.Capacitor && 
               window.Capacitor.Plugins && 
               window.Capacitor.Plugins.AdMob &&
               document.readyState !== 'loading';
    }

    queueInterstitialPrepare(delayMs = 0) {
        if (this.interstitialPrepareTimer) {
            clearTimeout(this.interstitialPrepareTimer);
            this.interstitialPrepareTimer = null;
        }
        const wait = Math.max(0, delayMs);
        this.interstitialPrepareTimer = setTimeout(() => {
            this.interstitialPrepareTimer = null;
            this.prepareInterstitialAd().catch(err => {
                if (DEBUG_FLAGS.ads) {
                    console.error('❌ Scheduled interstitial prepare failed:', err);
                }
            });
        }, wait);
        debugLog('ads', `⏳ Interstitial prepare scheduled in ${wait}ms`);
    }

    init() {
        // Check if we're in Capacitor environment
        this.checkCapacitorEnvironment();
        
        if (this.isCapacitorEnvironment) {
            console.log('AdMob Capacitor plugin initialized');
            // 🚀 SAFE: Delay AdMob initialization to prevent WebView crash
            // Initialize AdMob after 5 seconds to ensure WebView is fully ready
            if (!this.admobInitialized) {
                console.log('⏳ Delaying AdMob initialization by 5 seconds for WebView readiness...');
                setTimeout(() => {
                    console.log('🚀 Starting delayed AdMob initialization...');
                    this.initializeAdMob().catch(e => {
                        console.error('❌ AdMob initialization failed (non-blocking):', e);
                        // Game continues even if ads fail
                    });
                }, 5000); // 5 second delay
            }
            // Açılışta interstitial/app-open gösterimi kaldırıldı (policy-safe)
        } else {
            // Web environment - use AdSense fallback
            this.initInterstitialAd();
        }
    }

    async initializeAdMob() {
        // Check if WebView is ready before initializing
        if (!this.isWebViewReady()) {
            console.warn('⚠️ WebView not ready for AdMob initialization, retrying in 3 seconds...');
            setTimeout(() => {
                this.initializeAdMob().catch(e => {
                    console.error('❌ AdMob retry failed (non-blocking):', e);
                });
            }, 3000);
            return;
        }
        
        // Eğer AdMob zaten başlatılmışsa, tekrar başlatma
        if (this.admobInitialized) {
            console.log('⚠️ AdMob already initialized, skipping...');
            return;
        }
        
        console.log('🚀 AdMob initialization starting - WebView is ready');
        
        try {
            // First check if our native AdMob plugin is available
            if (AdMobPlugin) {
                console.log('✅ Native AdMob plugin found - using native implementation');
                return;
            }
            
            // Fallback to Capacitor Community AdMob plugin
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
                const AdMob = window.Capacitor.Plugins.AdMob;
                
                // PRODUCTION MODE: Always use real App ID
                const isIOS = window.Capacitor.getPlatform() === 'ios';
                const appId = isIOS ? 'ca-app-pub-7610338885240453~1290039433' : 'ca-app-pub-7610338885240453~9469652030';
                
                console.log(`🚀 Initializing AdMob - Platform: ${isIOS ? 'iOS' : 'Android'}, App ID: ${appId} (PRODUCTION)`);
                // Request UMP consent info and show form if required BEFORE initializing ads
                try {
                    const consentInfo = await AdMob.requestConsentInfo({
                        debugGeography: 0,
                        tagForUnderAgeOfConsent: false,
                        testDeviceIdentifiers: []
                    });
                    if (consentInfo && (consentInfo.status === 'REQUIRED' || consentInfo.formAvailable)) {
                        try {
                            await AdMob.showConsentForm();
                            console.log('✅ Consent form shown');
                        } catch (e) {
                            console.warn('Consent form show failed:', e);
                        }
                    }
                } catch (e) {
                    console.warn('Consent info request failed:', e);
                }
                
                // Initialize AdMob with ADMOB_CONFIG test mode
                await AdMob.initialize({
                    appId: appId,
                    initializeForTesting: ADMOB_CONFIG.testMode, // Use config test mode
                    tagForChildDirectedTreatment: false,
                    tagForUnderAgeOfConsent: false
                });
                
                const modeText = ADMOB_CONFIG.testMode ? 'TEST MODE' : 'PRODUCTION MODE';
                console.log(`✅ AdMob initialized successfully in ${modeText}`);
                showIOSToast('AdMob Hazır!', `✅ ${modeText} aktif`, 'success');
                
                // Setup event listeners
                console.log('🔧 Setting up AdMob event listeners...');
                
                // Track readiness
                this.interstitialReady = false;

                // Setup listeners IMMEDIATELY after initialize
                try {
                    // Interstitial events
                    AdMob.addListener('interstitialAdLoaded', () => {
                        this.interstitialReady = true;
                        debugLog('ads', '🟢 Interstitial ad loaded successfully (ready=true)');
                        this.failedInterstitialAttempts = 0;
                        this.interstitialBackoffMs = 0;
                    });
                    AdMob.addListener('interstitialAdFailedToLoad', (error) => {
                        this.interstitialReady = false;
                        if (DEBUG_FLAGS.ads) {
                            console.error('🔴 Interstitial failed to load (ready=false):', error);
                        } else {
                            console.warn(`🔴 Interstitial failed to load: ${error?.message || 'unknown error'}`);
                        }
                        window.popgoTrack?.('ad_interstitial_load_failed', { code: String(error?.code ?? 'unknown').slice(0, 100) });
                        this.failedInterstitialAttempts = Math.min(this.failedInterstitialAttempts + 1, 6);
                        this.interstitialBackoffMs = Math.min(120000, 15000 * Math.pow(2, this.failedInterstitialAttempts - 1));
                        this.queueInterstitialPrepare(this.interstitialBackoffMs);
                    });
                    AdMob.addListener('interstitialAdShowed', (info) => {
                        debugLog('ads', '🟢 Interstitial ad shown successfully:', info);
                        window.popgoTrack?.('ad_interstitial_shown', { level: typeof currentLevel === 'number' ? currentLevel : 0 });
                    });
                    AdMob.addListener('interstitialAdDismissed', (info) => {
                        this.interstitialReady = false;
                        debugLog('ads', '🟡 Interstitial ad dismissed (ready=false):', info);
                        console.log('🔧 [ADMOB] ========== VIEWPORT FIX TRIGGERED (interstitialAdDismissed) ==========');
                        
                        // ✅ AGGRESSIVE FIX: Reklam sonrası viewport düzeltmesi
                        if (typeof fixViewportAfterAd === 'function') {
                            console.log('🔧 [ADMOB] Calling fixViewportAfterAd()...');
                            fixViewportAfterAd();
                        } else {
                            console.error('❌ [ADMOB] fixViewportAfterAd function not found!');
                        }
                        
                        // Preload next after dismiss (respect backoff)
                        this.queueInterstitialPrepare(2000);
                    });
                    AdMob.addListener('interstitialAdFailedToShow', (error) => {
                        this.interstitialReady = false;
                        if (DEBUG_FLAGS.ads) {
                            console.error('🔴 Interstitial ad failed to show (ready=false):', error);
                        } else {
                            console.warn(`🔴 Interstitial failed to show: ${error?.message || 'unknown error'}`);
                        }
                        this.queueInterstitialPrepare(this.interstitialBackoffMs || 4000);
                    });
                    
                    // Rewarded video ad event listeners
                    AdMob.addListener('onRewardedVideoAdLoaded', () => {
                        debugLog('ads', '🟢 Rewarded video ad loaded successfully');
                    });
                    AdMob.addListener('onRewardedVideoAdFailedToLoad', (error) => {
                        window.popgoTrack?.('ad_rewarded_load_failed', { code: String(error?.code ?? 'unknown').slice(0, 100) });
                        if (DEBUG_FLAGS.ads) {
                            console.error('🔴 Rewarded video failed to load:', error);
                        } else {
                            console.warn(`🔴 Rewarded video failed to load: ${error?.message || 'unknown error'}`);
                        }
                    });
                    AdMob.addListener('onRewardedVideoAdShowed', (info) => {
                        debugLog('ads', '🟢 Rewarded video ad shown successfully:', info);
                        window.popgoTrack?.('ad_rewarded_shown', { level: typeof currentLevel === 'number' ? currentLevel : 0 });
                    });
                    AdMob.addListener('onRewardedVideoAdDismissed', (info) => {
                        debugLog('ads', '🟡 Rewarded video ad dismissed:', info);
                        window.popgoTrack?.('ad_rewarded_dismissed', { level: typeof currentLevel === 'number' ? currentLevel : 0 });
                        console.log('🔧 [ADMOB] ========== VIEWPORT FIX TRIGGERED (onRewardedVideoAdDismissed) ==========');

                        // ✅ AGGRESSIVE FIX: Reklam sonrası viewport düzeltmesi
                        if (typeof fixViewportAfterAd === 'function') {
                            console.log('🔧 [ADMOB] Calling fixViewportAfterAd()...');
                            fixViewportAfterAd();
                        } else {
                            console.error('❌ [ADMOB] fixViewportAfterAd function not found!');
                        }

                        // Oyunu devam ettir
                        try { resumeGameplayAfterReward(); } catch (_) {}
                    });
                    AdMob.addListener('onRewardedVideoAdReward', (info) => {
                        debugLog('ads', '✅ Rewarded video ad completed:', info);
                        window.popgoTrack?.('ad_rewarded_completed', { level: typeof currentLevel === 'number' ? currentLevel : 0 });
                    });
                    
                    console.log('✅ Event listeners registered successfully');
                } catch (listenerError) {
                    console.error('❌ Failed to register event listeners:', listenerError);
                }
                
                // App Open events NOT SUPPORTED in this plugin version
                console.log('⚠️ App Open Ads not supported - skipping event listeners');
                
                // 🚀 SAFE: Prepare ads NON-BLOCKING after delay
                console.log('⏳ Scheduling interstitial ad preparation (delayed, non-blocking)...');
                setTimeout(() => {
                    this.prepareInterstitialAd().catch(e => {
                        console.warn('⚠️ Interstitial prepare failed (non-blocking):', e);
                        // Game continues even if ad preparation fails
                    });
                }, 3000); // 3 second additional delay after AdMob init
                
                console.log('⚠️ App Open Ads not supported in this plugin version');
                
                // AdMob başarıyla başlatıldı olarak işaretle
                this.admobInitialized = true;
                
            } else {
                console.log('❌ AdMob plugin not available - Check if @capacitor-community/admob is installed');
            }
        } catch (error) {
            console.error('❌ Failed to initialize AdMob:', error);
            console.error('Error details:', error.message);
        }
    }

    async checkInternetConnection() {
        // iOS WKWebView'de cross-origin HEAD/no-cors istekleri sık sık başarısız oluyor.
        // Daha güvenilir yol: @capacitor/network kullan ve yalnızca yedek olarak navigator.onLine + kısa süreli fetch denemesi yap.
        try {
            const { Network } = await import('@capacitor/network');
            const status = await Network.getStatus();
            if (status?.connected === true) {
                debugLog('ads', '✅ Internet connection OK (Capacitor Network)');
                return true;
            }
        } catch (_) {
            // Plugin yoksa sessizce yedeklere geç
        }

        // Basit ve hızlı yedek: navigator.onLine
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            console.error('❌ Internet connection failed: navigator.offline');
            return false;
        }

        // Son çare: kısa süreli GET isteği (CORS bilgisi gerektirmeyen opaque yanıt yeterli)
        try {
            const controller = new AbortController();
            const t = setTimeout(() => controller.abort(), 2000);
            await fetch('https://www.gstatic.com/generate_204', { method: 'GET', cache: 'no-cache', mode: 'no-cors', signal: controller.signal });
            clearTimeout(t);
            debugLog('ads', '✅ Internet connection OK (fallback fetch)');
            return true;
        } catch (error) {
            if (DEBUG_FLAGS.ads) {
                console.error('❌ Internet connection failed (fallback):', error);
            }
            return false;
        }
    }

    async prepareInterstitialAd() {
        if (this.isPreparingInterstitial) {
            debugLog('ads', '⛔ Interstitial prepare skipped (already in progress)');
            return this.interstitialReady;
        }

        // Stop retrying after too many failures (prevents iOS crash from excessive ad load attempts)
        if (this.failedInterstitialAttempts >= 3) {
            debugLog('ads', '🛑 Interstitial retry limit reached - stopping attempts to prevent crashes');
            return false;
        }

        const now = Date.now();
        if (this.interstitialBackoffMs > 0) {
            const elapsed = now - this.lastInterstitialPrepareTime;
            const waitRemaining = this.interstitialBackoffMs - elapsed;
            if (waitRemaining > 0) {
                debugLog('ads', `⏸️ Interstitial prepare delayed by backoff (${waitRemaining}ms remaining)`);
                this.queueInterstitialPrepare(waitRemaining);
                return this.interstitialReady;
            }
        }

        this.isPreparingInterstitial = true;
        this.lastInterstitialPrepareTime = now;
        try {
            // Check internet connection first
            const hasInternet = await this.checkInternetConnection();
            if (!hasInternet) {
                if (DEBUG_FLAGS.ads) {
                    console.warn('⚠️ No internet connection - cannot prepare interstitial');
                }
                this.interstitialReady = false;
                this.failedInterstitialAttempts = Math.min(this.failedInterstitialAttempts + 1, 6);
                this.interstitialBackoffMs = Math.min(120000, 15000 * Math.pow(2, this.failedInterstitialAttempts - 1));
                this.queueInterstitialPrepare(this.interstitialBackoffMs);
                return false;
            }

            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
                const AdMob = window.Capacitor.Plugins.AdMob;
                debugLog('ads', '🔄 Preparing Interstitial ad...');
                
                // 🚀 PRODUCTION: Use ADMOB_CONFIG for interstitial IDs
                const platform = window.Capacitor?.getPlatform?.() === 'ios' ? 'ios' : 'android';
                const interstitialAdId = ADMOB_CONFIG.getAdId('interstitial', platform);
                const isTesting = ADMOB_CONFIG.testMode;
                
                debugLog('ads', `🚀 Platform: ${platform.toUpperCase()}, Interstitial ID: ${interstitialAdId}, Mode: ${isTesting ? 'TEST' : 'PRODUCTION'}`);

                // 🚀 SAFE: Add WebView readiness check before preparing
                if (!this.isWebViewReady()) {
                    throw new Error('WebView not ready for ad preparation');
                }

                const result = await AdMob.prepareInterstitial({
                    adId: interstitialAdId,
                    isTesting: isTesting
                });
                
                debugLog('ads', '✅ Interstitial prepared successfully:', result);
                this.interstitialReady = true;
                this.failedInterstitialAttempts = 0;
                this.interstitialBackoffMs = 0;
                
                // Wait a bit and check if it's ready
                // NOT: AdMob.isInterstitialReady() eklentide yok (her zaman throw
                // ederdi); this.interstitialReady zaten yukarıda true'ya set edildi.
                setTimeout(async () => {
                    try {
                        debugLog('ads', '🔍 Interstitial ready check after prepare:', this.interstitialReady);
                    } catch (e) {
                        if (DEBUG_FLAGS.ads) {
                            console.error('❌ Ready check failed:', e);
                        }
                    }
                }, 2000);
                
                return true;
            } else {
                if (DEBUG_FLAGS.ads) {
                    console.log('❌ AdMob plugin not available for Interstitial prepare');
                }
                this.interstitialReady = false;
                this.failedInterstitialAttempts = Math.min(this.failedInterstitialAttempts + 1, 6);
                this.interstitialBackoffMs = Math.min(120000, 15000 * Math.pow(2, this.failedInterstitialAttempts - 1));
                this.queueInterstitialPrepare(this.interstitialBackoffMs);
                return false;
            }
        } catch (error) {
            if (DEBUG_FLAGS.ads) {
                console.error('❌ Failed to prepare interstitial ad:', error);
                console.error('❌ Error details:', error.message, error.code);
            } else {
                console.warn(`❌ Interstitial prepare failed: ${error?.message || 'unknown error'}`);
            }
            this.interstitialReady = false;
            if (error.message && error.message.includes('Unable to resolve host')) {
                if (DEBUG_FLAGS.ads) {
                    console.error('🌐 This is a network connectivity issue - check your internet connection');
                }
            }
            this.failedInterstitialAttempts = Math.min(this.failedInterstitialAttempts + 1, 6);
            this.interstitialBackoffMs = Math.min(120000, 15000 * Math.pow(2, this.failedInterstitialAttempts - 1));
            if (error?.message === 'Loading failed' || error?.message?.includes('No ad to show')) {
                debugLog('ads', `🛑 No-fill received, applying backoff ${this.interstitialBackoffMs}ms`);
            }
            this.queueInterstitialPrepare(this.interstitialBackoffMs);
            return false;
        } finally {
            this.isPreparingInterstitial = false;
        }
    }

    async prepareAppOpenAd() {
        debugLog('ads', '⚠️ App Open Ads not supported in @capacitor-community/admob v7.0.3');
        debugLog('ads', '💡 Use only Interstitial and Reward Video ads');
        return;
    }

    checkCapacitorEnvironment() {
        try {
            // Check if Capacitor is available
            this.isCapacitorEnvironment = (window.Capacitor && window.Capacitor.Plugins);
            debugLog('ads', '🔍 Capacitor check - window.Capacitor:', !!window.Capacitor);
            debugLog('ads', '🔍 Capacitor check - window.Capacitor.Plugins:', !!window.Capacitor?.Plugins);
            debugLog('ads', '🔍 AdMob plugin check:', !!window.Capacitor?.Plugins?.AdMob);
            
            if (this.isCapacitorEnvironment) {
                debugLog('ads', '✅ Running in Capacitor environment');
            } else {
                debugLog('ads', '❌ Running in web environment - AdMob will not work');
            }
        } catch (e) {
            this.isCapacitorEnvironment = false;
            debugLog('ads', '❌ Capacitor not available, using web fallback');
        }
    }

    async showInterstitialAd(options = {}) {
        // Check if WebView is ready before showing ads
        if (this.isCapacitorEnvironment && !this.isWebViewReady()) {
            console.warn('⚠️ WebView not ready for interstitial ad, skipping...');
            return false;
        }
        
        const ignoreInterval = !!options.ignoreInterval;
        const now = Date.now();
        
        // Minimum aralık kontrolü
        if (!ignoreInterval) {
            // Kendi lastInterstitialTime'ı yerine GLOBAL kapı: level yolundan
            // veya ödüllü reklamdan gelen gösterimleri de sayar.
            if (!AD_GATE.canShowInterstitial('adManager')) {
                return false;
            }
        } else {
            debugLog('ads', '⏭️ Interval check BYPASSED (user flow override)');
        }

        this.lastInterstitialTime = now;
        debugLog('ads', '🎬 Attempting to show interstitial ad...');

        if (this.isCapacitorEnvironment) {
            // Native AdMob interstitial ad
            try {
                const { Capacitor } = window;
                if (Capacitor && Capacitor.Plugins && Capacitor.Plugins.AdMob) {
                    if (!this.interstitialReady) {
                        if (DEBUG_FLAGS.ads) {
                            console.warn('⚠️ Interstitial NOT ready - skipping ad and continuing game flow');
                        }
                        // Hazırlığı arka planda başlat ama oyunu bloklamaayalım
                        const retryDelay = this.interstitialBackoffMs || 2000;
                        this.queueInterstitialPrepare(retryDelay);
                        return false;
                    }

                    debugLog('ads', '✅ Interstitial ready - showing now...');
                    const result = await Capacitor.Plugins.AdMob.showInterstitial();
                    debugLog('ads', '✅ Interstitial ad shown successfully:', result);
                    // The dismiss listener will trigger prepare
                    return true;
                } else {
                    if (DEBUG_FLAGS.ads) {
                        console.error('❌ AdMob plugin not available');
                    }
                    return false;
                }
            } catch (error) {
                if (DEBUG_FLAGS.ads) {
                    console.error('❌ Failed to show AdMob interstitial:', {
                        error: error.message,
                        code: error.code,
                        stack: error.stack
                    });
                } else {
                    console.warn(`❌ Failed to show interstitial: ${error?.message || 'unknown error'}`);
                }
                // Try to prepare for next time (non-blocking)
                setTimeout(() => this.prepareInterstitialAd(), 2000);
                return false;
            }
        } else {
            // Web fallback - AdSense
            debugLog('ads', '🌐 Web environment - using AdSense fallback');
            return this.showWebInterstitialAd();
        }
    }

    async showAppOpenAd() {
        // Check if WebView is ready before showing ads
        if (this.isCapacitorEnvironment && !this.isWebViewReady()) {
            console.warn('⚠️ WebView not ready for app open ad, skipping...');
            return false;
        }
        
        debugLog('ads', '⚠️ App Open Ads not supported in @capacitor-community/admob v7.0.3');
        debugLog('ads', '🔄 Showing Interstitial ad instead...');
        return await this.showInterstitialAd();
    }

    async showAppOpenAdOnStart() {
        // Uygulama ilk açıldığında App Open Ad göster
        // 1 saniye gecikme ile göster (splash screen sonrası)
        setTimeout(async () => {
            debugLog('ads', 'Uygulama başlangıcı - App Open yerine Interstitial denenecek...');
            // Biraz bekleyip hazır mı kontrol et
            for (let i = 0; i < 6; i++) { // ~3 sn bekleme
                if (this.interstitialReady) break;
                await new Promise(r => setTimeout(r, 500));
            }
            const success = await this.showInterstitialAd();
            if (success) {
                debugLog('ads', '✅ Başlangıçta Interstitial gösterildi');
            } else {
                debugLog('ads', 'ℹ️ Başlangıçta Interstitial hazır değildi, atlandı');
            }
        }, 1000);
    }

    async isAdReady() {
        if (this.isCapacitorEnvironment) {
            // ÖNEMLİ: @capacitor-community/admob'da isInterstitialReady diye bir
            // metod yok — çağrılırsa her zaman throw edip catch'e düşer ve bu
            // fonksiyon sürekli false dönerdi (interstitial'ın oyun sonunda hiç
            // gösterilmemesine yol açan sessiz bir hataydı). Zaten doğru tutulan
            // this.interstitialReady bayrağını (prepareInterstitialAd başarılı
            // olunca true olur) doğrudan kullanmak yeterli ve güvenilir.
            return !!this.interstitialReady;
        }
        debugLog('ads', '⚠️ Web environment - returning true for ad ready');
        return true; // Always return true for web environment
    }

    showWebInterstitialAd() {
        const container = document.getElementById('interstitialAdContainer');
        const timer = document.getElementById('adTimer');
        const closeBtn = document.getElementById('closeInterstitialAd');
        
        if (!container) return false;

        // Reklamı göster
        container.style.display = 'flex';
        
        // 5 saniye geri sayım
        let countdown = 5;
        timer.textContent = countdown;
        closeBtn.style.display = 'none';
        
        const countdownInterval = setInterval(() => {
            countdown--;
            timer.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                timer.style.display = 'none';
                closeBtn.style.display = 'block';
            }
        }, 1000);

        // AdSense tam ekran reklamını yükle
        try {
            // Web AdSense kaldırıldı
            debugLog('ads', 'Web interstitial ad shown');
        } catch (e) {
            if (DEBUG_FLAGS.ads) {
                console.log('Web interstitial ad failed:', e);
            }
        }

        return true;
    }

    initInterstitialAd() {
        // Web interstitial ad event listener'ları
        const closeBtn = document.getElementById('closeInterstitialAd');
        const container = document.getElementById('interstitialAdContainer');
        
        if (closeBtn && container) {
            closeBtn.addEventListener('click', () => {
                this.hideInterstitialAd();
            });
        }
    }

    hideInterstitialAd() {
        const container = document.getElementById('interstitialAdContainer');
        const timer = document.getElementById('adTimer');
        const closeBtn = document.getElementById('closeInterstitialAd');
        
        if (container) {
            container.style.display = 'none';
            timer.style.display = 'block';
            timer.textContent = '5';
            closeBtn.style.display = 'none';
        }
    }

    // Oyun olaylarına göre reklam gösterimi
    async onGameOver() {
        this.gameCount++;
        
        console.log(`🎮 onGameOver çağrıldı - Oyun sayısı: ${this.gameCount}`);
        console.log(`🎮 AdMobPlugin durumu:`, AdMobPlugin);
        if (window.__suppressAdsOnce) {
            console.log('⏭️ Reklam akışı tek seferlik bastırıldı (suppressAdsOnce)');
            window.__suppressAdsOnce = false;
            return;
        }
        
        // Her 3 oyunda bir tam ekran reklam göster (throttled)
        if (this.gameCount % 3 === 0) {
            console.log(`🎯 ${this.gameCount}. oyun - Reklam gösterilecek`);
            setTimeout(async () => {
                const adReady = await this.isAdReady();
                if (adReady) {
                    await this.showInterstitialAd();
                } else {
                    console.log('Ad not ready for game over');
                }
            }, 2000); // Oyun bittikten 2 saniye sonra
        } else {
            console.log(`⏭️ ${this.gameCount}. oyun - Reklam atlandı (3'ün katı değil)`);
        }
    }

    async onLevelComplete(level) {
        console.log(`🎯 onLevelComplete çağrıldı - Yeni Level: ${level}`);
        const completedLevel = (level || 1) - 1; // tamamlanan seviye
        console.log(`✅ Tamamlanan seviye: ${completedLevel}`);
        
        // Her 2 seviyede bir (2,4,6,...) reklam gösterilecek: modal kapandıktan sonra tetikle
        if (completedLevel > 0 && completedLevel % 2 === 0) {
            this.pendingInterstitialAfterModal = true;
            console.log(`🎯 Reklam planlandı: Level ${completedLevel} tamamlandı (modal sonrası gösterilecek)`);
            // Hazır değilse hazırlamayı dene (non-blocking)
            if (!this.interstitialReady) {
                this.prepareInterstitialAd().catch(e => {
                    console.warn('⚠️ Reklam hazırlama başarısız, oyun devam ediyor:', e.message);
                });
            }
        } else {
            console.log('ℹ️ Bu seviyede reklam planlanmadı (2 seviyede bir)');
        }
    }

    // App resume olayında App Open Ad göster
    async onAppResume() {
        // Öne gelişte artık REKLAM GÖSTERİLMİYOR (bkz. resume dinleyicisi).
        // Metot, başka bir yerden çağrılma ihtimaline karşı etkisiz bırakıldı.
        console.log('App resumed - reklam gösterilmiyor (politika: sadece doğal molalar)');
        return false;
    }

}

// Reklam yöneticisini başlat
adManager = new AdManager();

// === YARDIMCI: Lava ikonuna tıklandı mı? ===
function isClickOnLavaIcon(x, y) {
    const floorY = logicalHeight - BOTTOM_MARGIN;
    const thermoCenterX = logicalWidth - 18;
    const lavaIconX = thermoCenterX - (BUBBLE_RADIUS * 2.4);
    const lavaYOffset = logicalWidth > 600 ? 2.5 : 3.2; // Telefonda daha aşağı
    const lavaIconY = floorY + BUBBLE_RADIUS * lavaYOffset;
    // Lava için çok büyük hitbox - power-uplarla aynı cömertlik
    const effectiveRadius = BUBBLE_RADIUS * 4.0; // 2.0'dan 4.0'a artırıldı
    const distance = Math.hypot(x - lavaIconX, y - lavaIconY);
    console.log(`🌋 Lava click test: distance=${distance}, effectiveRadius=${effectiveRadius}`);
    return distance <= effectiveRadius;
}

// --- LAVA POWERUP KULLAN ---
function tryUseLavaBubble(mouseX, mouseY) {
    if (!isClickOnLavaIcon(mouseX, mouseY)) return false;
    if (lavaStock <= 0 || !currentBubble || currentBubble.isMoving) return true; // tıklandı ama stok yoksa ateş etme
    lavaStock--;
    currentBubble.type = 'lava';
    currentBubble.color = '#FF4500';
    drawBottomUI();
    return true; // tıklandı ve tüketildi, atış yapılmamalı
}

// Native platform: show App-Open Ad when returning to the foreground
if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    window.Capacitor.Plugins.App.addListener('resume', () => {
        console.log('🔄 [RESUME] App resumed from background/ad');
        
        // Reklam sonrası canvas recovery - kayıtlı state'i geri yükle
        try {
            // Kayıtlı state'i geri yükle
            if (typeof restoreGameStateAfterAd === 'function') {
                console.log('📱 [RESUME] Restoring game state...');
                restoreGameStateAfterAd();
            }
            
            // Context sağlık kontrolü
            if (!ctx || (ctx.canvas && ctx.canvas.width === 0)) {
                console.error('⚠️ [RESUME] Canvas context invalid, reloading...');
                window.location.reload();
                return;
            }
            
            // 🔥 Oyun state'ini KORUYARAK sadece render'i yeniden başlat
            if (gameState === 'playing' || gameState === 'ready') {
                console.log('🎮 [RESUME] Restarting game loop (preserving grid)...');
                gameLoopRunning = false; // Reset flag
                requestAnimationFrame(gameLoop);
            }
            
            console.log('✅ [RESUME] Canvas recovery complete');
        } catch (err) {
            console.error('❌ [RESUME] Canvas recovery failed:', err);
        }
        
        // 🚫 ÖNE GELME REKLAMI KALDIRILDI.
        // Bu dinleyici yalnızca reklamdan dönüşte değil; telefon geldiğinde,
        // bildirime bakıp dönüldüğünde, uygulama ikinci kez açıldığında da
        // tetikleniyor. Kullanıcı hiçbir şey yapmadan SADECE geri döndüğü için
        // reklam görüyordu. Hem sadakat açısından en rahatsız edici nokta hem de
        // AdMob'un "beklenmedik açılış reklamı" politika riski.
        // Reklamlar artık yalnızca doğal molalarda (level geçişi) ve kullanıcının
        // kendi isteğiyle (ödüllü) gösteriliyor.
    });
}

// --- GÜNLÜK GİRİŞ SİSTEMİ ---
const DAILY_LOGIN_REWARDS = [
    { day: 1, coins: 20, title: 'Gün 1 Ödülü', description: 'Hoş geldin! İlk gün bonusu.' },
    { day: 2, coins: 30, title: 'Gün 2 Ödülü', description: 'Seri büyüyor, daha çok coin!' },
    { day: 3, coins: 40, title: 'Gün 3 Ödülü', description: 'Harika ivme, devam!' },
    { day: 4, coins: 60, title: 'Gün 4 Ödülü', description: 'Güzel seri, hız kesme.' },
    { day: 5, coins: 80, title: 'Gün 5 Ödülü', description: 'Süper gidiyorsun!' },
    { day: 6, coins: 100, title: 'Gün 6 Ödülü', description: 'Efsane bir seri yaklaştı.' },
    { day: 7, coins: 150, title: 'Gün 7 Ödülü', description: 'Efsanevi! Haftalık büyük ödül.' }
];

// --- BÖLÜM SİSTEMİ (DEVRE DIŞI) ---
const CHAPTERS = {
    chapter1: { 
        name: 'Klasik', 
        description: 'Başlangıç seviyesi', 
        unlocked: true, 
        difficulty: 1,
        colors: ['blue', 'yellow', 'red'],
        powerupChance: 0.1,
        cost: 0
    },
    chapter2: { 
        name: 'Renkli Dünya', 
        description: 'Daha fazla renk, daha fazla eğlence', 
        unlocked: false, 
        difficulty: 2,
        colors: ['blue', 'yellow', 'red', 'green'],
        powerupChance: 0.12,
        cost: 50
    },
    chapter3: { 
        name: 'Hızlı Tempo', 
        description: 'Hızlı düşen balonlar', 
        unlocked: false, 
        difficulty: 3,
        colors: ['blue', 'yellow', 'red', 'green', 'purple'],
        powerupChance: 0.15,
        fallSpeed: 1.2,
        cost: 100
    },
    chapter4: { 
        name: 'Strateji Zamanı', 
        description: 'Sınırlı hamle ile stratejik oyun', 
        unlocked: false, 
        difficulty: 4,
        colors: ['blue', 'yellow', 'red', 'green', 'purple', 'orange'],
        powerupChance: 0.18,
        moveLimit: 60,
        cost: 150
    },
    chapter5: { 
        name: 'Arcade Macerası', 
        description: '5 dakika süre sınırı', 
        unlocked: false, 
        difficulty: 5,
        colors: ['blue', 'yellow', 'red', 'green', 'purple', 'orange'],
        powerupChance: 0.2,
        timeLimit: 300,
        cost: 200
    },
    chapter6: { 
        name: 'Uzman Seviyesi', 
        description: 'Zorlu kombinasyonlar', 
        unlocked: false, 
        difficulty: 6,
        colors: ['blue', 'yellow', 'red', 'green', 'purple', 'orange'],
        powerupChance: 0.25,
        specialBubbles: true,
        cost: 300
    },
    chapter7: { 
        name: 'Master Challenge', 
        description: 'Usta seviyesi zorluk', 
        unlocked: false, 
        difficulty: 7,
        colors: ['blue', 'yellow', 'red', 'green', 'purple', 'orange'],
        powerupChance: 0.3,
        bossLevels: true,
        cost: 400
    },
    chapter8: { 
        name: 'Efsanevi Seviye', 
        description: 'Efsanevi zorluk seviyesi', 
        unlocked: false, 
        difficulty: 8,
        colors: ['blue', 'yellow', 'red', 'green', 'purple', 'orange'],
        powerupChance: 0.35,
        legendaryMode: true,
        cost: 500
    }
};

// --- OYUN DEĞİŞKENLERİ ---
let lastLoginDate = null;
// --- GÜNLÜK GİRİŞ FONKSİYONLARI ---
function checkDailyLogin() {
    const today = new Date().toISOString().split('T')[0];
    
    // İlk giriş kontrolü
    if (!dailyLoginData.lastLoginDate) {
        // İlk kez oyuna giriyor - otomatik olarak günlük ödül göster
        setTimeout(() => {
            claimDailyReward(1);
        }, 2000); // 2 saniye sonra göster
        return;
    }
    
    // Bugün zaten giriş yapılmış mı?
    if (dailyLoginData.lastLoginDate === today) {
        return;
    }
    
    // Dün giriş yapılmış mı? (streak devam ediyor mu?)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (dailyLoginData.lastLoginDate === yesterday) {
        // Streak devam ediyor
        dailyLoginData.currentStreak++;
        if (dailyLoginData.currentStreak > 7) {
            dailyLoginData.currentStreak = 7; // Maksimum 7 gün
        }
    } else {
        // Streak kırıldı, yeniden başla
        dailyLoginData.currentStreak = 1;
    }
    
    // Günlük ödülü otomatik göster
    setTimeout(() => {
        claimDailyReward(dailyLoginData.currentStreak);
    }, 2000); // 2 saniye sonra göster
}

function claimDailyReward(day) {
    const today = new Date().toISOString().split('T')[0];
    const reward = DAILY_LOGIN_REWARDS[day - 1];
    
    if (!reward) return;
    
    const beforeCoins = playerCoins;
    playerCoins += reward.coins;
    
    // Giriş verilerini güncelle
    dailyLoginData.lastLoginDate = today;
    dailyLoginData.totalLogins++;
    dailyLoginData.claimedRewards.push({
        day: day,
        date: today,
        reward: reward
    });
    
    // Verileri kaydet
    savePlayerData();
    
    updateDailyLoginUI();
    const el = document.getElementById('playerCoins');
    if (el) el.textContent = playerCoins;
}

// Sandık ekranı ve ek toast kaldırıldı.

function animateNumber(from, to, duration, onUpdate, onComplete) {
    const start = performance.now();
    function step(t) {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        const val = from + (to - from) * eased;
        onUpdate(val);
        if (p < 1) requestAnimationFrame(step);
        else onComplete && onComplete();
    }
    requestAnimationFrame(step);
}

function showDailyRewardNotification(reward) {
    // Bildirim oluştur
    const notification = document.createElement('div');
    notification.className = 'daily-reward-notification';
    notification.innerHTML = `
        <div class="reward-content">
            <div class="reward-icon">🎁</div>
            <div class="reward-info">
                <h3>${reward.title}</h3>
                <p>${reward.description}</p>
                <div class="reward-coins">+${reward.coins} 💰</div>
            </div>
            <button class="reward-close">×</button>
        </div>
    `;
    
    // Stil ekle
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.5s ease;
        max-width: 300px;
        font-family: 'Arial', sans-serif;
    `;
    
    // Animasyonlu giriş
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Kapatma butonu
    notification.querySelector('.reward-close').onclick = () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    };
    
    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }
    }, 5000);
}

function showDailyLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'daily-login-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>🎁 Günlük Giriş Ödülleri</h2>
                <button class="modal-close">×</button>
            </div>
            <div class="modal-body">
                <div class="streak-info">
                    <div class="streak-count">${dailyLoginData.currentStreak}/7</div>
                    <div class="streak-label">Günlük Seri</div>
                </div>
                <div class="rewards-grid">
                    ${DAILY_LOGIN_REWARDS.map((reward, index) => {
                        const isClaimed = dailyLoginData.claimedRewards.some(r => r.day === reward.day && r.date === new Date().toISOString().split('T')[0]);
                        const isAvailable = dailyLoginData.currentStreak >= reward.day;
                        const isLocked = !isAvailable && !isClaimed;
                        
                        return `
                            <div class="reward-card ${isClaimed ? 'claimed' : ''} ${isLocked ? 'locked' : ''}">
                                <div class="reward-day">Gün ${reward.day}</div>
                                <div class="reward-icon">${isClaimed ? '✅' : isLocked ? '🔒' : '🎁'}</div>
                                <div class="reward-coins">+${reward.coins} 💰</div>
                                <div class="reward-unlock">${reward.title}</div>
                                <div class="reward-desc">${reward.description}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="modal-footer">
                    <div class="total-coins">Toplam Coin: ${playerCoins} 💰</div>
                    <div class="unlocked-chapters">Açık Bölümler: ${unlockedChapters.length}/8</div>
                </div>
            </div>
        </div>
    `;
    
    // Stil ekle
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: 'Arial', sans-serif;
    `;
    
    const content = modal.querySelector('.modal-content');
    content.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 20px;
        padding: 30px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    `;
    
    // Kapatma butonu
    modal.querySelector('.modal-close').onclick = () => {
        document.body.removeChild(modal);
    };
    
    // Modal dışına tıklayınca kapat
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
    
    document.body.appendChild(modal);
}

// --- BÖLÜM SEÇİM FONKSİYONLARI ---
function showChapterSelection() {
    const modal = document.createElement('div');
    modal.className = 'chapter-selection-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>📚 Bölümler</h2>
                <button class="modal-close">×</button>
            </div>
            <div class="modal-body">
                <div class="chapters-grid">
                    ${Object.entries(CHAPTERS).map(([key, ch]) => {
                        const isUnlocked = ch.unlocked;
                        const isCurrent = currentChapter === key;
                        return `
                            <div class="chapter-card ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}" data-ch="${key}">
                                <div class="chapter-icon">${isUnlocked ? '📖' : '🔒'}</div>
                                <div class="chapter-info">
                                    <h3>${ch.name}</h3>
                                    <p>${ch.description}</p>
                                    <div class="chapter-difficulty">Zorluk: ${'⭐'.repeat(ch.difficulty)}</div>
                                    ${!isUnlocked ? `<div class="chapter-cost">Aç: ${ch.cost} 💰</div>` : ''}
                                    ${isUnlocked && !isCurrent ? `<button class="btn-select">Seç</button>` : ''}
                                    ${isCurrent ? `<div class="current-badge">Aktif</div>` : ''}
                                    ${!isUnlocked ? `<button class="btn-unlock" data-ch="${key}">Aç (${ch.cost}💰)</button>` : ''}
                                </div>
                            </div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Stil ekle
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: 'Arial', sans-serif;
    `;
    
    const content = modal.querySelector('.modal-content');
    content.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 20px;
        padding: 30px;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    `;
    
    const close = () => document.body.removeChild(modal);
    modal.querySelector('.modal-close').onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };

    const grid = modal.querySelector('.chapters-grid');
    grid.addEventListener('click', (e) => {
        const btnUnlock = e.target.closest('.btn-unlock');
        const btnSelect = e.target.closest('.btn-select');
        const card = e.target.closest('.chapter-card');
        if (btnUnlock) {
            const ch = btnUnlock.getAttribute('data-ch');
            unlockChapterWithCoins(ch, () => {
                close();
                showChapterSelection(); // yenile
            });
        } else if (btnSelect && card) {
            const ch = card.getAttribute('data-ch');
            selectChapter(ch);
            close();
        } else if (card && card.classList.contains('unlocked') && !card.classList.contains('current')) {
            const ch = card.getAttribute('data-ch');
            selectChapter(ch);
            close();
        }
    });
    
    document.body.appendChild(modal);
}

function unlockChapterWithCoins(chapterKey, onDone) {
    const ch = CHAPTERS[chapterKey];
    if (!ch) return;
    if (ch.unlocked) return;
    const cost = ch.cost || 0;
    if (playerCoins < cost) {
        alert(`Yetersiz coin. Gerekli: ${cost} 💰`);
        return;
    }
    // Coin düşürme animasyonu küçük
    spendCoins(cost, () => {
        playerCoins -= cost;
        ch.unlocked = true;
        if (!unlockedChapters.includes(chapterKey)) unlockedChapters.push(chapterKey);
        savePlayerData();
        updateDailyLoginUI();
        updateChapterUI();
        if (typeof onDone === 'function') onDone();
        showChapterChangeNotification(ch);
    });
}

function spendCoins(amount, cb) {
    // Basit görsel tepki: playerCoins metnini kısa süre kırpıştır
    const el = document.getElementById('playerCoins');
    if (el) {
        el.classList.add('coins-spend');
        setTimeout(() => {
            el.classList.remove('coins-spend');
            cb && cb();
        }, 350);
    } else {
        cb && cb();
    }
}

function selectChapter(chapterKey) {
    if (!CHAPTERS[chapterKey].unlocked) {
        alert('Bu bölüm henüz açılmamış! Günlük giriş yaparak bölümleri açabilirsin.');
        return;
    }
    
    currentChapter = chapterKey;
    const chapter = CHAPTERS[chapterKey];
    
    // Bölüm ayarlarını uygula
    applyChapterSettings(chapter);
    
    // Modal'ı kapat
    const modal = document.querySelector('.chapter-selection-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
    
    // Bölüm değişikliği bildirimi
    showChapterChangeNotification(chapter);
    
    // Verileri kaydet
    savePlayerData();
}

function applyChapterSettings(chapter) {
    // Renkleri güncelle
    availableColors = chapter.colors;
    
    // Güç-up şansını güncelle
    POWERUP_PROB = chapter.powerupChance;
    
    // Özel ayarları uygula
    if (chapter.fallSpeed) {
        // Balon düşme hızını artır
        BUBBLE_FALL_SPEED = chapter.fallSpeed;
    }
    
    if (chapter.moveLimit) {
        // Hamle sınırını ayarla
        remainingMoves = chapter.moveLimit;
    }
    
    if (chapter.timeLimit) {
        // Süre sınırını ayarla
        gameTimeLimit = chapter.timeLimit;
    }
    
    console.log(`Bölüm değiştirildi: ${chapter.name}`);
}

function showChapterChangeNotification(chapter) {
    const notification = document.createElement('div');
    notification.className = 'chapter-change-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">📚</div>
            <div class="notification-info">
                <h3>${chapter.name}</h3>
                <p>${chapter.description}</p>
            </div>
        </div>
    `;
    
    // Stil ekle
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: 'Arial', sans-serif;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animasyonlu giriş
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 100);
    
    // 3 saniye sonra kapat
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// UI güncelleme fonksiyonları
function updateDailyLoginUI() {
    const dailyStreakElement = document.getElementById('dailyStreak');
    const playerCoinsElement = document.getElementById('playerCoins');
    
    if (dailyStreakElement) {
        dailyStreakElement.textContent = dailyLoginData.currentStreak;
    }
    
    if (playerCoinsElement) {
        playerCoinsElement.textContent = playerCoins;
    }
}

function updateChapterUI() {
    const currentChapterName = document.getElementById('currentChapterName');
    const currentChapterDesc = document.getElementById('currentChapterDesc');
    const unlockedChaptersCount = document.getElementById('unlockedChaptersCount');
    
    const currentChapterData = CHAPTERS[currentChapter];
    
    if (currentChapterName) {
        currentChapterName.textContent = currentChapterData.name;
    }
    
    if (currentChapterDesc) {
        currentChapterDesc.textContent = currentChapterData.description;
    }
    
    if (unlockedChaptersCount) {
        unlockedChaptersCount.textContent = unlockedChapters.length;
    }
}

// Event listener'ları ekle
document.addEventListener('DOMContentLoaded', function() {
    // Günlük giriş butonu
    const dailyLoginBtn = document.getElementById('dailyLoginBtn');
    if (dailyLoginBtn) {
        dailyLoginBtn.addEventListener('click', showDailyLoginModal);
    }
    
    // Bölüm seçim butonu
    const chapterSelectBtn = document.getElementById('chapterSelectBtn');
    if (chapterSelectBtn) {
        chapterSelectBtn.addEventListener('click', showChapterSelection);
    }
    
    // UI güncelleme
    updateDailyLoginUI();
    updateChapterUI();
});

// 🎮 AUTO-START GAME - Initialize after all functions are defined
// REMOVED: Auto-start moved to index.html after splash completes
// This prevents initialization before game-root is visible
console.log('🎮 App.js loaded, waiting for splash to complete before starting game...');
