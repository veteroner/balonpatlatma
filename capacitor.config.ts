import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.popgo.game',
  appName: 'PopGo',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 500, // Kısa ama görünür olacak kadar
      launchAutoHide: true,    
      backgroundColor: "#f0f4ff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,      
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: false,
      layoutName: "launch_screen",
      useDialog: false, // Dialog kullanma, direkt splash göster
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0d21',
      overlaysWebView: false // Web view'in üstüne çıkmasın - reklamlar için önemli
    },
    Haptics: {},
    App: {},
    // 🔔 Günlük hatırlatmalar (popgo-push.js). Uygulama açıkken gelen bildirim
    // de gösterilsin; aksi hâlde iOS ön plandaki bildirimi sessizce yutar.
    FirebaseMessaging: {
      presentationOptions: ['alert', 'sound']
    },
    AdMob: {
      applicationId: 'ca-app-pub-7610338885240453~1290039433', // iOS App ID
      androidApplicationId: 'ca-app-pub-7610338885240453~4318740068', // YENİ Android App ID
      testingDevices: [],
      initializeForTesting: false, // PRODUCTION MODE - false
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
      maxAdContentRating: 'PG',
      requestTrackingAuthorization: true
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: 'never', // 'automatic' causes layout delays
    scrollEnabled: true,   // false blocks some touch events - BAD for gaming
    allowsLinkPreview: false, // Disable 3D Touch link preview for performance
    limitsNavigationsToAppBoundDomains: false, // Don't restrict navigation
    // ⚡️ CRITICAL: Enable media autoplay for audio/video (Android parity)
    // Native WebView settings applied in AppDelegate.swift
    preferredContentMode: 'mobile'
  }
};

export default config;
