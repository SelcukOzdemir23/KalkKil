# Tasarım kimliği

Bu dosya uygulamanın görsel kimliğini tanımlar. Yeni ekran veya bileşen
yazarken buradaki kurallara uyulur; kuralı değiştirmek gerekiyorsa önce bu
dosya güncellenir.

## Tek cümle

**Ölçü aleti:** soğuk taş-yeşil zemin, mürekkep metin, tek çini yeşili vurgu;
grotesk başlık, mono sayı.

Neden bu: uygulamanın işi **günü ölçmek** — vakitler, geri sayım, günün
bölünmesi. Arayüz de bir alet gibi davranıyor: ölçekli eksen, mono sayılar,
keskin köşeler, süs yok.

Önceki yön "elyazması almanak"tı (krem kâğıt + serif + kızıl). Bırakıldı:
**krem zemin + yüksek kontrastlı serif + toprak/kiremit vurgu**, mobil
tasarımda en sık üretilen varsayılan; uygulamayı jenerik gösteriyordu.

## Palet

| Rol | Açık | Koyu | Kullanım |
|---|---|---|---|
| `background` | `#E6E8E1` | `#0B1211` | Ekran zemini — soğuk, yeşile çalan taş |
| `surface` | `#EFF1EB` | `#111A18` | Yükseltilmiş yüzey (nadir) |
| `ink` | `#101C19` | `#E3E6DD` | Birincil metin |
| `inkMuted` | `ink %66` | `ink %64` | İkincil metin — **min 4.5:1** |
| `inkSubtle` | `ink %56` | `ink %50` | Sadece grafik: çentik, çizgi — min 3:1 |
| `accent` | `#186A5E` | `#55B9A7` | Tek vurgu: sıradaki vakit, kerahat, seçili öğe |
| `success` | `#2F6B45` | `#7FBF98` | Sadece "kılındı" durumu |

**Kurallar**

- Tek vurgu rengi. İkinci bir vurgu eklemek yerine tipografi veya boşlukla
  hiyerarşi kur.
- Vurgu **çini yeşili**: İznik çinisi geleneğinden, kültürel olarak yerli ama
  turuncu/kiremit ailesinden değil. Paleti değiştirirken krem-bej ya da
  "koyu lacivert + turuncu" tarafına kaydırma; ikisi de aşınmış.
- `inkSubtle` metin için kullanılmaz; kontrastı küçük metne yetmez.
- Ölçülen kontrast (açık / koyu): `ink` 14.1 / 15.0, `accent` 5.2 / 8.0,
  `inkMuted` 5.2 / 6.6, `inkSubtle` 3.8 / 4.4.
- Köşe yarıçapı **keskin**: 2–8 px. Etkileşimli öğeler `radius.md` (4).
  Kart ve butonda yuvarlak köşe yok; daire yalnızca pusula gibi gerçekten
  dairesel öğelerde.

## Tipografi

Ölçek: `theme/tokens.ts` → `typography`.

| Varyant | Aile | Boyut | Kullanım |
|---|---|---|---|
| `display` | Archivo Bold | 44 | Nadir büyük başlık |
| `title` | Archivo SemiBold | 25 | Ekran başlığı, sıradaki vakit |
| `headline` | Archivo SemiBold | 17 | Vakit adları, liste başlıkları |
| `body` | Archivo Regular | 15 | Gövde |
| `caption` | Archivo Regular | 13 | Açıklama |
| `label` | IBM Plex Mono Medium | 10.5 | Küçük etiketler; **büyük harfe çevrilir** |
| `numeric` | IBM Plex Mono Medium | 48 | Geri sayım |
| `measure` | IBM Plex Mono Medium | 34 | Derece gibi tek ölçüm |
| `time` | IBM Plex Mono Medium | 15 | Saat değerleri |

- **İki aile, iki iş.** Archivo (grotesk) başlık ve gövde; IBM Plex Mono her
  sayı ve etiket. Serif yok.
- Sayılar mono olduğu için alt alta gelen saatler aynı genişlikte durur ve geri
  sayım akarken metin zıplamaz.
- **`fontVariant: ['tabular-nums']` kullanılmaz.** Android'de bu özellik metni
  varsayılan sistem fontuna düşürüyor; sayılar mono yerine Archivo'da çiziliyor.
  Mono font zaten sabit genişlikte, ek ayar gerekmiyor.
- `label` `textTransform: 'uppercase'` taşır: küçük plastik etiket görünümü.
  Cümle uzunluğundaki metin için kullanılmaz.
- Başlıklarda `letterSpacing` negatif (-0.25 … -1.9), gövdede nötr.

## Boşluk, yarıçap, çizgi

- Boşluk ölçeği: 4 / 8 / 12 / 16 / 24 / 32 / 44. Ara değer uydurulmaz.
- Yarıçap: 2 / 3 / 4 / 6 / 8 / tam. Kural: **etkileşimli öğeler 4**, rozet ve
  gerçekten dairesel öğeler tam. Karışık kullanım yok.
- Gölge yok. Ayrım **saç teli çizgiyle** (1px, `hairline`) ve boşlukla yapılır.
- Kart üstüne kart yok. Liste satırları çizgiyle ayrılır.
- Düğüm ve işaretler **kare**; yuvarlak nokta kullanılmaz (pusula çemberi hariç).

## Gezinme

Alt gezinme ikonsuz: üç sütun metin. Seçili sekme vurgu renginde ve üstünde
2px vurgu çizgisi var. Üç ikon, birbirinden ayrılması zor süslerdi; yerine geçen
etiketler aletin diğer etiketleriyle aynı dili konuşuyor (mono, büyük harf).

## Bileşenler

- `ui/Text` — tek metin bileşeni. Varyant + ton. Ekranlar ham renk/boyut yazmaz.
- `ui/Divider` — 1px saç teli.
- `ui/EmptyState` — boş ekran bırakılmaz; ne olduğunu ve ne yapılacağını söyler.
- `ui/Chip` — seçilebilir etiket (ör. bildirim zamanlaması).
- `features/prayer-times/DayTimeline` — imza bileşen. Günü **dikey ve zamanla
  orantılı** bir eksen olarak gösterir. Yatay şerit denendi ve bırakıldı: altı
  etiket sığmadığı için kaydırılıyordu, bu bilgi taşımayan bir hileydi. Dikey
  eksende sıkışma yok, ayrıca aralıkların gerçek uzunluğu görünüyor.
  Katmanlar: saat çentikleri (çift saatler mono numaralı) → kerahat şeritleri →
  geçen gün → kalan süre (vurgu rengi) → vakit düğümleri.

  Numarasız çentikler süs gibi duruyordu; saat numarası eklenince eksen gerçek
  bir cetvel oldu ve "aradaki boşluk ne kadar" sorusu okunabilir hale geldi.
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
