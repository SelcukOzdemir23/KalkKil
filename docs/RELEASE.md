# Yayın

Uygulama mağazaya yüklenmiyor: imzalı APK GitHub Releases üzerinden yayınlanır.

## Neden keystore şart

Android, bir uygulamanın güncellemesini ancak **aynı anahtarla** imzalanmışsa
kurar. Anahtarı kaybedersen kullanıcılar yeni sürümü eski sürümün üzerine
kuramaz, uygulamayı silip yeniden kurmak zorunda kalır. Bu yüzden:

- Keystore'u bir kez üret ve **yedekle** (parola dahil).
- Keystore ve parolaları **asla** repoya koyma; `.gitignore` `*.keystore` tutuyor.

## 1. Keystore üret

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore kalkkil-release.keystore \
  -alias kalkkil \
  -keyalg RSA -keysize 2048 -validity 10000
```

## 2. GitHub'a secret olarak ekle

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Değer |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w 0 kalkkil-release.keystore` çıktısı |
| `ANDROID_KEYSTORE_PASSWORD` | keystore parolası |
| `ANDROID_KEY_ALIAS` | `kalkkil` |
| `ANDROID_KEY_PASSWORD` | anahtar parolası |

## 3. Yayınla

```bash
git tag v1.0.0
git push origin v1.0.0
```

Etiket `v*` kalıbına uyduğunda `.github/workflows/release.yml` çalışır:

1. `npm ci` + Android SDK bileşenleri
2. Keystore'u secret'tan çözer
3. Sürümü etiketten türetir (`v1.2.3` → `versionName 1.2.3`, `versionCode 10203`)
4. `assembleRelease`
5. **İmza doğrulaması**: APK hâlâ `CN=Android Debug` ile imzalıysa build kırılır
6. APK'yı taslak (draft) bir GitHub Release'e ekler

Taslak release'i gözden geçirip yayımla. `komi-store` gibi bir dağıtım
yerleşimi APK'yı release asset'inden indirebilir.

> `versionCode` her yayında artmak zorunda. Etiket adını buna göre seç
> (`v1.0.1` → 10001).

## Yerelde imzalı APK

```bash
cd android
ANDROID_KEYSTORE_PATH=/mutlak/yol/kalkkil-release.keystore \
ANDROID_KEYSTORE_PASSWORD=... \
ANDROID_KEY_ALIAS=kalkkil \
ANDROID_KEY_PASSWORD=... \
./gradlew assembleRelease
```

Ortam değişkenleri verilmezse release build **debug anahtarıyla** imzalanır.
Bu yalnızca geliştirme içindir; yayın akışı bu durumu yakalar.

## Doğrulama

```bash
cd android && ./gradlew assembleDebug
npm run typecheck && npm run lint -- --quiet && npm test
```
