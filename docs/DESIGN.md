# Tasarım kimliği

Bu dosya uygulamanın görsel kimliğini tanımlar. Yeni ekran veya bileşen
yazarken buradaki kurallara uyulur; kuralı değiştirmek gerekiyorsa önce bu
dosya güncellenir.

## Tek cümle

**Elyazması almanak:** nötr kâğıt, mürekkep metin, tek kızıl vurgu; gün ışığıyla
açık ve karanlık arasında dönen bir arayüz.

Neden bu: uygulamanın konusu **zaman** (vakitler, geri sayım, günün bölünmesi).
Almanak, zamanı kâğıt üzerinde bölen tarihsel biçim. Seçim dekorasyon değil,
konudan türetilmiş.

## Palet

| Rol | Açık | Koyu | Kullanım |
|---|---|---|---|
| `background` | `#F3F1EB` | `#131519` | Ekran zemini |
| `surface` | `#FCFBF7` | `#1A1D23` | Yükseltilmiş yüzey (nadir) |
| `ink` | `#15171C` | `#EFE9DE` | Birincil metin |
| `inkMuted` | `ink %64` | `ink %62` | İkincil metin — **min 4.5:1** |
| `inkSubtle` | `ink %48` | `ink %38` | Sadece grafik: nokta, çizgi, ikon — min 3:1 |
| `accent` | `#A6382F` | `#E0705E` | Tek vurgu: sıradaki vakit, kerahat, seçili öğe |
| `success` | `#3E6B4F` | `#83AE91` | Sadece "kılındı" durumu |

**Kurallar**

- Tek vurgu rengi. İkinci bir vurgu eklemek yerine tipografi veya boşlukla
  hiyerarşi kur.
- `inkSubtle` metin için kullanılmaz; ölçülen kontrastı küçük metne yetmez.
- "Sıcak krem + pas kızılı" mobilde en yaygın yapay zekâ varsayılanı. Kâğıt tonu
  bilinçli olarak nötr-taş tarafında tutuldu; krem/bej'e kaydırma.
- Kontrast ölçümü: açık `ink` 15.9:1, `inkMuted` 5.2:1, `accent` 5.8:1;
  koyu `inkMuted` 6.4:1, `accent` 5.8:1.

## Tipografi

Ölçek: `theme/tokens.ts` → `typography`.

| Varyant | Aile | Boyut | Kullanım |
|---|---|---|---|
| `display` | Alegreya Bold | 40 | Sadece büyük başlık (gerekirse) |
| `title` | Alegreya SemiBold | 26 | Ekran başlığı, sıradaki vakit |
| `headline` | Alegreya SemiBold | 18 | Vakit adları, liste başlıkları |
| `body` | sistem sans | 15 | Gövde |
| `caption` | sistem sans | 13 | Açıklama |
| `label` | sistem sans | 12 | Küçük etiketler |
| `numeric` | sistem sans, tabular | 46 | Geri sayım |
| `time` | sistem sans, tabular | 17 | Saat değerleri |

- **Serif sadece başlıklarda.** Gövde ve tüm sayılar sans.
- Zaman ve sayı değerleri `tabular-nums`: geri sayım akarken metin zıplamaz.
- Alegreya'nın varsayılan rakamları eski tip (inişli-çıkışlı). Sayısal okuma
gerektiren yerlerde sans kullan.
- Başlıklarda `letterSpacing` negatif (-0.2 … -1.2), gövdede nötr.

## Boşluk, yarıçap, çizgi

- Boşluk ölçeği: 4 / 8 / 12 / 16 / 24 / 32 / 44. Ara değer uydurulmaz.
- Yarıçap: 4 / 8 / 12 / 18 / 26 / tam. Kural: **etkileşimli öğeler 12**,
  **kart 18**, **nokta/rozet tam**. Karışık kullanım yok.
- Gölge yok. Ayrım **saç teli çizgiyle** (1px, `hairline`) ve boşlukla yapılır.
- Kart üstüne kart yok. Liste satırları çizgiyle ayrılır.

## Bileşenler

- `ui/Text` — tek metin bileşeni. Varyant + ton. Ekranlar ham renk/boyut yazmaz.
- `ui/Divider` — 1px saç teli.
- `ui/EmptyState` — boş ekran bırakılmaz; ne olduğunu ve ne yapılacağını söyler.
- `ui/Chip` — seçilebilir etiket (ör. bildirim zamanlaması).
- `features/prayer-times/DayTimeline` — imza bileşen. Günü **dikey ve zamanla
  orantılı** bir eksen olarak gösterir. Yatay şerit denendi ve bırakıldı: altı
  etiket sığmadığı için kaydırılıyordu, bu bilgi taşımayan bir hileydi. Dikey
  eksende sıkışma yok, ayrıca aralıkların gerçek uzunluğu görünüyor.
  Katmanlar: saat çentikleri → kerahat şeritleri → geçen gün → kalan süre
  (vurgu rengi) → vakit düğümleri.
- İkonlar `lucide-react-native`, tek aile, `strokeWidth` 1.7–2.4.

## İlk açılış

Onboarding tek ekrandır. Üç adımlı akış (karşılama → ilçe → bildirim) iki
nedenle bırakıldı: her adım bir "Devam" dokunuşu istiyordu ve ilk ekran
bilgi taşımıyordu.

- **Bekleme yok.** GPS kendiliğinden denenir ama beklenmez; "İlçeyi kendim
  seçeceğim" her an açık. Bildirim izni "Başla"yı bloklamaz — diyalog JS'ten
  bağımsız ekranda kalır, geçiş hemen yapılır.
- **Kanıt, soru değil.** Seçim yapılır yapılmaz o ilçenin bugünkü altı vakti
  saç teli satırlarla listelenir, sıradaki vakit vurgu renginde. Kullanıcı
  kurulumu bitirmeden ürünün çıktısını görür.
- **Tek satır dilbilgisi.** "İSTANBUL · Değiştir" aynı hizada; seçim değişikliği
  ayrı bir düğme değil.

## Hareket

- Sadece `transform` ve `opacity`.
- Giriş: 180–220 ms. Modal 180 ms ölçek + opaklık.
- Sürekli/sonsuz animasyon yok. Hareket bilgi taşımıyorsa eklenmez.

## Metin

- Türkçe cümle düzeni: "İyi günler", "Namazdayım modu". Her kelimeyi büyütmek yok.
- Ekranlarda geliştirici bilgisi (koordinat, sürüm, hata kodu) gösterilmez.
- Emoji kullanılmaz; yerine ikon.
- Ton: sakin, kısa, buyurmayan.

## Sevk öncesi kontrol

1. Yeni bir renk/boyut ekledin mi? → `tokens.ts` / `palette.ts`'e ekle, ekrana yazma.
2. Küçük metin `inkSubtle` mı? → `inkMuted` olmalı.
3. Aynı hizada iki vurgu rengi var mı? → tek vurgu.
4. Boş/hata/yükleniyor durumları var mı?
5. Türkçe büyük harf kuralına uyuyor mu?
6. Açık ve koyu temada ayrı ayrı baktın mı?
7. Dokunma hedefi ≥ 44dp mi?

## Bilinen eksikler

- Azaltılmış hareket (`prefers-reduced-motion` / Android animasyon ölçeği)
  henüz dinlenmiyor.
- Yükleme durumu iskelet değil, dönen gösterge.
- Kıble ekranında kadranın altında kalan boşluk, ekran boyuna göre
  dengelenmiyor; küçük ekranlarda sıkışabilir.
