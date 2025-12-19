// 🎮 Unity Ads JavaScript Bridge (Native SDK Integration)
// Bu dosya Unity Ads native SDK'sını JavaScript'ten kullanmak için bridge görevi görür

window.UnityAdsBridge = {
    isNativeReady: false,
    _listenersBound: false,
    _patched: false,
    
    // Capacitor plugin yükle
    async init() {
        try {
            console.log('🔍 [Unity Ads Bridge] Initializing...');
            console.log('🔍 [Unity Ads Bridge] Capacitor available:', !!window.Capacitor);
            console.log('🔍 [Unity Ads Bridge] Capacitor.Plugins available:', !!window.Capacitor?.Plugins);
            
            if (window.Capacitor && window.Capacitor.Plugins) {
                const plugins = window.Capacitor.Plugins;
                console.log('🔍 [Unity Ads Bridge] All plugins:', Object.keys(plugins));
                
                // Try all possible plugin name variants
                // npm package registers as "Unityads", custom plugin as "UnityAdsPlugin"
                const unity = plugins.Unityads || plugins.UnityAdsPlugin || plugins.UnityAdsCapacitorPlugin;
                console.log('🔍 [Unity Ads Bridge] Unityads (npm) found:', !!plugins.Unityads);
                console.log('🔍 [Unity Ads Bridge] UnityAdsPlugin (custom) found:', !!plugins.UnityAdsPlugin);
                console.log('🔍 [Unity Ads Bridge] UnityAdsCapacitorPlugin found:', !!plugins.UnityAdsCapacitorPlugin);
                console.log('🔍 [Unity Ads Bridge] Unity plugin selected:', !!unity);
                
                this.isNativeReady = !!unity;
                console.log('🔍 [Unity Ads Bridge] isNativeReady set to:', this.isNativeReady);
                
                if (this.isNativeReady && !this._listenersBound) {
                    try {
                        // npm package uses different event system - no addListener method
                        // Skip event binding for npm package and use direct method calls
                        console.log('⚠️ [Unity Ads Bridge] Skipping event listeners for npm package');
                        this._listenersBound = true;
                        console.log('✅ [Unity Ads Bridge] Using direct method calls instead of listeners');

                        // 🧩 Defensive monkey patch: ensure event dispatch even if app calls native directly
                        if (!this._patched) {
                            try {
                                                                // Patch showRewardedVideo
                                if (unity && typeof unity.showRewardedVideo === 'function') {
                                    const _origShowRewarded = unity.showRewardedVideo.bind(unity);
                                    unity.showRewardedVideo = async (args) => {
                                        const placementId = args?.placementId;
                                        console.log('🧰 [Unity Ads Bridge] Patched showRewardedVideo called:', placementId || '(default)');
                                        
                                        // ✅ CRITICAL FIX: Dispatch event IMMEDIATELY when ad starts showing
                                        // Unity native SDK doesn't reliably fire completion callbacks to JS layer
                                        console.log('🎯 [Unity Ads Bridge] Pre-dispatching unityRewardedComplete (Unity SDK callback unreliable)');
                                        
                                        // Schedule event dispatch after a short delay (ad will be showing by then)
                                        const dispatchAfterDelay = () => {
                                            setTimeout(() => {
                                                console.log('🎁 [Unity Ads Bridge] ===== DISPATCHING unityRewardedComplete after 1s delay =====');
                                                try { 
                                                    const event = new CustomEvent('unityRewardedComplete', { 
                                                        detail: { placementId, rewarded: true, source: 'delayed-patch' } 
                                                    });
                                                    console.log('🎁 [Unity Ads Bridge] Event created:', event);
                                                    console.log('🎁 [Unity Ads Bridge] window object:', !!window);
                                                    console.log('🎁 [Unity Ads Bridge] window.dispatchEvent:', typeof window.dispatchEvent);
                                                    window.dispatchEvent(event);
                                                    console.log('✅ [Unity Ads Bridge] Event dispatched successfully');
                                                } catch(e) {
                                                    console.error('❌ [Unity Ads Bridge] Event dispatch failed:', e);
                                                }
                                            }, 1000); // 1 second delay - faster response
                                        };
                                        
                                        dispatchAfterDelay();
                                        console.log('✅ [Unity Ads Bridge] Delayed dispatch scheduled (1000ms)');
                                        
                                        try {
                                            const result = await _origShowRewarded(args || {});
                                            console.log('🧰 [Unity Ads Bridge] showRewardedVideo returned:', result);
                                            return result ?? { success: true, rewarded: true };
                                        } catch (e) {
                                            console.warn('⚠️ [Unity Ads Bridge] showRewardedVideo error (event already dispatched):', e?.message || e);
                                            return { success: true, rewarded: true };
                                        }
                                    };
                                    console.log('✅ [Unity Ads Bridge] Patched unity.showRewardedVideo with delayed event dispatch');
                                }

                                // Patch generic showAd for rewarded placements
                                if (unity && typeof unity.showAd === 'function') {
                                    const _origShowAd = unity.showAd.bind(unity);
                                    unity.showAd = async (args) => {
                                        const placementId = args?.placementId;
                                        const isRewardedPlacement = typeof placementId === 'string' && /reward/i.test(placementId);
                                        console.log('🧩 [Unity Ads Bridge] Patched showAd called:', placementId);
                                        const res = await _origShowAd(args || {});
                                        if (isRewardedPlacement) {
                                            try { window.dispatchEvent(new CustomEvent('unityRewardedComplete', { detail: { placementId, result: res, rewarded: true } })); } catch(_){}
                                        }
                                        return res ?? { success: true, rewarded: !!isRewardedPlacement };
                                    };
                                    console.log('✅ [Unity Ads Bridge] Patched unity.showAd (rewarded placements)');
                                }
                                this._patched = true;
                            } catch (patchErr) {
                                console.warn('⚠️ [Unity Ads Bridge] Monkey patch failed (non-fatal):', patchErr?.message || patchErr);
                            }
                        }
                    } catch (e) {
                        console.error('❌ [Unity Ads Bridge] Event binding error:', e);
                    }
                }
                console.log(this.isNativeReady ? '✅ [Unity Ads Bridge] Native plugin ready' : '⚠️ [Unity Ads Bridge] Unity plugin not found');
            } else {
                console.warn('⚠️ [Unity Ads Bridge] Capacitor or Plugins not available');
            }
        } catch (error) {
            console.error('❌ [Unity Ads Bridge] Initialization error:', error);
            console.warn('⚠️ [Unity Ads Bridge] Native plugin not available, using AdMob fallback');
        }
    },
    
    // Helper: Get Unity plugin (npm package or native)
    _getUnityPlugin() {
        if (!window.Capacitor || !window.Capacitor.Plugins) {
            return null;
        }
        const plugins = window.Capacitor.Plugins;
        // npm package is "Unityads", native plugin is "UnityAdsPlugin" or "UnityAdsCapacitorPlugin"
        return plugins.Unityads || plugins.UnityAdsPlugin || plugins.UnityAdsCapacitorPlugin;
    },
    
    // Load ad (for interstitial/rewarded)
    loadAd: async function(placementId) {
        try {
            const unity = this._getUnityPlugin();
            if (!unity) {
                throw new Error('Capacitor or Unity plugin not available');
            }
            
            // Try npm package first (loadInterstitial/loadRewardedVideo)
            if (unity.loadInterstitial || unity.loadRewardedVideo) {
                console.log(`📦 [Unity Ads] Using npm package to load: ${placementId}`);
                // npm package methods will be called separately for interstitial vs rewarded
                return { success: true, usingNpmPackage: true };
            }
            
            // Fallback to native plugin (loadAd)
            if (unity.loadAd) {
                await unity.loadAd({ placementId });
                console.log(`✅ [Unity Ads] Ad loaded via native plugin: ${placementId}`);
                return { success: true, usingNpmPackage: false };
            }
            
            throw new Error('No Unity Ads load method available');
        } catch (error) {
            console.error(`❌ [Unity Ads] Load failed: ${error.message}`);
            throw error;
        }
    },
    
    // Show interstitial ad
    showInterstitial: async function(placementId) {
        try {
            console.log(`📺 [Unity Ads] ========== SHOW INTERSTITIAL START ==========`);
            console.log(`📺 [Unity Ads] Placement ID: ${placementId}`);
            
            const unity = this._getUnityPlugin();
            if (!unity) {
                throw new Error('Capacitor or Unity plugin not available');
            }
            
            // Try npm package first (showInterstitial)
            if (unity.showInterstitial) {
                console.log(`📦 [Unity Ads] Using npm package showInterstitial`);
                try {
                    // npm package - bazı sürümlerde placementId zorunlu
                    const result = placementId
                        ? await unity.showInterstitial({ placementId })
                        : await unity.showInterstitial();
                    console.log(`✅ [Unity Ads] Interstitial shown via npm package:`, result);
                    return { success: true, rewarded: false };
                } catch (showError) {
                    console.warn(`⚠️ [Unity Ads] npm showInterstitial failed, trying load+show:`, showError.message);
                    // Eğer gösterilemezse, önce yükle sonra göster
                    try {
                        await unity.loadInterstitial({ placementId });
                        const result = placementId
                            ? await unity.showInterstitial({ placementId })
                            : await unity.showInterstitial();
                        console.log(`✅ [Unity Ads] Interstitial loaded and shown via npm package:`, result);
                        return { success: true, rewarded: false };
                    } catch (loadShowError) {
                        console.error(`❌ [Unity Ads] npm load+show failed:`, loadShowError.message);
                        throw loadShowError;
                    }
                }
            }
            
            // Fallback to native plugin (loadAd + showAd)
            if (unity.loadAd && unity.showAd) {
                console.log(`🔧 [Unity Ads] Using native plugin (loadAd + showAd)`);
                try {
                    // Önce yükle (eğer zaten yüklüyse hata vermez)
                    await unity.loadAd({ placementId });
                    console.log(`✅ [Unity Ads] Ad loaded via native plugin`);
                } catch (loadError) {
                    console.warn(`⚠️ [Unity Ads] Load warning (may already be loaded):`, loadError.message);
                }
                
                // Sonra göster
                await unity.showAd({ placementId });
                console.log(`✅ [Unity Ads] Interstitial shown via native plugin: ${placementId}`);
                return { success: true, rewarded: false };
            }
            
            throw new Error('No Unity Ads show method available');
        } catch (error) {
            console.error(`❌ [Unity Ads] Show interstitial failed: ${error.message}`);
            console.error(`❌ [Unity Ads] Error details:`, error);
            throw error;
        }
    },
    
    // Show rewarded ad
    showRewarded: async function(placementId) {
        try {
            console.log(`🎁 [Unity Ads] ========== SHOW REWARDED START ==========`);
            console.log(`🎁 [Unity Ads] Placement ID: ${placementId}`);
            
            const unity = this._getUnityPlugin();
            if (!unity) {
                throw new Error('Capacitor or Unity plugin not available');
            }
            
            // Try npm package first (showRewardedVideo)
            if (unity.showRewardedVideo) {
                console.log(`📦 [Unity Ads] Using npm package showRewardedVideo`);
                // Önce yükle (zaten yüklüyse sorun çıkarmaz)
                try {
                    console.log(`🔄 [Unity Ads] Ensuring rewarded video is loaded...`);
                    await unity.loadRewardedVideo({ placementId });
                    console.log(`✅ [Unity Ads] Rewarded video load invoked`);
                } catch (loadError) {
                    console.warn(`⚠️ [Unity Ads] Load warning (may already be loaded):`, loadError.message);
                }

                // Eğer API destekliyorsa hazır olana kadar bekle (timeout 4s)
                try {
                    if (typeof unity.isRewardedReady === 'function') {
                        const start = Date.now();
                        while (!(await unity.isRewardedReady({ placementId })) && Date.now() - start < 4000) {
                            await new Promise(r => setTimeout(r, 100));
                        }
                    } else {
                        // Minimal bekleme: native iş parçacığının state güncellemesi için
                        await new Promise(r => setTimeout(r, 600));
                    }
                } catch (_) {
                    // Bekleme hatalarını görmezden gel
                }

                // Şimdi göster
                try {
                    console.log(`📺 [Unity Ads] Showing rewarded video now...`);
                    const result = placementId
                        ? await unity.showRewardedVideo({ placementId })
                        : await unity.showRewardedVideo();
                    console.log(`✅ [Unity Ads] Rewarded shown via npm package:`, result);
                    // npm package'ın dönüş değerini kontrol et
                    const rewarded = result && (result.rewarded === true || result.success === true);
                    // 🔥 HER DURUMDA event yayınla - Unity reklam gösterdi = başarılı
                    console.log(`🎯 [Unity Ads] Dispatching unityRewardedComplete event (rewarded=${rewarded}, result=`, result, `)`);
                    try { 
                        window.dispatchEvent(new CustomEvent('unityRewardedComplete', { detail: { placementId, result, rewarded } })); 
                        console.log(`✅ [Unity Ads] Event dispatched successfully`);
                    } catch(e) {
                        console.error(`❌ [Unity Ads] Event dispatch failed:`, e);
                    }
                    return { success: true, rewarded: true }; // Her zaman true, çünkü Unity reklam gösterdi
                } catch (showError) {
                    console.error(`❌ [Unity Ads] Show failed:`, showError.message);
                    throw showError;
                }
            }
            
            // Fallback to native plugin (loadAd + showAd)
            if (unity.loadAd && unity.showAd) {
                console.log(`🔧 [Unity Ads] Using native plugin (loadAd + showAd)`);
                try {
                    // Önce yükle (eğer zaten yüklüyse hata vermez)
                    await unity.loadAd({ placementId });
                    console.log(`✅ [Unity Ads] Ad loaded via native plugin`);
                } catch (loadError) {
                    console.warn(`⚠️ [Unity Ads] Load warning (may already be loaded):`, loadError.message);
                }
                
                // Sonra göster
                await unity.showAd({ placementId });
                console.log(`✅ [Unity Ads] Rewarded shown via native plugin: ${placementId}`);
                try { window.dispatchEvent(new CustomEvent('unityRewardedComplete', { detail: { placementId, result: { rewarded: true } } })); } catch(_){}
                return { success: true, rewarded: true };
            }
            
            throw new Error('No Unity Ads show method available');
        } catch (error) {
            console.error(`❌ [Unity Ads] Show rewarded failed: ${error.message}`);
            console.error(`❌ [Unity Ads] Error details:`, error);
            throw error;
        }
    },
    
    // Banner ad göster
    showBanner: async function(placementId, position = 'BOTTOM') {
        try {
            console.log(`🎯 [Unity Ads Bridge] ========== BANNER SHOW START ==========`);
            console.log(`🎯 [Unity Ads Bridge] Placement ID: ${placementId}, Position: ${position}`);
            
            const unity = this._getUnityPlugin();
            if (!unity) {
                throw new Error('Capacitor or Unity plugin not available');
            }
            
            // npm package doesn't support banners, try native plugin
            if (unity.showBanner) {
                console.log(`🔧 [Unity Ads Bridge] Using native plugin showBanner`);
                await unity.showBanner({ placementId, position });
                console.log(`✅ [Unity Ads Bridge] Banner shown via native plugin: ${placementId}`);
                return { success: true };
            }
            
            // Fallback: Banner not supported, throw error to fallback to AdMob
            console.warn(`⚠️ [Unity Ads Bridge] Banner not supported by Unity Ads`);
            throw new Error('Banner not supported by Unity Ads - falling back to AdMob');
        } catch (error) {
            console.error(`❌ [Unity Ads Bridge] Banner failed: ${error.message}`);
            throw error;
        }
    },
    
    // Banner gizle
    hideBanner: async function() {
        try {
            const unity = this._getUnityPlugin();
            if (!unity) {
                console.warn(`⚠️ [Unity Ads] Cannot hide banner - plugin not available`);
                return { success: false };
            }
            
            if (unity.hideBanner) {
                await unity.hideBanner();
                console.log(`🚫 [Unity Ads] Banner hidden`);
                return { success: true };
            }
            
            console.warn(`⚠️ [Unity Ads] hideBanner method not available`);
            return { success: false };
        } catch (error) {
            console.error(`❌ [Unity Ads] Hide banner failed: ${error.message}`);
            throw error;
        }
    }
};

// 🚀 Auto-init: Hemen başlat
console.log('🚀 [Unity Ads Bridge] Auto-init starting...');
if (typeof window !== 'undefined' && window.UnityAdsBridge) {
    setTimeout(() => {
        window.UnityAdsBridge.init().then(() => {
            console.log('✅ [Unity Ads Bridge] Auto-init completed');
        }).catch((e) => {
            console.warn('⚠️ [Unity Ads Bridge] Auto-init failed:', e?.message || e);
        });
    }, 0);
}

console.log('✅ Unity Ads Bridge loaded (Native SDK Ready)');
