# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# ============================================================================
# R8 / ProGuard kuralları — minifyEnabled açıldığı için ZORUNLU
#
# Capacitor eklentileri (@CapacitorPlugin) ve @PluginMethod metotları
# JS köprüsünden REFLECTION ile çağrılır. R8 bunları "kullanılmıyor" sanıp
# siler veya yeniden adlandırırsa uygulama açılır ama hiçbir native çağrı
# (AdMob, Haptics, StatusBar, SplashScreen...) çalışmaz.
# ============================================================================

# --- Capacitor çekirdek + resmi/topluluk eklentileri ---
-keep public class com.getcapacitor.** { *; }
-keep public class com.capacitorjs.** { *; }
-keep public class com.getcapacitor.community.** { *; }
-keep public class com.teknova.popgo.** { *; }

# Eklenti sınıfları ve köprüden çağrılan metotlar
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.annotation.Permission <methods>;
    @com.getcapacitor.PluginMethod public <methods>;
}
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public <methods>;
}

# --- WebView <-> JS köprüsü ---
-keepattributes *Annotation*, JavascriptInterface, Signature, InnerClasses, EnclosingMethod
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- Google Mobile Ads (AdMob) ---
# Play Services kendi consumer kurallarını getirir; mediation adaptörleri
# reflection ile yüklendiği için yine de açıkça korunur.
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.common.** { *; }
-dontwarn com.google.android.gms.**

# --- Cordova eklenti köprüsü (capacitor-cordova-android-plugins) ---
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# --- Yararlı: kaynak/satır bilgisi (Play Console kilitlenme raporları okunur kalsın) ---
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
