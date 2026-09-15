package com.teknova.popgo;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.initialization.InitializationStatus;
import com.google.android.gms.ads.initialization.OnInitializationCompleteListener;
import android.webkit.WebSettings;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Allow media autoplay without user gesture on Android WebView
        try {
            WebSettings settings = this.getBridge().getWebView().getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
        } catch (Exception ignored) {}

        // Initialize Google Mobile Ads SDK (AdMob)
        // Banner/interstitial/rewarded yönetimi JavaScript tarafında (@capacitor-community/admob)
        MobileAds.initialize(this, new OnInitializationCompleteListener() {
            @Override
            public void onInitializationComplete(InitializationStatus initializationStatus) {
                android.util.Log.d("AdMob", "✅ AdMob SDK initialized - Banner managed by JavaScript");
            }
        });
    }

    // ✅ Viewport düzeltmesi - Reklam kapandıktan sonra oyun alanının kaymasını önler
    private void fixViewportAfterAd() {
        long[] delays = {0, 100, 200, 300, 500};

        for (int i = 0; i < delays.length; i++) {
            final int attempt = i + 1;
            final long delay = delays[i];

            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                try {
                    android.webkit.WebView webView = this.getBridge().getWebView();
                    if (webView != null) {
                        webView.scrollTo(0, 0);
                        webView.scrollTo(0, 0); // iki kez (iOS/Android parity)

                        String jsCode =
                            "(function() {" +
                            "window.scrollTo(0, 0);" +
                            "window.scrollTo(0, 0);" +
                            "document.documentElement.scrollTop = 0;" +
                            "document.documentElement.scrollLeft = 0;" +
                            "document.body.scrollTop = 0;" +
                            "document.body.scrollLeft = 0;" +
                            "document.body.style.position = 'fixed';" +
                            "document.body.style.top = '0';" +
                            "document.body.style.left = '0';" +
                            "document.body.style.width = '100%';" +
                            "document.body.style.height = '100%';" +
                            "document.body.style.overflow = 'hidden';" +
                            "document.documentElement.style.position = 'fixed';" +
                            "document.documentElement.style.top = '0';" +
                            "document.documentElement.style.left = '0';" +
                            "document.documentElement.style.overflow = 'hidden';" +
                            // ⚠️ onResize() ÇAĞIRMA - grid koordinatlarını bozar!
                            "if (typeof fixViewportAfterAd === 'function') {" +
                            "  fixViewportAfterAd();" +
                            "} else if (typeof restoreGameStateAfterAd === 'function') {" +
                            "  restoreGameStateAfterAd();" +
                            "}" +
                            "})();";

                        webView.evaluateJavascript(jsCode, null);

                        if (attempt == delays.length) {
                            android.util.Log.d("MainActivity", "✅ [Android] Viewport fixed after ad (attempt " + attempt + ")");
                        }
                    }
                } catch (Exception e) {
                    android.util.Log.w("MainActivity", "⚠️ Viewport fix failed (attempt " + attempt + "): " + e.getMessage());
                }
            }, delay);
        }
    }

    @Override
    public void onResume() {
        super.onResume();

        // ✅ Reklam kapandıktan sonra viewport'u düzelt
        runOnUiThread(() -> {
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(this::fixViewportAfterAd, 100);
        });
    }
}
