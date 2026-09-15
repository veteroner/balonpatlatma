import UIKit
import Capacitor
import AppTrackingTransparency
import AdSupport
import GoogleMobileAds
import WebKit
import FirebaseCore

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.

        // 📊 Firebase — her şeyden önce yapılandırılmalı. Bu çağrı olmadan
        // Analytics olayları (first_open dahil) hiç gönderilmez ve Google Ads
        // kampanyası kurulumları ilişkilendiremez.
        // GoogleService-Info.plist App hedefinde "Copy Bundle Resources" içinde olmalı.
        FirebaseApp.configure()
        print("✅ FirebaseApp.configure() çağrıldı")

        
        // ⚡️ CRITICAL: WKWebView Performance Optimizations for Gaming
        configureWebViewForPerformance()
        
        // ⚡️ CRITICAL: Hook into Capacitor's WebView creation
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            self.applyWebViewSettings()
        }
        
        // Initialize Google Mobile Ads SDK - PRODUCTION MODE
        // No test devices - using real ads
        
        MobileAds.shared.start(completionHandler: { _ in
            print("✅ MobileAds.start() completed successfully (PRODUCTION MODE)")
        })
        print("✅ MobileAds.start() called in AppDelegate (PRODUCTION MODE - Real Ads)")

        // ATT permission request DISABLED - causes repeated dialogs
        // Comment out to prevent multiple ATT prompts
        // DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
        //     self.requestATTPermission()
        // }
        
        return true
    }
    
    // ⚡️ Apply WebView settings after Capacitor creates the WebView
    func applyWebViewSettings() {
        guard let window = self.window,
              let rootViewController = window.rootViewController else {
            print("⚠️ Could not find root view controller")
            return
        }
        
        // Find the WKWebView in the view hierarchy
        findAndConfigureWebView(in: rootViewController.view)
    }
    
    func findAndConfigureWebView(in view: UIView) {
        if let webView = view as? WKWebView {
            print("✅ Found WKWebView, applying performance settings...")
            
            // ⚡️ CRITICAL: Disable scroll delays for instant touch response
            webView.scrollView.delaysContentTouches = false
            // Game is full-screen canvas, prevent scroll/overscroll bounce
            webView.scrollView.isScrollEnabled = false
            webView.scrollView.bounces = false
            webView.scrollView.alwaysBounceVertical = false
            webView.scrollView.alwaysBounceHorizontal = false
            webView.scrollView.showsVerticalScrollIndicator = false
            webView.scrollView.showsHorizontalScrollIndicator = false
            
            // ⚡️ CRITICAL: Disable content inset for full-screen gaming
            if #available(iOS 11.0, *) {
                webView.scrollView.contentInsetAdjustmentBehavior = .never
            }
            webView.scrollView.contentInset = .zero
            webView.scrollView.scrollIndicatorInsets = .zero
            // Ensure we are at the very top-left to avoid visual shift
            webView.scrollView.setContentOffset(.zero, animated: false)
            
            // ⚡️ Enable hardware acceleration
            webView.isOpaque = false
            webView.backgroundColor = .clear
            
            print("✅ WebView settings applied successfully")
            print("   - delaysContentTouches: false")
            print("   - contentInsetAdjustmentBehavior: never")
            print("   - isScrollEnabled: false, bounces: false, insets: zero")
            print("   - Hardware acceleration: enabled")
            return
        }
        
        // Recursively search child views
        for subview in view.subviews {
            findAndConfigureWebView(in: subview)
        }
    }
    
    // ⚡️ WebView Performance Configuration - FIXES iOS LAG
    func configureWebViewForPerformance() {
        // Configure WKWebView defaults BEFORE Capacitor creates its instance
        let configuration = WKWebViewConfiguration()
        
        // ⚡️ CRITICAL: Enable media autoplay (Android parity)
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = [] // No user action required
        
        // ⚡️ CRITICAL: Enable hardware acceleration
        configuration.allowsAirPlayForMediaPlayback = true
        
        // ⚡️ Performance optimizations
        configuration.suppressesIncrementalRendering = false // Allow progressive rendering
        
        if #available(iOS 14.0, *) {
            // Upgrade to modern rendering engine
            configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        }
        
        // Store for later use (Capacitor will read from UserDefaults)
        UserDefaults.standard.set(true, forKey: "mediaAutoplayEnabled")
        UserDefaults.standard.synchronize()
        
        print("✅ WebView performance optimization loaded")
        print("✅ Media autoplay ENABLED (no user gesture required)")
        print("✅ Hardware acceleration ACTIVE")
        print("✅ Inline media playback ENABLED")
        
        // Additional memory optimization
        URLCache.shared.memoryCapacity = 50 * 1024 * 1024 // 50 MB
        URLCache.shared.diskCapacity = 100 * 1024 * 1024 // 100 MB
    }
    
    func requestATTPermission() {
        if #available(iOS 14, *) {
            let status = ATTrackingManager.trackingAuthorizationStatus
            print("🔍 ATT Status at launch: \(status.rawValue)")
            
            // Apple requirement: Only request when app is active
            guard UIApplication.shared.applicationState == .active else {
                print("⚠️ ATT: App not active, waiting for active state")
                return
            }
            
            if status == .notDetermined {
                print("🚀 Requesting ATT permission from native iOS...")
                print("📱 App State: \(UIApplication.shared.applicationState.rawValue)")
                
                ATTrackingManager.requestTrackingAuthorization { status in
                    DispatchQueue.main.async {
                        print("✅ ATT Permission result: \(status.rawValue)")
                        switch status {
                        case .authorized:
                            print("✅ ATT: User authorized tracking")
                        case .denied:
                            print("❌ ATT: User denied tracking")
                        case .restricted:
                            print("⚠️ ATT: Tracking restricted")
                        case .notDetermined:
                            print("❓ ATT: Still not determined")
                        @unknown default:
                            print("❓ ATT: Unknown status")
                        }
                    }
                }
            } else {
                print("ℹ️ ATT: Already determined with status \(status.rawValue)")
            }
        } else {
            print("⚠️ ATT: iOS version < 14, ATT not available")
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
        
        // ATT permission request - Required by Apple Review
        // Apple requirement: ATT request only works when app is active
        if #available(iOS 14, *) {
            let status = ATTrackingManager.trackingAuthorizationStatus
            if status == .notDetermined {
                print("🔄 App became active, requesting ATT permission")
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    self.requestATTPermission()
                }
            }
        }

        // ✅ FIX: After returning from full-screen ads (interstitial/rewarded), some iOS builds shift content.
        // Re-apply scroll lock and reset position to top-left.
        // This fixes the viewport shift issue after AdMob ads close.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            self.applyWebViewSettings()
            // Additional fix: Force scroll to top and reset content offset
            self.fixViewportAfterAd()
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
    
    // ✅ AGGRESSIVE FIX: Viewport düzeltmesi - Reklam kapandıktan sonra oyun alanının kaymasını önler
    func fixViewportAfterAd() {
        guard let window = self.window,
              let rootViewController = window.rootViewController else {
            return
        }
        
        // Birden fazla kez kontrol et (reklam animasyonu tamamlanana kadar)
        let delays: [TimeInterval] = [0, 0.1, 0.2, 0.3, 0.5]
        
        for (index, delay) in delays.enumerated() {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                self.findAndFixWebViewScroll(in: rootViewController.view, attempt: index + 1)
            }
        }
    }
    
    func findAndFixWebViewScroll(in view: UIView, attempt: Int = 1) {
        if let webView = view as? WKWebView {
            // Scroll pozisyonunu agresif şekilde sıfırla
            webView.scrollView.setContentOffset(.zero, animated: false)
            webView.scrollView.contentInset = .zero
            webView.scrollView.scrollIndicatorInsets = .zero
            webView.scrollView.contentOffset = .zero
            
            // iOS 11+ için contentInsetAdjustmentBehavior
            if #available(iOS 11.0, *) {
                webView.scrollView.contentInsetAdjustmentBehavior = .never
            }
            
            // JavaScript ile de scroll pozisyonunu sıfırla ve viewport'u düzelt
            // ⚠️ CRITICAL: onResize() ÇAĞIRMA - grid koordinatlarını bozar!
            // Sadece scroll ve stil düzelt, restoreGameStateAfterAd() grid değerlerini geri yükler
            webView.evaluateJavaScript("""
                (function() {
                    // 🔥 CRITICAL: Viewport meta tag'ı zorla yeniden ayarla - zoom/scale sorunlarını düzeltir
                    var viewport = document.querySelector('meta[name="viewport"]');
                    if (viewport) {
                        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
                    }
                    
                    window.scrollTo(0, 0);
                    window.scrollTo(0, 0); // İki kez çağır (iOS için)
                    document.documentElement.scrollTop = 0;
                    document.documentElement.scrollLeft = 0;
                    document.body.scrollTop = 0;
                    document.body.scrollLeft = 0;
                    document.body.style.position = 'fixed';
                    document.body.style.top = '0';
                    document.body.style.left = '0';
                    document.body.style.width = '100%';
                    document.body.style.height = '100%';
                    document.body.style.overflow = 'hidden';
                    document.documentElement.style.position = 'fixed';
                    document.documentElement.style.top = '0';
                    document.documentElement.style.left = '0';
                    document.documentElement.style.overflow = 'hidden';
                    // SADECE restoreGameStateAfterAd çağır - onResize DEĞİL!
                    if (typeof restoreGameStateAfterAd === 'function') {
                        restoreGameStateAfterAd();
                    } else if (typeof fixViewportAfterAd === 'function') {
                        fixViewportAfterAd();
                    }
                    // onResize() ÇAĞIRMA - grid koordinatlarını hesaplar ve mevcut balonları bozar!
                })();
            """, completionHandler: { result, error in
                if let error = error {
                    print("⚠️ [iOS] JavaScript viewport fix error: \(error.localizedDescription)")
                } else {
                    print("✅ [iOS] Viewport fixed after ad (attempt \(attempt)) - restoreGameStateAfterAd called")
                }
            })
            
            return
        }
        
        // Recursively search child views
        for subview in view.subviews {
            findAndFixWebViewScroll(in: subview, attempt: attempt)
        }
    }
    
    // MARK: - UIScene Lifecycle Support (iOS 13+)
    // Note: UIScene lifecycle adoption is optional for now but will be required in the future
    // For now, we acknowledge the warning and continue using the traditional AppDelegate pattern
    // which works perfectly for Capacitor apps

}
