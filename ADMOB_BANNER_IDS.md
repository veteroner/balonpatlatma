# 📊 Google AdMob Banner Test vs Production ID'leri

## 🧪 **Test Banner ID (Google Resmi Dokümantasyonu)**
```
ca-app-pub-3940256099942544/9214589741
```

## 🎯 **Production Banner ID (Platform-Specific)**

### iOS Banner ID:
```
ca-app-pub-7610338885240453/2144790251
```

### Android Banner ID:
```
ca-app-pub-7610338885240453/1211356264
```

## ⚠️ **Önemli Not:**
- Geliştirme sırasında: Test ID kullanın
- Canlı uygulamada: Production ID kullanın
- Test ID kullanmadan canlıya almayın!

## 🔄 **ID Değiştirme:**

### Test Modu İçin:
```javascript
adId: 'ca-app-pub-3940256099942544/9214589741'
isTesting: true
```

### Production Modu İçin:
```javascript
// iOS
adId: 'ca-app-pub-7610338885240453/2144790251'
isTesting: false

// Android  
adId: 'ca-app-pub-7610338885240453/1211356264'
isTesting: false
```
